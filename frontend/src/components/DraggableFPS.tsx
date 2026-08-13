"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useArgusStore } from '@/store/useArgusStore';

export default function DraggableFPS() {
  const showFPS = useArgusStore(s => s.showFPS);
  const [fps, setFps] = useState(0);
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  useEffect(() => {
    if (!showFPS) return;
    let frames = 0;
    let lastTime = performance.now();
    let frameId: number;
    
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      frameId = requestAnimationFrame(loop);
    };
    
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [showFPS]);

  if (!showFPS) return null;

  return (
    <div 
      className="fixed z-[9999] bg-card/80 border border-primary text-primary px-3 py-1 font-mono text-sm rounded cursor-move select-none shadow-[0_0_10px_rgba(6,182,212,0.5)] backdrop-blur-md"
      style={{ left: position.x, top: position.y }}
      onMouseDown={(e) => {
        setIsDragging(true);
        dragRef.current = { startX: e.clientX, startY: e.clientY, initialX: position.x, initialY: position.y };
      }}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={(e) => {
        if (isDragging && dragRef.current) {
          setPosition({
            x: dragRef.current.initialX + (e.clientX - dragRef.current.startX),
            y: dragRef.current.initialY + (e.clientY - dragRef.current.startY)
          });
        }
      }}
    >
      <span className="font-bold">{fps}</span> FPS
    </div>
  );
}
