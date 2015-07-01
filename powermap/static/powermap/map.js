'use strict';

L.mapbox.accessToken = 'pk.eyJ1IjoiaGFyYmllaXNtIiwiYSI6IksyU1Rkc0UifQ.eXciAIxM0pfdj5STBHNnbQ';


var Map = function () {
  this.map = L.mapbox.map('map', 'harbieism.mbb67n8i');
  this.mapInfo = {
    currentPopup: {
      type: null,
      id: null,
      popup: null
    }
  };

  this.map.addControl(L.mapbox.geocoderControl('mapbox.places', {
    autocomplete: true
  }));

  this.map.on('popupopen', function(e) {
    if (e.popup._source.feature != null) {
      if (e.popup._source.feature.properties["marker-symbol"] == "car") {
        this.mapInfo.currentPopup.type = "PowerCar";
      } else if (e.popup._source.feature.properties["marker-symbol"] == "oil-well") {
        this.mapInfo.currentPopup.type = "HelpNote";
      }
      this.mapInfo.currentPopup.id = e.popup._source.feature.id;
      this.mapInfo.currentPopup.popup = e.popup;
    };
  });

  this.map.on('popupclose', function(e) {
    this.mapInfo.currentPopup.type = null;
    this.mapInfo.currentPopup.id = null;
    this.mapInfo.currentPopup.popup = null;
  });


};

Map.prototype.setLocation = function(position) {
  var pointString = "POINT(" + position.coords.longitude + " "
                  + position.coords.latitude + ")";
  $("#id_location").val(pointString);
  this.map.setView([position.coords.latitude, position.coords.longitude], 10);
};

Map.prototype.getLocation = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(this.setLocation.bind(this));
  } else {
    console.log("Geolocation is not supported");
  }
};



var map = new Map();

map.getLocation();

exports.map = map;
