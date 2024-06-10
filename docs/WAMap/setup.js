document.addEventListener("alpine:init", async () => {
  Alpine.store("tilesets_loaded", false);

  let is_local = new URL(location.href).port == "8080";
  let url_prefix;
  if (is_local) {
    url_prefix = "http://127.0.0.1:8080/data/";
  } else {
    url_prefix = "https://watmildon.org/";
  }

  // add the PMTiles plugin to the maplibregl global.
  let protocol = new pmtiles.Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);

  map = new maplibregl.Map({
    container: "map",
    zoom: 7,
    hash: "map",
    center: [-120.6, 47.4],
    style: {
      version: 8,
      layers: mapstyle_layers,
      glyphs: "./font/{fontstack}/{range}.pbf",
      sources: {
        WAMap: {
          type: "vector",
          url: "pmtiles://" + url_prefix + "washington-latest.pmtiles",
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
        highlight: {
          type: "geojson",
          data: {
              "type": "FeatureCollection",
              "features": [
              ]
            },
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
        osmcarto: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
      },
    },
  });

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

  // Query functionality
  const onEnter = e => {
    map.getCanvas().style.cursor = "pointer";
  };
  const onLeave = e => {
    map.getCanvas().style.cursor = "";
  }
  const onClose = e => {
    window.tigerMap.getSource("highlight").setData({"type":"FeatureCollection", "features":[]});
  }
  const onClick = e => {
    function feature2html({ properties }, i) {
      let html = `<h4>feature #${i+1}</h4>`;
      html += "<ul>"
      for (const [key, val] of Object.entries(properties)) {
        if(key === "@id" && typeof(properties["@type"]) !== "undefined") {
            let t = properties["@type"];
            html += `<li>${key}=<a target="_blank" href="https://www.openstreetmap.org/${t}/${val}">${val}</a></li>`;
        } else {
            html += `<li>${key}=${val}</li>`;
        }
      }
      html += "</ul>";
      return html;
    }
    const newHighlightSource = {
      "type": "FeatureCollection",
      "features": [
      ]
    };
    const features = {};
    for (const f of e.features) {
      features[f.properties['@type'] + f.properties['@id']] = f;
      newHighlightSource["features"].push(f);
    }
    const html = `<div class="inspect-popup">${Array.from(Object.values(features)).map(feature2html).join("<br>")}</div>`;
    window.tigerMap.getSource("highlight").setData(newHighlightSource);

    if(typeof(map._lastPopup) !== 'undefined' && map._lastPopup.isOpen()) {
      map._lastPopup.off("close", onClose);
    }

    map._lastPopup = new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map)
          .setMaxWidth("none")
          .on("close", onClose);
  };
  map.on("mouseenter", "allFeatures", onEnter);
  map.on("mouseleave", "allFeatures", onLeave);
  map.on("click", "allFeatures", onClick);
  map.on("mouseenter", "allFeatures-node", onEnter);
  map.on("mouseleave", "allFeatures-node", onLeave);
  map.on("click", "allFeatures-node", onClick);
  map.on("moveend", function() {updateMapOnScroll();})
  map.showTileBoundaries = false;
  window.tigerMap = map;

  const url = new URL(window.location.href);
  const myValue = url.searchParams.has('filter')
    ? url.searchParams.get('filter')
    : null; // Set to null if the parameter is not present

  if (myValue !== null) {
    const textBox = document.getElementById('filterTextBox');
    textBox.value = decodeURIComponent(myValue);
    window.addEventListener('load', function() {
      filterMap();
    });
  }

  document.getElementById("filterTextBox").onkeydown = function (e) {
    if (e.key == "Enter") {
      filterMap();
    }
  };

  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});
