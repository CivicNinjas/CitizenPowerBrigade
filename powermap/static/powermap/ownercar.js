'use strict';

var mapFile = require('./map');

if (isAuth) {

  var info = {
    userCarID: null,
    userCar: null,
    selectNextLocationM: null,
    selectNextLocationL: null,
    staticNextLocationM: null,
    staticNextLocationL: null,
    getData: null
  };



  var getData = (function(callback) {
    $.get("/powercars/get_user_car/", function(data) {
      var coords = data.car_data.geometry.coordinates;

      info.userCar = L.marker(new L.LatLng(coords[1], coords[0]), {
        icon: L.mapbox.marker.icon({
          'marker-symbol': 'car',
          'marker-size': 'large',
          'marker-color': '#0044ff'
        }),
        zIndexOffset: 1000
      });
      info.userCar.addTo(mapFile.map);

      info.userCarID = data.car_data.id;
      var fc = info.userCar.getLatLng();
      var soon_marker = data.car_data.properties.next_location;
      var lat_second = soon_marker.coordinates[0];
      var lng_second = soon_marker.coordinates[1];

      info.selectNextLocationM = L.marker(new L.LatLng(lng_second, lat_second), {
        icon: L.mapbox.marker.icon({
          'marker-symbol': 'marker-stroked',
          'marker-size': 'large',
          'marker-color': '#0044ff'
        }),
        draggable: true,
        zIndexOffset: 1000
      });
        info.selectNextLocationM.addTo(mapFile.map);
        info.selectNextLocationM.on('popupopen', function() {
          $("#nextLocation-form").on('submit', function(e){
            e.preventDefault();
            var serial_data = $("#nextLocation-form").serializeArray();
            console.log(serial_data);
            var csrftoken = $.cookie('csrftoken');
            var loc = info.selectNextLocationM.getLatLng();
            var new_post_data = {
              'lat': loc.lat,
              'lng': loc.lng,
              'arrival_time': serial_data[1].value,
              'stay_time': serial_data[2].value,
              'csrfmiddlewaretoken': csrftoken,
            };
            console.log(new_post_data);
            $.post("/pttp/next_location_popup/", new_post_data)
            .done(function(data) {
              console.log("Success");
              console.log(data);
              info.selectNextLocationM.closePopup();
              info.staticNextLocationM.setLatLng(loc);
              info.staticNextLocationL.spliceLatLngs(1, 1, loc);
            })
            .fail(function(data){
              console.log("Failure");
            });
            return false;
          });
        });

      info.staticNextLocationM = L.marker(new L.LatLng(lng_second, lat_second), {
        icon: L.mapbox.marker.icon({
          'marker-symbol': 'cross',
          'marker-size': 'medium',
          'marker-color': '#b8b8b8'
        }),
        zIndexOffset: 500
      });
      info.staticNextLocationM.addTo(mapFile.map);

      var c = info.selectNextLocationM.getLatLng();
      var latlngs = [fc, c]
      info.selectNextLocationL = L.polyline(latlngs, {color: 'blue'}).addTo(mapFile.map);
      info.staticNextLocationL = L.polyline(latlngs, {color: 'grey'}).addTo(mapFile.map);

      callback();
    });
  });

  var getDataCallback = (function() {
    info.selectNextLocationM.on('drag', function(e){
      var loc = info.selectNextLocationM.getLatLng();
      info.selectNextLocationL.spliceLatLngs(1, 1, loc);
    });

    $('#set_active').html()

    $('#set_active').click(function() {
      var csrftoken = $.cookie('csrftoken');
      var post_data = {
        'csrfmiddlewaretoken': csrftoken
      }
      var post_url = "/pttp/cars/" + info.userCarID + "/set_active/";
      $.post(post_url, post_data, function(response) {
        if (response.state) {
          $("#set_active").html("Deactivate");
        } else {
          $("#set_active").html("Activate");
        };
      });
    });

    setTimeout(updateLooper, 5000);
  });


  var updateLooper = (function() {
    $.get("/powercars/get_user_car/", function(data) {
      var coords = data.car_data.geometry.coordinates;
      info.userCar.setLatLng([coords[1], coords[0]]);
      var fc = info.userCar.getLatLng();
      info.selectNextLocationL.spliceLatLngs(0, 1, fc);
      info.staticNextLocationL.spliceLatLngs(0, 1, fc);
    });
    navigator.geolocation.getCurrentPosition(function(position) {
      var csrftoken = $.cookie('csrftoken');
      var post_data = {
        'lat': position.coords.latitude,
        'lng': position.coords.longitude,
        'csrfmiddlewaretoken': csrftoken,
      };
      var post_url = "/pttp/cars/" + info.userCarID + "/update_current_location/";
      $.post(post_url, post_data, function(response) {
      });
    });
    setTimeout(updateLooper, 5000);
  });

  $('#change_next').click(function(callback) {
    $.get("/pttp/next_location_popup/", function(data) {
      info.selectNextLocationM.bindPopup(data);
      info.selectNextLocationM.openPopup();
      $('.dateTimeField').datetimepicker({
        format: 'YY-MM-DD HH:mm',
        minDate: moment()
      });
    });
  });

  getData(getDataCallback);
};