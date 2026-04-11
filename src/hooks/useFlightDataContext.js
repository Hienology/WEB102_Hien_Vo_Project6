import { useContext } from 'react';
import FlightDataContext from '../context/flightDataContextInstance';

export default function useFlightDataContext() {
  const context = useContext(FlightDataContext);
  if (!context) {
    throw new Error('useFlightDataContext must be used within FlightDataProvider');
  }
  return context;
}
