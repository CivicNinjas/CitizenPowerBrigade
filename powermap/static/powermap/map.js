'use strict';

L.mapbox.accessToken = 'pk.eyJ1IjoiaGFyYmllaXNtIiwiYSI6IksyU1Rkc0UifQ.eXciAIxM0pfdj5STBHNnbQ';

var map = L.mapbox.map('map', 'harbieism.mbb67n8i');

map.addControl(L.mapbox.geocoderControl('mapbox.places', {
  autocomplete: true
}));

var mapInfo = {
  currentPopup: {
    type: null,
    id: null,
    popup: null
  }
};

var getLocation = (function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setLocation);
  } else {
    console.log("Geolocation is not supported by this browser.");
  };
});

var setLocation = (function(position) {
  var point_string = "POINT(" + position.coords.longitude + " " + position.coords.latitude +")";
  $("#id_location").val(point_string);
  map.setView([position.coords.latitude, position.coords.longitude], 10);
});


map.on('popupopen', function(e) {
  if (e.popup._source.featuer != null) {
    if (e.popup._source.feature.properties["marker-symbol"] == "car") {
      mapInfo.currentPopup.type = "PowerCar";
    } else if (e.popup._source.feature.properties["marker-symbol"] == "oil-well") {
      mapInfo.currentPopup.type = "HelpNote";
    };
    mapInfo.currentPopup.id = e.popup._source.feature.id;
    mapInfo.currentPopup.popup = e.popup;
  };
});

map.on('popupclose', function(e) {
  mapInfo.currentPopup.type = null;
  mapInfo.currentPopup.id = null;
  mapInfo.currentPopup.popup = null;
});

getLocation();

exports.map = map;
exports.mapInfo = mapInfo;
exports.getLocation = getLocation;
exports.setLocation = setLocation;