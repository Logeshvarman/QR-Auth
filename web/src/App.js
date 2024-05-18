import React from 'react';
import QRGenerator from './components/QRGenerator';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>QR Code Authentication</h1>
      </header>
      <main>
        <ErrorBoundary>
          <QRGenerator />
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
