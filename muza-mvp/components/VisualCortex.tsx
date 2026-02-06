
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { HyperBit, Language, ConsciousnessType, SubThought } from '../types';
import { TRANSLATIONS, TYPE_LABELS } from '../constants';
import { X, GitMerge, Network } from 'lucide-react';
import { calculateOptics } from '../services/opticsEngine';

interface VisualCortexProps {
  hyperbits: HyperBit[];
  language: Language;
  expanded?: boolean;
  isThinking?: boolean; 
  onMerge?: (id1: string, id2: string) => void;
}

export const VisualCortex = React.memo<VisualCortexProps>(({ hyperbits, language, expanded = false, isThinking = false, onMerge }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language].space;
  
  const [selectedNode, setSelectedNode] = useState<HyperBit | null>(null);
  const [hoveredNode, setHoveredNode] = useState<HyperBit | null>(null);
  const [mergeTarget, setMergeTarget] = useState<HyperBit | null>(null);
  
  // Dragging State
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);

  // OPTIMIZATION: Only render last 100 hyperbits to save GPU/CPU
  const activeHyperbits = useMemo(() => {
      // If expanded (Immersive Space), show more. If widget, show fewer.
      const limit = expanded ? 300 : 80;
      return hyperbits.slice(-limit); 
  }, [hyperbits, expanded]);

  const pointsRef = useRef<{
        x: number, y: number, z: number, 
        x2d: number, y2d: number, scale: number,
        hyperbit: HyperBit,
        baseColor: string
  }[]>([]);

  // Initialize points
  useEffect(() => {
      const currentPoints = pointsRef.current;
      
      const newPoints = activeHyperbits.map((hb) => {
          const existing = currentPoints.find(p => p.hyperbit.id === hb.id);
          // Calculate visual properties using the Engine instead of storing them
          const optics = hb.optics || calculateOptics(hb.type, hb.energy);
          const baseColor = optics.baseColor;

          if (existing) {
              return { ...existing, hyperbit: hb, baseColor };
          }

          const isUser = hb.layer === 'USER_INPUT';
          const baseR = expanded ? 220 : 70;
          const r = isUser ? baseR * 0.2 : baseR * (0.35 + Math.random() * 0.65); 
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos((Math.random() * 2) - 1);
          return {
              x: r * Math.sin(phi) * Math.cos(theta),
              y: r * Math.sin(phi) * Math.sin(theta),
              z: r * Math.cos(phi),
              x2d: 0, y2d: 0, scale: 0,
              hyperbit: hb,
              baseColor
          };
      });

      pointsRef.current = newPoints;
  }, [activeHyperbits, expanded]);

  const drawShape = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, type: ConsciousnessType, layer: string) => {
      const rSafe = Math.max(0.1, size);
      ctx.beginPath();
      
      if (layer === 'USER_INPUT') {
          ctx.arc(x, y, rSafe, 0, Math.PI * 2);
          return;
      }

      switch (type) {
          case ConsciousnessType.CODE:
              ctx.rect(x - rSafe, y - rSafe, rSafe * 2, rSafe * 2);
              break;
          case ConsciousnessType.CREATIVE:
              // Triangle
              ctx.moveTo(x, y - rSafe);
              ctx.lineTo(x + rSafe, y + rSafe);
              ctx.lineTo(x - rSafe, y + rSafe);
              ctx.closePath();
              break;
          case ConsciousnessType.COLLECTIVE:
              // Hexagon
              for (let i = 0; i < 6; i++) {
                  const angle = (i * Math.PI) / 3;
                  ctx.lineTo(x + rSafe * Math.cos(angle), y + rSafe * Math.sin(angle));
              }
              ctx.closePath();
              break;
          default:
              ctx.arc(x, y, rSafe, 0, Math.PI * 2);
      }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true }); // optimize: alpha true required for transparency
    if (!ctx) return;

    const resize = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    };
    resize();
    window.addEventListener('resize', resize);

    let angleX = 0;
    let angleY = 0;
    let animationFrameId: number;
    let time = 0;

    const render = () => {
        time += 0.02;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const fov = expanded ? 500 : 260;
        const zoom = zoomRef.current;
        const pan = panRef.current;

        if (!isDraggingRef.current) {
            angleX += 0.0005;
            angleY += 0.001;
        }

        // Project points
        pointsRef.current.forEach(p => {
            let x = p.x;
            let y = p.y;
            let z = p.z;

            // Rotation
            const cosY = Math.cos(angleY);
            const sinY = Math.sin(angleY);
            const cosX = Math.cos(angleX);
            const sinX = Math.sin(angleX);

            let x1 = x * cosY - z * sinY;
            let z1 = z * cosY + x * sinY;
            let y1 = y * cosX - z1 * sinX;
            let z2 = z1 * cosX + y * sinX;

            const scale = fov / (fov + z2);
            p.x2d = cx + (x1 * scale * zoom) + pan.x;
            p.y2d = cy + (y1 * scale * zoom) + pan.y;
            p.scale = scale * zoom;
        });

        pointsRef.current.sort((a, b) => a.scale - b.scale);

        // Draw Nodes
        pointsRef.current.forEach(p => {
            if (p.scale < 0) return; // Behind camera

            if (isThinking) ctx.globalAlpha = 0.3; 
            
            const size = Math.max(1, (3 + (p.hyperbit.energy * 5)) * p.scale);
            const color = p.baseColor;
            const isSelected = selectedNode?.id === p.hyperbit.id;
            const isHovered = hoveredNode?.id === p.hyperbit.id;

            // Node Glow
            if (isSelected || isHovered) {
                const glow = ctx.createRadialGradient(p.x2d, p.y2d, 0, p.x2d, p.y2d, size * 4);
                glow.addColorStop(0, color);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(p.x2d, p.y2d, size * 4, 0, Math.PI*2);
                ctx.fill();
            }

            ctx.fillStyle = isSelected ? '#fff' : color;
            drawShape(ctx, p.x2d, p.y2d, size, p.hyperbit.type, p.hyperbit.layer);
            ctx.fill();

            // Connectors (Only if expanded to save Perf)
            if (expanded && p.hyperbit.connections) {
                 ctx.strokeStyle = color;
                 ctx.lineWidth = 0.5 * p.scale;
                 ctx.globalAlpha = 0.3 * p.scale;
                 p.hyperbit.connections.forEach(targetId => {
                     const target = pointsRef.current.find(pt => pt.hyperbit.id === targetId);
                     if (target && target.scale > 0) {
                         ctx.beginPath();
                         ctx.moveTo(p.x2d, p.y2d);
                         ctx.lineTo(target.x2d, target.y2d);
                         ctx.stroke();
                     }
                 });
                 ctx.globalAlpha = 1;
            }
        });

        animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, [activeHyperbits, expanded, isThinking, selectedNode, hoveredNode]);

  // Mouse Handlers (Simplified for performance)
  const handleMouseMove = (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isPanningRef.current) {
          const dx = x - lastMouseRef.current.x;
          const dy = y - lastMouseRef.current.y;
          panRef.current = { x: panRef.current.x + dx, y: panRef.current.y + dy };
          lastMouseRef.current = { x, y };
          return;
      }

      // Find closest node (Spatial Hashing would be better but simple loop ok for <300 nodes)
      // Check active points only
      let hit = null;
      // Iterate backwards (draw order)
      for(let i = pointsRef.current.length - 1; i >= 0; i--) {
          const p = pointsRef.current[i];
          if(p.scale <= 0) continue;
          const dist = Math.sqrt(Math.pow(p.x2d - x, 2) + Math.pow(p.y2d - y, 2));
          if(dist < 20 * p.scale) {
              hit = p;
              break;
          }
      }
      
      setHoveredNode(hit ? hit.hyperbit : null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      lastMouseRef.current = { x, y };

      if (hoveredNode) {
          setSelectedNode(hoveredNode);
          isPanningRef.current = false;
      } else {
          setSelectedNode(null);
          isPanningRef.current = true;
      }
  };

  const handleMouseUp = () => {
      isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
      const next = Math.max(0.4, Math.min(2.8, zoomRef.current + (delta > 0 ? -0.08 : 0.08)));
      zoomRef.current = next;
  };

  const handleDoubleClick = () => {
      panRef.current = { x: 0, y: 0 };
      zoomRef.current = 1;
  };

  return (
    <div className="w-full h-full relative bg-slate-950/50 overflow-hidden" ref={containerRef}>
        <canvas 
            ref={canvasRef} 
            className="block w-full h-full cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
        />
        {expanded && (
            <div className="absolute top-4 left-4 text-[10px] text-slate-400 bg-black/40 border border-white/10 px-3 py-2 rounded-lg pointer-events-none">
                {t.controlsHint || 'Controls: wheel = zoom, drag = pan, double‑click = reset'}
            </div>
        )}
        
        <div className="absolute top-4 left-4 pointer-events-none">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-slate-900/80 px-2 py-1 rounded inline-flex items-center gap-2 border border-cyan-500/30 backdrop-blur-sm">
                <Network className="w-3 h-3" />
                {t.title} <span className="text-slate-500">{t.activeShort ? t.activeShort(activeHyperbits.length) : `(${activeHyperbits.length} active)`}</span>
            </h3>
        </div>

        {selectedNode && (
            <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-700 p-4 rounded-xl max-w-xs backdrop-blur-md animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase">{TYPE_LABELS[language][selectedNode.type]}</span>
                    <button onClick={() => setSelectedNode(null)}><X className="w-4 h-4 text-slate-500" /></button>
                </div>
                <p className="text-xs text-slate-300 line-clamp-3 mb-2">{selectedNode.content}</p>
                {mergeTarget && (
                    <button 
                        onClick={() => onMerge && onMerge(selectedNode.id, mergeTarget.id)}
                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2"
                    >
                        <GitMerge className="w-3 h-3" /> {t.mergeBtn}
                    </button>
                )}
            </div>
        )}
    </div>
  );
});
