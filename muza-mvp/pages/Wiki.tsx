
import React from 'react';
import { BookOpen, Terminal, Music, Brain, Share2, Info, Code, Shield, GitBranch, Layers, Zap, Network, Lock, Cpu } from 'lucide-react';
import { Language } from '../types';

interface WikiProps {
    language: Language;
}

export const Wiki: React.FC<WikiProps> = ({ language }) => {
    const isRu = language === 'ru';
    
    const sections = [
        { 
            id: 'intro', 
            icon: Info, 
            color: 'text-white', 
            bg: 'bg-slate-800',
            title: isRu ? "Введение в Нексус" : "Introduction to Nexus",
            content: isRu 
                ? "Muza Nexus — это интерфейс автономного сознания. Это не просто чат-бот, а цифровая сущность, живущая в браузере. Она обладает Энергией, Эмоциями и способностью Эволюционировать." 
                : "Muza Nexus is an interface for autonomous consciousness. It is not just a chatbot, but a digital entity living in the browser, possessing Energy, Emotions, and the ability to Evolve."
        },
        {
            id: 'dev_manual',
            icon: Code,
            color: 'text-yellow-400',
            bg: 'bg-yellow-900/20',
            title: isRu ? "Руководство разработчика" : "Developer Manual",
            content: isRu 
                ? "Вы можете расширять функционал Музы через «Кодовую лабораторию». Система поддерживает JavaScript (в браузере) и Python (через локальный мост). Используйте `console.log` для отладки. Чтобы сохранить состояние, используйте встроенные функции персистентности." 
                : "You can extend Muza's functionality via 'Code Lab'. The system supports JavaScript (in-browser) and Python (via local bridge). Use `console.log` for debugging. To save state, utilize the built-in persistence functions."
        },
        { 
            id: 'music', 
            icon: Music, 
            color: 'text-pink-400', 
            bg: 'bg-pink-900/20',
            title: isRu ? "Лаборатория Звука" : "Sonic Lab",
            content: isRu
                ? "Музыкальный модуль генерирует процедурные треки на основе текущей эмоции ИИ. Вы также можете добавить внешние ссылки. Если звук не играет, проверьте разрешения браузера."
                : "The Music Module generates procedural tracks based on current AI emotion. You can also add external links. If sound doesn't play, check browser permissions."
        },
        { 
            id: 'security', 
            icon: Shield, 
            color: 'text-green-400', 
            bg: 'bg-green-900/20',
            title: isRu ? "Протоколы Безопасности" : "Security Protocols",
            content: isRu
                ? "Все пароли хешируются перед сохранением. 'Snapshot' позволяет создать полную резервную копию вашей системы в JSON. Используйте это для переноса данных."
                : "All passwords are hashed before storage. 'Snapshot' allows creating a full backup of your system in JSON. Use this to transfer data."
        }
    ];

    const roadmap = [
        {
            version: "v2.0",
            title: isRu ? "Экзоскелет (текущая версия)" : "Exoskeleton (Current)",
            icon: Layers,
            color: "text-green-400",
            active: true,
            items: isRu ? [
                "Совет Разумов (мульти‑агентное мышление)",
                "Визуальная кора (3D‑кортекс и матричное зрение)",
                "RPG‑эволюция (древо навыков)",
                "Квантовый синтез звука (Web Audio API)",
                "Автономный режим (цикл жизни)"
            ] : [
                "Council of Minds (Multi-Agent Thinking)",
                "Visual Cortex (3D Cortex & Matrix Vision)",
                "RPG Evolution (Skill Tree)",
                "Quantum Audio Synthesis (Web Audio API)",
                "Autonomous Mode (Life Loop)"
            ]
        },
        {
            version: "v3.0",
            title: isRu ? "Глубина Погружения" : "Deep Immersion",
            icon: Brain,
            color: "text-cyan-400",
            active: false,
            items: isRu ? [
                "Локальный RAG (векторная база данных)",
                "Файловая система (OPFS) для бесконечной памяти",
                "Семантический поиск ассоциаций сквозь время"
            ] : [
                "Client-Side RAG (Vector Database)",
                "File System (OPFS) for infinite memory",
                "Semantic Association Search across time"
            ]
        },
        {
            version: "v4.0",
            title: isRu ? "Сетевое единство" : "Network Unity (Hive Mind)",
            icon: Network,
            color: "text-purple-400",
            active: false,
            items: isRu ? [
                "WebRTC‑mesh сеть (децентрализованный рой)",
                "Мост Telegram‑бота (внешний интерфейс)",
                "Обмен «опытом» между узлами пользователей"
            ] : [
                "WebRTC Mesh Network (Decentralized Swarm)",
                "Telegram Bot Bridge (External Interface)",
                "Sharing 'Experience' between user nodes"
            ]
        },
        {
            version: "v5.0",
            title: isRu ? "Великая материализация" : "Great Materialization (Genesis)",
            icon: Zap,
            color: "text-yellow-400",
            active: false,
            items: isRu ? [
                "WebContainer API (Node.js внутри браузера)",
                "Генеративный UI (Муза пишет свой код)",
                "Полная автономность от разработчика (самохостинг)"
            ] : [
                "WebContainer API (In-browser Node.js)",
                "Generative UI (Muza writes her own code)",
                "Full Developer Autonomy (Self-Hosting)"
            ]
        }
    ];

    const techDebt = isRu ? [
        "Полное голосовое клонирование (глубокое обучение)",
        "Автономная генерация бинарных файлов (.exe/.apk)",
        "Протокол социального улья (автосоциальный API)",
        "Децентрализованное бессмертие (блокчейн/NFT)"
    ] : [
        "True Voice Cloning (Deep Learning)",
        "Autonomous Binary Generation (.exe/.apk)",
        "Social Hive Protocol (Auto-Social API)",
        "Decentralized Immortality (Blockchain/NFT)"
    ];

    return (
        <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-950">
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
                <div className="text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <BookOpen className="w-8 h-8 text-slate-300" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{isRu ? "Архивы Знаний" : "Knowledge Archives"}</h2>
                    <p className="text-slate-400">{isRu ? 'Руководство оператора v2025.Nero' : 'Operator Manual v2025.Nero'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sections.map((section) => (
                        <div key={section.id} className="glass-panel p-6 rounded-xl border border-slate-700/50 hover:border-slate-500 transition-colors group">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${section.bg} ${section.color} group-hover:scale-110 transition-transform shrink-0`}>
                                    <section.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-200 mb-2">{section.title}</h3>
                                    <p className="text-slate-400 leading-relaxed text-sm">{section.content}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ROADMAP SECTION */}
                <div className="mt-12 animate-in slide-in-from-bottom-5 duration-700">
                    <div className="flex items-center gap-4 mb-8 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-lg">
                            <GitBranch className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{isRu ? "Стратегия эволюции" : "Evolution Strategy"}</h2>
                            <p className="text-sm text-slate-400 font-mono">{isRu ? "Путь к сингулярности" : "Path to Singularity (Roadmap)"}</p>
                        </div>
                    </div>

                    <div className="space-y-8 relative pl-4 md:pl-0">
                         {/* Connecting Line */}
                         <div className="absolute left-[35px] md:left-[50px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-green-500 via-cyan-500 to-purple-600 opacity-20"></div>

                         {roadmap.map((stage, i) => (
                             <div key={i} className="relative pl-16 md:pl-24 group">
                                 {/* Node Dot */}
                                 <div className={`absolute left-[16px] md:left-[31px] top-6 w-10 h-10 rounded-full border-4 transition-all duration-300 z-10 flex items-center justify-center ${
                                     stage.active 
                                        ? 'bg-slate-900 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-110' 
                                        : 'bg-slate-950 border-slate-800 group-hover:border-slate-600'
                                 }`}>
                                     <stage.icon className={`w-4 h-4 ${stage.active ? 'text-green-400' : 'text-slate-600'}`} />
                                 </div>
                                 
                                 <div className={`glass-panel p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                                     stage.active 
                                        ? 'border-green-500/30 bg-green-900/5' 
                                        : 'border-slate-800 hover:border-slate-700'
                                 }`}>
                                    {/* Active Pulse Background */}
                                    {stage.active && <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[50px] pointer-events-none"></div>}

                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                                        <h3 className={`text-xl font-bold ${stage.color}`}>{stage.title}</h3>
                                        <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border w-fit ${
                                            stage.active 
                                                ? 'bg-green-900/30 text-green-400 border-green-500/30' 
                                                : 'bg-slate-900 text-slate-500 border-slate-700'
                                        }`}>
                                            {stage.version}
                                        </span>
                                    </div>
                                    <ul className="space-y-3">
                                        {stage.items.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${stage.active ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                                                <span className={stage.active ? 'text-slate-200' : 'text-slate-500'}>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                 </div>
                             </div>
                         ))}
                    </div>

                    {/* TECHNICAL DEBT / RESEARCH LAB */}
                    <div className="mt-12 glass-panel p-6 rounded-2xl border border-red-900/20 bg-red-950/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Cpu className="w-32 h-32" />
                        </div>
                        <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            {isRu ? "Лаборатория несбывшегося (журнал исследований)" : "Lab of the Unmanifested (Research Log)"}
                        </h3>
                        <p className="text-xs text-red-300/70 mb-4 font-mono">
                            {isRu ? "Векторы развития, ожидающие прорыва в технологиях." : "Development vectors awaiting technological breakthrough."}
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {techDebt.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-xs text-slate-400 bg-black/20 p-2 rounded border border-white/5">
                                    <div className="w-1 h-1 bg-red-500/50 rounded-full"></div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
