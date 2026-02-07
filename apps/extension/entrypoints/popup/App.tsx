import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

/**
 * @module Popup UI
 * @description Main popup component rendered when the user clicks
 * the Sentinellium icon in the browser toolbar. Displays engine
 * status cards with toggles and current page security posture.
 */

interface EngineConfig {
    id: string;
    name: string;
    description: string;
    iconClass: string;
    icon: string;
    stateKey: 'phishingEnabled' | 'provenanceEnabled' | 'dlpEnabled';
}

const ENGINES: EngineConfig[] = [
    {
        id: 'phishing',
        name: 'Context Engine',
        description: 'Semantic phishing detection',
        iconClass: 'engine-card__icon--phishing',
        icon: '🔍',
        stateKey: 'phishingEnabled',
    },
    {
        id: 'provenance',
        name: 'Provenance Engine',
        description: 'C2PA deepfake defense',
        iconClass: 'engine-card__icon--provenance',
        icon: '🛡',
        stateKey: 'provenanceEnabled',
    },
    {
        id: 'dlp',
        name: 'DLP Engine',
        description: 'Shadow AI data protection',
        iconClass: 'engine-card__icon--dlp',
        icon: '🔒',
        stateKey: 'dlpEnabled',
    },
];

interface EngineState {
    phishingEnabled: boolean;
    provenanceEnabled: boolean;
    dlpEnabled: boolean;
}

const DEFAULT_STATE: EngineState = {
    phishingEnabled: true,
    provenanceEnabled: true,
    dlpEnabled: true,
};

/**
 * Toggle switch component with accessible keyboard navigation.
 */
function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
}) {
    return (
        <label className="toggle" aria-label={label}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className="toggle__track" />
        </label>
    );
}

/**
 * Engine status card component.
 */
function EngineCard({
    engine,
    enabled,
    onToggle,
}: {
    engine: EngineConfig;
    enabled: boolean;
    onToggle: (value: boolean) => void;
}) {
    return (
        <div className="engine-card" id={`engine-${engine.id}`}>
            <div className="engine-card__info">
                <div className={`engine-card__icon ${engine.iconClass}`}>
                    {engine.icon}
                </div>
                <div className="engine-card__details">
                    <span className="engine-card__name">{engine.name}</span>
                    <span className="engine-card__description">
                        {engine.description}
                    </span>
                </div>
            </div>
            <Toggle
                checked={enabled}
                onChange={onToggle}
                label={`Toggle ${engine.name}`}
            />
        </div>
    );
}

/**
 * Main popup application.
 */
const App: React.FC = () => {
    const [engineState, setEngineState] = useState<EngineState>(DEFAULT_STATE);

    useEffect(() => {
        // Load engine state from storage on mount
        chrome.storage?.local
            ?.get('engineState')
            .then((result) => {
                if (result.engineState) {
                    try {
                        setEngineState(JSON.parse(result.engineState as string));
                    } catch {
                        // Use defaults if parse fails
                    }
                }
            })
            .catch(() => {
                // Storage may not be available in test environments
            });
    }, []);

    const handleToggle = useCallback(
        (stateKey: keyof EngineState, value: boolean) => {
            const newState = { ...engineState, [stateKey]: value };
            setEngineState(newState);

            // Persist to storage and notify service worker
            chrome.storage?.local
                ?.set({ engineState: JSON.stringify(newState) })
                .catch(() => { });

            chrome.runtime?.sendMessage?.({
                type: 'ENGINE_STATE_CHANGED',
                payload: newState,
            }).catch(() => { });
        },
        [engineState],
    );

    const activeCount = [
        engineState.phishingEnabled,
        engineState.provenanceEnabled,
        engineState.dlpEnabled,
    ].filter(Boolean).length;

    const statusText =
        activeCount === 3
            ? 'All engines active'
            : activeCount === 0
                ? 'All engines disabled'
                : `${activeCount}/3 engines active`;

    return (
        <div className="popup">
            <header className="popup-header">
                <div className="popup-header__brand">
                    <span className="popup-header__name">Sentinellium</span>
                </div>
                <span
                    className={`popup-header__status ${activeCount > 0 ? 'popup-header__status--active' : ''
                        }`}
                >
                    {statusText}
                </span>
            </header>

            <section className="engine-cards">
                {ENGINES.map((engine) => (
                    <EngineCard
                        key={engine.id}
                        engine={engine}
                        enabled={engineState[engine.stateKey]}
                        onToggle={(value) => handleToggle(engine.stateKey, value)}
                    />
                ))}
            </section>

            <footer className="popup-footer">
                <button
                    type="button"
                    className="popup-footer__link"
                    onClick={() => chrome.runtime?.openOptionsPage?.()}
                >
                    Settings
                </button>
                <span className="popup-footer__version">v0.1.0</span>
            </footer>
        </div>
    );
};

const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(<App />);
}

export default App;
