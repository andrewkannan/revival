'use client';

import React from 'react';
import { motion } from 'framer-motion';

const schedule = [
  {
    day: 'Day 1',
    date: 'Friday • 26 June 2026',
    events: [
      { time: '7:30pm - 10pm', title: 'Session 1 - Night Rally', description: '' }
    ]
  },
  {
    day: 'Day 2',
    date: 'Saturday • 27 June 2026',
    events: [
      { time: '9am - 12pm', title: 'Session 2', description: '' },
      { time: '1:30pm - 3pm', title: 'Breakout Sessions', description: 'Auditorium 2: Revival in Marketplace\nAuditorium 3: Hosting the Glory' },
      { time: '7:00pm - 10pm', title: 'Session 3 - Night Rally', description: '' }
    ]
  },
  {
    day: 'Day 3',
    date: 'Sunday • 28 June 2026',
    events: [
      { time: '9am - 12pm', title: 'Session 4', description: '' }
    ]
  }
];

export default function Itinerary() {
  return (
    <section id="itinerary" className="py-32 px-6 md:px-12 max-w-4xl mx-auto text-white relative scroll-mt-20">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-poster-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="text-center mb-24 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-3xl md:text-5xl font-extrabold mb-6 tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-poster-accent-bright to-white"
        >
          Itinerary
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 font-light text-lg tracking-wide max-w-xl mx-auto"
        >
          Plan your weekend. Here's what we have in store for the REVIVAL conference.
        </motion.p>
      </div>

      <div className="relative ml-4 md:ml-12 z-10">
        {/* Continuous sleek line */}
        <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        <div className="space-y-20">
          {schedule.map((dayPlan, dayIndex) => (
            <div key={dayPlan.day} className="relative">
              {/* Sleek animated glowing dot for the day */}
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="absolute -left-[5px] top-2 w-3 h-3 rounded-full bg-poster-accent-bright shadow-[0_0_15px_rgba(140,174,176,0.8)]"
              >
                <div className="absolute inset-0 bg-poster-accent-bright rounded-full animate-ping opacity-40" />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="pl-10 md:pl-16 mb-10 flex flex-col md:flex-row md:items-end gap-2 md:gap-4"
              >
                <h3 className="text-3xl md:text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-poster-accent-bright to-white uppercase">
                  {dayPlan.day}
                </h3>
                <span className="text-sm md:text-base font-semibold tracking-widest text-slate-400 uppercase md:pb-1">
                  {dayPlan.date}
                </span>
              </motion.div>

              <div className="space-y-8 pl-10 md:pl-16">
                {dayPlan.events.map((event, eventIndex) => (
                  <motion.div 
                    key={event.title + event.time}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: eventIndex * 0.1, duration: 0.5, ease: "easeOut" }}
                    className="group relative bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] rounded-3xl p-6 md:p-8 backdrop-blur-md hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-poster-accent/5 overflow-hidden"
                  >
                    {/* Hover glare effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10">
                      <div className="inline-flex px-4 py-1.5 rounded-full bg-poster-accent/10 border border-poster-accent/20 text-poster-accent-bright text-xs font-bold tracking-widest uppercase">
                        {event.time}
                      </div>
                      <h4 className="text-xl md:text-2xl font-semibold text-white/95 tracking-wide">
                        {event.title}
                      </h4>
                    </div>
                    
                    {event.description && (
                      <p className="text-slate-400 font-light leading-relaxed relative z-10 whitespace-pre-line mt-4">
                        {event.description}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
