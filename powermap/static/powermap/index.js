$( document ).ready(function() {

  module = function() {
    L.mapbox.accessToken = 'pk.eyJ1IjoiaGFyYmllaXNtIiwiYSI6IksyU1Rkc0UifQ.eXciAIxM0pfdj5STBHNnbQ';

    var map = L.mapbox.map('map', 'harbieism.mbb67n8i');

    map.addControl(L.mapbox.geocoderControl('mapbox.places', {
      autocomplete: true
    }));

    var layers = {
      carLayer: L.mapbox.featureLayer().addTo(map),
      otherCars: L.mapbox.featureLayer().addTo(map),
      otherCarMarkers: L.mapbox.featureLayer().addTo(map),
      noteLayer: L.mapbox.featureLayer(),
      staticNext: null,
      staticNextLine: L.polyline([]),
      secondMarker: null,
      clusterGroup: new L.MarkerClusterGroup(),
      targetLine: L.polyline([]),
      currentPopup: {
        id: null,
        type: null,
        popup: null
      },
      currentPopupType: null
    };

    map.on('popupopen', function(e) {
      if (e.popup._source.feature.properties["marker-symbol"] == "car") {
        layers.currentPopup.type = "PowerCar";
      } else if (e.popup._source.feature.properties["marker-symbol"] == "oil-well") {
        layers.currentPopup.type = "HelpNote";
      };
      layers.currentPopup.id = e.popup._source.feature.id;
      layers.currentPopup.popup = e.popup;
    });

    map.on('popupclose', function(e) {
      layers.currentPopup.type = null;
      layers.currentPopup.id = null;
      layers.currentPopup.popup = null;
    });

    layers.otherCars.on('click', function(e){
      if (e.layer.feature != null) {
        $.get("/pttp/popup/" + e.layer.feature.id + "/", function(data) {
          e.layer.bindPopup(data);
          e.layer.openPopup();
        });
      }
    });

    layers.noteLayer.on('click', function(e){
      $.get("/pttp/note_popup/" + e.layer.feature.id + "/", function(data) {
        e.layer.bindPopup(data);
        e.layer.openPopup();
      });
    });

    $("#helpnote-form").on('submit', function(e){
      $.post("/helpnotes/", $("#helpnote-form").serialize())
        .done(function(data) {
          console.log("Success");
          console.log(data);
          $("#myModal").modal('hide');
        })
        .fail(function(data){
            console.log("Failure");
        });
      return false;
    });

    var getLocation = (function() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setLocation);
      } else {
        console.log("Geolocation is not supported by this browser.");
      };
    });

    var setLocation = (function(position) {
      point_string = "POINT(" + position.coords.longitude + " " + position.coords.latitude +")";
      $("#id_location").val(point_string);
      map.setView([position.coords.latitude, position.coords.longitude], 10);
    });

    var getData = (function(callback) {
      $.get("/pttp/cars/get_user_car/", function(data) {
        var id = data.id;
        data.properties["marker-symbol"] = "car";
        data.properties["marker-size"] = "large";
        data.properties["marker-color"] = "#0044ff";
        var temp = layers.carLayer.setGeoJSON(data)._layers;
        for (var prop in temp){
          var marker = temp[prop];
          break;
        }
        var fc = marker.getLatLng();
        console.log(fc);
        var soon_marker = marker.feature.properties.next_location;
        var lat_second = soon_marker.coordinates[0];
        var lng_second = soon_marker.coordinates[1];

        layers.secondMarker = L.marker(new L.LatLng(lng_second, lat_second), {
          icon: L.mapbox.marker.icon({
            'marker-symbol': 'marker-stroked',
            'marker-size': 'large',
            'marker-color': '#0044ff'
          }),
          draggable: true,
          zIndexOffset: 1000
        });
        layers.secondMarker.addTo(map);

        layers.staticNext = L.marker(new L.LatLng(lng_second, lat_second), {
          icon: L.mapbox.marker.icon({
            'marker-symbol': 'cross',
            'marker-size': 'medium',
            'marker-color': '#b8b8b8'
          }),
          zIndexOffset: 500
        });
        layers.staticNext.addTo(map);

        layers.secondMarker.options.zIndexOffset = 1000;
        var c = layers.secondMarker.getLatLng();
        var latlngs = [fc, c]
        layers.targetLine = L.polyline(latlngs, {color: 'blue'}).addTo(map);
        layers.staticNextLine = L.polyline(latlngs, {color: 'grey'}).addTo(map);
        callbackObject = {
            fc: fc,
            secondMarker: layers.secondMarker,
            targetLine: layers.targetLine,
            id: id
        };
        callback(callbackObject);
      });
    });

    var getDataCallback = (function(result) {
      layers.secondMarker.on('drag', function(e){
        var loc = layers.secondMarker.getLatLng();
        layers.targetLine.spliceLatLngs(1, 1, loc);
      });

      $('#change_next').click(function() {
        var csrftoken = $.cookie('csrftoken');
        var loc = layers.secondMarker.getLatLng();
        layers.staticNext.setLatLng(loc);
        layers.staticNextLine.spliceLatLngs(1, 1, loc);

        var post_data = {
          'lat': loc.lat,
          'lng': loc.lng,
          'csrfmiddlewaretoken': csrftoken,
        }
        var post_url = "/pttp/cars/" + result.id + "/change_location/";
        $.post(post_url, post_data, function(response) {
        });
      });

      $('#set_active').click(function() {
        var csrftoken = $.cookie('csrftoken');
        var post_data = {
          'csrfmiddlewaretoken': csrftoken
        }
        var post_url = "/pttp/cars/" + result.id + "/set_active/";
        $.post(post_url, post_data, function(response) {
        });
      });
    });


    (function updateNotes() {
      var noteToPopup = null;
      $.get("/helpnotes/?format=json", function(data) {
        for(var i = 0; i < data.results.features.length; i++){
          feat = data.results.features[i];
          feat.properties["marker-symbol"] = "oil-well";
          feat.properties["marker-size"] = "large";
          feat.properties["marker-color"] = "#fc4353";
          if (layers.currentPopup.type == "HelpNote" && layers.currentPopup.id == feat.id) {
            noteToPopup = feat;
            tempPopup = layers.currentPopup.popup;
          };
        };
        layers.noteLayer.setGeoJSON([]);
        layers.noteLayer.setGeoJSON(data.results);
        layers.clusterGroup.clearLayers(layers.noteLayer);
        layers.clusterGroup.addLayer(layers.noteLayer);
        map.addLayer(layers.clusterGroup);
        if (noteToPopup != null){
          layers.noteLayer.bindPopup(tempPopup);
          layers.noteLayer.openPopup();
        };
        setTimeout(updateNotes, 20000);
      });
   })();

    var updateCar = (function(callback) {
      $.get("/pttp/cars/get_user_car/", function(data) {
        var id = data.id;
        data.properties["marker-symbol"] = "car";
        data.properties["marker-size"] = "large";
        data.properties["marker-color"] = "#0044ff";
        var temp = layers.carLayer.setGeoJSON(data)._layers;
        for (var prop in temp){
          var marker = temp[prop];
          break;
        }
        var fc = marker.getLatLng();
        callbackObject = {
            fc: fc,
            id: id
        }
        callback(callbackObject);
      });
    });

    (function workerTwo() {
      updateCar(function(result) {
        layers.targetLine.spliceLatLngs(0, 1, result.fc);
        navigator.geolocation.getCurrentPosition(function(position) {
          var csrftoken = $.cookie('csrftoken');
          var post_data = {
            'lat': position.coords.latitude,
            'lng': position.coords.longitude,
            'csrfmiddlewaretoken': csrftoken,
          }
          var post_url = "/pttp/cars/" + result.id + "/update_current_location/";
          $.post(post_url, post_data, function(response) {
          });
        });
      });
      setTimeout(workerTwo, 5000);
    })();

    var getOtherCars = (function() {
      $.get("/pttp/cars/get_other_cars/", function(data) {
        for(var i = 0; i < data.features.length; i++){
          feat = data.features[i];
          feat.properties["marker-symbol"] = "car";
          feat.properties["marker-size"] = "large";
          feat.properties["marker-color"] = "#bbf696";
        };
        layers.otherCars.setGeoJSON(data)._layers;
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
          marksTheSpot.addTo(layers.otherCarMarkers);
          newlatlngs = [start_lat_lng, end_lat_lng]
          temp = L.polyline(newlatlngs, {color: '#abf696', opacity: "0.8"}).addTo(layers.otherCarMarkers);
        }
      });
    });

    (function updateOtherCars() {
      var tempPopup = null;
      var markerToPopup = null;
      $.get("/pttp/cars/get_other_cars/", function(data) {
        for(var i = 0; i < data.features.length; i++){
          feat = data.features[i];
          feat.properties["marker-symbol"] = "car";
          feat.properties["marker-size"] = "large";
          feat.properties["marker-color"] = "#bbf696";
          if (layers.currentPopup.type == "PowerCar" && layers.currentPopup.id == feat.id) {
            markerToPopup = feat;
            tempPopup = layers.currentPopup.popup;
          };

        };
        layers.otherCars.setGeoJSON([]);
        layers.otherCarMarkers.setGeoJSON([]);
        layers.otherCars.setGeoJSON(data)._layers;
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
          marksTheSpot.addTo(layers.otherCarMarkers);
          newlatlngs = [start_lat_lng, end_lat_lng]
          temp = L.polyline(newlatlngs, {color: '#abf696', opacity: "0.8"}).addTo(layers.otherCarMarkers);
        }
        if (markerToPopup != null){
          layers.otherCars.bindPopup(tempPopup);
          layers.otherCars.openPopup();
        };
      });
      setTimeout(updateOtherCars, 5000);
    })();

    return {
        getLocation: getLocation, 
        getOtherCars: getOtherCars,
        getData: getData,
        getDataCallback: getDataCallback
    };

  }();

  module.getLocation();
  module.getOtherCars();
  module.getData(module.getDataCallback);

});