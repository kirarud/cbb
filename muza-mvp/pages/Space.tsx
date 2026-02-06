
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
  forceY
} from 'd3';
import { HyperBit, Language } from '../types';
import { TYPE_COLORS, TRANSLATIONS } from '../constants';
import { Database, Clock, Network, Search, Layers } from 'lucide-react';

interface SpaceProps {
  hyperbits: HyperBit[];
  language: Language;
}

type VisualMode = 'NETWORK' | 'SEMANTIC_CLUSTERS' | 'TIMELINE';

export const Space = React.memo<SpaceProps>(({ hyperbits, language }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<VisualMode>('NETWORK');
  const [search, setSearch] = useState('');
  const t = TRANSLATIONS[language].space;

  useEffect(() => {
    if (!svgRef.current || hyperbits.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    select(svgRef.current).selectAll("*").remove();

    const svg = select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

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

         const node = svg.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 8)
            .attr("fill", (d: any) => TYPE_COLORS[d.type as keyof typeof TYPE_COLORS])
            .attr("opacity", 0.8);
            
         // Add Cluster Labels
         svg.append("g")
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
        
        // Draw Axis
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
            .attr("r", 6)
            .attr("fill", d => TYPE_COLORS[d.type as keyof typeof TYPE_COLORS])
            .append("title")
            .text(d => d.content);
            
        // Labels (alternate up/down)
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
      .force("link", forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", forceManyBody().strength(-200))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide().radius(20));

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
      .text((d: any) => d.content.substring(0, 15) + "...")
      .attr("x", 12)
      .attr("y", 4)
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
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

  }, [hyperbits, mode]);

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
        </div>
      </div>
      
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
});
