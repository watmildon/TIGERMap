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
   * - @timestamp>2025-01-01  : last edited after a date (YYYY, YYYY-MM or YYYY-MM-DD, UTC)
   * - @timestamp<10y         : last edited more than 10 years ago (units: d, w, m, y)
   * - @timestamp>30d         : last edited within the last 30 days
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
        const seconds = parts[0] === "@timestamp" ? FilterParser.parseTimeValue(parts[1]) : null;
        if (seconds !== null) {
          filterArray.push(FilterParser.timestampCondition(separator, seconds));
          continue;
        }
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
   * Convert a date or age to Unix seconds, the unit of the tiles' @timestamp.
   * Accepts YYYY, YYYY-MM or YYYY-MM-DD (UTC), or an age before now such as
   * 30d, 6w, 3m or 10y. Returns null for anything else (e.g. a raw number).
   * @param {string} text - The value to convert
   * @returns {number|null} Unix seconds, or null if not a date or age
   */
  static parseTimeValue(text) {
    const value = String(text).trim();

    const date = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/.exec(value);
    if (date) {
      const [, y, m = "1", d = "1"] = date;
      return Math.floor(Date.UTC(Number(y), Number(m) - 1, Number(d)) / 1000);
    }

    const age = /^(\d+)\s*([dwmy])$/i.exec(value);
    if (age) {
      const amount = Number(age[1]);
      const t = new Date();
      switch (age[2].toLowerCase()) {
        case "d": t.setUTCDate(t.getUTCDate() - amount); break;
        case "w": t.setUTCDate(t.getUTCDate() - 7 * amount); break;
        case "m": t.setUTCMonth(t.getUTCMonth() - amount); break;
        case "y": t.setUTCFullYear(t.getUTCFullYear() - amount); break;
      }
      return Math.floor(t.getTime() / 1000);
    }

    return null;
  }

  /**
   * Build a MapLibre condition comparing @timestamp with a time.
   * Features without a plausible timestamp never match: a few low-zoom tiles
   * carry corrupted values (street names, 3-7 digit numbers), and every OSM
   * edit is later than 2004-01-01.
   * @param {string} op - Comparison operator: <, >, <=, >= or ==
   * @param {number} seconds - Unix seconds to compare with
   * @returns {Array} MapLibre GL filter expression
   */
  static timestampCondition(op, seconds) {
    const ts = ["to-number", ["get", "@timestamp"], 0];
    return ["all", [">=", ts, FilterParser.MIN_OSM_TIMESTAMP], [op, ts, seconds]];
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
    this.updateURL(filterText);

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
   * @param {string} filterText - The filter text to add to URL
   */
  updateURL(filterText) {
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

// 2004-01-01T00:00:00Z in Unix seconds; no OSM edit predates it
FilterParser.MIN_OSM_TIMESTAMP = 1072915200;

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.FilterParser = FilterParser;
}
