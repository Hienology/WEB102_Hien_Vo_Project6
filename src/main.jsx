import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { FlightDataProvider } from './context/FlightDataContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <FlightDataProvider>
        <App />
      </FlightDataProvider>
    </BrowserRouter>
  </StrictMode>,
);
