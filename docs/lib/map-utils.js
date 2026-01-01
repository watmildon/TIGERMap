/**
 * TIGERMap Utilities Library
 * Shared map initialization and utility functions for all map variants
 */

const MapUtils = {
  /**
   * Setup feature click handlers and popups for map layers
   * @param {Object} map - The MapLibre GL map instance
   * @param {Array<string>} layerNames - Layer names to attach handlers to
   */
  setupFeatureHandlers(map, layerNames) {
    const onEnter = (e) => {
      map.getCanvas().style.cursor = "pointer";
    };

    const onLeave = (e) => {
      map.getCanvas().style.cursor = "";
    };

    const onClose = e => {
      window.tigerMap.getSource("highlight").setData({"type":"FeatureCollection", "features":[]});
    };
    

    const onClick = (e) => {
      // Convert feature properties to HTML
      function feature2html({ properties }, i) {
        let html = `<h4>feature #${i + 1}</h4>`;
        html += "<ul>";
        for (const [key, val] of Object.entries(properties)) {
          if (key === "@id" && typeof(properties["@type"]) !== "undefined") {
            const t = properties["@type"];
            html += `<li>${key}=<a target="_blank" href="https://www.openstreetmap.org/${t}/${val}">${val}</a></li>`;
          } else {
            html += `<li>${key}=${val}</li>`;
          }
        }
        html += "</ul>";
        return html;
      }

      // Create highlight data source
      const newHighlightSource = {
        "type": "FeatureCollection",
        "features": []
      };

      // Deduplicate features by @type and @id
      const features = {};
      for (const f of e.features) {
        const key = f.properties['@type'] + f.properties['@id'];
        features[key] = f;
        newHighlightSource["features"].push({
          type: "Feature",
          geometry: f.geometry,
          properties: f.properties
        });
      }

      // Generate HTML for popup
      const html = `<div class="inspect-popup">${Array.from(Object.values(features)).map(feature2html).join("<br>")}</div>`;

      // Close previous popup if exists and remove its close handler to prevent clearing highlight
      if (typeof(map._lastPopup) !== 'undefined') {
        try {
          if (map._lastPopup.isOpen()) {
            map._lastPopup.off("close", onClose);
          }
        } catch (e) {
          // Popup may have already been removed
        }
      }

      // Update highlight layer with new data (after removing old popup to avoid race conditions)
      map.getSource("highlight").setData(newHighlightSource);

      // Create and show new popup
      map._lastPopup = new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map)
        .setMaxWidth("none")
        .on("close", onClose);
    };

    // Attach event handlers to all specified layers
    layerNames.forEach(layer => {
      map.on("mouseenter", layer, onEnter);
      map.on("mouseleave", layer, onLeave);
      map.on("click", layer, onClick);
    });
  },

  /**
   * Add standard map controls (geolocate, navigation, scale)
   * @param {Object} map - The MapLibre GL map instance
   * @param {Object} options - Control options
   * @param {boolean} options.geolocate - Add geolocate control (default: true)
   * @param {boolean} options.navigation - Add navigation control (default: true)
   * @param {boolean} options.scale - Add scale control (default: true)
   * @param {string} options.scaleUnit - Scale unit: 'imperial' or 'metric' (default: 'imperial')
   * @param {number} options.topPadding - Top padding in pixels (default: 57)
   */
  addStandardControls(map, options = {}) {
    const config = {
      geolocate: true,
      navigation: true,
      scale: true,
      scaleUnit: 'imperial',
      topPadding: 57,
      ...options
    };

    // Add geolocate control
    if (config.geolocate) {
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
        })
      );
    }

    // Add navigation control
    if (config.navigation) {
      map.addControl(new maplibregl.NavigationControl());
    }

    // Set top padding for controls
    if (config.topPadding) {
      map.setPadding({ top: config.topPadding });
    }

    // Add scale control
    if (config.scale) {
      const scale = new maplibregl.ScaleControl({
        maxWidth: 200,
        unit: config.scaleUnit,
      });
      map.addControl(scale);
    }

    // Disable rotation
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
  },

  /**
   * Initialize PMTiles protocol and add to MapLibre
   * @returns {Object} The PMTiles protocol instance
   */
  initPMTilesProtocol() {
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return protocol;
  },

  /**
   * Setup filter input textbox with Enter key handler and auto-clear on empty
   * @param {Function} filterCallback - Function to call when filter is triggered
   * @param {Function} clearCallback - Function to call when filter is cleared (optional)
   */
  setupFilterInput(filterCallback, clearCallback = null) {
    const filterTextBox = document.getElementById("filterTextBox");
    if (filterTextBox) {
      // Handle Enter key
      filterTextBox.onkeydown = (e) => {
        if (e.key === "Enter") {
          filterCallback();
        }
      };

      // Handle clearing the text box - automatically clear filter when empty
      filterTextBox.addEventListener('input', (e) => {
        if (e.target.value === '' && clearCallback) {
          clearCallback();
        }
      });
    }
  },

  /**
   * Initialize filter from URL query parameter
   * @param {Function} filterCallback - Function to call to apply the filter
   */
  initFilterFromURL(filterCallback) {
    const filterValue = FilterParser.getFilterFromURL();

    if (filterValue) {
      const textBox = document.getElementById('filterTextBox');
      if (textBox) {
        textBox.value = filterValue;
        window.addEventListener('load', () => {
          filterCallback();
        });
      }
    }
  },

  /**
   * Initialize Bootstrap tooltips for all elements with data-bs-toggle="tooltip"
   */
  initTooltips() {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map((tooltipTriggerEl) => {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  },

  /**
   * Get URL prefix based on whether running locally or in production
   * @param {string} localPort - Port number for local development (default: '8080')
   * @param {string} productionUrl - Production URL (default: 'https://watmildon.org/')
   * @returns {string} The URL prefix to use for data files
   */
  getUrlPrefix(localPort = '8080', productionUrl = 'https://watmildon.org/') {
    const isLocal = new URL(location.href).port === localPort;
    return isLocal ? `http://127.0.0.1:${localPort}/data/` : productionUrl;
  },

  /**
   * Create an empty GeoJSON source structure
   * @returns {Object} Empty GeoJSON FeatureCollection
   */
  createEmptyGeoJSON() {
    return {
      "type": "FeatureCollection",
      "features": []
    };
  },

  /**
   * Update visibility of map layers
   * @param {Object} map - MapLibre GL map instance
   * @param {string} checkboxId - ID of the checkbox element
   * @param {string|Array<string>} layerNames - Layer name(s) to toggle
   */
  updateLayerVisibility(map, checkboxId, layerNames) {
    const checkBox = document.getElementById(checkboxId);
    if (!checkBox) return;

    const layers = Array.isArray(layerNames) ? layerNames : [layerNames];
    const visibility = checkBox.checked ? "visible" : "none";

    layers.forEach(layer => {
      try {
        map.setLayoutProperty(layer, "visibility", visibility);
      } catch (e) {
        console.warn(`Could not set visibility on layer ${layer}:`, e);
      }
    });
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.MapUtils = MapUtils;
}
