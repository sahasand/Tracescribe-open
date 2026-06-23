// DataLoader Module
// Handles CSV file loading and parsing using PapaParse
// Includes embedded sample data for direct file:// access

/**
 * Embedded sample clinical trial data
 * This allows the dashboard to work when opened directly in browser (file://)
 */
const EMBEDDED_SAMPLE_DATA = [
  // Treatment arm patients (6 total) - slightly higher AE rate, more diverse AE types
  { patient_id: 'P001', treatment_group: 'Treatment', site: 'Site_A', age: 45, sex: 'M', bmi: 25.3, baseline: 85, week4: 72, week8: 65, week12: 58, adverse_event: 0, completed: 1,
    adverse_events: [{ type: 'Fatigue', severity: 'Mild' }] },

  { patient_id: 'P003', treatment_group: 'Treatment', site: 'Site_B', age: 38, sex: 'M', bmi: 23.5, baseline: 92, week4: 78, week8: 70, week12: 62, adverse_event: 1, completed: 0,
    adverse_events: [
      { type: 'Nausea', severity: 'Moderate' },
      { type: 'Dizziness', severity: 'Severe' },
      { type: 'Fatigue', severity: 'Moderate' }
    ] },

  { patient_id: 'P005', treatment_group: 'Treatment', site: 'Site_A', age: 44, sex: 'M', bmi: 26.8, baseline: 90, week4: 75, week8: 68, week12: 60, adverse_event: 0, completed: 1,
    adverse_events: [{ type: 'Headache', severity: 'Mild' }] },

  { patient_id: 'P007', treatment_group: 'Treatment', site: 'Site_B', age: 49, sex: 'M', bmi: 29.4, baseline: 88, week4: 74, week8: 66, week12: 59, adverse_event: 0, completed: 1,
    adverse_events: [
      { type: 'Diarrhea', severity: 'Mild' },
      { type: 'Headache', severity: 'Mild' }
    ] },

  { patient_id: 'P009', treatment_group: 'Treatment', site: 'Site_C', age: 58, sex: 'M', bmi: 27.6, baseline: 82, week4: 70, week8: 63, week12: 55, adverse_event: 0, completed: 1,
    adverse_events: [] },

  { patient_id: 'P011', treatment_group: 'Treatment', site: 'Site_A', age: 63, sex: 'M', bmi: 24.2, baseline: 78, week4: 65, week8: 58, week12: 52, adverse_event: 0, completed: 1,
    adverse_events: [
      { type: 'Fatigue', severity: 'Mild' },
      { type: 'Insomnia', severity: 'Moderate' }
    ] },

  // Placebo arm patients (6 total) - lower AE rate, milder AEs
  { patient_id: 'P002', treatment_group: 'Placebo', site: 'Site_A', age: 52, sex: 'F', bmi: 28.1, baseline: 88, week4: 85, week8: 84, week12: 82, adverse_event: 0, completed: 1,
    adverse_events: [{ type: 'Headache', severity: 'Mild' }] },

  { patient_id: 'P004', treatment_group: 'Placebo', site: 'Site_B', age: 61, sex: 'F', bmi: 31.2, baseline: 79, week4: 78, week8: 77, week12: 76, adverse_event: 0, completed: 1,
    adverse_events: [] },

  { patient_id: 'P006', treatment_group: 'Placebo', site: 'Site_C', age: 55, sex: 'F', bmi: 24.9, baseline: 85, week4: 84, week8: 83, week12: 81, adverse_event: 0, completed: 1,
    adverse_events: [{ type: 'Fatigue', severity: 'Mild' }] },

  { patient_id: 'P008', treatment_group: 'Placebo', site: 'Site_A', age: 42, sex: 'F', bmi: 22.1, baseline: 91, week4: 90, week8: 88, week12: 87, adverse_event: 1, completed: 0,
    adverse_events: [
      { type: 'Nausea', severity: 'Moderate' },
      { type: 'Headache', severity: 'Moderate' }
    ] },

  { patient_id: 'P010', treatment_group: 'Placebo', site: 'Site_B', age: 47, sex: 'F', bmi: 25.8, baseline: 86, week4: 85, week8: 84, week12: 83, adverse_event: 0, completed: 1,
    adverse_events: [] },

  { patient_id: 'P012', treatment_group: 'Placebo', site: 'Site_C', age: 39, sex: 'F', bmi: 27.3, baseline: 94, week4: 92, week8: 91, week12: 89, adverse_event: 0, completed: 1,
    adverse_events: [{ type: 'Insomnia', severity: 'Mild' }] }
];

/**
 * Load and parse the clinical trial CSV data
 * Falls back to embedded data if CSV cannot be loaded (e.g., file:// protocol)
 * @returns {Promise<Array>} Promise that resolves to array of enriched data objects
 */
async function loadClinicalData() {
  return new Promise((resolve, reject) => {
    const csvPath = 'sample-data/clinical_trial_sample.csv';

    // Check if we're running from file:// protocol (no server)
    const isFileProtocol = window.location.protocol === 'file:';

    if (isFileProtocol) {
      console.log('Running from file:// protocol - using embedded sample data');
      try {
        const enrichedData = enrichData(EMBEDDED_SAMPLE_DATA);
        console.log(`Successfully loaded ${enrichedData.length} patient records (embedded)`);
        resolve(enrichedData);
      } catch (error) {
        reject(new Error(`Error processing embedded data: ${error.message}`));
      }
      return;
    }

    // Try to load from CSV file (works with http:// server)
    Papa.parse(csvPath, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: function(results) {
        try {
          // Check for parsing errors
          if (results.errors && results.errors.length > 0) {
            console.warn('CSV parsing errors, falling back to embedded data:', results.errors);
            const enrichedData = enrichData(EMBEDDED_SAMPLE_DATA);
            resolve(enrichedData);
            return;
          }

          // Check if data exists
          if (!results.data || results.data.length === 0) {
            console.warn('No data in CSV, falling back to embedded data');
            const enrichedData = enrichData(EMBEDDED_SAMPLE_DATA);
            resolve(enrichedData);
            return;
          }

          // Enrich the data with calculated fields
          const enrichedData = enrichData(results.data);

          console.log(`Successfully loaded ${enrichedData.length} patient records from CSV`);
          resolve(enrichedData);

        } catch (error) {
          console.warn('Error processing CSV, falling back to embedded data:', error);
          const enrichedData = enrichData(EMBEDDED_SAMPLE_DATA);
          resolve(enrichedData);
        }
      },
      error: function(error) {
        console.warn('Failed to load CSV, falling back to embedded data:', error);
        try {
          const enrichedData = enrichData(EMBEDDED_SAMPLE_DATA);
          resolve(enrichedData);
        } catch (e) {
          reject(new Error(`Failed to load data: ${e.message}`));
        }
      }
    });
  });
}

/**
 * Enrich data with calculated fields
 * @param {Array} data - Raw parsed CSV data
 * @returns {Array} - Enriched data with additional calculated fields
 */
function enrichData(data) {
  // Calculate median baseline for categorization
  const baselineValues = data
    .map(row => row.baseline)
    .filter(val => val !== null && val !== undefined && !isNaN(val))
    .sort((a, b) => a - b);

  // Uses median() from stats.js (loaded before any data load); avoids a duplicate impl
  const medianBaseline = median(baselineValues);

  // Create a map of adverse_events from embedded data for lookup
  const aeMap = {};
  EMBEDDED_SAMPLE_DATA.forEach(p => {
    aeMap[p.patient_id] = p.adverse_events || [];
  });

  return data.map(row => {
    // Skip rows with missing critical data
    if (!row.baseline || !row.week12) {
      return row;
    }

    // Calculate change from baseline to week 12
    const change = row.week12 - row.baseline;

    // Calculate percent change from baseline to week 12
    const pctChange = (change / row.baseline) * 100;

    // Categorize age into groups
    const ageGroup = row.age < 50 ? '<50 years' : '≥50 years';

    // Categorize baseline as below or above median
    const baselineCategory = row.baseline < medianBaseline ? 'Below Median' : 'Above Median';

    // Get adverse_events from embedded data if not present in row
    const adverse_events = row.adverse_events || aeMap[row.patient_id] || [];

    return {
      ...row,
      change_week12: parseFloat(change.toFixed(2)),
      pct_change_week12: parseFloat(pctChange.toFixed(2)),
      age_group: ageGroup,
      baseline_category: baselineCategory,
      adverse_events: adverse_events
    };
  });
}

// ============================================================================
// IMAGING STUDY DATA
// ============================================================================

/**
 * Embedded imaging diagnostic study data
 * 50 patients with disease status and imaging results
 */
const IMAGING_STUDY_DATA = [
  { patient_id: 'IMG001', age: 62, sex: 'F', site: 'Site_A', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 92, hamilton_score: 18, mmse_score: 26, updrs_score: 42, predicted_probability: 0.87, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG002', age: 58, sex: 'M', site: 'Site_A', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 88, hamilton_score: 22, mmse_score: 24, updrs_score: 55, predicted_probability: 0.82, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG003', age: 71, sex: 'F', site: 'Site_B', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 95, hamilton_score: 16, mmse_score: 27, updrs_score: 38, predicted_probability: 0.91, adverse_event: 1, ae_severity: 'Mild' },
  { patient_id: 'IMG004', age: 54, sex: 'M', site: 'Site_A', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 85, hamilton_score: 8, mmse_score: 29, updrs_score: 12, predicted_probability: 0.18, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG005', age: 67, sex: 'F', site: 'Site_C', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 91, hamilton_score: 20, mmse_score: 25, updrs_score: 48, predicted_probability: 0.85, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG006', age: 49, sex: 'M', site: 'Site_B', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 82, hamilton_score: 6, mmse_score: 30, updrs_score: 8, predicted_probability: 0.22, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG007', age: 73, sex: 'F', site: 'Site_A', disease_status: 'Positive', imaging_result: 'Negative', confidence_score: 68, hamilton_score: 24, mmse_score: 22, updrs_score: 62, predicted_probability: 0.38, adverse_event: 1, ae_severity: 'Moderate' },
  { patient_id: 'IMG008', age: 56, sex: 'M', site: 'Site_C', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 88, hamilton_score: 5, mmse_score: 28, updrs_score: 10, predicted_probability: 0.15, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG009', age: 64, sex: 'F', site: 'Site_B', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 94, hamilton_score: 19, mmse_score: 26, updrs_score: 44, predicted_probability: 0.89, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG010', age: 52, sex: 'M', site: 'Site_A', disease_status: 'Negative', imaging_result: 'Positive', confidence_score: 75, hamilton_score: 7, mmse_score: 29, updrs_score: 14, predicted_probability: 0.58, adverse_event: 1, ae_severity: 'Mild' },
  { patient_id: 'IMG011', age: 69, sex: 'F', site: 'Site_C', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 89, hamilton_score: 21, mmse_score: 24, updrs_score: 51, predicted_probability: 0.84, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG012', age: 47, sex: 'M', site: 'Site_B', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 86, hamilton_score: 4, mmse_score: 30, updrs_score: 6, predicted_probability: 0.12, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG013', age: 75, sex: 'F', site: 'Site_A', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 93, hamilton_score: 17, mmse_score: 25, updrs_score: 46, predicted_probability: 0.88, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG014', age: 61, sex: 'M', site: 'Site_C', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 90, hamilton_score: 23, mmse_score: 23, updrs_score: 58, predicted_probability: 0.86, adverse_event: 1, ae_severity: 'Severe' },
  { patient_id: 'IMG015', age: 53, sex: 'F', site: 'Site_B', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 84, hamilton_score: 9, mmse_score: 28, updrs_score: 11, predicted_probability: 0.25, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG016', age: 68, sex: 'M', site: 'Site_A', disease_status: 'Positive', imaging_result: 'Negative', confidence_score: 65, hamilton_score: 25, mmse_score: 21, updrs_score: 67, predicted_probability: 0.35, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG017', age: 55, sex: 'F', site: 'Site_C', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 87, hamilton_score: 6, mmse_score: 29, updrs_score: 9, predicted_probability: 0.14, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG018', age: 72, sex: 'M', site: 'Site_B', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 96, hamilton_score: 15, mmse_score: 27, updrs_score: 36, predicted_probability: 0.93, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG019', age: 50, sex: 'F', site: 'Site_A', disease_status: 'Negative', imaging_result: 'Positive', confidence_score: 72, hamilton_score: 8, mmse_score: 30, updrs_score: 13, predicted_probability: 0.55, adverse_event: 1, ae_severity: 'Mild' },
  { patient_id: 'IMG020', age: 66, sex: 'M', site: 'Site_C', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 92, hamilton_score: 20, mmse_score: 25, updrs_score: 49, predicted_probability: 0.88, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG021', age: 59, sex: 'F', site: 'Site_B', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 88, hamilton_score: 18, mmse_score: 26, updrs_score: 43, predicted_probability: 0.83, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG022', age: 48, sex: 'M', site: 'Site_A', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 83, hamilton_score: 5, mmse_score: 29, updrs_score: 7, predicted_probability: 0.21, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG023', age: 74, sex: 'F', site: 'Site_C', disease_status: 'Positive', imaging_result: 'Negative', confidence_score: 70, hamilton_score: 26, mmse_score: 20, updrs_score: 71, predicted_probability: 0.42, adverse_event: 1, ae_severity: 'Moderate' },
  { patient_id: 'IMG024', age: 57, sex: 'M', site: 'Site_B', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 89, hamilton_score: 7, mmse_score: 28, updrs_score: 10, predicted_probability: 0.11, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG025', age: 63, sex: 'F', site: 'Site_A', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 94, hamilton_score: 19, mmse_score: 26, updrs_score: 45, predicted_probability: 0.90, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG026', age: 51, sex: 'M', site: 'Site_C', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 85, hamilton_score: 6, mmse_score: 30, updrs_score: 8, predicted_probability: 0.19, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG027', age: 70, sex: 'F', site: 'Site_B', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 91, hamilton_score: 21, mmse_score: 24, updrs_score: 52, predicted_probability: 0.86, adverse_event: 1, ae_severity: 'Mild' },
  { patient_id: 'IMG028', age: 46, sex: 'M', site: 'Site_A', disease_status: 'Negative', imaging_result: 'Positive', confidence_score: 76, hamilton_score: 9, mmse_score: 29, updrs_score: 15, predicted_probability: 0.62, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG029', age: 65, sex: 'F', site: 'Site_C', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 93, hamilton_score: 17, mmse_score: 27, updrs_score: 40, predicted_probability: 0.89, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG030', age: 54, sex: 'M', site: 'Site_B', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 87, hamilton_score: 5, mmse_score: 28, updrs_score: 9, predicted_probability: 0.16, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG031', age: 76, sex: 'F', site: 'Site_A', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 90, hamilton_score: 22, mmse_score: 23, updrs_score: 56, predicted_probability: 0.85, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG032', age: 60, sex: 'M', site: 'Site_C', disease_status: 'Positive', imaging_result: 'Negative', confidence_score: 67, hamilton_score: 24, mmse_score: 22, updrs_score: 64, predicted_probability: 0.36, adverse_event: 1, ae_severity: 'Moderate' },
  { patient_id: 'IMG033', age: 52, sex: 'F', site: 'Site_B', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 86, hamilton_score: 8, mmse_score: 29, updrs_score: 11, predicted_probability: 0.24, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG034', age: 67, sex: 'M', site: 'Site_A', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 95, hamilton_score: 16, mmse_score: 27, updrs_score: 39, predicted_probability: 0.92, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG035', age: 49, sex: 'F', site: 'Site_C', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 84, hamilton_score: 7, mmse_score: 30, updrs_score: 10, predicted_probability: 0.20, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG036', age: 71, sex: 'M', site: 'Site_B', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 89, hamilton_score: 20, mmse_score: 25, updrs_score: 47, predicted_probability: 0.84, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG037', age: 56, sex: 'F', site: 'Site_A', disease_status: 'Negative', imaging_result: 'Positive', confidence_score: 74, hamilton_score: 6, mmse_score: 28, updrs_score: 12, predicted_probability: 0.59, adverse_event: 1, ae_severity: 'Mild' },
  { patient_id: 'IMG038', age: 64, sex: 'M', site: 'Site_C', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 92, hamilton_score: 18, mmse_score: 26, updrs_score: 41, predicted_probability: 0.87, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG039', age: 53, sex: 'F', site: 'Site_B', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 88, hamilton_score: 5, mmse_score: 29, updrs_score: 8, predicted_probability: 0.13, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG040', age: 69, sex: 'M', site: 'Site_A', disease_status: 'Positive', imaging_result: 'Negative', confidence_score: 69, hamilton_score: 23, mmse_score: 21, updrs_score: 60, predicted_probability: 0.41, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG041', age: 58, sex: 'F', site: 'Site_C', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 91, hamilton_score: 19, mmse_score: 26, updrs_score: 44, predicted_probability: 0.86, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG042', age: 47, sex: 'M', site: 'Site_B', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 85, hamilton_score: 4, mmse_score: 30, updrs_score: 7, predicted_probability: 0.17, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG043', age: 73, sex: 'F', site: 'Site_A', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 94, hamilton_score: 17, mmse_score: 25, updrs_score: 48, predicted_probability: 0.90, adverse_event: 1, ae_severity: 'Severe' },
  { patient_id: 'IMG044', age: 55, sex: 'M', site: 'Site_C', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 82, hamilton_score: 8, mmse_score: 28, updrs_score: 11, predicted_probability: 0.23, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG045', age: 62, sex: 'F', site: 'Site_B', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 90, hamilton_score: 21, mmse_score: 24, updrs_score: 50, predicted_probability: 0.85, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG046', age: 50, sex: 'M', site: 'Site_A', disease_status: 'Negative', imaging_result: 'Positive', confidence_score: 73, hamilton_score: 7, mmse_score: 29, updrs_score: 13, predicted_probability: 0.54, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG047', age: 68, sex: 'F', site: 'Site_C', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 93, hamilton_score: 18, mmse_score: 27, updrs_score: 42, predicted_probability: 0.88, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG048', age: 54, sex: 'M', site: 'Site_B', disease_status: 'Negative', imaging_result: 'Negative', confidence_score: 86, hamilton_score: 6, mmse_score: 30, updrs_score: 9, predicted_probability: 0.18, adverse_event: 0, ae_severity: null },
  { patient_id: 'IMG049', age: 66, sex: 'F', site: 'Site_A', disease_status: 'Positive', imaging_result: 'Negative', confidence_score: 66, hamilton_score: 25, mmse_score: 22, updrs_score: 65, predicted_probability: 0.33, adverse_event: 1, ae_severity: 'Moderate' },
  { patient_id: 'IMG050', age: 59, sex: 'M', site: 'Site_C', disease_status: 'Positive', imaging_result: 'Positive', confidence_score: 89, hamilton_score: 20, mmse_score: 25, updrs_score: 46, predicted_probability: 0.84, adverse_event: 0, ae_severity: null }
];

/**
 * Load imaging diagnostic study data
 * @returns {Promise<Array>} Promise that resolves to array of imaging study data
 */
async function loadImagingData() {
  return new Promise((resolve) => {
    console.log('Loading imaging study data...');
    console.log(`Successfully loaded ${IMAGING_STUDY_DATA.length} imaging study records`);
    resolve(IMAGING_STUDY_DATA);
  });
}

// ============================================================================
// SURVIVAL STUDY DATA
// ============================================================================

/**
 * Embedded oncology survival study data
 * 40 patients with time-to-event data
 */
const SURVIVAL_STUDY_DATA = [
  { patient_id: 'SRV001', treatment_arm: 'Treatment A', time_months: 24, event: 1, tumor_stage: 'III', biomarker_status: 'Positive', age: 58, sex: 'M', ecog_status: 1 },
  { patient_id: 'SRV002', treatment_arm: 'Treatment A', time_months: 18, event: 1, tumor_stage: 'IV', biomarker_status: 'Negative', age: 65, sex: 'F', ecog_status: 2 },
  { patient_id: 'SRV003', treatment_arm: 'Treatment A', time_months: 30, event: 0, tumor_stage: 'II', biomarker_status: 'Positive', age: 52, sex: 'M', ecog_status: 0 },
  { patient_id: 'SRV004', treatment_arm: 'Treatment A', time_months: 22, event: 1, tumor_stage: 'III', biomarker_status: 'Positive', age: 61, sex: 'F', ecog_status: 1 },
  { patient_id: 'SRV005', treatment_arm: 'Treatment A', time_months: 28, event: 0, tumor_stage: 'II', biomarker_status: 'Positive', age: 48, sex: 'M', ecog_status: 0 },
  { patient_id: 'SRV006', treatment_arm: 'Treatment A', time_months: 16, event: 1, tumor_stage: 'IV', biomarker_status: 'Negative', age: 69, sex: 'F', ecog_status: 2 },
  { patient_id: 'SRV007', treatment_arm: 'Treatment A', time_months: 26, event: 0, tumor_stage: 'III', biomarker_status: 'Positive', age: 55, sex: 'M', ecog_status: 1 },
  { patient_id: 'SRV008', treatment_arm: 'Treatment A', time_months: 20, event: 1, tumor_stage: 'III', biomarker_status: 'Negative', age: 63, sex: 'F', ecog_status: 1 },
  { patient_id: 'SRV009', treatment_arm: 'Treatment A', time_months: 32, event: 0, tumor_stage: 'I', biomarker_status: 'Positive', age: 47, sex: 'M', ecog_status: 0 },
  { patient_id: 'SRV010', treatment_arm: 'Treatment A', time_months: 14, event: 1, tumor_stage: 'IV', biomarker_status: 'Negative', age: 71, sex: 'F', ecog_status: 2 },
  { patient_id: 'SRV011', treatment_arm: 'Treatment A', time_months: 25, event: 0, tumor_stage: 'II', biomarker_status: 'Positive', age: 50, sex: 'M', ecog_status: 0 },
  { patient_id: 'SRV012', treatment_arm: 'Treatment A', time_months: 19, event: 1, tumor_stage: 'III', biomarker_status: 'Positive', age: 60, sex: 'F', ecog_status: 1 },
  { patient_id: 'SRV013', treatment_arm: 'Treatment A', time_months: 29, event: 0, tumor_stage: 'II', biomarker_status: 'Positive', age: 53, sex: 'M', ecog_status: 0 },
  { patient_id: 'SRV014', treatment_arm: 'Treatment A', time_months: 21, event: 1, tumor_stage: 'III', biomarker_status: 'Negative', age: 64, sex: 'F', ecog_status: 1 },
  { patient_id: 'SRV015', treatment_arm: 'Treatment A', time_months: 15, event: 1, tumor_stage: 'IV', biomarker_status: 'Negative', age: 68, sex: 'M', ecog_status: 2 },
  { patient_id: 'SRV016', treatment_arm: 'Treatment A', time_months: 27, event: 0, tumor_stage: 'II', biomarker_status: 'Positive', age: 49, sex: 'F', ecog_status: 0 },
  { patient_id: 'SRV017', treatment_arm: 'Treatment A', time_months: 23, event: 1, tumor_stage: 'III', biomarker_status: 'Positive', age: 57, sex: 'M', ecog_status: 1 },
  { patient_id: 'SRV018', treatment_arm: 'Treatment A', time_months: 31, event: 0, tumor_stage: 'I', biomarker_status: 'Positive', age: 46, sex: 'F', ecog_status: 0 },
  { patient_id: 'SRV019', treatment_arm: 'Treatment A', time_months: 17, event: 1, tumor_stage: 'IV', biomarker_status: 'Negative', age: 70, sex: 'M', ecog_status: 2 },
  { patient_id: 'SRV020', treatment_arm: 'Treatment A', time_months: 24, event: 0, tumor_stage: 'II', biomarker_status: 'Positive', age: 51, sex: 'F', ecog_status: 0 },
  { patient_id: 'SRV021', treatment_arm: 'Treatment B', time_months: 14, event: 1, tumor_stage: 'III', biomarker_status: 'Negative', age: 59, sex: 'M', ecog_status: 1 },
  { patient_id: 'SRV022', treatment_arm: 'Treatment B', time_months: 10, event: 1, tumor_stage: 'IV', biomarker_status: 'Negative', age: 67, sex: 'F', ecog_status: 2 },
  { patient_id: 'SRV023', treatment_arm: 'Treatment B', time_months: 20, event: 0, tumor_stage: 'II', biomarker_status: 'Positive', age: 54, sex: 'M', ecog_status: 0 },
  { patient_id: 'SRV024', treatment_arm: 'Treatment B', time_months: 12, event: 1, tumor_stage: 'IV', biomarker_status: 'Negative', age: 66, sex: 'F', ecog_status: 2 },
  { patient_id: 'SRV025', treatment_arm: 'Treatment B', time_months: 16, event: 0, tumor_stage: 'III', biomarker_status: 'Positive', age: 56, sex: 'M', ecog_status: 1 },
  { patient_id: 'SRV026', treatment_arm: 'Treatment B', time_months: 9, event: 1, tumor_stage: 'IV', biomarker_status: 'Negative', age: 72, sex: 'F', ecog_status: 2 },
  { patient_id: 'SRV027', treatment_arm: 'Treatment B', time_months: 18, event: 0, tumor_stage: 'II', biomarker_status: 'Positive', age: 50, sex: 'M', ecog_status: 0 },
  { patient_id: 'SRV028', treatment_arm: 'Treatment B', time_months: 11, event: 1, tumor_stage: 'IV', biomarker_status: 'Negative', age: 69, sex: 'F', ecog_status: 2 },
  { patient_id: 'SRV029', treatment_arm: 'Treatment B', time_months: 22, event: 0, tumor_stage: 'I', biomarker_status: 'Positive', age: 48, sex: 'M', ecog_status: 0 },
  { patient_id: 'SRV030', treatment_arm: 'Treatment B', time_months: 13, event: 1, tumor_stage: 'III', biomarker_status: 'Negative', age: 62, sex: 'F', ecog_status: 1 },
  { patient_id: 'SRV031', treatment_arm: 'Treatment B', time_months: 15, event: 1, tumor_stage: 'III', biomarker_status: 'Negative', age: 60, sex: 'M', ecog_status: 1 },
  { patient_id: 'SRV032', treatment_arm: 'Treatment B', time_months: 8, event: 1, tumor_stage: 'IV', biomarker_status: 'Negative', age: 73, sex: 'F', ecog_status: 2 },
  { patient_id: 'SRV033', treatment_arm: 'Treatment B', time_months: 19, event: 0, tumor_stage: 'II', biomarker_status: 'Positive', age: 52, sex: 'M', ecog_status: 0 },
  { patient_id: 'SRV034', treatment_arm: 'Treatment B', time_months: 12, event: 1, tumor_stage: 'III', biomarker_status: 'Negative', age: 64, sex: 'F', ecog_status: 1 },
  { patient_id: 'SRV035', treatment_arm: 'Treatment B', time_months: 10, event: 1, tumor_stage: 'IV', biomarker_status: 'Negative', age: 68, sex: 'M', ecog_status: 2 },
  { patient_id: 'SRV036', treatment_arm: 'Treatment B', time_months: 21, event: 0, tumor_stage: 'II', biomarker_status: 'Positive', age: 49, sex: 'F', ecog_status: 0 },
  { patient_id: 'SRV037', treatment_arm: 'Treatment B', time_months: 14, event: 1, tumor_stage: 'III', biomarker_status: 'Negative', age: 61, sex: 'M', ecog_status: 1 },
  { patient_id: 'SRV038', treatment_arm: 'Treatment B', time_months: 17, event: 0, tumor_stage: 'II', biomarker_status: 'Positive', age: 53, sex: 'F', ecog_status: 0 },
  { patient_id: 'SRV039', treatment_arm: 'Treatment B', time_months: 11, event: 1, tumor_stage: 'IV', biomarker_status: 'Negative', age: 70, sex: 'M', ecog_status: 2 },
  { patient_id: 'SRV040', treatment_arm: 'Treatment B', time_months: 16, event: 0, tumor_stage: 'III', biomarker_status: 'Positive', age: 55, sex: 'F', ecog_status: 1 }
];

/**
 * Load oncology survival study data
 * @returns {Promise<Array>} Promise that resolves to array of survival study data
 */
async function loadSurvivalData() {
  return new Promise((resolve) => {
    console.log('Loading survival study data...');
    console.log(`Successfully loaded ${SURVIVAL_STUDY_DATA.length} survival study records`);
    resolve(SURVIVAL_STUDY_DATA);
  });
}

// ============================================================================
// ADVANCED ANALYTICS SHOWCASE DATA
// ============================================================================

/**
 * Comprehensive embedded dataset for Advanced Analytics Showcase
 * 30 patients with longitudinal tumor measurements, response data, and adverse events
 * 50 biomarkers for volcano plot (differential expression analysis)
 * AE co-occurrence matrix for chord diagram
 */
const ADVANCED_ANALYTICS_DATA = {
  // 30 patients with rich oncology trial data
  patients: [
    // ARM A - Experimental (15 patients): 2 CR, 6 PR, 5 SD, 2 PD
    { patient_id: 'P001', randomization_arm: 'Arm_A', age: 62, sex: 'M', ecog_ps: 1, tumor_type: 'NSCLC', treatment_start_day: 0, treatment_end_day: 168, ongoing: true, response_category: 'CR', best_response_pct: -100, final_outcome: 'Ongoing', tumor_baseline: 85, tumor_week4: 60, tumor_week8: 35, tumor_week12: 12, tumor_week16: 0, tumor_week24: 0, response_events: [{ day: 56, type: 'PR', label: 'Partial Response' }, { day: 112, type: 'CR', label: 'Complete Response' }], adverse_events: [{ day: 14, ae_term: 'Fatigue', grade: 2 }, { day: 28, ae_term: 'Rash', grade: 2 }, { day: 56, ae_term: 'Rash', grade: 3 }, { day: 84, ae_term: 'Diarrhea', grade: 1 }] },
    { patient_id: 'P002', randomization_arm: 'Arm_A', age: 58, sex: 'F', ecog_ps: 0, tumor_type: 'Melanoma', treatment_start_day: 0, treatment_end_day: 168, ongoing: true, response_category: 'CR', best_response_pct: -100, final_outcome: 'Ongoing', tumor_baseline: 72, tumor_week4: 48, tumor_week8: 22, tumor_week12: 5, tumor_week16: 0, tumor_week24: 0, response_events: [{ day: 56, type: 'PR', label: 'Partial Response' }, { day: 98, type: 'CR', label: 'Complete Response' }], adverse_events: [{ day: 21, ae_term: 'Rash', grade: 2 }, { day: 42, ae_term: 'Hand-Foot Syndrome', grade: 2 }, { day: 70, ae_term: 'Fatigue', grade: 2 }] },
    { patient_id: 'P003', randomization_arm: 'Arm_A', age: 54, sex: 'M', ecog_ps: 1, tumor_type: 'RCC', treatment_start_day: 0, treatment_end_day: 154, ongoing: true, response_category: 'PR', best_response_pct: -48.5, final_outcome: 'Ongoing', tumor_baseline: 103, tumor_week4: 82, tumor_week8: 65, tumor_week12: 53, tumor_week16: 52, tumor_week24: 53, response_events: [{ day: 56, type: 'PR', label: 'Partial Response' }, { day: 112, type: 'PR', label: 'PR Maintained' }], adverse_events: [{ day: 14, ae_term: 'Fatigue', grade: 2 }, { day: 28, ae_term: 'Hypertension', grade: 2 }, { day: 56, ae_term: 'Proteinuria', grade: 1 }] },
    { patient_id: 'P004', randomization_arm: 'Arm_A', age: 67, sex: 'F', ecog_ps: 1, tumor_type: 'NSCLC', treatment_start_day: 0, treatment_end_day: 140, ongoing: true, response_category: 'PR', best_response_pct: -42.8, final_outcome: 'Ongoing', tumor_baseline: 91, tumor_week4: 70, tumor_week8: 58, tumor_week12: 52, tumor_week16: 54, tumor_week24: 52, response_events: [{ day: 56, type: 'PR', label: 'Partial Response' }, { day: 84, type: 'PR', label: 'PR Maintained' }], adverse_events: [{ day: 21, ae_term: 'Nausea', grade: 1 }, { day: 35, ae_term: 'Decreased Appetite', grade: 2 }, { day: 63, ae_term: 'Fatigue', grade: 2 }] },
    { patient_id: 'P005', randomization_arm: 'Arm_A', age: 61, sex: 'M', ecog_ps: 0, tumor_type: 'CRC', treatment_start_day: 0, treatment_end_day: 126, ongoing: true, response_category: 'PR', best_response_pct: -38.2, final_outcome: 'Ongoing', tumor_baseline: 95, tumor_week4: 78, tumor_week8: 68, tumor_week12: 62, tumor_week16: 59, tumor_week24: 59, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }, { day: 84, type: 'PR', label: 'Partial Response' }], adverse_events: [{ day: 14, ae_term: 'Diarrhea', grade: 2 }, { day: 28, ae_term: 'Nausea', grade: 1 }, { day: 42, ae_term: 'Decreased Appetite', grade: 1 }] },
    { patient_id: 'P006', randomization_arm: 'Arm_A', age: 59, sex: 'F', ecog_ps: 1, tumor_type: 'NSCLC', treatment_start_day: 0, treatment_end_day: 112, ongoing: true, response_category: 'PR', best_response_pct: -35.6, final_outcome: 'Ongoing', tumor_baseline: 87, tumor_week4: 72, tumor_week8: 64, tumor_week12: 56, tumor_week16: 57, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }, { day: 84, type: 'PR', label: 'Partial Response' }], adverse_events: [{ day: 14, ae_term: 'Fatigue', grade: 1 }, { day: 42, ae_term: 'Rash', grade: 1 }] },
    { patient_id: 'P007', randomization_arm: 'Arm_A', age: 55, sex: 'M', ecog_ps: 1, tumor_type: 'Melanoma', treatment_start_day: 0, treatment_end_day: 140, ongoing: true, response_category: 'PR', best_response_pct: -33.9, final_outcome: 'Ongoing', tumor_baseline: 79, tumor_week4: 65, tumor_week8: 58, tumor_week12: 52, tumor_week16: 53, tumor_week24: 52, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }, { day: 84, type: 'PR', label: 'Partial Response' }], adverse_events: [{ day: 21, ae_term: 'Rash', grade: 2 }, { day: 49, ae_term: 'Fatigue', grade: 2 }] },
    { patient_id: 'P008', randomization_arm: 'Arm_A', age: 63, sex: 'F', ecog_ps: 1, tumor_type: 'RCC', treatment_start_day: 0, treatment_end_day: 126, ongoing: true, response_category: 'PR', best_response_pct: -31.4, final_outcome: 'Ongoing', tumor_baseline: 105, tumor_week4: 90, tumor_week8: 80, tumor_week12: 72, tumor_week16: 73, tumor_week24: 72, response_events: [{ day: 84, type: 'PR', label: 'Partial Response' }], adverse_events: [{ day: 14, ae_term: 'Fatigue', grade: 2 }, { day: 28, ae_term: 'Hypertension', grade: 2 }, { day: 56, ae_term: 'Proteinuria', grade: 2 }] },
    { patient_id: 'P009', randomization_arm: 'Arm_A', age: 68, sex: 'M', ecog_ps: 1, tumor_type: 'NSCLC', treatment_start_day: 0, treatment_end_day: 98, ongoing: true, response_category: 'SD', best_response_pct: -18.2, final_outcome: 'Ongoing', tumor_baseline: 88, tumor_week4: 80, tumor_week8: 75, tumor_week12: 72, tumor_week16: null, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 14, ae_term: 'Fatigue', grade: 1 }, { day: 35, ae_term: 'Decreased Appetite', grade: 1 }] },
    { patient_id: 'P010', randomization_arm: 'Arm_A', age: 52, sex: 'F', ecog_ps: 0, tumor_type: 'CRC', treatment_start_day: 0, treatment_end_day: 112, ongoing: true, response_category: 'SD', best_response_pct: -15.8, final_outcome: 'Ongoing', tumor_baseline: 92, tumor_week4: 85, tumor_week8: 80, tumor_week12: 77, tumor_week16: 78, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 21, ae_term: 'Diarrhea', grade: 1 }, { day: 42, ae_term: 'Nausea', grade: 1 }] },
    { patient_id: 'P011', randomization_arm: 'Arm_A', age: 70, sex: 'M', ecog_ps: 1, tumor_type: 'NSCLC', treatment_start_day: 0, treatment_end_day: 84, ongoing: true, response_category: 'SD', best_response_pct: -8.5, final_outcome: 'Ongoing', tumor_baseline: 94, tumor_week4: 90, tumor_week8: 88, tumor_week12: 86, tumor_week16: null, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 28, ae_term: 'Fatigue', grade: 2 }] },
    { patient_id: 'P012', randomization_arm: 'Arm_A', age: 57, sex: 'F', ecog_ps: 1, tumor_type: 'Melanoma', treatment_start_day: 0, treatment_end_day: 98, ongoing: true, response_category: 'SD', best_response_pct: -5.2, final_outcome: 'Ongoing', tumor_baseline: 81, tumor_week4: 79, tumor_week8: 78, tumor_week12: 77, tumor_week16: null, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 14, ae_term: 'Rash', grade: 1 }] },
    { patient_id: 'P013', randomization_arm: 'Arm_A', age: 64, sex: 'M', ecog_ps: 1, tumor_type: 'RCC', treatment_start_day: 0, treatment_end_day: 70, ongoing: true, response_category: 'SD', best_response_pct: 3.8, final_outcome: 'Ongoing', tumor_baseline: 98, tumor_week4: 98, tumor_week8: 100, tumor_week12: 102, tumor_week16: null, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 14, ae_term: 'Fatigue', grade: 1 }, { day: 28, ae_term: 'Hypertension', grade: 1 }] },
    { patient_id: 'P014', randomization_arm: 'Arm_A', age: 75, sex: 'F', ecog_ps: 2, tumor_type: 'NSCLC', treatment_start_day: 0, treatment_end_day: 42, ongoing: false, response_category: 'PD', best_response_pct: 35.8, final_outcome: 'Discontinued', tumor_baseline: 86, tumor_week4: 98, tumor_week8: 108, tumor_week12: 117, tumor_week16: null, tumor_week24: null, response_events: [{ day: 28, type: 'PD', label: 'Progressive Disease' }], adverse_events: [{ day: 14, ae_term: 'Fatigue', grade: 3 }, { day: 21, ae_term: 'Decreased Appetite', grade: 2 }] },
    { patient_id: 'P015', randomization_arm: 'Arm_A', age: 69, sex: 'M', ecog_ps: 2, tumor_type: 'CRC', treatment_start_day: 0, treatment_end_day: 56, ongoing: false, response_category: 'PD', best_response_pct: 28.4, final_outcome: 'Discontinued', tumor_baseline: 102, tumor_week4: 112, tumor_week8: 125, tumor_week12: 131, tumor_week16: null, tumor_week24: null, response_events: [{ day: 42, type: 'PD', label: 'Progressive Disease' }], adverse_events: [{ day: 14, ae_term: 'Nausea', grade: 2 }, { day: 28, ae_term: 'Vomiting', grade: 2 }] },

    // ARM B - Standard (15 patients): 0 CR, 4 PR, 8 SD, 3 PD
    { patient_id: 'P016', randomization_arm: 'Arm_B', age: 60, sex: 'F', ecog_ps: 1, tumor_type: 'NSCLC', treatment_start_day: 0, treatment_end_day: 140, ongoing: true, response_category: 'PR', best_response_pct: -32.5, final_outcome: 'Ongoing', tumor_baseline: 89, tumor_week4: 75, tumor_week8: 68, tumor_week12: 60, tumor_week16: 62, tumor_week24: 60, response_events: [{ day: 84, type: 'PR', label: 'Partial Response' }], adverse_events: [{ day: 21, ae_term: 'Neutropenia', grade: 3 }, { day: 35, ae_term: 'Fatigue', grade: 2 }, { day: 49, ae_term: 'Anemia', grade: 2 }] },
    { patient_id: 'P017', randomization_arm: 'Arm_B', age: 56, sex: 'M', ecog_ps: 1, tumor_type: 'CRC', treatment_start_day: 0, treatment_end_day: 126, ongoing: true, response_category: 'PR', best_response_pct: -31.2, final_outcome: 'Ongoing', tumor_baseline: 96, tumor_week4: 82, tumor_week8: 72, tumor_week12: 66, tumor_week16: 68, tumor_week24: 66, response_events: [{ day: 84, type: 'PR', label: 'Partial Response' }], adverse_events: [{ day: 14, ae_term: 'Diarrhea', grade: 2 }, { day: 21, ae_term: 'Neutropenia', grade: 2 }, { day: 42, ae_term: 'Mucositis', grade: 1 }] },
    { patient_id: 'P018', randomization_arm: 'Arm_B', age: 53, sex: 'F', ecog_ps: 0, tumor_type: 'RCC', treatment_start_day: 0, treatment_end_day: 112, ongoing: true, response_category: 'PR', best_response_pct: -30.8, final_outcome: 'Ongoing', tumor_baseline: 104, tumor_week4: 88, tumor_week8: 78, tumor_week12: 72, tumor_week16: 73, tumor_week24: null, response_events: [{ day: 84, type: 'PR', label: 'Partial Response' }], adverse_events: [{ day: 14, ae_term: 'Fatigue', grade: 2 }, { day: 28, ae_term: 'Hypertension', grade: 1 }] },
    { patient_id: 'P019', randomization_arm: 'Arm_B', age: 66, sex: 'M', ecog_ps: 1, tumor_type: 'NSCLC', treatment_start_day: 0, treatment_end_day: 98, ongoing: true, response_category: 'PR', best_response_pct: -30.1, final_outcome: 'Ongoing', tumor_baseline: 83, tumor_week4: 72, tumor_week8: 64, tumor_week12: 58, tumor_week16: null, tumor_week24: null, response_events: [{ day: 84, type: 'PR', label: 'Partial Response' }], adverse_events: [{ day: 21, ae_term: 'Neutropenia', grade: 3 }, { day: 35, ae_term: 'Anemia', grade: 2 }] },
    { patient_id: 'P020', randomization_arm: 'Arm_B', age: 62, sex: 'F', ecog_ps: 1, tumor_type: 'Melanoma', treatment_start_day: 0, treatment_end_day: 84, ongoing: true, response_category: 'SD', best_response_pct: -12.4, final_outcome: 'Ongoing', tumor_baseline: 77, tumor_week4: 72, tumor_week8: 70, tumor_week12: 67, tumor_week16: null, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 14, ae_term: 'Fatigue', grade: 1 }] },
    { patient_id: 'P021', randomization_arm: 'Arm_B', age: 58, sex: 'M', ecog_ps: 1, tumor_type: 'CRC', treatment_start_day: 0, treatment_end_day: 98, ongoing: true, response_category: 'SD', best_response_pct: -8.9, final_outcome: 'Ongoing', tumor_baseline: 90, tumor_week4: 86, tumor_week8: 84, tumor_week12: 82, tumor_week16: null, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 14, ae_term: 'Diarrhea', grade: 1 }, { day: 28, ae_term: 'Nausea', grade: 1 }] },
    { patient_id: 'P022', randomization_arm: 'Arm_B', age: 71, sex: 'F', ecog_ps: 1, tumor_type: 'NSCLC', treatment_start_day: 0, treatment_end_day: 70, ongoing: true, response_category: 'SD', best_response_pct: -4.2, final_outcome: 'Ongoing', tumor_baseline: 95, tumor_week4: 93, tumor_week8: 92, tumor_week12: 91, tumor_week16: null, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 21, ae_term: 'Neutropenia', grade: 2 }] },
    { patient_id: 'P023', randomization_arm: 'Arm_B', age: 54, sex: 'M', ecog_ps: 1, tumor_type: 'RCC', treatment_start_day: 0, treatment_end_day: 84, ongoing: true, response_category: 'SD', best_response_pct: 1.5, final_outcome: 'Ongoing', tumor_baseline: 100, tumor_week4: 100, tumor_week8: 101, tumor_week12: 101, tumor_week16: null, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 14, ae_term: 'Fatigue', grade: 1 }] },
    { patient_id: 'P024', randomization_arm: 'Arm_B', age: 65, sex: 'F', ecog_ps: 1, tumor_type: 'CRC', treatment_start_day: 0, treatment_end_day: 70, ongoing: true, response_category: 'SD', best_response_pct: 5.8, final_outcome: 'Ongoing', tumor_baseline: 87, tumor_week4: 89, tumor_week8: 91, tumor_week12: 92, tumor_week16: null, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 14, ae_term: 'Nausea', grade: 1 }, { day: 28, ae_term: 'Decreased Appetite', grade: 1 }] },
    { patient_id: 'P025', randomization_arm: 'Arm_B', age: 59, sex: 'M', ecog_ps: 1, tumor_type: 'NSCLC', treatment_start_day: 0, treatment_end_day: 56, ongoing: true, response_category: 'SD', best_response_pct: 9.2, final_outcome: 'Ongoing', tumor_baseline: 85, tumor_week4: 88, tumor_week8: 91, tumor_week12: 93, tumor_week16: null, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 21, ae_term: 'Neutropenia', grade: 2 }] },
    { patient_id: 'P026', randomization_arm: 'Arm_B', age: 67, sex: 'F', ecog_ps: 1, tumor_type: 'Melanoma', treatment_start_day: 0, treatment_end_day: 70, ongoing: true, response_category: 'SD', best_response_pct: 12.5, final_outcome: 'Ongoing', tumor_baseline: 80, tumor_week4: 84, tumor_week8: 88, tumor_week12: 90, tumor_week16: null, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 14, ae_term: 'Fatigue', grade: 1 }] },
    { patient_id: 'P027', randomization_arm: 'Arm_B', age: 61, sex: 'M', ecog_ps: 1, tumor_type: 'RCC', treatment_start_day: 0, treatment_end_day: 84, ongoing: true, response_category: 'SD', best_response_pct: 15.8, final_outcome: 'Ongoing', tumor_baseline: 99, tumor_week4: 104, tumor_week8: 110, tumor_week12: 115, tumor_week16: null, tumor_week24: null, response_events: [{ day: 56, type: 'SD', label: 'Stable Disease' }], adverse_events: [{ day: 14, ae_term: 'Hypertension', grade: 2 }] },
    { patient_id: 'P028', randomization_arm: 'Arm_B', age: 73, sex: 'F', ecog_ps: 2, tumor_type: 'NSCLC', treatment_start_day: 0, treatment_end_day: 42, ongoing: false, response_category: 'PD', best_response_pct: 42.2, final_outcome: 'Discontinued', tumor_baseline: 90, tumor_week4: 108, tumor_week8: 120, tumor_week12: 128, tumor_week16: null, tumor_week24: null, response_events: [{ day: 28, type: 'PD', label: 'Progressive Disease' }], adverse_events: [{ day: 14, ae_term: 'Neutropenia', grade: 3 }, { day: 21, ae_term: 'Anemia', grade: 3 }, { day: 28, ae_term: 'Fatigue', grade: 3 }] },
    { patient_id: 'P029', randomization_arm: 'Arm_B', age: 68, sex: 'M', ecog_ps: 2, tumor_type: 'CRC', treatment_start_day: 0, treatment_end_day: 56, ongoing: false, response_category: 'PD', best_response_pct: 38.5, final_outcome: 'Discontinued', tumor_baseline: 91, tumor_week4: 105, tumor_week8: 118, tumor_week12: 126, tumor_week16: null, tumor_week24: null, response_events: [{ day: 42, type: 'PD', label: 'Progressive Disease' }], adverse_events: [{ day: 14, ae_term: 'Diarrhea', grade: 3 }, { day: 28, ae_term: 'Vomiting', grade: 2 }, { day: 35, ae_term: 'Decreased Appetite', grade: 2 }] },
    { patient_id: 'P030', randomization_arm: 'Arm_B', age: 70, sex: 'F', ecog_ps: 2, tumor_type: 'RCC', treatment_start_day: 0, treatment_end_day: 35, ongoing: false, response_category: 'PD', best_response_pct: 45.8, final_outcome: 'Discontinued', tumor_baseline: 103, tumor_week4: 122, tumor_week8: 142, tumor_week12: 150, tumor_week16: null, tumor_week24: null, response_events: [{ day: 28, type: 'PD', label: 'Progressive Disease' }], adverse_events: [{ day: 14, ae_term: 'Fatigue', grade: 3 }, { day: 21, ae_term: 'Hypertension', grade: 3 }] }
  ],

  // 50 biomarkers for volcano plot (differential expression: responders vs non-responders)
  biomarkers: [
    // 10 significantly upregulated in responders (immune activation markers)
    { name: 'PD-L1', log2fc: 2.4, pvalue: 0.0008, significant: true },
    { name: 'CD8A', log2fc: 2.1, pvalue: 0.0015, significant: true },
    { name: 'GZMA', log2fc: 1.9, pvalue: 0.0022, significant: true },
    { name: 'GZMB', log2fc: 1.8, pvalue: 0.0035, significant: true },
    { name: 'PRF1', log2fc: 1.7, pvalue: 0.0041, significant: true },
    { name: 'IFNG', log2fc: 1.9, pvalue: 0.0028, significant: true },
    { name: 'CXCL9', log2fc: 2.0, pvalue: 0.0019, significant: true },
    { name: 'CXCL10', log2fc: 1.8, pvalue: 0.0038, significant: true },
    { name: 'HLA-DRA', log2fc: 1.6, pvalue: 0.0045, significant: true },
    { name: 'HLA-DRB1', log2fc: 1.5, pvalue: 0.0048, significant: true },

    // 8 significantly downregulated in responders (proliferation/angiogenesis markers)
    { name: 'MKI67', log2fc: -2.2, pvalue: 0.0012, significant: true },
    { name: 'PCNA', log2fc: -1.9, pvalue: 0.0025, significant: true },
    { name: 'TOP2A', log2fc: -1.8, pvalue: 0.0032, significant: true },
    { name: 'VEGFA', log2fc: -1.7, pvalue: 0.0039, significant: true },
    { name: 'VEGFR2', log2fc: -1.6, pvalue: 0.0042, significant: true },
    { name: 'SNAI1', log2fc: -1.5, pvalue: 0.0047, significant: true },
    { name: 'TWIST1', log2fc: -1.4, pvalue: 0.0049, significant: true },
    { name: 'VIM', log2fc: -1.6, pvalue: 0.0044, significant: true },

    // 32 non-significant biomarkers (various oncology targets)
    { name: 'EGFR', log2fc: 0.3, pvalue: 0.45, significant: false },
    { name: 'KRAS', log2fc: -0.2, pvalue: 0.62, significant: false },
    { name: 'BRAF', log2fc: 0.4, pvalue: 0.38, significant: false },
    { name: 'PIK3CA', log2fc: -0.3, pvalue: 0.52, significant: false },
    { name: 'AKT1', log2fc: 0.2, pvalue: 0.68, significant: false },
    { name: 'MTOR', log2fc: -0.1, pvalue: 0.82, significant: false },
    { name: 'TP53', log2fc: -0.4, pvalue: 0.42, significant: false },
    { name: 'PTEN', log2fc: 0.5, pvalue: 0.28, significant: false },
    { name: 'ALK', log2fc: -0.3, pvalue: 0.55, significant: false },
    { name: 'ROS1', log2fc: 0.2, pvalue: 0.72, significant: false },
    { name: 'MET', log2fc: -0.4, pvalue: 0.44, significant: false },
    { name: 'FGFR1', log2fc: 0.3, pvalue: 0.48, significant: false },
    { name: 'FGFR2', log2fc: -0.2, pvalue: 0.64, significant: false },
    { name: 'ERBB2', log2fc: 0.4, pvalue: 0.36, significant: false },
    { name: 'ERBB3', log2fc: -0.3, pvalue: 0.51, significant: false },
    { name: 'NRAS', log2fc: 0.2, pvalue: 0.69, significant: false },
    { name: 'JAK2', log2fc: -0.1, pvalue: 0.85, significant: false },
    { name: 'STAT3', log2fc: 0.3, pvalue: 0.47, significant: false },
    { name: 'CTNNB1', log2fc: -0.4, pvalue: 0.41, significant: false },
    { name: 'MYC', log2fc: 0.5, pvalue: 0.29, significant: false },
    { name: 'BCL2', log2fc: -0.3, pvalue: 0.54, significant: false },
    { name: 'MCL1', log2fc: 0.2, pvalue: 0.71, significant: false },
    { name: 'BAX', log2fc: -0.2, pvalue: 0.65, significant: false },
    { name: 'CDKN2A', log2fc: 0.4, pvalue: 0.37, significant: false },
    { name: 'CDK4', log2fc: -0.3, pvalue: 0.53, significant: false },
    { name: 'CDK6', log2fc: 0.2, pvalue: 0.70, significant: false },
    { name: 'CCND1', log2fc: -0.1, pvalue: 0.84, significant: false },
    { name: 'RB1', log2fc: 0.3, pvalue: 0.49, significant: false },
    { name: 'E2F1', log2fc: -0.4, pvalue: 0.43, significant: false },
    { name: 'SMAD4', log2fc: 0.2, pvalue: 0.67, significant: false },
    { name: 'TGFB1', log2fc: -0.3, pvalue: 0.56, significant: false },
    { name: 'WNT3A', log2fc: 0.4, pvalue: 0.39, significant: false }
  ],

  // AE co-occurrence matrix for chord diagram (pairs that occur together frequently)
  ae_cooccurrence: [
    // Fatigue co-occurrences (most common AE)
    { source: 'Fatigue', target: 'Nausea', count: 15 },
    { source: 'Fatigue', target: 'Decreased Appetite', count: 12 },
    { source: 'Fatigue', target: 'Diarrhea', count: 8 },
    { source: 'Fatigue', target: 'Rash', count: 6 },

    // Diarrhea co-occurrences (GI toxicity cluster)
    { source: 'Diarrhea', target: 'Nausea', count: 14 },
    { source: 'Diarrhea', target: 'Vomiting', count: 10 },
    { source: 'Diarrhea', target: 'Decreased Appetite', count: 9 },
    { source: 'Diarrhea', target: 'Mucositis', count: 5 },

    // Nausea co-occurrences
    { source: 'Nausea', target: 'Vomiting', count: 12 },
    { source: 'Nausea', target: 'Decreased Appetite', count: 11 },

    // Neutropenia co-occurrences (hematologic toxicity cluster)
    { source: 'Neutropenia', target: 'Anemia', count: 8 },
    { source: 'Neutropenia', target: 'Thrombocytopenia', count: 6 },
    { source: 'Neutropenia', target: 'Fatigue', count: 7 },

    // Anemia co-occurrences
    { source: 'Anemia', target: 'Thrombocytopenia', count: 5 },
    { source: 'Anemia', target: 'Fatigue', count: 9 },

    // Rash co-occurrences (dermatologic toxicity cluster)
    { source: 'Rash', target: 'Hand-Foot Syndrome', count: 6 },
    { source: 'Rash', target: 'Fatigue', count: 5 },

    // Hypertension co-occurrences (vascular toxicity cluster)
    { source: 'Hypertension', target: 'Proteinuria', count: 5 },
    { source: 'Hypertension', target: 'Fatigue', count: 4 },

    // Peripheral Neuropathy co-occurrences
    { source: 'Peripheral Neuropathy', target: 'Fatigue', count: 4 },
    { source: 'Peripheral Neuropathy', target: 'Decreased Appetite', count: 3 },

    // ALT Elevation co-occurrences
    { source: 'ALT Elevation', target: 'Fatigue', count: 3 },
    { source: 'ALT Elevation', target: 'Decreased Appetite', count: 3 },

    // Hand-Foot Syndrome co-occurrences
    { source: 'Hand-Foot Syndrome', target: 'Fatigue', count: 4 }
  ]
};

/**
 * Load advanced analytics showcase data
 * @returns {Promise<Object>} Promise that resolves to comprehensive analytics dataset
 */
async function loadAdvancedAnalyticsData() {
  return new Promise((resolve) => {
    console.log('Loading advanced analytics showcase data...');
    console.log(`Successfully loaded ${ADVANCED_ANALYTICS_DATA.patients.length} patients, ${ADVANCED_ANALYTICS_DATA.biomarkers.length} biomarkers, and ${ADVANCED_ANALYTICS_DATA.ae_cooccurrence.length} AE co-occurrence pairs`);
    resolve(ADVANCED_ANALYTICS_DATA);
  });
}
