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
  Minimize2,
  Zap
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

const VIDEO_POOL = {
  traffic: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Reliable fallback for testing
  market: "https://assets.mixkit.co/videos/preview/mixkit-people-walking-in-a-busy-market-street-4418-large.mp4",
  street_night: "https://assets.mixkit.co/videos/preview/mixkit-night-city-traffic-with-many-cars-and-lights-4416-large.mp4",
  beach: "https://assets.mixkit.co/videos/preview/mixkit-waves-on-the-beach-at-sunset-4431-large.mp4",
  theft: "https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-parking-lot-at-night-4415-large.mp4",
  rain: "https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-a-city-street-at-night-4417-large.mp4",
  crowd_busy: "https://assets.mixkit.co/videos/preview/mixkit-busy-pedestrian-crossing-in-the-city-4422-large.mp4",
  subway: "https://assets.mixkit.co/videos/preview/mixkit-crowded-subway-station-with-people-walking-4423-large.mp4",
  square: "https://assets.mixkit.co/videos/preview/mixkit-busy-city-square-with-many-people-walking-4424-large.mp4",
  pedestrians: "https://assets.mixkit.co/videos/preview/mixkit-pedestrians-walking-on-a-busy-city-street-4421-large.mp4",
  mall: "https://assets.mixkit.co/videos/preview/mixkit-people-walking-in-a-shopping-mall-4426-large.mp4",
  sidewalk: "https://assets.mixkit.co/videos/preview/mixkit-people-walking-on-a-busy-sidewalk-4425-large.mp4",
  crowd_top: "https://assets.mixkit.co/videos/preview/mixkit-busy-city-street-with-people-walking-from-above-4428-large.mp4",
  crowd_night: "https://assets.mixkit.co/videos/preview/mixkit-people-walking-in-a-busy-city-street-at-night-4429-large.mp4"
};

const CROWD_VIDEOS = [
  VIDEO_POOL.market,
  VIDEO_POOL.crowd_busy,
  VIDEO_POOL.subway,
  VIDEO_POOL.square,
  VIDEO_POOL.pedestrians,
  VIDEO_POOL.mall,
  VIDEO_POOL.sidewalk,
  VIDEO_POOL.crowd_top,
  VIDEO_POOL.crowd_night
];

const CAMERAS: CCTVCamera[] = [
  { 
    id: "CAM-01", 
    name: "GST Road Junction", 
    location: "Chennai South", 
    issue: "Traffic Accident", 
    priority: "High", 
    status: "Pending",
    videoPool: [VIDEO_POOL.traffic]
  },
  { 
    id: "CAM-02", 
    name: "Tambaram Market", 
    location: "Tambaram", 
    issue: "Crowd Control", 
    priority: "High", 
    status: "Pending",
    videoPool: CROWD_VIDEOS
  },
  { 
    id: "CAM-03", 
    name: "Anna Nagar West", 
    location: "Anna Nagar", 
    issue: "Illegal Dumping", 
    priority: "Low", 
    status: "Pending",
    videoPool: [VIDEO_POOL.street_night]
  },
  { 
    id: "CAM-04", 
    name: "Marina Beach Road", 
    location: "Marina", 
    issue: "Suspicious Activity", 
    priority: "High", 
    status: "Pending",
    videoPool: [VIDEO_POOL.beach]
  },
  { 
    id: "CAM-05", 
    name: "T-Nagar Plaza", 
    location: "T-Nagar", 
    issue: "Theft Reported", 
    priority: "High", 
    status: "Pending",
    videoPool: [VIDEO_POOL.theft]
  },
  { 
    id: "CAM-06", 
    name: "Velachery Main Road", 
    location: "Velachery", 
    issue: "Water Logging", 
    priority: "Medium", 
    status: "Pending",
    videoPool: [VIDEO_POOL.rain]
  },
  { 
    id: "CAM-07", 
    name: "Central Station Exit", 
    location: "Central", 
    issue: "Heavy Inflow", 
    priority: "High", 
    status: "Pending",
    videoPool: [VIDEO_POOL.subway, ...CROWD_VIDEOS]
  },
  { 
    id: "CAM-08", 
    name: "Mount Road Crossing", 
    location: "Mount Road", 
    issue: "Pedestrian Safety", 
    priority: "Medium", 
    status: "Pending",
    videoPool: [VIDEO_POOL.crowd_busy, ...CROWD_VIDEOS]
  },
  { 
    id: "CAM-09", 
    name: "City Center Square", 
    location: "Egmore", 
    issue: "Public Gathering", 
    priority: "High", 
    status: "Pending",
    videoPool: CROWD_VIDEOS
  },
  { 
    id: "CAM-10", 
    name: "Express Avenue Mall", 
    location: "Royapettah", 
    issue: "Crowd Surge", 
    priority: "High", 
    status: "Pending",
    videoPool: [VIDEO_POOL.mall, ...CROWD_VIDEOS]
  },
  { 
    id: "CAM-11", 
    name: "Pondy Bazaar Sidewalk", 
    location: "T-Nagar", 
    issue: "Illegal Hawking", 
    priority: "Medium", 
    status: "Pending",
    videoPool: CROWD_VIDEOS
  },
  { 
    id: "CAM-12", 
    name: "OMR IT Corridor", 
    location: "Sholinganallur", 
    issue: "Peak Hour Rush", 
    priority: "High", 
    status: "Pending",
    videoPool: CROWD_VIDEOS
  },
  { 
    id: "CAM-13", 
    name: "T-Nagar Skywalk", 
    location: "T-Nagar", 
    issue: "Crowd Congestion", 
    priority: "High", 
    status: "Pending",
    videoPool: CROWD_VIDEOS
  },
  { 
    id: "CAM-14", 
    name: "Broadway Night Market", 
    location: "Parrys", 
    issue: "Unlicensed Vendors", 
    priority: "Medium", 
    status: "Pending",
    videoPool: CROWD_VIDEOS
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
  const [isMotionDetected, setIsMotionDetected] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [motionPos, setMotionPos] = useState({ top: "20%", left: "30%" });
  const [facePos, setFacePos] = useState({ top: "40%", left: "50%" });
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
      if (Math.random() > 0.8) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 400);
      }
    };
    const interval = setInterval(triggerGlitch, 3000);
    return () => clearInterval(interval);
  }, []);

  // Random motion detection simulation
  useEffect(() => {
    const triggerMotion = () => {
      if (Math.random() > 0.7) {
        setIsMotionDetected(true);
        setMotionPos({
          top: `${Math.floor(Math.random() * 60 + 20)}%`,
          left: `${Math.floor(Math.random() * 60 + 20)}%`
        });
        setTimeout(() => setIsMotionDetected(false), 2000);
      }
    };
    const interval = setInterval(triggerMotion, 5000);
    return () => clearInterval(interval);
  }, []);

  // Random face recognition simulation
  useEffect(() => {
    const triggerFace = () => {
      if (Math.random() > 0.8) {
        setIsFaceDetected(true);
        setFacePos({
          top: `${Math.floor(Math.random() * 40 + 20)}%`,
          left: `${Math.floor(Math.random() * 40 + 20)}%`
        });
        setTimeout(() => setIsFaceDetected(false), 3000);
      }
    };
    const interval = setInterval(triggerFace, 7000);
    return () => clearInterval(interval);
  }, []);

  // Fallback to hide loading spinner if video takes too long
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const priorityGlows = {
    High: "hover:border-rose-600 hover:shadow-[0_0_30px_rgba(225,29,72,0.6)]",
    Medium: "hover:border-amber-500 hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]",
    Low: "hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]",
  };

  const priorityBorders = {
    High: "border-rose-600/50",
    Medium: "border-amber-500/50",
    Low: "border-slate-800",
  };

  const [hasError, setHasError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      onClick={() => onClick(camera)}
      className={cn(
        "relative aspect-video rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-500 group bg-black",
        priorityBorders[camera.priority],
        priorityGlows[camera.priority],
        camera.priority === "High" && "animate-pulse",
        isGlitching && "animate-glitch"
      )}
    >
      {/* Video Element */}
      <div className={cn(
        "absolute inset-0 transition-all duration-700",
        (loading || hasError) ? "scale-110 blur-xl opacity-0" : "scale-100 blur-0 opacity-100"
      )}>
        {!hasError ? (
          <video
            ref={videoRef}
            src={camera.videoPool[videoIndex]}
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={() => setLoading(false)}
            onError={() => {
              setHasError(true);
              setLoading(false);
            }}
            className="w-full h-full object-cover grayscale-[0.2] contrast-125 brightness-90 animate-cctv-zoom"
          />
        ) : (
          <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Activity className="w-12 h-12 text-rose-500/20 animate-pulse" />
              <X className="absolute inset-0 w-12 h-12 text-rose-500" />
            </div>
            <div className="text-center">
              <p className="text-rose-500 font-mono text-xs font-black uppercase tracking-[0.3em]">Signal Lost</p>
              <p className="text-slate-600 font-mono text-[8px] uppercase mt-1">Error: 0x80041001</p>
            </div>
          </div>
        )}
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        
        {/* Motion Detection Box */}
        <AnimatePresence>
          {isMotionDetected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ top: motionPos.top, left: motionPos.left }}
              className="absolute w-24 h-24 border-2 border-rose-500/60 rounded-sm pointer-events-none z-10"
            >
              <div className="absolute -top-6 left-0 bg-rose-600 px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                <Activity className="w-2 h-2" />
                Motion
              </div>
              <div className="absolute inset-0 bg-rose-500/10 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Face Recognition Box */}
        <AnimatePresence>
          {isFaceDetected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ top: facePos.top, left: facePos.left }}
              className="absolute w-16 h-16 border-2 border-indigo-500/60 rounded-full pointer-events-none z-10"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 px-2 py-0.5 rounded-full text-[7px] font-black text-white uppercase tracking-widest flex items-center gap-1 whitespace-nowrap shadow-lg">
                <Shield className="w-2 h-2" />
                ID: {Math.floor(Math.random() * 9000 + 1000)}
              </div>
              <div className="absolute inset-0 bg-indigo-500/5 rounded-full" />
              {/* Scanning line */}
              <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-0.5 bg-indigo-400/40 shadow-[0_0_5px_rgba(99,102,241,0.5)]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading Spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm z-20"
          >
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CCTV Overlays */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none z-10" 
        style={{ background: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "100% 3px" }}
      />
      <div className="absolute inset-0 cctv-noise pointer-events-none z-10" />
      <div className="absolute inset-0 cctv-vignette pointer-events-none z-10" />

      {/* UI Overlays */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none select-none z-20">
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

      {/* Intense Glitch Overlay */}
      <AnimatePresence>
        {isGlitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-50 pointer-events-none mix-blend-overlay"
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isGlitching && Math.random() > 0.5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <span className="text-[10px] font-mono font-black text-white bg-rose-600 px-2 py-1 rounded uppercase tracking-[0.5em] animate-pulse">
              Signal Loss
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const CCTVFeedSimulation = () => {
  const [filter, setFilter] = useState<"All" | "High">("All");
  const [selectedCam, setSelectedCam] = useState<CCTVCamera | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isHighRes, setIsHighRes] = useState(false);
  const [isSwitchingRes, setIsSwitchingRes] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const toggleRes = () => {
    setIsSwitchingRes(true);
    setTimeout(() => {
      setIsHighRes(prev => !prev);
      setIsSwitchingRes(false);
    }, 800);
  };

  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
              ref={modalContainerRef}
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className={cn(
                "relative w-full max-w-6xl bg-slate-950 rounded-none sm:rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]",
                isFullscreen && "max-w-none rounded-none border-none w-screen h-screen"
              )}
            >
              <div className={cn(
                "flex flex-col lg:flex-row h-full",
                isFullscreen && "flex-col"
              )}>
                {/* Large Feed */}
                <div className={cn(
                  "aspect-video relative bg-black group/modal transition-all duration-500",
                  isFullscreen ? "w-full h-full" : "w-full lg:w-3/4"
                )}>
                  <video
                    src={selectedCam.videoPool[0]}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-80 grayscale-[0.1] contrast-125 animate-cctv-zoom"
                  />
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                  
                  <div 
                    className="absolute inset-0 opacity-30 pointer-events-none" 
                    style={{ background: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "100% 4px" }}
                  />
                  <div className="absolute inset-0 cctv-vignette pointer-events-none" />
                  
                  <div className="absolute top-8 left-8 flex flex-col gap-4 z-30">
                    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
                      <div className="w-3 h-3 rounded-full bg-rose-600 animate-blink shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
                      <span className="text-sm font-mono font-black text-white tracking-[0.3em] uppercase">Live</span>
                    </div>
                    <div className="bg-rose-600/20 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-3 border border-rose-500/30">
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Surveillance Mode</span>
                    </div>
                    <div className="bg-black/60 backdrop-blur-xl px-4 py-1.5 rounded-2xl border border-white/10 inline-flex items-center gap-3">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-mono font-bold text-white tracking-widest">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-8 right-8 flex gap-3 z-30">
                    <button 
                      onClick={() => setIsFocused(true)}
                      className="p-3 bg-black/60 hover:bg-indigo-600 text-white rounded-2xl backdrop-blur-xl border border-white/10 transition-all pointer-events-auto"
                      title="Focus Feed"
                    >
                      <Activity className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={toggleFullscreen}
                      className="p-3 bg-black/60 hover:bg-indigo-600 text-white rounded-2xl backdrop-blur-xl border border-white/10 transition-all pointer-events-auto"
                    >
                      {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                    </button>
                    {!isFullscreen && (
                      <button 
                        onClick={() => setSelectedCam(null)}
                        className="p-3 bg-black/60 hover:bg-rose-600 text-white rounded-2xl backdrop-blur-xl border border-white/10 transition-all pointer-events-auto"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    )}
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
                {!isFullscreen && (
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
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isFocused && selectedCam && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFocused(false)}
              className="absolute inset-0 bg-black/98 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-[3rem] overflow-hidden border border-white/20 shadow-[0_0_150px_rgba(99,102,241,0.3)] group/focus"
            >
              <video
                src={selectedCam.videoPool[0]}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                className={cn(
                  "w-full h-full object-cover grayscale-[0.05] contrast-110 brightness-110 transition-all duration-700",
                  !isHighRes && "blur-[2px] opacity-90",
                  isSwitchingRes && "blur-xl opacity-50 scale-105"
                )}
              />
              
              {/* Stream Switching Overlay */}
              <AnimatePresence>
                {isSwitchingRes && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
                      <span className="text-xs font-black text-white uppercase tracking-[0.3em] animate-pulse">Switching Stream...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* HUD Overlays for Focus Mode */}
              <div className="absolute inset-0 opacity-40 pointer-events-none" 
                   style={{ background: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "100% 4px" }} />
              <div className="absolute inset-0 cctv-vignette pointer-events-none" />
              
              <div className="absolute top-10 left-10 flex flex-col gap-4">
                <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10">
                  <div className="w-3 h-3 rounded-full bg-rose-600 animate-blink shadow-[0_0_15px_rgba(225,29,72,1)]" />
                  <span className="text-lg font-mono font-black text-white tracking-[0.4em] uppercase">Focus Feed: {selectedCam.id}</span>
                </div>
                <div className={cn(
                  "backdrop-blur-md px-4 py-2 rounded-full border inline-flex items-center gap-2 transition-all duration-500",
                  isHighRes ? "bg-emerald-600/20 border-emerald-500/30" : "bg-indigo-600/20 border-indigo-500/30"
                )}>
                  {isHighRes ? (
                    <Zap className="w-4 h-4 text-emerald-400 fill-current" />
                  ) : (
                    <Shield className="w-4 h-4 text-indigo-400" />
                  )}
                  <span className={cn(
                    "text-xs font-black uppercase tracking-widest",
                    isHighRes ? "text-emerald-400" : "text-indigo-400"
                  )}>
                    {isHighRes ? "Ultra HD Stream Active" : "Standard Resolution Mode"}
                  </span>
                </div>
              </div>

              <div className="absolute top-10 right-10 flex gap-4">
                <button 
                  onClick={toggleRes}
                  disabled={isSwitchingRes}
                  className={cn(
                    "p-4 rounded-2xl backdrop-blur-xl border border-white/10 transition-all group/btn",
                    isHighRes ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/40" : "bg-black/60 text-slate-400 hover:text-white",
                    isSwitchingRes && "opacity-50 cursor-not-allowed"
                  )}
                  title={isHighRes ? "Switch to Standard Resolution" : "Switch to High Resolution"}
                >
                  <Zap className={cn("w-7 h-7", isHighRes && "fill-current")} />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                    {isHighRes ? "HD Active" : "Go HD"}
                  </span>
                </button>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn(
                    "p-4 rounded-2xl backdrop-blur-xl border border-white/10 transition-all",
                    isMuted ? "bg-black/60 text-slate-400 hover:text-white" : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/40"
                  )}
                >
                  {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
                </button>
                <button 
                  onClick={() => setIsFocused(false)}
                  className="p-4 bg-black/60 hover:bg-rose-600 text-white rounded-2xl backdrop-blur-xl border border-white/10 transition-all"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                <div className="bg-black/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 max-w-xl">
                  <div className="flex items-center gap-4 mb-3">
                    <MapPin className="w-6 h-6 text-indigo-400" />
                    <h4 className="text-2xl font-black text-white uppercase tracking-tight">{selectedCam.name}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-rose-600/20 border border-rose-500/40 rounded-lg text-[10px] font-black text-rose-400 uppercase tracking-widest">
                      {selectedCam.issue}
                    </span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{selectedCam.location}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-4">
                  <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 font-mono text-xl font-black text-white tracking-widest">
                    {new Date().toLocaleTimeString()}
                  </div>
                  <div className="text-[80px] font-mono font-black text-white/5 leading-none select-none">
                    {selectedCam.id}
                  </div>
                </div>
              </div>

              {/* Corner Brackets (Large) */}
              <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-white/40 rounded-tl-xl pointer-events-none" />
              <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-white/40 rounded-tr-xl pointer-events-none" />
              <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-white/40 rounded-bl-xl pointer-events-none" />
              <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-white/40 rounded-br-xl pointer-events-none" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

