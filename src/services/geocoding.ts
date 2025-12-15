export interface AddressData {
  address: string;
  coords: { lat: number; lng: number };
}

const VENEZUELA_ADDRESSES: AddressData[] = [
  { address: "Centro Comercial Buenaventura, Acarigua", coords: { lat: 9.5577, lng: -69.2011 } },
  { address: "Plaza Bolívar, Acarigua", coords: { lat: 9.5589, lng: -69.2038 } },
  { address: "Hospital Dr. José Antonio Vargas, Araure", coords: { lat: 9.5615, lng: -69.2087 } },
  { address: "Universidad Centroccidental Lisandro Alvarado (UCLA)", coords: { lat: 9.5556, lng: -69.2001 } }
];

export function searchAddresses(query: string): string[] {
  if (!query || query.length < 2) return [];
  const normalizedQuery = query.toLowerCase();
  return VENEZUELA_ADDRESSES
    .filter(addr => addr.address.toLowerCase().includes(normalizedQuery))
    .map(addr => addr.address)
    .slice(0, 10);
}
