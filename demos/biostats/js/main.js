// Main Application Module
// Orchestrates the entire clinical trial dashboard - data loading, chart rendering, UI management

// ============================================================================
// GLOBAL STATE MANAGEMENT
// ============================================================================

/**
 * Application state
 * @type {Object}
 */
let appState = {
  clinicalData: null,
  imagingData: null,
  survivalData: null,
  advancedData: null,
  currentStudy: 1,
  isLoading: false,
  hasError: false,
  errorMessage: ''
};

// Tracks which studies have already been drawn so switching tabs doesn't rebuild
// every Plotly chart from scratch on each visit. Cleared when data is (re)loaded.
const renderedStudies = new Set();

/**
 * Render a study panel, but only if it hasn't been rendered since the last data
 * load. Pass force=true to redraw regardless (used right after loading data).
 * @param {number} studyNumber - 1..4
 * @param {boolean} [force=false]
 */
function renderStudy(studyNumber, force = false) {
  if (!force && renderedStudies.has(studyNumber)) return;

  const renderers = {
    1: () => appState.clinicalData && renderClinicalStudy(appState.clinicalData),
    2: () => appState.imagingData && renderImagingStudy(appState.imagingData),
    3: () => appState.survivalData && renderSurvivalStudy(appState.survivalData),
    4: () => appState.advancedData && renderAdvancedAnalyticsStudy(appState.advancedData)
  };

  if (renderers[studyNumber]) {
    renderers[studyNumber]();
    renderedStudies.add(studyNumber);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the dashboard when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Clinical Trial Dashboard initializing...');

  // Set up event listeners
  initializeEventListeners();

  // Initialize home page animations
  initializeHomePage();

  // Auto-load data on page load for immediate visualization
  loadDataAndRenderDashboard();

  console.log('Dashboard initialized successfully');
});

/**
 * Set up all event listeners for interactive elements
 */
function initializeEventListeners() {
  // Study tab navigation (click + full keyboard support via ARIA tablist)
  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  tabButtons.forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
    btn.addEventListener('keydown', handleTabKeydown);
  });

  // Adverse Events Export Button (rendered in the Study 1 toolbar)
  const aeExportBtn = document.getElementById('ae-export-btn');
  if (aeExportBtn) {
    aeExportBtn.addEventListener('click', handleAEExport);
  }

  // Window resize handler for responsive charts (debounced)
  window.addEventListener('resize', debounce(handleWindowResize, 300));
}

/**
 * Keyboard navigation for the study tablist (roving focus).
 * @param {KeyboardEvent} event
 */
function handleTabKeydown(event) {
  const tabs = Array.from(document.querySelectorAll('.tab-btn'));
  const idx = tabs.indexOf(event.currentTarget);
  let next = -1;

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown': next = (idx + 1) % tabs.length; break;
    case 'ArrowLeft':
    case 'ArrowUp': next = (idx - 1 + tabs.length) % tabs.length; break;
    case 'Home': next = 0; break;
    case 'End': next = tabs.length - 1; break;
    default: return;
  }

  event.preventDefault();
  tabs[next].focus();
  tabs[next].click();
}

// ============================================================================
// DATA LOADING & RENDERING
// ============================================================================

/**
 * Main function to load data and render entire dashboard
 * Handles loading state, error handling, and successful rendering
 */
async function loadDataAndRenderDashboard() {
  // Prevent multiple simultaneous loads
  if (appState.isLoading) {
    console.log('Data loading already in progress, ignoring request');
    return;
  }

  try {
    // Show loading overlay
    showLoading();
    appState.isLoading = true;
    appState.hasError = false;
    appState.errorMessage = '';

    console.log('Starting data load...');

    // Load all four studies' data
    const [clinicalData, imagingData, survivalData, advancedData] = await Promise.all([
      loadClinicalData(),
      loadImagingData(),
      loadSurvivalData(),
      loadAdvancedAnalyticsData()
    ]);

    // Validate data
    if (!clinicalData || clinicalData.length === 0) {
      throw new Error('No clinical data loaded');
    }

    if (!imagingData || imagingData.length === 0) {
      throw new Error('No imaging data loaded');
    }

    if (!survivalData || survivalData.length === 0) {
      throw new Error('No survival data loaded');
    }

    if (!advancedData || !advancedData.patients || advancedData.patients.length === 0) {
      throw new Error('No advanced analytics data loaded');
    }

    console.log(`Successfully loaded ${clinicalData.length} clinical trial records`);
    console.log(`Successfully loaded ${imagingData.length} imaging study records`);
    console.log(`Successfully loaded ${survivalData.length} survival study records`);
    console.log(`Successfully loaded ${advancedData.patients.length} advanced analytics patient records`);

    // Store data in application state
    appState.clinicalData = clinicalData;
    appState.imagingData = imagingData;
    appState.survivalData = survivalData;
    appState.advancedData = advancedData;

    // Fresh data invalidates any cached renders
    renderedStudies.clear();

    // Render the currently-visible study (force, since data just changed).
    // Other studies render lazily the first time their tab is opened.
    const current = typeof appState.currentStudy === 'number' ? appState.currentStudy : 1;
    renderStudy(current, true);

    // Update footer with study information
    updateFooter(clinicalData);

    // Success notification
    console.log('Dashboard rendered successfully');
    showSuccessMessage(`Loaded ${clinicalData.length + imagingData.length + survivalData.length + advancedData.patients.length} records across 4 studies`);

  } catch (error) {
    // Handle errors gracefully
    console.error('Error loading data:', error);
    appState.hasError = true;
    appState.errorMessage = error.message;
    showError(`Failed to load data: ${error.message}`);
  } finally {
    // Always hide loading overlay
    hideLoading();
    appState.isLoading = false;
  }
}

/**
 * Render clinical trial study (Study 1)
 * @param {Array<Object>} data - Clinical trial data
 */
function renderClinicalStudy(data) {
  console.log('Rendering clinical trial study...');

  try {
    // Remove placeholders first
    const study1Container = document.getElementById('study-1');
    if (study1Container) {
      const placeholders = study1Container.querySelectorAll('.chart-placeholder');
      placeholders.forEach(p => p.remove());
    }

    // 1. Update Summary Statistics (KPI Cards)
    console.log('Updating summary statistics...');
    updateSummaryStats(data);

    // 2. Render Treatment Comparison Chart
    console.log('Creating treatment comparison chart...');
    createTreatmentComparisonChart(data, 'treatment-chart');

    // 3. Render Trajectory Plot
    console.log('Creating trajectory plot...');
    createTrajectoryPlot(data, 'trajectory-chart');

    // 4. Render Forest Plot
    console.log('Creating forest plot...');
    createForestPlot(data, 'forest-plot');

    // 5. Render Waterfall Plot
    console.log('Creating waterfall plot...');
    createWaterfallPlot(data, 'waterfall-chart');

    // 6. Render Adverse Events Chart
    console.log('Creating adverse events chart...');
    createAdverseEventsChart(data, 'adverse-events-chart');

    // 7. Render Responder Donut Chart
    console.log('Creating responder donut chart...');
    createResponderDonutChart('responder-donut-chart', data);

    // 8. Render NNT Icon Array
    console.log('Creating NNT icon array...');
    createNNTIconArray('nnt-icon-array', data);

    // 9. Update NNT KPI Card
    console.log('Updating NNT KPI card...');
    updateNNTCard(data);

    console.log('Clinical trial study rendered successfully');

  } catch (error) {
    console.error('Error rendering clinical study:', error);
    throw new Error(`Clinical study rendering failed: ${error.message}`);
  }
}

/**
 * Update the NNT KPI card with calculated values
 * @param {Array<Object>} data - Clinical trial data
 */
function updateNNTCard(data) {
  // Filter by treatment group
  const treatmentData = data.filter(d => d.treatment_group === 'Treatment');
  const placeboData = data.filter(d => d.treatment_group === 'Placebo');

  // Count responders (>=20% reduction at week 12)
  const treatmentResponders = treatmentData.filter(d => d.pct_change_week12 <= -20).length;
  const placeboResponders = placeboData.filter(d => d.pct_change_week12 <= -20).length;

  // Calculate response rates
  const treatmentRate = treatmentResponders / treatmentData.length;
  const placeboRate = placeboResponders / placeboData.length;

  // Calculate ARR and NNT
  const ARR = treatmentRate - placeboRate;
  const NNT = ARR > 0 ? Math.ceil(1 / ARR) : Infinity;

  // Update the NNT KPI card
  const nntCard = document.getElementById('stat-nnt');
  if (nntCard) {
    const valueEl = nntCard.querySelector('.kpi-value');
    const trendEl = nntCard.querySelector('.kpi-trend');

    if (valueEl) {
      valueEl.textContent = NNT === Infinity ? 'N/A' : NNT;
      if (NNT !== Infinity && NNT <= 5) {
        valueEl.style.color = '#00C853'; // Green for very good NNT
      } else if (NNT !== Infinity && NNT <= 10) {
        valueEl.style.color = '#FFA726'; // Orange for moderate NNT
      }
    }

    if (trendEl) {
      trendEl.textContent = `ARR: ${(ARR * 100).toFixed(1)}%`;
    }
  }

  console.log(`NNT calculated: ${NNT}, ARR: ${(ARR * 100).toFixed(1)}%`);
}

/**
 * Renders the redesigned Diagnostic Imaging Study (Study 2)
 * @param {Array} data - Array of imaging study patient data
 */
function renderImagingStudy(data) {
    console.log('Rendering Advanced Diagnostic Imaging Study with', data.length, 'patients');

    // Clear any placeholder content
    const study2Container = document.getElementById('study-2');
    if (study2Container) {
        const placeholders = study2Container.querySelectorAll('.chart-placeholder');
        placeholders.forEach(p => p.remove());
    }

    // Create diagnostic gauges
    createDiagnosticGauges('diagnostic-gauges', data, 0.5);

    // Create ROC and PR curves
    createROCCurve('roc-curve', data);
    createPRCurve('pr-curve', data);

    // Create score distribution
    createScoreDistribution('score-distribution', data, 0.5);

    // Create calibration plot
    createCalibrationPlot('calibration-plot', data);

    // Create interactive threshold explorer
    createThresholdExplorer('threshold-explorer', data);

    // Create decision curve analysis
    createDecisionCurve('decision-curve', data);
}

/**
 * Render oncology survival study (Study 3)
 * @param {Array<Object>} data - Survival study data
 */
function renderSurvivalStudy(data) {
  console.log('Rendering oncology survival study...');

  try {
    // Remove placeholders first
    const study3Container = document.getElementById('study-3');
    if (study3Container) {
      const placeholders = study3Container.querySelectorAll('.chart-placeholder');
      placeholders.forEach(p => p.remove());
    }

    // 1. Create Demographics Cards
    console.log('Creating survival demographics cards...');
    createSurvivalDemographicsCards(data);

    // 2. Update RMST Card
    console.log('Calculating RMST values...');
    updateRMSTCard(data, 24);

    // 3. Render Kaplan-Meier Curve
    console.log('Creating Kaplan-Meier survival curves...');
    createKaplanMeierCurve(data, 'km-curve');

    // 4. Render Survival Summary
    console.log('Creating survival summary chart...');
    createSurvivalSummaryChart(data, 'survival-summary');

    // 5. Render Hazard Ratio Forest Plot
    console.log('Creating hazard ratio forest plot...');
    createHRForestPlot(data, 'hr-forest-plot');

    // 6. Render Events Summary
    console.log('Creating events summary chart...');
    createEventsSummaryChart(data, 'events-summary');

    // 7. Render Swimmer Plot
    console.log('Creating survival swimmer plot...');
    createSurvivalSwimmerPlot(data, 'survival-swimmer-plot');

    // 8. Render Cumulative Events Chart
    console.log('Creating cumulative events chart...');
    createCumulativeEventsChart(data, 'cumulative-events-chart');

    console.log('Oncology survival study rendered successfully');

  } catch (error) {
    console.error('Error rendering survival study:', error);
    throw new Error(`Survival study rendering failed: ${error.message}`);
  }
}

/**
 * Renders the Advanced Analytics Showcase (Study 4)
 * @param {Object} data - Advanced analytics data with patients, biomarkers, ae_cooccurrence
 */
function renderAdvancedAnalyticsStudy(data) {
  console.log('Rendering Advanced Analytics Study with', data.patients.length, 'patients');

  try {
    // Remove placeholders first
    const study4Container = document.getElementById('study-4');
    if (study4Container) {
      const placeholders = study4Container.querySelectorAll('.chart-placeholder');
      placeholders.forEach(p => p.remove());
    }

    // Create KPI cards
    createAdvancedKPICards(data);

    // Create all visualizations
    createSwimmerPlot('swimmer-plot', data);
    createAdvancedWaterfallPlot('advanced-waterfall', data);
    createSankeyDiagram('sankey-diagram', data);
    createVolcanoPlot('volcano-plot', data);
    createRidgelinePlot('ridgeline-plot', data);
    createChordDiagram('chord-diagram', data);

    console.log('Advanced Analytics study rendered successfully');

  } catch (error) {
    console.error('Error rendering Advanced Analytics study:', error);
    throw new Error(`Advanced Analytics study rendering failed: ${error.message}`);
  }
}

/**
 * Creates KPI cards for Advanced Analytics dashboard
 * @param {Object} data - Advanced analytics data
 */
function createAdvancedKPICards(data) {
  const container = document.getElementById('advanced-demographics');
  if (!container) return;

  const patients = data.patients;
  const totalPatients = patients.length;

  // Calculate response rate (CR + PR)
  const responders = patients.filter(p => p.response_category === 'CR' || p.response_category === 'PR').length;
  const responseRate = ((responders / totalPatients) * 100).toFixed(1);

  // Calculate median treatment duration
  const durations = patients.map(p => p.treatment_end_day - p.treatment_start_day);
  const sortedDurations = durations.sort((a, b) => a - b);
  const medianDuration = sortedDurations[Math.floor(sortedDurations.length / 2)];

  // Count significant biomarkers
  const significantBiomarkers = data.biomarkers.filter(b => b.significant).length;

  // Calculate safety signal (Grade 3+ AEs)
  let grade3Plus = 0;
  patients.forEach(p => {
    if (p.adverse_events) {
      grade3Plus += p.adverse_events.filter(ae => ae.grade >= 3).length;
    }
  });

  container.innerHTML = `
    <article class="kpi-card">
      <div class="kpi-icon" aria-hidden="true">👥</div>
      <div class="kpi-content">
        <h3 class="kpi-label">ENROLLED PATIENTS</h3>
        <p class="kpi-value">${totalPatients}</p>
        <span class="kpi-trend">Phase II Oncology Trial</span>
      </div>
    </article>
    <article class="kpi-card">
      <div class="kpi-icon" aria-hidden="true">🎯</div>
      <div class="kpi-content">
        <h3 class="kpi-label">OBJECTIVE RESPONSE</h3>
        <p class="kpi-value" style="color: #00C853">${responseRate}%</p>
        <span class="kpi-trend">${responders} of ${totalPatients} patients (CR+PR)</span>
      </div>
    </article>
    <article class="kpi-card">
      <div class="kpi-icon" aria-hidden="true">🧬</div>
      <div class="kpi-content">
        <h3 class="kpi-label">BIOMARKER SIGNALS</h3>
        <p class="kpi-value" style="color: #00D9FF">${significantBiomarkers}</p>
        <span class="kpi-trend">Significant markers identified</span>
      </div>
    </article>
    <article class="kpi-card">
      <div class="kpi-icon" aria-hidden="true">⏱️</div>
      <div class="kpi-content">
        <h3 class="kpi-label">MEDIAN TREATMENT</h3>
        <p class="kpi-value">${medianDuration}</p>
        <span class="kpi-trend">Days on treatment</span>
      </div>
    </article>
  `;
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

/**
 * Show loading overlay with spinner
 */
function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.hidden = false;
    overlay.setAttribute('aria-busy', 'true');
    console.log('Loading overlay shown');
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.hidden = true;
    overlay.setAttribute('aria-busy', 'false');
    console.log('Loading overlay hidden');
  }
}

/**
 * Show a toast notification. Styling lives in CSS (.notification + variant);
 * the message is inserted with textContent, so it can never inject markup
 * (closes the previous innerHTML/${message} HTML-injection sink).
 * @param {'error'|'success'} type
 * @param {string} message
 * @param {number} timeout - auto-hide delay in ms
 */
function showNotification(type, message, timeout) {
  const id = `${type}-notification`;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = `notification ${type}-notification`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    document.body.appendChild(el);
  }

  // Build structure safely (no string interpolation of the message)
  el.textContent = '';
  const content = document.createElement('div');
  content.className = 'notification-content';

  const icon = document.createElement('span');
  icon.className = 'notification-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = type === 'error' ? '⚠️' : '✓';

  const msg = document.createElement('span');
  msg.className = 'notification-message';
  msg.textContent = message;

  const close = document.createElement('button');
  close.className = 'notification-close';
  close.setAttribute('aria-label', 'Close notification');
  close.textContent = '×';

  content.append(icon, msg, close);
  el.appendChild(content);
  el.style.display = 'block';

  const hide = () => { el.style.display = 'none'; };
  close.onclick = hide;
  if (el._hideTimer) clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(hide, timeout);
}

/**
 * Display error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
  showNotification('error', message, 8000);
  console.error('Error displayed to user:', message);
}

/**
 * Display success message to user
 * @param {string} message - Success message to display
 */
function showSuccessMessage(message) {
  showNotification('success', message, 4000);
  console.log('Success message displayed:', message);
}

/**
 * Remove placeholder content from chart containers
 */
function removePlaceholders() {
  const placeholders = document.querySelectorAll('.chart-placeholder');
  placeholders.forEach(placeholder => {
    placeholder.remove();
  });
  console.log(`Removed ${placeholders.length} chart placeholders`);
}

/**
 * Update footer with study information
 * @param {Array<Object>} data - Clinical trial data (unused but available for dynamic info)
 */
function updateFooter(data) {
  // Static study information
  const studyInfo = {
    protocolId: 'STUDY-2024-001',
    phase: 'Phase III',
    status: 'Completed',
    dataLockDate: '2024-12-15'
  };

  // Update Protocol ID
  const protocolEl = document.getElementById('protocol-id');
  if (protocolEl) {
    protocolEl.textContent = studyInfo.protocolId;
  }

  // Update Phase
  const phaseEl = document.getElementById('trial-phase');
  if (phaseEl) {
    phaseEl.textContent = studyInfo.phase;
  }

  // Update Status
  const statusEl = document.getElementById('trial-status');
  if (statusEl) {
    statusEl.textContent = studyInfo.status;
    statusEl.style.color = 'var(--color-success)';
  }

  // Update Data Lock Date
  const dataLockEl = document.getElementById('data-lock-date');
  if (dataLockEl) {
    dataLockEl.textContent = studyInfo.dataLockDate;
  }

  // Masthead badge mirrors the data-lock state
  const badge = document.getElementById('masthead-status');
  if (badge) {
    badge.textContent = `Data locked · ${studyInfo.dataLockDate}`;
  }

  console.log('Footer updated with study information');
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle tab switching between studies
 * @param {Event} event - Click event
 */
function handleTabSwitch(event) {
  const button = event.currentTarget;
  const studyId = button.dataset.study;

  console.log(`Switching to study ${studyId}`);

  // Update button states + roving tabindex (only the active tab is in the tab order)
  const allTabButtons = document.querySelectorAll('.tab-btn');
  allTabButtons.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('tabindex', '-1');
  });
  button.classList.add('active');
  button.setAttribute('aria-selected', 'true');
  button.setAttribute('tabindex', '0');

  // Hide all study content
  const allStudyContent = document.querySelectorAll('.study-content');
  allStudyContent.forEach(content => {
    content.classList.remove('active');
  });

  // Show selected study content
  if (studyId === 'home') {
    const homeContent = document.getElementById('home-content');
    if (homeContent) {
      homeContent.classList.add('active');
    }
    // Re-initialize home page animations
    setTimeout(initializeHomePage, 100);
    appState.currentStudy = 'home';
  } else {
    const studyNumber = parseInt(studyId);
    const selectedStudy = document.getElementById(`study-${studyNumber}`);
    if (selectedStudy) {
      selectedStudy.classList.add('active');
    }

    // Update current study in state
    appState.currentStudy = studyNumber;

    // Render lazily and only once per data load (cached) - avoids rebuilding
    // every Plotly chart on each tab visit. Then reflow to the new panel size.
    renderStudy(studyNumber);
    requestAnimationFrame(() => handleWindowResize());
  }
}

/**
 * Handle Adverse Events export button click
 * Exports the Study 1 cohort to CSV
 */
function handleAEExport() {
  if (!appState.clinicalData || appState.clinicalData.length === 0) {
    showError('No data available to export. Please load data first.');
    return;
  }

  try {
    // Map the real (lower-case) data fields to a readable CSV
    const aeData = appState.clinicalData.map(row => ({
      Patient_ID: row.patient_id ?? 'N/A',
      Treatment_Group: row.treatment_group ?? 'N/A',
      Site: row.site ?? 'N/A',
      Age: row.age ?? 'N/A',
      Sex: row.sex ?? 'N/A',
      Adverse_Event: row.adverse_event === 1 ? 'Yes' : 'No',
      Completed: row.completed === 1 ? 'Yes' : 'No',
      Pct_Change_Week12: row.pct_change_week12 ?? 'N/A'
    }));

    // Convert to CSV
    const csvContent = convertToCSV(aeData);

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `adverse_events_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccessMessage(`Exported ${aeData.length} records to CSV`);
    console.log(`Exported ${aeData.length} AE records`);

  } catch (error) {
    console.error('Error exporting data:', error);
    showError(`Export failed: ${error.message}`);
  }
}

/**
 * Handle window resize event.
 * Reflows every Plotly chart inside the currently-active study panel (not just
 * a hard-coded subset of Study 1).
 */
function handleWindowResize() {
  if (!window.Plotly) return;
  const activePanel = document.querySelector('.study-content.active');
  if (!activePanel) return;

  // Any element Plotly has drawn into carries a `.js-plotly-plot` class
  activePanel.querySelectorAll('.js-plotly-plot').forEach(div => {
    Plotly.Plots.resize(div);
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert array of objects to CSV string
 * @param {Array<Object>} data - Array of data objects
 * @returns {string} - CSV formatted string
 */
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create header row
  const csvRows = [headers.join(',')];

  // Create data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle values with commas by wrapping in quotes
      const escaped = ('' + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================================================
// HOME PAGE ANIMATIONS
// ============================================================================

// Home-page animation handles, tracked so repeated visits don't leak observers
// or stack intervals (initializeHomePage runs every time the Home tab is opened).
let homeObserver = null;
let counterTimers = [];

/**
 * Animated counter for stats
 * @param {HTMLElement} element - Element to animate
 * @param {number} target - Target number to count to
 * @param {number} duration - Animation duration in milliseconds
 */
function animateCounter(element, target, duration = 2000) {
  let current = 0;
  const increment = target / (duration / 16); // ~60fps

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
      counterTimers = counterTimers.filter(t => t !== timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
  counterTimers.push(timer);
}

/**
 * Initialize home page animations. Idempotent: tears down any observer/intervals
 * from a previous visit before starting fresh.
 */
function initializeHomePage() {
  // Clean up prior run
  if (homeObserver) { homeObserver.disconnect(); homeObserver = null; }
  counterTimers.forEach(clearInterval);
  counterTimers = [];

  const statNumbers = document.querySelectorAll('.stat-number');
  statNumbers.forEach(num => { num.textContent = '0'; });

  // Trigger the count-up when each stat scrolls into view
  homeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.target);
        animateCounter(entry.target, target);
        homeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(num => homeObserver.observe(num));
}

// ============================================================================
// CONSOLE BANNER
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║       CLINICAL TRIAL RESULTS DASHBOARD                        ║
║       Production-Ready Biostatistics Visualization            ║
║                                                                ║
║       Version: 1.0.0                                          ║
║       Data: Clinical Trial Sample Data                        ║
║       Visualizations: Plotly.js                               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);

// Export state for debugging (accessible in console)
if (typeof window !== 'undefined') {
  window.dashboardState = appState;
  console.log('Dashboard state available at: window.dashboardState');
}
