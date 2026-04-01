import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useLocation,
  Navigate
} from "react-router-dom";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend
} from "recharts";
import { 
  AlertCircle, CheckCircle2, Clock, MapPin, User, Send, 
  BarChart3, LayoutDashboard, FileText, Globe, Mic, Search,
  Menu, X, ShieldAlert, TrendingUp, Info, Cpu, Activity, Zap,
  ChevronRight, ArrowUpRight, Shield, Brain, Workflow, Database,
  Filter, ExternalLink, Trash2, Edit3, MoreVertical, Moon, Sun,
  Upload, Camera, ShieldCheck, Lock, Eye, Phone, Key, Map as MapIcon,
  Navigation, Languages, AlertTriangle, RefreshCcw
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { CCTVFeedSimulation } from "./components/CCTVFeed";
import { GrievanceMap } from "./components/GrievanceMap";

// Fix Leaflet default icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// --- CONTEXTS ---
interface CitizenAuth {
  mobile: string | null;
  token: string | null;
  login: (mobile: string, token: string) => void;
  logout: () => void;
}

const CitizenAuthContext = createContext<CitizenAuth | undefined>(undefined);

const HighlightText = ({ text, keywords }: { text: string; keywords?: string[] }) => {
  if (!keywords || keywords.length === 0) return <>{text}</>;

  // Create a regex to match all keywords (case-insensitive)
  // Sort by length descending to match longer phrases first
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
  const escapedKeywords = sortedKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1 rounded font-bold border-b-2 border-indigo-500/30">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

const useCitizenAuth = () => {
  const context = useContext(CitizenAuthContext);
  if (!context) throw new Error("useCitizenAuth must be used within a CitizenAuthProvider");
  return context;
};

const CitizenAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [mobile, setMobile] = useState<string | null>(localStorage.getItem("citizen_mobile"));
  const [token, setToken] = useState<string | null>(localStorage.getItem("citizen_token"));

  const login = (m: string, t: string) => {
    setMobile(m);
    setToken(t);
    localStorage.setItem("citizen_mobile", m);
    localStorage.setItem("citizen_token", t);
  };

  const logout = () => {
    setMobile(null);
    setToken(null);
    localStorage.removeItem("citizen_mobile");
    localStorage.removeItem("citizen_token");
  };

  return (
    <CitizenAuthContext.Provider value={{ mobile, token, login, logout }}>
      {children}
    </CitizenAuthContext.Provider>
  );
};

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENTS ---

const Navbar = ({ 
  darkMode, 
  setDarkMode, 
  userRole, 
  setUserRole 
}: { 
  darkMode: boolean, 
  setDarkMode: (v: boolean) => void,
  userRole: string,
  setUserRole: (v: string) => void
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const citizenAuth = useCitizenAuth();

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/submit", label: "Report" },
    { path: "/status", label: "Track" },
    { path: "/dashboard", label: "Admin" },
  ];

  const handleLogout = () => {
    if (userRole === "Admin") {
      setUserRole("Citizen");
      localStorage.removeItem("admin_token");
    } else {
      citizenAuth.logout();
    }
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <nav className="nav-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Grievance<span className="text-indigo-600">AI</span></span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Smart Policing Platform</span>
            </div>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                    location.pathname === link.path 
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Role Switcher / Auth State */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                {userRole === "Admin" ? (
                  <button 
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white shadow-sm flex items-center gap-2"
                  >
                    <Lock className="w-3 h-3" /> Admin Logout
                  </button>
                ) : citizenAuth.token ? (
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <span className="text-[10px] font-bold text-slate-500">{citizenAuth.mobile}</span>
                    <button 
                      onClick={handleLogout}
                      className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Link 
                      to="/citizen-login"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        location.pathname === "/citizen-login" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Citizen Login
                    </Link>
                    <Link 
                      to="/login"
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        location.pathname === "/login" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Admin
                    </Link>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link to="/submit" className="bg-slate-900 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors shadow-lg shadow-slate-200 dark:shadow-none">
                Get Help
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-600 dark:text-slate-400"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600 dark:text-slate-400">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "block px-4 py-3 rounded-xl text-base font-bold transition-all",
                      location.pathname === link.path ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between px-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Role</span>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button 
                      onClick={() => { setUserRole("Citizen"); setIsMenuOpen(false); }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        userRole === "Citizen" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400"
                      )}
                    >
                      Citizen
                    </button>
                    {userRole === "Admin" ? (
                      <button 
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white shadow-sm"
                      >
                        Logout
                      </button>
                    ) : (
                      <Link 
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          location.pathname === "/login" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400"
                        )}
                      >
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-auto pt-20 pb-10 overflow-hidden"
    >
      {/* Premium Background Effects */}
      <div className="absolute inset-0 -z-10">
        <motion.div 
          animate={{ 
            opacity: [0.03, 0.08, 0.03],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] blur-3xl"
        />
      </div>

      {/* Subtle Divider */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="glass-card rounded-[3rem] p-10 sm:p-16 border border-white/20 dark:border-slate-800/40 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-none relative overflow-hidden group">
          {/* Animated Mesh Gradients */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-1000" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full group-hover:bg-violet-500/20 transition-all duration-1000" />

          <div className="flex flex-col items-center text-center relative z-10">
            {/* Branding */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 mb-12 cursor-pointer"
            >
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tighter text-slate-900 dark:text-white">Grievance<span className="text-indigo-600">AI</span></span>
            </motion.div>

            {/* Center-aligned Credits Section */}
            <div className="space-y-8 max-w-2xl">
              <div className="flex flex-col items-center gap-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mb-2"
                >
                  <span className="text-lg leading-none">✨</span>
                  Designed & Developed By
                  <span className="text-lg leading-none">✨</span>
                </motion.div>
                
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
                  {["Tharun R", "Rahulprasad V", "Rohithraj Y"].map((name, i) => (
                    <React.Fragment key={name}>
                      <motion.span 
                        whileHover={{ 
                          scale: 1.1,
                          textShadow: "0 0 20px rgba(99,102,241,0.5)"
                        }}
                        className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 transition-all duration-300 cursor-default"
                      >
                        {name}
                      </motion.span>
                      {i < 2 && (
                        <span className="text-slate-300 dark:text-slate-700 text-2xl font-light mx-2">•</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <motion.div 
                  whileHover={{ y: -2 }}
                  className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 transition-all mt-4"
                >
                  <span className="text-xl">🎓</span>
                  <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400">
                    SKP Engineering College, Tiruvannamalai
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="w-full mt-16 pt-10 border-t border-slate-100 dark:border-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col items-center md:items-start gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  © {currentYear} GrievanceAI Framework. All rights reserved.
                </p>
                <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400/60 uppercase tracking-tighter">
                  <span className="hover:text-indigo-500 cursor-pointer transition-colors">Privacy Policy</span>
                  <span className="w-1 h-1 bg-slate-300 dark:bg-slate-800 rounded-full" />
                  <span className="hover:text-indigo-500 cursor-pointer transition-colors">Terms of Service</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {[
                  { icon: Globe, label: "Global Network" },
                  { icon: Shield, label: "Encrypted" },
                  { icon: Activity, label: "System Status" }
                ].map((item) => (
                  <motion.div 
                    key={item.label}
                    whileHover={{ y: -5, scale: 1.1 }}
                    className="group/icon relative p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all shadow-sm"
                  >
                    <item.icon className="w-5 h-5 text-slate-400 group-hover/icon:text-indigo-600 transition-colors" />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[8px] font-black rounded-lg opacity-0 group-hover/icon:opacity-100 transition-all pointer-events-none uppercase tracking-widest whitespace-nowrap shadow-xl">
                      {item.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

// --- REAL-TIME ISSUES CAROUSEL COMPONENTS ---

const useImageFetcher = (category: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
      
      // Unsplash keys are typically 40+ characters. 
      // If it's missing, placeholder, or too short, use fallback immediately.
      const isInvalidKey = !accessKey || 
                          accessKey === "YOUR_UNSPLASH_ACCESS_KEY" || 
                          accessKey.trim().length < 10;

      if (isInvalidKey) {
        setImageUrl(`https://picsum.photos/seed/${category}/800/600`);
        setLoading(false);
        return;
      }

      // Check cache
      const cacheKey = `img_cache_${category}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setImageUrl(cached);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`https://api.unsplash.com/search/photos`, {
          params: { query: category, per_page: 1, orientation: "landscape" },
          headers: { Authorization: `Client-ID ${accessKey}` }
        });
        const url = response.data.results[0]?.urls?.regular || `https://picsum.photos/seed/${category}/800/600`;
        setImageUrl(url);
        localStorage.setItem(cacheKey, url);
      } catch (err: any) {
        // Silently handle 401/403 as they are common config issues
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          console.error("Image fetch error:", err);
        }
        setError(true);
        setImageUrl(`https://picsum.photos/seed/${category}/800/600`);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [category]);

  return { imageUrl, loading, error };
};

const IssueCard = ({ issue }: { issue: any }) => {
  const { imageUrl, loading } = useImageFetcher(issue.category);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div 
      whileHover={{ 
        y: -5, 
        scale: 1.01,
        boxShadow: "0 20px 40px -20px rgba(99, 102, 241, 0.3)"
      }}
      className="glass-card rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 group h-full flex flex-col relative"
    >
      <div className="relative h-48 sm:h-56 overflow-hidden">
        {/* Shimmer Loading */}
        {(loading || !imageLoaded) && (
          <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 animate-shimmer" />
        )}
        
        <motion.img 
          src={imageUrl || undefined} 
          alt={issue.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          initial={{ scale: 1.2, filter: "blur(10px)" }}
          animate={{ 
            scale: imageLoaded ? 1 : 1.2, 
            filter: imageLoaded ? "blur(0px)" : "blur(10px)" 
          }}
          transition={{ duration: 0.8 }}
          className={cn(
            "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
            !imageLoaded && "opacity-0"
          )}
          referrerPolicy="no-referrer"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        
        {/* Priority Badge */}
        <div className="absolute top-4 right-4">
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md",
            issue.priority === "High" 
              ? "bg-rose-500/90 text-white ring-4 ring-rose-500/20 animate-pulse" 
              : issue.priority === "Medium" 
                ? "bg-amber-500/90 text-white" 
                : "bg-emerald-500/90 text-white"
          )}>
            {issue.priority}
          </div>
        </div>

        {/* Time Badge */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-[10px] font-bold text-white/90 uppercase tracking-tighter">
          <Clock className="w-3 h-3" />
          {issue.time}
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">
            {issue.category}
          </span>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors">
          {issue.title}
        </h3>

        <div className="mt-auto pt-4 flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
          <MapPin className="w-3.5 h-3.5" />
          {issue.location}
        </div>
      </div>
    </motion.div>
  );
};

const RealTimeCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const issues = [
    { id: 1, title: "Major Road Blockage", category: "accident", location: "Highway 101, North", priority: "High", time: "2 mins ago" },
    { id: 2, title: "Suspicious Activity Reported", category: "theft", location: "Central Park West", priority: "Medium", time: "15 mins ago" },
    { id: 3, title: "Illegal Waste Dumping", category: "garbage", location: "Industrial Zone B", priority: "Low", time: "45 mins ago" },
    { id: 4, title: "Street Light Malfunction", category: "streetlight", location: "Oak Street", priority: "Low", time: "1 hour ago" },
    { id: 5, title: "Water Main Burst", category: "infrastructure", location: "5th Avenue", priority: "High", time: "5 mins ago" },
  ];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % issues.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, issues.length]);

  return (
    <section className="max-w-7xl mx-auto px-4 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em]">
            <Activity className="w-4 h-4" />
            Live Monitoring
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter">Real-Time Issues</h2>
        </div>
        <div className="flex gap-2">
          {issues.map((_, i) => (
            <button 
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                activeIndex === i ? "w-8 bg-indigo-600" : "w-2 bg-slate-200 dark:bg-slate-800"
              )}
            />
          ))}
        </div>
      </div>

      <div 
        className="relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div 
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${activeIndex * (100 / (window.innerWidth < 768 ? 1 : 3))}%)` }}
        >
          {issues.map((issue) => (
            <div key={issue.id} className="w-full md:w-1/3 flex-shrink-0 px-3">
              <IssueCard issue={issue} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- PAGES ---

const LandingPage = () => {
  return (
    <div className="space-y-32 py-20">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest"
        >
          <Zap className="w-3.5 h-3.5" />
          Next-Gen Public Safety
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]"
        >
          AI-Based Police <span className="gradient-text">Grievance System</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed"
        >
          Automate complaint classification, prioritize critical issues, and streamline law enforcement workflows with our intelligent NLP framework.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link to="/submit" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center gap-3">
            Submit Complaint
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link to="/dashboard" className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3">
            Admin Dashboard
            <ExternalLink className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Brain, title: "Intelligent Classification", desc: "Automatically categorizes complaints into departments like Theft, Cybercrime, or Assault using BERT-based models." },
          { icon: TrendingUp, title: "Priority Scoring", desc: "Real-time urgency calculation based on semantic intensity, ensuring life-threatening cases are handled first." },
          { icon: ShieldCheck, title: "Secure & Transparent", desc: "End-to-end encrypted grievance handling with real-time tracking for citizens and automated logs for audits." }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 rounded-[2.5rem] hover:shadow-xl transition-all group"
          >
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
              <feature.icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Real-Time Issues Carousel */}
      <RealTimeCarousel />

      {/* Trust Section */}
      <section className="max-w-5xl mx-auto px-4 text-center space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Trusted by Law Enforcement</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Our framework is designed to integrate seamlessly with existing police infrastructure.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center justify-center gap-2 font-black text-2xl">POLICE_DEPT</div>
          <div className="flex items-center justify-center gap-2 font-black text-2xl">GOV_TECH</div>
          <div className="flex items-center justify-center gap-2 font-black text-2xl">SAFETY_FIRST</div>
          <div className="flex items-center justify-center gap-2 font-black text-2xl">SECURE_CITY</div>
        </div>
      </section>
    </div>
  );
};

const SubmitComplaintForm = () => {
  const [text, setText] = useState("");
  const [citizenName, setCitizenName] = useState("");
  const [location, setLocation] = useState("");
  const [geoData, setGeoData] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Input, 2: Preview/AI
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();
  const citizenAuth = useCitizenAuth();

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGeoData({ lat: latitude, lng: longitude });
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.data.display_name) {
            setLocation(res.data.display_name);
            setGeoData({ lat: latitude, lng: longitude, address: res.data.display_name });
          }
        } catch (e) {
          console.warn("Reverse geocoding failed", e);
        } finally {
          setIsLocating(false);
          toast.success("Location captured!");
        }
      },
      (error) => {
        setIsLocating(false);
        toast.error("Failed to get location: " + error.message);
      }
    );
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenAuth.token) {
      toast.error("Please login to submit a complaint");
      navigate("/citizen-login");
      return;
    }
    if (!text) return;
    
    setLoading(true);
    try {
      const res = await axios.post("/api/predict", { complaint_text: text });
      setPrediction(res.data);
      setStep(2);
    } catch (error) {
      toast.error("AI Analysis failed. Using fallback.");
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post("/api/grievances", {
        text,
        citizenName,
        citizenMobile: citizenAuth.mobile,
        location,
        geoData,
        ...prediction
      }, {
        headers: { 
          "x-user-role": "Citizen",
          "x-user-mobile": citizenAuth.mobile
        }
      });
      toast.success("Grievance submitted successfully!");
      navigate("/status");
    } catch (error) {
      toast.error("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
          <ShieldCheck className="w-4 h-4" /> Secure Reporting Portal
        </div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Report a <span className="text-indigo-600">Grievance</span></h2>
        <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium">Your report will be analyzed by AI and routed to the correct department.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-card p-8 rounded-[2.5rem] space-y-8"
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Your Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Full Name"
                        value={citizenName}
                        onChange={(e) => setCitizenName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Incident Location</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Address or Landmark"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                        />
                      </div>
                      <button 
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-200 transition-all disabled:opacity-50"
                        title="Use Current Location"
                      >
                        {isLocating ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Navigation className="w-6 h-6" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Describe the Issue</label>
                    <div className="relative">
                      <Edit3 className="absolute left-4 top-6 w-5 h-5 text-slate-400" />
                      <textarea 
                        rows={5}
                        placeholder="Provide details about the incident... (English or Tamil)"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-6 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAnalyze}
                  disabled={loading || !text}
                  className="w-full py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <>Analyze with AI <Brain className="w-5 h-5" /></>}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8 rounded-[2.5rem] space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Analysis Result</h3>
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Edit Report</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{prediction?.category}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Priority</p>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        prediction?.priority === "High" ? "bg-rose-500" : prediction?.priority === "Medium" ? "bg-amber-500" : "bg-emerald-500"
                      )} />
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{prediction?.priority}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">AI Explanation</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-4">
                    {prediction?.explanation}
                  </p>
                  {prediction?.keywords && prediction.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {prediction.keywords.map((k: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-white dark:bg-slate-800 rounded-lg text-[9px] font-black text-indigo-600 uppercase tracking-tighter border border-indigo-100 dark:border-indigo-900">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Summary</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{prediction?.summary}"
                  </p>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <>Confirm & Submit Report <CheckCircle2 className="w-5 h-5" /></>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" /> Guidelines
            </h4>
            <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1 shrink-0" /> Be as descriptive as possible.</li>
              <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1 shrink-0" /> Attach photos if available (coming soon).</li>
              <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1 shrink-0" /> False reports are punishable by law.</li>
            </ul>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Shield className="w-20 h-20" />
            </div>
            <h4 className="font-bold mb-2 relative z-10">Emergency?</h4>
            <p className="text-xs text-slate-400 mb-4 relative z-10">If this is a life-threatening emergency, call 100 immediately.</p>
            <a href="tel:100" className="inline-flex items-center gap-2 text-indigo-400 font-bold text-sm hover:underline relative z-10">
              Call Police <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComplaintStatusPage = () => {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const citizenAuth = useCitizenAuth();

  useEffect(() => {
    if (!citizenAuth.mobile) {
      setLoading(false);
      return;
    }
    const fetchMyGrievances = async () => {
      try {
        const res = await axios.get("/api/grievances", {
          headers: { 
            "x-user-role": "Citizen",
            "x-user-mobile": citizenAuth.mobile
          }
        });
        setGrievances(res.data);
      } catch (err) {
        toast.error("Failed to fetch grievance status");
      } finally {
        setLoading(false);
      }
    };
    fetchMyGrievances();
  }, [citizenAuth.mobile]);

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="mb-12">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Track Your Reports</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Real-time status updates on your submitted grievances.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : grievances.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {grievances.map((g) => (
            <motion.div 
              key={g.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">#{g.id}</span>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{g.category}</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  <HighlightText text={g.summary || g.text} keywords={g.keywords} />
                </h4>
                {g.keywords && g.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {g.keywords.map((k: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-[8px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                        {k}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(g.timestamp).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {g.location}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <div className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border",
                  g.status === "Pending" ? "bg-slate-50 text-slate-500 border-slate-200" : 
                  g.status === "In Progress" ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                )}>
                  {g.status}
                </div>
                <p className="text-[10px] font-bold text-slate-400 italic">Last updated: Just now</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-card rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
          <FileText className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No reports found for your account.</p>
          <Link to="/submit" className="text-indigo-600 font-bold hover:underline mt-4 inline-block">Submit your first report</Link>
        </div>
      )}
    </div>
  );
};

const DashboardPage = ({ userRole }: { userRole: string }) => {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [selectedGrievance, setSelectedGrievance] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [userRole]);

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/grievances", {
        headers: { "x-user-role": userRole }
      });
      setGrievances(res.data);
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to fetch data";
      toast.error(msg);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/api/grievances/${id}`, { status }, {
        headers: { "x-user-role": userRole }
      });
      toast.success(`Status updated to ${status}`);
      fetchData();
      if (selectedGrievance?.id === id) {
        setSelectedGrievance({ ...selectedGrievance, status });
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || "Update failed";
      toast.error(msg);
    }
  };

  const filteredData = useMemo(() => {
    return grievances.filter(g => {
      const matchesSearch = 
        g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.citizenName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === "All" || g.priority === filterPriority;
      const matchesCategory = filterCategory === "All" || g.category === filterCategory;
      return matchesSearch && matchesPriority && matchesCategory;
    });
  }, [grievances, searchQuery, filterPriority, filterCategory]);

  const stats = useMemo(() => {
    const total = grievances.length;
    const high = grievances.filter(g => g.priority === "High").length;
    const resolved = grievances.filter(g => g.status === "Resolved").length;
    const pending = grievances.filter(g => g.status === "Pending").length;
    
    // Category data for chart
    const catMap: any = {};
    grievances.forEach(g => {
      catMap[g.category] = (catMap[g.category] || 0) + 1;
    });
    const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

    // Priority data for chart
    const prioData = [
      { name: "High", value: high, color: "#f43f5e" },
      { name: "Medium", value: grievances.filter(g => g.priority === "Medium").length, color: "#f59e0b" },
      { name: "Low", value: grievances.filter(g => g.priority === "Low").length, color: "#10b981" },
    ];

    return { total, high, resolved, pending, categoryData, prioData };
  }, [grievances]);

  const grievancesWithGeo = useMemo(() => {
    return grievances.filter(g => g.geoData && g.geoData.lat && g.geoData.lng);
  }, [grievances]);

  const categories = ["All", ...new Set(grievances.map(g => g.category))];

  return (
    <div className="space-y-10 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and monitor active police grievances.</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search complaints..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500 transition-all text-sm font-medium dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500 text-sm font-bold text-slate-600 dark:text-slate-400"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select 
            className="px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500 text-sm font-bold text-slate-600 dark:text-slate-400"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Reports", value: stats.total, icon: FileText, color: "indigo" },
          { label: "High Priority", value: stats.high, icon: ShieldAlert, color: "rose" },
          { label: "In Progress", value: grievances.filter(g => g.status === "In Progress").length, icon: Clock, color: "amber" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "emerald" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5"
          >
            <div className={cn(
              "p-4 rounded-2xl",
              stat.color === "indigo" ? "bg-indigo-50 text-indigo-600" :
              stat.color === "rose" ? "bg-rose-50 text-rose-600" :
              stat.color === "amber" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
            )}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Chart */}
        <div className="glass-card p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" /> Category Distribution
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} />
                <Tooltip 
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                  cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Map View */}
        <GrievanceMap 
          grievances={grievancesWithGeo} 
          onMarkerClick={(g) => setSelectedGrievance(g)} 
        />
      </div>

      {/* CCTV Simulation Section */}
      <CCTVFeedSimulation />

      <div className="grid grid-cols-1 gap-6">
        {filteredData.length > 0 ? filteredData.map((g, i) => (
          <motion.div 
            layout
            key={g.id} 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: i * 0.05, 
              duration: 0.5,
              ease: [0.21, 0.47, 0.32, 0.98]
            }}
            whileHover={{ 
              y: -8, 
              scale: 1.015,
              boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.4), 0 0 25px 0 rgba(99, 102, 241, 0.15)"
            }}
            whileTap={{ scale: 0.995 }}
            className="glass-card p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all duration-300 flex flex-col md:flex-row gap-8 items-start md:items-center group cursor-pointer relative overflow-hidden"
            onClick={() => setSelectedGrievance(g)}
          >
            {/* Subtle Glow Background Effect */}
            <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/10 group-hover:via-indigo-500/5 group-hover:to-transparent transition-all duration-500 -z-10" />
            
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">#{g.id}</span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{g.category}</span>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                  g.priority === "High" ? "bg-rose-50 text-rose-600" : g.priority === "Medium" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {g.priority} Priority
                </div>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                <HighlightText text={g.summary || g.text} keywords={g.keywords} />
              </h4>
              <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> {g.citizenName}</span>
                <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {g.location}</span>
                <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {new Date(g.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-4 w-full md:w-auto">
              <div className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border",
                g.status === "Pending" ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500" : 
                g.status === "In Progress" ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600" : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600"
              )}>
                {g.status}
              </div>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="py-20 text-center space-y-4">
            <Search className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No complaints found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedGrievance && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGrievance(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 sm:p-12">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl",
                      selectedGrievance.priority === "High" ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
                    )}>
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Complaint Details</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID: #{selectedGrievance.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedGrievance(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedGrievance.category}</p>
                    </div>
                    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Priority</p>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          selectedGrievance.priority === "High" ? "bg-rose-500" : "bg-indigo-500"
                        )} />
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedGrievance.priority}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">AI Summary</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{selectedGrievance.summary || selectedGrievance.text}"
                    </p>
                  </div>

                  {selectedGrievance.keywords && selectedGrievance.keywords.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">AI Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedGrievance.keywords.map((k: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Description</p>
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                      <HighlightText text={selectedGrievance.text} keywords={selectedGrievance.keywords} />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 dark:border-slate-900">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Status Update</p>
                    <div className="flex flex-wrap gap-3">
                      {["Pending", "In Progress", "Resolved"].map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(selectedGrievance.id, status)}
                          className={cn(
                            "px-5 py-2.5 rounded-xl text-xs font-bold transition-all border",
                            selectedGrievance.status === status 
                              ? "bg-indigo-600 text-white border-indigo-600" 
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-600 hover:text-indigo-600"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
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

const NeuralBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    <div className="absolute top-0 left-0 w-full h-full subtle-grid opacity-40" />
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.1, 0.2, 0.1],
        x: [0, 50, 0],
        y: [0, 30, 0]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px]"
    />
    <motion.div 
      animate={{ 
        scale: [1, 1.3, 1],
        opacity: [0.1, 0.15, 0.1],
        x: [0, -40, 0],
        y: [0, -20, 0]
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-[120px]"
    />
  </div>
);

// --- MAIN APP ---

const ProtectedRoute = ({ children, role, allowedRoles }: { children: React.ReactNode, role: string, allowedRoles: string[] }) => {
  if (!allowedRoles.includes(role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-[2.5rem] border border-rose-100 dark:border-rose-800">
          <Lock className="w-12 h-12 text-rose-600 dark:text-rose-400 mx-auto" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Access Restricted</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md">
            You need <span className="text-indigo-600 font-bold">Admin</span> privileges to view the dashboard. 
            Please log in with an administrator account to proceed.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <Link to="/login" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none">
            Admin Login
          </Link>
          <Link to="/" className="text-slate-500 font-bold hover:underline flex items-center gap-2 justify-center">
            Return to Home <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

// --- AUTH COMPONENTS ---

const CitizenLoginPage = () => {
  const [mobile, setMobile] = useState(() => sessionStorage.getItem("temp_mobile") || "");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(() => sessionStorage.getItem("temp_step") === "2" ? 2 : 1); // 1: Mobile, 2: OTP
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const citizenAuth = useCitizenAuth();

  useEffect(() => {
    sessionStorage.setItem("temp_mobile", mobile);
    sessionStorage.setItem("temp_step", step.toString());
  }, [mobile, step]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mobile || mobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/otp/send", { mobile });
      toast.success(`OTP sent to your mobile number: ${res.data.otp}`);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/otp/verify", { mobile, otp });
      citizenAuth.login(mobile, res.data.token);
      sessionStorage.removeItem("temp_mobile");
      sessionStorage.removeItem("temp_step");
      toast.success("Login successful!");
      navigate("/submit");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-800"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Citizen Login</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Verify your identity to report grievances</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="tel"
                  required
                  placeholder="Enter 10-digit mobile"
                  value={mobile}
                  maxLength={10}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <button 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Enter OTP</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  required
                  placeholder="Enter 4-digit code"
                  value={otp}
                  maxLength={4}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Sent to {mobile}. 
                <button type="button" onClick={() => setStep(1)} className="text-indigo-600 font-bold ml-1">Change</button>
                <span className="mx-1">|</span>
                <button type="button" onClick={() => handleSendOtp()} className="text-indigo-600 font-bold">Resend</button>
              </p>
            </div>
            <button 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

const LoginPage = ({ setUserRole }: { setUserRole: (v: string) => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Dummy Authentication Logic
    setTimeout(() => {
      if (email === "admin@police.gov" && password === "admin123") {
        setUserRole("Admin");
        toast.success("Welcome back, Administrator");
        navigate("/dashboard");
      } else {
        toast.error("Invalid credentials. Hint: admin@police.gov / admin123");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 md:p-16 rounded-[3rem] w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl mb-6">
            <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Portal</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Secure access for law enforcement officials.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                required
                placeholder="admin@police.gov"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none transition-all font-medium dark:text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none transition-all font-medium dark:text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Login to Dashboard"}
            {!loading && <ChevronRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Restricted Access Area
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return true; // Default to dark theme as requested
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("userRole") || "Citizen";
  });

  useEffect(() => {
    localStorage.setItem("userRole", userRole);
  }, [userRole]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <CitizenAuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col transition-colors duration-500 selection:bg-indigo-500 selection:text-white">
          <Toaster position="top-right" richColors closeButton />
          <NeuralBackground />
          
          <Navbar 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            userRole={userRole} 
            setUserRole={setUserRole} 
          />
          
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/submit" element={<SubmitComplaintForm />} />
              <Route path="/status" element={<ComplaintStatusPage />} />
              <Route path="/citizen-login" element={<CitizenLoginPage />} />
              <Route path="/login" element={<LoginPage setUserRole={setUserRole} />} />
              <Route path="/dashboard" element={
                <ProtectedRoute role={userRole} allowedRoles={["Admin"]}>
                  <DashboardPage userRole={userRole} />
                </ProtectedRoute>
              } />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </CitizenAuthProvider>
  );
}
