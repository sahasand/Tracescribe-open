// Statistics Utility Module
// Helper functions for statistical calculations

/**
 * Calculate arithmetic mean
 * @param {Array<number>} arr - Array of numbers
 * @returns {number} - Mean value
 */
function mean(arr) {
  const filtered = arr.filter(val => val !== null && val !== undefined && !isNaN(val));
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, val) => sum + val, 0) / filtered.length;
}

/**
 * Calculate sample standard deviation (n-1)
 * @param {Array<number>} arr - Array of numbers
 * @returns {number} - Standard deviation
 */
function standardDeviation(arr) {
  const filtered = arr.filter(val => val !== null && val !== undefined && !isNaN(val));
  if (filtered.length <= 1) return 0;

  const avg = mean(filtered);
  const squaredDiffs = filtered.map(val => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (filtered.length - 1);

  return Math.sqrt(variance);
}

/**
 * Calculate median
 * @param {Array<number>} arr - Array of numbers
 * @returns {number} - Median value
 */
function median(arr) {
  const filtered = arr.filter(val => val !== null && val !== undefined && !isNaN(val));
  if (filtered.length === 0) return 0;

  const sorted = filtered.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Calculate 95% confidence interval for mean
 * @param {Array<number>} arr - Array of numbers
 * @returns {Object} - {mean, lower, upper, se}
 */
function confidenceInterval95(arr) {
  const filtered = arr.filter(val => val !== null && val !== undefined && !isNaN(val));

  if (filtered.length === 0) {
    return { mean: 0, lower: 0, upper: 0, se: 0 };
  }

  const avg = mean(filtered);
  const sd = standardDeviation(filtered);
  const se = sd / Math.sqrt(filtered.length);

  // 95% CI using 1.96 for normal approximation
  const margin = 1.96 * se;

  return {
    mean: parseFloat(avg.toFixed(2)),
    lower: parseFloat((avg - margin).toFixed(2)),
    upper: parseFloat((avg + margin).toFixed(2)),
    se: parseFloat(se.toFixed(2))
  };
}

// ============================================================================
// PROBABILITY DISTRIBUTION HELPERS (for honest inferential statistics)
// These give real p-values and critical values rather than fixed-threshold
// approximations. Implementations follow Numerical Recipes (betacf, gammp).
// ============================================================================

/** Error function (Abramowitz & Stegun 7.1.26, |error| < 1.5e-7) */
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return sign * y;
}

/** Standard normal CDF */
function normalCDF(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/** Log gamma (Lanczos approximation) */
function logGamma(x) {
  const cof = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) { y += 1; ser += cof[j] / y; }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

/** Continued fraction for the incomplete beta function (Numerical Recipes betacf) */
function betacf(a, b, x) {
  const FPMIN = 1e-30;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}

/** Regularized incomplete beta function I_x(a, b) */
function incompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) +
    a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2)
    ? bt * betacf(a, b, x) / a
    : 1 - bt * betacf(b, a, 1 - x) / b;
}

/** Regularized lower incomplete gamma P(a, x) (Numerical Recipes gammp) */
function gammaP(a, x) {
  if (x <= 0 || a <= 0) return 0;
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum;
    for (let n = 1; n <= 300; n++) {
      ap += 1; del *= x / ap; sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-12) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  }
  const FPMIN = 1e-30;
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
  for (let i = 1; i <= 300; i++) {
    const an = -i * (i - a);
    b += 2; d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-12) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

/** Two-sided p-value for Student's t with df degrees of freedom */
function studentTTwoSidedP(t, df) {
  if (!isFinite(t) || df <= 0) return 1;
  return incompleteBeta(df / (df + t * t), df / 2, 0.5);
}

/** Student's t CDF */
function studentTCDF(t, df) {
  const ib = incompleteBeta(df / (df + t * t), df / 2, 0.5) / 2;
  return t >= 0 ? 1 - ib : ib;
}

/** Two-sided t critical value for confidence level (e.g. 0.95) via bisection */
function tCritical(confidence, df) {
  if (df <= 0) return 1.96;
  const target = 1 - (1 - confidence) / 2;
  let lo = 0, hi = 1000;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (studentTCDF(mid, df) < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Upper-tail p-value for a chi-square statistic with df degrees of freedom */
function chiSquarePvalue(x, df) {
  if (x <= 0 || df <= 0) return 1;
  return 1 - gammaP(df / 2, x / 2);
}

/** Welch–Satterthwaite degrees of freedom for two samples */
function welchDF(sd1, n1, sd2, n2) {
  const a = sd1 * sd1 / n1;
  const b = sd2 * sd2 / n2;
  const denom = (a * a) / (n1 - 1) + (b * b) / (n2 - 1);
  return denom === 0 ? n1 + n2 - 2 : (a + b) * (a + b) / denom;
}

/** Format a numeric p-value for display (e.g. "p < 0.001", "p = 0.024") */
function formatPValue(p) {
  if (p === null || p === undefined || isNaN(p)) return 'p = NA';
  if (p < 0.001) return 'p < 0.001';
  if (p < 0.01) return `p = ${p.toFixed(3)}`;
  return `p = ${p.toFixed(2)}`;
}

/**
 * Perform two-sample Welch's t-test with an exact (Student-t) two-sided p-value.
 * @param {Array<number>} arr1 - First group
 * @param {Array<number>} arr2 - Second group
 * @returns {Object} - {tStatistic, pValue (numeric), pValueLabel, significant, meanDiff, df}
 */
function tTest(arr1, arr2) {
  const filtered1 = arr1.filter(val => val !== null && val !== undefined && !isNaN(val));
  const filtered2 = arr2.filter(val => val !== null && val !== undefined && !isNaN(val));

  // Need at least 2 observations per group for a variance / t-test
  if (filtered1.length < 2 || filtered2.length < 2) {
    return { tStatistic: 0, pValue: 1, pValueLabel: 'p = NA', significant: false, meanDiff: 0, df: 0 };
  }

  const mean1 = mean(filtered1);
  const mean2 = mean(filtered2);
  const sd1 = standardDeviation(filtered1);
  const sd2 = standardDeviation(filtered2);
  const n1 = filtered1.length;
  const n2 = filtered2.length;

  const meanDiff = mean1 - mean2;

  // Welch's (unequal-variance) standard error of the difference
  const se = Math.sqrt((sd1 * sd1) / n1 + (sd2 * sd2) / n2);
  const tStatistic = se === 0 ? 0 : meanDiff / se;

  // Welch–Satterthwaite degrees of freedom
  const df = welchDF(sd1, n1, sd2, n2);

  // Exact two-sided p-value from the t-distribution (uses df, unlike the old z-buckets)
  const pValue = se === 0 ? 1 : studentTTwoSidedP(tStatistic, df);

  return {
    tStatistic: parseFloat(tStatistic.toFixed(3)),
    pValue: parseFloat(pValue.toFixed(4)),
    pValueLabel: formatPValue(pValue),
    significant: pValue < 0.05,
    meanDiff: parseFloat(meanDiff.toFixed(2)),
    df: parseFloat(df.toFixed(1))
  };
}

/**
 * Calculate mean difference with 95% confidence interval
 * @param {Array<number>} arr1 - First group (e.g., Treatment)
 * @param {Array<number>} arr2 - Second group (e.g., Placebo)
 * @returns {Object} - {meanDiff, lower, upper, se}
 */
function calculateDifferenceCI(arr1, arr2) {
  const filtered1 = arr1.filter(val => val !== null && val !== undefined && !isNaN(val));
  const filtered2 = arr2.filter(val => val !== null && val !== undefined && !isNaN(val));

  if (filtered1.length === 0 || filtered2.length === 0) {
    return { meanDiff: 0, lower: 0, upper: 0, se: 0 };
  }

  const mean1 = mean(filtered1);
  const mean2 = mean(filtered2);
  const sd1 = standardDeviation(filtered1);
  const sd2 = standardDeviation(filtered2);
  const n1 = filtered1.length;
  const n2 = filtered2.length;

  const meanDiff = mean1 - mean2;

  // Standard error of the difference (Welch)
  const se1 = sd1 / Math.sqrt(n1);
  const se2 = sd2 / Math.sqrt(n2);
  const pooledSE = Math.sqrt(se1 * se1 + se2 * se2);

  // 95% CI for difference using the t distribution (correct for small samples;
  // falls back toward 1.96 as df grows)
  const df = (n1 >= 2 && n2 >= 2) ? welchDF(sd1, n1, sd2, n2) : (n1 + n2 - 2);
  const tCrit = df > 0 ? tCritical(0.95, df) : 1.96;
  const margin = tCrit * pooledSE;

  return {
    meanDiff: parseFloat(meanDiff.toFixed(2)),
    lower: parseFloat((meanDiff - margin).toFixed(2)),
    upper: parseFloat((meanDiff + margin).toFixed(2)),
    se: parseFloat(pooledSE.toFixed(2))
  };
}

/**
 * Group array of objects by a key
 * @param {Array<Object>} arr - Array of objects
 * @param {string} key - Key to group by
 * @returns {Object} - Object with groups as keys
 */
function groupBy(arr, key) {
  return arr.reduce((groups, item) => {
    const groupKey = item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
}

/**
 * Summarize data by group
 * @param {Array<Object>} data - Array of data objects
 * @param {string} groupKey - Key to group by
 * @param {string} valueKey - Key of values to summarize
 * @returns {Object} - Summary statistics by group
 */
function summarizeByGroup(data, groupKey, valueKey) {
  const grouped = groupBy(data, groupKey);
  const summary = {};

  for (const [group, items] of Object.entries(grouped)) {
    const values = items
      .map(item => item[valueKey])
      .filter(val => val !== null && val !== undefined && !isNaN(val));

    const ci = confidenceInterval95(values);
    const sd = standardDeviation(values);
    const med = median(values);

    summary[group] = {
      n: items.length,
      mean: ci.mean,
      median: parseFloat(med.toFixed(2)),
      sd: parseFloat(sd.toFixed(2)),
      se: ci.se,
      ci_lower: ci.lower,
      ci_upper: ci.upper,
      min: values.length > 0 ? parseFloat(Math.min(...values).toFixed(2)) : 0,
      max: values.length > 0 ? parseFloat(Math.max(...values).toFixed(2)) : 0
    };
  }

  return summary;
}
