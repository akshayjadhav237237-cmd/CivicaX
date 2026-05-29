/**
 * smapSoil.js — NASA SMAP L3 Soil Moisture Fetcher
 *
 * Fetches soil moisture data from the NASA SMAP satellite
 * (Soil Moisture Active Passive) Level-3 Enhanced product (SPL3SMP_E).
 *
 * Flow:
 *  1. Search NASA CMR for the latest SPL3SMP_E granule.
 *  2. If NASA_EARTHDATA_TOKEN is present, fetch the real soil moisture
 *     value via the OPeNDAP ASCII endpoint with Bearer auth.
 *  3. If the token is absent OR the fetch fails, fall back to 0.35 m³/m³.
 *
 * OPeNDAP ASCII endpoint:
 *   https://opendap.earthdata.nasa.gov/providers/NSIDC_ECS/collections/
 *   SPL3SMP_E.005/granules/<filename>.h5.ascii?
 *   Soil_Moisture_Retrieval_Data_AM/soil_moisture[ROW][COL]
 *
 * EASE-2.0 9km grid indices for Kedarnath basin (lat=30.55, lon=78.95):
 *   ROW ≈ 536   (= floor((90 - 30.55) * 1624/180))
 *   COL ≈ 2774  (= floor((78.95 + 180) * 3856/360))
 *
 * Docs: https://nsidc.org/data/SPL3SMP_E
 */

const logger = require('../../config/logger');
const { center, bbox, soil } = require('../../shared/kedarnath.config');

const CMR_SEARCH_URL   = 'https://cmr.earthdata.nasa.gov/search/granules.json';
const OPENDAP_BASE_URL = 'https://opendap.earthdata.nasa.gov/providers/NSIDC_ECS/collections/SPL3SMP_E.005/granules';
const SMAP_SHORT_NAME  = 'SPL3SMP_E';
const TIMEOUT_MS       = 20000;

// EASE-2.0 9km grid indices for Kedarnath basin
const KEDARNATH_ROW = 536;
const KEDARNATH_COL = 2774;

// Fallback per user spec — used only when token is absent or OPeNDAP fails
const FALLBACK_SOIL_MOISTURE = soil.defaultFallback; // 0.35 m³/m³

// ─── Helpers ────────────────────────────────────────────────────────────────

function computeSaturationPct(m3) {
  const fieldSaturation = 0.45;
  return Math.min(100, Math.round((m3 / fieldSaturation) * 100));
}

function classifySoilStatus(m3) {
  if (m3 >= soil.critical) return 'saturated';
  if (m3 >= soil.warning)  return 'near_saturation';
  if (m3 >= soil.normal)   return 'moderate';
  return 'dry';
}

/**
 * Extract OPeNDAP-compatible granule filename from CMR entry.
 * CMR returns the title in the form: SMAP_L3_SM_P_E_YYYYMMDD_R18290_001
 * We append .h5 to build the OPeNDAP filename.
 */
function extractGranuleFilename(granule) {
  // Try direct OPeNDAP link from CMR links array first
  const links = granule.links || [];
  const opendapLink = links.find(
    (l) => l.href && (l.href.includes('opendap.earthdata.nasa.gov') || l.rel?.includes('service'))
  );
  if (opendapLink) {
    // Extract filename from the href
    const parts = opendapLink.href.split('/');
    const filename = parts[parts.length - 1].replace(/\?.*$/, '');
    if (filename.endsWith('.h5')) return filename;
  }

  // Fall back to constructing filename from granule title
  const title = granule.title || granule.producer_granule_id || '';
  const match = title.match(/(SMAP_L3_SM_P_E_\d{8}_\w+)/);
  if (match) return `${match[1]}.h5`;

  return null;
}

/**
 * Fetch the actual soil moisture value for Kedarnath from OPeNDAP ASCII endpoint.
 * Returns a number (m³/m³) or null on failure.
 */
async function fetchSMAPValueFromOpendap(granuleFilename, token) {
  const url =
    `${OPENDAP_BASE_URL}/${granuleFilename}.ascii` +
    `?Soil_Moisture_Retrieval_Data_AM/soil_moisture[${KEDARNATH_ROW}][${KEDARNATH_COL}]`;

  logger.info(`[SMAP] Fetching real value from OPeNDAP: ${url}`);

  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'CivicaX-DisasterPipeline/1.0',
      Accept: 'text/plain, */*',
    },
  });

  if (!res.ok) {
    throw new Error(`OPeNDAP HTTP ${res.status}: ${res.statusText}`);
  }

  const text = await res.text();
  logger.info(`[SMAP] OPeNDAP raw response: ${text.slice(0, 200)}`);

  // Parse ASCII response — last line format: "[0][0], 0.3421"
  const match = text.match(/\[0\]\[0\],\s*([-\d.eE+]+)/);
  if (!match) {
    throw new Error(`Could not parse OPeNDAP ASCII response: ${text.slice(0, 100)}`);
  }

  const value = parseFloat(match[1]);

  // SMAP fill value is -9999.0 — also reject physically impossible values
  if (!isFinite(value) || value < 0 || value > 1.0) {
    logger.warn(`[SMAP] OPeNDAP returned fill/invalid value ${value} for Kedarnath cell — likely snow/ice covered`);
    return null;
  }

  return value;
}

// ─── Main export ────────────────────────────────────────────────────────────

/**
 * Fetch the most recent SMAP soil moisture reading for the Mandakini basin.
 */
async function fetchSMAPSoil() {
  const earthdataToken = process.env.NASA_EARTHDATA_TOKEN;

  try {
    // Step 1 — CMR granule search
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const temporal = `${threeDaysAgo.toISOString()},${now.toISOString()}`;
    const bboxStr  = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;

    const params = new URLSearchParams({
      short_name:    SMAP_SHORT_NAME,
      temporal,
      bounding_box:  bboxStr,
      sort_key:      '-start_date',
      page_size:     '1',
    });

    logger.info('[SMAP] Querying CMR for latest soil moisture granule...');
    const cmrRes = await fetch(`${CMR_SEARCH_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'CivicaX-DisasterPipeline/1.0', Accept: 'application/json' },
    });

    if (!cmrRes.ok) throw new Error(`CMR HTTP ${cmrRes.status}: ${cmrRes.statusText}`);

    const data    = await cmrRes.json();
    const entries = data?.feed?.entry || [];

    if (entries.length === 0) {
      logger.warn('[SMAP] No recent granules found in CMR — using fallback');
      return buildFallback('No recent SMAP granules found in CMR');
    }

    const granule     = entries[0];
    const granuleDate = granule.time_start || null;
    logger.info(`[SMAP] Granule found: ${granule.title || granule.id} | Date: ${granuleDate}`);

    // Step 2 — Attempt real data fetch if token is configured
    if (earthdataToken) {
      const granuleFilename = extractGranuleFilename(granule);

      if (granuleFilename) {
        try {
          const realValue = await fetchSMAPValueFromOpendap(granuleFilename, earthdataToken);

          if (realValue !== null) {
            logger.info(
              `[SMAP] ✅ REAL soil moisture for Kedarnath basin: ${realValue.toFixed(4)} m³/m³` +
              ` | saturation: ${computeSaturationPct(realValue)}%` +
              ` | status: ${classifySoilStatus(realValue)}` +
              ` | source: OPeNDAP/${granuleFilename}`
            );
            return {
              source:          'SMAP',
              soilMoistureM3:  realValue,
              saturationPct:   computeSaturationPct(realValue),
              status:          classifySoilStatus(realValue),
              granuleDate,
              fetchedAt:       new Date().toISOString(),
              fallbackReason:  null,
            };
          }

          // OPeNDAP returned fill value — cell likely snow/ice covered
          logger.warn('[SMAP] Fill value at Kedarnath cell — using fallback');
          return buildFallback('OPeNDAP cell value is fill (snow/ice covered)', granuleDate);

        } catch (opendapErr) {
          logger.warn(`[SMAP] OPeNDAP fetch failed: ${opendapErr.message} — using fallback`);
          return buildFallback(`OPeNDAP error: ${opendapErr.message}`, granuleDate);
        }
      } else {
        logger.warn('[SMAP] Could not extract granule filename — using fallback');
        return buildFallback('Could not extract granule filename from CMR', granuleDate);
      }
    }

    // Step 3 — No token: use fallback but record the granule date for provenance
    logger.info('[SMAP] NASA_EARTHDATA_TOKEN not set — using default fallback (0.35 m³/m³)');
    return buildFallback('NASA_EARTHDATA_TOKEN not configured', granuleDate);

  } catch (err) {
    logger.error(`[SMAP] ❌ Fetch failed: ${err.message} — using default fallback`);
    return buildFallback(err.message);
  }
}

function buildFallback(reason, granuleDate = null) {
  const m3 = FALLBACK_SOIL_MOISTURE;
  return {
    source:         'default_fallback',
    soilMoistureM3: m3,
    saturationPct:  computeSaturationPct(m3),
    status:         classifySoilStatus(m3),
    granuleDate,
    fetchedAt:      new Date().toISOString(),
    fallbackReason: reason,
  };
}

module.exports = { fetchSMAPSoil };
