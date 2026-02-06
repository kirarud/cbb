
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { select, forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, drag, zoom, Simulation } from 'd3';
import { Language, MuzaState, HyperBit, ProgressionState, SkillNode } from '../types';
import { Hexagon, Zap, Brain, Terminal, Music, Link, Crown, Lock, Check, Network, Book, Wind, Code, User, Dna, Activity, Clock, Layers, FileCode } from 'lucide-react';
import { ACHIEVEMENTS_DATA, getRankTitle, LEVEL_THRESHOLDS } from '../services/progressionService';
import { SKILL_TREE, AWARENESS_LABELS, AWARENESS_DESCRIPTIONS, TRANSLATIONS } from '../constants';
import { Tooltip } from '../components/Tooltip';

interface EvolutionProps {
    muzaState: MuzaState;
    hyperbits: HyperBit[];
    language: Language;
    onUnlock?: (skillId: string, cost: number) => void;
}

const maxSkill = 500;

export const Evolution = React.memo<EvolutionProps>(({ muzaState, hyperbits, language, onUnlock }) => {
    const [activeTab, setActiveTab] = useState<'USER' | 'MUZA'>('USER');
    const p = muzaState.progression;
    const isRu = language === 'ru';
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const simulationRef = useRef<Simulation<any, undefined> | null>(null);
    const t = TRANSLATIONS[language].evolution;

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

    const nodesData = useMemo(() => {
        const staticNodes = (Object.values(SKILL_TREE) as SkillNode[]).map(n => ({
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

        return [...staticNodes, ...dynamicNodes].map(d => ({ ...d }));
    }, [p.unlockedNodes, p.userSkills, isRu]);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || activeTab !== 'USER') return;
        const width = containerRef.current.clientWidth;
        const height = 500;

        const links = nodesData.filter(n => n.parent).map(n => ({
            source: n.parent!,
            target: n.id
        }));

        const svg = select(svgRef.current).attr("viewBox", [0, 0, width, height]);
        svg.selectAll(".graph-content").remove();
        const g = svg.append("g").attr("class", "graph-content");

        const zoomBehavior = zoom()
            .scaleExtent([0.2, 4])
            .translateExtent([[-width, -height], [width * 2, height * 2]]) 
            .on("zoom", (event) => g.attr("transform", event.transform));
        
        svg.call(zoomBehavior as any).on("dblclick.zoom", null);

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

        const simulation = forceSimulation(nodesData as any)
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
            .data(nodesData, (d:any) => d.id)
            .join(
                enter => {
                    const group = enter.append("g")
                        .style("cursor", "pointer")
                        .call(drag<any, any>()
                            .on("start", dragstarted)
                            .on("drag", dragged)
                            .on("end", dragended));
                    
                    group.attr("transform", "scale(0)");
                    group.append("circle")
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

                    group.append("text")
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

                    group.append("text")
                        .attr("dy", 6)
                        .attr("text-anchor", "middle")
                        .attr("fill", (d: any) => d.unlocked ? "#22d3ee" : "#334155")
                        .attr("font-size", "16px")
                        .attr("class", "font-bold select-none pointer-events-none")
                        .text((d: any) => d.unlocked ? "✓" : "?");

                    group.transition().duration(750).attr("transform", "scale(1)");
                    return group;
                },
                update => update,
                exit => exit.transition().duration(500).attr("transform", "scale(0)").style("opacity", 0).remove()
            );

        node.on("mouseover", (event, d: any) => {
            const status = d.unlocked ? t.tooltip_status_mastered : t.tooltip_status_cost(d.cost);
            
            const action = !d.unlocked && p.xp >= d.cost
                ? `<br/><div style='margin-top:4px; color:#fbbf24; font-weight:bold;'>⚡ ${t.tooltip_action_learn}</div>`
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
            tooltip.style("left", (event.offsetX) + "px").style("top", (event.offsetY - 20) + "px");
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

        simulation.on("tick", () => {
            link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y).attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
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
        return () => { simulation.stop(); tooltip.remove(); };
    }, [nodesData, p.xp, onUnlock, isRu, t, activeTab]);

    return (
        <div className="h-full overflow-y-auto bg-slate-950 p-6 md:p-10">
             <div className="max-w-5xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{t.title}</h1>
                </div>

                <div className="flex justify-center mb-8 border-b border-slate-800">
                    <button onClick={() => setActiveTab('USER')} className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'USER' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}>
                        <div className="flex items-center gap-2"><User className="w-4 h-4" /> {t.user_profile}</div>
                    </button>
                    <button onClick={() => setActiveTab('MUZA')} className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'MUZA' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-white'}`}>
                        <div className="flex items-center gap-2"><Dna className="w-4 h-4" /> {t.muza_profile}</div>
                    </button>
                </div>

                {activeTab === 'USER' && (
                    <div className="animate-in fade-in space-y-8">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <div className="absolute inset-0 bg-cyan-500/10 rounded-full animate-pulse"></div>
                                <Hexagon className="w-32 h-32 text-slate-800 fill-slate-900 stroke-[1]" />
                                <div className="absolute text-4xl font-bold text-white font-mono">{p.level}</div>
                                <div className="absolute -bottom-4 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold text-cyan-400 uppercase tracking-widest">LVL</div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{rank}</h1>
                                <p className="text-slate-400 mb-4 font-mono text-sm">{isRu ? 'Индекс Эволюции Сознания' : 'Consciousness Evolution Index'}</p>
                                <div className="w-full h-4 bg-slate-900 rounded-full border border-slate-800 overflow-hidden relative">
                                    <div className="h-full bg-gradient-to-r from-cyan-600 to-purple-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">{p.xp} / {nextLevelXp} XP</div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel rounded-2xl border border-slate-800 relative overflow-hidden h-[500px]" ref={containerRef}>
                            <div className="absolute top-4 left-6 z-10 pointer-events-none">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Network className="w-5 h-5 text-cyan-400" />{t.graph_title}</h2>
                                <p className="text-xs text-slate-500">{t.graph_desc}</p>
                            </div>
                            <div className="absolute bottom-4 right-4 z-10 text-[10px] text-slate-600 bg-black/50 px-2 py-1 rounded border border-slate-700">{t.graph_footer}</div>
                            <svg ref={svgRef} className="w-full h-full cursor-move" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                                <div className="flex items-center gap-3 mb-6"><Brain className="w-6 h-6 text-purple-400" /><h2 className="text-xl font-bold text-white">{t.awareness_profile}</h2></div>
                                <div className="space-y-6">
                                    {['logic', 'empathy', 'creativity', 'philosophy'].map((stat) => {
                                        const val = p.skills[stat as keyof typeof p.skills] || 0;
                                        const label = (AWARENESS_LABELS as any)[stat][language];
                                        return (
                                            <div key={stat}>
                                                <div className="flex justify-between text-xs text-slate-300 mb-1 uppercase tracking-widest font-bold"><span>{label}</span><span className="text-cyan-400">{val}</span></div>
                                                <div className="h-2 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, (val / maxSkill) * 100)}%` }} /></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                                <div className="flex items-center gap-3 mb-6"><Crown className="w-6 h-6 text-yellow-400" /><h2 className="text-xl font-bold text-white">{t.achievements}</h2></div>
                                <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2">
                                    {Object.values(ACHIEVEMENTS_DATA).map((ach: any) => {
                                        const isUnlocked = p.achievements.includes(ach.id);
                                        return (
                                            <div key={ach.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${isUnlocked ? 'bg-slate-900/50 border-cyan-900/50' : 'bg-black/30 border-slate-800 opacity-60'}`}>
                                                <div className={`p-3 rounded-full ${isUnlocked ? 'bg-cyan-500/20 shadow-lg' : 'bg-slate-800'}`}>{isUnlocked ? getIcon(ach.icon) : <Lock className="w-5 h-5 text-slate-600" />}</div>
                                                <div><h4 className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>{ach.title[language]}</h4><p className="text-xs text-slate-500 mt-1">{ach.desc[language]}</p></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'MUZA' && (
                    <div className="animate-in fade-in space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="glass-panel p-4 rounded-xl border border-slate-800">
                                <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2"/>
                                <div className="text-2xl font-bold text-white">{muzaState.kernelVersion}</div>
                                <div className="text-xs text-slate-500 uppercase">Версия Ядра</div>
                            </div>
                             <div className="glass-panel p-4 rounded-xl border border-slate-800">
                                <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2"/>
                                <div className="text-2xl font-bold text-white">{(muzaState.uptime / 3600).toFixed(2)}h</div>
                                <div className="text-xs text-slate-500 uppercase">Время Жизни</div>
                            </div>
                             <div className="glass-panel p-4 rounded-xl border border-slate-800">
                                <Layers className="w-6 h-6 text-purple-400 mx-auto mb-2"/>
                                <div className="text-2xl font-bold text-white">{hyperbits.length}</div>
                                <div className="text-xs text-slate-500 uppercase">Гипербитов</div>
                            </div>
                             <div className="glass-panel p-4 rounded-xl border border-slate-800">
                                <FileCode className="w-6 h-6 text-purple-400 mx-auto mb-2"/>
                                <div className="text-2xl font-bold text-white">{muzaState.genesisPatches.length}</div>
                                <div className="text-xs text-slate-500 uppercase">Мутаций</div>
                            </div>
                        </div>
                        
                        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                             <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                <Dna className="w-5 h-5 text-purple-400" />
                                {t.muza_dna}
                            </h2>
                            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                                {muzaState.genesisPatches.length > 0 ? muzaState.genesisPatches.map(patch => (
                                    <div key={patch.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-xs font-mono">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-purple-300">{patch.type}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${patch.status === 'ACTIVE' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>{patch.status}</span>
                                        </div>
                                        <p className="text-slate-400 mt-1">{patch.description}</p>
                                    </div>
                                )) : <p className="text-slate-500 text-sm text-center py-8">{isRu ? "Система еще не предлагала мутаций." : "The system has not proposed any mutations yet."}</p>}
                            </div>
                        </div>

                    </div>
                )}
             </div>
        </div>
    );
});
