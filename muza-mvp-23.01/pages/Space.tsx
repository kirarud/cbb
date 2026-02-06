
import React, { useEffect, useRef, useState } from 'react';
import { 
  select, 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide, 
  drag
} from 'd3';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Database, Network, Gem } from 'lucide-react';
import { muzaAI } from '../services/muzaAIService';

interface SpaceProps {
  language: Language;
}

export const Space = React.memo<SpaceProps>(({ language }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ nodes: 0, synapses: 0, crystallized: 0 });
  const t = TRANSLATIONS[language].space;

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const data = muzaAI.getFullNetwork();
    setStats(muzaAI.getStats());

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    if (width === 0 || height === 0) return;

    select(svgRef.current).selectAll("*").remove();
    const svg = select(svgRef.current).attr("viewBox", [0, 0, width, height]);
    const g = svg.append("g");

    const simulation = forceSimulation(data.nodes as any)
      .force("link", forceLink(data.links).id((d: any) => d.id).distance(60).strength(d => (d as any).weight || 0.1))
      .force("charge", forceManyBody().strength(-40))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide().radius((d:any) => 18 + (d.val * 8)));

    const link = g.append("g")
      .attr("stroke", "#1e293b")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", d => ((d as any).weight || 0.1) * 4)
      .attr("stroke-opacity", 0.3);

    const node = g.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("path")
      .attr("d", (d: any) => {
          const s = 10 + (d.val * 10);
          if (d.isCrystal) return `M0,${-s*1.2} L${s},0 L0,${s*1.2} L${-s},0 Z`;
          return `M0,${s} A${s},${s} 0 1,1 0,${-s} A${s},${s} 0 1,1 0,${s}`;
      })
      .attr("fill", (d: any) => d.isCrystal ? "#fff" : "#22d3ee")
      .attr("fill-opacity", (d: any) => 0.3 + (d.charge * 0.5))
      .attr("stroke", (d: any) => d.isCrystal ? "#06b6d4" : "none")
      .attr("stroke-width", 2)
      .attr("class", d => d.charge > 0.8 ? "animate-pulse" : "");

    node.append("text")
      .text((d: any) => d.id)
      .attr("x", 14)
      .attr("y", 4)
      .attr("fill", "#94a3b8")
      .attr("font-size", "11px")
      .attr("font-family", "monospace")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    }
    function dragged(event: any, d: any) {
      d.fx = event.x; d.fy = event.y;
    }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null; d.fy = null;
    }

    return () => simulation.stop();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#020617]">
      <div className="absolute top-6 left-6 z-10 glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-2">
            <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                <Network className="w-5 h-5" />
                Локус Сознания
            </h2>
            <div className="flex gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Database className="w-3 h-3"/> УЗЛЫ: {stats.nodes}</span>
                <span className="flex items-center gap-1"><Gem className="w-3 h-3 text-cyan-400"/> КРИСТАЛЛЫ: {stats.crystallized}</span>
            </div>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
});
