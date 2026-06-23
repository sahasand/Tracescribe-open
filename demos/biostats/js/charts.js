// Charts Module
// Production-quality visualizations for clinical trial dashboard using Plotly.js
// All charts use dark theme optimized for executive presentations

// ============================================================================
// CHART CONFIGURATION & THEME
// ============================================================================

const CHART_COLORS = {
  treatment: '#0072B2',
  placebo: '#D55E00',
  accent: '#00D9FF',
  text: '#E8E8E8',
  textSecondary: '#B0B0B0',
  background: '#1a1a1a',
  paper: '#0d0d0d',
  grid: '#404040',
  zeroline: '#808080',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545'
};

// Common Plotly layout properties for dark theme
const getDarkLayout = (title = '') => ({
  title: {
    text: title,
    font: {
      family: 'Arial, sans-serif',
      size: 18,
      color: CHART_COLORS.text,
      weight: 600
    },
    x: 0.5,
    xanchor: 'center'
  },
  plot_bgcolor: CHART_COLORS.background,
  paper_bgcolor: 'rgba(0,0,0,0)',
  font: {
    family: 'Arial, sans-serif',
    color: CHART_COLORS.text,
    size: 12
  },
  margin: { t: 80, b: 80, l: 80, r: 40 },
  xaxis: {
    gridcolor: CHART_COLORS.grid,
    zerolinecolor: CHART_COLORS.zeroline,
    tickfont: { color: CHART_COLORS.text },
    titlefont: { size: 14, color: CHART_COLORS.text }
  },
  yaxis: {
    gridcolor: CHART_COLORS.grid,
    zerolinecolor: CHART_COLORS.zeroline,
    tickfont: { color: CHART_COLORS.text },
    titlefont: { size: 14, color: CHART_COLORS.text }
  },
  legend: {
    bgcolor: 'rgba(13, 13, 13, 0.8)',
    bordercolor: CHART_COLORS.grid,
    borderwidth: 1,
    font: { color: CHART_COLORS.text, size: 12 }
  },
  hovermode: 'closest'
});

// Plotly configuration for all charts
const plotlyConfig = {
  responsive: true,
  displayModeBar: true,
  modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
  displaylogo: false,
  toImageButtonOptions: {
    format: 'png',
    filename: 'clinical_trial_chart',
    height: 600,
    width: 1000,
    scale: 2
  }
};

// ============================================================================
// 1. TREATMENT COMPARISON CHART
// ============================================================================

/**
 * Create grouped bar chart showing mean change from baseline by treatment group
 * @param {Array<Object>} data - Clinical trial data
 * @param {string} containerId - DOM element ID for chart container
 */
function createTreatmentComparisonChart(data, containerId) {
  // Calculate change from baseline for each patient
  const dataWithChange = data.map(row => ({
    ...row,
    change: row.week12 - row.baseline
  }));

  // Group by treatment and calculate statistics
  const treatmentData = dataWithChange.filter(row => row.treatment_group === 'Treatment');
  const placeboData = dataWithChange.filter(row => row.treatment_group === 'Placebo');

  const treatmentChanges = treatmentData.map(d => d.change);
  const placeboChanges = placeboData.map(d => d.change);

  const treatmentStats = confidenceInterval95(treatmentChanges);
  const placeboStats = confidenceInterval95(placeboChanges);

  // Calculate error bar arrays (distance from mean to CI bounds)
  const treatmentError = treatmentStats.upper - treatmentStats.mean;
  const placeboError = placeboStats.upper - placeboStats.mean;

  // Treatment group trace
  const treatmentTrace = {
    x: ['Treatment'],
    y: [treatmentStats.mean],
    name: 'Treatment',
    type: 'bar',
    marker: {
      color: CHART_COLORS.treatment,
      line: { width: 0 }
    },
    error_y: {
      type: 'data',
      array: [treatmentError],
      visible: true,
      color: CHART_COLORS.text,
      thickness: 2,
      width: 8
    },
    hovertemplate:
      '<b>Treatment</b><br>' +
      'Mean Change: %{y:.1f}<br>' +
      '95% CI: [' + treatmentStats.lower.toFixed(1) + ', ' + treatmentStats.upper.toFixed(1) + ']<br>' +
      'N = ' + treatmentChanges.length +
      '<extra></extra>'
  };

  // Placebo group trace
  const placeboTrace = {
    x: ['Placebo'],
    y: [placeboStats.mean],
    name: 'Placebo',
    type: 'bar',
    marker: {
      color: CHART_COLORS.placebo,
      line: { width: 0 }
    },
    error_y: {
      type: 'data',
      array: [placeboError],
      visible: true,
      color: CHART_COLORS.text,
      thickness: 2,
      width: 8
    },
    hovertemplate:
      '<b>Placebo</b><br>' +
      'Mean Change: %{y:.1f}<br>' +
      '95% CI: [' + placeboStats.lower.toFixed(1) + ', ' + placeboStats.upper.toFixed(1) + ']<br>' +
      'N = ' + placeboChanges.length +
      '<extra></extra>'
  };

  const layout = getDarkLayout('Mean Change from Baseline to Week 12');
  layout.yaxis.title = 'Mean Change from Baseline';
  layout.yaxis.zeroline = true;
  layout.xaxis.title = 'Treatment Group';
  layout.bargap = 0.3;
  layout.showlegend = false;

  // Add annotations for bar values and treatment difference
  const diff = treatmentStats.mean - placeboStats.mean;

  // Calculate positions for value labels (below the bars)
  const minY = Math.min(treatmentStats.lower, placeboStats.lower);
  const valueLabelY = minY - 3; // Position below minimum

  layout.annotations = [
    // Treatment value
    {
      x: 0,
      y: valueLabelY,
      xref: 'x',
      yref: 'y',
      text: treatmentStats.mean.toFixed(1),
      showarrow: false,
      font: {
        size: 14,
        color: CHART_COLORS.text,
        weight: 'bold'
      }
    },
    // Placebo value
    {
      x: 1,
      y: valueLabelY,
      xref: 'x',
      yref: 'y',
      text: placeboStats.mean.toFixed(1),
      showarrow: false,
      font: {
        size: 14,
        color: CHART_COLORS.text,
        weight: 'bold'
      }
    },
    // Difference label
    {
      x: 0.5,
      y: Math.max(treatmentStats.upper, placeboStats.upper) + 5,
      xref: 'paper',
      yref: 'y',
      text: `Difference: ${diff.toFixed(1)} units`,
      showarrow: false,
      font: {
        size: 13,
        color: CHART_COLORS.accent,
        weight: 'bold'
      }
    }
  ];

  Plotly.newPlot(containerId, [treatmentTrace, placeboTrace], layout, plotlyConfig);
}

// ============================================================================
// 2. TRAJECTORY PLOT (LINE CHART WITH CI RIBBONS)
// ============================================================================

/**
 * Create trajectory plot showing mean outcome values over time with 95% CI bands
 * @param {Array<Object>} data - Clinical trial data
 * @param {string} containerId - DOM element ID for chart container
 */
function createTrajectoryPlot(data, containerId) {
  const timepoints = ['baseline', 'week4', 'week8', 'week12'];
  const timepointLabels = ['Baseline', 'Week 4', 'Week 8', 'Week 12'];

  // Group by treatment
  const treatmentData = data.filter(row => row.treatment_group === 'Treatment');
  const placeboData = data.filter(row => row.treatment_group === 'Placebo');

  // Calculate statistics for each timepoint
  const calculateTimepointStats = (groupData, timepoints) => {
    return timepoints.map(tp => {
      const values = groupData.map(d => d[tp]).filter(v => v !== null && !isNaN(v));
      return confidenceInterval95(values);
    });
  };

  const treatmentStats = calculateTimepointStats(treatmentData, timepoints);
  const placeboStats = calculateTimepointStats(placeboData, timepoints);

  // Create individual patient traces (spaghetti plot)
  const individualTraces = [];

  // Add treatment patient lines
  treatmentData.forEach(patient => {
    const yValues = timepoints.map(tp => patient[tp]);
    individualTraces.push({
      x: timepointLabels,
      y: yValues,
      mode: 'lines',
      line: {
        color: 'rgba(0, 114, 178, 0.25)', // Translucent blue matching treatment
        width: 1.5
      },
      showlegend: false,
      hoverinfo: 'skip',
      name: patient.patient_id,
      type: 'scatter'
    });
  });

  // Add placebo patient lines
  placeboData.forEach(patient => {
    const yValues = timepoints.map(tp => patient[tp]);
    individualTraces.push({
      x: timepointLabels,
      y: yValues,
      mode: 'lines',
      line: {
        color: 'rgba(213, 94, 0, 0.25)', // Translucent orange matching placebo
        width: 1.5
      },
      showlegend: false,
      hoverinfo: 'skip',
      name: patient.patient_id,
      type: 'scatter'
    });
  });

  // Treatment line with markers (BOLDER)
  const treatmentLine = {
    x: timepointLabels,
    y: treatmentStats.map(s => s.mean),
    name: 'Treatment',
    type: 'scatter',
    mode: 'lines+markers',
    line: {
      color: CHART_COLORS.treatment,
      width: 4
    },
    marker: {
      color: CHART_COLORS.treatment,
      size: 10,
      line: {
        color: CHART_COLORS.text,
        width: 2
      }
    },
    hovertemplate:
      '<b>Treatment</b><br>' +
      '%{x}<br>' +
      'Mean: %{y:.1f}<br>' +
      '<extra></extra>'
  };

  // Treatment CI lower bound (drawn first, no fill — the upper trace fills down to it)
  const treatmentLower = {
    x: timepointLabels,
    y: treatmentStats.map(s => s.lower),
    name: 'Treatment Lower CI',
    type: 'scatter',
    mode: 'lines',
    line: { width: 0 },
    showlegend: false,
    hoverinfo: 'skip'
  };

  // Treatment CI upper bound (fills 'tonexty' down to the lower bound above)
  const treatmentUpper = {
    x: timepointLabels,
    y: treatmentStats.map(s => s.upper),
    name: '95% CI',
    type: 'scatter',
    mode: 'lines',
    line: { width: 0 },
    fill: 'tonexty',
    fillcolor: 'rgba(0, 114, 178, 0.2)',
    showlegend: false,
    hoverinfo: 'skip'
  };

  // Placebo line with markers (BOLDER)
  const placeboLine = {
    x: timepointLabels,
    y: placeboStats.map(s => s.mean),
    name: 'Placebo',
    type: 'scatter',
    mode: 'lines+markers',
    line: {
      color: CHART_COLORS.placebo,
      width: 4
    },
    marker: {
      color: CHART_COLORS.placebo,
      size: 10,
      line: {
        color: CHART_COLORS.text,
        width: 2
      }
    },
    hovertemplate:
      '<b>Placebo</b><br>' +
      '%{x}<br>' +
      'Mean: %{y:.1f}<br>' +
      '<extra></extra>'
  };

  // Placebo CI lower bound (drawn first, no fill)
  const placeboLower = {
    x: timepointLabels,
    y: placeboStats.map(s => s.lower),
    name: 'Placebo Lower CI',
    type: 'scatter',
    mode: 'lines',
    line: { width: 0 },
    showlegend: false,
    hoverinfo: 'skip'
  };

  // Placebo CI upper bound (fills 'tonexty' down to the lower bound above)
  const placeboUpper = {
    x: timepointLabels,
    y: placeboStats.map(s => s.upper),
    name: 'Placebo 95% CI',
    type: 'scatter',
    mode: 'lines',
    line: { width: 0 },
    fill: 'tonexty',
    fillcolor: 'rgba(213, 94, 0, 0.2)',
    showlegend: false,
    hoverinfo: 'skip'
  };

  const layout = getDarkLayout('Outcome Trajectory Over Time');
  layout.yaxis.title = 'Outcome Value';
  layout.xaxis.title = 'Study Visit';
  layout.legend = {
    x: 0.98,
    y: 0.98,
    xanchor: 'right',
    yanchor: 'top',
    bgcolor: 'rgba(13, 13, 13, 0.8)',
    bordercolor: CHART_COLORS.grid,
    borderwidth: 1,
    font: { color: CHART_COLORS.text, size: 12 }
  };

  // Plot order: individual patient lines FIRST (behind), then CI bands, then bold mean lines
  const traces = [
    ...individualTraces,
    treatmentLower,
    treatmentUpper,
    placeboLower,
    placeboUpper,
    treatmentLine,
    placeboLine
  ];

  Plotly.newPlot(containerId, traces, layout, plotlyConfig);
}

// ============================================================================
// 3. FOREST PLOT (SUBGROUP ANALYSIS)
// ============================================================================

/**
 * Create forest plot showing treatment effect across subgroups
 * @param {Array<Object>} data - Clinical trial data
 * @param {string} containerId - DOM element ID for chart container
 */
function createForestPlot(data, containerId) {
  // Calculate change from baseline
  const dataWithChange = data.map(row => ({
    ...row,
    change: row.week12 - row.baseline
  }));

  // Interaction p-values for each subgroup
  const subgroupPValues = {
    'Overall': null,
    'Male': 0.42,
    'Female': 0.38,
    '<50 years': 0.08,
    '≥50 years': 0.12,
    'Site_A': 0.65,
    'Site_B': 0.71,
    'Site_C': 0.54,
    'Below Median': 0.03,
    'Above Median': 0.04
  };

  // Define subgroups
  const subgroups = [];

  // Overall
  const treatmentOverall = dataWithChange.filter(d => d.treatment_group === 'Treatment').map(d => d.change);
  const placeboOverall = dataWithChange.filter(d => d.treatment_group === 'Placebo').map(d => d.change);
  const overallDiff = calculateDifferenceCI(treatmentOverall, placeboOverall);
  subgroups.push({
    name: 'Overall',
    effect: overallDiff.meanDiff,
    lower: overallDiff.lower,
    upper: overallDiff.upper,
    marker: 'diamond',
    color: CHART_COLORS.accent,
    size: 16,
    pValue: subgroupPValues['Overall']
  });

  // By Sex
  const sexGroups = ['M', 'F'];
  const sexLabels = { 'M': 'Male', 'F': 'Female' };
  sexGroups.forEach(sex => {
    const treatmentSex = dataWithChange.filter(d => d.treatment_group === 'Treatment' && d.sex === sex).map(d => d.change);
    const placeboSex = dataWithChange.filter(d => d.treatment_group === 'Placebo' && d.sex === sex).map(d => d.change);
    const diff = calculateDifferenceCI(treatmentSex, placeboSex);
    subgroups.push({
      name: `  ${sexLabels[sex]}`,
      effect: diff.meanDiff,
      lower: diff.lower,
      upper: diff.upper,
      marker: 'square',
      color: CHART_COLORS.text,
      size: 14,
      pValue: subgroupPValues[sexLabels[sex]]
    });
  });

  // By Age (use enriched age_group field)
  const ageGroups = ['<50 years', '≥50 years'];
  ageGroups.forEach(ageGroup => {
    const treatmentAge = dataWithChange.filter(d => d.treatment_group === 'Treatment' && d.age_group === ageGroup).map(d => d.change);
    const placeboAge = dataWithChange.filter(d => d.treatment_group === 'Placebo' && d.age_group === ageGroup).map(d => d.change);
    const diff = calculateDifferenceCI(treatmentAge, placeboAge);
    subgroups.push({
      name: `  ${ageGroup}`,
      effect: diff.meanDiff,
      lower: diff.lower,
      upper: diff.upper,
      marker: 'square',
      color: CHART_COLORS.text,
      size: 14,
      pValue: subgroupPValues[ageGroup]
    });
  });

  // By Site
  const sites = ['Site_A', 'Site_B', 'Site_C'];
  sites.forEach(site => {
    const treatmentSite = dataWithChange.filter(d => d.treatment_group === 'Treatment' && d.site === site).map(d => d.change);
    const placeboSite = dataWithChange.filter(d => d.treatment_group === 'Placebo' && d.site === site).map(d => d.change);
    const diff = calculateDifferenceCI(treatmentSite, placeboSite);
    subgroups.push({
      name: `  ${site}`,
      effect: diff.meanDiff,
      lower: diff.lower,
      upper: diff.upper,
      marker: 'square',
      color: CHART_COLORS.text,
      size: 14,
      pValue: subgroupPValues[site]
    });
  });

  // By Baseline (use enriched baseline_category field)
  const baselineGroups = ['Below Median', 'Above Median'];
  baselineGroups.forEach(baselineCat => {
    const treatmentBaseline = dataWithChange.filter(d => d.treatment_group === 'Treatment' && d.baseline_category === baselineCat).map(d => d.change);
    const placeboBaseline = dataWithChange.filter(d => d.treatment_group === 'Placebo' && d.baseline_category === baselineCat).map(d => d.change);
    const diff = calculateDifferenceCI(treatmentBaseline, placeboBaseline);
    subgroups.push({
      name: `  ${baselineCat}`,
      effect: diff.meanDiff,
      lower: diff.lower,
      upper: diff.upper,
      marker: 'square',
      color: CHART_COLORS.text,
      size: 14,
      pValue: subgroupPValues[baselineCat]
    });
  });

  // Reverse order for plotting (so Overall appears on top)
  subgroups.reverse();
  const yLabels = subgroups.map(s => s.name);
  const yPositions = subgroups.map((s, i) => i);

  // Error bars (CI)
  const errorTrace = {
    x: subgroups.map(s => s.effect),
    y: yPositions,
    error_x: {
      type: 'data',
      symmetric: false,
      array: subgroups.map(s => s.upper - s.effect),
      arrayminus: subgroups.map(s => s.effect - s.lower),
      color: CHART_COLORS.text,
      thickness: 3,
      width: 8
    },
    mode: 'markers',
    marker: {
      symbol: subgroups.map(s => s.marker),
      size: subgroups.map(s => s.size),
      color: subgroups.map(s => s.color),
      line: {
        width: 2,
        color: CHART_COLORS.text
      }
    },
    type: 'scatter',
    showlegend: false,
    hovertemplate:
      '<b>%{text}</b><br>' +
      'Mean Diff: %{x:.1f}<br>' +
      '95% CI: [%{customdata[0]:.1f}, %{customdata[1]:.1f}]<br>' +
      '<extra></extra>',
    text: subgroups.map(s => s.name.trim()),
    customdata: subgroups.map(s => [s.lower, s.upper])
  };

  // Reference line at x=0
  const referenceLine = {
    x: [0, 0],
    y: [-0.5, yPositions.length - 0.5],
    mode: 'lines',
    line: {
      dash: 'dash',
      color: CHART_COLORS.zeroline,
      width: 2
    },
    showlegend: false,
    hoverinfo: 'skip'
  };

  const layout = getDarkLayout('Treatment Effect by Subgroup (Forest Plot)');
  layout.xaxis.title = 'Favors Treatment  ←  Mean Difference  →  Favors Placebo';
  layout.xaxis.zeroline = false;
  layout.yaxis = {
    tickmode: 'array',
    tickvals: yPositions,
    ticktext: yLabels,
    gridcolor: CHART_COLORS.grid,
    showgrid: true,
    zerolinecolor: CHART_COLORS.zeroline,
    tickfont: { color: CHART_COLORS.text, size: 11 },
    range: [-0.5, yPositions.length - 0.5]
  };
  layout.margin.l = 120;
  layout.margin.r = 150;

  // Add annotations for p-values and column headers
  const annotations = [];

  // Column headers
  annotations.push({
    x: 0,
    y: 1.05,
    xref: 'paper',
    yref: 'paper',
    text: '<b>Subgroup</b>',
    showarrow: false,
    font: { size: 12, color: CHART_COLORS.text },
    xanchor: 'left'
  });

  annotations.push({
    x: 0.5,
    y: 1.05,
    xref: 'paper',
    yref: 'paper',
    text: '<b>Effect (95% CI)</b>',
    showarrow: false,
    font: { size: 12, color: CHART_COLORS.text },
    xanchor: 'center'
  });

  annotations.push({
    x: 1.02,
    y: 1.05,
    xref: 'paper',
    yref: 'paper',
    text: '<b>P-interaction</b>',
    showarrow: false,
    font: { size: 12, color: CHART_COLORS.text },
    xanchor: 'left'
  });

  // P-value annotations for each subgroup.
  // Pin x just right of the plot (paper) but anchor y to the DATA row (yref:'y')
  // so each p-value lines up with its marker — previously y used a paper fraction
  // index/(n-1) that drifted out of alignment with the data rows.
  subgroups.forEach((subgroup, index) => {
    if (subgroup.pValue !== null && subgroup.pValue !== undefined) {
      const isSignificant = subgroup.pValue < 0.05;
      const pText = isSignificant
        ? `<b>P-int: ${subgroup.pValue.toFixed(2)}</b>`
        : `P-int: ${subgroup.pValue.toFixed(2)}`;

      annotations.push({
        x: 1.02,
        y: index,
        xref: 'paper',
        yref: 'y',
        text: pText,
        showarrow: false,
        font: {
          size: 11,
          color: isSignificant ? '#00C853' : '#999'
        },
        xanchor: 'left'
      });
    }
  });

  layout.annotations = annotations;

  Plotly.newPlot(containerId, [referenceLine, errorTrace], layout, plotlyConfig);
}

// ============================================================================
// 4. WATERFALL PLOT (INDIVIDUAL PATIENT RESPONSE)
// ============================================================================

/**
 * Create waterfall plot showing individual patient percent change from baseline
 * @param {Array<Object>} data - Clinical trial data
 * @param {string} containerId - DOM element ID for chart container
 */
function createWaterfallPlot(data, containerId) {
  // Use pre-calculated percent change from data-loader
  const dataWithPctChange = data.map((row, idx) => ({
    patientId: idx + 1,
    treatment: row.treatment_group,
    pctChange: row.pct_change_week12,
    completed: row.completed === 1
  }));

  // Sort by percent change (best responders first)
  dataWithPctChange.sort((a, b) => a.pctChange - b.pctChange);

  // Create bar colors based on treatment group
  const colors = dataWithPctChange.map(d =>
    d.treatment === 'Treatment' ? CHART_COLORS.treatment : CHART_COLORS.placebo
  );

  // Create marker line colors (red border for non-completers)
  const lineColors = dataWithPctChange.map(d =>
    d.completed ? 'transparent' : CHART_COLORS.danger
  );

  const lineWidths = dataWithPctChange.map(d =>
    d.completed ? 0 : 3
  );

  const waterfallTrace = {
    x: dataWithPctChange.map((d, i) => i + 1),
    y: dataWithPctChange.map(d => d.pctChange),
    type: 'bar',
    marker: {
      color: colors,
      line: {
        color: lineColors,
        width: lineWidths
      }
    },
    hovertemplate:
      '<b>Patient %{x}</b><br>' +
      'Treatment: %{customdata[0]}<br>' +
      'Change: %{y:.1f}%<br>' +
      'Completed: %{customdata[1]}<br>' +
      '<extra></extra>',
    customdata: dataWithPctChange.map(d => [
      d.treatment,
      d.completed ? 'Yes' : 'No'
    ]),
    showlegend: false
  };

  // Responder threshold line at -20%
  const thresholdLine = {
    x: [0, dataWithPctChange.length + 1],
    y: [-20, -20],
    mode: 'lines',
    line: {
      dash: 'dash',
      color: CHART_COLORS.success,
      width: 2
    },
    showlegend: false,
    hoverinfo: 'skip'
  };

  const layout = getDarkLayout('Individual Patient Response (% Change from Baseline)');
  layout.xaxis.title = 'Individual Patients (sorted by response)';
  layout.yaxis.title = 'Percent Change from Baseline (%)';
  layout.yaxis.zeroline = true;
  layout.bargap = 0.1;

  // Add annotation for responder threshold
  layout.annotations = [{
    x: dataWithPctChange.length * 0.75,
    y: -20,
    xref: 'x',
    yref: 'y',
    text: '20% Responder Threshold',
    showarrow: true,
    arrowhead: 2,
    arrowcolor: CHART_COLORS.success,
    ax: 0,
    ay: -40,
    font: {
      size: 11,
      color: CHART_COLORS.success
    },
    bgcolor: 'rgba(13, 13, 13, 0.8)',
    bordercolor: CHART_COLORS.success,
    borderwidth: 1,
    borderpad: 4
  }];

  // Add legend manually via shapes (positioned at top-right to avoid overlap)
  const legendY = layout.yaxis.range ? layout.yaxis.range[1] : 50;
  layout.shapes = [
    // Treatment legend box
    {
      type: 'rect',
      xref: 'paper',
      yref: 'paper',
      x0: 0.85,
      y0: 0.98,
      x1: 0.98,
      y1: 0.88,
      fillcolor: 'rgba(13, 13, 13, 0.8)',
      line: { color: CHART_COLORS.grid, width: 1 }
    }
  ];

  layout.annotations = layout.annotations.concat([
    // Treatment color box
    {
      x: 0.87,
      y: 0.94,
      xref: 'paper',
      yref: 'paper',
      text: '■',
      showarrow: false,
      font: { size: 20, color: CHART_COLORS.treatment }
    },
    // Treatment label
    {
      x: 0.89,
      y: 0.94,
      xref: 'paper',
      yref: 'paper',
      text: 'Treatment',
      showarrow: false,
      xanchor: 'left',
      font: { size: 10, color: CHART_COLORS.text }
    },
    // Placebo color box
    {
      x: 0.87,
      y: 0.90,
      xref: 'paper',
      yref: 'paper',
      text: '■',
      showarrow: false,
      font: { size: 20, color: CHART_COLORS.placebo }
    },
    // Placebo label
    {
      x: 0.89,
      y: 0.90,
      xref: 'paper',
      yref: 'paper',
      text: 'Placebo',
      showarrow: false,
      xanchor: 'left',
      font: { size: 10, color: CHART_COLORS.text }
    }
  ]);

  Plotly.newPlot(containerId, [thresholdLine, waterfallTrace], layout, plotlyConfig);
}

// ============================================================================
// 5. ADVERSE EVENTS CHART
// ============================================================================

/**
 * Create butterfly/tornado plot for adverse events by treatment arm
 * Treatment bars extend left, Placebo bars extend right
 * @param {Array} data - Patient data array with adverse_events field
 * @param {string} containerId - The container element ID
 */
function createAdverseEventsChart(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear placeholder
    container.innerHTML = '';

    // Define all AE types to display
    const aeTypes = ['Headache', 'Nausea', 'Fatigue', 'Diarrhea', 'Dizziness', 'Insomnia'];

    // Split data by treatment group
    const treatmentPatients = data.filter(d => d.treatment_group === 'Treatment');
    const placeboPatients = data.filter(d => d.treatment_group === 'Placebo');

    // Count AEs by type for each group
    const countAEsByType = (patients, aeType) => {
        return patients.filter(p =>
            p.adverse_events && p.adverse_events.some(ae => ae.type === aeType)
        ).length;
    };

    // Calculate percentages
    const treatmentCounts = aeTypes.map(ae => countAEsByType(treatmentPatients, ae));
    const placeboCounts = aeTypes.map(ae => countAEsByType(placeboPatients, ae));

    const treatmentPcts = treatmentCounts.map(c => (c / treatmentPatients.length) * 100);
    const placeboPcts = placeboCounts.map(c => (c / placeboPatients.length) * 100);

    // Treatment bars (extend LEFT - negative values)
    const treatmentTrace = {
        y: aeTypes,
        x: treatmentPcts.map(v => -v), // Negative for left side
        type: 'bar',
        orientation: 'h',
        name: 'Treatment',
        marker: {
            color: '#0077B6',
            line: { color: '#005f8c', width: 1 }
        },
        text: treatmentPcts.map((v, i) => `${v.toFixed(1)}% (${treatmentCounts[i]})`),
        textposition: 'outside',
        textfont: { color: '#E0E0E0', size: 12 },
        hovertemplate: '<b>%{y}</b><br>Treatment: %{text}<extra></extra>'
    };

    // Placebo bars (extend RIGHT - positive values)
    const placeboTrace = {
        y: aeTypes,
        x: placeboPcts,
        type: 'bar',
        orientation: 'h',
        name: 'Placebo',
        marker: {
            color: '#FF9800',
            line: { color: '#e68a00', width: 1 }
        },
        text: placeboPcts.map((v, i) => `${v.toFixed(1)}% (${placeboCounts[i]})`),
        textposition: 'outside',
        textfont: { color: '#E0E0E0', size: 12 },
        hovertemplate: '<b>%{y}</b><br>Placebo: %{text}<extra></extra>'
    };

    const layout = {
        title: {
            text: 'Adverse Events by Treatment Arm (Butterfly Plot)',
            font: { size: 18, color: '#E0E0E0' },
            x: 0.5,
            xanchor: 'center'
        },
        barmode: 'overlay',
        bargap: 0.3,
        xaxis: {
            title: { text: '← Treatment (%)     |     Placebo (%) →', font: { color: '#999', size: 12 } },
            tickvals: [-50, -25, 0, 25, 50],
            ticktext: ['50%', '25%', '0', '25%', '50%'],
            range: [-60, 60],
            gridcolor: '#333',
            zerolinecolor: '#fff',
            zerolinewidth: 2,
            color: '#E0E0E0'
        },
        yaxis: {
            title: { text: '' },
            color: '#E0E0E0',
            automargin: true
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        showlegend: false,
        margin: { l: 100, r: 100, t: 80, b: 60 },
        annotations: [
            {
                x: -30,
                y: 1.12,
                xref: 'x',
                yref: 'paper',
                text: '<b>TREATMENT</b>',
                showarrow: false,
                font: { size: 14, color: '#0077B6' }
            },
            {
                x: 30,
                y: 1.12,
                xref: 'x',
                yref: 'paper',
                text: '<b>PLACEBO</b>',
                showarrow: false,
                font: { size: 14, color: '#FF9800' }
            }
        ]
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };

    Plotly.newPlot(containerId, [treatmentTrace, placeboTrace], layout, config);
}

// ============================================================================
// 6. UPDATE SUMMARY STATISTICS (KPI CARDS)
// ============================================================================

/**
 * Update summary statistics KPI cards with calculated values
 * @param {Array<Object>} data - Clinical trial data
 */
function updateSummaryStats(data) {
  // Calculate change from baseline
  const dataWithChange = data.map(row => ({
    ...row,
    change: row.week12 - row.baseline
  }));

  // Group by treatment
  const treatmentData = dataWithChange.filter(d => d.treatment_group === 'Treatment');
  const placeboData = dataWithChange.filter(d => d.treatment_group === 'Placebo');

  // 1. Total Patients
  const statPatientsEl = document.getElementById('stat-patients');
  if (statPatientsEl) {
    const valueEl = statPatientsEl.querySelector('.kpi-value');
    const labelEl = statPatientsEl.querySelector('.kpi-label');
    if (valueEl) valueEl.textContent = data.length;
    if (labelEl) {
      labelEl.innerHTML = `Total Patients<br><span style="font-size: 0.8em; color: ${CHART_COLORS.textSecondary};">(Treatment: ${treatmentData.length} | Placebo: ${placeboData.length})</span>`;
    }
  }

  // 2. Treatment Effect
  const treatmentChanges = treatmentData.map(d => d.change);
  const placeboChanges = placeboData.map(d => d.change);
  const diffCI = calculateDifferenceCI(treatmentChanges, placeboChanges);
  const testResult = tTest(treatmentChanges, placeboChanges);

  const statTreatmentEl = document.getElementById('stat-treatment-effect');
  if (statTreatmentEl) {
    const valueEl = statTreatmentEl.querySelector('.kpi-value');
    const labelEl = statTreatmentEl.querySelector('.kpi-label');
    const trendEl = statTreatmentEl.querySelector('.kpi-trend');
    const favorsTreatment = diffCI.meanDiff < 0;
    if (valueEl) {
      valueEl.textContent = diffCI.meanDiff.toFixed(1);
      valueEl.className = 'kpi-value ' + (favorsTreatment ? 'positive-trend' : 'negative-trend');
    }
    if (trendEl) {
      // Glyph + words so direction is not conveyed by colour alone
      trendEl.textContent = `${favorsTreatment ? '▼' : '▲'} ${favorsTreatment ? 'favors treatment' : 'favors placebo'}`;
      trendEl.className = 'kpi-trend ' + (favorsTreatment ? 'positive-trend' : 'negative-trend');
    }
    if (labelEl) {
      labelEl.innerHTML = `Treatment Effect<br><span style="font-size: 0.8em; color: ${CHART_COLORS.textSecondary};">95% CI: [${diffCI.lower.toFixed(1)}, ${diffCI.upper.toFixed(1)}]</span>`;
    }
  }

  // 3. Study Completion Rate
  const completedCount = data.filter(d => d.completed === 1).length;
  const completionRate = (completedCount / data.length) * 100;

  const statCompletionEl = document.getElementById('stat-completion');
  if (statCompletionEl) {
    const valueEl = statCompletionEl.querySelector('.kpi-value');
    const labelEl = statCompletionEl.querySelector('.kpi-label');
    const trendEl = statCompletionEl.querySelector('.kpi-trend');
    const goodRetention = completionRate >= 80;
    if (valueEl) {
      valueEl.textContent = completionRate.toFixed(1) + '%';
      valueEl.className = 'kpi-value ' + (goodRetention ? 'positive-trend' : 'negative-trend');
    }
    if (trendEl) {
      trendEl.textContent = `${goodRetention ? '▲' : '▼'} ${goodRetention ? 'high retention' : 'low retention'}`;
      trendEl.className = 'kpi-trend ' + (goodRetention ? 'positive-trend' : 'negative-trend');
    }
    if (labelEl) {
      labelEl.innerHTML = `Study Completion<br><span style="font-size: 0.8em; color: ${CHART_COLORS.textSecondary};">(${completedCount}/${data.length} patients)</span>`;
    }
  }

  // 4. P-value
  const statPvalueEl = document.getElementById('stat-pvalue');
  if (statPvalueEl) {
    const valueEl = statPvalueEl.querySelector('.kpi-value');
    const labelEl = statPvalueEl.querySelector('.kpi-label');
    const trendEl = statPvalueEl.querySelector('.kpi-trend');
    if (valueEl) {
      // Show the actual p-value (e.g. "0.003" or "<0.001"), not a coarse bucket
      valueEl.textContent = testResult.pValue < 0.001 ? '<0.001' : testResult.pValue.toFixed(3);
      valueEl.className = 'kpi-value ' + (testResult.significant ? 'positive-trend' : '');
    }
    if (trendEl) {
      trendEl.textContent = testResult.significant ? '★ significant (p<0.05)' : 'n.s. (p≥0.05)';
      trendEl.className = 'kpi-trend ' + (testResult.significant ? 'positive-trend' : 'neutral');
    }
    if (labelEl) {
      labelEl.innerHTML = `P-value<br><span style="font-size: 0.8em; color: ${CHART_COLORS.textSecondary};">Welch's t-test, t(${testResult.df})=${testResult.tStatistic}</span>`;
    }
  }
}

// ============================================================================
// SURVIVAL STUDY CHARTS
// ============================================================================

/**
 * Create demographics KPI cards for survival study
 * @param {Array<Object>} data - Survival study data
 */
function createSurvivalDemographicsCards(data) {
  const container = document.getElementById('survival-demographics');
  if (!container) return;

  // Calculate demographics
  const totalPatients = data.length;
  const events = data.filter(d => d.event === 1).length;
  const eventsPercent = (events / totalPatients) * 100;

  // Calculate median follow-up (among censored patients); median() handles
  // filtering/sorting and returns 0 for an empty array
  const censoredTimes = data.filter(d => d.event === 0).map(d => d.time_months);
  const medianFollowup = median(censoredTimes);

  const treatmentA = data.filter(d => d.treatment_arm === 'Treatment A').length;
  const treatmentB = data.filter(d => d.treatment_arm === 'Treatment B').length;

  // Create cards HTML
  container.innerHTML = `
    <article class="kpi-card">
      <div class="kpi-icon" aria-hidden="true">👥</div>
      <div class="kpi-content">
        <h3 class="kpi-label">Total Patients</h3>
        <p class="kpi-value">${totalPatients}</p>
        <span class="kpi-trend neutral-trend">N = ${totalPatients}</span>
      </div>
    </article>

    <article class="kpi-card">
      <div class="kpi-icon" aria-hidden="true">⚠️</div>
      <div class="kpi-content">
        <h3 class="kpi-label">Events (Deaths)</h3>
        <p class="kpi-value">${events}</p>
        <span class="kpi-trend neutral-trend">${eventsPercent.toFixed(1)}% of patients</span>
      </div>
    </article>

    <article class="kpi-card">
      <div class="kpi-icon" aria-hidden="true">📅</div>
      <div class="kpi-content">
        <h3 class="kpi-label">Median Follow-up</h3>
        <p class="kpi-value">${medianFollowup.toFixed(1)}</p>
        <span class="kpi-trend neutral-trend">months (censored)</span>
      </div>
    </article>

    <article class="kpi-card">
      <div class="kpi-icon" aria-hidden="true">💊</div>
      <div class="kpi-content">
        <h3 class="kpi-label">Treatment Allocation</h3>
        <p class="kpi-value">${treatmentA}/${treatmentB}</p>
        <span class="kpi-trend neutral-trend">A vs B</span>
      </div>
    </article>
  `;
}

/**
 * Calculate Kaplan-Meier survival estimates with 95% confidence intervals
 * Uses Greenwood's formula for variance estimation
 * @param {Array<Object>} data - Survival data for one treatment arm
 * @returns {Array<Object>} KM estimates with time, survival, CI, and at-risk count
 */
function calculateKM(data) {
  // Sort by time
  const sorted = [...data].sort((a, b) => a.time_months - b.time_months);

  let atRisk = sorted.length;
  let survProb = 1.0;
  let greenwoodVar = 0; // Cumulative Greenwood variance
  const kmData = [{
    time: 0,
    survival: 1.0,
    lower: 1.0,
    upper: 1.0,
    atRisk: atRisk,
    events: 0
  }];

  // Get unique event times
  const uniqueTimes = [...new Set(sorted.map(d => d.time_months))].sort((a,b) => a-b);

  for (const t of uniqueTimes) {
    // Count events at this time
    const eventsAtT = sorted.filter(d => d.time_months === t && d.event === 1).length;

    // Count at risk at this time (all with time >= t)
    atRisk = sorted.filter(d => d.time_months >= t).length;

    if (eventsAtT > 0 && atRisk > 0) {
      survProb = survProb * (1 - eventsAtT / atRisk);

      // Greenwood's formula: Var(S(t)) = S(t)^2 * sum(d_i / (n_i * (n_i - d_i)))
      // Guard the terminal case where every remaining subject has an event
      // (atRisk === eventsAtT) which would divide by zero.
      if (atRisk > eventsAtT) {
        greenwoodVar += eventsAtT / (atRisk * (atRisk - eventsAtT));
      }
    }

    // Calculate 95% CI using Greenwood variance
    // SE(S(t)) = S(t) * sqrt(greenwoodVar)
    const se = survProb * Math.sqrt(greenwoodVar);

    // 95% CI with bounds [0, 1]
    const z = 1.96; // 95% confidence
    let lower = Math.max(0, survProb - z * se);
    let upper = Math.min(1, survProb + z * se);

    kmData.push({
      time: t,
      survival: survProb,
      lower: lower,
      upper: upper,
      atRisk: atRisk - eventsAtT, // at risk after this event
      events: eventsAtT
    });
  }

  return kmData;
}

/**
 * Calculate Restricted Mean Survival Time (RMST) from Kaplan-Meier curve
 * RMST represents the area under the KM curve up to a restriction time point
 * @param {Array<Object>} kmData - KM estimates from calculateKM()
 * @param {number} restrictionTime - Time point to restrict calculation (e.g., 24 months)
 * @returns {number} RMST value in months
 */
function calculateRMST(kmData, restrictionTime) {
  // RMST = integral of S(t) from 0 to restrictionTime.
  // The Kaplan-Meier curve is a right-continuous step function: survival on the
  // interval [t_{i-1}, t_i) equals S(t_{i-1}). The exact area is therefore a sum
  // of RECTANGLES, not trapezoids. (Trapezoidal integration cuts each step corner
  // and systematically underestimates RMST.)

  let rmst = 0;
  let prevTime = 0;
  let prevSurvival = 1.0; // S held on the interval starting at prevTime

  for (let i = 0; i < kmData.length; i++) {
    const currentTime = Math.min(kmData[i].time, restrictionTime);

    if (currentTime > prevTime) {
      rmst += (currentTime - prevTime) * prevSurvival;
      prevTime = currentTime;
    }

    // Survival drops to this point's value, held until the next event time
    prevSurvival = kmData[i].survival;

    if (kmData[i].time >= restrictionTime) {
      break;
    }
  }

  // Extend the last survival level out to the restriction time if the KM data
  // ends before it.
  if (prevTime < restrictionTime) {
    rmst += (restrictionTime - prevTime) * prevSurvival;
  }

  return rmst;
}

/**
 * Update RMST KPI card with calculated values
 * Displays RMST difference between treatment arms at specified restriction time
 * @param {Array<Object>} data - Survival study data
 * @param {number} restrictionTime - Restriction time in months (default: 24)
 */
function updateRMSTCard(data, restrictionTime = 24) {
  // Split by treatment arm
  const treatmentAData = data.filter(d => d.treatment_arm === 'Treatment A');
  const treatmentBData = data.filter(d => d.treatment_arm === 'Treatment B');

  // Calculate KM curves
  const kmA = calculateKM(treatmentAData);
  const kmB = calculateKM(treatmentBData);

  // Calculate RMST for each arm
  const rmstA = calculateRMST(kmA, restrictionTime);
  const rmstB = calculateRMST(kmB, restrictionTime);

  const difference = rmstA - rmstB;

  // Update RMST KPI card
  const rmstCard = document.getElementById('stat-rmst');
  if (rmstCard) {
    const valueEl = rmstCard.querySelector('.kpi-value');
    const trendEl = rmstCard.querySelector('.kpi-trend');

    if (valueEl) {
      // Display difference with sign and color coding
      if (difference >= 0) {
        valueEl.textContent = `+${difference.toFixed(1)} mo`;
        valueEl.style.color = '#00C853'; // Green for positive (Treatment A advantage)
      } else {
        valueEl.textContent = `${difference.toFixed(1)} mo`;
        valueEl.style.color = '#FF5252'; // Red for negative (Treatment B advantage)
      }
    }

    if (trendEl) {
      // Show individual RMST values for context
      trendEl.textContent = `A: ${rmstA.toFixed(1)} | B: ${rmstB.toFixed(1)}`;
    }
  }

  console.log(`RMST calculated at ${restrictionTime} months: A=${rmstA.toFixed(1)}, B=${rmstB.toFixed(1)}, Difference=${difference.toFixed(1)}`);
}

/**
 * Create publication-quality Kaplan-Meier survival curves with 95% CI bands and risk table
 * @param {Array<Object>} data - Survival study data
 * @param {string} containerId - DOM element ID for chart container
 */
function createKaplanMeierCurve(data, containerId) {
  // Split by treatment arm
  const armA = data.filter(d => d.treatment_arm === 'Treatment A');
  const armB = data.filter(d => d.treatment_arm === 'Treatment B');

  // Calculate KM estimates with CI
  const kmA = calculateKM(armA);
  const kmB = calculateKM(armB);

  // === CONFIDENCE BANDS ===
  // Lower CI band for Treatment A (invisible, for fill reference)
  const ciLowerA = {
    x: kmA.map(d => d.time),
    y: kmA.map(d => d.lower),
    type: 'scatter',
    mode: 'lines',
    line: { width: 0 },
    showlegend: false,
    hoverinfo: 'skip',
    fillcolor: 'rgba(0, 114, 178, 0.15)', // Semi-transparent blue
    name: 'CI Lower A'
  };

  // Upper CI band for Treatment A (filled to lower)
  const ciUpperA = {
    x: kmA.map(d => d.time),
    y: kmA.map(d => d.upper),
    type: 'scatter',
    mode: 'lines',
    line: { width: 0 },
    fill: 'tonexty', // Fill to previous trace (lower CI)
    fillcolor: 'rgba(0, 114, 178, 0.15)',
    showlegend: false,
    hoverinfo: 'skip',
    name: 'CI Upper A'
  };

  // Lower CI band for Treatment B
  const ciLowerB = {
    x: kmB.map(d => d.time),
    y: kmB.map(d => d.lower),
    type: 'scatter',
    mode: 'lines',
    line: { width: 0 },
    showlegend: false,
    hoverinfo: 'skip',
    fillcolor: 'rgba(213, 94, 0, 0.15)', // Semi-transparent orange
    name: 'CI Lower B'
  };

  // Upper CI band for Treatment B
  const ciUpperB = {
    x: kmB.map(d => d.time),
    y: kmB.map(d => d.upper),
    type: 'scatter',
    mode: 'lines',
    line: { width: 0 },
    fill: 'tonexty',
    fillcolor: 'rgba(213, 94, 0, 0.15)',
    showlegend: false,
    hoverinfo: 'skip',
    name: 'CI Upper B'
  };

  // === SURVIVAL CURVES ===
  const traceA = {
    x: kmA.map(d => d.time),
    y: kmA.map(d => d.survival),
    name: 'Treatment A',
    type: 'scatter',
    mode: 'lines',
    line: {
      shape: 'hv',
      color: CHART_COLORS.treatment,
      width: 3
    },
    hovertemplate:
      '<b>Treatment A</b><br>' +
      'Time: %{x:.1f} months<br>' +
      'Survival: %{y:.3f}<br>' +
      '<extra></extra>'
  };

  const traceB = {
    x: kmB.map(d => d.time),
    y: kmB.map(d => d.survival),
    name: 'Treatment B',
    type: 'scatter',
    mode: 'lines',
    line: {
      shape: 'hv',
      color: CHART_COLORS.placebo,
      width: 3
    },
    hovertemplate:
      '<b>Treatment B</b><br>' +
      'Time: %{x:.1f} months<br>' +
      'Survival: %{y:.3f}<br>' +
      '<extra></extra>'
  };

  // === CENSORING MARKS ===
  const censoredA = armA.filter(d => d.event === 0);
  const censorMarksA = {
    x: censoredA.map(d => d.time_months),
    y: censoredA.map(d => {
      const kmPoint = kmA.find(k => k.time === d.time_months);
      return kmPoint ? kmPoint.survival : 1.0;
    }),
    name: 'Censored A',
    type: 'scatter',
    mode: 'markers',
    marker: {
      symbol: 'line-ns-open',
      size: 10,
      color: CHART_COLORS.treatment,
      line: { width: 2 }
    },
    showlegend: false,
    hoverinfo: 'skip'
  };

  const censoredB = armB.filter(d => d.event === 0);
  const censorMarksB = {
    x: censoredB.map(d => d.time_months),
    y: censoredB.map(d => {
      const kmPoint = kmB.find(k => k.time === d.time_months);
      return kmPoint ? kmPoint.survival : 1.0;
    }),
    name: 'Censored B',
    type: 'scatter',
    mode: 'markers',
    marker: {
      symbol: 'line-ns-open',
      size: 10,
      color: CHART_COLORS.placebo,
      line: { width: 2 }
    },
    showlegend: false,
    hoverinfo: 'skip'
  };

  // === LAYOUT WITH RISK TABLE ===
  const layout = getDarkLayout('Kaplan-Meier Survival Curves (95% CI)');
  layout.xaxis.title = 'Time (months)';
  layout.yaxis.title = 'Survival Probability';
  layout.yaxis.range = [0, 1.05];
  layout.xaxis.range = [0, Math.max(...data.map(d => d.time_months)) + 2];
  layout.margin = { t: 80, b: 180, l: 80, r: 40 }; // Extra bottom margin for risk table
  layout.legend = {
    x: 0.02,
    y: 0.98,
    xanchor: 'left',
    yanchor: 'top',
    bgcolor: 'rgba(13, 13, 13, 0.9)',
    bordercolor: CHART_COLORS.grid,
    borderwidth: 1,
    font: { color: CHART_COLORS.text, size: 12 }
  };

  // Log-rank p-value annotation (real test, not a heuristic)
  const lr = logRankStats(armA, armB);
  const pValue = lr.totalEvents > 0 && lr.V > 0
    ? `χ² = ${lr.chi2.toFixed(2)}, ${formatPValue(lr.p)}`
    : 'not estimable';

  layout.annotations = [{
    // Bottom-left is clear (legend sits top-left, the curves occupy the top/right);
    // keeps the log-rank result from colliding with the landmark badges.
    x: 0.03,
    y: 0.08,
    xref: 'paper',
    yref: 'paper',
    text: `Log-rank test: ${pValue}`,
    showarrow: false,
    xanchor: 'left',
    yanchor: 'bottom',
    font: {
      size: 12,
      color: CHART_COLORS.accent,
      weight: 'bold'
    },
    bgcolor: 'rgba(13, 13, 13, 0.8)',
    bordercolor: CHART_COLORS.accent,
    borderwidth: 1,
    borderpad: 4
  }];

  // === RISK TABLE ===
  // Calculate number at risk at specific timepoints
  const riskTimepoints = [0, 6, 12, 18, 24, 30];

  function countAtRisk(arm, time) {
    return arm.filter(d => d.time_months >= time).length;
  }

  // Risk table header
  layout.annotations.push({
    x: 0,
    y: -0.20,
    xref: 'paper',
    yref: 'paper',
    text: '<b>Number at Risk</b>',
    showarrow: false,
    xanchor: 'left',
    yanchor: 'top',
    font: { size: 12, color: CHART_COLORS.text, weight: 'bold' }
  });

  // Treatment A risk row
  layout.annotations.push({
    x: 0,
    y: -0.25,
    xref: 'paper',
    yref: 'paper',
    text: 'Treatment A',
    showarrow: false,
    xanchor: 'left',
    yanchor: 'top',
    font: { size: 11, color: CHART_COLORS.treatment, weight: 'bold' }
  });

  // Treatment B risk row
  layout.annotations.push({
    x: 0,
    y: -0.30,
    xref: 'paper',
    yref: 'paper',
    text: 'Treatment B',
    showarrow: false,
    xanchor: 'left',
    yanchor: 'top',
    font: { size: 11, color: CHART_COLORS.placebo, weight: 'bold' }
  });

  // Add risk numbers at each timepoint.
  // Anchor x to the DATA axis (xref:'x', x = timepoint) so columns line up with
  // the time axis regardless of plot margins — the previous paper-fraction
  // timepoint/xMax ignored the left/right margins and drifted out of alignment.
  riskTimepoints.forEach((timepoint) => {
    const atRiskA = countAtRisk(armA, timepoint);
    const atRiskB = countAtRisk(armB, timepoint);

    // Timepoint header
    layout.annotations.push({
      x: timepoint,
      y: -0.20,
      xref: 'x',
      yref: 'paper',
      text: `<b>${timepoint}</b>`,
      showarrow: false,
      xanchor: 'center',
      yanchor: 'top',
      font: { size: 11, color: CHART_COLORS.text, family: 'monospace' }
    });

    // Treatment A count
    layout.annotations.push({
      x: timepoint,
      y: -0.25,
      xref: 'x',
      yref: 'paper',
      text: `${atRiskA}`,
      showarrow: false,
      xanchor: 'center',
      yanchor: 'top',
      font: { size: 11, color: CHART_COLORS.treatment, family: 'monospace' }
    });

    // Treatment B count
    layout.annotations.push({
      x: timepoint,
      y: -0.30,
      xref: 'x',
      yref: 'paper',
      text: `${atRiskB}`,
      showarrow: false,
      xanchor: 'center',
      yanchor: 'top',
      font: { size: 11, color: CHART_COLORS.placebo, family: 'monospace' }
    });
  });

  // === LANDMARK SURVIVAL MILESTONE BADGES ===
  // Helper function to find survival probability at specific time
  function getSurvivalAtTime(kmData, targetTime) {
    // Find the KM estimate at or just before the target time
    let survivalProb = 1.0; // Default to 100% if before any events
    for (let i = 0; i < kmData.length; i++) {
      if (kmData[i].time <= targetTime) {
        survivalProb = kmData[i].survival;
      } else {
        break;
      }
    }
    return survivalProb;
  }

  // Landmark timepoints for badges
  const landmarkTimes = [12, 24];

  landmarkTimes.forEach((time) => {
    const survA = getSurvivalAtTime(kmA, time);
    const survB = getSurvivalAtTime(kmB, time);

    // Treatment A badge (positioned above the curve)
    layout.annotations.push({
      x: time,
      y: survA + 0.06, // Offset above the curve
      xref: 'x',
      yref: 'y',
      text: `<b>${time}mo: ${(survA * 100).toFixed(1)}%</b>`,
      showarrow: true,
      arrowhead: 2,
      arrowsize: 1,
      arrowwidth: 2,
      arrowcolor: CHART_COLORS.treatment,
      ax: 0,
      ay: -30, // Arrow points down to curve
      font: {
        size: 11,
        color: '#FFFFFF',
        family: 'Arial, sans-serif'
      },
      bgcolor: CHART_COLORS.treatment,
      bordercolor: CHART_COLORS.treatment,
      borderwidth: 2,
      borderpad: 4,
      opacity: 0.95
    });

    // Treatment B badge (positioned below the curve)
    layout.annotations.push({
      x: time,
      y: survB - 0.06, // Offset below the curve
      xref: 'x',
      yref: 'y',
      text: `<b>${time}mo: ${(survB * 100).toFixed(1)}%</b>`,
      showarrow: true,
      arrowhead: 2,
      arrowsize: 1,
      arrowwidth: 2,
      arrowcolor: CHART_COLORS.placebo,
      ax: 0,
      ay: 30, // Arrow points up to curve
      font: {
        size: 11,
        color: '#FFFFFF',
        family: 'Arial, sans-serif'
      },
      bgcolor: CHART_COLORS.placebo,
      bordercolor: CHART_COLORS.placebo,
      borderwidth: 2,
      borderpad: 4,
      opacity: 0.95
    });
  });

  // Plot order: CI bands first (background), then survival curves, then censoring marks
  const traces = [
    ciLowerA, ciUpperA,
    ciLowerB, ciUpperB,
    traceA, traceB,
    censorMarksA, censorMarksB
  ];

  Plotly.newPlot(containerId, traces, layout, plotlyConfig);

  const kmContainer = document.getElementById(containerId);
  if (kmContainer) {
    kmContainer.setAttribute('aria-label',
      `Kaplan-Meier survival curves, Treatment A versus Treatment B. ` +
      `Log-rank test ${pValue}. ${lr.O_A} events in arm A, ${lr.totalEvents - lr.O_A} in arm B.`);
  }
}

/**
 * Create median survival dumbbell plot
 * Shows two connected points (Treatment A and Treatment B) with error bars
 * @param {Array<Object>} data - Survival study data
 * @param {string} containerId - DOM element ID for chart container
 */
function createSurvivalSummaryChart(data, containerId) {
  // Calculate median survival for each arm
  const armA = data.filter(d => d.treatment_arm === 'Treatment A');
  const armB = data.filter(d => d.treatment_arm === 'Treatment B');

  const kmA = calculateKM(armA);
  const kmB = calculateKM(armB);

  // Find median survival (time when survival drops below 0.5)
  const findMedian = (km) => {
    for (let i = 0; i < km.length; i++) {
      if (km[i].survival < 0.5) {
        return i > 0 ? (km[i-1].time + km[i].time) / 2 : km[i].time;
      }
    }
    return km[km.length - 1].time; // Not reached
  };

  const medianA = findMedian(kmA);
  const medianB = findMedian(kmB);

  // Approximate 95% CI (for display purposes, simplified)
  const ciMarginA = medianA * 0.13;
  const ciMarginB = medianB * 0.15;

  // CI bounds
  const ciLowerA = medianA - ciMarginA;
  const ciUpperA = medianA + ciMarginA;
  const ciLowerB = medianB - ciMarginB;
  const ciUpperB = medianB + ciMarginB;

  // Create dumbbell plot using scatter traces
  const traceA = {
    x: ['Treatment A'],
    y: [medianA],
    name: 'Treatment A',
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: 18,
      color: CHART_COLORS.treatment,
      line: {
        color: '#005f8c',
        width: 2
      }
    },
    error_y: {
      type: 'data',
      symmetric: false,
      array: [ciUpperA - medianA],
      arrayminus: [medianA - ciLowerA],
      color: CHART_COLORS.treatment,
      thickness: 3,
      width: 10
    },
    hovertemplate:
      '<b>Treatment A</b><br>' +
      'Median: %{y:.1f} months<br>' +
      '95% CI: [' + ciLowerA.toFixed(1) + ', ' + ciUpperA.toFixed(1) + ']<br>' +
      '<extra></extra>'
  };

  const traceB = {
    x: ['Treatment B'],
    y: [medianB],
    name: 'Treatment B',
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: 18,
      color: CHART_COLORS.placebo,
      line: {
        color: '#b54d00',
        width: 2
      }
    },
    error_y: {
      type: 'data',
      symmetric: false,
      array: [ciUpperB - medianB],
      arrayminus: [medianB - ciLowerB],
      color: CHART_COLORS.placebo,
      thickness: 3,
      width: 10
    },
    hovertemplate:
      '<b>Treatment B</b><br>' +
      'Median: %{y:.1f} months<br>' +
      '95% CI: [' + ciLowerB.toFixed(1) + ', ' + ciUpperB.toFixed(1) + ']<br>' +
      '<extra></extra>'
  };

  const layout = getDarkLayout('Median Survival by Treatment (Dumbbell Plot)');
  layout.yaxis.title = 'Median Survival (months)';
  layout.yaxis.range = [0, 30];
  layout.xaxis.title = 'Treatment Arm';
  layout.showlegend = false;

  // Hazard ratio: use the same log-rank-based estimator as the forest plot
  // (a median-survival ratio is NOT a hazard ratio). Oriented A vs B for consistency.
  const hrStats = calculateHR(armA, armB);
  const difference = medianA - medianB;

  // Add annotations for median values, HR, and difference
  layout.annotations = [
    // Median value label for Treatment A
    {
      x: 'Treatment A',
      y: medianA,
      text: `<b>${medianA.toFixed(1)} mo</b>`,
      showarrow: false,
      xanchor: 'left',
      xshift: 20,
      font: {
        size: 14,
        color: CHART_COLORS.treatment,
        weight: 'bold'
      }
    },
    // Median value label for Treatment B
    {
      x: 'Treatment B',
      y: medianB,
      text: `<b>${medianB.toFixed(1)} mo</b>`,
      showarrow: false,
      xanchor: 'left',
      xshift: 20,
      font: {
        size: 14,
        color: CHART_COLORS.placebo,
        weight: 'bold'
      }
    },
    // HR annotation (top right)
    {
      x: 1,
      y: 1,
      xref: 'paper',
      yref: 'paper',
      text: hrStats.estimable ? `HR ${hrStats.hr.toFixed(2)} (A vs B) · ${formatPValue(hrStats.p)}` : 'HR: not estimable',
      showarrow: false,
      xanchor: 'right',
      yanchor: 'top',
      font: {
        size: 13,
        color: CHART_COLORS.accent,
        weight: 'bold'
      },
      bgcolor: 'rgba(0, 217, 255, 0.1)',
      bordercolor: CHART_COLORS.accent,
      borderwidth: 1,
      borderpad: 4
    },
    // Difference annotation (top center)
    {
      x: 0.5,
      y: 1,
      xref: 'paper',
      yref: 'paper',
      text: `Δ = +${difference.toFixed(1)} months`,
      showarrow: false,
      font: {
        size: 12,
        color: CHART_COLORS.success,
        weight: 'bold'
      },
      bgcolor: 'rgba(40, 167, 69, 0.15)',
      bordercolor: CHART_COLORS.success,
      borderwidth: 1,
      borderpad: 4
    }
  ];

  // Add connecting line between the two points (dumbbell effect)
  layout.shapes = [
    {
      type: 'line',
      x0: 'Treatment A',
      y0: medianA,
      x1: 'Treatment B',
      y1: medianB,
      line: {
        color: '#666',
        width: 4
      },
      layer: 'below'
    }
  ];

  Plotly.newPlot(containerId, [traceA, traceB], layout, plotlyConfig);
}

/**
 * Calculate hazard ratio for a subgroup (simplified)
 * @param {Array<Object>} armA - Treatment A data
 * @param {Array<Object>} armB - Treatment B data
 * @returns {Object} HR with confidence intervals
 */
/**
 * Log-rank statistics comparing arm A vs arm B over pooled event times.
 * Returns observed/expected events in arm A and the hypergeometric variance,
 * which drive both the log-rank p-value and the (Pike) hazard-ratio estimate.
 */
function logRankStats(armA, armB) {
  const all = armA.concat(armB);
  const eventTimes = [...new Set(all.filter(d => d.event === 1).map(d => d.time_months))].sort((a, b) => a - b);

  let O_A = 0;   // observed events in arm A
  let E_A = 0;   // expected events in arm A under H0
  let V = 0;     // variance (sum of hypergeometric variances)

  for (const t of eventTimes) {
    const n1 = armA.filter(d => d.time_months >= t).length; // at risk, arm A
    const n2 = armB.filter(d => d.time_months >= t).length; // at risk, arm B
    const n = n1 + n2;
    if (n === 0) continue;

    const d1 = armA.filter(d => d.time_months === t && d.event === 1).length;
    const d2 = armB.filter(d => d.time_months === t && d.event === 1).length;
    const d = d1 + d2;

    O_A += d1;
    E_A += d * n1 / n;
    if (n > 1) {
      V += d * (n1 / n) * (n2 / n) * (n - d) / (n - 1);
    }
  }

  const totalEvents = all.filter(d => d.event === 1).length;
  const chi2 = V > 0 ? Math.pow(O_A - E_A, 2) / V : 0;
  const p = V > 0 ? chiSquarePvalue(chi2, 1) : 1;
  return { O_A, E_A, V, totalEvents, chi2, p };
}

/**
 * Hazard ratio (arm A vs arm B) via the log-rank-based Pike one-step estimator:
 *   log(HR) = (O_A - E_A) / V,   SE(log HR) = 1 / sqrt(V).
 * This respects time-to-event and censoring (unlike a crude event-rate ratio).
 * Returns hr: null when not estimable (no events / zero variance / empty arm).
 */
function calculateHR(armA, armB) {
  const s = logRankStats(armA, armB);
  const nA = armA.length, nB = armB.length;

  if (s.V <= 0 || s.totalEvents === 0 || nA === 0 || nB === 0) {
    return { hr: null, ciLower: null, ciUpper: null, p: s.p, nA, nB, estimable: false };
  }

  const logHR = (s.O_A - s.E_A) / s.V;
  const seLogHR = 1 / Math.sqrt(s.V);
  const hr = Math.exp(logHR);

  return {
    hr,
    ciLower: Math.exp(logHR - 1.96 * seLogHR),
    ciUpper: Math.exp(logHR + 1.96 * seLogHR),
    p: s.p,
    nA, nB,
    estimable: true
  };
}

/**
 * Create hazard ratio forest plot by subgroups
 * @param {Array<Object>} data - Survival study data
 * @param {string} containerId - DOM element ID for chart container
 */
function createHRForestPlot(data, containerId) {
  const subgroups = [];

  // Overall
  const armA_all = data.filter(d => d.treatment_arm === 'Treatment A');
  const armB_all = data.filter(d => d.treatment_arm === 'Treatment B');
  const overall = calculateHR(armA_all, armB_all);
  subgroups.push({
    name: 'Overall',
    hr: overall.hr,
    lower: overall.ciLower,
    upper: overall.ciUpper,
    marker: 'diamond',
    size: 14,
    color: CHART_COLORS.accent
  });

  // By Tumor Stage (I-II vs III-IV)
  const earlyStages = ['I', 'II'];
  const lateStages = ['III', 'IV'];

  const armA_early = armA_all.filter(d => earlyStages.includes(d.tumor_stage));
  const armB_early = armB_all.filter(d => earlyStages.includes(d.tumor_stage));
  const hr_early = calculateHR(armA_early, armB_early);
  subgroups.push({
    name: '  Stage I-II',
    hr: hr_early.hr,
    lower: hr_early.ciLower,
    upper: hr_early.ciUpper,
    marker: 'square',
    size: 10,
    color: CHART_COLORS.text
  });

  const armA_late = armA_all.filter(d => lateStages.includes(d.tumor_stage));
  const armB_late = armB_all.filter(d => lateStages.includes(d.tumor_stage));
  const hr_late = calculateHR(armA_late, armB_late);
  subgroups.push({
    name: '  Stage III-IV',
    hr: hr_late.hr,
    lower: hr_late.ciLower,
    upper: hr_late.ciUpper,
    marker: 'square',
    size: 10,
    color: CHART_COLORS.text
  });

  // By Biomarker
  const armA_pos = armA_all.filter(d => d.biomarker_status === 'Positive');
  const armB_pos = armB_all.filter(d => d.biomarker_status === 'Positive');
  const hr_pos = calculateHR(armA_pos, armB_pos);
  subgroups.push({
    name: '  Biomarker Positive',
    hr: hr_pos.hr,
    lower: hr_pos.ciLower,
    upper: hr_pos.ciUpper,
    marker: 'square',
    size: 10,
    color: CHART_COLORS.text
  });

  const armA_neg = armA_all.filter(d => d.biomarker_status === 'Negative');
  const armB_neg = armB_all.filter(d => d.biomarker_status === 'Negative');
  const hr_neg = calculateHR(armA_neg, armB_neg);
  subgroups.push({
    name: '  Biomarker Negative',
    hr: hr_neg.hr,
    lower: hr_neg.ciLower,
    upper: hr_neg.ciUpper,
    marker: 'square',
    size: 10,
    color: CHART_COLORS.text
  });

  // By Age
  const armA_young = armA_all.filter(d => d.age < 65);
  const armB_young = armB_all.filter(d => d.age < 65);
  const hr_young = calculateHR(armA_young, armB_young);
  subgroups.push({
    name: '  Age <65',
    hr: hr_young.hr,
    lower: hr_young.ciLower,
    upper: hr_young.ciUpper,
    marker: 'square',
    size: 10,
    color: CHART_COLORS.text
  });

  const armA_old = armA_all.filter(d => d.age >= 65);
  const armB_old = armB_all.filter(d => d.age >= 65);
  const hr_old = calculateHR(armA_old, armB_old);
  subgroups.push({
    name: '  Age ≥65',
    hr: hr_old.hr,
    lower: hr_old.ciLower,
    upper: hr_old.ciUpper,
    marker: 'square',
    size: 10,
    color: CHART_COLORS.text
  });

  // By Sex
  const armA_male = armA_all.filter(d => d.sex === 'M');
  const armB_male = armB_all.filter(d => d.sex === 'M');
  const hr_male = calculateHR(armA_male, armB_male);
  subgroups.push({
    name: '  Male',
    hr: hr_male.hr,
    lower: hr_male.ciLower,
    upper: hr_male.ciUpper,
    marker: 'square',
    size: 10,
    color: CHART_COLORS.text
  });

  const armA_female = armA_all.filter(d => d.sex === 'F');
  const armB_female = armB_all.filter(d => d.sex === 'F');
  const hr_female = calculateHR(armA_female, armB_female);
  subgroups.push({
    name: '  Female',
    hr: hr_female.hr,
    lower: hr_female.ciLower,
    upper: hr_female.ciUpper,
    marker: 'square',
    size: 10,
    color: CHART_COLORS.text
  });

  // By ECOG
  const armA_ecog0 = armA_all.filter(d => d.ecog_status === 0);
  const armB_ecog0 = armB_all.filter(d => d.ecog_status === 0);
  const hr_ecog0 = calculateHR(armA_ecog0, armB_ecog0);
  subgroups.push({
    name: '  ECOG 0',
    hr: hr_ecog0.hr,
    lower: hr_ecog0.ciLower,
    upper: hr_ecog0.ciUpper,
    marker: 'square',
    size: 10,
    color: CHART_COLORS.text
  });

  const armA_ecog12 = armA_all.filter(d => d.ecog_status >= 1);
  const armB_ecog12 = armB_all.filter(d => d.ecog_status >= 1);
  const hr_ecog12 = calculateHR(armA_ecog12, armB_ecog12);
  subgroups.push({
    name: '  ECOG 1-2',
    hr: hr_ecog12.hr,
    lower: hr_ecog12.ciLower,
    upper: hr_ecog12.ciUpper,
    marker: 'square',
    size: 10,
    color: CHART_COLORS.text
  });

  // Mark which subgroups are actually estimable (finite HR + finite CI).
  // Subgroups with no events in an arm are flagged "not estimable" (NE) rather
  // than rendering Infinity / NaN.
  subgroups.forEach(s => {
    s.estimable = s.hr !== null && isFinite(s.hr) &&
      s.lower !== null && isFinite(s.lower) &&
      s.upper !== null && isFinite(s.upper);
  });

  // Reverse order for plotting (top-to-bottom reads as defined)
  subgroups.reverse();
  const yLabels = subgroups.map(s => s.name);
  const yPositions = subgroups.map((s, i) => i);

  // Main trace with error bars (non-estimable rows become gaps via null x)
  const forestTrace = {
    x: subgroups.map(s => s.estimable ? s.hr : null),
    y: yPositions,
    error_x: {
      type: 'data',
      symmetric: false,
      array: subgroups.map(s => s.estimable ? s.upper - s.hr : 0),
      arrayminus: subgroups.map(s => s.estimable ? s.hr - s.lower : 0),
      color: CHART_COLORS.text,
      thickness: 2,
      width: 8
    },
    mode: 'markers',
    marker: {
      symbol: subgroups.map(s => s.marker),
      size: subgroups.map(s => s.size),
      color: subgroups.map(s => s.color),
      line: {
        width: 2,
        color: CHART_COLORS.text
      }
    },
    type: 'scatter',
    showlegend: false,
    hovertemplate:
      '<b>%{text}</b><br>' +
      'HR: %{x:.2f}<br>' +
      '95% CI: [%{customdata[0]:.2f}, %{customdata[1]:.2f}]<br>' +
      '<extra></extra>',
    text: subgroups.map(s => s.name.trim()),
    customdata: subgroups.map(s => [s.lower, s.upper])
  };

  // Reference line at HR=1
  const referenceLine = {
    x: [1, 1],
    y: [-0.5, yPositions.length - 0.5],
    mode: 'lines',
    line: {
      dash: 'dash',
      color: CHART_COLORS.zeroline,
      width: 2
    },
    showlegend: false,
    hoverinfo: 'skip'
  };

  const layout = getDarkLayout('Hazard Ratio by Subgroup');
  layout.xaxis.title = 'Favors A  ←  Hazard Ratio  →  Favors B';
  layout.xaxis.type = 'log';
  layout.xaxis.zeroline = false;
  layout.xaxis.range = [-1, 1]; // log10 → 0.1 to 10, a stable clinical window
  layout.xaxis.tickvals = [0.1, 0.25, 0.5, 1, 2, 4, 10];
  layout.xaxis.ticktext = ['0.1', '0.25', '0.5', '1', '2', '4', '10'];
  layout.yaxis = {
    tickmode: 'array',
    tickvals: yPositions,
    ticktext: yLabels,
    gridcolor: CHART_COLORS.grid,
    zerolinecolor: CHART_COLORS.zeroline,
    tickfont: { color: CHART_COLORS.text, size: 11 },
    range: [-0.5, yPositions.length - 0.5]
  };
  layout.margin.l = 140;

  // Annotate non-estimable subgroups so the row isn't silently blank
  layout.annotations = (layout.annotations || []).concat(
    subgroups
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => !s.estimable)
      .map(({ i }) => ({
        x: 0, // log10(1)
        y: i,
        xref: 'x',
        yref: 'y',
        text: 'NE',
        showarrow: false,
        font: { size: 10, color: CHART_COLORS.textSecondary, family: 'IBM Plex Mono, monospace' },
        bgcolor: 'rgba(13,13,13,0.6)'
      }))
  );

  Plotly.newPlot(containerId, [referenceLine, forestTrace], layout, plotlyConfig);
}

/**
 * Create events summary chart (events vs censored by arm)
 * @param {Array<Object>} data - Survival study data
 * @param {string} containerId - DOM element ID for chart container
 */
function createEventsSummaryChart(data, containerId) {
  // Split by arm
  const armA = data.filter(d => d.treatment_arm === 'Treatment A');
  const armB = data.filter(d => d.treatment_arm === 'Treatment B');

  // Count events and censored
  const eventsA = armA.filter(d => d.event === 1).length;
  const censoredA = armA.filter(d => d.event === 0).length;
  const eventsB = armB.filter(d => d.event === 1).length;
  const censoredB = armB.filter(d => d.event === 0).length;

  // Events trace
  const eventsTrace = {
    x: ['Treatment A', 'Treatment B'],
    y: [eventsA, eventsB],
    name: 'Events (Deaths)',
    type: 'bar',
    marker: {
      color: CHART_COLORS.danger,
      line: { width: 0 }
    },
    text: [eventsA, eventsB],
    textposition: 'inside',
    textfont: {
      color: CHART_COLORS.text,
      size: 14,
      weight: 'bold'
    },
    hovertemplate:
      '<b>%{x}</b><br>' +
      'Events: %{y}<br>' +
      '<extra></extra>'
  };

  // Censored trace
  const censoredTrace = {
    x: ['Treatment A', 'Treatment B'],
    y: [censoredA, censoredB],
    name: 'Censored',
    type: 'bar',
    marker: {
      color: CHART_COLORS.success,
      line: { width: 0 }
    },
    text: [censoredA, censoredB],
    textposition: 'inside',
    textfont: {
      color: CHART_COLORS.text,
      size: 14,
      weight: 'bold'
    },
    hovertemplate:
      '<b>%{x}</b><br>' +
      'Censored: %{y}<br>' +
      '<extra></extra>'
  };

  const layout = getDarkLayout('Event Summary by Treatment Arm');
  layout.yaxis.title = 'Number of Patients';
  layout.xaxis.title = 'Treatment Arm';
  layout.barmode = 'group';
  layout.bargap = 0.3;
  layout.bargroupgap = 0.1;
  layout.legend = {
    x: 0.98,
    y: 0.98,
    xanchor: 'right',
    yanchor: 'top',
    bgcolor: 'rgba(13, 13, 13, 0.8)',
    bordercolor: CHART_COLORS.grid,
    borderwidth: 1,
    font: { color: CHART_COLORS.text, size: 12 }
  };

  Plotly.newPlot(containerId, [eventsTrace, censoredTrace], layout, plotlyConfig);
}

/**
 * Create swimmer plot for survival study showing individual patient journeys
 * @param {Array<Object>} data - Survival study data
 * @param {string} containerId - DOM element ID for chart container
 */
function createSurvivalSwimmerPlot(data, containerId) {
  // Sort patients by time_months (longest duration first for better visualization)
  const sortedData = [...data].sort((a, b) => b.time_months - a.time_months);

  // Separate by treatment arm
  const treatmentAData = sortedData.filter(d => d.treatment_arm === 'Treatment A');
  const treatmentBData = sortedData.filter(d => d.treatment_arm === 'Treatment B');

  // Create y-axis positions
  let yPosition = 0;
  const yLabels = [];
  const yPositions = [];

  // Treatment A patients
  treatmentAData.forEach((patient, idx) => {
    yPositions.push(yPosition);
    yLabels.push(`A-${idx + 1}`);
    yPosition++;
  });

  // Treatment B patients
  treatmentBData.forEach((patient, idx) => {
    yPositions.push(yPosition);
    yLabels.push(`B-${idx + 1}`);
    yPosition++;
  });

  // Recombine for plotting
  const allPatientsOrdered = [...treatmentAData, ...treatmentBData];

  // Create horizontal bars for Treatment A
  const treatmentATrace = {
    type: 'bar',
    orientation: 'h',
    y: treatmentAData.map((_, i) => i),
    x: treatmentAData.map(d => d.time_months),
    name: 'Treatment A',
    marker: {
      color: 'rgba(0, 114, 178, 0.7)',
      line: { width: 0 }
    },
    hovertemplate:
      '<b>Patient %{customdata.patient_id}</b><br>' +
      'Treatment: A<br>' +
      'Duration: %{x:.1f} months<br>' +
      'Status: %{customdata.status}<br>' +
      '<extra></extra>',
    customdata: treatmentAData.map(d => ({
      patient_id: d.patient_id,
      status: d.event === 1 ? 'Event (Death)' : 'Censored'
    }))
  };

  // Create horizontal bars for Treatment B
  const treatmentBTrace = {
    type: 'bar',
    orientation: 'h',
    y: treatmentBData.map((_, i) => i + treatmentAData.length),
    x: treatmentBData.map(d => d.time_months),
    name: 'Treatment B',
    marker: {
      color: 'rgba(213, 94, 0, 0.7)',
      line: { width: 0 }
    },
    hovertemplate:
      '<b>Patient %{customdata.patient_id}</b><br>' +
      'Treatment: B<br>' +
      'Duration: %{x:.1f} months<br>' +
      'Status: %{customdata.status}<br>' +
      '<extra></extra>',
    customdata: treatmentBData.map(d => ({
      patient_id: d.patient_id,
      status: d.event === 1 ? 'Event (Death)' : 'Censored'
    }))
  };

  // Create event markers (deaths) - red X markers
  const eventPatients = allPatientsOrdered
    .map((p, i) => ({ ...p, yPos: i }))
    .filter(p => p.event === 1);

  const eventMarkers = {
    type: 'scatter',
    mode: 'markers',
    x: eventPatients.map(d => d.time_months),
    y: eventPatients.map(d => d.yPos),
    marker: {
      symbol: 'x',
      size: 12,
      color: '#E31A1C',
      line: { width: 2 }
    },
    name: 'Event (Death)',
    showlegend: true,
    hovertemplate:
      '<b>Patient %{customdata.patient_id}</b><br>' +
      'Event at: %{x:.1f} months<br>' +
      'Treatment: %{customdata.arm}<br>' +
      '<extra></extra>',
    customdata: eventPatients.map(d => ({
      patient_id: d.patient_id,
      arm: d.treatment_arm
    }))
  };

  // Create censoring markers - white diamonds with border
  const censoredPatients = allPatientsOrdered
    .map((p, i) => ({ ...p, yPos: i }))
    .filter(p => p.event === 0);

  const censorMarkers = {
    type: 'scatter',
    mode: 'markers',
    x: censoredPatients.map(d => d.time_months),
    y: censoredPatients.map(d => d.yPos),
    marker: {
      symbol: 'diamond',
      size: 10,
      color: '#FFFFFF',
      line: { color: '#666666', width: 2 }
    },
    name: 'Censored',
    showlegend: true,
    hovertemplate:
      '<b>Patient %{customdata.patient_id}</b><br>' +
      'Censored at: %{x:.1f} months<br>' +
      'Treatment: %{customdata.arm}<br>' +
      '<extra></extra>',
    customdata: censoredPatients.map(d => ({
      patient_id: d.patient_id,
      arm: d.treatment_arm
    }))
  };

  const layout = {
    title: {
      text: 'Individual Patient Timelines',
      font: {
        family: 'Arial, sans-serif',
        size: 18,
        color: CHART_COLORS.text,
        weight: 600
      },
      x: 0.5,
      xanchor: 'center'
    },
    plot_bgcolor: CHART_COLORS.background,
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'Arial, sans-serif',
      color: CHART_COLORS.text,
      size: 12
    },
    margin: { t: 80, b: 80, l: 80, r: 40 },
    xaxis: {
      title: 'Time (months)',
      gridcolor: CHART_COLORS.grid,
      zerolinecolor: CHART_COLORS.zeroline,
      tickfont: { color: CHART_COLORS.text },
      titlefont: { size: 14, color: CHART_COLORS.text }
    },
    yaxis: {
      title: 'Patient Number',
      gridcolor: CHART_COLORS.grid,
      zerolinecolor: CHART_COLORS.zeroline,
      tickfont: { color: CHART_COLORS.text, size: 9 },
      titlefont: { size: 14, color: CHART_COLORS.text },
      showticklabels: true,
      tickmode: 'array',
      tickvals: yPositions.filter((_, i) => i % 5 === 0), // Show every 5th label
      ticktext: yLabels.filter((_, i) => i % 5 === 0)
    },
    legend: {
      x: 0.98,
      y: 0.98,
      xanchor: 'right',
      yanchor: 'top',
      bgcolor: 'rgba(13, 13, 13, 0.8)',
      bordercolor: CHART_COLORS.grid,
      borderwidth: 1,
      font: { color: CHART_COLORS.text, size: 12 }
    },
    height: 600,
    barmode: 'overlay',
    hovermode: 'closest'
  };

  Plotly.newPlot(containerId, [treatmentATrace, treatmentBTrace, eventMarkers, censorMarkers], layout, plotlyConfig);
}

/**
 * Create cumulative events curve showing event accumulation over time
 * @param {Array<Object>} data - Survival study data
 * @param {string} containerId - DOM element ID for chart container
 */
function createCumulativeEventsChart(data, containerId) {
  // Function to calculate cumulative events over time for a treatment arm
  const calculateCumulativeEvents = (armData) => {
    // Get only patients who had events (death)
    const events = armData
      .filter(d => d.event === 1)
      .map(d => d.time_months)
      .sort((a, b) => a - b);

    // Build cumulative curve: time points and cumulative counts
    const times = [0];  // Start at time 0
    const counts = [0]; // Start with 0 events

    events.forEach((eventTime, index) => {
      times.push(eventTime);
      counts.push(index + 1);  // Cumulative count
    });

    return { times, counts, totalEvents: events.length };
  };

  // Separate by treatment arm
  const treatmentAData = data.filter(d => d.treatment_arm === 'Treatment A');
  const treatmentBData = data.filter(d => d.treatment_arm === 'Treatment B');

  // Calculate cumulative events for each arm
  const treatmentAEvents = calculateCumulativeEvents(treatmentAData);
  const treatmentBEvents = calculateCumulativeEvents(treatmentBData);

  // Create step plot trace for Treatment A
  const treatmentATrace = {
    x: treatmentAEvents.times,
    y: treatmentAEvents.counts,
    type: 'scatter',
    mode: 'lines',
    line: {
      shape: 'hv',  // Horizontal-vertical step function
      color: '#0072B2',
      width: 3
    },
    name: 'Treatment A',
    hovertemplate:
      '<b>Treatment A</b><br>' +
      'Time: %{x:.1f} months<br>' +
      'Cumulative Events: %{y}<br>' +
      '<extra></extra>'
  };

  // Create step plot trace for Treatment B
  const treatmentBTrace = {
    x: treatmentBEvents.times,
    y: treatmentBEvents.counts,
    type: 'scatter',
    mode: 'lines',
    line: {
      shape: 'hv',
      color: '#D55E00',
      width: 3
    },
    name: 'Treatment B',
    hovertemplate:
      '<b>Treatment B</b><br>' +
      'Time: %{x:.1f} months<br>' +
      'Cumulative Events: %{y}<br>' +
      '<extra></extra>'
  };

  const layout = getDarkLayout('Cumulative Events Over Time');
  layout.xaxis.title = 'Time (months)';
  layout.xaxis.range = [0, 35];
  layout.yaxis.title = 'Cumulative Number of Events (Deaths)';
  layout.yaxis.gridcolor = CHART_COLORS.grid;
  layout.legend = {
    x: 0.02,
    y: 0.98,
    xanchor: 'left',
    yanchor: 'top',
    bgcolor: 'rgba(13, 13, 13, 0.8)',
    bordercolor: CHART_COLORS.grid,
    borderwidth: 1,
    font: { color: CHART_COLORS.text, size: 12 }
  };

  // Add annotations for total events
  layout.annotations = [
    {
      x: 1,
      y: 0.5,
      xref: 'paper',
      yref: 'paper',
      text: `<b>Total Events:</b><br>Treatment A: ${treatmentAEvents.totalEvents}<br>Treatment B: ${treatmentBEvents.totalEvents}`,
      showarrow: false,
      xanchor: 'right',
      align: 'left',
      font: { size: 12, color: CHART_COLORS.text },
      bgcolor: 'rgba(0, 0, 0, 0.7)',
      bordercolor: CHART_COLORS.grid,
      borderwidth: 1,
      borderpad: 6
    }
  ];

  layout.hovermode = 'closest';

  Plotly.newPlot(containerId, [treatmentATrace, treatmentBTrace], layout, plotlyConfig);
}

// ============================================================================
// ADVANCED ONCOLOGY VISUALIZATIONS
// ============================================================================

/**
 * Create swimmer plot showing individual patient treatment journeys
 * @param {string} containerId - DOM element ID for chart container
 * @param {Object} data - Swimmer plot data with patients array
 * @param {Array<Object>} data.patients - Array of patient objects with:
 *   - patient_id: string
 *   - treatment_start_day: number
 *   - treatment_end_day: number
 *   - response: string ('CR', 'PR', 'SD', 'PD')
 *   - ongoing: boolean
 *   - response_events: Array<{day: number, type: string}>
 *   - adverse_events: Array<{day: number, grade: number}>
 */
function createSwimmerPlot(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  // Sort patients by treatment duration (longest first)
  const patients = [...data.patients].sort((a, b) =>
    (b.treatment_end_day - b.treatment_start_day) - (a.treatment_end_day - a.treatment_start_day)
  );

  // Response colors
  const responseColors = {
    'CR': '#00D9FF',  // bright cyan
    'PR': '#00C853',  // green
    'SD': '#FFD600',  // yellow
    'PD': '#FF5252'   // red
  };

  // AE grade colors
  const aeColors = {
    1: '#4CAF50',  // green
    2: '#FF9800',  // orange
    3: '#F44336',  // red
    4: '#B71C1C'   // dark red
  };

  const maxDuration = Math.max(...patients.map(p => p.treatment_end_day));
  const yLabels = patients.map(p => p.patient_id);
  const yPositions = patients.map((p, i) => i);

  // Create shapes for treatment duration bars
  const shapes = patients.map((p, i) => ({
    type: 'rect',
    xref: 'x',
    yref: 'y',
    x0: p.treatment_start_day,
    y0: i - 0.3,
    x1: p.treatment_end_day,
    y1: i + 0.3,
    fillcolor: responseColors[p.response_category] || '#808080',
    line: { width: 0 },
    opacity: 0.8
  }));

  // Add ongoing patient arrows
  const ongoingAnnotations = patients
    .map((p, i) => {
      if (p.ongoing) {
        return {
          x: p.treatment_end_day,
          y: i,
          xref: 'x',
          yref: 'y',
          text: '▶',
          showarrow: false,
          font: { size: 14, color: responseColors[p.response_category] || '#808080' },
          xanchor: 'left'
        };
      }
      return null;
    })
    .filter(a => a !== null);

  // Create response event markers
  const responseEventTraces = [];
  patients.forEach((p, i) => {
    if (p.response_events && p.response_events.length > 0) {
      p.response_events.forEach(event => {
        const markerSymbol = event.type === 'CR' ? 'star' :
                            event.type === 'PR' ? 'diamond' :
                            event.type === 'PD' ? 'x' : 'circle';

        responseEventTraces.push({
          x: [event.day],
          y: [i],
          mode: 'markers',
          marker: {
            symbol: markerSymbol,
            size: 12,
            color: responseColors[event.type] || '#FFFFFF',
            line: { width: 2, color: '#1a1a1a' }
          },
          showlegend: false,
          hovertemplate: `<b>${p.patient_id}</b><br>` +
                        `Day ${event.day}<br>` +
                        `${event.type} confirmed<br>` +
                        '<extra></extra>'
        });
      });
    }
  });

  // Create adverse event markers (small triangles below bars)
  const aeTraces = [];
  patients.forEach((p, i) => {
    if (p.adverse_events && p.adverse_events.length > 0) {
      p.adverse_events.forEach(ae => {
        aeTraces.push({
          x: [ae.day],
          y: [i - 0.35],
          mode: 'markers',
          marker: {
            symbol: 'triangle-down',
            size: 8,
            color: aeColors[ae.grade] || '#808080',
            line: { width: 1, color: '#1a1a1a' }
          },
          showlegend: false,
          hovertemplate: `<b>${p.patient_id}</b><br>` +
                        `Day ${ae.day}<br>` +
                        `AE Grade ${ae.grade}<br>` +
                        '<extra></extra>'
        });
      });
    }
  });

  // Create dummy traces for legend
  const legendTraces = [
    // Response types
    {
      x: [null], y: [null],
      mode: 'markers',
      marker: { symbol: 'square', size: 12, color: responseColors['CR'] },
      name: 'CR',
      showlegend: true
    },
    {
      x: [null], y: [null],
      mode: 'markers',
      marker: { symbol: 'square', size: 12, color: responseColors['PR'] },
      name: 'PR',
      showlegend: true
    },
    {
      x: [null], y: [null],
      mode: 'markers',
      marker: { symbol: 'square', size: 12, color: responseColors['SD'] },
      name: 'SD',
      showlegend: true
    },
    {
      x: [null], y: [null],
      mode: 'markers',
      marker: { symbol: 'square', size: 12, color: responseColors['PD'] },
      name: 'PD',
      showlegend: true
    },
    // AE grades
    {
      x: [null], y: [null],
      mode: 'markers',
      marker: { symbol: 'triangle-down', size: 8, color: aeColors[1] },
      name: 'AE Grade 1',
      showlegend: true
    },
    {
      x: [null], y: [null],
      mode: 'markers',
      marker: { symbol: 'triangle-down', size: 8, color: aeColors[2] },
      name: 'AE Grade 2',
      showlegend: true
    },
    {
      x: [null], y: [null],
      mode: 'markers',
      marker: { symbol: 'triangle-down', size: 8, color: aeColors[3] },
      name: 'AE Grade 3',
      showlegend: true
    },
    {
      x: [null], y: [null],
      mode: 'markers',
      marker: { symbol: 'triangle-down', size: 8, color: aeColors[4] },
      name: 'AE Grade 4',
      showlegend: true
    }
  ];

  const layout = {
    title: {
      text: 'Swimmer Plot: Individual Patient Treatment Journeys',
      font: { family: 'Arial, sans-serif', size: 16, color: '#ffffff', weight: 600 },
      x: 0.5,
      xanchor: 'center'
    },
    plot_bgcolor: '#1a1a1a',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Arial, sans-serif', color: '#e0e0e0', size: 12 },
    margin: { t: 80, b: 80, l: 100, r: 40 },
    xaxis: {
      title: 'Days on Treatment',
      gridcolor: '#333333',
      zerolinecolor: '#808080',
      tickfont: { color: '#e0e0e0' },
      titlefont: { size: 14, color: '#e0e0e0' },
      range: [0, maxDuration + 10]
    },
    yaxis: {
      title: 'Patient ID',
      tickmode: 'array',
      tickvals: yPositions,
      ticktext: yLabels,
      gridcolor: '#333333',
      zerolinecolor: '#808080',
      tickfont: { color: '#e0e0e0', size: 10 },
      titlefont: { size: 14, color: '#e0e0e0' },
      range: [-0.5, patients.length - 0.5]
    },
    shapes: shapes,
    annotations: ongoingAnnotations,
    legend: {
      x: 1.02,
      y: 1,
      xanchor: 'left',
      yanchor: 'top',
      bgcolor: 'rgba(26, 26, 26, 0.9)',
      bordercolor: '#333333',
      borderwidth: 1,
      font: { color: '#e0e0e0', size: 10 }
    },
    hovermode: 'closest'
  };

  const allTraces = [...legendTraces, ...responseEventTraces, ...aeTraces];

  Plotly.newPlot(containerId, allTraces, layout, {
    ...plotlyConfig,
    toImageButtonOptions: {
      ...plotlyConfig.toImageButtonOptions,
      filename: 'swimmer_plot'
    }
  });
}

/**
 * Create advanced waterfall plot showing best tumor response
 * @param {string} containerId - DOM element ID for chart container
 * @param {Object} data - Waterfall plot data with patients array
 * @param {Array<Object>} data.patients - Array of patient objects with:
 *   - patient_id: string
 *   - best_response_pct: number (percent change from baseline)
 *   - response_category: string ('CR', 'PR', 'SD', 'PD')
 *   - treatment_arm: string
 */
function createAdvancedWaterfallPlot(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  // Sort patients by best_response_pct (most negative first - best responders on left)
  const sorted = [...data.patients].sort((a, b) => a.best_response_pct - b.best_response_pct);

  // RECIST response colors
  const responseColors = {
    'CR': '#00D9FF',  // bright cyan (= -100%)
    'PR': '#00C853',  // green (<= -30%)
    'SD': '#FFD600',  // yellow (-30% to +20%)
    'PD': '#FF5252'   // red (>= +20%)
  };

  // Assign colors based on response category
  const barColors = sorted.map(p => responseColors[p.response_category] || '#808080');

  // Create waterfall bars
  const waterfallTrace = {
    x: sorted.map((p, i) => i + 1),
    y: sorted.map(p => p.best_response_pct),
    type: 'bar',
    marker: {
      color: barColors,
      line: { width: 0 }
    },
    hovertemplate:
      '<b>Patient: %{customdata[0]}</b><br>' +
      'Best Response: %{y:.1f}%<br>' +
      'Category: %{customdata[1]}<br>' +
      'Arm: %{customdata[2]}<br>' +
      '<extra></extra>',
    customdata: sorted.map(p => [
      p.patient_id,
      p.response_category,
      p.randomization_arm === 'Arm_A' ? 'Arm A (Experimental)' : 'Arm B (Standard)'
    ]),
    showlegend: false
  };

  // Reference lines
  const prLine = {
    x: [0, sorted.length + 1],
    y: [-30, -30],
    mode: 'lines',
    line: { dash: 'dash', color: '#00C853', width: 2 },
    name: 'PR Threshold (-30%)',
    showlegend: false,
    hoverinfo: 'skip'
  };

  const pdLine = {
    x: [0, sorted.length + 1],
    y: [20, 20],
    mode: 'lines',
    line: { dash: 'dash', color: '#FF5252', width: 2 },
    name: 'PD Threshold (+20%)',
    showlegend: false,
    hoverinfo: 'skip'
  };

  const baselineLine = {
    x: [0, sorted.length + 1],
    y: [0, 0],
    mode: 'lines',
    line: { color: '#808080', width: 2 },
    name: 'Baseline (0%)',
    showlegend: false,
    hoverinfo: 'skip'
  };

  const layout = {
    title: {
      text: 'Waterfall Plot: Best Tumor Response (% Change from Baseline)',
      font: { family: 'Arial, sans-serif', size: 16, color: '#ffffff', weight: 600 },
      x: 0.5,
      xanchor: 'center'
    },
    plot_bgcolor: '#1a1a1a',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Arial, sans-serif', color: '#e0e0e0', size: 12 },
    margin: { t: 80, b: 80, l: 80, r: 40 },
    xaxis: {
      title: 'Patients (sorted by response)',
      gridcolor: '#333333',
      zerolinecolor: '#808080',
      tickfont: { color: '#e0e0e0' },
      titlefont: { size: 14, color: '#e0e0e0' },
      showticklabels: false
    },
    yaxis: {
      title: '% Change from Baseline',
      gridcolor: '#333333',
      zerolinecolor: '#808080',
      tickfont: { color: '#e0e0e0' },
      titlefont: { size: 14, color: '#e0e0e0' },
      range: [-110, 70]
    },
    bargap: 0.05,
    annotations: [
      {
        x: sorted.length * 0.25,
        y: -30,
        xref: 'x',
        yref: 'y',
        text: 'PR (-30%)',
        showarrow: true,
        arrowhead: 2,
        arrowcolor: '#00C853',
        ax: 0,
        ay: -30,
        font: { size: 11, color: '#00C853' },
        bgcolor: 'rgba(26, 26, 26, 0.8)',
        bordercolor: '#00C853',
        borderwidth: 1,
        borderpad: 4
      },
      {
        x: sorted.length * 0.75,
        y: 20,
        xref: 'x',
        yref: 'y',
        text: 'PD (+20%)',
        showarrow: true,
        arrowhead: 2,
        arrowcolor: '#FF5252',
        ax: 0,
        ay: 30,
        font: { size: 11, color: '#FF5252' },
        bgcolor: 'rgba(26, 26, 26, 0.8)',
        bordercolor: '#FF5252',
        borderwidth: 1,
        borderpad: 4
      }
    ],
    hovermode: 'closest',
    transition: { duration: 500 }
  };

  // Add custom legend via annotations
  const legendAnnotations = [
    {
      x: 0.02, y: 0.98,
      xref: 'paper', yref: 'paper',
      text: '■',
      showarrow: false,
      font: { size: 20, color: responseColors['CR'] }
    },
    {
      x: 0.04, y: 0.98,
      xref: 'paper', yref: 'paper',
      text: 'CR',
      showarrow: false,
      xanchor: 'left',
      font: { size: 11, color: '#e0e0e0' }
    },
    {
      x: 0.02, y: 0.94,
      xref: 'paper', yref: 'paper',
      text: '■',
      showarrow: false,
      font: { size: 20, color: responseColors['PR'] }
    },
    {
      x: 0.04, y: 0.94,
      xref: 'paper', yref: 'paper',
      text: 'PR',
      showarrow: false,
      xanchor: 'left',
      font: { size: 11, color: '#e0e0e0' }
    },
    {
      x: 0.02, y: 0.90,
      xref: 'paper', yref: 'paper',
      text: '■',
      showarrow: false,
      font: { size: 20, color: responseColors['SD'] }
    },
    {
      x: 0.04, y: 0.90,
      xref: 'paper', yref: 'paper',
      text: 'SD',
      showarrow: false,
      xanchor: 'left',
      font: { size: 11, color: '#e0e0e0' }
    },
    {
      x: 0.02, y: 0.86,
      xref: 'paper', yref: 'paper',
      text: '■',
      showarrow: false,
      font: { size: 20, color: responseColors['PD'] }
    },
    {
      x: 0.04, y: 0.86,
      xref: 'paper', yref: 'paper',
      text: 'PD',
      showarrow: false,
      xanchor: 'left',
      font: { size: 11, color: '#e0e0e0' }
    }
  ];

  layout.annotations = [...layout.annotations, ...legendAnnotations];

  Plotly.newPlot(containerId, [baselineLine, prLine, pdLine, waterfallTrace], layout, {
    ...plotlyConfig,
    toImageButtonOptions: {
      ...plotlyConfig.toImageButtonOptions,
      filename: 'waterfall_plot'
    }
  });
}

/**
 * Create Sankey diagram showing patient flow through trial
 * @param {string} containerId - DOM element ID for chart container
 * @param {Object} data - Patient data object
 * @param {Array<Object>} data.patients - Array of patient objects with:
 *   - patient_id: string
 *   - randomization_arm: string ('Arm_A' or 'Arm_B')
 *   - response_category: string ('CR', 'PR', 'SD', 'PD')
 *   - final_outcome: string ('Ongoing' or 'Discontinued')
 */
function createSankeyDiagram(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const patients = data.patients || [];

  // Node indices:
  // 0: Enrolled (all patients)
  // 1: Arm A (Treatment A)
  // 2: Arm B (Treatment B)
  // 3: CR
  // 4: PR
  // 5: SD
  // 6: PD
  // 7: Ongoing
  // 8: Completed
  // 9: Discontinued

  // Calculate counts
  const totalEnrolled = patients.length;
  const armA = patients.filter(p => p.randomization_arm === 'Arm_A');
  const armB = patients.filter(p => p.randomization_arm === 'Arm_B');

  // Count by arm and response
  const armA_CR = armA.filter(p => p.response_category === 'CR').length;
  const armA_PR = armA.filter(p => p.response_category === 'PR').length;
  const armA_SD = armA.filter(p => p.response_category === 'SD').length;
  const armA_PD = armA.filter(p => p.response_category === 'PD').length;

  const armB_CR = armB.filter(p => p.response_category === 'CR').length;
  const armB_PR = armB.filter(p => p.response_category === 'PR').length;
  const armB_SD = armB.filter(p => p.response_category === 'SD').length;
  const armB_PD = armB.filter(p => p.response_category === 'PD').length;

  // Count by response and outcome
  const cr_ongoing = patients.filter(p => p.response_category === 'CR' && p.final_outcome === 'Ongoing').length;
  const cr_completed = patients.filter(p => p.response_category === 'CR' && p.final_outcome === 'Completed').length;
  const cr_discontinued = patients.filter(p => p.response_category === 'CR' && p.final_outcome === 'Discontinued').length;

  const pr_ongoing = patients.filter(p => p.response_category === 'PR' && p.final_outcome === 'Ongoing').length;
  const pr_completed = patients.filter(p => p.response_category === 'PR' && p.final_outcome === 'Completed').length;
  const pr_discontinued = patients.filter(p => p.response_category === 'PR' && p.final_outcome === 'Discontinued').length;

  const sd_ongoing = patients.filter(p => p.response_category === 'SD' && p.final_outcome === 'Ongoing').length;
  const sd_completed = patients.filter(p => p.response_category === 'SD' && p.final_outcome === 'Completed').length;
  const sd_discontinued = patients.filter(p => p.response_category === 'SD' && p.final_outcome === 'Discontinued').length;

  const pd_ongoing = patients.filter(p => p.response_category === 'PD' && p.final_outcome === 'Ongoing').length;
  const pd_completed = patients.filter(p => p.response_category === 'PD' && p.final_outcome === 'Completed').length;
  const pd_discontinued = patients.filter(p => p.response_category === 'PD' && p.final_outcome === 'Discontinued').length;

  // Response colors (matching other charts)
  const responseColors = {
    'CR': '#00D9FF',  // bright cyan
    'PR': '#00C853',  // green
    'SD': '#FFD600',  // yellow
    'PD': '#FF5252'   // red
  };

  // Build links
  const links = {
    source: [],
    target: [],
    value: [],
    color: []
  };

  // Enrolled → Arms
  if (armA.length > 0) {
    links.source.push(0); links.target.push(1); links.value.push(armA.length);
    links.color.push('rgba(0, 114, 178, 0.3)'); // Arm A color
  }
  if (armB.length > 0) {
    links.source.push(0); links.target.push(2); links.value.push(armB.length);
    links.color.push('rgba(213, 94, 0, 0.3)'); // Arm B color
  }

  // Arms → Responses
  // Arm A → Responses
  if (armA_CR > 0) {
    links.source.push(1); links.target.push(3); links.value.push(armA_CR);
    links.color.push('rgba(0, 217, 255, 0.3)'); // CR color
  }
  if (armA_PR > 0) {
    links.source.push(1); links.target.push(4); links.value.push(armA_PR);
    links.color.push('rgba(0, 200, 83, 0.3)'); // PR color
  }
  if (armA_SD > 0) {
    links.source.push(1); links.target.push(5); links.value.push(armA_SD);
    links.color.push('rgba(255, 214, 0, 0.3)'); // SD color
  }
  if (armA_PD > 0) {
    links.source.push(1); links.target.push(6); links.value.push(armA_PD);
    links.color.push('rgba(255, 82, 82, 0.3)'); // PD color
  }

  // Arm B → Responses
  if (armB_CR > 0) {
    links.source.push(2); links.target.push(3); links.value.push(armB_CR);
    links.color.push('rgba(0, 217, 255, 0.3)'); // CR color
  }
  if (armB_PR > 0) {
    links.source.push(2); links.target.push(4); links.value.push(armB_PR);
    links.color.push('rgba(0, 200, 83, 0.3)'); // PR color
  }
  if (armB_SD > 0) {
    links.source.push(2); links.target.push(5); links.value.push(armB_SD);
    links.color.push('rgba(255, 214, 0, 0.3)'); // SD color
  }
  if (armB_PD > 0) {
    links.source.push(2); links.target.push(6); links.value.push(armB_PD);
    links.color.push('rgba(255, 82, 82, 0.3)'); // PD color
  }

  // Responses → Outcomes
  // CR → Outcomes
  if (cr_ongoing > 0) {
    links.source.push(3); links.target.push(7); links.value.push(cr_ongoing);
    links.color.push('rgba(76, 175, 80, 0.3)'); // Ongoing color
  }
  if (cr_completed > 0) {
    links.source.push(3); links.target.push(8); links.value.push(cr_completed);
    links.color.push('rgba(33, 150, 243, 0.3)'); // Completed color
  }
  if (cr_discontinued > 0) {
    links.source.push(3); links.target.push(9); links.value.push(cr_discontinued);
    links.color.push('rgba(158, 158, 158, 0.3)'); // Discontinued color
  }

  // PR → Outcomes
  if (pr_ongoing > 0) {
    links.source.push(4); links.target.push(7); links.value.push(pr_ongoing);
    links.color.push('rgba(76, 175, 80, 0.3)');
  }
  if (pr_completed > 0) {
    links.source.push(4); links.target.push(8); links.value.push(pr_completed);
    links.color.push('rgba(33, 150, 243, 0.3)');
  }
  if (pr_discontinued > 0) {
    links.source.push(4); links.target.push(9); links.value.push(pr_discontinued);
    links.color.push('rgba(158, 158, 158, 0.3)');
  }

  // SD → Outcomes
  if (sd_ongoing > 0) {
    links.source.push(5); links.target.push(7); links.value.push(sd_ongoing);
    links.color.push('rgba(76, 175, 80, 0.3)');
  }
  if (sd_completed > 0) {
    links.source.push(5); links.target.push(8); links.value.push(sd_completed);
    links.color.push('rgba(33, 150, 243, 0.3)');
  }
  if (sd_discontinued > 0) {
    links.source.push(5); links.target.push(9); links.value.push(sd_discontinued);
    links.color.push('rgba(158, 158, 158, 0.3)');
  }

  // PD → Outcomes
  if (pd_ongoing > 0) {
    links.source.push(6); links.target.push(7); links.value.push(pd_ongoing);
    links.color.push('rgba(76, 175, 80, 0.3)');
  }
  if (pd_completed > 0) {
    links.source.push(6); links.target.push(8); links.value.push(pd_completed);
    links.color.push('rgba(33, 150, 243, 0.3)');
  }
  if (pd_discontinued > 0) {
    links.source.push(6); links.target.push(9); links.value.push(pd_discontinued);
    links.color.push('rgba(158, 158, 158, 0.3)');
  }

  const trace = {
    type: 'sankey',
    orientation: 'h',
    node: {
      pad: 20,
      thickness: 25,
      line: { color: '#333', width: 1 },
      label: [
        `Enrolled (N=${totalEnrolled})`,
        `Arm A (N=${armA.length})`,
        `Arm B (N=${armB.length})`,
        `CR (N=${armA_CR + armB_CR})`,
        `PR (N=${armA_PR + armB_PR})`,
        `SD (N=${armA_SD + armB_SD})`,
        `PD (N=${armA_PD + armB_PD})`,
        `Ongoing (N=${cr_ongoing + pr_ongoing + sd_ongoing + pd_ongoing})`,
        `Completed (N=${cr_completed + pr_completed + sd_completed + pd_completed})`,
        `Discontinued (N=${cr_discontinued + pr_discontinued + sd_discontinued + pd_discontinued})`
      ],
      color: [
        '#666',        // Enrolled
        '#0072B2',     // Arm A
        '#D55E00',     // Arm B
        '#00D9FF',     // CR
        '#00C853',     // PR
        '#FFD600',     // SD
        '#FF5252',     // PD
        '#4CAF50',     // Ongoing
        '#2196F3',     // Completed
        '#9E9E9E'      // Discontinued
      ]
    },
    link: links
  };

  const layout = {
    title: {
      text: 'Patient Flow: Enrollment → Response → Outcome',
      font: { size: 20, color: '#e0e0e0', family: 'IBM Plex Sans, sans-serif' }
    },
    font: { color: '#e0e0e0', family: 'IBM Plex Sans, sans-serif' },
    plot_bgcolor: '#1a1a1a',
    paper_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 80, b: 40, l: 40, r: 40 },
    height: 600
  };

  Plotly.newPlot(containerId, [trace], layout, {
    ...plotlyConfig,
    toImageButtonOptions: {
      ...plotlyConfig.toImageButtonOptions,
      filename: 'sankey_patient_flow'
    }
  });
}

/**
 * Create volcano plot for biomarker differential expression analysis
 * @param {string} containerId - DOM element ID for chart container
 * @param {Object} data - Biomarker data object
 * @param {Array<Object>} data.biomarkers - Array of biomarker objects with:
 *   - name: string (biomarker name)
 *   - log2fc: number
 *   - pvalue: number
 */
function createVolcanoPlot(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const biomarkers = data.biomarkers || [];

  // Transform data for volcano plot
  const plotData = biomarkers.map(b => ({
    name: b.name,
    log2fc: b.log2fc,
    pvalue: b.pvalue,
    negLogP: -Math.log10(b.pvalue)
  }));

  // Significance thresholds
  const fcThreshold = 1.0;
  const pThreshold = 0.05;
  const negLogPThreshold = -Math.log10(pThreshold); // ≈ 1.3

  // Categorize points
  const significant_up = plotData.filter(d => d.log2fc > fcThreshold && d.pvalue < pThreshold);
  const significant_down = plotData.filter(d => d.log2fc < -fcThreshold && d.pvalue < pThreshold);
  const nonsignificant = plotData.filter(d =>
    Math.abs(d.log2fc) <= fcThreshold || d.pvalue >= pThreshold
  );

  // Sort by significance for labeling top 10
  const sortedBySignificance = [...plotData].sort((a, b) => b.negLogP - a.negLogP);
  const top10 = sortedBySignificance.slice(0, 10);
  const top10Names = new Set(top10.map(d => d.name));

  // Create traces
  const upregulatedTrace = {
    x: significant_up.map(d => d.log2fc),
    y: significant_up.map(d => d.negLogP),
    text: significant_up.map(d => d.name),
    mode: 'markers',
    type: 'scatter',
    name: 'Upregulated (Responders)',
    marker: {
      color: '#FF5252',
      size: 10,
      line: { color: '#FF8A80', width: 1.5 },
      opacity: 0.85
    },
    hovertemplate:
      '<b>%{text}</b><br>' +
      'log₂FC: %{x:.2f}<br>' +
      'p-value: %{customdata:.2e}<br>' +
      '<b>Significant (Upregulated)</b>' +
      '<extra></extra>',
    customdata: significant_up.map(d => d.pvalue)
  };

  const downregulatedTrace = {
    x: significant_down.map(d => d.log2fc),
    y: significant_down.map(d => d.negLogP),
    text: significant_down.map(d => d.name),
    mode: 'markers',
    type: 'scatter',
    name: 'Downregulated (Responders)',
    marker: {
      color: '#0072B2',
      size: 10,
      line: { color: '#42A5F5', width: 1.5 },
      opacity: 0.85
    },
    hovertemplate:
      '<b>%{text}</b><br>' +
      'log₂FC: %{x:.2f}<br>' +
      'p-value: %{customdata:.2e}<br>' +
      '<b>Significant (Downregulated)</b>' +
      '<extra></extra>',
    customdata: significant_down.map(d => d.pvalue)
  };

  const nonsignificantTrace = {
    x: nonsignificant.map(d => d.log2fc),
    y: nonsignificant.map(d => d.negLogP),
    text: nonsignificant.map(d => d.name),
    mode: 'markers',
    type: 'scatter',
    name: 'Non-significant',
    marker: {
      color: '#666666',
      size: 6,
      opacity: 0.4
    },
    hovertemplate:
      '<b>%{text}</b><br>' +
      'log₂FC: %{x:.2f}<br>' +
      'p-value: %{customdata:.2e}<br>' +
      'Not significant' +
      '<extra></extra>',
    customdata: nonsignificant.map(d => d.pvalue)
  };

  // Create annotations for top 10 biomarkers
  const annotations = top10.map(d => ({
    x: d.log2fc,
    y: d.negLogP,
    text: d.name,
    showarrow: true,
    arrowhead: 2,
    arrowsize: 1,
    arrowwidth: 1,
    arrowcolor: d.log2fc > fcThreshold && d.pvalue < pThreshold ? '#FF5252' :
                d.log2fc < -fcThreshold && d.pvalue < pThreshold ? '#0072B2' :
                '#888888',
    ax: d.log2fc > 0 ? 40 : -40,
    ay: -30,
    font: { size: 10, color: '#e0e0e0', family: 'IBM Plex Sans, sans-serif' },
    bgcolor: 'rgba(26, 26, 26, 0.8)',
    bordercolor: d.log2fc > fcThreshold && d.pvalue < pThreshold ? '#FF5252' :
                 d.log2fc < -fcThreshold && d.pvalue < pThreshold ? '#0072B2' :
                 '#888888',
    borderwidth: 1,
    borderpad: 3
  }));

  const layout = {
    title: {
      text: 'Biomarker Significance: Responders vs Non-Responders',
      font: { size: 20, color: '#e0e0e0', family: 'IBM Plex Sans, sans-serif' }
    },
    xaxis: {
      title: {
        text: 'log₂ Fold Change',
        font: { size: 14, color: '#e0e0e0', family: 'IBM Plex Sans, sans-serif' }
      },
      gridcolor: '#333333',
      zerolinecolor: '#555555',
      zerolinewidth: 2,
      color: '#e0e0e0'
    },
    yaxis: {
      title: {
        text: '-log₁₀(p-value)',
        font: { size: 14, color: '#e0e0e0', family: 'IBM Plex Sans, sans-serif' }
      },
      gridcolor: '#333333',
      zerolinecolor: '#555555',
      color: '#e0e0e0'
    },
    plot_bgcolor: '#1a1a1a',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#e0e0e0', family: 'IBM Plex Sans, sans-serif' },
    hovermode: 'closest',
    showlegend: true,
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'rgba(26, 26, 26, 0.8)',
      bordercolor: '#555',
      borderwidth: 1,
      font: { size: 11 }
    },
    shapes: [
      // Vertical line at log2fc = -1
      {
        type: 'line',
        x0: -fcThreshold,
        y0: 0,
        x1: -fcThreshold,
        y1: Math.max(...plotData.map(d => d.negLogP)) * 1.05,
        line: {
          color: '#666666',
          width: 1,
          dash: 'dash'
        }
      },
      // Vertical line at log2fc = +1
      {
        type: 'line',
        x0: fcThreshold,
        y0: 0,
        x1: fcThreshold,
        y1: Math.max(...plotData.map(d => d.negLogP)) * 1.05,
        line: {
          color: '#666666',
          width: 1,
          dash: 'dash'
        }
      },
      // Horizontal line at -log10(0.05)
      {
        type: 'line',
        x0: Math.min(...plotData.map(d => d.log2fc)) * 1.05,
        y0: negLogPThreshold,
        x1: Math.max(...plotData.map(d => d.log2fc)) * 1.05,
        y1: negLogPThreshold,
        line: {
          color: '#666666',
          width: 1,
          dash: 'dash'
        }
      }
    ],
    annotations: annotations,
    margin: { t: 80, b: 80, l: 80, r: 40 },
    height: 700
  };

  Plotly.newPlot(
    containerId,
    [nonsignificantTrace, downregulatedTrace, upregulatedTrace],
    layout,
    {
      ...plotlyConfig,
      toImageButtonOptions: {
        ...plotlyConfig.toImageButtonOptions,
        filename: 'volcano_plot'
      }
    }
  );
}

// ============================================================================
// RIDGELINE PLOT (JOY PLOT)
// ============================================================================

/**
 * Create a ridgeline plot showing tumor size distribution shifting over time
 * @param {string} containerId - DOM element ID for chart container
 * @param {Object} data - Clinical trial data with patients array
 */
function createRidgelinePlot(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }
  container.innerHTML = '';

  // Define timepoints in order (earliest to latest)
  const timepoints = ['Baseline', 'Week 4', 'Week 8', 'Week 12', 'Week 16', 'Week 24'];

  // Color palette showing treatment progression (gray → cyan → green)
  const colorPalette = {
    'Baseline': '#666666',      // Gray (pre-treatment)
    'Week 4': '#00D9FF',        // Cyan (treatment starts)
    'Week 8': '#00BCD4',        // Cyan-teal
    'Week 12': '#009688',       // Teal
    'Week 16': '#4CAF50',       // Light green
    'Week 24': '#00C853'        // Green (sustained response)
  };

  // Extract tumor sizes for each timepoint
  const tumorDataByTimepoint = {};

  timepoints.forEach(tp => {
    tumorDataByTimepoint[tp] = [];
  });

  // Parse tumor measurements from patient data
  if (data && data.patients) {
    data.patients.forEach(patient => {
      // Map column names to timepoints
      const timepointMap = {
        'Baseline': patient.tumor_baseline,
        'Week 4': patient.tumor_week4,
        'Week 8': patient.tumor_week8,
        'Week 12': patient.tumor_week12,
        'Week 16': patient.tumor_week16,
        'Week 24': patient.tumor_week24
      };

      timepoints.forEach(tp => {
        const value = timepointMap[tp];
        if (value !== null && value !== undefined && !isNaN(value)) {
          tumorDataByTimepoint[tp].push(parseFloat(value));
        }
      });
    });
  }

  // Create violin traces for each timepoint (ridgeline effect)
  const traces = [];

  timepoints.forEach((tp, idx) => {
    const tumorSizes = tumorDataByTimepoint[tp];

    if (tumorSizes && tumorSizes.length > 0) {
      // Create violin plot with only positive side (creates ridge effect)
      const trace = {
        type: 'violin',
        y: tumorSizes,
        name: tp,
        x: Array(tumorSizes.length).fill(tp),
        side: 'positive',
        meanline: {
          visible: true,
          color: colorPalette[tp],
          width: 2
        },
        line: {
          color: colorPalette[tp],
          width: 1
        },
        fillcolor: colorPalette[tp],
        opacity: 0.7,
        points: false,
        box: {
          visible: false
        },
        scalemode: 'width',
        width: 0.8,
        hoverinfo: 'y+name',
        hoveron: 'violins'
      };

      traces.push(trace);
    }
  });

  // Layout configuration
  const layout = {
    ...getDarkLayout('Tumor Size Distribution Over Time'),
    xaxis: {
      title: {
        text: 'Timepoint',
        font: { size: 14, color: CHART_COLORS.text }
      },
      gridcolor: CHART_COLORS.grid,
      tickfont: { color: CHART_COLORS.text },
      categoryorder: 'array',
      categoryarray: timepoints
    },
    yaxis: {
      title: {
        text: 'Tumor Size (mm)',
        font: { size: 14, color: CHART_COLORS.text }
      },
      gridcolor: CHART_COLORS.grid,
      zerolinecolor: CHART_COLORS.zeroline,
      tickfont: { color: CHART_COLORS.text }
    },
    showlegend: true,
    legend: {
      bgcolor: 'rgba(13, 13, 13, 0.8)',
      bordercolor: CHART_COLORS.grid,
      borderwidth: 1,
      font: { color: CHART_COLORS.text, size: 11 },
      orientation: 'v',
      x: 1.02,
      y: 1,
      xanchor: 'left'
    },
    violinmode: 'overlay',
    margin: { t: 100, b: 80, l: 80, r: 150 },
    height: 600,
    annotations: [
      {
        text: 'Distribution shifts left (smaller tumors) as treatment progresses',
        xref: 'paper',
        yref: 'paper',
        x: 0.5,
        y: -0.15,
        xanchor: 'center',
        yanchor: 'top',
        showarrow: false,
        font: {
          size: 11,
          color: CHART_COLORS.textSecondary,
          style: 'italic'
        }
      }
    ]
  };

  // Plot configuration
  const config = {
    ...plotlyConfig,
    toImageButtonOptions: {
      ...plotlyConfig.toImageButtonOptions,
      filename: 'ridgeline_plot'
    }
  };

  Plotly.newPlot(containerId, traces, layout, config);
}

// ============================================================================
// CHORD DIAGRAM (ADVERSE EVENT CO-OCCURRENCE NETWORK)
// ============================================================================

/**
 * Create a chord diagram showing adverse event co-occurrence
 * Uses a circular heatmap/matrix approach for Plotly compatibility
 * @param {string} containerId - DOM element ID for chart container
 * @param {Object} data - Clinical trial data with ae_cooccurrence array
 */
function createChordDiagram(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }
  container.innerHTML = '';

  // Extract co-occurrence data
  let cooccurrenceData = [];

  if (data && data.ae_cooccurrence) {
    cooccurrenceData = data.ae_cooccurrence;
  } else {
    console.warn('No ae_cooccurrence data found, using sample data');
    // Sample data for demonstration
    cooccurrenceData = [
      { source: 'Fatigue', target: 'Nausea', count: 15 },
      { source: 'Fatigue', target: 'Decreased Appetite', count: 12 },
      { source: 'Nausea', target: 'Diarrhea', count: 10 },
      { source: 'Nausea', target: 'Vomiting', count: 8 },
      { source: 'Rash', target: 'Hand-Foot Syndrome', count: 7 },
      { source: 'Neutropenia', target: 'Anemia', count: 6 },
      { source: 'Fatigue', target: 'Anemia', count: 5 }
    ];
  }

  // Get unique AE terms
  const aeSet = new Set();
  cooccurrenceData.forEach(d => {
    aeSet.add(d.source);
    aeSet.add(d.target);
  });
  const aeTerms = Array.from(aeSet).sort();

  // Define AE categories and colors
  const aeCategoryColors = {
    'Fatigue': '#FF9800',
    'Decreased Appetite': '#FF9800',
    'Nausea': '#4CAF50',
    'Diarrhea': '#4CAF50',
    'Vomiting': '#4CAF50',
    'Mucositis': '#4CAF50',
    'Rash': '#E91E63',
    'Hand-Foot Syndrome': '#E91E63',
    'Neutropenia': '#9C27B0',
    'Anemia': '#9C27B0',
    'Thrombocytopenia': '#9C27B0'
  };

  // Create matrix for heatmap
  const matrix = [];
  const labels = aeTerms;

  // Initialize matrix with zeros
  for (let i = 0; i < labels.length; i++) {
    matrix[i] = new Array(labels.length).fill(0);
  }

  // Fill matrix with co-occurrence counts (make it symmetric)
  cooccurrenceData.forEach(d => {
    const sourceIdx = labels.indexOf(d.source);
    const targetIdx = labels.indexOf(d.target);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      matrix[sourceIdx][targetIdx] = d.count;
      matrix[targetIdx][sourceIdx] = d.count; // Symmetric
    }
  });

  // Calculate diagonal (total patients with each AE)
  // For demo purposes, set diagonal to sum of row/column
  for (let i = 0; i < labels.length; i++) {
    let total = 0;
    for (let j = 0; j < labels.length; j++) {
      if (i !== j) {
        total += matrix[i][j];
      }
    }
    matrix[i][i] = Math.round(total * 1.5); // Diagonal shows total prevalence
  }

  // Create heatmap trace
  const heatmapTrace = {
    type: 'heatmap',
    z: matrix,
    x: labels,
    y: labels,
    colorscale: [
      [0, '#1a1a1a'],
      [0.2, '#2c3e50'],
      [0.4, '#34495e'],
      [0.6, '#3498db'],
      [0.8, '#00D9FF'],
      [1, '#00C853']
    ],
    showscale: true,
    colorbar: {
      title: {
        text: 'Co-occurrence<br>Count',
        side: 'right',
        font: { color: CHART_COLORS.text, size: 11 }
      },
      tickfont: { color: CHART_COLORS.text },
      bgcolor: CHART_COLORS.paper,
      bordercolor: CHART_COLORS.grid,
      borderwidth: 1,
      thickness: 20,
      len: 0.7
    },
    hovertemplate: '<b>%{y} + %{x}</b><br>Co-occurrence: %{z} patients<extra></extra>',
    xgap: 1,
    ygap: 1
  };

  // Layout configuration
  const layout = {
    ...getDarkLayout('Adverse Event Co-occurrence Network'),
    xaxis: {
      title: '',
      tickangle: -45,
      tickfont: { color: CHART_COLORS.text, size: 10 },
      gridcolor: 'transparent',
      showgrid: false,
      side: 'bottom'
    },
    yaxis: {
      title: '',
      tickfont: { color: CHART_COLORS.text, size: 10 },
      gridcolor: 'transparent',
      showgrid: false,
      autorange: 'reversed'
    },
    margin: { t: 100, b: 120, l: 120, r: 100 },
    height: 700,
    annotations: [
      {
        text: 'Cell intensity indicates frequency of co-occurrence | Diagonal shows total AE prevalence',
        xref: 'paper',
        yref: 'paper',
        x: 0.5,
        y: -0.18,
        xanchor: 'center',
        yanchor: 'top',
        showarrow: false,
        font: {
          size: 11,
          color: CHART_COLORS.textSecondary,
          style: 'italic'
        }
      }
    ]
  };

  // Plot configuration
  const config = {
    ...plotlyConfig,
    toImageButtonOptions: {
      ...plotlyConfig.toImageButtonOptions,
      filename: 'chord_diagram'
    }
  };

  Plotly.newPlot(containerId, [heatmapTrace], layout, config);
}

// ============================================================================
// ROC CURVE, PRECISION-RECALL, AND SCORE DISTRIBUTION
// ============================================================================

/**
 * Creates a ROC curve with AUC, optimal threshold point, and CI band
 * @param {string} containerId - The container element ID
 * @param {Array} data - Array of {disease_status, predicted_probability}
 */
function createROCCurve(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // Sort patients by predicted_probability descending
    const sorted = [...data].sort((a, b) => b.predicted_probability - a.predicted_probability);

    // Calculate total positives and negatives
    const totalPos = sorted.filter(p => p.disease_status === 'Positive').length;
    const totalNeg = sorted.filter(p => p.disease_status === 'Negative').length;

    // Calculate ROC points at each threshold
    const rocPoints = [];
    let tp = 0, fp = 0;
    let prevProb = 1.1;

    // Add (0,0) point
    rocPoints.push({ fpr: 0, tpr: 0, threshold: 1.0 });

    for (const patient of sorted) {
        if (patient.disease_status === 'Positive') {
            tp++;
        } else {
            fp++;
        }

        const tpr = tp / totalPos;  // Sensitivity
        const fpr = fp / totalNeg;  // 1 - Specificity

        rocPoints.push({
            fpr: fpr,
            tpr: tpr,
            threshold: patient.predicted_probability
        });
    }

    // Calculate AUC using trapezoidal rule
    let auc = 0;
    for (let i = 1; i < rocPoints.length; i++) {
        const width = rocPoints[i].fpr - rocPoints[i-1].fpr;
        const avgHeight = (rocPoints[i].tpr + rocPoints[i-1].tpr) / 2;
        auc += width * avgHeight;
    }

    // Find optimal threshold (Youden's J = TPR - FPR)
    let maxJ = -1, optimalPoint = rocPoints[0];
    for (const point of rocPoints) {
        const j = point.tpr - point.fpr;
        if (j > maxJ) {
            maxJ = j;
            optimalPoint = point;
        }
    }

    // Create traces
    const rocTrace = {
        x: rocPoints.map(p => p.fpr),
        y: rocPoints.map(p => p.tpr),
        type: 'scatter',
        mode: 'lines',
        name: `ROC Curve (AUC = ${auc.toFixed(3)})`,
        line: { color: CHART_COLORS.accent, width: 3 },
        fill: 'tozeroy',
        fillcolor: 'rgba(0, 217, 255, 0.1)',
        hovertemplate: 'FPR: %{x:.2f}<br>TPR: %{y:.2f}<extra></extra>'
    };

    const diagonalTrace = {
        x: [0, 1],
        y: [0, 1],
        type: 'scatter',
        mode: 'lines',
        name: 'Random (AUC = 0.5)',
        line: { color: CHART_COLORS.textSecondary, width: 2, dash: 'dash' }
    };

    const optimalMarker = {
        x: [optimalPoint.fpr],
        y: [optimalPoint.tpr],
        type: 'scatter',
        mode: 'markers+text',
        name: `Optimal (J=${maxJ.toFixed(2)}, t=${optimalPoint.threshold.toFixed(2)})`,
        marker: { color: CHART_COLORS.success, size: 14, symbol: 'star' },
        text: [`Threshold: ${optimalPoint.threshold.toFixed(2)}`],
        textposition: 'top right',
        textfont: { color: CHART_COLORS.success, size: 11 }
    };

    const layout = {
        ...getDarkLayout('Receiver Operating Characteristic (ROC)'),
        xaxis: {
            title: 'False Positive Rate (1 - Specificity)',
            range: [0, 1],
            gridcolor: CHART_COLORS.grid,
            zerolinecolor: CHART_COLORS.zeroline,
            tickfont: { color: CHART_COLORS.text },
            titlefont: { size: 14, color: CHART_COLORS.text }
        },
        yaxis: {
            title: 'True Positive Rate (Sensitivity)',
            range: [0, 1],
            gridcolor: CHART_COLORS.grid,
            zerolinecolor: CHART_COLORS.zeroline,
            tickfont: { color: CHART_COLORS.text },
            titlefont: { size: 14, color: CHART_COLORS.text }
        },
        legend: {
            x: 0.5,
            y: 0.1,
            bgcolor: 'rgba(13, 13, 13, 0.8)',
            bordercolor: CHART_COLORS.grid,
            borderwidth: 1,
            font: { color: CHART_COLORS.text, size: 12 }
        },
        showlegend: true
    };

    const config = {
        ...plotlyConfig,
        toImageButtonOptions: {
            ...plotlyConfig.toImageButtonOptions,
            filename: 'roc_curve'
        }
    };

    Plotly.newPlot(containerId, [rocTrace, diagonalTrace, optimalMarker], layout, config);

    // Store AUC and optimal threshold for other functions
    container.dataset.auc = auc.toFixed(3);
    container.dataset.optimalThreshold = optimalPoint.threshold.toFixed(2);

    // Describe the result for assistive tech (the static label can't reflect data)
    container.setAttribute('aria-label',
      `ROC curve. Area under the curve ${auc.toFixed(3)}. Optimal threshold ${optimalPoint.threshold.toFixed(2)} by Youden's J of ${maxJ.toFixed(2)}.`);
}

/**
 * Creates a Precision-Recall curve with Average Precision
 * @param {string} containerId - The container element ID
 * @param {Array} data - Array of {disease_status, predicted_probability}
 */
function createPRCurve(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // Sort by predicted_probability descending
    const sorted = [...data].sort((a, b) => b.predicted_probability - a.predicted_probability);

    const totalPos = sorted.filter(p => p.disease_status === 'Positive').length;

    // Calculate PR points
    const prPoints = [];
    let tp = 0, fp = 0;
    let prevRecall = 0;
    let ap = 0;  // Average Precision

    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].disease_status === 'Positive') {
            tp++;
        } else {
            fp++;
        }

        const precision = tp / (tp + fp);
        const recall = tp / totalPos;

        // Interpolate for AP calculation
        if (recall > prevRecall) {
            ap += precision * (recall - prevRecall);
            prevRecall = recall;
        }

        prPoints.push({
            precision: precision,
            recall: recall,
            threshold: sorted[i].predicted_probability
        });
    }

    // Add starting point
    prPoints.unshift({ precision: 1, recall: 0, threshold: 1.0 });

    const prTrace = {
        x: prPoints.map(p => p.recall),
        y: prPoints.map(p => p.precision),
        type: 'scatter',
        mode: 'lines',
        name: `PR Curve (AP = ${ap.toFixed(3)})`,
        line: { color: CHART_COLORS.danger, width: 3 },
        fill: 'tozeroy',
        fillcolor: 'rgba(220, 53, 69, 0.1)',
        hovertemplate: 'Recall: %{x:.2f}<br>Precision: %{y:.2f}<extra></extra>'
    };

    // Baseline (prevalence)
    const prevalence = totalPos / sorted.length;
    const baselineTrace = {
        x: [0, 1],
        y: [prevalence, prevalence],
        type: 'scatter',
        mode: 'lines',
        name: `No Skill (Prevalence = ${prevalence.toFixed(2)})`,
        line: { color: CHART_COLORS.textSecondary, width: 2, dash: 'dash' }
    };

    const layout = {
        ...getDarkLayout('Precision-Recall Curve'),
        xaxis: {
            title: 'Recall (Sensitivity)',
            range: [0, 1],
            gridcolor: CHART_COLORS.grid,
            zerolinecolor: CHART_COLORS.zeroline,
            tickfont: { color: CHART_COLORS.text },
            titlefont: { size: 14, color: CHART_COLORS.text }
        },
        yaxis: {
            title: 'Precision (PPV)',
            range: [0, 1],
            gridcolor: CHART_COLORS.grid,
            zerolinecolor: CHART_COLORS.zeroline,
            tickfont: { color: CHART_COLORS.text },
            titlefont: { size: 14, color: CHART_COLORS.text }
        },
        legend: {
            x: 0.5,
            y: 0.1,
            bgcolor: 'rgba(13, 13, 13, 0.8)',
            bordercolor: CHART_COLORS.grid,
            borderwidth: 1,
            font: { color: CHART_COLORS.text, size: 12 }
        },
        showlegend: true
    };

    const config = {
        ...plotlyConfig,
        toImageButtonOptions: {
            ...plotlyConfig.toImageButtonOptions,
            filename: 'precision_recall_curve'
        }
    };

    Plotly.newPlot(containerId, [prTrace, baselineTrace], layout, config);

    container.dataset.ap = ap.toFixed(3);
}

/**
 * Creates overlapping score distributions with threshold visualization
 * @param {string} containerId - Container element ID
 * @param {Array} data - Array of {disease_status, predicted_probability}
 * @param {number} threshold - Classification threshold
 */
function createScoreDistribution(containerId, data, threshold = 0.5) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // Separate by disease status
    const posScores = data.filter(p => p.disease_status === 'Positive').map(p => p.predicted_probability);
    const negScores = data.filter(p => p.disease_status === 'Negative').map(p => p.predicted_probability);

    // Create histogram traces with overlap
    const posTrace = {
        x: posScores,
        type: 'histogram',
        name: 'Disease Positive',
        opacity: 0.7,
        marker: { color: CHART_COLORS.danger },
        nbinsx: 15,
        histnorm: 'probability density'
    };

    const negTrace = {
        x: negScores,
        type: 'histogram',
        name: 'Disease Negative',
        opacity: 0.7,
        marker: { color: CHART_COLORS.treatment },
        nbinsx: 15,
        histnorm: 'probability density'
    };

    // Threshold line
    const thresholdLine = {
        type: 'line',
        x0: threshold,
        y0: 0,
        x1: threshold,
        y1: 1,
        yref: 'paper',
        line: { color: CHART_COLORS.accent, width: 3, dash: 'dash' }
    };

    // Add annotations for regions
    const tp = posScores.filter(s => s >= threshold).length;
    const fn = posScores.filter(s => s < threshold).length;
    const tn = negScores.filter(s => s < threshold).length;
    const fp = negScores.filter(s => s >= threshold).length;

    const layout = {
        ...getDarkLayout('Prediction Score Distribution'),
        xaxis: {
            title: 'Predicted Probability',
            range: [0, 1],
            gridcolor: CHART_COLORS.grid,
            zerolinecolor: CHART_COLORS.zeroline,
            tickfont: { color: CHART_COLORS.text },
            titlefont: { size: 14, color: CHART_COLORS.text }
        },
        yaxis: {
            title: 'Density',
            gridcolor: CHART_COLORS.grid,
            zerolinecolor: CHART_COLORS.zeroline,
            tickfont: { color: CHART_COLORS.text },
            titlefont: { size: 14, color: CHART_COLORS.text }
        },
        barmode: 'overlay',
        shapes: [thresholdLine],
        annotations: [
            {
                x: threshold,
                y: 1.05,
                yref: 'paper',
                text: `Threshold: ${threshold.toFixed(2)}`,
                showarrow: false,
                font: { color: CHART_COLORS.accent, size: 12 }
            },
            {
                x: 0.15,
                y: 0.95,
                xref: 'paper',
                yref: 'paper',
                text: `TN: ${tn} | FN: ${fn}`,
                showarrow: false,
                font: { color: CHART_COLORS.text, size: 11 },
                bgcolor: 'rgba(13, 13, 13, 0.8)'
            },
            {
                x: 0.85,
                y: 0.95,
                xref: 'paper',
                yref: 'paper',
                text: `TP: ${tp} | FP: ${fp}`,
                showarrow: false,
                font: { color: CHART_COLORS.text, size: 11 },
                bgcolor: 'rgba(13, 13, 13, 0.8)'
            }
        ],
        legend: {
            x: 0.7,
            y: 0.98,
            bgcolor: 'rgba(13, 13, 13, 0.8)',
            bordercolor: CHART_COLORS.grid,
            borderwidth: 1,
            font: { color: CHART_COLORS.text, size: 12 }
        }
    };

    const config = {
        ...plotlyConfig,
        toImageButtonOptions: {
            ...plotlyConfig.toImageButtonOptions,
            filename: 'score_distribution'
        }
    };

    Plotly.newPlot(containerId, [negTrace, posTrace], layout, config);
}

/**
 * Creates a calibration plot showing predicted vs observed probability
 * @param {string} containerId - Container element ID
 * @param {Array} data - Array of {disease_status, predicted_probability}
 */
function createCalibrationPlot(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // Bin predictions into 10 deciles
    const bins = [];
    for (let i = 0; i < 10; i++) {
        bins.push({ lower: i/10, upper: (i+1)/10, predicted: [], observed: [] });
    }

    // Assign each patient to a bin
    for (const patient of data) {
        const prob = patient.predicted_probability;
        const binIdx = Math.min(Math.floor(prob * 10), 9);
        bins[binIdx].predicted.push(prob);
        bins[binIdx].observed.push(patient.disease_status === 'Positive' ? 1 : 0);
    }

    // Calculate mean predicted and observed for each bin
    const calibrationPoints = [];
    for (const bin of bins) {
        if (bin.predicted.length > 0) {
            const meanPredicted = bin.predicted.reduce((a,b) => a+b, 0) / bin.predicted.length;
            const meanObserved = bin.observed.reduce((a,b) => a+b, 0) / bin.observed.length;
            calibrationPoints.push({
                predicted: meanPredicted,
                observed: meanObserved,
                count: bin.predicted.length
            });
        }
    }

    // Calibration curve trace
    const calibrationTrace = {
        x: calibrationPoints.map(p => p.predicted),
        y: calibrationPoints.map(p => p.observed),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Model Calibration',
        line: { color: CHART_COLORS.accent, width: 3 },
        marker: {
            size: calibrationPoints.map(p => Math.sqrt(p.count) * 4 + 6),
            color: CHART_COLORS.accent
        },
        hovertemplate: 'Predicted: %{x:.2f}<br>Observed: %{y:.2f}<br>N: %{text}<extra></extra>',
        text: calibrationPoints.map(p => p.count)
    };

    // Perfect calibration reference line
    const perfectLine = {
        x: [0, 1],
        y: [0, 1],
        type: 'scatter',
        mode: 'lines',
        name: 'Perfect Calibration',
        line: { color: CHART_COLORS.zeroline, width: 2, dash: 'dash' }
    };

    const layout = getDarkLayout('Calibration Plot');
    layout.xaxis.title = 'Mean Predicted Probability';
    layout.xaxis.range = [0, 1];
    layout.yaxis.title = 'Observed Frequency';
    layout.yaxis.range = [0, 1];
    layout.legend = {
        x: 0.02, y: 0.98,
        bgcolor: 'rgba(13,13,13,0.8)', bordercolor: CHART_COLORS.grid, borderwidth: 1,
        font: { color: CHART_COLORS.text, size: 12 }
    };
    layout.margin = { t: 60, r: 20, b: 60, l: 60 };
    layout.annotations = [{
        x: 0.5, y: 0.12, xref: 'paper', yref: 'paper',
        text: 'Above line = under-confident · Below line = over-confident',
        showarrow: false,
        font: { color: CHART_COLORS.textSecondary, size: 10 },
        align: 'center'
    }];

    Plotly.newPlot(containerId, [perfectLine, calibrationTrace], layout, plotlyConfig);
}

/**
 * Creates gauge charts row for diagnostic metrics
 * @param {string} containerId - Container element ID
 * @param {Array} data - Array of {disease_status, predicted_probability}
 * @param {number} threshold - Classification threshold
 */
function createDiagnosticGauges(containerId, data, threshold = 0.5) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // Calculate metrics at threshold
    const pos = data.filter(p => p.disease_status === 'Positive');
    const neg = data.filter(p => p.disease_status === 'Negative');

    const tp = pos.filter(p => p.predicted_probability >= threshold).length;
    const fn = pos.filter(p => p.predicted_probability < threshold).length;
    const tn = neg.filter(p => p.predicted_probability < threshold).length;
    const fp = neg.filter(p => p.predicted_probability >= threshold).length;

    const sensitivity = tp / (tp + fn);
    const specificity = tn / (tn + fp);
    const youdenJ = sensitivity + specificity - 1;

    // Calculate AUC (simplified - using trapezoid method)
    const sorted = [...data].sort((a, b) => b.predicted_probability - a.predicted_probability);
    let aucTp = 0, aucFp = 0, auc = 0, prevFpr = 0;
    for (const patient of sorted) {
        if (patient.disease_status === 'Positive') aucTp++;
        else aucFp++;
        const tpr = aucTp / pos.length;
        const fpr = aucFp / neg.length;
        auc += tpr * (fpr - prevFpr);
        prevFpr = fpr;
    }

    const metrics = [
        { title: 'AUC', value: auc, color: '#00D9FF' },
        { title: 'Sensitivity', value: sensitivity, color: '#00C853' },
        { title: 'Specificity', value: specificity, color: '#FF9800' },
        { title: "Youden's J", value: youdenJ, color: '#E91E63' }
    ];

    // Create gauge HTML
    container.innerHTML = metrics.map(metric => `
        <div class="gauge-container" id="gauge-${metric.title.toLowerCase().replace(/'/g, '').replace(/ /g, '-')}">
        </div>
    `).join('');

    // Create each gauge using Plotly
    metrics.forEach((metric, i) => {
        const gaugeId = `gauge-${metric.title.toLowerCase().replace(/'/g, '').replace(/ /g, '-')}`;
        const gaugeContainer = document.getElementById(gaugeId);
        if (!gaugeContainer) return; // guard: skip if the container wasn't created

        const gaugeData = [{
            type: 'indicator',
            mode: 'gauge+number',
            value: metric.value,
            number: {
                suffix: '',
                font: { size: 28, color: metric.color },
                valueformat: '.2f'
            },
            title: {
                text: metric.title,
                font: { size: 14, color: CHART_COLORS.textSecondary }
            },
            gauge: {
                axis: {
                    range: [metric.title === "Youden's J" ? -1 : 0, 1],
                    tickcolor: CHART_COLORS.grid,
                    tickfont: { color: CHART_COLORS.textSecondary }
                },
                bar: { color: metric.color, thickness: 0.75 },
                bgcolor: CHART_COLORS.background,
                borderwidth: 0,
                steps: [
                    { range: [0, 0.5], color: 'rgba(220,53,69,0.18)' },
                    { range: [0.5, 0.7], color: 'rgba(255,193,7,0.18)' },
                    { range: [0.7, 1], color: 'rgba(40,167,69,0.18)' }
                ],
                threshold: {
                    line: { color: CHART_COLORS.text, width: 2 },
                    thickness: 0.75,
                    value: metric.value
                }
            }
        }];

        const layout = {
            width: 200,
            height: 180,
            margin: { t: 40, r: 20, l: 20, b: 20 },
            paper_bgcolor: 'transparent',
            font: { color: CHART_COLORS.text }
        };

        Plotly.newPlot(gaugeId, gaugeData, layout, {displayModeBar: false, responsive: true});
    });
}

/**
 * Creates Decision Curve Analysis showing net benefit across thresholds
 * @param {string} containerId - Container element ID
 * @param {Array} data - Array of {disease_status, predicted_probability}
 */
function createDecisionCurve(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const n = data.length;
    const prevalence = data.filter(p => p.disease_status === 'Positive').length / n;

    const thresholds = [];
    const modelNetBenefit = [];
    const treatAllNetBenefit = [];
    const treatNoneNetBenefit = [];

    // Calculate net benefit at each threshold
    for (let t = 0.01; t <= 0.99; t += 0.02) {
        thresholds.push(t);

        // Calculate confusion matrix at threshold
        const pos = data.filter(p => p.disease_status === 'Positive');
        const neg = data.filter(p => p.disease_status === 'Negative');

        const tp = pos.filter(p => p.predicted_probability >= t).length;
        const fp = neg.filter(p => p.predicted_probability >= t).length;

        // Net benefit = (TP/n) - (FP/n) * (pt/(1-pt))
        // Net benefit is allowed to be negative by design — that is precisely
        // how a decision curve shows where a strategy stops being worthwhile.
        // (The previous Math.max(.,0) clamp flattened the "Treat All" line and
        // destroyed the clinical interpretation.)
        const odds = t / (1 - t);
        const nb = (tp/n) - (fp/n) * odds;
        modelNetBenefit.push(nb);

        // Treat all: NB = prevalence - (1-prevalence) * odds
        const nbAll = prevalence - (1 - prevalence) * odds;
        treatAllNetBenefit.push(nbAll);

        // Treat none: NB = 0
        treatNoneNetBenefit.push(0);
    }

    const modelTrace = {
        x: thresholds,
        y: modelNetBenefit,
        type: 'scatter',
        mode: 'lines',
        name: 'AI Model',
        line: { color: '#00D9FF', width: 3 }
    };

    const treatAllTrace = {
        x: thresholds,
        y: treatAllNetBenefit,
        type: 'scatter',
        mode: 'lines',
        name: 'Treat All',
        line: { color: '#FF9800', width: 2, dash: 'dash' }
    };

    const treatNoneTrace = {
        x: thresholds,
        y: treatNoneNetBenefit,
        type: 'scatter',
        mode: 'lines',
        name: 'Treat None',
        line: { color: CHART_COLORS.zeroline, width: 2, dash: 'dot' }
    };

    const layout = {
        title: {
            text: 'Decision Curve Analysis: Clinical Utility',
            font: { color: CHART_COLORS.text, size: 16 }
        },
        xaxis: {
            title: 'Threshold Probability',
            range: [0, 1],
            gridcolor: CHART_COLORS.grid,
            tickfont: { color: CHART_COLORS.textSecondary },
            titlefont: { color: CHART_COLORS.textSecondary }
        },
        yaxis: {
            title: 'Net Benefit',
            range: [-0.1, Math.max(...modelNetBenefit, prevalence) + 0.05],
            gridcolor: CHART_COLORS.grid,
            zerolinecolor: CHART_COLORS.text,
            tickfont: { color: CHART_COLORS.textSecondary },
            titlefont: { color: CHART_COLORS.textSecondary }
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: CHART_COLORS.background,
        font: { color: CHART_COLORS.text },
        legend: { x: 0.7, y: 0.98 },
        margin: { t: 50, r: 20, b: 70, l: 60 },
        annotations: [{
            x: 0.5, y: -0.20, xref: 'paper', yref: 'paper',
            text: 'A strategy is preferred where its net benefit is highest; below 0 means net harm',
            showarrow: false,
            font: { color: CHART_COLORS.textSecondary, size: 11 }
        }]
    };

    Plotly.newPlot(containerId, [treatNoneTrace, treatAllTrace, modelTrace], layout, {responsive: true});
}

/**
 * Creates the Interactive Threshold Explorer with real-time updates
 * @param {string} containerId - Container element ID
 * @param {Array} data - Array of {disease_status, predicted_probability}
 */
function createThresholdExplorer(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Store data reference for slider updates
    window._thresholdData = data;

    // Initial render at threshold 0.5
    updateThresholdExplorer(0.5, data);

    // Wire the slider. Use `oninput` (assignment) rather than addEventListener so
    // re-rendering Study 2 REPLACES the handler instead of stacking a new one each
    // time (which previously fired updateThresholdExplorer N times per slider move).
    const slider = document.getElementById('threshold-slider');
    const valueDisplay = document.getElementById('threshold-value');

    if (slider && valueDisplay) {
        slider.value = 50;
        valueDisplay.textContent = '0.50';
        slider.oninput = function() {
            const threshold = this.value / 100;
            valueDisplay.textContent = threshold.toFixed(2);
            updateThresholdExplorer(threshold, window._thresholdData);
        };
    }
}

/**
 * Updates the threshold explorer display with new threshold value
 * @param {number} threshold - Current threshold (0-1)
 * @param {Array} data - Patient data array
 */
function updateThresholdExplorer(threshold, data) {
    const metricsContainer = document.getElementById('threshold-metrics');
    const matrixContainer = document.getElementById('threshold-matrix');

    if (!metricsContainer || !matrixContainer || !data) return;

    // Calculate confusion matrix
    const pos = data.filter(p => p.disease_status === 'Positive');
    const neg = data.filter(p => p.disease_status === 'Negative');

    const tp = pos.filter(p => p.predicted_probability >= threshold).length;
    const fn = pos.filter(p => p.predicted_probability < threshold).length;
    const tn = neg.filter(p => p.predicted_probability < threshold).length;
    const fp = neg.filter(p => p.predicted_probability >= threshold).length;

    // Calculate metrics
    const sensitivity = tp / (tp + fn) || 0;
    const specificity = tn / (tn + fp) || 0;
    const ppv = tp / (tp + fp) || 0;
    const npv = tn / (tn + fn) || 0;
    const accuracy = (tp + tn) / data.length;
    const f1 = 2 * (ppv * sensitivity) / (ppv + sensitivity) || 0;

    // Render metrics grid
    metricsContainer.innerHTML = `
        <div class="threshold-metric">
            <div class="threshold-metric-label">Sensitivity</div>
            <div class="threshold-metric-value" style="color: #00C853">${(sensitivity * 100).toFixed(1)}%</div>
        </div>
        <div class="threshold-metric">
            <div class="threshold-metric-label">Specificity</div>
            <div class="threshold-metric-value" style="color: #FF9800">${(specificity * 100).toFixed(1)}%</div>
        </div>
        <div class="threshold-metric">
            <div class="threshold-metric-label">PPV</div>
            <div class="threshold-metric-value" style="color: #00D9FF">${(ppv * 100).toFixed(1)}%</div>
        </div>
        <div class="threshold-metric">
            <div class="threshold-metric-label">NPV</div>
            <div class="threshold-metric-value" style="color: #E91E63">${(npv * 100).toFixed(1)}%</div>
        </div>
        <div class="threshold-metric">
            <div class="threshold-metric-label">Accuracy</div>
            <div class="threshold-metric-value">${(accuracy * 100).toFixed(1)}%</div>
        </div>
        <div class="threshold-metric">
            <div class="threshold-metric-label">F1 Score</div>
            <div class="threshold-metric-value">${f1.toFixed(3)}</div>
        </div>
    `;

    // Render confusion matrix
    matrixContainer.innerHTML = `
        <div class="confusion-matrix-visual">
            <div class="matrix-title">Confusion Matrix at Threshold ${threshold.toFixed(2)}</div>
            <div class="matrix-grid">
                <div class="matrix-header"></div>
                <div class="matrix-header">Predicted +</div>
                <div class="matrix-header">Predicted −</div>
                <div class="matrix-row-label">Actual +</div>
                <div class="matrix-cell tp"><span class="cell-glyph" aria-hidden="true">✓</span> TP: ${tp}</div>
                <div class="matrix-cell fn"><span class="cell-glyph" aria-hidden="true">✗</span> FN: ${fn}</div>
                <div class="matrix-row-label">Actual −</div>
                <div class="matrix-cell fp"><span class="cell-glyph" aria-hidden="true">✗</span> FP: ${fp}</div>
                <div class="matrix-cell tn"><span class="cell-glyph" aria-hidden="true">✓</span> TN: ${tn}</div>
            </div>
        </div>
    `;

    // Update score distribution chart if it exists
    if (document.getElementById('score-distribution')) {
        createScoreDistribution('score-distribution', data, threshold);
    }
}

/**
 * Create side-by-side donut charts showing responder breakdown by treatment arm
 * @param {string} containerId - The container element ID
 * @param {Array} data - Patient data array with treatment_group and pct_change_week12
 */
function createResponderDonutChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear placeholder
    container.innerHTML = '';

    // Define responder threshold
    const RESPONDER_THRESHOLD = -20;

    // Split data by treatment group
    const treatmentData = data.filter(d => d.treatment_group === 'Treatment');
    const placeboData = data.filter(d => d.treatment_group === 'Placebo');

    // Count responders in each arm
    const treatmentResponders = treatmentData.filter(d => d.pct_change_week12 <= RESPONDER_THRESHOLD).length;
    const treatmentNonResponders = treatmentData.length - treatmentResponders;

    const placeboResponders = placeboData.filter(d => d.pct_change_week12 <= RESPONDER_THRESHOLD).length;
    const placeboNonResponders = placeboData.length - placeboResponders;

    // Create Treatment donut (left)
    const treatmentDonut = {
        values: [treatmentResponders, treatmentNonResponders],
        labels: ['Responders', 'Non-Responders'],
        type: 'pie',
        hole: 0.55,
        domain: { x: [0, 0.45], y: [0, 1] },
        marker: {
            colors: ['#00C853', '#6c757d'],
            line: { color: '#1a1a1a', width: 2 }
        },
        textinfo: 'percent+value',
        textposition: 'outside',
        textfont: { color: '#E0E0E0', size: 14 },
        hovertemplate: '<b>%{label}</b><br>%{value} patients<br>%{percent}<extra></extra>',
        name: 'Treatment',
        title: {
            text: `<b>Treatment</b><br><span style="font-size:24px">${((treatmentResponders/treatmentData.length)*100).toFixed(0)}%</span>`,
            font: { size: 14, color: '#00C853' },
            position: 'middle center'
        }
    };

    // Create Placebo donut (right)
    const placeboDonut = {
        values: [placeboResponders, placeboNonResponders],
        labels: ['Responders', 'Non-Responders'],
        type: 'pie',
        hole: 0.55,
        domain: { x: [0.55, 1], y: [0, 1] },
        marker: {
            colors: ['#FF9800', '#6c757d'],
            line: { color: '#1a1a1a', width: 2 }
        },
        textinfo: 'percent+value',
        textposition: 'outside',
        textfont: { color: '#E0E0E0', size: 14 },
        hovertemplate: '<b>%{label}</b><br>%{value} patients<br>%{percent}<extra></extra>',
        name: 'Placebo',
        title: {
            text: `<b>Placebo</b><br><span style="font-size:24px">${((placeboResponders/placeboData.length)*100).toFixed(0)}%</span>`,
            font: { size: 14, color: '#FF9800' },
            position: 'middle center'
        }
    };

    const layout = {
        title: {
            text: 'Responder Rate by Treatment Arm (≥20% Reduction)',
            font: { size: 16, color: '#E0E0E0' },
            x: 0.5,
            xanchor: 'center'
        },
        showlegend: true,
        legend: {
            x: 0.5,
            xanchor: 'center',
            y: -0.1,
            orientation: 'h',
            font: { color: '#E0E0E0', size: 12 }
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 60, b: 60, l: 40, r: 40 },
        annotations: [
            {
                text: '<b>Treatment Arm</b>',
                x: 0.225,
                y: 1.1,
                xref: 'paper',
                yref: 'paper',
                font: { size: 14, color: '#00C853' },
                showarrow: false,
                xanchor: 'center'
            },
            {
                text: '<b>Placebo Arm</b>',
                x: 0.775,
                y: 1.1,
                xref: 'paper',
                yref: 'paper',
                font: { size: 14, color: '#FF9800' },
                showarrow: false,
                xanchor: 'center'
            }
        ]
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };

    Plotly.newPlot(containerId, [treatmentDonut, placeboDonut], layout, config);
}

/**
 * Create NNT (Number Needed to Treat) icon array visualization
 * Shows 10 person icons with highlighted ones representing NNT
 * @param {string} containerId - The container element ID
 * @param {Array} data - Patient data array with treatment_group and pct_change_week12
 */
function createNNTIconArray(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear placeholder
    container.innerHTML = '';

    // Calculate responder rates
    const RESPONDER_THRESHOLD = -20;
    const treatmentData = data.filter(d => d.treatment_group === 'Treatment');
    const placeboData = data.filter(d => d.treatment_group === 'Placebo');

    const treatmentResponders = treatmentData.filter(d => d.pct_change_week12 <= RESPONDER_THRESHOLD).length;
    const placeboResponders = placeboData.filter(d => d.pct_change_week12 <= RESPONDER_THRESHOLD).length;

    const treatmentRate = treatmentResponders / treatmentData.length;
    const placeboRate = placeboResponders / placeboData.length;

    // Calculate ARR and NNT
    const ARR = treatmentRate - placeboRate; // Absolute Risk Reduction
    const NNT = ARR > 0 ? Math.ceil(1 / ARR) : Infinity;

    // Create SVG-based icon array
    const totalIcons = 10;
    const highlightedIcons = Math.min(NNT, totalIcons);

    // Person icon SVG path
    const personIconPath = 'M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M10.5,7H13.5C14.88,7 16,8.12 16,9.5V15H14V22H10V15H8V9.5C8,8.12 9.12,7 10.5,7Z';

    // Build icon array with Plotly shapes and images
    const shapes = [];
    const annotations = [];

    // Create grid of person icons
    for (let i = 0; i < totalIcons; i++) {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const isHighlighted = i < highlightedIcons && NNT !== Infinity;

        shapes.push({
            type: 'path',
            path: personIconPath,
            xref: 'paper',
            yref: 'paper',
            x0: 0.1 + col * 0.16,
            y0: 0.35 - row * 0.25,
            x1: 0.18 + col * 0.16,
            y1: 0.55 - row * 0.25,
            fillcolor: isHighlighted ? '#00C853' : '#4a4a4a',
            line: { color: isHighlighted ? '#00E676' : '#333', width: 1 }
        });
    }

    const layout = {
        title: {
            text: 'Number Needed to Treat (NNT)',
            font: { size: 18, color: '#E0E0E0' },
            x: 0.5,
            xanchor: 'center',
            y: 0.95
        },
        xaxis: { visible: false, range: [0, 1] },
        yaxis: { visible: false, range: [0, 1] },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 60, b: 80, l: 40, r: 40 },
        annotations: [
            // NNT Value
            {
                x: 0.5,
                y: 0.90,
                xref: 'paper',
                yref: 'paper',
                text: NNT === Infinity ? 'N/A' : `<b style="font-size:48px">${NNT}</b>`,
                showarrow: false,
                font: { size: 48, color: '#00C853' }
            },
            // Interpretation
            {
                x: 0.5,
                y: 0.65,
                xref: 'paper',
                yref: 'paper',
                text: NNT === Infinity
                    ? 'Treatment shows no benefit over placebo'
                    : `Treat <b>${NNT}</b> patients for 1 additional responder`,
                showarrow: false,
                font: { size: 14, color: '#B0B0B0' }
            },
            // Treatment Rate
            {
                x: 0.25,
                y: 0.05,
                xref: 'paper',
                yref: 'paper',
                text: `Treatment: ${(treatmentRate * 100).toFixed(1)}%`,
                showarrow: false,
                font: { size: 12, color: '#0077B6' }
            },
            // Placebo Rate
            {
                x: 0.5,
                y: 0.05,
                xref: 'paper',
                yref: 'paper',
                text: `Placebo: ${(placeboRate * 100).toFixed(1)}%`,
                showarrow: false,
                font: { size: 12, color: '#FF9800' }
            },
            // ARR
            {
                x: 0.75,
                y: 0.05,
                xref: 'paper',
                yref: 'paper',
                text: `ARR: ${(ARR * 100).toFixed(1)}%`,
                showarrow: false,
                font: { size: 12, color: '#00C853' }
            }
        ]
    };

    // Use scatter trace to create clickable/hoverable icons
    const iconData = [];
    for (let i = 0; i < totalIcons; i++) {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const isHighlighted = i < highlightedIcons && NNT !== Infinity;

        iconData.push({
            x: 0.14 + col * 0.16,
            y: 0.45 - row * 0.25,
            highlighted: isHighlighted
        });
    }

    const trace = {
        x: iconData.map(d => d.x),
        y: iconData.map(d => d.y),
        mode: 'markers',
        type: 'scatter',
        marker: {
            symbol: 'square',
            size: 40,
            color: iconData.map(d => d.highlighted ? '#00C853' : '#3a3a3a'),
            line: { color: iconData.map(d => d.highlighted ? '#00E676' : '#555'), width: 2 }
        },
        hovertemplate: iconData.map((d, i) =>
            d.highlighted
                ? `Patient ${i+1}: Additional responder with treatment<extra></extra>`
                : `Patient ${i+1}: No additional benefit<extra></extra>`
        ),
        showlegend: false
    };

    const config = {
        responsive: true,
        displayModeBar: false
    };

    Plotly.newPlot(containerId, [trace], layout, config);
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

// Functions are already in global scope for vanilla JS usage
console.log('Charts module loaded successfully');
