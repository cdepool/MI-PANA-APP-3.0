
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Compass, ArrowRight, CornerUpRight, Map as MapIcon } from 'lucide-react';

interface MapPlaceholderProps {
  className?: string;
  status?: 'IDLE' | 'PICKING_ORIGIN' | 'PICKING_DEST' | 'SEARCHING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';
  onCenterChange?: () => void;
  currentProgress?: number; // 0 to 100
  heading?: number;
}

const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  className = '',
  status = 'IDLE',
  onCenterChange,
  currentProgress = 0,
  heading = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // --- GEOMETRÍA DE LA CIUDAD ---
  // Coordenadas porcentuales fijas para la simulación (Origen y Destino)
  const originPos = { x: 20, y: 70 };
  const destPos = { x: 80, y: 30 };

  // --- CÁLCULO DE RUTA MANHATTAN (Calles y Avenidas) ---
  // En lugar de una línea recta, simulamos calles (L-Shape o Z-Shape)
  // Ruta: Subir por calle vertical, luego girar a la derecha por avenida
  const turnPoint = { x: originPos.x, y: destPos.y }; // Subimos primero por la calle vertical

  // Puntos para la ruta SVG
  const routePathFull = `
    M ${originPos.x} ${originPos.y} 
    L ${turnPoint.x} ${turnPoint.y} 
    L ${destPos.x} ${destPos.y}
  `;

  // --- CÁLCULO DE POSICIÓN DEL VEHÍCULO (Vectorial) ---
  const seg1Len = Math.abs(turnPoint.y - originPos.y);
  const seg2Len = Math.abs(destPos.x - turnPoint.x);
  const totalLen = seg1Len + seg2Len;

  const getCarPosition = (progress: number) => {
    const currentDist = (progress / 100) * totalLen;

    let x, y, angle;

    if (currentDist <= seg1Len) {
      // Segmento 1: Vertical hacia arriba (Norte)
      x = originPos.x;
      y = originPos.y - currentDist; // Y disminuye al subir
      angle = 0; // 0 grados (Norte)
    } else {
      // Segmento 2: Horizontal hacia derecha (Este)
      const distOnSeg2 = currentDist - seg1Len;
      x = turnPoint.x + distOnSeg2;
      y = turnPoint.y;
      angle = 90; // 90 grados (Este)
    }

    return { x, y, angle, currentDist };
  };

  // Posición actual del carro
  const carState = (status === 'IN_PROGRESS' || status === 'ACCEPTED')
    ? getCarPosition(currentProgress)
    : { x: originPos.x, y: originPos.y, angle: 0, currentDist: 0 };

  // Cálculo de ruta recorrida para efecto visual
  let traveledPath = '';
  if (currentProgress > 0) {
    if (carState.currentDist <= seg1Len) {
      traveledPath = `M ${originPos.x} ${originPos.y} L ${carState.x} ${carState.y}`;
    } else {
      traveledPath = `M ${originPos.x} ${originPos.y} L ${turnPoint.x} ${turnPoint.y} L ${carState.x} ${carState.y}`;
    }
  }

  // Instrucciones de Navegación Simuladas
  const getNavigationInstruction = () => {
    if (status !== 'IN_PROGRESS') return null;
    const distToTurn = seg1Len - carState.currentDist;
    const distToDest = totalLen - carState.currentDist;

    if (distToDest < 5) return { text: 'Llegando al destino', icon: <MapPin size={24} />, sub: 'A la derecha' };
    if (distToTurn > 5) return { text: `Sigue recto ${Math.round(distToTurn * 10)}m`, icon: <ArrowRight size={24} className="-rotate-90" />, sub: 'Por Av. Principal' };
    if (distToTurn > -5 && distToTurn < 5) return { text: 'Gira a la derecha', icon: <CornerUpRight size={24} />, sub: 'Hacia Calle Destino' };
    return { text: `Sigue recto ${Math.round(distToDest * 10)}m`, icon: <ArrowRight size={24} />, sub: 'Hacia tu Pana' };
  };

  const navInstruction = getNavigationInstruction();

  // --- EVENT HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (onCenterChange) onCenterChange();
  };

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [status]);

  const isPicking = status === 'PICKING_ORIGIN' || status === 'PICKING_DEST';
  const isRoutePreview = status === 'SEARCHING' || status === 'ACCEPTED' || status === 'IN_PROGRESS' || status === 'COMPLETED';

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#e8eaed] overflow-hidden rounded-xl cursor-grab ${isDragging ? 'cursor-grabbing' : ''} ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* --- CAPA 1: EL MAPA BASE (Estilo Google Maps Vectorial) --- */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* 1. Base de Tierra (Light Gray) */}
        <div className="absolute inset-[-50%] w-[200%] h-[200%] bg-[#e8eaed]"></div>

        {/* 2. Calles Secundarias (White Lines grid) */}
        <div className="absolute inset-[-50%] w-[200%] h-[200%]"
          style={{
            backgroundImage: `
               linear-gradient(#ffffff 10px, transparent 10px),
               linear-gradient(90deg, #ffffff 10px, transparent 10px)
             `,
            backgroundSize: '15% 15%',
            backgroundPosition: 'center'
          }}
        ></div>

        {/* 3. Áreas Verdes (Parques - Google Green) */}
        <div className="absolute top-[15%] left-[55%] w-[18%] h-[18%] bg-[#c6e6c6] opacity-100"></div>
        <div className="absolute top-[65%] left-[12%] w-[15%] h-[12%] bg-[#c6e6c6] opacity-100"></div>
        <div className="absolute top-[20%] left-[5%] w-[10%] h-[10%] bg-[#c6e6c6] opacity-100"></div>

        {/* 4. Agua (Google Blue) */}
        <div className="absolute top-[85%] left-[0%] w-[100%] h-[15%] bg-[#aadaff]"></div>

        {/* 5. Avenidas Principales (Google Yellow/Orange) con TRÁFICO SIMULADO */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* Avenida Horizontal con tráfico */}
          <path d="M 0 30 L 100 30" stroke="#FCD679" strokeWidth="8" fill="none" strokeLinecap="square" />
          <path d="M 0 30 L 100 30" stroke="#FCD679" strokeWidth="6" fill="none" />

          {/* Overlay de Tráfico en Av. Horizontal */}
          {/* Segmento 1: Tráfico fluido (verde) */}
          <path d="M 0 30 L 35 30" stroke="#34A853" strokeWidth="4" fill="none" opacity="0.7" />
          {/* Segmento 2: Tráfico moderado (amarillo) */}
          <path d="M 35 30 L 65 30" stroke="#FBBC05" strokeWidth="4" fill="none" opacity="0.7" />
          {/* Segmento 3: Tráfico congestionado (rojo) */}
          <path d="M 65 30 L 100 30" stroke="#EA4335" strokeWidth="4" fill="none" opacity="0.7" />

          {/* Avenida Vertical */}
          <path d="M 20 0 L 20 100" stroke="#FFFFFF" strokeWidth="8" fill="none" />
          {/* Tráfico en Av. Vertical (fluido) */}
          <path d="M 20 0 L 20 100" stroke="#34A853" strokeWidth="3" fill="none" opacity="0.6" />

          {/* Avenida Diagonal */}
          <path d="M 80 0 L 80 100" stroke="#FFFFFF" strokeWidth="8" fill="none" />
          {/* Tráfico en Av. Diagonal (moderado) */}
          <path d="M 80 0 L 80 100" stroke="#FBBC05" strokeWidth="3" fill="none" opacity="0.6" />
        </svg>

        {/* 6. Etiquetas de Calles (Google Style) */}
        <div className="absolute top-[31%] left-[50%] text-[10px] font-medium text-[#5F6368] tracking-wide drop-shadow-[0_1px_1px_rgba(255,255,255,1)] bg-white/50 px-1 rounded">Av. Libertador</div>
        <div className="absolute top-[50%] left-[22%] -rotate-90 text-[10px] font-medium text-[#5F6368] tracking-wide drop-shadow-[0_1px_1px_rgba(255,255,255,1)] bg-white/50 px-1 rounded">Calle 32</div>
        <div className="absolute top-[50%] left-[82%] -rotate-90 text-[10px] font-medium text-[#5F6368] tracking-wide drop-shadow-[0_1px_1px_rgba(255,255,255,1)] bg-white/50 px-1 rounded">Av. Las Lágrimas</div>
        <div className="absolute top-[18%] left-[60%] text-[9px] font-bold text-[#388E3C] tracking-wide opacity-80">Parque Musiu Carmelo</div>
      </div>

      {/* --- CAPA 2: LA RUTA (Overlay SVG) --- */}
      {isRoutePreview && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ transform: `translate(${offset.x * 0.1}px, ${offset.y * 0.1}px)` }} // Parallax ligero
        >
          {/* Sombra de la ruta */}
          <path
            d={routePathFull}
            fill="none"
            stroke="#1967D2"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
            className="translate-y-[1px]"
          />
          {/* Ruta Principal (Azul Google Maps) */}
          <path
            d={routePathFull}
            fill="none"
            stroke="#4285F4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Ruta Recorrida (Gris) */}
          {status === 'IN_PROGRESS' && (
            <path
              d={traveledPath}
              fill="none"
              stroke="#9ca3af" // Gris
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      )}

      {/* --- CAPA 3: MARCADORES Y VEHÍCULO --- */}
      <div className="absolute inset-0 w-full h-full z-20 pointer-events-none" style={{ transform: `translate(${offset.x * 0.1}px, ${offset.y * 0.1}px)` }}>

        {isRoutePreview && (
          <>
            {/* Marcador Origen (Punto blanco con borde negro/gris) */}
            <div
              className="absolute w-4 h-4 bg-white rounded-full border-[3px] border-[#555] shadow-md flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${originPos.x}%`, top: `${originPos.y}%` }}
            >
            </div>

            {/* Marcador Destino (Pin Rojo Estilo Google) */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-full z-10"
              style={{ left: `${destPos.x}%`, top: `${destPos.y}%` }}
            >
              <div className="relative">
                <MapPin className="w-8 h-8 text-[#EA4335] fill-[#EA4335] drop-shadow-md" strokeWidth={1.5} />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 bg-black/30 rounded-full blur-[1px]"></div>
              </div>
            </div>
          </>
        )}

        {/* VEHÍCULO ANIMADO (GPS REAL-TIME) */}
        {(status === 'IN_PROGRESS' || status === 'ACCEPTED') && (
          <div
            className="absolute z-20 transition-all duration-700 ease-linear will-change-transform"
            style={{
              left: `${carState.x}%`,
              top: `${carState.y}%`,
              transform: `translate(-50%, -50%) rotate(${carState.angle}deg)`
            }}
          >
            {/* Icono de Auto visto desde arriba */}
            <div className="relative drop-shadow-xl">
              {/* Cuerpo del auto */}
              <div className="w-9 h-5 bg-mipana-darkBlue rounded-[4px] flex items-center justify-center relative z-10 border-[0.5px] border-white/30">
                <div className="w-5 h-3 bg-black/40 rounded-[2px]"></div> {/* Parabrisas */}
              </div>

              {/* Luces traseras (siempre encendidas) */}
              <div className="absolute -top-[2px] left-[2px] w-1.5 h-[2px] bg-red-500 rounded-full shadow-[0_0_4px_rgba(239,68,68,0.8)]"></div>
              <div className="absolute -top-[2px] right-[2px] w-1.5 h-[2px] bg-red-500 rounded-full shadow-[0_0_4px_rgba(239,68,68,0.8)]"></div>
            </div>
          </div>
        )}
      </div>

      {/* --- HUD / INSTRUCCIONES DE NAVEGACIÓN (GPS) --- */}
      {navInstruction && status === 'IN_PROGRESS' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#00796B] text-white p-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[240px] animate-slide-up">
          <div className="bg-white/20 p-2 rounded-lg">
            {navInstruction.icon}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg leading-none">{navInstruction.text}</p>
            <p className="text-xs text-green-100 opacity-90 mt-1">{navInstruction.sub}</p>
          </div>
        </div>
      )}

      {/* --- CAPA 4: UI DE SELECCIÓN (Pin Central) --- */}
      {isPicking && (
        <>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-30 pointer-events-none flex flex-col items-center transition-all duration-200">
            <div className={`relative transition-transform duration-200 ${isDragging ? '-translate-y-4 scale-110' : 'translate-y-0'}`}>
              <MapPin
                className={`w-10 h-10 drop-shadow-lg ${status === 'PICKING_ORIGIN' ? 'text-[#333] fill-[#333]' : 'text-[#EA4335] fill-[#EA4335]'}`}
                strokeWidth={1.5}
              />
            </div>
            <div className={`w-3 h-1 bg-black/30 rounded-full blur-[1px] mt-0.5 transition-opacity duration-200 ${isDragging ? 'opacity-20 scale-75' : 'opacity-50 scale-100'}`}></div>

            <div className="mt-2 bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-gray-200 whitespace-nowrap flex items-center gap-2">
              <Navigation size={10} className="text-blue-600" />
              {isDragging ? 'Soltar para fijar' : (status === 'PICKING_ORIGIN' ? 'Fijar Punto de Partida' : 'Fijar Destino')}
            </div>
          </div>
          {/* Mirilla estilo shooter para precisión */}
          <div className="absolute top-1/2 left-1/2 w-4 h-[1px] bg-black/20 -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 h-4 w-[1px] bg-black/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        </>
      )}

      {/* UI Botón Recentrar */}
      <div className="absolute bottom-6 right-4 z-30 flex flex-col gap-2">
        <div
          className="bg-white p-3 rounded-full shadow-md border border-gray-100 hover:bg-gray-50 cursor-pointer active:scale-95 transition-transform"
          onClick={() => onCenterChange && onCenterChange()}
          title="Recentrar Mapa"
        >
          <Compass size={20} className="text-blue-600" />
        </div>
      </div>

      {/* Google Logo Simulation */}
      <div className="absolute bottom-1 left-1 opacity-90 pointer-events-none select-none flex items-center z-20">
        <span className="text-[16px] font-bold text-[#4285F4] tracking-tighter" style={{ fontFamily: 'Product Sans, sans-serif' }}>G</span>
        <span className="text-[16px] font-bold text-[#EA4335] tracking-tighter" style={{ fontFamily: 'Product Sans, sans-serif' }}>o</span>
        <span className="text-[16px] font-bold text-[#FBBC05] tracking-tighter" style={{ fontFamily: 'Product Sans, sans-serif' }}>o</span>
        <span className="text-[16px] font-bold text-[#4285F4] tracking-tighter" style={{ fontFamily: 'Product Sans, sans-serif' }}>g</span>
        <span className="text-[16px] font-bold text-[#34A853] tracking-tighter" style={{ fontFamily: 'Product Sans, sans-serif' }}>l</span>
        <span className="text-[16px] font-bold text-[#EA4335] tracking-tighter mr-1" style={{ fontFamily: 'Product Sans, sans-serif' }}>e</span>
      </div>
    </div>
  );
};

export default MapPlaceholder;
