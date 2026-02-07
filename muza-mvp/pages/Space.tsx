
import React, { useEffect, useRef, useState } from 'react';
import { 
  select, 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide, 
  drag,
  forceX,
  forceY,
  zoom,
  zoomIdentity,
  line
} from 'd3';
import { HyperBit, Language } from '../types';
import { TYPE_COLORS, TRANSLATIONS } from '../constants';
import { Database, Clock, Network, Search, Layers, Infinity, CirclePlay, CirclePause } from 'lucide-react';

interface SpaceProps {
  hyperbits: HyperBit[];
  language: Language;
}

type VisualMode = 'NETWORK' | 'SEMANTIC_CLUSTERS' | 'TIMELINE' | 'OUROBOROS';

export const Space = React.memo<SpaceProps>(({ hyperbits, language }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<VisualMode>('NETWORK');
  const [search, setSearch] = useState('');
  const [timeProgress, setTimeProgress] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const t = TRANSLATIONS[language].space;
  const isTimeMode = mode === 'TIMELINE' || mode === 'OUROBOROS';

  useEffect(() => {
    if (!isTimeMode) setIsPlaying(false);
  }, [isTimeMode]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setTimeProgress((prev) => {
        const next = prev + 0.008;
        return next > 1 ? 0 : next;
      });
    }, 60);
    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (!svgRef.current || hyperbits.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    select(svgRef.current).selectAll("*").remove();

    const svg = select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("cursor", "grab");

    const viewport = svg.append("g").attr("class", "viewport");
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.8])
      .on("zoom", (event) => {
        viewport.attr("transform", event.transform);
      });

    svg.call(zoomBehavior as any);
    svg.on("dblclick", () => {
      svg.transition().duration(250).call(zoomBehavior.transform, zoomIdentity);
    });

    // --- MODE: SEMANTIC_CLUSTERS (v3.0) ---
    if (mode === 'SEMANTIC_CLUSTERS') {
         const nodes = hyperbits.map(d => ({ ...d }));
         
         // Create clusters centers
         const types = [...new Set(hyperbits.map(h => h.type))];
         const centers: Record<string, {x: number, y: number}> = {};
         types.forEach((type, i) => {
             const angle = (i / types.length) * 2 * Math.PI;
             const r = 250;
             centers[type] = {
                 x: width/2 + r * Math.cos(angle),
                 y: height/2 + r * Math.sin(angle)
             };
         });

         const simulation = forceSimulation(nodes as any)
            .force("charge", forceManyBody().strength(-10))
            .force("collide", forceCollide().radius(15))
            .force("x", forceX((d: any) => centers[d.type]?.x || width/2).strength(0.1))
            .force("y", forceY((d: any) => centers[d.type]?.y || height/2).strength(0.1));

         const node = viewport.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", (d: any) => 6 + Math.max(0, Math.min(1, d.energy || 0.3)) * 10)
            .attr("fill", (d: any) => TYPE_COLORS[d.type as keyof typeof TYPE_COLORS])
            .attr("opacity", (d: any) => 0.4 + Math.max(0.2, Math.min(1, d.energy || 0.4)));
            
         node.append("title").text((d: any) => d.content || '');

         node.on("click", (_event: any, d: any) => {
            if (!d || !d.content) return;
            const detail = `«${d.content}»\n${language === 'ru' ? 'Энергия' : 'Energy'}: ${Math.round((d.energy || 0) * 100)}% • ${d.type}`;
            const hint = language === 'ru' ? 'Узел' : 'Node';
            window.dispatchEvent(new CustomEvent('muza:node:focus', { detail: { title: hint, text: detail, id: d.id } }));
         });
         // Add Cluster Labels
         viewport.append("g")
            .selectAll("text")
            .data(types)
            .join("text")
            .attr("x", d => centers[d].x)
            .attr("y", d => centers[d].y - 30)
            .text(d => d)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "12px")
            .attr("font-weight", "bold");

         simulation.on("tick", () => {
             nodes.forEach((d: any) => {
                d.x = Math.max(20, Math.min(width - 20, d.x));
                d.y = Math.max(20, Math.min(height - 20, d.y));
             });
             node
                .attr("cx", (d: any) => d.x)
                .attr("cy", (d: any) => d.y);
         });
         return;
    }

    // --- MODE: TIMELINE (v3.0) ---
    if (mode === 'TIMELINE') {
        const sorted = [...hyperbits].sort((a, b) => a.timestamp - b.timestamp);
        const margin = 50;
        const timeScale = (i: number) => margin + (i / (sorted.length - 1 || 1)) * (width - margin * 2);
        const minT = sorted[0]?.timestamp || 0;
        const maxT = sorted[sorted.length - 1]?.timestamp || 1;
        const span = Math.max(1, maxT - minT);
        const cutoff = Math.max(0.01, timeProgress);
        const visible = sorted.filter(d => ((d.timestamp - minT) / span) <= cutoff);
        const cursorIndex = Math.floor((sorted.length - 1) * cutoff);
        
        // Draw Axis
        viewport.append("line")
            .attr("x1", margin)
            .attr("y1", height/2)
            .attr("x2", width - margin)
            .attr("y2", height/2)
            .attr("stroke", "#475569")
            .attr("stroke-width", 2);

        // Cursor
        viewport.append("line")
            .attr("x1", timeScale(cursorIndex))
            .attr("y1", height/2 - 30)
            .attr("x2", timeScale(cursorIndex))
            .attr("y2", height/2 + 30)
            .attr("stroke", "#0ea5e9")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4 4")
            .attr("opacity", 0.8);
            
        viewport.append("g")
            .selectAll("circle")
            .data(sorted)
            .join("circle")
            .attr("cx", (d, i) => timeScale(i))
            .attr("cy", height/2)
            .attr("r", (d: any) => {
                const e = Math.max(0, Math.min(1, d.energy || 0.3));
                return visible.includes(d) ? 4 + e * 6 : 3;
            })
            .attr("fill", d => TYPE_COLORS[d.type as keyof typeof TYPE_COLORS])
            .attr("opacity", (d: any) => {
                const base = 0.25 + Math.max(0.2, Math.min(1, d.energy || 0.3)) * 0.5;
                return visible.includes(d) ? base : 0.2;
            })
            .append("title")
            .text(d => d.content);
            
        // Labels (alternate up/down)
        viewport.append("g")
            .selectAll("text")
            .data(visible)
            .join("text")
            .attr("x", (d, i) => timeScale(i))
            .attr("y", (d, i) => height/2 + (i % 2 === 0 ? -20 : 30))
            .text(d => new Date(d.timestamp).toLocaleTimeString())
            .attr("text-anchor", "middle")
            .attr("fill", "#94a3b8")
            .attr("font-size", "9px");
            
        return;
    }

    // --- MODE: OUROBOROS SPIRAL (v4.0) ---
    if (mode === 'OUROBOROS') {
        const sorted = [...hyperbits].sort((a, b) => a.timestamp - b.timestamp);
        const minT = sorted[0]?.timestamp || 0;
        const maxT = sorted[sorted.length - 1]?.timestamp || 1;
        const span = Math.max(1, maxT - minT);
        const cutoff = Math.max(0.02, timeProgress);

        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) * 0.42;
        const minRadius = Math.min(width, height) * 0.08;
        const turns = 4.5;

        const positionFor = (t: number) => {
          const angle = t * turns * Math.PI * 2;
          const radius = minRadius + t * (maxRadius - minRadius);
          return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          };
        };

        const nodes = sorted.map((d) => {
          const t = (d.timestamp - minT) / span;
          const pos = positionFor(t);
          return { ...d, t, x: pos.x, y: pos.y };
        });

        const visible = nodes.filter((d) => d.t <= cutoff);
        const pathLine = line<any>().x((d) => d.x).y((d) => d.y);

        // Ouroboros ring
        viewport.append("circle")
          .attr("cx", centerX)
          .attr("cy", centerY)
          .attr("r", minRadius)
          .attr("fill", "none")
          .attr("stroke", "#1f2937")
          .attr("stroke-width", 1.2)
          .attr("opacity", 0.8);

        // Spiral path (visible)
        viewport.append("path")
          .attr("d", pathLine(visible))
          .attr("fill", "none")
          .attr("stroke", "#334155")
          .attr("stroke-width", 1.3)
          .attr("opacity", 0.85);

        // Nodes
        const nodeGroup = viewport.append("g")
          .selectAll("circle")
          .data(nodes)
          .join("circle")
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
          .attr("r", (d: any) => {
              const e = Math.max(0, Math.min(1, d.energy || 0.3));
              return d.t <= cutoff ? 3.5 + e * 6.5 : 3;
          })
          .attr("fill", (d) => TYPE_COLORS[d.type as keyof typeof TYPE_COLORS])
          .attr("opacity", (d: any) => {
              const base = 0.25 + Math.max(0.2, Math.min(1, d.energy || 0.3)) * 0.5;
              return d.t <= cutoff ? base : 0.2;
          })
          .append("title")
          .text((d) => d.content);

        nodeGroup.on("click", (_event: any, d: any) => {
          if (!d || !d.content) return;
          const detail = `«${d.content}»\n${language === 'ru' ? 'Энергия' : 'Energy'}: ${Math.round((d.energy || 0) * 100)}% • ${d.type}`;
          const hint = language === 'ru' ? 'Узел' : 'Node';
          window.dispatchEvent(new CustomEvent('muza:node:focus', { detail: { title: hint, text: detail, id: d.id } }));
        });

        // Head marker
        const head = visible[visible.length - 1];
        if (head) {
          viewport.append("circle")
            .attr("cx", head.x)
            .attr("cy", head.y)
            .attr("r", 12)
            .attr("fill", "none")
            .attr("stroke", "#22d3ee")
            .attr("stroke-width", 2)
            .attr("opacity", 0.9);
        }
        return;
    }

    // --- MODE: STANDARD NETWORK (v1/v2) ---
    const nodes = hyperbits.map(d => ({ ...d }));
    const links: any[] = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            if (nodes[i].type === nodes[j].type) {
                links.push({ source: nodes[i].id, target: nodes[j].id });
            }
        }
    }

    const simulation = forceSimulation(nodes as any)
      .force("link", forceLink(links).id((d: any) => d.id).distance(80))
      .force("charge", forceManyBody().strength(-120))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide().radius(16));

    const link = viewport.append("g")
      .attr("stroke", "#334155")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    const node = viewport.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", (d: any) => 10 + (d.energy * 20))
      .attr("fill", (d: any) => TYPE_COLORS[d.type as keyof typeof TYPE_COLORS])
      .attr("fill-opacity", 0.2)
      .attr("stroke", "none");

    node.append("circle")
      .attr("r", 6)
      .attr("fill", (d: any) => TYPE_COLORS[d.type as keyof typeof TYPE_COLORS])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    node.append("text")
      .text((d: any) => (d.content ? d.content.substring(0, 15) + "..." : ""))
      .attr("x", 12)
      .attr("y", 4)
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .style("pointer-events", "none");

    node.append("title").text((d: any) => d.content || '');

    node.on("click", (_event: any, d: any) => {
      if (!d || !d.content) return;
      const detail = `«${d.content}»\n${language === 'ru' ? 'Энергия' : 'Energy'}: ${Math.round((d.energy || 0) * 100)}% • ${d.type}`;
      const hint = language === 'ru' ? 'Узел' : 'Node';
      window.dispatchEvent(new CustomEvent('muza:node:focus', { detail: { title: hint, text: detail, id: d.id } }));
    });

    simulation.on("tick", () => {
      nodes.forEach((d: any) => {
        d.x = Math.max(20, Math.min(width - 20, d.x));
        d.y = Math.max(20, Math.min(height - 20, d.y));
      });
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [hyperbits, mode, timeProgress]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
      
      {/* HUD Controls */}
      <div className="absolute top-4 left-4 z-10 glass-panel p-4 rounded-xl flex flex-col gap-3">
        <div>
            <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                <Database className="w-5 h-5" />
                {t.title}
            </h2>
            <p className="text-xs text-slate-400">{t.subtitle(hyperbits.length)}</p>
        </div>
        
        {/* Search */}
        <div className="relative">
            <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-500" />
            <input 
                type="text" 
                placeholder={language === 'ru' ? 'Глубокий поиск...' : 'Deep Search...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 pl-6 py-1 text-xs text-white focus:border-cyan-500 outline-none"
            />
        </div>

        {/* View Modes */}
        <div className="flex gap-2">
            <button 
                onClick={() => setMode('NETWORK')} 
                className={`p-2 rounded hover:bg-slate-700 ${mode === 'NETWORK' ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-400'}`}
                title={language === 'ru' ? 'Нейронная сеть' : 'Neural Network'}
            >
                <Network className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setMode('SEMANTIC_CLUSTERS')} 
                className={`p-2 rounded hover:bg-slate-700 ${mode === 'SEMANTIC_CLUSTERS' ? 'bg-purple-900/50 text-purple-400' : 'text-slate-400'}`}
                title={language === 'ru' ? 'Семантические кластеры (v3.0)' : 'Semantic Clusters (v3.0)'}
            >
                <Layers className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setMode('TIMELINE')} 
                className={`p-2 rounded hover:bg-slate-700 ${mode === 'TIMELINE' ? 'bg-orange-900/50 text-orange-400' : 'text-slate-400'}`}
                title={language === 'ru' ? 'Хронологическая линия' : 'Chronological Timeline'}
            >
                <Clock className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setMode('OUROBOROS')} 
                className={`p-2 rounded hover:bg-slate-700 ${mode === 'OUROBOROS' ? 'bg-emerald-900/50 text-emerald-400' : 'text-slate-400'}`}
                title={language === 'ru' ? 'Уроборос‑спираль времени' : 'Ouroboros Time Spiral'}
            >
                <Infinity className="w-4 h-4" />
            </button>
        </div>

        {isTimeMode && (
          <div className="mt-1 p-2 rounded-lg border border-slate-700 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying((v) => !v)}
                className="p-1 rounded hover:bg-slate-800 text-slate-300"
                title={isPlaying ? (language === 'ru' ? 'Пауза' : 'Pause') : (language === 'ru' ? 'Проиграть' : 'Play')}
              >
                {isPlaying ? <CirclePause className="w-4 h-4" /> : <CirclePlay className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={timeProgress}
                onChange={(e) => setTimeProgress(Number(e.target.value))}
                className="w-40 accent-cyan-400"
              />
              <span className="text-[10px] text-slate-400 w-10 text-right">{Math.round(timeProgress * 100)}%</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {language === 'ru' ? 'Время/эволюция' : 'Time/Evolution'}
            </div>
          </div>
        )}
      </div>
      
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
});
