-- Migration: Add Places (POIs) table for Acarigua-Araure
-- Created: 2025-12-06

-- Create places table
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL, -- mall, empresa, club_social, estadio, cancha, parque, balneario, area_protegida
  category VARCHAR(50) NOT NULL, -- comercial, deportivo, recreativo, social, industrial
  zone_id VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  is_hotspot BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_places_type ON places(type);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_zone ON places(zone_id);
CREATE INDEX IF NOT EXISTS idx_places_hotspot ON places(is_hotspot);
CREATE INDEX IF NOT EXISTS idx_places_location ON places(latitude, longitude);

-- Insert POIs for Acarigua-Araure
INSERT INTO places (place_id, name, type, category, zone_id, latitude, longitude, address, is_hotspot, notes) VALUES
-- Centros Comerciales
('POI-LLANO-MALL', 'Centro Comercial Llano Mall', 'mall', 'comercial', 'VIA-ACG-ARU', 9.57264, -69.19817, 'Municipio Araure, frente al terminal', true, 'Ancla comercial principal, punto de referencia masivo'),
('POI-MAKRO', 'Makro Acarigua', 'empresa', 'comercial', 'ACG-CENTRO', NULL, NULL, 'Av. Vencedores de Araure, Tienda Makro', false, 'Hipermercado mayorista'),

-- Empresas Industriales
('POI-FERRECENCA', 'Ferrecenca Villa Pastora', 'empresa', 'industrial', 'ACG-NORTE', NULL, NULL, 'Av. José Antonio Páez, entre Av. 21 y 25, Urb. Villa Pastora', false, 'Ferretería industrial'),
('POI-INMEPORCA', 'Industrias Metalúrgicas Portuguesa C.A.', 'empresa', 'industrial', 'ACG-INDUSTRIAL', NULL, NULL, 'Calle 33 entre Av. 28 y 29, Barrio Andrés Bello', false, 'Metalúrgica, estructuras metálicas, tolvas, tanques'),

-- Clubes Sociales y Deportivos
('POI-CSCV', 'Centro Social Canario Venezolano de Acarigua', 'club_social', 'social', 'ARU-CENTRO', 9.60983, -69.23378, 'Av. Vencedores de Araure, Sector Los Malabares', true, 'Club más activo: kickingball, eventos, fiestas, torneos'),
('POI-CLUB-ITALO', 'Club Social Ítalo Venezolano', 'club_social', 'social', 'ARU-CENTRO', 9.54778, -69.22083, 'Araure', false, 'Club histórico con piscinas, canchas, salones'),
('POI-PADEL', 'Canario Padel Club', 'club_deportivo', 'deportivo', 'ARU-CENTRO', NULL, NULL, 'Av. Los Malabares, Araure', false, 'Primer club de pádel en Acarigua-Araure'),

-- Estadios y Complejos Deportivos
('POI-ESTADIO-PAEZ', 'Estadio General José Antonio Páez', 'estadio', 'deportivo', 'VIA-ACG-ARU', 9.57083, -69.21028, 'Araure', true, 'Sede del Portuguesa Fútbol Club (Primera División)'),
('POI-VILLAS-PILAR', 'Complejo Deportivo Villas del Pilar', 'complejo_deportivo', 'deportivo', 'ARU-CENTRO', 9.59515, -69.21475, 'Urbanización Villas del Pilar, Municipio Araure', false, 'Dos canchas + gimnasio biosaludable'),
('POI-CAMPO-BARAURE', 'Campo de fútbol Jesús María Cedeño', 'cancha', 'deportivo', 'ARU-AGRICOLA', NULL, NULL, 'Sector Baraure, Municipio Araure', false, 'Sede Escuela de Fútbol Los Baraure'),
('POI-FANATIC', 'Fanatic Club 2025', 'cancha', 'deportivo', 'VIA-ACG-ARU', 9.57264, -69.19817, 'Costado C.C. Llano Mall, Acarigua-Araure', false, 'Cancha sintética fútbol 5 + food & bar + terraza'),

-- Parques y Recreación
('POI-INTER-PARK', 'Inter Park', 'parque', 'recreativo', 'VIA-ACG-ARU', 9.57264, -69.19817, 'Estacionamiento C.C. Llano Mall', false, 'Parque de diversiones temporal/itinerante'),
('POI-MUSIU-CARMELO', 'Parque Musiú Carmelo', 'parque', 'recreativo', 'VIA-ACG-ARU', NULL, NULL, 'Cerca de Llano Mall, Municipio Araure', false, 'Parque urbano recreativo'),
('POI-RAUL-LEONI', 'Parque Raúl Leoni', 'parque', 'recreativo', 'ARU-CENTRO', NULL, NULL, 'Araure', false, 'Parque urbano recreativo'),
('POI-METROPOLITANO', 'Parque Metropolitano', 'parque', 'recreativo', 'ARU-CENTRO', NULL, NULL, 'Araure', false, 'Gran área verde recreativa'),
('POI-ZONA-PROTEGIDA', 'Zona Protectora Nacional Mitar Nackichenovich', 'area_protegida', 'recreativo', 'ARU-AGRICOLA', NULL, NULL, 'Araure', false, 'Área natural protegida con permisología'),
('POI-BALNEARIO-QUEBRADA', 'Balnearios de la Quebrada de Araure', 'balneario', 'recreativo', 'ARU-AGRICOLA', NULL, NULL, 'Araure', false, 'Esparcimiento y pesca en época de lluvia'),
('POI-BALNEARIO-RIO', 'Balnearios del Río Acarigua', 'balneario', 'recreativo', 'ACG-NORTE', NULL, NULL, 'Acarigua', false, 'Esparcimiento y pesca en época de lluvia')
ON CONFLICT (place_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE places IS 'Points of Interest (POIs) for Acarigua-Araure: malls, clubs, stadiums, parks, etc.';
