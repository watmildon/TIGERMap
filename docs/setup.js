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
        osmcarto: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution:
            '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
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

  map.on('idle', () => {
    // If these two layers were not added to the map, abort
    if (!map.getLayer('streetaddress') || !map.getLayer('redlined')) {
        return;
    }

    // Enumerate ids of the layers.
    const toggleableLayerIds = ['streetaddress', 'redlined'];

    // Set up the corresponding toggle button for each layer.
    for (const id of toggleableLayerIds) {
        // Skip layers that already have a button set up.
        if (document.getElementById(id)) {
            continue;
        }

        // Create a link.
        const link = document.createElement('a');
        link.id = id;
        link.href = '#';
        link.textContent = id;
        link.className = 'active';

        // Show or hide layer when the toggle is clicked.
        link.onclick = function (e) {
            const clickedLayer = this.textContent;
            e.preventDefault();
            e.stopPropagation();

            const visibility = map.getLayoutProperty(
                clickedLayer,
                'visibility'
            );

            // Toggle layer visibility by changing the layout object's visibility property.
            if (visibility === 'visible') {
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                this.className = '';
            } else {
                this.className = 'active';
                map.setLayoutProperty(
                    clickedLayer,
                    'visibility',
                    'visible'
                );
            }
        };

        const layers = document.getElementById('menu');
        layers.appendChild(link);
    }
});
});