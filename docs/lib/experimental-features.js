/**
 * TIGERMap Experimental Features Library
 * Shared experimental visualization features for all map variants
 *
 * Requires: Turf.js library for voronoi functionality
 */

const ExperimentalFeatures = {
  /**
   * Color features based on unique values of a property
   * @param {Object} map - MapLibre GL map instance
   * @param {string} propertyToColor - The property name to color by
   * @param {Array<string>} layerNames - Array of layer names to apply coloring to (e.g., ['allFeatures', 'allFeatures-node'])
   */
  addColorProperty(map, propertyToColor, layerNames = ['allFeatures', 'allFeatures-node']) {
    const featuresInBoundingBox = map.queryRenderedFeatures();

    // Desaturate the basemap to make colored features stand out
    map.setPaintProperty('osmcarto', 'raster-saturation', -1);

    let paintStyle = ["match", ["get", propertyToColor]];
    const propUniq = [];

    // Collect unique values for the property
    for (const feature of featuresInBoundingBox) {
      const prop = feature.properties[propertyToColor];
      if (prop !== undefined) {
        if (!propUniq.includes(prop)) {
          propUniq.push(prop);
        }
      }
    }

    // Assign a color to each unique value
    for (const propVal of propUniq) {
      paintStyle.push(propVal);
      paintStyle.push(this._computeColor(propVal));
    }

    // Add default color for unmatched values
    paintStyle.push("gray");

    // Apply color styling to specified layers
    layerNames.forEach(layerName => {
      try {
        if (layerName.includes('-node')) {
          map.setPaintProperty(layerName, 'circle-color', paintStyle);
        } else {
          map.setPaintProperty(layerName, 'line-color', paintStyle);
        }
      } catch (e) {
        console.warn(`Could not set color on layer ${layerName}:`, e);
      }
    });
  },

  /**
   * Generate and display Voronoi diagram for features matching a filter
   * @param {Object} map - MapLibre GL map instance
   * @param {string} attributeToVoronoi - Filter in format "key=value" (e.g., "cuisine=pizza")
   */
  addVoronoi(map, attributeToVoronoi) {
    if (typeof turf === 'undefined') {
      console.error('Turf.js library is required for Voronoi diagrams');
      return;
    }

    const { featureCollection } = turf.helpers;
    const bounds = map.getBounds();

    const options = {
      bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
    };

    const [key, value] = attributeToVoronoi.split('=');

    // Query all rendered features and filter by the key=value
    const features = map.queryRenderedFeatures();
    const filteredFeatures = features.filter((feat) => {
      return feat.properties && feat.properties[key] === value;
    });

    const mixedFeatures = {
      type: 'FeatureCollection',
      features: filteredFeatures.map((feat) => ({
        type: 'Feature',
        geometry: feat.geometry,
      })),
    };

    // Initialize arrays to store nodes and centroids
    const nodes = [];
    const centroids = [];

    // Iterate through the features
    mixedFeatures.features.forEach((feature) => {
      if (feature.geometry.type === 'Point') {
        // It's a node, keep it
        nodes.push(feature);
      } else if (feature.geometry.type === 'Polygon') {
        // Only deal with simple polygons for now
        if (feature.geometry.coordinates.length == 1) {
          // Compute centroid for the polygon
          const centroid = turf.centroid(feature);
          centroids.push(centroid);
        }
        // Otherwise, skip this polygon (it has inner rings)
      }
      // Discard linestrings (ignore them)
    });

    // Create a new feature collection with nodes and centroids
    const onlyNodesCentroids = featureCollection([...nodes, ...centroids]);

    const voronoiPolygons = turf.voronoi(onlyNodesCentroids, options);
    const filteredVoronoiPolygons = voronoiPolygons.features.filter((feat) => feat !== null);

    const geojsonVoronoi = {
      type: 'FeatureCollection',
      features: filteredVoronoiPolygons.map((feat) => ({
        type: 'Feature',
        geometry: feat.geometry,
      })),
    };

    // Update the voronoi data source
    const voronoiSource = map.getSource("voronoi");
    if (voronoiSource) {
      voronoiSource.setData(geojsonVoronoi);
    } else {
      console.warn('Voronoi source not found in map');
    }
  },

  /**
   * Reset color styling to default
   * @param {Object} map - MapLibre GL map instance
   * @param {Array<string>} layerNames - Array of layer names to reset
   * @param {string} defaultColor - Default color to use (default: '#000000')
   */
  resetColors(map, layerNames = ['allFeatures', 'allFeatures-node'], defaultColor = '#000000') {
    layerNames.forEach(layerName => {
      try {
        if (layerName.includes('-node')) {
          map.setPaintProperty(layerName, 'circle-color', defaultColor);
        } else {
          map.setPaintProperty(layerName, 'line-color', defaultColor);
        }
      } catch (e) {
        console.warn(`Could not reset color on layer ${layerName}:`, e);
      }
    });

    // Reset basemap saturation
    try {
      map.setPaintProperty('osmcarto', 'raster-saturation', 0);
    } catch (e) {
      console.warn('Could not reset basemap saturation:', e);
    }
  },

  /**
   * Clear Voronoi diagram
   * @param {Object} map - MapLibre GL map instance
   */
  clearVoronoi(map) {
    const emptyGeoJson = {
      "type": "FeatureCollection",
      "features": []
    };

    const voronoiSource = map.getSource("voronoi");
    if (voronoiSource) {
      voronoiSource.setData(emptyGeoJson);
    }
  },

  /**
   * Compute a consistent color for a value using hash function
   * @private
   * @param {*} value - Value to hash into a color
   * @returns {string} Hex color code
   */
  _computeColor(value) {
    // Color palette generated using https://mokole.com/palette.html
    const goodColors = [
      "#191970", // midnightblue
      "#006400", // darkgreen
      "#ff4500", // orangered
      "#ffd700", // gold
      "#00ff00", // lime
      "#0000FF", // blue
      "#b0e0e6", // powderblue
      "#ff1493", // deeppink
      "#4b0082", // indigo
      "#8b4513"  // saddlebrown
    ];

    let hash = 0;
    const str = value.toString();

    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) & 0xfffffff; // Modulo to keep it within bounds
    }

    return goodColors[hash % goodColors.length];
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.ExperimentalFeatures = ExperimentalFeatures;
}
