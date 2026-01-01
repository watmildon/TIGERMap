// WIMap Setup - Map Initialization
// Uses shared libraries: filter-parser.js and map-utils.js

document.addEventListener("alpine:init", async () => {
  Alpine.store("tilesets_loaded", false);

  const urlPrefix = MapUtils.getUrlPrefix();
  const protocol = MapUtils.initPMTilesProtocol();

  const tilesURL = urlPrefix + "wisconsin-latest.pmtiles";

  const source = new pmtiles.FetchSource(tilesURL, new Headers({'Content-Language': 'xx'}));
  const p = new pmtiles.PMTiles(source);
  protocol.add(p);

  p.getMetadata().then((m) => {
    map.addControl(new maplibregl.AttributionControl({customAttribution: "Data as of " + m.description}));
  });

  map = new maplibregl.Map({
    container: "map",
    zoom: 7,
    hash: "map",
    center: [-89.5, 44.5],
    attributionControl: false, // manually added later (w. date)
    style: {
      version: 8,
      layers: mapstyle_layers,
      glyphs: "./font/{fontstack}/{range}.pbf",
      projection: {"type": "globe"},
      sources: {
        WIMap: {
          type: "vector",
          url: "pmtiles://" + tilesURL,
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
        highlight: {
          type: "geojson",
          data: MapUtils.createEmptyGeoJSON(),
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
        voronoi: {
          type: "geojson",
          data: MapUtils.createEmptyGeoJSON(),
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

  // Add standard controls
  MapUtils.addStandardControls(map);

  // Setup feature click handlers
  MapUtils.setupFeatureHandlers(map, ['allFeatures', 'allFeatures-node']);

  // Setup scroll handler for experimental features
  map.on("moveend", function() { updateMapOnScroll(); });
  map.showTileBoundaries = false;

  window.tigerMap = map;

  // Initialize filter from URL
  MapUtils.initFilterFromURL(filterMap);

  // Setup filter input
  MapUtils.setupFilterInput(filterMap, clearFilter);

  // Initialize tooltips
  MapUtils.initTooltips();
});
