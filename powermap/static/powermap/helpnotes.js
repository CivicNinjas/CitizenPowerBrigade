'use strict';

var mapFile = require('./map');

var layers = {
  noteLayer: L.mapbox.featureLayer(),
  clusterGroup: new L.MarkerClusterGroup(),
};

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

 (function updateNotes() {
   var noteToPopup = null;
   $.get("/helpnotes/?format=json", function(data) {
     for(var i = 0; i < data.results.features.length; i++){
       var feat = data.results.features[i];
       feat.properties["marker-symbol"] = "oil-well";
       feat.properties["marker-size"] = "large";
       feat.properties["marker-color"] = "#fc4353";
       if (mapFile.mapInfo.currentPopup.type == "HelpNote" && mapFile.mapInfo.currentPopup.id == feat.id) {
         noteToPopup = feat;
         tempPopup = mapFile.mapInfo.currentPopup.popup;
       };
     };
     layers.noteLayer.setGeoJSON([]);
     layers.noteLayer.setGeoJSON(data.results);
     layers.clusterGroup.clearLayers(layers.noteLayer);
     layers.clusterGroup.addLayer(layers.noteLayer);
     mapFile.map.addLayer(layers.clusterGroup);
     if (noteToPopup != null){
       layers.noteLayer.bindPopup(tempPopup);
       layers.noteLayer.openPopup();
     };
     setTimeout(updateNotes, 20000);
   });
})();