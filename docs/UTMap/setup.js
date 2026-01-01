// UTMap Setup - Map Initialization
// Uses shared libraries: filter-parser.js and map-utils.js

document.addEventListener("alpine:init", async () => {
  Alpine.store("tilesets_loaded", false);

  const urlPrefix = MapUtils.getUrlPrefix();
  const protocol = MapUtils.initPMTilesProtocol();

  const tilesURL = urlPrefix + "utah-latest.pmtiles";

  const source = new pmtiles.FetchSource(tilesURL, new Headers({'Content-Language': 'xx'}));
  const p = new pmtiles.PMTiles(source);
  protocol.add(p);

  p.getMetadata().then((m) => {
    map.addControl(new maplibregl.AttributionControl({customAttribution: "Data as of " + m.description}));
  });

  map = new maplibregl.Map({
    container: "map",
    zoom: 6.5,
    hash: "map",
    center: [-111.1, 39.5],
    attributionControl: false, // manually added later (w. date)
    style: {
      version: 8,
      layers: mapstyle_layers,
      glyphs: "./font/{fontstack}/{range}.pbf",
      projection: {"type": "globe"},
      sources: {
        UTMap: {
          type: "vector",
          url: "pmtiles://" + tilesURL,
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
        gnisMissing: {
          type: "vector",
          url: "pmtiles://" + urlPrefix + "GNIS-Missing-Utah.pmtiles",
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
        highlight: {
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
  MapUtils.setupFeatureHandlers(map, ['allFeatures', 'allFeatures-node', 'gnisMissing', 'gnisMissing-node']);

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
