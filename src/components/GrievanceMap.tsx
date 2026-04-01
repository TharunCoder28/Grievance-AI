import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Navigation, 
  AlertCircle, 
  Clock, 
  Info,
  Maximize2,
  Layers,
  Activity
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const HighlightText = ({ text, keywords }: { text: string; keywords?: string[] }) => {
  if (!keywords || keywords.length === 0) return <>{text}</>;
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
  const escapedKeywords = sortedKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-indigo-500/20 text-indigo-300 px-1 rounded font-bold border-b border-indigo-500/50">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

// Fix for default marker icons in Leaflet + React
// Using custom SVG markers instead for better control and reliability
const createCustomIcon = (priority: string, category: string) => {
  const color = priority === "High" ? "#e11d48" : priority === "Medium" ? "#f59e0b" : "#10b981";
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-white/20 animate-ping" style="background-color: ${color}44"></div>
        <div class="relative w-6 h-6 rounded-full bg-white shadow-xl border-2 flex items-center justify-center" style="border-color: ${color}">
          <div class="w-2 h-2 rounded-full" style="background-color: ${color}"></div>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

interface Grievance {
  id: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  status: string;
  geoData: { lat: number; lng: number };
  summary?: string;
  text: string;
  timestamp: string;
  keywords?: string[];
}

interface GrievanceMapProps {
  grievances: Grievance[];
  onMarkerClick?: (grievance: Grievance) => void;
}

// Component to handle map view updates (e.g., flying to a point)
const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

export const GrievanceMap = ({ grievances, onMarkerClick }: GrievanceMapProps) => {
  const [activeGrievance, setActiveGrievance] = useState<Grievance | null>(null);
  const [mapType, setMapType] = useState<"standard" | "dark">("dark");

  const center: [number, number] = [12.9249, 80.1277]; // Chennai Tambaram area

  const stats = useMemo(() => {
    return {
      total: grievances.length,
      high: grievances.filter(g => g.priority === "High").length,
      medium: grievances.filter(g => g.priority === "Medium").length,
      low: grievances.filter(g => g.priority === "Low").length,
    };
  }, [grievances]);

  return (
    <div className="relative w-full h-[600px] rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl group">
      {/* Map UI Overlays */}
      <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
        <div className="glass-card px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Incident Map</span>
        </div>
        
        <div className="glass-card p-4 rounded-3xl border border-white/10 shadow-xl space-y-3 min-w-[180px]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Alerts</span>
            <span className="text-sm font-black text-white">{stats.total}</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-rose-500" style={{ width: `${(stats.high / stats.total) * 100}%` }} />
            <div className="h-full bg-amber-500" style={{ width: `${(stats.medium / stats.total) * 100}%` }} />
            <div className="h-full bg-emerald-500" style={{ width: `${(stats.low / stats.total) * 100}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-[8px] font-bold text-rose-500 uppercase">High</p>
              <p className="text-xs font-black text-white">{stats.high}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-amber-500 uppercase">Med</p>
              <p className="text-xs font-black text-white">{stats.medium}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-emerald-500 uppercase">Low</p>
              <p className="text-xs font-black text-white">{stats.low}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
        <button 
          onClick={() => setMapType(mapType === "standard" ? "dark" : "standard")}
          className="p-3 glass-card rounded-2xl border border-white/10 text-white hover:bg-indigo-600 transition-all shadow-xl"
        >
          <Layers className="w-5 h-5" />
        </button>
        <button className="p-3 glass-card rounded-2xl border border-white/10 text-white hover:bg-indigo-600 transition-all shadow-xl">
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {/* Real-time Feed Overlay (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-[1000] max-w-xs w-full">
        <AnimatePresence mode="wait">
          {activeGrievance ? (
            <motion.div
              key={activeGrievance.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="glass-card p-6 rounded-[2rem] border border-white/20 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                  activeGrievance.priority === "High" ? "bg-rose-600 text-white" : "bg-amber-500 text-black"
                )}>
                  {activeGrievance.priority} Priority
                </div>
                <button onClick={() => setActiveGrievance(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-lg font-black text-white mb-2 leading-tight uppercase italic">
                {activeGrievance.category}
              </h4>
              <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                <HighlightText text={activeGrievance.summary || activeGrievance.text} keywords={activeGrievance.keywords} />
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <Clock className="w-3 h-3" />
                  {new Date(activeGrievance.timestamp).toLocaleTimeString()}
                </div>
                <button 
                  onClick={() => onMarkerClick?.(activeGrievance)}
                  className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300"
                >
                  View Details
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 rounded-xl">
                <Info className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select a marker to view details</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Leaflet Map */}
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          url={mapType === "dark" 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {grievances.map((g) => (
          <Marker 
            key={g.id} 
            position={[g.geoData.lat, g.geoData.lng]}
            icon={createCustomIcon(g.priority, g.category)}
            eventHandlers={{
              click: () => setActiveGrievance(g),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1">
                <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{g.category}</p>
                <p className="text-xs font-bold text-slate-900">{g.summary || g.text}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {activeGrievance && <MapController center={[activeGrievance.geoData.lat, activeGrievance.geoData.lng]} />}
      </MapContainer>

      {/* Map Scanning Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none border-[20px] border-black/10 rounded-[2.5rem] z-10" />
    </div>
  );
};

const X = ({ className, ...props }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
