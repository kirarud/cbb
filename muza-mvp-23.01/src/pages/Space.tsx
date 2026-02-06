

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3'; // Import all as d3 namespace for ESM compatibility if named exports fail
import { HyperBit, Language } from '../types';
import { TYPE_COLORS, TRANSLATIONS } from '../constants';
import { Database, Clock, Network, Layers } from 'lucide-react';
import { Tooltip } from '../components/Tooltip';

interface SpaceProps {
  hyperbits: HyperBit[];
  language: Language;
}

type VisualMode = 'NETWORK' | 'TIMELINE' | 'SEMANTIC_CLUSTERS';

export const Space = React.memo<SpaceProps>(({ hyperbits, language }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<VisualMode>('NETWORK');
  const t = TRANSLATIONS[language].space;
  const t_nav = TRANSLATIONS[language].nav;

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    if (hyperbits.length === 0) {
        svg.append("text")
           .attr("x", width / 2)
           .attr("y", height / 2)
           .attr("text-anchor", "middle")
           .attr("fill", "#475569")
           .attr("font-size", "14px")
           .attr("font-family", "monospace")
           .text(language === 'ru' ? "ПУСТОТА... ОТПРАВЬТЕ МЫСЛЬ, ЧТОБЫ СОЗДАТЬ ВСЕЛЕННУЮ." : "VOID... SEND A THOUGHT TO CREATE A UNIVERSE.");
        return;
    }

    const nodes = hyperbits.map(d => ({ ...d }));

    // --- MODE: SEMANTIC_CLUSTERS ---
    if (mode === 'SEMANTIC_CLUSTERS') {
         const types = Array.from(new Set(hyperbits.map(h => h.type))) as string[];
         const centers: Record<string, {x: number, y: number}> = {};
         types.forEach((type, i) => {
             const angle = (i / types.length) * 2 * Math.PI;
             const r = 250;
             centers[type] = {
                 x: width/2 + r * Math.cos(angle),
                 y: height/2 + r * Math.sin(angle)
             };
         });

         const simulation = d3.forceSimulation(nodes as any)
            .force("charge", d3.forceManyBody().strength(-10))
            .force("collide", d3.forceCollide().radius((d: any) => 10 + (d.energy * 10)))
            .force("x", d3.forceX((d: any) => centers[d.type]?.x || width/2).strength(0.1))
            .force("y", d3.forceY((d: any) => centers[d.type]?.y || height/2).strength(0.1));

         const node = svg.append("g")
            .selectAll("path")
            .data(nodes)
            .join("path")
            .attr("d", (d: any) => {
                const s = 5 + (d.energy * 15);
                if (d.isCompressed) {
                    return `M0,${-s} L${s},0 L0,${s} L${-s},0 Z`;
                }
                return `M0,${s} A${s},${s} 0 1,1 0,${-s} A${s},${s} 0 1,1 0,${s}`;
            })
            .attr("fill", (d: any) => d.isCompressed ? '#ffffff' : TYPE_COLORS[d.type as keyof typeof TYPE_COLORS])
            .attr("opacity", (d: any) => d.isCompressed ? 1 : 0.4 + (d.energy * 0.6))
            .attr("stroke", (d: any) => d.isCompressed ? '#ffffff' : 'none')
            .attr("stroke-width", (d: any) => d.isCompressed ? 2 : 0);
            
         svg.append("g")
            .selectAll("text")
            .data(types)
            .join("text")
            .attr("x", (d: any) => centers[d].x)
            .attr("y", (d: any) => centers[d].y - 30)
            .text((d: any) => d)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "12px")
            .attr("font-weight", "bold");

         simulation.on("tick", () => {
             node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
         });
         return;
    }

    // --- MODE: TIMELINE ---
    if (mode === 'TIMELINE') {
        const sorted = [...hyperbits].sort((a, b) => a.timestamp - b.timestamp);
        const margin = 50;
        const timeScale = (i: number) => margin + (i / (sorted.length - 1 || 1)) * (width - margin * 2);
        
        svg.append("line")
            .attr("x1", margin)
            .attr("y1", height/2)
            .attr("x2", width - margin)
            .attr("y2", height/2)
            .attr("stroke", "#475569")
            .attr("stroke-width", 2);
            
        svg.append("g")
            .selectAll("circle")
            .data(sorted)
            .join("circle")
            .attr("cx", (d, i) => timeScale(i))
            .attr("cy", height/2)
            .attr("r", d => 4 + (d.energy * 8))
            .attr("fill", d => TYPE_COLORS[d.type as keyof typeof TYPE_COLORS])
            .attr("opacity", d => 0.5 + (d.energy * 0.5))
            .append("title")
            .text(d => d.content);
            
        svg.append("g")
            .selectAll("text")
            .data(sorted)
            .join("text")
            .attr("x", (d, i) => timeScale(i))
            .attr("y", (d, i) => height/2 + (i % 2 === 0 ? -20 : 30))
            .text(d => new Date(d.timestamp).toLocaleTimeString())
            .attr("text-anchor", "middle")
            .attr("fill", "#94a3b8")
            .attr("font-size", "9px");
            
        return;
    }

    // --- MODE: NETWORK ---
    const links: any[] = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            if (nodes[i].type === nodes[j].type) {
                links.push({ source: nodes[i].id, target: nodes[j].id });
            }
        }
    }

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d:any) => 15 + (d.energy * 10)));

    const link = svg.append("g")
      .attr("stroke", "#334155")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("path")
      .attr("d", (d: any) => {
          const s = 10 + (d.energy * 20);
          if (d.isCompressed) return `M0,${-s} L${s},0 L0,${s} L${-s},0 Z`;
          return `M0,${s} A${s},${s} 0 1,1 0,${-s} A${s},${s} 0 1,1 0,${s}`;
      })
      .attr("fill", (d: any) => d.isCompressed ? '#ffffff' : TYPE_COLORS[d.type as keyof typeof TYPE_COLORS])
      .attr("fill-opacity", (d: any) => d.resonance > 0.5 ? 0.3 : 0.1) 
      .attr("stroke", (d: any) => d.isCompressed ? "#ffffff" : "none")
      .attr("stroke-width", (d: any) => d.isCompressed ? 2 : 0)
      .attr("class", (d:any) => d.resonance > 0.8 ? "animate-pulse" : ""); 

    node.append("circle")
      .attr("r", (d: any) => d.isCompressed ? 4 : 6 * (0.5 + d.energy))
      .attr("fill", (d: any) => d.isCompressed ? '#ffffff' : TYPE_COLORS[d.type as keyof typeof TYPE_COLORS])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("fill-opacity", 0.9);

    node.append("text")
      .text((d: any) => {
          if (d.isCompressed) return `[ARC] ${d.content.substring(0, 10)}...`;
          return d.content.substring(0, 15) + "...";
      })
      .attr("x", 12)
      .attr("y", 4)
      .attr("fill", (d: any) => d.isCompressed ? "#fcd34d" : "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-weight", (d: any) => d.isCompressed ? "bold" : "normal")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
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

  }, [hyperbits, mode, language]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
      
      <div className="absolute top-4 left-4 z-10 glass-panel p-4 rounded-xl flex flex-col gap-3">
        <div>
            <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                <Database className="w-5 h-5" />
                {t.title}
            </h2>
            <p className="text-xs text-slate-400">{t.subtitle(hyperbits.length)}</p>
        </div>
        
        <div className="flex gap-4 text-[10px] text-slate-500">
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div> Thought
            </div>
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 rotate-45 bg-white border border-cyan-500"></div> Crystal (Archived)
            </div>
        </div>

        <div className="flex gap-2">
          <Tooltip content={t_nav.view_network || "Neural Network"} position="bottom">
            <button 
                onClick={() => setMode('NETWORK')} 
                className={`p-2 rounded hover:bg-slate-700 ${mode === 'NETWORK' ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-400'}`}
            >
                <Network className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content={t_nav.view_clusters || "Semantic Clusters"} position="bottom">
            <button 
                onClick={() => setMode('SEMANTIC_CLUSTERS')} 
                className={`p-2 rounded hover:bg-slate-700 ${mode === 'SEMANTIC_CLUSTERS' ? 'bg-purple-900/50 text-purple-400' : 'text-slate-400'}`}
            >
                <Layers className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content={t_nav.view_timeline || "Chronological Timeline"} position="bottom">
            <button 
                onClick={() => setMode('TIMELINE')} 
                className={`p-2 rounded hover:bg-slate-700 ${mode === 'TIMELINE' ? 'bg-orange-900/50 text-orange-400' : 'text-slate-400'}`}
            >
                <Clock className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>
      
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
});