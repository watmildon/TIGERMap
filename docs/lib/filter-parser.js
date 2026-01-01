/**
 * TIGERMap Filter Parser Library
 * Shared filter parsing and application logic for all map variants
 *
 * This library provides a unified interface for parsing human-friendly filter
 * expressions and converting them to MapLibre GL filter expressions.
 */

class FilterParser {
  /**
   * Create a new FilterParser instance
   * @param {Object} config - Configuration options
   * @param {boolean} config.autoAppendTigerReviewed - Auto-append tiger:reviewed=no filter (default: false)
   * @param {Array<string>} config.targetLayers - Layer names to apply filters to (default: ['tigerReview'])
   */
  constructor(config = {}) {
    this.config = {
      autoAppendTigerReviewed: false,
      targetLayers: ['tigerReview'],
      ...config
    };
  }

  /**
   * Parse a filter string into a MapLibre GL filter expression
   * @param {string} filterText - The filter string to parse
   * @returns {Array} MapLibre GL filter expression
   *
   * Supported syntax:
   * - key                    : has key
   * - !key                   : does not have key
   * - key=value              : key equals value
   * - key=value1,value2      : key equals value1 OR value2
   * - key!=value             : key does not equal value
   * - key!=value1,value2     : key not in (value1, value2)
   * - key>value              : numeric greater than
   * - key<value              : numeric less than
   * - key1;key2              : key1 AND key2 (semicolon separates conditions)
   * - key=*                  : has key (wildcard, converted to just 'key')
   */
  parseFilter(filterText) {
    if (!filterText || filterText === "") {
      return null;
    }

    // Auto-append tiger:reviewed=no if configured and not already present
    if (this.config.autoAppendTigerReviewed && !filterText.includes("tiger:reviewed")) {
      filterText = filterText.concat(";tiger:reviewed=no");
    }

    // Convert key=* to key (wildcard syntax)
    filterText = filterText.replace(/=\*/g, "");

    // Split by semicolon to get individual conditions
    const keyParts = filterText.split(";");
    const filterArray = ["all"];

    for (const part of keyParts) {
      if (!part) continue; // Skip empty parts

      if (part.includes("!=")) {
        // Not-equals comparison
        const parts = part.split("!=");
        let values = parts[1].includes(",") ? parts[1].split(",") : parts[1];
        const filterPart = ["match", ["to-string", ["get", parts[0]]], values, false, true];
        filterArray.push(filterPart);
      }
      else if (part.includes("<") || part.includes(">")) {
        // Numeric comparison (< or >)
        const separator = /([<>=]+)/.exec(part)[1];
        const parts = part.split(separator);
        let values = parts[1].includes(",") ? parts[1].split(",") : parts[1];
        const filterPart = [separator, ["to-number", ["get", parts[0]]], ["to-number", values]];
        filterArray.push(filterPart);
      }
      else if (part.includes("=")) {
        // Equals comparison
        const parts = part.split("=");
        let values = parts[1].includes(",") ? parts[1].split(",") : parts[1];
        const filterPart = ["match", ["to-string", ["get", parts[0]]], values, true, false];
        filterArray.push(filterPart);
      }
      else {
        // Key presence/absence
        if (part[0] === "!") {
          filterArray.push(['!', ["has", part.substring(1)]]);
        } else {
          filterArray.push(["has", part]);
        }
      }
    }

    return filterArray;
  }

  /**
   * Apply a filter to the map
   * @param {string} filterText - The filter string to apply
   * @param {Object} map - The MapLibre GL map instance
   * @param {Array<string>} layers - Optional layer names to filter (overrides config.targetLayers)
   * @returns {boolean} True if filter was applied, false if cleared
   */
  applyFilter(filterText, map, layers = null) {
    const targetLayers = layers || this.config.targetLayers;

    if (!filterText || filterText === "") {
      this.clearFilter(map, targetLayers);
      return false;
    }

    // Update URL with filter parameter
    this._updateURL(filterText);

    // Parse and apply the filter
    const filterExpression = this.parseFilter(filterText);

    if (filterExpression) {
      targetLayers.forEach(layer => {
        try {
          map.setFilter(layer, filterExpression);
        } catch (e) {
          console.warn(`Could not set filter on layer ${layer}:`, e);
        }
      });
    }

    return true;
  }

  /**
   * Clear all filters from the map
   * @param {Object} map - The MapLibre GL map instance
   * @param {Array<string>} layers - Optional layer names to clear (overrides config.targetLayers)
   */
  clearFilter(map, layers = null) {
    const targetLayers = layers || this.config.targetLayers;

    // Remove filter parameter from URL
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    params.delete('filter');
    url.search = params.toString();
    window.history.replaceState({}, '', url.toString());

    // Clear filters from layers
    targetLayers.forEach(layer => {
      try {
        map.setFilter(layer, null);
      } catch (e) {
        console.warn(`Could not clear filter on layer ${layer}:`, e);
      }
    });

    // Clear the filter textbox if it exists
    const filterTextBox = document.getElementById("filterTextBox");
    if (filterTextBox) {
      filterTextBox.value = "";
    }
  }

  /**
   * Update the URL with the current filter
   * @private
   * @param {string} filterText - The filter text to add to URL
   */
  _updateURL(filterText) {
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set('filter', encodeURIComponent(filterText));
    const newURL = `${window.location.pathname}?${queryParams.toString()}${window.location.hash}`;
    window.history.replaceState({}, '', newURL);
  }

  /**
   * Get filter value from URL query parameter
   * @returns {string|null} The filter value from URL, or null if not present
   */
  static getFilterFromURL() {
    const url = new URL(window.location.href);
    return url.searchParams.has('filter')
      ? decodeURIComponent(url.searchParams.get('filter'))
      : null;
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.FilterParser = FilterParser;
}
