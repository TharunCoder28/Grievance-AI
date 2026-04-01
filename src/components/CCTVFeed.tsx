import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, 
  AlertTriangle, 
  Shield, 
  Activity, 
  Maximize2, 
  Volume2, 
  VolumeX,
  Clock,
  MapPin,
  X,
  Loader2,
  Minimize2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CCTVCamera {
  id: string;
  name: string;
  location: string;
  issue: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "Resolved";
  videoPool: string[];
}

const VIDEO_POOL = [
  "https://assets.mixkit.co/videos/preview/mixkit-traffic-at-a-busy-intersection-at-night-4414-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-street-with-many-people-and-cars-in-the-city-4413-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-night-city-traffic-with-many-cars-and-lights-4416-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-parking-lot-at-night-4415-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-a-city-street-at-night-4417-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-people-walking-in-a-busy-market-street-4418-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-city-traffic-at-night-with-lights-and-cars-4419-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-busy-street-in-the-city-with-cars-and-people-4420-large.mp4"
];

const CAMERAS: CCTVCamera[] = [
  { 
    id: "CAM-01", 
    name: "GST Road Junction", 
    location: "Chennai South", 
    issue: "Traffic Accident", 
    priority: "High", 
    status: "Pending",
    videoPool: [VIDEO_POOL[0], VIDEO_POOL[2], VIDEO_POOL[6]]
  },
  { 
    id: "CAM-02", 
    name: "Tambaram Market", 
    location: "Tambaram", 
    issue: "Crowd Control", 
    priority: "Medium", 
    status: "Pending",
    videoPool: [VIDEO_POOL[5], VIDEO_POOL[7], VIDEO_POOL[1]]
  },
  { 
    id: "CAM-03", 
    name: "Anna Nagar West", 
    location: "Anna Nagar", 
    issue: "Illegal Dumping", 
    priority: "Low", 
    status: "Pending",
    videoPool: [VIDEO_POOL[1], VIDEO_POOL[4], VIDEO_POOL[3]]
  },
  { 
    id: "CAM-04", 
    name: "Marina Beach Road", 
    location: "Marina", 
    issue: "Suspicious Activity", 
    priority: "High", 
    status: "Pending",
    videoPool: [VIDEO_POOL[2], VIDEO_POOL[4], VIDEO_POOL[0]]
  },
  { 
    id: "CAM-05", 
    name: "T-Nagar Plaza", 
    location: "T-Nagar", 
    issue: "Theft Reported", 
    priority: "High", 
    status: "Pending",
    videoPool: [VIDEO_POOL[3], VIDEO_POOL[5], VIDEO_POOL[7]]
  },
  { 
    id: "CAM-06", 
    name: "Velachery Main Road", 
    location: "Velachery", 
    issue: "Water Logging", 
    priority: "Medium", 
    status: "Pending",
    videoPool: [VIDEO_POOL[4], VIDEO_POOL[6], VIDEO_POOL[2]]
  },
];

const FeedPanel = ({ 
  camera, 
  onClick 
}: { 
  camera: CCTVCamera, 
  onClick: (cam: CCTVCamera) => void,
  key?: string | number
}) => {
  const [timestamp, setTimestamp] = useState(new Date());
  const [videoIndex, setVideoIndex] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Update timestamp every second
  useEffect(() => {
    const timer = setInterval(() => setTimestamp(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotate video source every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLoading(true);
      setVideoIndex((prev) => (prev + 1) % camera.videoPool.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [camera.videoPool.length]);

  // Random glitch effect
  useEffect(() => {
    const triggerGlitch = () => {
      if (Math.random() > 0.85) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 300);
      }
    };
    const interval = setInterval(triggerGlitch, 4000);
    return () => clearInterval(interval);
  }, []);

  const priorityColors = {
    High: "border-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.4)]",
    Medium: "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    Low: "border-slate-700 shadow-none",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, zIndex: 10 }}
      onClick={() => onClick(camera)}
      className={cn(
        "relative aspect-video rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-500 group bg-black",
        priorityColors[camera.priority],
        camera.priority === "High" && "animate-pulse"
      )}
    >
      {/* Video Element */}
      <div className={cn(
        "absolute inset-0 transition-transform duration-[12000ms] ease-linear animate-cctv-zoom",
        isGlitching && "animate-glitch"
      )}>
        <video
          ref={videoRef}
          src={camera.videoPool[videoIndex]}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setLoading(false)}
          className={cn(
            "w-full h-full object-cover opacity-70 grayscale-[0.2] contrast-125 brightness-90 transition-opacity duration-1000",
            loading ? "opacity-0" : "opacity-70"
          )}
        />
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* CCTV Overlays */}
      <div className="absolute inset-0 cctv-scanline opacity-20 pointer-events-none" />
      <div className="absolute inset-0 cctv-noise pointer-events-none" />
      <div className="absolute inset-0 cctv-vignette pointer-events-none" />

      {/* UI Overlays */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none select-none">
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              <div className="w-2 h-2 rounded-full bg-rose-600 animate-blink" />
              <span className="text-[10px] font-mono font-black text-white tracking-widest uppercase">Live</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              <span className="text-[10px] font-mono text-slate-300 font-bold">
                {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              <span className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-tighter">
                {camera.id}
              </span>
            </div>
            {camera.priority === "High" && (
              <div className="bg-rose-600/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-rose-400/30 animate-pulse">
                <span className="text-[9px] font-black text-white uppercase tracking-widest">High Alert</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-end">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
              <MapPin className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-wider drop-shadow-lg">
                {camera.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border backdrop-blur-md",
                camera.priority === "High" ? "bg-rose-600/20 border-rose-500/50 text-rose-400" :
                camera.priority === "Medium" ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-slate-800/50 border-slate-700 text-slate-400"
              )}>
                {camera.issue}
              </div>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-2 rounded-xl backdrop-blur-md border border-white/10">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Corner Brackets */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-white/30 rounded-tl-sm pointer-events-none" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-white/30 rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-white/30 rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-white/30 rounded-br-sm pointer-events-none" />
    </motion.div>
  );
};

export const CCTVFeedSimulation = () => {
  const [filter, setFilter] = useState<"All" | "High">("All");
  const [selectedCam, setSelectedCam] = useState<CCTVCamera | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filteredCameras = useMemo(() => {
    return filter === "All" ? CAMERAS : CAMERAS.filter(c => c.priority === "High");
  }, [filter]);

  // Play alert sound for high priority if sound enabled
  useEffect(() => {
    if (soundEnabled && filteredCameras.some(c => c.priority === "High")) {
      const playBeep = () => {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
          console.warn("Audio context failed", e);
        }
      };

      const interval = setInterval(playBeep, 5000);
      return () => clearInterval(interval);
    }
  }, [soundEnabled, filteredCameras]);

  return (
    <div className="space-y-8 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600/20 rounded-3xl border border-indigo-500/30 shadow-inner">
            <Camera className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Control Room <span className="text-indigo-500">Live</span></h2>
            <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">Smart City Surveillance Grid</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-800 shadow-2xl">
          <button
            onClick={() => setFilter("All")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              filter === "All" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/40" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            All Feeds
          </button>
          <button
            onClick={() => setFilter("High")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              filter === "High" ? "bg-rose-600 text-white shadow-lg shadow-rose-500/40" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            High Alert
          </button>
          <div className="w-px h-8 bg-slate-800 mx-1" />
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "p-2.5 rounded-xl transition-all border border-transparent",
              soundEnabled ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30" : "text-slate-500 hover:bg-white/5"
            )}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredCameras.map((camera) => (
            <FeedPanel 
              key={camera.id} 
              camera={camera} 
              onClick={setSelectedCam} 
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Detail Modal / Fullscreen Simulation */}
      <AnimatePresence>
        {selectedCam && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCam(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className={cn(
                "relative w-full max-w-6xl bg-slate-950 rounded-none sm:rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]",
                isFullscreen && "fixed inset-0 max-w-none rounded-none border-none"
              )}
            >
              <div className="flex flex-col lg:flex-row h-full">
                {/* Large Feed */}
                <div className="w-full lg:w-3/4 aspect-video relative bg-black group/modal">
                  <video
                    src={selectedCam.videoPool[0]}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-80 grayscale-[0.1] contrast-125 animate-cctv-zoom"
                  />
                  <div className="absolute inset-0 cctv-scanline opacity-30 pointer-events-none" />
                  <div className="absolute inset-0 cctv-vignette pointer-events-none" />
                  
                  <div className="absolute top-8 left-8 flex flex-col gap-4">
                    <div className="bg-rose-600 px-4 py-1.5 rounded-full flex items-center gap-3 shadow-2xl">
                      <div className="w-2.5 h-2.5 rounded-full bg-white animate-blink" />
                      <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Live Surveillance</span>
                    </div>
                    <div className="bg-black/60 backdrop-blur-xl px-4 py-1.5 rounded-2xl border border-white/10 inline-flex items-center gap-3">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-mono font-bold text-white tracking-widest">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-8 right-8 flex gap-3">
                    <button 
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-3 bg-black/60 hover:bg-indigo-600 text-white rounded-2xl backdrop-blur-xl border border-white/10 transition-all"
                    >
                      {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                    </button>
                    <button 
                      onClick={() => setSelectedCam(null)}
                      className="p-3 bg-black/60 hover:bg-rose-600 text-white rounded-2xl backdrop-blur-xl border border-white/10 transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                    <div className="bg-black/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10 max-w-md">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-indigo-400" />
                        <h4 className="text-xl font-black text-white uppercase tracking-tight">{selectedCam.name}</h4>
                      </div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{selectedCam.location}</p>
                    </div>
                    <div className="bg-black/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                       <span className="text-4xl font-mono font-black text-white/20 tracking-tighter">{selectedCam.id}</span>
                    </div>
                  </div>
                </div>

                {/* Details Sidebar */}
                <div className="w-full lg:w-1/4 p-10 flex flex-col justify-between bg-slate-950 border-l border-white/5">
                  <div className="space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-indigo-600/20 rounded-3xl border border-indigo-500/30">
                        <Shield className="w-8 h-8 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Security Protocol</p>
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Active Monitor</h4>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Incident Log</p>
                        <p className="text-xl font-black text-white tracking-tight leading-tight">{selectedCam.issue}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Priority Level</p>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]",
                              selectedCam.priority === "High" ? "text-rose-500 bg-rose-500" : "text-amber-500 bg-amber-500"
                            )} />
                            <span className={cn(
                              "text-lg font-black uppercase tracking-tighter",
                              selectedCam.priority === "High" ? "text-rose-500" : "text-amber-500"
                            )}>
                              {selectedCam.priority}
                            </span>
                          </div>
                        </div>
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">System Status</p>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                            <span className="text-lg font-black uppercase tracking-tighter text-indigo-400">
                              {selectedCam.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 space-y-4">
                    <button className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/30 transform active:scale-95">
                      Dispatch Unit
                    </button>
                    <button className="w-full py-5 bg-white/5 text-slate-400 rounded-3xl font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">
                      False Alarm
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

