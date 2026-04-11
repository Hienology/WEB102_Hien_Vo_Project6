import FlightDataContext from './flightDataContextInstance';
import useFlightData from '../hooks/useFlightData';

export function FlightDataProvider({ children }) {
  const data = useFlightData();
  return <FlightDataContext.Provider value={data}>{children}</FlightDataContext.Provider>;
}
