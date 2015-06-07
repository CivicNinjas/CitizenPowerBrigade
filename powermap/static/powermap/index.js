// Provide your access token
L.mapbox.accessToken = 'pk.eyJ1IjoiaGFyYmllaXNtIiwiYSI6IksyU1Rkc0UifQ.eXciAIxM0pfdj5STBHNnbQ';
// Create a map in the div #map
var map =L.mapbox.map('map', 'harbieism.mbb67n8i');

var myLayer = L.mapbox.featureLayer().addTo(map);

var noteLayer = L.mapbox.featureLayer().addTo(map);


var getData = (function() {
    $.get("http://127.0.0.1:8000/powercars/?format=json", function(data) {
        var dataStorage = data;
        console.log(data.results);
        map.setView([50.11, 44.99], 10);
        myLayer.setGeoJSON(data.results);
    });
});

var getNotes = (function() {
    $.get("http://127.0.0.1:8000/helpnotes/?format=json", function(data) {
        var dataStorage = data;
        console.log(data.results);
        map.setView([50.11, 44.99], 10);
        noteLayer.setGeoJSON(data.results);
    });
});

myLayer.on('click', function(e){
    $.get("http://127.0.0.1:8000/pttp/popup/" + e.layer.feature.id + "/", function(data) {
        console.log(data);
        e.layer.bindPopup(data);
    });
});

noteLayer.on('click', function(e){
    $.get("http://127.0.0.1:8000/pttp/note_popup/" + e.layer.feature.id + "/", function(data) {
        console.log(data);
        e.layer.bindPopup(data);
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
});


getLocation();

getData();
getNotes();
