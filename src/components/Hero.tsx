'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState<3 | 4>(3);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev === 3 ? 4 : 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#11181a] flex flex-col items-center pt-24 pb-16 px-4 gap-12 md:gap-16 overflow-x-hidden">
      
      {/* PANEL 1 - TOP */}
      <motion.div 
         initial={{ opacity: 0, y: 20 }} 
         animate={{ opacity: 1, y: 0 }} 
         transition={{ duration: 0.8 }}
         className="text-center z-20 mt-4 md:mt-8 max-w-3xl px-2"
      >
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 tracking-[0.1em] text-poster-accent-bright uppercase drop-shadow-lg leading-tight">
          "I Will Pour Out<br/>My Spirit"
        </h2>
        <p className="text-base md:text-xl font-light text-slate-200 italic mb-4 drop-shadow">
          An Outpouring. An Awakening. A Generation Arising.
        </p>
        <p className="text-sm md:text-base font-bold tracking-[0.3em] text-poster-accent uppercase drop-shadow">
          Acts 2:17-18
        </p>
      </motion.div>

      {/* POSTER CONTAINER */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative w-full aspect-[2835/3544] flex-shrink-0 z-10 drop-shadow-2xl"
        style={{ maxHeight: '75vh', maxWidth: 'calc(75vh * (2835 / 3544))' }}
      >
        {/* LAYER 1 - Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image src="/hero/layer-1.png" alt="Revival Background" fill priority className="object-contain" />
        </div>

        {/* LAYER 2 - Midground/Subject */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <Image src="/hero/layer-2.png" alt="Revival Subject" fill priority className="object-contain" />
        </div>

        {/* LAYER 3 & 4 - Alternating Text Details */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {currentSlide === 3 && (
              <motion.div
                key="slide3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image src="/hero/layer-3-v2.png" alt="Event Details 1" fill priority className="object-contain" />
              </motion.div>
            )}
            {currentSlide === 4 && (
              <motion.div
                key="slide4"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image src="/hero/layer-4-v2.png" alt="Event Details 2" fill priority className="object-contain" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hero Overlay Button */}
        <div className="absolute inset-0 z-30 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[6.5%] md:bottom-[7%] left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <button 
              onClick={() => document.getElementById('itinerary')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-poster-accent hover:bg-poster-accent-bright text-poster-bg px-6 py-2 md:px-8 md:py-2.5 rounded-sm font-bold uppercase tracking-[0.15em] text-xs md:text-sm hover:-translate-y-0.5 transition-all duration-300 shadow-[0_0_15px_rgba(140,174,176,0.3)] hover:shadow-[0_0_25px_rgba(164,197,198,0.5)] whitespace-nowrap"
            >
              Discover More
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* PANEL 2 - BOTTOM */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.8 }}
        className="text-center z-20 max-w-2xl mx-auto mt-4 px-2"
      >
        <p className="text-lg md:text-2xl font-semibold mb-6 md:mb-8 text-white tracking-wide">
          This conference is a space to:
        </p>
        
        <ul className="text-left space-y-4 text-base md:text-lg text-slate-300 mb-10 md:mb-12 max-w-md mx-auto">
          <li className="flex items-start gap-3">
            <span className="text-poster-accent-bright mt-0.5">✦</span> Encounter the Holy Spirit deeply
          </li>
          <li className="flex items-start gap-3">
            <span className="text-poster-accent-bright mt-0.5">✦</span> Discover and stir up your calling
          </li>
          <li className="flex items-start gap-3">
            <span className="text-poster-accent-bright mt-0.5">✦</span> Be activated in your gifts and purpose
          </li>
          <li className="flex items-start gap-3">
            <span className="text-poster-accent-bright mt-0.5">✦</span> Receive fresh vision for this season
          </li>
          <li className="flex items-start gap-3">
            <span className="text-poster-accent-bright mt-0.5">✦</span> Build alongside a generation hungry for God
          </li>
        </ul>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
          <p className="text-base md:text-xl text-white font-medium italic mb-4">
            "Come expecting not just information, but transformation."
          </p>
          <p className="text-poster-accent-bright font-bold text-sm md:text-base uppercase tracking-[0.15em] leading-relaxed">
            A generation marked by His presence will become a generation that carries His power.
          </p>
        </div>
      </motion.div>

      {/* Gradient Blend to Page Background */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#263336] to-transparent z-10 pointer-events-none" />
    </div>
  );
}
