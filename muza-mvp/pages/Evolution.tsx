
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MuzaState, Language, UserSkill, ProgressionState } from '../types';
import { Hexagon, Zap, Brain, Terminal, Music, Link, Crown, Lock, Check, Network, Eye, Layers, Book, Wind, Code } from 'lucide-react';
import { ACHIEVEMENTS_DATA, getRankTitle, LEVEL_THRESHOLDS } from '../services/progressionService';
import { SKILL_TREE, AWARENESS_LABELS, AWARENESS_DESCRIPTIONS } from '../constants';
import { select, forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, drag, zoom, Simulation } from 'd3';
import { Tooltip } from '../components/Tooltip';

interface EvolutionProps {
    progression: ProgressionState;
    language: Language;
    onUnlock?: (skillId: string, cost: number) => void;
    // Add access to genesis patches for visualization
}

const maxSkill = 500;

export const Evolution = React.memo<EvolutionProps>(({ progression: p, language, onUnlock }) => {
    const isRu = language === 'ru';
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const simulationRef = useRef<Simulation<any, undefined> | null>(null);
    const zoomTransformRef = useRef<any>(null);
    const nodePositionsRef = useRef<Record<string, { x: number; y: number }>>({});

    // Dynamic Stats
    const rank = getRankTitle(p.level, language);
    const nextLevelXp = LEVEL_THRESHOLDS[p.level] || 100000;
    const prevLevelXp = LEVEL_THRESHOLDS[p.level - 1] || 0;
    const progressPercent = ((p.xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100;

    const getIcon = (name: string) => {
        switch (name) {
            case 'Zap': return <Zap className="w-5 h-5 text-yellow-400" />;
            case 'Terminal': return <Terminal className="w-5 h-5 text-cyan-400" />;
            case 'Brain': return <Brain className="w-5 h-5 text-purple-400" />;
            case 'Music': return <Music className="w-5 h-5 text-pink-400" />;
            case 'Link': return <Link className="w-5 h-5 text-blue-400" />;
            case 'Crown': return <Crown className="w-5 h-5 text-amber-400" />;
            case 'Book': return <Book className="w-5 h-5 text-green-400" />;
            case 'Wind': return <Wind className="w-5 h-5 text-slate-400" />;
            default: return <Lock className="w-5 h-5 text-slate-600" />;
        }
    };

    // Memoize Nodes Data
    const nodesData = useMemo(() => {
        const staticNodes = Object.values(SKILL_TREE).map(n => ({
            id: n.id,
            label: n.title[isRu ? 'ru' : 'en'],
            desc: n.description[isRu ? 'ru' : 'en'],
            type: 'STATIC',
            unlocked: (p.unlockedNodes || []).includes(n.id),
            cost: n.cost,
            parent: n.parent
        }));

        const dynamicNodes = (p.userSkills || []).slice(0, 15).map(s => ({
            id: `USER_${s.id}`,
            label: s.name,
            desc: `${s.category} Skill (Lvl ${s.level})`,
            type: 'DYNAMIC',
            unlocked: true,
            cost: 0,
            parent: s.category === 'LOGIC' ? 'LOGIC_1' : s.category === 'CREATIVE' ? 'CREATIVE_1' : 'ROOT'
        }));

        // TODO: In a real implementation we would pass genesisPatches prop, but here we can infer from unlockedNodes or just placeholders
        // For now, let's assume if there are lots of skills, we show 'Evolution' nodes
        
        return [...staticNodes, ...dynamicNodes].map(d => ({ ...d }));
    }, [p.unlockedNodes, p.userSkills, isRu]);

    // D3 FORCE GRAPH
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = 500;

        const links = nodesData.filter(n => n.parent).map(n => ({
            source: n.parent!,
            target: n.id
        }));

        const svg = select(svgRef.current)
            .attr("viewBox", [0, 0, width, height]);

        svg.selectAll("*").remove();

        const g = svg.append("g");

        const zoomBehavior = zoom()
            .scaleExtent([0.2, 4])
            .translateExtent([[-width, -height], [width * 2, height * 2]]) 
            .on("zoom", (event) => {
                zoomTransformRef.current = event.transform;
                g.attr("transform", event.transform);
            });
        
        svg.call(zoomBehavior as any)
           .on("dblclick.zoom", null);

        if (zoomTransformRef.current) {
            g.attr("transform", zoomTransformRef.current);
            try {
                svg.call((zoomBehavior as any).transform, zoomTransformRef.current);
            } catch {}
        }

        const tooltip = select(containerRef.current)
            .append("div")
            .style("position", "absolute")
            .style("background", "rgba(10, 15, 30, 0.95)")
            .style("border", "1px solid #22d3ee")
            .style("padding", "12px")
            .style("border-radius", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("color", "white")
            .style("font-size", "14px")
            .style("line-height", "1.4")
            .style("max-width", "250px")
            .style("z-index", "100")
            .style("box-shadow", "0 10px 40px rgba(0,0,0,0.6)")
            .style("backdrop-filter", "blur(10px)")
            .style("transform", "translateY(-100%)");

        const nodesWithPos = nodesData.map(n => {
            const prev = nodePositionsRef.current[n.id];
            return prev ? { ...n, x: prev.x, y: prev.y } : { ...n };
        });

        const simulation = forceSimulation(nodesWithPos as any)
            .force("link", forceLink(links).id((d: any) => d.id).distance(100))
            .force("charge", forceManyBody().strength(-400))
            .force("center", forceCenter(width / 2, height / 2))
            .force("collide", forceCollide().radius(50));

        simulationRef.current = simulation;

        const link = g.append("g")
            .attr("stroke", "#334155")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", (d: any) => {
                const target = nodesData.find(n => n.id === (d.target.id || d.target));
                return target?.unlocked ? "0" : "5,5";
            })
            .attr("stroke", (d: any) => {
                const target = nodesData.find(n => n.id === (d.target.id || d.target));
                return target?.unlocked ? "#22d3ee" : "#334155";
            });

        const node = g.append("g")
            .selectAll("g")
            .data(nodesWithPos)
            .join("g")
            .style("cursor", "pointer")
            .call(drag<any, any>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("circle")
            .attr("r", (d: any) => d.type === 'STATIC' ? 26 : 20)
            .attr("fill", (d: any) => {
                if (d.unlocked) return d.type === 'STATIC' ? '#0f172a' : '#312e81';
                const parentNode = nodesData.find(n => n.id === d.parent);
                const parentUnlocked = !d.parent || parentNode?.unlocked;
                const affordable = p.xp >= d.cost;
                if (parentUnlocked && affordable) return '#422006'; 
                return '#020617';
            })
            .attr("stroke", (d: any) => {
                if (d.unlocked) return d.type === 'STATIC' ? '#22d3ee' : '#818cf8';
                const parentNode = nodesData.find(n => n.id === d.parent);
                const parentUnlocked = !d.parent || parentNode?.unlocked;
                const affordable = p.xp >= d.cost;
                return (parentUnlocked && affordable) ? '#fbbf24' : '#334155';
            })
            .attr("stroke-width", 3)
            .attr("class", "transition-all hover:stroke-white");

        node.on("mouseover", (event, d: any) => {
            const status = d.unlocked 
                ? (isRu ? "Изучено" : "Mastered") 
                : (isRu ? `Стоимость: ${d.cost} XP` : `Cost: ${d.cost} XP`);
            
            const action = !d.unlocked && p.xp >= d.cost
                ? (isRu ? "<br/><div style='margin-top:4px; color:#fbbf24; font-weight:bold;'>⚡ Нажмите для изучения</div>" : "<br/><div style='margin-top:4px; color:#fbbf24; font-weight:bold;'>⚡ Click to Learn</div>")
                : "";

            tooltip.html(`
                <div style="font-weight:bold; color:#22d3ee; margin-bottom:4px; font-size:15px;">${d.label}</div>
                <div style="color:#cbd5e1; margin-bottom:6px;">${d.desc}</div>
                <div style="font-size:12px; color:#94a3b8; border-top:1px solid #334155; padding-top:4px;">${status}</div>
                ${action}
            `)
                .style("opacity", 1)
                .style("left", (event.offsetX) + "px")
                .style("top", (event.offsetY - 20) + "px");
        })
        .on("mousemove", (event) => {
            tooltip
                .style("left", (event.offsetX) + "px")
                .style("top", (event.offsetY - 20) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        })
        .on("click", (event, d: any) => {
            if (d.type === 'STATIC' && !d.unlocked) {
                const parentNode = nodesData.find(n => n.id === d.parent);
                if ((!d.parent || parentNode?.unlocked) && p.xp >= d.cost) {
                    onUnlock?.(d.id, d.cost);
                }
            }
        });

        node.append("text")
            .text((d: any) => d.label.split(' ')[0])
            .attr("x", 0)
            .attr("y", (d: any) => d.type === 'STATIC' ? 45 : 35)
            .attr("text-anchor", "middle")
            .attr("fill", (d: any) => d.unlocked ? "#e2e8f0" : "#64748b")
            .attr("font-size", "13px")
            .attr("font-weight", "bold")
            .attr("font-family", "monospace")
            .style("pointer-events", "none")
            .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8)");

        node.append("text")
            .attr("dy", 6)
            .attr("text-anchor", "middle")
            .attr("fill", (d: any) => d.unlocked ? "#22d3ee" : "#334155")
            .attr("font-size", "16px")
            .attr("class", "font-bold select-none pointer-events-none")
            .text((d: any) => d.unlocked ? "✓" : "?");

        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);

            nodesWithPos.forEach((n: any) => {
                if (Number.isFinite(n.x) && Number.isFinite(n.y)) {
                    nodePositionsRef.current[n.id] = { x: n.x, y: n.y };
                }
            });
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

        return () => {
            simulation.stop();
            tooltip.remove();
        };

    }, [nodesData, p.xp, onUnlock, isRu]);

    return (
        <div className="h-full overflow-y-auto bg-slate-950 p-6 md:p-10">
             <div className="max-w-5xl mx-auto space-y-8">
                
                {/* HEADER */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <div className="absolute inset-0 bg-cyan-500/10 rounded-full animate-pulse"></div>
                        <Hexagon className="w-32 h-32 text-slate-800 fill-slate-900 stroke-[1]" />
                        <div className="absolute text-4xl font-bold text-white font-mono">{p.level}</div>
                        <div className="absolute -bottom-4 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold text-cyan-400 uppercase tracking-widest">
                            {isRu ? 'УРОВ' : 'LVL'}
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{rank}</h1>
                        <p className="text-slate-400 mb-4 font-mono text-sm">
                            {isRu ? 'Индекс Эволюции Сознания' : 'Consciousness Evolution Index'}
                        </p>
                        
                        <div className="w-full h-4 bg-slate-900 rounded-full border border-slate-800 overflow-hidden relative">
                            <div className="h-full bg-gradient-to-r from-cyan-600 to-purple-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
                                {p.xp} / {nextLevelXp} {isRu ? 'ОПЫТ' : 'XP'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* DYNAMIC NEURAL TREE */}
                <div className="glass-panel rounded-2xl border border-slate-800 relative overflow-hidden h-[500px]" ref={containerRef}>
                    <div className="absolute top-4 left-6 z-10 pointer-events-none">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Network className="w-5 h-5 text-cyan-400" />
                            {isRu ? 'Нейронное Древо 3D' : 'Neural Tree 3D'}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {isRu ? 'Муза автономно связывает ваши навыки и свои патчи.' : 'Muza autonomously links your skills and self-patches.'}
                        </p>
                    </div>
                    <div className="absolute bottom-4 right-4 z-10 text-[10px] text-slate-600 bg-black/50 px-2 py-1 rounded border border-slate-700">
                        {isRu ? 'КОЛЁСО — МАСШТАБ • ПЕРЕТАЩИТЬ — ПАНОРАМА' : 'SCROLL TO ZOOM • DRAG TO MOVE'}
                    </div>
                    <svg ref={svgRef} className="w-full h-full cursor-move" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* AWARENESS MATRIX */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <Brain className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl font-bold text-white">
                                {isRu ? 'Профиль Осознанности' : 'Awareness Profile'}
                            </h2>
                        </div>

                        <div className="space-y-6">
                            {[
                                { k: 'logic', c: 'bg-blue-500' },
                                { k: 'empathy', c: 'bg-green-500' },
                                { k: 'creativity', c: 'bg-purple-500' },
                                { k: 'philosophy', c: 'bg-yellow-500' },
                            ].map((stat, i) => {
                                const val = p.skills[stat.k as keyof typeof p.skills] || 0;
                                const label = AWARENESS_LABELS[stat.k][language];
                                const desc = AWARENESS_DESCRIPTIONS[stat.k][language];
                                return (
                                    <Tooltip key={i} content={desc} position="left">
                                        <div className="group cursor-help">
                                            <div className="flex justify-between text-xs text-slate-300 mb-1 uppercase tracking-widest font-bold">
                                                <span>{label}</span>
                                                <span className="text-cyan-400">{val}</span>
                                            </div>
                                            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                                                <div className={`h-full ${stat.c} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} style={{ width: `${Math.min(100, (val / maxSkill) * 100)}%` }} />
                                            </div>
                                        </div>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>

                    {/* ACHIEVEMENTS */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <Crown className="w-6 h-6 text-yellow-400" />
                            <h2 className="text-xl font-bold text-white">
                                {isRu ? 'Достижения' : 'Achievements'}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2">
                            {Object.values(ACHIEVEMENTS_DATA).map((ach) => {
                                const isUnlocked = p.achievements.includes(ach.id);
                                return (
                                    <div key={ach.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${isUnlocked ? 'bg-slate-900/50 border-cyan-900/50' : 'bg-black/30 border-slate-800 opacity-60'}`}>
                                        <div className={`p-3 rounded-full ${isUnlocked ? 'bg-cyan-500/20 shadow-lg' : 'bg-slate-800'}`}>
                                            {isUnlocked ? getIcon(ach.icon) : <Lock className="w-5 h-5 text-slate-600" />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                                                {ach.title[language]}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {ach.desc[language]}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
});
