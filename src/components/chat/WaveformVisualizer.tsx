import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  waveform: number[];
  isActive: boolean;
  className?: string;
  color?: string;
  barCount?: number;
}

export function WaveformVisualizer({ 
  waveform, 
  isActive, 
  className,
  color = 'hsl(var(--primary))',
  barCount = 50
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Set up drawing style
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      
      const barWidth = width / barCount;
      const maxBarHeight = height * 0.8;
      
      // Draw waveform bars
      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((waveform.length * i) / barCount);
        let barHeight = 4; // Minimum height
        
        if (dataIndex < waveform.length && waveform[dataIndex] !== undefined) {
          barHeight = Math.max(4, waveform[dataIndex] * maxBarHeight);
        }
        
        const x = i * barWidth;
        const y = (height - barHeight) / 2;
        
        // Add some animation for active recording
        if (isActive) {
          const wave = Math.sin(Date.now() * 0.01 + i * 0.1) * 2;
          barHeight += wave;
        }
        
        ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
      }
      
      if (isActive) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveform, isActive, color, barCount]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.addEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full h-full", className)}
      style={{ width: '100%', height: '100%' }}
    />
  );
}