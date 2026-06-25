# ============================================================================
# BRX-7 Phase 1 SAD - Pharmacokinetic (NCA) analysis in R
# ----------------------------------------------------------------------------
# Reproduces the TraceScribe "PK Analysis" demo using the canonical open-source
# PK stack: PKNCA (non-compartmental analysis), dplyr/tidyr (wrangling),
# ggplot2 (figures). Reads the same concentration dataset the demo simulates
# (pk-analysis-data.csv), so the numbers match the browser demo.
#
#   install.packages(c("PKNCA", "dplyr", "tidyr", "ggplot2"))
#   Rscript pk-analysis.R
# ============================================================================

suppressMessages({
  library(PKNCA)
  library(dplyr)
  library(tidyr)
  library(ggplot2)
})

# ---- helpers: geometric mean and geometric CV% --------------------------------
geomean <- function(x) exp(mean(log(x)))
geocv   <- function(x) 100 * sqrt(exp(stats::var(log(x))) - 1)   # %

# ---- 1. Read the concentration data -------------------------------------------
# Long format: one row per sample (subject x nominal time). CONC is "NA" for
# values below the limit of quantification (BLQ) after the first quantifiable
# sample; the pre-dose sample is 0.
conc <- read.csv("pk-analysis-data.csv", stringsAsFactors = FALSE)
conc$CONC <- suppressWarnings(as.numeric(conc$CONC))   # "NA" -> NA

# BLQ rule: pre-dose (= 0) is kept; embedded/terminal BLQ is treated as missing
# and dropped before NCA (it must not contribute trapezoids or the lambda-z fit).
conc_nca <- conc %>% filter(!is.na(CONC))

# One dose record per subject, given at time 0.
dose <- conc %>% distinct(USUBJID, DOSE) %>% mutate(NTIME = 0)

# ---- 2. Build the PKNCA objects -----------------------------------------------
o_conc <- PKNCAconc(conc_nca, CONC ~ NTIME | USUBJID)
o_dose <- PKNCAdose(dose,     DOSE ~ NTIME | USUBJID)

# Request the standard NCA parameters over 0 -> Inf.
# cl.obs / vz.obs are CL/F and Vz/F for extravascular (oral) dosing; PKNCA
# implies the "/F" from the route.
intervals <- data.frame(
  start = 0, end = Inf,
  cmax = TRUE, tmax = TRUE, auclast = TRUE, aucinf.obs = TRUE,
  aucpext.obs = TRUE, half.life = TRUE, cl.obs = TRUE, vz.obs = TRUE
)

o_data <- PKNCAdata(o_conc, o_dose, intervals = intervals)

# ---- 3. Run the non-compartmental analysis ------------------------------------
# PKNCA uses linear-up / log-down trapezoidal AUC and a best-fit terminal
# lambda-z (maximizing adjusted R-squared over the terminal points), the same
# algorithm the browser demo re-implements.
res <- suppressMessages(pk.nca(o_data))

res_df <- as.data.frame(res) %>%
  left_join(distinct(dose, USUBJID, DOSE), by = "USUBJID")

# Dose is in mg and concentration in ng/mL, so cl.obs / vz.obs come out in
# mg/(ng/mL)/h; multiply by 1000 to express CL/F in L/h and Vz/F in L.
res_df <- res_df %>%
  mutate(PPORRES = ifelse(PPTESTCD %in% c("cl.obs", "vz.obs"), PPORRES * 1000, PPORRES))

# ---- 4. PK parameter summary by dose (geometric mean (geo CV%)) ---------------
exposure <- c("cmax", "auclast", "aucinf.obs", "half.life", "cl.obs", "vz.obs")

param_summary <- res_df %>%
  filter(PPTESTCD %in% exposure) %>%
  group_by(DOSE, PPTESTCD) %>%
  summarise(n = n(),
            geo_mean = geomean(PPORRES),
            geo_cv_pct = geocv(PPORRES),
            .groups = "drop") %>%
  arrange(match(PPTESTCD, exposure), DOSE)

# Tmax is a discrete time -> summarize as median (range), never geometric mean.
tmax_summary <- res_df %>%
  filter(PPTESTCD == "tmax") %>%
  group_by(DOSE) %>%
  summarise(median = median(PPORRES), min = min(PPORRES), max = max(PPORRES),
            .groups = "drop")

cat("\n== PK parameter summary (geometric mean (geo CV%)) ==\n")
print(as.data.frame(param_summary), digits = 4, row.names = FALSE)
cat("\n== Tmax median (range), h ==\n")
print(as.data.frame(tmax_summary), digits = 3, row.names = FALSE)

# ---- 5. Dose proportionality: the power model ---------------------------------
# ln(parameter) = a + b * ln(dose).  Slope b ~ 1 => dose-proportional.
dp <- function(param) {
  d <- filter(res_df, PPTESTCD == param)
  m <- lm(log(PPORRES) ~ log(DOSE), data = d)
  ci <- confint(m)["log(DOSE)", ]
  data.frame(parameter = param, slope = unname(coef(m)[2]),
             ci_low = ci[1], ci_high = ci[2],
             proportional = ci[1] <= 1 && ci[2] >= 1)
}
dose_prop <- bind_rows(dp("cmax"), dp("aucinf.obs"))
cat("\n== Dose proportionality (power model: ln(param) ~ ln(dose)) ==\n")
print(dose_prop, digits = 3, row.names = FALSE)

# ---- 6. Figures (ggplot2) -----------------------------------------------------
pal <- c("50" = "#0D9488", "150" = "#3aa0e8", "450" = "#F97316")
base_theme <- theme_bw(base_size = 13) +
  theme(legend.position = "top", panel.grid.minor = element_blank())

mean_ct <- conc_nca %>% filter(NTIME > 0) %>%
  group_by(DOSE, NTIME) %>% summarise(gm = geomean(CONC), .groups = "drop") %>%
  mutate(DOSE = factor(DOSE))

# 6a. Mean concentration-time, semi-log (terminal slope = lambda-z)
g_meanlog <- ggplot(mean_ct, aes(NTIME, gm, colour = DOSE)) +
  geom_line(linewidth = 0.9) + geom_point(size = 2) +
  scale_y_log10() + scale_colour_manual(values = pal) +
  labs(title = "Mean plasma concentration-time (semi-log)",
       x = "Time (h)", y = "Concentration (ng/mL), log", colour = "Dose (mg)") +
  base_theme

# 6b. Individual ("spaghetti") profiles
g_spag <- ggplot(filter(conc_nca, NTIME > 0),
                 aes(NTIME, CONC, group = USUBJID, colour = factor(DOSE))) +
  geom_line(alpha = 0.5) + scale_y_log10() + scale_colour_manual(values = pal) +
  labs(title = "Individual concentration-time profiles",
       x = "Time (h)", y = "Concentration (ng/mL), log", colour = "Dose (mg)") +
  base_theme

# 6c. Dose proportionality, AUC0-inf vs dose (log-log) with power-model fit
auc_inf <- filter(res_df, PPTESTCD == "aucinf.obs")
g_dp <- ggplot(auc_inf, aes(DOSE, PPORRES)) +
  geom_smooth(method = "lm", formula = y ~ x, se = TRUE, colour = "#F97316") +
  geom_point(size = 2.4, colour = "#0D9488") +
  scale_x_log10(breaks = c(50, 150, 450)) + scale_y_log10() +
  labs(title = "Dose proportionality (AUC0-inf vs dose, log-log)",
       x = "Dose (mg), log", y = "AUC0-inf (h*ng/mL), log") +
  base_theme

ggsave("pk-r-meanlog.png",  g_meanlog, width = 6.6, height = 4.4, dpi = 150)
ggsave("pk-r-spaghetti.png", g_spag,   width = 6.6, height = 4.4, dpi = 150)
ggsave("pk-r-doseprop.png",  g_dp,     width = 6.6, height = 4.4, dpi = 150)

cat("\nFigures written: pk-r-meanlog.png, pk-r-spaghetti.png, pk-r-doseprop.png\n")
