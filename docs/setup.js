// TIGERMap Setup - Map Initialization
// Uses shared libraries: filter-parser.js and map-utils.js

document.addEventListener("alpine:init", async () => {
  Alpine.store("tilesets_loaded", false);

  const urlPrefix = MapUtils.getUrlPrefix();
  const protocol = MapUtils.initPMTilesProtocol();

  const tilesURL = urlPrefix + "us-latest.pmtiles";

  const source = new pmtiles.FetchSource(tilesURL, new Headers({'Content-Language': 'xx'}));
  const p = new pmtiles.PMTiles(source);
  protocol.add(p);

  p.getMetadata().then((m) => {
    map.addControl(new maplibregl.AttributionControl({customAttribution: "Data as of " + m.description}));
  });

  map = new maplibregl.Map({
    container: "map",
    zoom: 4,
    hash: "map",
    center: [-91, 39.0],
    attributionControl: false, // manually added later (w. date)
    style: {
      version: 8,
      layers: mapstyle_layers,
      glyphs: "./font/{fontstack}/{range}.pbf",
      projection: {"type": "globe"},
      sources: {
        tiger: {
          type: "vector",
          url: "pmtiles://" + tilesURL,
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
        streetaddress: {
          type: "vector",
          url: "pmtiles://" + urlPrefix + "us-latest-streetaddress.pmtiles",
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
        redlined: {
          type: "vector",
          url: "pmtiles://" + urlPrefix + "redlining-grade-d.pmtiles",
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
        NAD: {
          type: "vector",
          url: "pmtiles://" + urlPrefix + "NAD.pmtiles",
          attribution: "© Public Domain, USDOT",
        },
        counties: {
          type: "vector",
          url: "pmtiles://" + urlPrefix + "AllUSCounties.pmtiles",
          attribution: "© Public Domain, USDOT",
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

  addEclipseData(map);

  // Add standard controls
  MapUtils.addStandardControls(map);

  // Setup feature click handlers
  MapUtils.setupFeatureHandlers(map, ['tigerReview']);

  window.tigerMap = map;

  // Initialize filter from URL
  MapUtils.initFilterFromURL(filterMap);

  // Setup filter input
  MapUtils.setupFilterInput(filterMap, clearFilter);

  // Initialize tooltips
  MapUtils.initTooltips();
});
