'use strict';

var mapFile = require('./map');

var otherLayers = {
  otherCars: L.mapbox.featureLayer().addTo(mapFile.map),
  otherCarMarkers: L.mapbox.featureLayer().addTo(mapFile.map),
};

otherLayers.otherCars.on('click', function(e){
  if (e.layer.feature != null) {
    $.get("/pttp/cars/popup/" + e.layer.feature.id + "/", function(data) {
      e.layer.bindPopup(data, {minWidth: 250});
      e.layer.openPopup();
    });
  }
});

(function updateOtherCars() {
  var tempPopup = null;
  var markerToPopup = null;
  $.get("/powercars/other_active_cars/", function(data) {
    for(var i = 0; i < data.car_data.features.length; i++){
      var feat = data.car_data.features[i];
      feat.properties["marker-symbol"] = "car";
      feat.properties["marker-size"] = "large";
      feat.properties["marker-color"] = "#FF4500";
      var popType = mapFile.mapInfo.currentPopup.type;
      var popID = mapFile.mapInfo.currentPopup.id;
      if (popType == "PowerCar" && popID == feat.id) {
        markerToPopup = feat;
        tempPopup = mapFile.mapInfo.currentPopup.popup;
      };

    };
    otherLayers.otherCars.setGeoJSON([]);
    otherLayers.otherCarMarkers.setGeoJSON([]);
    otherLayers.otherCars.setGeoJSON(data.car_data)._layers;
    for(var i = 0; i < data.car_data.features.length; i++){
      var feat = data.car_data.features[i];
      if (data.arrived_info[feat.id] == false) {
        var startLatLng = new L.LatLng(feat.geometry.coordinates[1], feat.geometry.coordinates[0]);
        var endLatLng = new L.LatLng(
            feat.properties.next_location.coordinates[1],
            feat.properties.next_location.coordinates[0]
        );
        var marksTheSpot = L.marker(endLatLng, {
          icon: L.mapbox.marker.icon({
            'marker-symbol': 'cross',
            'marker-size': 'medium',
            'marker-color': '#FF4500'
          }),
        });
        marksTheSpot.addTo(otherLayers.otherCarMarkers);
        var newlatlngs = [startLatLng, endLatLng]
        var temp = L.polyline(newlatlngs, {color: '#FF4500', opacity: "0.8"}).addTo(otherLayers.otherCarMarkers);
      };
    }
    if (markerToPopup != null){
      otherLayers.otherCars.bindPopup(tempPopup);
      otherLayers.otherCars.openPopup();
    };
  });
  setTimeout(updateOtherCars, 5000);
})();