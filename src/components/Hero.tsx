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
      Bodies = Matter.Bodies;

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

    // add bodies using poster colors
    // We use the dark slate, muted cyan, and white.
    const colors = ['#8caeb0', '#a4c5c6', '#2c3a3e', '#ffffff'];
    
    const bodies: Matter.Body[] = [];
    for (let i = 0; i < 35; i++) {
      const radius = 15 + Math.random() * 30;
      const x = Math.random() * width;
      const y = -100 - Math.random() * 800; // start above screen
      
      const isCircle = Math.random() > 0.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      let body;
      if (isCircle) {
        body = Bodies.circle(x, y, radius, {
          restitution: 0.8,
          friction: 0.05,
          render: {
            fillStyle: color,
            strokeStyle: '#00000020',
            lineWidth: 1
          }
        });
      } else {
        const w = radius * 2.5;
        const h = radius * 0.8;
        body = Bodies.rectangle(x, y, w, h, {
          chamfer: { radius: 4 },
          restitution: 0.6,
          friction: 0.1,
          render: {
            fillStyle: color,
            strokeStyle: '#00000020',
            lineWidth: 1
          }
        });
      }
      bodies.push(body);
    }

    // Create a few larger, dramatic text-block-like shapes dropping down
    const textBlocks: Matter.Body[] = [];
    const textColors = ['#8caeb0', '#ffffff', '#a4c5c6'];
    for(let i=0; i<6; i++) {
        const body = Bodies.rectangle(Math.random() * width, -200 - Math.random() * 400, 140, 45, {
          chamfer: { radius: 2 },
          restitution: 0.5,
          friction: 0.1,
          render: {
            fillStyle: textColors[i % textColors.length],
            strokeStyle: '#1c272a',
            lineWidth: 2
          }
        });
        textBlocks.push(body);
    }

    Composite.add(world, [...bodies, ...textBlocks]);

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

    // Prevent Matter.js from hijacking page scroll
    mouse.element.removeEventListener("mousewheel", (mouse as any).mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", (mouse as any).mousewheel);
    mouse.element.removeEventListener('touchmove', (mouse as any).mousemove);
    mouse.element.removeEventListener('touchstart', (mouse as any).mousedown);
    mouse.element.removeEventListener('touchend', (mouse as any).mouseup);

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
    <div className="relative w-full h-[90vh] min-h-[700px] overflow-hidden bg-poster-bg text-white">
      {/* Background Poster Aesthetic - Massive Vertical Text */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center opacity-20 pointer-events-none select-none">
        <div className="text-[25vw] font-black text-poster-accent leading-none tracking-tighter mix-blend-screen -rotate-6 md:rotate-0 flex whitespace-nowrap opacity-30">
          REVIVAL
        </div>
      </div>
      
      {/* Subtle radial glow overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-poster-bg-light/40 via-poster-bg/80 to-poster-bg z-0 pointer-events-none" />

      {/* Matter.js Canvas Container */}
      <div 
        ref={sceneRef} 
        className="absolute inset-0 z-10"
      />
      
      {/* Hero Content Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-end p-6 md:p-12 pb-24 max-w-7xl mx-auto">
        
        {/* Top Detail */}
        <motion.div 
           className="absolute top-10 right-8 md:top-16 md:right-12 text-right"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, delay: 0.6 }}
        >
            <p className="text-poster-accent text-sm md:text-base font-bold tracking-[0.3em] uppercase drop-shadow-md">THEME: ACTS 2:17-18</p>
        </motion.div>

        {/* Main Title Group */}
        <div className="flex flex-col md:flex-row md:items-end justify-between w-full">
            <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="px-4 py-1.5 rounded bg-poster-accent/20 border border-poster-accent/30 text-poster-accent-bright text-xs font-bold tracking-[0.2em] backdrop-blur-md mb-6 inline-block uppercase shadow-lg">
                    Registration Open
                  </span>
                </motion.div>
                
                <motion.h1 
                  className="text-7xl md:text-8xl lg:text-[11rem] font-black tracking-tighter mb-2 text-poster-accent drop-shadow-2xl"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{ lineHeight: 0.85 }}
                >
                  REVIVAL
                </motion.h1>
                <motion.h2 
                  className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tighter text-white drop-shadow-lg"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  2026
                </motion.h2>
            </div>

            <div className="mt-12 md:mt-0 flex flex-col items-start md:items-end space-y-6">
                <motion.div 
                    className="text-left md:text-right"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    <p className="text-white font-bold text-lg md:text-xl uppercase tracking-[0.2em] drop-shadow-md">Location</p>
                    <p className="text-poster-accent-bright md:text-lg font-medium tracking-wide">LEVEL 8, MENARA ZURICH</p>
                </motion.div>
                
                <motion.div 
                    className="text-left md:text-right"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <p className="text-white font-bold text-lg md:text-xl uppercase tracking-[0.2em] drop-shadow-md">Date</p>
                    <p className="text-poster-accent-bright md:text-lg font-medium tracking-wide">26-28 JUNE</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-auto pt-6"
                >
                  <button className="bg-poster-accent hover:bg-poster-accent-bright text-poster-bg px-12 py-5 rounded-sm font-bold uppercase tracking-[0.15em] hover:-translate-y-1 transition-all duration-300 shadow-[0_0_30px_rgba(140,174,176,0.3)] hover:shadow-[0_0_40px_rgba(164,197,198,0.5)]">
                    Register Now
                  </button>
                </motion.div>
            </div>
        </div>
      </div>
    </div>
  );
}
