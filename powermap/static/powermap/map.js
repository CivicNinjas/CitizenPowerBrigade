'use strict';

L.mapbox.accessToken = 'pk.eyJ1IjoiaGFyYmllaXNtIiwiYSI6IksyU1Rkc0UifQ.eXciAIxM0pfdj5STBHNnbQ';

var Map = function () {
  this.map = L.mapbox.map('map', 'harbieism.mbb67n8i');
  this.map.addControl(L.mapbox.geocoderControl('mapbox.places', {
    autocomplete: true
  }));
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
  };
};

$("#helpnote-form").on('submit', function(e){
  e.preventDefault();
  $.post("/helpnotes/", $("#helpnote-form").serialize())
  .done(function(data) {
    console.log("Success");
    console.log(data);
    $("#myModal").modal('hide');
  })
  .fail(function(data){
      console.log("Failure");
  });
});


var map = new Map();

map.getLocation();

module.exports = map;
