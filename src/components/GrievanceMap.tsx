import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
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
const createCustomIcon = (priority: string, category: string, status: string) => {
  const color = priority === "High" ? "#e11d48" : priority === "Medium" ? "#f59e0b" : "#10b981";
  const icon = priority === "High" ? "!" : priority === "Medium" ? "?" : "✓";
  const isResolved = status === "Resolved";
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="relative flex items-center justify-center">
        ${!isResolved && priority === "High" ? `<div class="absolute w-12 h-12 rounded-full bg-rose-500/20 animate-ping"></div>` : ""}
        ${!isResolved && priority === "Medium" ? `<div class="absolute w-10 h-10 rounded-full bg-amber-500/10 animate-pulse"></div>` : ""}
        <div class="relative w-9 h-9 rounded-full bg-white shadow-xl border-[3px] flex items-center justify-center font-black text-[15px] transition-all ${isResolved ? 'grayscale opacity-60' : ''}" 
             style="border-color: ${isResolved ? '#94a3b8' : color}; color: ${isResolved ? '#94a3b8' : color}; box-shadow: 0 0 15px ${isResolved ? 'rgba(0,0,0,0.1)' : color + '44'}">
          ${isResolved ? '✓' : icon}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
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
  officerInCharge?: {
    name: string;
    badge: string;
    mobile: string;
  };
}

interface Patrol {
  id: string;
  location: { lat: number; lng: number };
  type: "Bike" | "Car" | "Van";
  status: "Patrolling" | "Responding" | "Stationary";
  speed: number;
  heading: number;
  lastUpdate: string;
  history: { lat: number; lng: number }[];
}

interface GrievanceMapProps {
  grievances: Grievance[];
  patrols?: Patrol[];
  onMarkerClick?: (grievance: Grievance) => void;
  selectedId?: string;
}

// Component to handle map view updates (e.g., flying to a point)
const MapController = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  const lastCenter = useRef<string>("");

  useEffect(() => {
    if (center) {
      const centerStr = `${center[0]},${center[1]}`;
      if (lastCenter.current !== centerStr) {
        lastCenter.current = centerStr;
        map.flyTo(center, 16, { 
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    }
  }, [center, map]);
  return null;
};

const createPatrolIcon = (type: string, status: string, heading: number) => {
  const isResponding = status === "Responding";
  const iconColor = isResponding ? "#e11d48" : "#3b82f6";
  
  return L.divIcon({
    className: "patrol-marker",
    html: `
      <div class="relative flex items-center justify-center">
        ${isResponding ? `<div class="absolute w-12 h-12 rounded-full bg-rose-500/20 animate-ping"></div>` : ""}
        <div class="absolute w-10 h-10 rounded-full ${isResponding ? 'bg-rose-500/10' : 'bg-blue-500/10'} animate-pulse"></div>
        <div class="relative w-9 h-9 rounded-full ${isResponding ? 'bg-rose-600' : 'bg-blue-600'} shadow-xl border-2 border-white flex items-center justify-center transition-all duration-1000" style="transform: rotate(${heading}deg)">
          ${type === "Bike" ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg>' : 
            type === "Car" ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>' :
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="12" x="3" y="10" rx="2"/><path d="M7 10V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6"/><circle cx="7" cy="20" r="2"/><circle cx="17" cy="20" r="2"/></svg>'}
        </div>
        ${isResponding ? `<div class="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-bounce"></div>` : ""}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export const GrievanceMap = ({ grievances, patrols = [], onMarkerClick, selectedId }: GrievanceMapProps) => {
  const [activeGrievance, setActiveGrievance] = useState<Grievance | null>(null);
  const [mapType, setMapType] = useState<"standard" | "dark">("dark");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");

  const center: [number, number] = [12.9249, 80.1277]; // Chennai Tambaram area

  // Sync external selection with internal map focus
  useEffect(() => {
    if (selectedId) {
      const selected = grievances.find(g => g.id === selectedId);
      if (selected) {
        setActiveGrievance(selected);
      }
    }
  }, [selectedId, grievances]);

  const filteredGrievances = useMemo(() => {
    return grievances.filter(g => {
      const matchesStatus = statusFilter === "All" || g.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || g.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [grievances, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    return {
      total: grievances.length,
      high: grievances.filter(g => g.priority === "High").length,
      medium: grievances.filter(g => g.priority === "Medium").length,
      low: grievances.filter(g => g.priority === "Low").length,
      filtered: filteredGrievances.length
    };
  }, [grievances, filteredGrievances]);

  return (
    <div className="relative w-full h-[600px] rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl group">
      {/* Map UI Overlays */}
      <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
        <div className="glass-card px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Incident Map</span>
        </div>
        
        {/* Statistics Card */}
        <div className="glass-card p-4 rounded-3xl border border-white/10 shadow-xl space-y-3 min-w-[200px]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Map View</span>
            <span className="text-sm font-black text-white">{stats.filtered} / {stats.total}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
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

        {/* Filters Card */}
        <div className="glass-card p-4 rounded-3xl border border-white/10 shadow-xl space-y-4 min-w-[200px]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Status Filter
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["All", "Pending", "In Progress", "Resolved"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tight transition-all border",
                    statusFilter === s 
                      ? "bg-indigo-600 text-white border-indigo-600" 
                      : "bg-white/5 text-slate-400 border-white/10 hover:border-white/30"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> Priority Filter
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["All", "High", "Medium", "Low"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tight transition-all border",
                    priorityFilter === p 
                      ? "bg-indigo-600 text-white border-indigo-600" 
                      : "bg-white/5 text-slate-400 border-white/10 hover:border-white/30"
                  )}
                >
                  {p}
                </button>
              ))}
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
        
        {filteredGrievances.map((g) => (
          <Marker 
            key={g.id} 
            position={[g.geoData.lat, g.geoData.lng]}
            icon={createCustomIcon(g.priority, g.category, g.status)}
            eventHandlers={{
              click: () => {
                setActiveGrievance(g);
                onMarkerClick?.(g);
              },
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 space-y-2 min-w-[150px]">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{g.category}</p>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                    g.priority === "High" ? "bg-rose-100 text-rose-600" : 
                    g.priority === "Medium" ? "bg-amber-100 text-amber-600" : 
                    "bg-emerald-100 text-emerald-600"
                  )}>
                    {g.priority}
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-900 leading-tight">{g.summary || g.text}</p>
                {g.officerInCharge && (
                  <div className="pt-1.5 border-t border-slate-100 flex items-center gap-2">
                    <div className="w-5 h-5 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-black text-[8px]">
                      P
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-slate-400 uppercase leading-none">Officer</p>
                      <p className="text-[9px] font-black text-slate-700 leading-none">{g.officerInCharge.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {patrols.map((p) => (
          <React.Fragment key={p.id}>
            {p.history && p.history.length > 1 && (
              <Polyline 
                positions={p.history.map(h => [h.lat, h.lng] as [number, number])}
                color={p.status === "Responding" ? "#f43f5e" : "#6366f1"}
                weight={2}
                dashArray="5, 10"
                opacity={0.5}
              />
            )}
            <Marker
              position={[p.location.lat, p.location.lng]}
              icon={createPatrolIcon(p.type, p.status, p.heading)}
            >
              <Popup className="patrol-popup">
                <div className="p-2 space-y-2 min-w-[150px]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        p.status === "Responding" ? "bg-rose-500 animate-pulse" :
                        p.status === "Patrolling" ? "bg-emerald-500" : "bg-slate-400"
                      )} />
                      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-900">{p.id}</p>
                    </div>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase italic">
                      {p.type}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Current Status</p>
                    <p className={cn(
                      "text-xs font-black uppercase tracking-tight",
                      p.status === "Responding" ? "text-rose-600" :
                      p.status === "Patrolling" ? "text-emerald-600" : "text-slate-600"
                    )}>
                      {p.status}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-[7px] font-black text-slate-400 uppercase">Speed</p>
                      <p className="text-[10px] font-black text-slate-700">{p.speed} km/h</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-slate-400 uppercase">Heading</p>
                      <p className="text-[10px] font-black text-slate-700">{Math.round(p.heading)}°</p>
                    </div>
                  </div>

                  <p className="text-[7px] text-slate-300 font-bold uppercase text-right pt-1">
                    Updated: {new Date(p.lastUpdate).toLocaleTimeString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
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
