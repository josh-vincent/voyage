export type Airport = {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
};

export const AIRPORTS: Airport[] = [
  { iata: 'JFK', name: 'John F. Kennedy Intl', city: 'New York', country: 'US', lat: 40.6413, lng: -73.7781 },
  { iata: 'LGA', name: 'LaGuardia', city: 'New York', country: 'US', lat: 40.7769, lng: -73.8740 },
  { iata: 'EWR', name: 'Newark Liberty Intl', city: 'Newark', country: 'US', lat: 40.6895, lng: -74.1745 },
  { iata: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US', lat: 33.9416, lng: -118.4085 },
  { iata: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'US', lat: 37.6213, lng: -122.3790 },
  { iata: 'ORD', name: "O'Hare Intl", city: 'Chicago', country: 'US', lat: 41.9742, lng: -87.9073 },
  { iata: 'ATL', name: 'Hartsfield–Jackson', city: 'Atlanta', country: 'US', lat: 33.6407, lng: -84.4277 },
  { iata: 'DFW', name: 'Dallas/Fort Worth Intl', city: 'Dallas', country: 'US', lat: 32.8998, lng: -97.0403 },
  { iata: 'SEA', name: 'Seattle–Tacoma Intl', city: 'Seattle', country: 'US', lat: 47.4502, lng: -122.3088 },
  { iata: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'US', lat: 25.7959, lng: -80.2870 },
  { iata: 'BOS', name: 'Logan Intl', city: 'Boston', country: 'US', lat: 42.3656, lng: -71.0096 },
  { iata: 'DEN', name: 'Denver Intl', city: 'Denver', country: 'US', lat: 39.8561, lng: -104.6737 },
  { iata: 'LAS', name: 'Harry Reid Intl', city: 'Las Vegas', country: 'US', lat: 36.0840, lng: -115.1537 },
  { iata: 'IAD', name: 'Dulles Intl', city: 'Washington', country: 'US', lat: 38.9531, lng: -77.4565 },
  { iata: 'PHX', name: 'Sky Harbor Intl', city: 'Phoenix', country: 'US', lat: 33.4342, lng: -112.0116 },
  { iata: 'LHR', name: 'Heathrow', city: 'London', country: 'GB', lat: 51.4700, lng: -0.4543 },
  { iata: 'LGW', name: 'Gatwick', city: 'London', country: 'GB', lat: 51.1537, lng: -0.1821 },
  { iata: 'STN', name: 'Stansted', city: 'London', country: 'GB', lat: 51.8860, lng: 0.2389 },
  { iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR', lat: 49.0097, lng: 2.5479 },
  { iata: 'ORY', name: 'Orly', city: 'Paris', country: 'FR', lat: 48.7262, lng: 2.3655 },
  { iata: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'NL', lat: 52.3105, lng: 4.7683 },
  { iata: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'DE', lat: 50.0379, lng: 8.5622 },
  { iata: 'MUC', name: 'Munich', city: 'Munich', country: 'DE', lat: 48.3538, lng: 11.7861 },
  { iata: 'MAD', name: 'Madrid-Barajas', city: 'Madrid', country: 'ES', lat: 40.4983, lng: -3.5676 },
  { iata: 'BCN', name: 'Barcelona–El Prat', city: 'Barcelona', country: 'ES', lat: 41.2974, lng: 2.0833 },
  { iata: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'IT', lat: 41.8003, lng: 12.2389 },
  { iata: 'DUB', name: 'Dublin', city: 'Dublin', country: 'IE', lat: 53.4264, lng: -6.2499 },
  { iata: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'TR', lat: 41.2753, lng: 28.7519 },
  { iata: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'AE', lat: 25.2532, lng: 55.3657 },
  { iata: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'QA', lat: 25.2731, lng: 51.6080 },
  { iata: 'SIN', name: 'Changi', city: 'Singapore', country: 'SG', lat: 1.3644, lng: 103.9915 },
  { iata: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'HK', lat: 22.3080, lng: 113.9185 },
  { iata: 'NRT', name: 'Narita Intl', city: 'Tokyo', country: 'JP', lat: 35.7720, lng: 140.3929 },
  { iata: 'HND', name: 'Haneda', city: 'Tokyo', country: 'JP', lat: 35.5494, lng: 139.7798 },
  { iata: 'ICN', name: 'Incheon Intl', city: 'Seoul', country: 'KR', lat: 37.4602, lng: 126.4407 },
  { iata: 'PEK', name: 'Beijing Capital', city: 'Beijing', country: 'CN', lat: 40.0799, lng: 116.6031 },
  { iata: 'PVG', name: 'Pudong', city: 'Shanghai', country: 'CN', lat: 31.1443, lng: 121.8083 },
  { iata: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'TH', lat: 13.6900, lng: 100.7501 },
  { iata: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'AU', lat: -33.9399, lng: 151.1753 },
  { iata: 'MEL', name: 'Melbourne', city: 'Melbourne', country: 'AU', lat: -37.6733, lng: 144.8433 },
  { iata: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'CA', lat: 43.6777, lng: -79.6248 },
  { iata: 'YVR', name: 'Vancouver Intl', city: 'Vancouver', country: 'CA', lat: 49.1967, lng: -123.1815 },
  { iata: 'MEX', name: 'Benito Juárez', city: 'Mexico City', country: 'MX', lat: 19.4361, lng: -99.0719 },
  { iata: 'GRU', name: 'Guarulhos', city: 'São Paulo', country: 'BR', lat: -23.4356, lng: -46.4731 },
  { iata: 'EZE', name: 'Ministro Pistarini', city: 'Buenos Aires', country: 'AR', lat: -34.8222, lng: -58.5358 },
  { iata: 'JNB', name: 'OR Tambo', city: 'Johannesburg', country: 'ZA', lat: -26.1392, lng: 28.2460 },
  { iata: 'CAI', name: 'Cairo Intl', city: 'Cairo', country: 'EG', lat: 30.1127, lng: 31.4000 },
  { iata: 'DEL', name: 'Indira Gandhi Intl', city: 'Delhi', country: 'IN', lat: 28.5562, lng: 77.1000 },
  { iata: 'BOM', name: 'Chhatrapati Shivaji', city: 'Mumbai', country: 'IN', lat: 19.0896, lng: 72.8656 },
  { iata: 'ZRH', name: 'Zürich', city: 'Zurich', country: 'CH', lat: 47.4647, lng: 8.5492 },
  { iata: 'CPH', name: 'Kastrup', city: 'Copenhagen', country: 'DK', lat: 55.6180, lng: 12.6508 },
];

export function findAirport(iata: string): Airport | undefined {
  const q = iata.toUpperCase().trim();
  return AIRPORTS.find((a) => a.iata === q);
}

export function searchAirports(query: string): Airport[] {
  if (!query) return AIRPORTS.slice(0, 10);
  const q = query.toLowerCase().trim();
  return AIRPORTS.filter(
    (a) =>
      a.iata.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q),
  ).slice(0, 20);
}
