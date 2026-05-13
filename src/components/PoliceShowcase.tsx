import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Shield, Star, Users, ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const showcaseItems = [
  {
    id: 'cm',
    name: "Thiru Vijay",
    title: "Hon'ble Chief Minister of Tamil Nadu",
    role: "Visionary Leadership",
    desc: "Leading the 'New Era' of governance with a focus on transparency, youth empowerment, and digital transformation across the state.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Vijay_at_the_Bigil_Audio_Launch.jpg/640px-Vijay_at_the_Bigil_Audio_Launch.jpg",
    achievement: "State-wide Implementation of AI-Gov Initiative",
    accent: "bg-indigo-600"
  },
  {
    id: 'dgp',
    name: "Thiru Shankar Jiwal, IPS",
    title: "Director General of Police, Tamil Nadu",
    role: "Departmental Head",
    desc: "Leading the modernization of the state police force with AI-driven surveillance and real-time response frameworks.",
    image: "https://images.livemint.com/img/2023/06/29/600x338/Shankar_Jiwal_1688049132103_1688049132279.jpg",
    achievement: "President's Police Medal for Distinguished Service",
    accent: "bg-amber-600"
  },
  {
    id: 'achieve1',
    name: "Project Sentinel",
    title: "AI-Powered Surveillance",
    role: "Departmental Milestone",
    desc: "Installation of over 5 lakh CCTV cameras across major cities integrated with facial recognition and motion analytics.",
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=2070&auto=format&fit=crop",
    achievement: "40% Reduction in Street Crime Rates",
    accent: "bg-emerald-600"
  },
  {
    id: 'achieve2',
    name: "Modern Response Force",
    title: "Swift Action Teams",
    role: "Public Excellence",
    desc: "Launching 'Drive For Safety' - reducing emergency response time to under 10 minutes in urban centers.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Tamil_Nadu_Police_Vehicle.jpg/640px-Tamil_Nadu_Police_Vehicle.jpg",
    achievement: "ISO 9001:2018 Certified Police Units",
    accent: "bg-rose-600"
  }
];

export const PoliceShowcase = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % showcaseItems.length);
  };

  const prev = () => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + showcaseItems.length) % showcaseItems.length);
  };

  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, []);

  const current = showcaseItems[index];

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em]"
          >
            <Flag className="w-4 h-4" />
            Institutional Excellence
          </motion.div>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter">Pride of TN Police</h2>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={prev}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button 
            onClick={next}
            className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="relative h-[600px] md:h-[500px] overflow-hidden rounded-[3rem] glass-card border border-slate-200/60 dark:border-slate-800/60">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 50 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col md:flex-row"
          >
            {/* Image Section */}
            <div className="w-full md:w-5/12 h-64 md:h-full relative overflow-hidden bg-slate-100 dark:bg-slate-900">
              <motion.img 
                src={current.image}
                alt={current.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={current.id}
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-transparent to-white dark:to-slate-950/40" />
              <div className="absolute inset-0 bg-indigo-600/5 mix-blend-overlay" />
            </div>

            {/* Content Section */}
            <div className="w-full md:w-7/12 p-8 md:p-16 flex flex-col justify-center space-y-6 relative">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cn("self-start px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg", current.accent)}
              >
                {current.role}
              </motion.div>

              <div className="space-y-2">
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter"
                >
                  {current.name}
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg font-bold text-indigo-600 dark:text-indigo-400"
                >
                  {current.title}
                </motion.p>
              </div>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed max-w-xl font-medium"
              >
                {current.desc}
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800"
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Notable Achievement</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{current.achievement}</p>
                </div>
              </motion.div>

              {/* Progress Dots */}
              <div className="flex gap-2 mt-8">
                {showcaseItems.map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setDirection(i > index ? 1 : -1);
                      setIndex(i);
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      index === i ? "w-8 bg-indigo-600" : "w-1.5 bg-slate-200 dark:bg-slate-800"
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
