'use strict';

var mapFile = require('./map');

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
    var coords = data.geometry.coordinates;

    info.userCar = L.marker(new L.LatLng(coords[1], coords[0]), {
      icon: L.mapbox.marker.icon({
        'marker-symbol': 'car',
        'marker-size': 'large',
        'marker-color': '#0044ff'
      }),
      zIndexOffset: 1000
    });
    info.userCar.addTo(mapFile.map);

    info.userCarID = data.id;
    var fc = info.userCar.getLatLng();
    var soon_marker = data.properties.next_location;
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

  $('#change_next').click(function() {
    var csrftoken = $.cookie('csrftoken');
    var loc = info.selectNextLocationM.getLatLng();
    info.staticNextLocationM.setLatLng(loc);
    info.staticNextLocationL.spliceLatLngs(1, 1, loc);

    var post_data = {
      'lat': loc.lat,
      'lng': loc.lng,
      'csrfmiddlewaretoken': csrftoken,
    }
    var post_url = "/pttp/cars/" + info.userCarID + "/change_location/";
    $.post(post_url, post_data, function(response) {
    });
  });

  $('#set_active').click(function() {
    var csrftoken = $.cookie('csrftoken');
    var post_data = {
      'csrfmiddlewaretoken': csrftoken
    }
    var post_url = "/pttp/cars/" + info.userCarID + "/set_active/";
    $.post(post_url, post_data, function(response) {
    });
  });

  setTimeout(updateLooper, 5000);
});


var updateLooper = (function() {
  $.get("/powercars/get_user_car/", function(data) {
    var coords = data.geometry.coordinates;
    console.log(coords);
    info.userCar.setLatLng([coords[1], coords[0]]);
    var fc = info.userCar.getLatLng();
    info.selectNextLocationL.spliceLatLngs(0, 1, fc);
  });
  navigator.geolocation.getCurrentPosition(function(position) {
    var csrftoken = $.cookie('csrftoken');
    var post_data = {
      'lat': position.coords.latitude,
      'lng': position.coords.longitude,
      'csrfmiddlewaretoken': csrftoken,
    };
    console.log(post_data);
    var post_url = "/pttp/cars/" + info.userCarID + "/update_current_location/";
    $.post(post_url, post_data, function(response) {
    });
  });
  setTimeout(updateLooper, 5000);
});

getData(getDataCallback);