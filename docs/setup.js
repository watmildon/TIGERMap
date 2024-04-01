document.addEventListener("alpine:init", async () => {
  Alpine.store("tilesets_loaded", false);

  let is_local = new URL(location.href).port == "8080";
  let url_prefix;
  if (is_local) {
    url_prefix = "http://127.0.0.1:8080/data/";
  } else {
    url_prefix = "https://pub-45b39ea7c4e84b9bac2b3568e1dced89.r2.dev/";
  }

  // add the PMTiles plugin to the maplibregl global.
  let protocol = new pmtiles.Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);

  map = new maplibregl.Map({
    container: "map",
    zoom: 4,
    hash: "map",
    center: [-91, 39.0],
    style: {
      version: 8,
      layers: mapstyle_layers,
      glyphs: "./font/{fontstack}/{range}.pbf",
      sources: {
        tiger: {
          type: "vector",
          url: "pmtiles://"+ url_prefix + "us-latest.pmtiles",
          attribution:
            '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
        streetaddress: {
          type: "vector",
          url: "pmtiles://"+ url_prefix + "us-latest-streetaddress.pmtiles",
          attribution:
            '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
        redlined: {
          type: "vector",
          url: "pmtiles://"+ url_prefix + "redlining-grade-d.pmtiles",
          attribution:
            '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
        NAD: {
          type: "vector",
          url: "pmtiles://"+ url_prefix + "NAD_r15.pmtiles",
          attribution:
            '© Public Domain, USDOT',
        },
        osmcarto: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution:
            '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        }
      },
    },
  });


  addEclipseData(map);


  // Add geolocate control to the map.
  map.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    }),
  );
  map.addControl(new maplibregl.NavigationControl());

  map.setPadding({ top: 57 });
  
  var scale = new maplibregl.ScaleControl({
    maxWidth: 200,
    unit: "imperial",
  });
  map.addControl(scale);
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
  
  window.tigerMap = map;

  document.getElementById('filterTextBox').onkeydown = function(e){
    if(e.key == 'Enter'){
      filterMap();
    }
 };

  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
});
});
