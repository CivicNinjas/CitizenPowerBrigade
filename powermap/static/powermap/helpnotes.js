'use strict';

var map = require('./map');

if (isAuth || isAdmin) {

  var HelpNotes = function(map, initDataSource, upDataSource, dataInterval) {
    this.map = map;
    this.initDataSource = initDataSource;
    this.noteLayer = L.mapbox.featureLayer();
    this.clusterGroup = new L.MarkerClusterGroup().addTo(this.map.map);
    this.dataInterval = dataInterval;
    this.upDataSource = upDataSource;
  };

  HelpNotes.prototype.addInitialData = function() {
    var self = this;
    $.get(self.initDataSource, function(data) {
      for(var i = 0; i < data.results.features.length; i++){
        var feat = data.results.features[i];
        feat.properties["marker-symbol"] = "oil-well";
        feat.properties["marker-size"] = "medium";
        feat.properties["marker-color"] = "#fc4353";
      }
      self.noteLayer.setGeoJSON(data.results);
      self.clusterGroup.addLayer(self.noteLayer);
      self.clusterGroup.on('click', function(e){
        console.log(e);
        if (e.layer.feature !== null) {
          $.get("/pttp/note_popup/" + e.layer.feature.id + "/", function(data){
            e.layer.bindPopup(data, {minWidth: 250});
            e.layer.openPopup();
          });
        }
      });
      setTimeout(function() {
        self.updateNotes();
      }, self.dataInterval * 1000);
    });
  };

  HelpNotes.prototype.updateNotes = function() {
    var self = this;
    $.get(self.upDataSource, function(data) {
      // Iterate through each note marker and attempt to
      // look its ID up in the data from the AJAX call.
      // If the note is present, all is good, and we mark it as present.
      // If not, we remove the note from the map.
      var presentDict = {};
      self.clusterGroup.eachLayer(function(note) {
        if (data.hasOwnProperty(note.feature.id)) {
          presentDict[note.feature.id] = true;
        } else {
          self.clusterGroup.removeLayer(note);
        }
      });

      // After checking for the presence of existing notes,
      // we need to iterate through the presentDict to check for
      // new markers and add them to the map.
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          if (!(presentDict.hasOwnProperty(key))) {

            // If the note is not present, get its data via an AJAX
            // call and add it to the map.
            $.get("/helpnotes/" + key + "/", function(noteData) {
              var newLocation = new L.LatLng(
                noteData.geometry.coordinates[1],
                noteData.geometry.coordinates[0]
              );

              var newNote = L.marker(newLocation, {
                icon: L.mapbox.marker.icon({
                  'marker-symbol': 'oil-well',
                  'marker-size': 'medium',
                  'marker-color': '#FC4353'
                }),
              });
              newNote.feature = {id: key};
              self.clusterGroup.addLayer(newNote);
            });
          }
        }
      }

      setTimeout(
        function() {self.updateNotes(); },
        self.dataInterval * 1000
      );
    });


  };

  var notes = new HelpNotes(
    map,
    '/helpnotes/?format=json',
    '/helpnotes/update_notes/',
    5
  );

  notes.addInitialData();
  module.exports = notes;
}