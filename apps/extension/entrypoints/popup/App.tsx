import React from 'react';
import ReactDOM from 'react-dom/client';

/**
 * @module Sentinellium Extension — Popup
 * @description The extension popup UI shown when the user clicks the
 * Sentinellium icon in the browser toolbar. Displays current threat status
 * and quick controls for the three security engines.
 */
const App: React.FC = () => {
    return (
        <div
            style={{
                width: 360,
                padding: 24,
                fontFamily: 'system-ui, sans-serif',
                backgroundColor: '#0a0a0a',
                color: '#e5e5e5',
            }}
        >
            <h1 style={{ fontSize: 18, margin: 0 }}>Sentinellium</h1>
            <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
                Client-Side AI Defense Grid
            </p>
        </div>
    );
};

const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(<App />);
}

export default App;
