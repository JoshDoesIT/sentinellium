import { useState, useEffect, useCallback, useRef } from "react";
import type { FC, ReactNode } from "react";

/**
 * @module Options Page
 * @description Full-page settings interface for Sentinellium.
 * Allows users to enable/disable engines, adjust sensitivity
 * levels, manage analytics opt-in, and reset to defaults.
 */

/* ── Types ── */

interface EngineState {
  phishingEnabled: boolean;
  provenanceEnabled: boolean;
  dlpEnabled: boolean;
}

interface SensitivitySettings {
  phishingSensitivity: number;
  provenanceSensitivity: number;
  dlpSensitivity: number;
}

interface OptionsState {
  engines: EngineState;
  sensitivity: SensitivitySettings;
  analyticsOptIn: boolean;
}

const DEFAULT_OPTIONS: OptionsState = {
  engines: {
    phishingEnabled: true,
    provenanceEnabled: true,
    dlpEnabled: true,
  },
  sensitivity: {
    phishingSensitivity: 70,
    provenanceSensitivity: 50,
    dlpSensitivity: 80,
  },
  analyticsOptIn: false,
};

/** Map a 0-100 slider value to a human-readable sensitivity label. */
function getSensitivityLabel(value: number): string {
  if (value <= 33) return "Low (fewer alerts, may miss threats)";
  if (value <= 66) return "Medium (balanced detection)";
  return "High (more alerts, fewer missed threats)";
}

/* ── Components ── */

/**
 * Toggle switch with accessible keyboard navigation.
 */
function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="toggle" htmlFor={id} aria-label={label}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__track" />
    </label>
  );
}

/**
 * Range slider control with value display.
 */
function Slider({
  id,
  value,
  onChange,
  label,
  min = 0,
  max = 100,
  step = 1,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="slider-control">
      <input
        id={id}
        type="range"
        className="slider-control__input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        aria-label={label}
      />
      <span className="slider-control__value">
        {getSensitivityLabel(value)}
      </span>
    </div>
  );
}

/**
 * A setting row with label, description, and a control (toggle or slider).
 */
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="setting-row">
      <div className="setting-row__info">
        <span className="setting-row__label">{label}</span>
        <span className="setting-row__description">{description}</span>
      </div>
      {children}
    </div>
  );
}

/* ── Main App ── */

const App: FC = () => {
  const [options, setOptions] = useState<OptionsState>(DEFAULT_OPTIONS);
  const [showToast, setShowToast] = useState(false);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved options from chrome.storage on mount
  useEffect(() => {
    chrome.storage?.local
      ?.get(["engineState", "sensitivitySettings", "analyticsOptIn"])
      .then((result) => {
        const loaded: OptionsState = { ...DEFAULT_OPTIONS };

        if (result.engineState) {
          try {
            loaded.engines = JSON.parse(result.engineState as string);
          } catch {
            // Use defaults if parse fails
          }
        }

        if (result.sensitivitySettings) {
          try {
            loaded.sensitivity = JSON.parse(
              result.sensitivitySettings as string,
            );
          } catch {
            // Use defaults if parse fails
          }
        }

        if (typeof result.analyticsOptIn === "boolean") {
          loaded.analyticsOptIn = result.analyticsOptIn;
        }

        setOptions(loaded);
      })
      .catch(() => {
        // Storage may not be available in test environments
      });
  }, []);

  /** Persist options to chrome.storage and show save toast. */
  const saveOptions = useCallback(
    (updated: OptionsState) => {
      setOptions(updated);

      chrome.storage?.local
        ?.set({
          engineState: JSON.stringify(updated.engines),
          sensitivitySettings: JSON.stringify(updated.sensitivity),
          analyticsOptIn: updated.analyticsOptIn,
        })
        .catch(() => {});

      // Notify service worker of changes
      chrome.runtime
        ?.sendMessage?.({
          type: "ENGINE_STATE_CHANGED",
          payload: updated.engines,
        })
        .catch(() => {});

      // Show save confirmation
      setShowToast(true);
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setShowToast(false), 2000);
    },
    [setOptions],
  );

  const handleEngineToggle = useCallback(
    (key: keyof EngineState, value: boolean) => {
      saveOptions({
        ...options,
        engines: { ...options.engines, [key]: value },
      });
    },
    [options, saveOptions],
  );

  const handleSensitivity = useCallback(
    (key: keyof SensitivitySettings, value: number) => {
      saveOptions({
        ...options,
        sensitivity: { ...options.sensitivity, [key]: value },
      });
    },
    [options, saveOptions],
  );

  const handleAnalyticsToggle = useCallback(
    (value: boolean) => {
      saveOptions({ ...options, analyticsOptIn: value });
    },
    [options, saveOptions],
  );

  const handleReset = useCallback(() => {
    saveOptions(DEFAULT_OPTIONS);
  }, [saveOptions]);

  return (
    <div className="options">
      {/* Header */}
      <header className="options-header">
        <h1 className="options-header__brand">Sentinellium</h1>
        <p className="options-header__subtitle">Settings</p>
      </header>

      {/* Engine Toggles */}
      <section className="settings-section" id="section-engines">
        <h2 className="settings-section__title">Security Engines</h2>

        <SettingRow
          label="Context Engine"
          description="AI-powered semantic phishing detection. Analyzes page content, URLs, and visual cues to identify phishing attempts."
        >
          <Toggle
            id="toggle-phishing"
            checked={options.engines.phishingEnabled}
            onChange={(v) => handleEngineToggle("phishingEnabled", v)}
            label="Toggle Context Engine"
          />
        </SettingRow>

        <SettingRow
          label="Provenance Engine"
          description="C2PA media provenance verification. Validates cryptographic signatures on images and videos to detect deepfakes."
        >
          <Toggle
            id="toggle-provenance"
            checked={options.engines.provenanceEnabled}
            onChange={(v) => handleEngineToggle("provenanceEnabled", v)}
            label="Toggle Provenance Engine"
          />
        </SettingRow>

        <SettingRow
          label="DLP Engine"
          description="Shadow AI data leakage prevention. Monitors input fields on LLM platforms to prevent accidental exposure of sensitive data."
        >
          <Toggle
            id="toggle-dlp"
            checked={options.engines.dlpEnabled}
            onChange={(v) => handleEngineToggle("dlpEnabled", v)}
            label="Toggle DLP Engine"
          />
        </SettingRow>
      </section>

      {/* Sensitivity Levels */}
      <section className="settings-section" id="section-sensitivity">
        <h2 className="settings-section__title">Detection Sensitivity</h2>

        <SettingRow
          label="Phishing Sensitivity"
          description="Higher sensitivity catches more threats but may produce more false positives."
        >
          <Slider
            id="slider-phishing"
            value={options.sensitivity.phishingSensitivity}
            onChange={(v) => handleSensitivity("phishingSensitivity", v)}
            label="Phishing detection sensitivity"
          />
        </SettingRow>

        <SettingRow
          label="Provenance Sensitivity"
          description="Controls how strictly media provenance is verified. Higher values flag more unverified content."
        >
          <Slider
            id="slider-provenance"
            value={options.sensitivity.provenanceSensitivity}
            onChange={(v) => handleSensitivity("provenanceSensitivity", v)}
            label="Provenance detection sensitivity"
          />
        </SettingRow>

        <SettingRow
          label="DLP Sensitivity"
          description="Controls PII detection strictness. Higher values catch more potential data leaks."
        >
          <Slider
            id="slider-dlp"
            value={options.sensitivity.dlpSensitivity}
            onChange={(v) => handleSensitivity("dlpSensitivity", v)}
            label="DLP detection sensitivity"
          />
        </SettingRow>
      </section>

      {/* Privacy */}
      <section className="settings-section" id="section-privacy">
        <h2 className="settings-section__title">Privacy</h2>

        <SettingRow
          label="Anonymous Analytics"
          description="Share anonymized usage data to help improve Sentinellium. No personal information, browsing history, or page content is ever transmitted."
        >
          <Toggle
            id="toggle-analytics"
            checked={options.analyticsOptIn}
            onChange={handleAnalyticsToggle}
            label="Toggle anonymous analytics"
          />
        </SettingRow>
      </section>

      {/* Footer */}
      <footer className="options-footer">
        <span className="options-footer__version">v0.1.0</span>
        <button
          type="button"
          className="options-footer__reset"
          onClick={handleReset}
          id="btn-reset"
        >
          Reset to Defaults
        </button>
      </footer>

      {/* Save Toast */}
      <div
        className={`save-toast ${showToast ? "" : "save-toast--hidden"}`}
        role="status"
        aria-live="polite"
      >
        Settings saved
      </div>
    </div>
  );
};

export default App;
