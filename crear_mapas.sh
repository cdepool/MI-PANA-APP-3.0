#!/bin/bash
echo "🚀 MI-PANA-APP-3.0 - CREANDO ARCHIVOS DE MAPAS"
echo "=============================================="

# Crear directorios
mkdir -p src/components src/services

# Crear MapView.tsx
cat > src/components/MapView.tsx << 'MAPVIEW'
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = () => {
  const center = [9.5596, -69.2044]; // Acarigua-Araure
  
  return (
    <div style={{ height: '400px', width: '100%' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center}>
          <Popup>Acarigua-Araure, Venezuela</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapView;
MAPVIEW

# Crear geocoding.ts
cat > src/services/geocoding.ts << 'GEOCODING'
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
GEOCODING

# Crear .env.local
cat > .env.local << 'ENV'
VITE_SUPABASE_URL=https://mdaksestqxfdxpirudsc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWtzZXN0cXhmZHhwaXJ1ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTc2NDUsImV4cCI6MjA3NzUzMzY0NX0.Gwus82RDQyHKW3QW6p6pW-o96PqBOJGrFfEO6Zjk7L4
VITE_MAP_PROVIDER=openstreetmap
VITE_BRAND_DARK_BLUE=#022859
VITE_BRAND_MEDIUM_BLUE=#038a9e
VITE_BRAND_ORANGE=#FF6B35
ENV

echo "✅ Archivos creados exitosamente"
echo "✅ MapView.tsx - Mapa OpenStreetMap"
echo "✅ geocoding.ts - Servicio venezolano"
echo "✅ .env.local - Variables actualizadas"
echo ""
echo "🚀 PRÓXIMO PASO:"
echo "git add ."
echo "git commit -m 'feat: OpenStreetMap maps implemented'"
echo "git push origin main"
