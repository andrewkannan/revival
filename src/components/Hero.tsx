'use client';

import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { motion } from 'framer-motion';

export default function Hero() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    // module aliases
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      MouseConstraint = Matter.MouseConstraint,
      Mouse = Matter.Mouse,
      Composite = Matter.Composite,
      Bodies = Matter.Bodies,
      Events = Matter.Events;

    // create an engine
    const engine = Engine.create();
    engineRef.current = engine;
    const world = engine.world;

    // dimensions
    const width = sceneRef.current.clientWidth;
    const height = sceneRef.current.clientHeight;

    // create a renderer
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      },
    });

    Render.run(render);

    // create runner
    const runner = Runner.create();
    Runner.run(runner, engine);

    // add boundaries
    const wallOptions = { 
      isStatic: true, 
      render: { fillStyle: 'transparent' } 
    };
    
    const ground = Bodies.rectangle(width / 2, height + 50, width * 2, 100, wallOptions);
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 2, wallOptions);
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 2, wallOptions);
    const ceiling = Bodies.rectangle(width / 2, -100, width * 2, 100, wallOptions);

    Composite.add(world, [ground, leftWall, rightWall, ceiling]);

    // add bodies
    const colors = ['#1e293b', '#334155', '#475569', '#cbd5e1', '#0f172a'];
    
    const bodies: Matter.Body[] = [];
    for (let i = 0; i < 40; i++) {
      const radius = 20 + Math.random() * 30;
      const x = Math.random() * width;
      const y = -100 - Math.random() * 800; // start above screen
      
      const isCircle = Math.random() > 0.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      let body;
      if (isCircle) {
        body = Bodies.circle(x, y, radius, {
          restitution: 0.6,
          friction: 0.1,
          render: {
            fillStyle: color,
            strokeStyle: '#ffffff20',
            lineWidth: 1
          }
        });
      } else {
        const width = radius * 2;
        const height = radius * 1.5;
        body = Bodies.rectangle(x, y, width, height, {
          chamfer: { radius: 10 },
          restitution: 0.6,
          friction: 0.1,
          render: {
            fillStyle: color,
            strokeStyle: '#ffffff20',
            lineWidth: 1
          }
        });
      }
      bodies.push(body);
    }
    
    Composite.add(world, bodies);

    // add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false,
        },
      },
    });

    Composite.add(world, mouseConstraint);
    
    // keep the mouse in sync with rendering
    render.mouse = mouse;

    // Handle resize
    const handleResize = () => {
      if (!sceneRef.current) return;
      
      const newWidth = sceneRef.current.clientWidth;
      const newHeight = sceneRef.current.clientHeight;
      
      render.canvas.width = newWidth;
      render.canvas.height = newHeight;
      render.options.width = newWidth;
      render.options.height = newHeight;
      
      // Update ground and walls
      Matter.Body.setPosition(ground, { x: newWidth / 2, y: newHeight + 50 });
      Matter.Body.setPosition(rightWall, { x: newWidth + 50, y: newHeight / 2 });
    };

    window.addEventListener('resize', handleResize);

    // cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
        render.canvas.remove();
      }
      Composite.clear(world, false);
      Engine.clear(engine);
    };
  }, []);

  return (
    <div className="relative w-full h-[80vh] min-h-[600px] overflow-hidden bg-black text-white rounded-b-3xl">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black z-0" />
      
      {/* Matter.js Canvas Container */}
      <div 
        ref={sceneRef} 
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
      />
      
      {/* Hero Content Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium backdrop-blur-md mb-6 inline-block">
            2026 Registration Open
          </span>
        </motion.div>
        
        <motion.h1 
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          REVIVAL
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 font-light"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          Secure your place at the most anticipated conference of the year. 
          Minimalist design, maximum impact.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto"
        >
          <button className="bg-white text-black px-8 py-4 rounded-full font-medium hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
            Register Now
          </button>
        </motion.div>
      </div>
    </div>
  );
}
