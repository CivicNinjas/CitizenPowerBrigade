'use strict';

var map = require('./map');

if (isAdmin) {
  var AdminCars = function (map, dataSource, markerSymbol, markerColor) {
    this.map = map;
    this.carLayer = L.mapbox.featureLayer().addTo(this.map.map);
    this.nextMarkers = L.mapbox.featureLayer().addTo(this.map.map);
    this.staticNextMarkers = L.mapbox.featureLayer().addTo(this.map.map);
    this.dataSource = dataSource;
    this.markerSymbol = markerSymbol;
    this.markerColor = markerColor;
    this.markerToPopup = null;
    this.draggedMarkerID = null;
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
        var popupType = self.map.mapInfo.currentPopup.type;
        var popupID = self.map.mapInfo.currentPopup.id;
        if (popupType == "PowerCar" && popupID == currentFeature.id) {
          self.markerToPopup = currentFeature;
        };

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
        ).addTo(self.nextMarkers);

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
          parentLine: nextLine
        });
        markerForNextLocation.addTo(self.nextMarkers);

        markerForNextLocation.on('drag', function(e) {
          var loc = e.target.getLatLng();
          e.target.options.parentLine.spliceLatLngs(1, 1, loc);
        });

        // Creating a static marker for the next location and 
        // adding it to the map
        var staticMarkerForNextLocation = L.marker(endLatLng, {
          icon: L.mapbox.marker.icon({
            'marker-symbol': 'cross',
            'marker-size': 'small',
            'marker-color': "#B8B8B8"
          }),
          zIndexOffset: 500
        });
        staticMarkerForNextLocation.addTo(self.staticNextMarkers);

        // Add a line between the carMarker and the staticNextLocationMarker.
        L.polyline(
          [startLatLng, endLatLng],
          {color: "grey", opacity: "0.8"}
        ).addTo(self.staticNextMarkers);
      };

      // Add the markers for the cars themselves to the map.
      self.carLayer.setGeoJSON(data.car_data)._layers;
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