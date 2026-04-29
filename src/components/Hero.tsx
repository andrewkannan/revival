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
    <div className="relative w-full h-[90vh] min-h-[700px] overflow-hidden bg-black text-white">
      {/* LAYER 1 - Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero/layer-1.png"
          alt="Revival Background"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* LAYER 2 - Midground/Subject */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Image
          src="/hero/layer-2.png"
          alt="Revival Subject"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* LAYER 3 & 4 - Alternating Text Details */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <AnimatePresence>
          {currentSlide === 3 && (
            <motion.div
              key="slide3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src="/hero/layer-3-v2.png"
                alt="Event Details 1"
                fill
                priority
                className="object-cover object-center"
              />
            </motion.div>
          )}
          {currentSlide === 4 && (
            <motion.div
              key="slide4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src="/hero/layer-4-v2.png"
                alt="Event Details 2"
                fill
                priority
                className="object-cover object-center"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gradient Blend to Page Background */}
      <div className="absolute bottom-0 left-0 right-0 h-48 md:h-64 bg-gradient-to-t from-[#263336] to-transparent z-20 pointer-events-none" />

      {/* Hero Overlay Button */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-[22%] md:bottom-[18%] left-1/2 -translate-x-1/2 pointer-events-auto"
        >
          <button 
            onClick={() => document.getElementById('itinerary')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-poster-accent hover:bg-poster-accent-bright text-poster-bg px-8 py-3 md:px-10 md:py-4 rounded-sm font-bold uppercase tracking-[0.15em] text-sm md:text-base hover:-translate-y-1 transition-all duration-300 shadow-[0_0_30px_rgba(140,174,176,0.3)] hover:shadow-[0_0_40px_rgba(164,197,198,0.5)] whitespace-nowrap"
          >
            Discover More
          </button>
        </motion.div>
      </div>
    </div>
  );
}
