$( document ).ready(function() {
  // Provide your access token
  L.mapbox.accessToken = 'pk.eyJ1IjoiaGFyYmllaXNtIiwiYSI6IksyU1Rkc0UifQ.eXciAIxM0pfdj5STBHNnbQ';
  // Create a map in the div #map
  var map = L.mapbox.map('map', 'harbieism.mbb67n8i');

  map.addControl(L.mapbox.geocoderControl('mapbox.places', {
    autocomplete: true
  }));


  var otherCars = L.mapbox.featureLayer().addTo(map);


  var lineStringMarker = L.mapbox.featureLayer().addTo(map);

  var secondMarker = null;

  var staticSecond = null;

  var targetLine = L.polyline([]).addTo(map);



  var getOtherCars = (function() {
    $.get("/pttp/cars/get_other_cars/", function(data) {
      for(var i = 0; i < data.features.length; i++){
        feat = data.features[i];
        feat.properties["marker-symbol"] = "car";
        feat.properties["marker-size"] = "large";
        feat.properties["marker-color"] = "#bbf696";
      }
      otherCars.setGeoJSON(data)._layers;
      for(var i = 0; i < data.features.length; i++){
        feat = data.features[i];
        start_lat_lng = new L.LatLng(feat.geometry.coordinates[1], feat.geometry.coordinates[0]);
        end_lat_lng = new L.LatLng(
            feat.properties.next_location.coordinates[1],
            feat.properties.next_location.coordinates[0]
        );
        var marksTheSpot = L.marker(end_lat_lng, {
          icon: L.mapbox.marker.icon({
            'marker-symbol': 'cross',
            'marker-size': 'medium',
            'marker-color': '#bbf696'
          }),
        });
        marksTheSpot.addTo(otherCars);
        newlatlngs = [start_lat_lng, end_lat_lng]
        temp = L.polyline(newlatlngs, {color: '#abf696', opacity: "0.8"}).addTo(otherCars);
      }
    });
  });

(function updateOtherCars() {
  otherCars.setGeoJSON([]);
  $.get("/pttp/cars/get_other_cars/", function(data) {
    for(var i = 0; i < data.features.length; i++){
      feat = data.features[i];
      feat.properties["marker-symbol"] = "car";
      feat.properties["marker-size"] = "large";
      feat.properties["marker-color"] = "#bbf696";
    }
    otherCars.setGeoJSON([]);
    otherCars.setGeoJSON(data)._layers;
    for(var i = 0; i < data.features.length; i++){
      feat = data.features[i];
      start_lat_lng = new L.LatLng(feat.geometry.coordinates[1], feat.geometry.coordinates[0]);
      end_lat_lng = new L.LatLng(
          feat.properties.next_location.coordinates[1],
          feat.properties.next_location.coordinates[0]
      );
      var marksTheSpot = L.marker(end_lat_lng, {
        icon: L.mapbox.marker.icon({
          'marker-symbol': 'cross',
          'marker-size': 'medium',
          'marker-color': '#bbf696'
        }),
      });
      marksTheSpot.addTo(otherCars);
      newlatlngs = [start_lat_lng, end_lat_lng]
      temp = L.polyline(newlatlngs, {color: '#abf696', opacity: "0.8"}).addTo(otherCars);
    }
  });
  setTimeout(updateOtherCars, 5000);
})();



  otherCars.on('click', function(e){
    $.get("/pttp/popup/" + e.layer.feature.id + "/", function(data) {
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

  getOtherCars();


});