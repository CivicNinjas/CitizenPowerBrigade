'use strict';

var map = require('./map');

if (!isAdmin) {

var OtherCars = function(map, dataSource, dataInterval) {
  this.map = map;
  this.carFeatureGroup = L.featureGroup();
  this.carLayer = L.mapbox.featureLayer().addTo(this.map.map);
  this.staticNextLines = L.mapbox.featureLayer().addTo(this.map.map);
  this.staticNextMarkers = L.mapbox.featureLayer().addTo(this.map.map);
  this.dataSource = dataSource;
  this.markerToPopup = null;
  this.dataInterval = dataInterval;
};

// Add data to the map from a data source for the first time.
OtherCars.prototype.addInitialData = function() {
  var self = this;
  self.staticNextMarkers.setGeoJSON([]);
  $.get("/powercars/other_active_cars/", function(data) {
    for(var i = 0; i < data.car_data.features.length; i++) {

      //Iterate through the data from the ajax call.
      var currentFeature = data.car_data.features[i];

      // Prepare carMarkers to be applied to the map as a GeoJSON
      currentFeature.properties["marker-symbol"] = "car";
      currentFeature.properties["marker-size"] = "medium";
      currentFeature.properties["marker-color"] = "#FFA500";
      
      // Adding nextMarkers and lines pointing to them.
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
        {color: "#FFA500", opacity: "0.8", parentCarID: currentFeature.id}
      ).addTo(self.staticNextLines);

      // Creating a marker for the next location and adding it to the map.
      var markerForNextLocation = L.marker(endLatLng, {
        icon: L.mapbox.marker.icon({
          'marker-symbol': 'marker-stroked',
          'marker-size': 'medium',
          'marker-color': "#FFA500"
        }),
        parentCarID: currentFeature.id,
        zIndexOffset: 1000,
        parentLine: nextLine
      });
      markerForNextLocation.addTo(self.staticNextMarkers);
    }

    // Add markers for the cars themselves to the map.
    self.carLayer.setGeoJSON([]);
    self.carLayer.setGeoJSON(data.car_data);

    self.carLayer.on('click', function(e){
      if (e.layer.feature !== null) {
        $.get("/pttp/cars/popup/" + e.layer.feature.id + "/", function(data){
          e.layer.bindPopup(data, {minWidth: 250});
          e.layer.openPopup();
        });
      }
    });

    setTimeout(function() {
      self.updateOthers();
    }, self.dataInterval * 1000);
  });
};

// Updates the locations of markers and lines.
OtherCars.prototype.updateOthers = function() {
  var self = this;

  $.get(this.dataSource, function(data) {
    // Iterate through each car marker, look up its current location in
    // the data from the ajax call, and move it to this location.
    // This lets us continue updating without refreshing the map's entire
    // GeoJSON.
    self.carLayer.eachLayer(function(marker){
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

    // Same as above, but for the staticNextMarkers rather than the car
    // markers.
    self.staticNextMarkers.eachLayer(function(marker){
      if (data.hasOwnProperty(marker.options.parentCarID)) {
        var carData = data[marker.options.parentCarID];
        marker.setLatLng([
          carData.next_location.coordinates[1],
          carData.next_location.coordinates[0]
        ]);
      } else {
        self.staticNextMarkers.removeLayer(marker);
      }
    });

    // Finally update the staticNextLines.
    self.staticNextLines.eachLayer(function(line){
      if (data.hasOwnProperty(line.options.parentCarID)) {
        var lineData = data[line.options.parentCarID];
        line.setLatLngs([
          [
            lineData.current_location.coordinates[1],
            lineData.current_location.coordinates[0]
          ],
          [
            lineData.next_location.coordinates[1],
            lineData.next_location.coordinates[0]
          ]
        ]);
        lineData.present = true;
      } else {
        self.staticNextLines.removeLayer(line);
      }
    });

    // Iterate through the ajax data after updating existing
    // markers, checking for new markers and adding them to the map.
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        // If this keyed feature do
        if (!(data[key].hasOwnProperty("present"))) {

          var currentFeature = data[key];

          // Adding nextMarkers and lines pointing to them.
          var startLatLng = new L.LatLng(
            currentFeature.current_location.coordinates[1],
            currentFeature.current_location.coordinates[0]
          );

          var endLatLng = new L.LatLng(
            currentFeature.next_location.coordinates[1],
            currentFeature.next_location.coordinates[0]
          );

          var markerForCurrentLocation = L.marker(startLatLng, {
            icon: L.mapbox.marker.icon({
              'marker-symbol': 'car',
              'marker-size': 'medium',
              'marker-color': "#FFA500"
            }),
            feature: {
              id: key
            },
            parentCarID: key,
            zIndexOffset: 1000
          });

          markerForCurrentLocation.on('click', function(e){
            $.get("/pttp/cars/popup/" + key + "/", function(data) {
              e.layer.bindPopup(data, {minWidth: 250});
              e.layer.openPopup();
            });
          });
          markerForCurrentLocation.addTo(self.carLayer);


          // Add a line between the carMarker and the next location marker.
          var nextLine = L.polyline(
            [startLatLng, endLatLng],
            { color: "#FFA500",
              opacity: "0.8",
              parentCarID: currentFeature.id
            }
          ).addTo(self.staticNextLines);

          // Creating a marker for the next location and adding it to the map.
          var markerForNextLocation = L.marker(endLatLng, {
            icon: L.mapbox.marker.icon({
              'marker-symbol': 'marker-stroked',
              'marker-size': 'medium',
              'marker-color': "#FFA500"
            }),
            parentCarID: currentFeature.id,
            zIndexOffset: 1000,
            parentLine: nextLine
          });
          markerForNextLocation.addTo(self.staticNextMarkers);
        }
      }
    }
    setTimeout(function() {
      self.updateOthers();
    }, self.dataInterval * 1000);
  });
};

var otherCars = new OtherCars(
  map,
  '/powercars/other_car_coords/',
  5
);

otherCars.addInitialData();

module.exports = otherCars;
}
