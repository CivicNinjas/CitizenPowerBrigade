'use strict';

var map = require('./map');

if (isAdmin) {
  var AdminCars = function (map, dataSource, markerSymbol, markerColor) {
    this.map = map;
    this.carLayer = L.mapbox.featureLayer().addTo(this.map.map);
    this.nextMarkers = L.mapbox.featureLayer().addTo(this.map.map);
    this.nextLines = L.mapbox.featureLayer().addTo(this.map.map);
    this.staticNextMarkers = L.mapbox.featureLayer().addTo(this.map.map);
    this.staticNextLines = L.mapbox.featureLayer().addTo(this.map.map);
    this.dataSource = dataSource;
    this.markerSymbol = markerSymbol;
    this.markerColor = markerColor;
    this.draggedMarkerID = null;
    this.draggedMarker = null;
  };

  // A function that takes an array of coordinates and returns
  // a LatLng object of the inverted coordinates.
  AdminCars.prototype.latlngFromCoords = function(coords) {
    return new L.LatLng(coords[1], coords[0]);
  };

  AdminCars.prototype.generateMarker = function(color, symbol) {
    return L.mapbox.marker.icon({
      'marker-symbol': symbol,
      'marker-size': "medium",
      'marker-color': color
    });
  };

  // Add data to the map from a data source for the first time.
  AdminCars.prototype.addCarsFromGeoJSON = function() {
    var self = this;
    $.get(this.dataSource, function(data) {

      // Iterate through the data from the ajax call.
      for(var i = 0; i < data.car_data.features.length; i++) {
        var currentFeature = data.car_data.features[i];

        // Prepare carMarkers to be applied to the map as a GeoJSON
        currentFeature.properties["marker-symbol"] = self.markerSymbol;
        currentFeature.properties["marker-size"] = "medium";
        currentFeature.properties["marker-color"] = self.markerColor;

        // Adds nextMarkerss and their lines.
        var startLatLng = new L.LatLng(
          currentFeature.geometry.coordinates[1],
          currentFeature.geometry.coordinates[0]
        );

        var endLatLng = new L.LatLng(
          currentFeature.properties.next_location.coordinates[1],
          currentFeature.properties.next_location.coordinates[0]
        );

        // Add a line between the carMarker and the next location marker.
        var nextLine = L.polyline(
          [startLatLng, endLatLng],
          {color: self.markerColor, opacity: "0.8"}
        ).addTo(self.nextLines);

        // Add a line between the carMarker and the 
        // staticNextLocationMarker.
        var staticLine = L.polyline(
          [startLatLng, endLatLng],
          {color: "grey", opacity: "0.8"}
        ).addTo(self.staticNextLines);

        // Creating a static marker for the next location and 
        // adding it to the map
        var staticMarkerForNextLocation = L.marker(endLatLng, {
          icon: L.mapbox.marker.icon({
            'marker-symbol': 'cross',
            'marker-size': 'small',
            'marker-color': "#B8B8B8"
          }),
          zIndexOffset: 500,
          parentLine: staticLine
        });
        staticMarkerForNextLocation.addTo(self.staticNextMarkers);


        // Creating a marker for the next location and adding it to the map.
        var markerForNextLocation = L.marker(endLatLng, {
          icon: L.mapbox.marker.icon({
            'marker-symbol': 'marker-stroked',
            'marker-size': 'medium',
            'marker-color': self.markerColor
          }),
          draggable: true,
          parentCarID: currentFeature.id,
          zIndexOffset: 1000,
          parentLine: nextLine,
          staticMarker: staticMarkerForNextLocation
        });
        markerForNextLocation.addTo(self.nextMarkers);

        markerForNextLocation.on('drag', function(e) {
          var loc = e.target.getLatLng();
          e.target.options.parentLine.spliceLatLngs(1, 1, loc);
          self.draggedMarkerID = e.target.options.parentCarID;
          self.draggedMarker = e.target;
          self.draggedMarker.off('popupopen');
          // jQuery that handles form submit when the marker-form-popup 
          // is opened
          self.draggedMarker.on('popupopen', function() {
            $("#nextLocation-form").on('submit', function(e) {
              e.preventDefault();
              var serialData = $("#nextLocation-form").serializeArray();
              var csrftoken = $.cookie('csrftoken');
              var newLocation = self.draggedMarker.getLatLng();
              var postData = {
                "lat": newLocation.lat,
                "lng": newLocation.lng,
                "arrival_time": serialData[1].value,
                "stay_time": serialData[2].value,
                "csrfmiddlewaretoken": csrftoken,
              };

              // Post serialized data to the server
              $.post(
                "/powercars/" + self.draggedMarkerID
                + "/change_next_location/",
                postData
              ).done(function(data) {
                console.log("Success changing next location");
                self.draggedMarker.closePopup();
                self.draggedMarker.setLatLng(newLocation);
                self.draggedMarker.options.parentLine.spliceLatLngs(
                    1, 1, newLocation
                );
                var markerToMove = self.draggedMarker.options.staticMarker;
              })
              .fail(function(data) {
                console.log("Failure");
              });
            });
          });
        });
      };

      // Add the markers for the cars themselves to the map.
      self.carLayer.setGeoJSON(data.car_data)._layers;

      $('#change_next').click(function(callback) {
        $.get("/pttp/next_location_popup/", function(data) {
          self.draggedMarker.bindPopup(data);
          self.draggedMarker.openPopup();
          $('.dateTimeField').datetimepicker({
            format: 'YY-MM-DD HH:mm',
            minDate: moment()
          });
        });
      });

      setTimeout(function() {
        self.updateData();
      }, self.dataInterval * 1000);
    });
  };

  AdminCars.prototype.updateData = function() {
    var self = this;
    $.get("/powercars/other_car_coords/", function(data) {

      // Iterate through every carLayer, and look for a match
      // in the AJAX data. If there is a match, update the 
      // markers and lines with data from the ajax call.
      // If there is not a match, delete the marker and its assosciated
      // staticMarker and lines.
      // In addition, we modify the ajax data, marking each node
      // that is already on the map.
      self.carLayer.eachLayer(function(marker) {
        if (data.hasOwnProperty(marker.feature.id)) {
          var carData = data[marker.feature.id];
          marker.setLatLng([
            carData.current_location.coordinates[1],
            carData.current_location.coordinates[0]
          ]);
        } else {
          self.carLayer.removeLayer(marker);
        }
      });

      self.nextMarkers.eachLayer(function(marker) {
        if (data.hasOwnProperty(marker.options.parentCarID)) {
          var carData = data[marker.options.parentCarID];
          carData.present = true;
          var newLocation = new L.LatLng(
            carData.current_location.coordinates[1],
            carData.current_location.coordinates[0]
          );
          var newNext = new L.LatLng(
            carData.next_location.coordinates[1],
            carData.next_location.coordinates[0]
          );
          marker.options.staticMarker.options.parentLine.setLatLngs(
            [newLocation, newNext]
          );
          marker.options.staticMarker.setLatLng(newNext);
          marker.options.parentLine.spliceLatLngs(0, 1, newLocation);
        } else {
          // Remove markers and lines
          self.staticNextLines.removeLayer(
            marker.options.staticMarker.parentLine
          );
          self.staticNextMarkers.removeLayer(marker.options.staticMarker);
          self.nextLines.removeLayer(marker.options.parentLine);
          self.nextMarkers.removeLayer(marker);
        };
      });

      // Iterate through the ajax data after updating existing
      // markers, checking for new markers and adding them to the map.
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          if (!(data[key].hasOwnProperty("present"))) {

            var currentFeature = data[key];

            // Add markers and lines pointing to them.
            var startLatLng = self.latlngFromCoords(
              currentFeature.current_location
            );

            var endLatLng = self.latlngFromCoords(
              currentFeature.next_location
            );

            var markerForCurrentLocation = L.marker(startLatLng, {
              icon: L.mapbox.marker.icon({
                'marker-symbol': self.markerSymbol,
                'marker-size': 'medium',
                'marker-color': self.markerColor
              }),
              feature: {
                id: key
              },
              parentCarID: key,
              zIndexOffset: 1000
            });

            markerForCurrentLocation.on('click', function(e) {
              $.get("/pttp/cars/popup/" + key + "/", function(data) {
                e.layer.bindPopup(data, {minWidth: 250});
                e.layer.openPopup();
              });
            });
            markerForCurrentLocation.addTo(self.carLayer);

            // Add a line between the carMarker and the next location Marker.
            var nextLine = L.polyline(
              [startLatLng, endLatLng],
              { color: self.markerColor,
                opacity: "0.8",
                parentCarID: currentFeature.id
              }
            ).addTo(self.nextLines);

            // Add a static line between the carMarker and the next 
            // location Marker.
            var staticNextLine = L.polyline(
              [startLatLng, endLatLng],
              {color: "grey", opacity: "0.8"}
            ).addTo(self.staticNextLines);



            // Creating a static marker for the next location and 
            // adding it to the map
            var staticMarkerForNextLocation = L.marker(endLatLng, {
              icon: self.generateMarker("#B8B8B8", "cross"),
              zIndexOffset: 500,
              parentLine: staticNextLine
            });
            staticMarkerForNextLocation.addTo(self.staticNextMarkers);

            var markerForNextLocation = L.marker(endLatLng, {
              icon: self.generateMarker(self.markerColor, "marker-stroked"),
              parentCarID: currentFeature.id,
              parentLine: nextLine,
              staticMarker: staticMarkerForNextLocation,
              draggable: true
            });
            markerForNextLocation.addTo(self.nextMarkers);
          }
        }
      }
      setTimeout(function() {
        self.updateData();
      }, 5000);
    });
  };

  var test = new AdminCars(
    map,
    "/powercars/other_active_cars/",
    "car",
    "#0044FF"
  );

  test.addCarsFromGeoJSON();

  module.exports = test;

};