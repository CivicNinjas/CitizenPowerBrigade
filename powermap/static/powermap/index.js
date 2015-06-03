// Provide your access token
L.mapbox.accessToken = 'pk.eyJ1IjoiaGFyYmllaXNtIiwiYSI6IksyU1Rkc0UifQ.eXciAIxM0pfdj5STBHNnbQ';
// Create a map in the div #map
var map =L.mapbox.map('map', 'harbieism.mbb67n8i');

// $.get( "http://127.0.0.1:8000/powercars/?format=json", function( data ) {
//   console.log(data);
//   alert( "Load was performed." );
//   var featureLayer = L.mapbox.featureLayer(data[0]).addTo(map);
// });


var getData = (function() {
        $.get("http://127.0.0.1:8000/powercars/?format=json", function(data) {
            var dataStorage = data;
            console.log(data.results);
            map.setView([50.11, 44.99], 10);
            geojsonLayer = L.geoJson(data.results);
            geojsonLayer.addTo(map);
        });
    });

getData()