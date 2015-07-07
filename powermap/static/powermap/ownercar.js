'use strict';

var map = require('./map');

if (isAuth) {

  var UserCar = function(map, dataSource, active, dataInterval) {
    this.map = map;
    this.dataSource = dataSource;
    this.car = {
      id: null,
      marker: null
    };
    this.selectNext = {
      marker: null,
      line: null
    };
    this.staticNext = {
      marker: null,
      line: null
    };
    this.active = active;
    this.dataInterval = dataInterval;
  };

  UserCar.prototype.getInitialData = function() {
    var self = this;
    $.get(this.dataSource, function(data) {

      // Get the id of the users car, and create a marker for the userCar.
      var coords = data.car_data.geometry.coordinates;
      self.car.id = data.car_data.id;
      self.car.marker = L.marker(
        new L.LatLng(coords[1], coords[0]), {
          icon: L.mapbox.marker.icon({
            'marker-symbol': 'car',
            'marker-size': 'large',
            'marker-color': '#0044ff'
          }),
          zIndexOffset: 1000
      }).addTo(self.map.map);

      // Get marker location and next location coordinates.
      var startLocation = self.car.marker.getLatLng();
      var endLat = data.car_data.properties.next_location.coordinates[0];
      var endLng = data.car_data.properties.next_location.coordinates[1];


      // Create a marker for selecting the next location.
      self.selectNext.marker = L.marker(
        new L.LatLng(endLng, endLat), {
          icon: L.mapbox.marker.icon({
            'marker-symbol': 'marker-stroked',
            'marker-size': 'large',
            'marker-color': '#0044FF'
          }),
          draggable: true,
          zIndexOffset: 1000,
        }
      ).addTo(self.map.map);

      // jQuery that handles form submit when the marker-form-popup is opened
      self.selectNext.marker.on('popupopen', function() {
        $("#nextLocation-form").on('submit', function(e) {
          e.preventDefault();
          var serialData = $("#nextLocation-form").serializeArray();
          var csrftoken = $.cookie('csrftoken');
          var newLocation = self.selectNext.marker.getLatLng();
          var postData = {
            "lat": newLocation.lat,
            "lng": newLocation.lng,
            "arrival_time": serialData[1].value,
            "stay_time": serialData[2].value,
            "csrfmiddlewaretoken": csrftoken,
          };

          // Post serialized data to the server
          $.post(
            "/powercars/" + self.car.id + "/change_next_location/",
            postData
          ).done(function(data) {
            console.log(data);
            console.log("Success changing next location");
            self.selectNext.marker.closePopup();
            self.staticNext.marker.setLatLng(newLocation);
            self.staticNext.line.spliceLatLngs(1, 1, newLocation);
          })
          .fail(function(data) {
            console.log("Failure");
          });

        });
      });

      // Create a static marker on the next location.
      self.staticNext.marker = L.marker(
        new L.LatLng(endLng, endLat), {
          icon: L.mapbox.marker.icon({
            'marker-symbol': 'cross',
            'marker-size': 'medium',
            'marker-color': '#B8B8B8'
          }),
          zIndexOffset: 500
        }
      ).addTo(self.map.map);

      // Create an array containing the start and end of a line, so that
      // we can draw a line on the map pointing from the current location to
      // the currnet next location.
      var endOfLine = self.selectNext.marker.getLatLng();
      var latlngs = [startLocation, endOfLine];

      // Create a line from the car to the selectNext marker.
      self.selectNext.line = L.polyline(
        latlngs,
        {color: 'blue'}
      ).addTo(self.map.map);

      // Create a static marker for the next location.
      self.selectNext.marker.on('drag', function(e) {
        var dragLocation = self.selectNext.marker.getLatLng();
        self.selectNext.line.spliceLatLngs(1, 1, dragLocation);
      });

      // Create a line to the static marker.
      self.staticNext.line = L.polyline(
        latlngs,
        {color: 'grey'}
      ).addTo(self.map.map);


      $('#set_active').click(function() {
        var csrftoken = $.cookie('csrftoken');
        var postData = {
          'csrfmiddlewaretoken': csrftoken
        };
        var postURL = "/pttp/cars/" + self.car.id + "/set_active/";
        $.post(postURL, postData, function(response) {
          if (response.state) {
            $("#set_active").html("Deactivate");
          } else {
            $("#set_active").html("Activate");
          }
        });
      });

      $('#change_next').click(function(callback) {
        $.get("/pttp/next_location_popup/", function(data) {
          self.selectNext.marker.bindPopup(data);
          self.selectNext.marker.openPopup();
          $('.dateTimeField').datetimepicker({
            format: 'YY-MM-DD HH:mm',
            minDate: moment()
          });
        });
      });

      self.updateData();
    });
  };


  // Update the data obtained through getInitialData
  UserCar.prototype.updateData = function() {
    var self = this;

    navigator.geolocation.getCurrentPosition(function(position) {
      var csrftoken = $.cookie('csrftoken');
      var postData = {
        'lat': position.coords.latitude,
        'lng': position.coords.longitude,
        'csrfmiddlewaretoken': csrftoken,
      };
      var postURL = "/pttp/cars/" + self.car.id + "/update_current_location/";
      $.post(postURL, postData, function(response) {
        $.get(self.dataSource, function(data) {
          console.log(data);
          var newPostion = data.car_data.geometry.coordinates;
          var newNext = data.car_data.properties.next_location.coordinates;
          self.car.marker.setLatLng([newPostion[1], newPostion[0]]);
          self.staticNext.marker.setLatLng([newNext[1], newNext[0]]);
          self.staticNext.line.spliceLatLngs(1, 1, [newNext[1], newNext[0]]);
          newPostion = self.car.marker.getLatLng();
          self.selectNext.line.spliceLatLngs(0, 1, newPostion);
          self.staticNext.line.spliceLatLngs(0, 1, newPostion);
          setTimeout(function() {
            self.updateData(); 
          }, self.dataInterval * 1000);
        });
      });
    });
  };

  var userMapTest = new UserCar(
    map,
    "/powercars/get_user_car/",
    isActive,
    5
  );

  userMapTest.getInitialData();

  module.exports = userMapTest;

}
