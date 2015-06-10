$( document ).ready(function() {
// Provide your access token
L.mapbox.accessToken = 'pk.eyJ1IjoiaGFyYmllaXNtIiwiYSI6IksyU1Rkc0UifQ.eXciAIxM0pfdj5STBHNnbQ';
// Create a map in the div #map
var map =L.mapbox.map('map', 'harbieism.mbb67n8i');

var carLayer = L.mapbox.featureLayer().addTo(map);

var noteLayer = L.mapbox.featureLayer();

var lineStringMarker = null;

var secondMarker = null;

var clusterGroup = new L.MarkerClusterGroup();

var polyline = L.polyline([]).addTo(map);

var updateCar = (function(callback) {
    $.get("http://127.0.0.1:8000/powercars/?format=json", function(data) {
        var id = null;
        for(var i = 0; i < data.results.features.length; i++){
            id = data.results.features[i].id;
            data.results.features[i].properties["marker-symbol"] = "car";
            data.results.features[i].properties["marker-size"] = "large";
            data.results.features[i].properties["marker-color"] = "#fc4353";
        }
        var temp = carLayer.setGeoJSON(data.results)._layers;
        for (var prop in temp){
            var marker = temp[prop];
            break;
        }
        var fc = marker.getLatLng();
        callback([fc]);
    });
});

(function workerTwo() {
  updateCar(function(result) {
    polyline.spliceLatLngs(0, 1, result[0]);

  });

    setTimeout(workerTwo, 15000);
})();

var getData = (function(callback) {
    $.get("http://127.0.0.1:8000/powercars/?format=json", function(data) {
        var id = null;
        for(var i = 0; i < data.results.features.length; i++){
            id = data.results.features[i].id;
            data.results.features[i].properties["marker-symbol"] = "car";
            data.results.features[i].properties["marker-size"] = "large";
            data.results.features[i].properties["marker-color"] = "#fc4353";
        }
        var temp = carLayer.setGeoJSON(data.results)._layers;
        for (var prop in temp){
            var marker = temp[prop];
            break;
        }
        
        var fc = marker.getLatLng();
        var lineStringMarker = L.mapbox.featureLayer().addTo(map);
        var soon_marker = marker.feature.properties.next_location;
        soon_marker.properties = {
            'marker-symbol': 'marker-stroked',
            'marker-size': 'large',
            'marker-color': '#0044ff'
        }
        var temp = lineStringMarker.setGeoJSON(soon_marker)._layers;
        for (var prop in temp){
            secondMarker = temp[prop];
            break;
        }
        secondMarker.feature.properties = {
            'marker-symbol': 'marker-stroked',
            'marker-size': 'large',
            'marker-color': '#0044ff'
        }
        secondMarker.options.draggable = true;
        secondMarker.dragging.enable();
        console.log(secondMarker);
        secondMarker.options.zIndexOffset = 1000;
        var c = secondMarker.getLatLng();
        var latlngs = [fc, c]
        var polyline = L.polyline(latlngs, {color: 'blue'}).addTo(map);
        callback([fc, secondMarker, polyline, id]);
    });
});



var getNotes = (function() {
    
});

carLayer.on('click', function(e){
    $.get("http://127.0.0.1:8000/pttp/popup/" + e.layer.feature.id + "/", function(data) {
        e.layer.bindPopup(data);
        e.layer.openPopup();
    });
});

noteLayer.on('click', function(e){
    $.get("http://127.0.0.1:8000/pttp/note_popup/" + e.layer.feature.id + "/", function(data) {
        e.layer.bindPopup(data);
        e.layer.openPopup();
    });
});

var getLocation = (function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setLocation);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
});

var setLocation = (function(position) {
    point_string = "POINT(" + position.coords.longitude + " " + position.coords.latitude +")";
    $("#id_location").val(point_string);
    map.setView([position.coords.latitude, position.coords.longitude], 10);
});


getLocation();

(function worker() {
  $.get("http://127.0.0.1:8000/helpnotes/?format=json", function(data) {
      var dataStorage = data;
      for(var i = 0; i < data.results.features.length; i++){
          data.results.features[i].properties["marker-symbol"] = "oil-well";
          data.results.features[i].properties["marker-size"] = "large";
          data.results.features[i].properties["marker-color"] = "#fc4353";
      }
      noteLayer.setGeoJSON([]);
      noteLayer.setGeoJSON(data.results);
      clusterGroup.clearLayers(noteLayer);
      clusterGroup.addLayer(noteLayer);
      map.addLayer(clusterGroup);
      setTimeout(worker, 60000);
  });
})();




getData(function(result) {
  result[1].options.draggable = true;
  polyline = result[2];
  result[1].on('drag', function(e){
    var loc = result[1].getLatLng();
    polyline.spliceLatLngs(1, 1, loc);
  });

  $('#change_next').click(function() {
      var csrftoken = $.cookie('csrftoken');
      var loc = result[1].getLatLng();
      var post_data = {
          'lat': loc.lat,
          'lng': loc.lng,
          'csrfmiddlewaretoken': csrftoken,
      }
      var post_url = "http://127.0.0.1:8000/pttp/cars/" + result[3] + "/change_location/";
      $.post(post_url, post_data, function(response) {
        console.log(response);
      });
  });
});




});