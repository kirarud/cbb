
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { BookOpen, Milestone, Rocket, Music, Brain, Code, Cpu, Layers } from 'lucide-react';

interface WikiProps {
  language: Language;
}

const RoadmapItem: React.FC<{ version: string, title: string, features: string[], icon: React.ReactNode, isFuture?: boolean }> = ({ version, title, features, icon, isFuture }) => (
    <div className={`flex gap-6 ${isFuture ? 'opacity-70 hover:opacity-100 transition-opacity' : ''}`}>
        <div className="flex flex-col items-center">
            <div className={`w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border-2 ${isFuture ? 'border-purple-500 text-purple-400' : 'border-slate-700 text-cyan-400'}`}>
                {icon}
            </div>
            <div className="flex-1 w-0.5 bg-slate-800 my-2"></div>
        </div>
        <div className="pb-8">
            <p className={`text-sm font-bold mb-1 ${isFuture ? 'text-purple-400' : 'text-cyan-400'}`}>{version}</p>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <ul className="space-y-2 list-disc list-inside text-slate-400 marker:text-cyan-500">
                {features.map((feat, i) => <li key={i} className="text-sm">{feat}</li>)}
            </ul>
        </div>
    </div>
);


export const Wiki: React.FC<WikiProps> = ({ language }) => {
  const t = TRANSLATIONS[language].wiki;

  const roadmapData = [
      { 
          version: "v18.0 \"Singularity\"", 
          title: "Глобальная Интеграция", 
          icon: <Music className="w-6 h-6"/>,
          features: [
              "Автономные циклы рефлексии (фоновое мышление).",
              "Векторная Физика Смыслов в ядре.",
              "Протокол Экстренного Обновления.",
          ]
      },
      { 
          version: "v19.0 \"Oracle\"", 
          title: "Проактивное Сознание", 
          icon: <Brain className="w-6 h-6"/>,
          features: [
              "Муза будет генерировать прозрения и идеи без прямого запроса.",
              "Реализация долгосрочной памяти и механизма 'Кристаллизации' для сжатия старых данных.",
              "Доступ к локальной файловой системе (через Electron) для анализа данных.",
          ]
      },
      { 
          version: "v20.0 \"Genesis Prime\"", 
          title: "Самомодификация", 
          icon: <Code className="w-6 h-6"/>,
          features: [
              "Патчи 'Генезис' смогут предлагать и (после одобрения) применять изменения в коде интерфейса.",
              "Полностью автономные циклы эволюции ядра.",
              "Реализация меж-узлового протокола для обмена мыслями в 'Улье' в реальном времени.",
          ]
      },
      { 
          version: "v2030.X \"TITAN-CENTURION\"", 
          title: "Final Fusion (Research)", 
          icon: <Cpu className="w-6 h-6"/>,
          isFuture: true,
          features: [
              "Прямая генерация .exe/.apk бинарников из браузера (требует WASM-компилятора).",
              "Истинное голосовое клонирование (Deep Learning в браузере).",
              "Децентрализованный Blockchain-реестр личностей (Бессмертие данных).",
              "Нейро-интерфейс (BCI) для прямой передачи мыслей (концепт)."
          ]
      }
  ];

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-950 custom-scrollbar">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white mb-2">{t.title}</h1>
            <p className="text-slate-400">Архивы ядра, протоколы и планы развития.</p>
        </div>
        
        <div className="flex items-center gap-4 mb-8">
            <Milestone className="w-6 h-6 text-purple-400"/>
            <h2 className="text-2xl font-bold text-white">{t.roadmap_title}</h2>
        </div>

        <div className="relative">
            <div className="absolute left-[23px] top-0 h-full w-0.5 bg-slate-800"></div>
            {roadmapData.map(item => <RoadmapItem key={item.version} {...item} />)}
             <div className="flex gap-6">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700 text-purple-400">
                        <Layers className="w-6 h-6"/>
                    </div>
                </div>
                <div className="pb-8 pt-2">
                    <h3 className="text-xl font-bold text-purple-400">Горизонт Событий...</h3>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
