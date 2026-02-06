import React, { useState } from 'react';
import { MemoryCrystal, EventLog, GenesisPatch, HyperBit } from '../types';
import { BookOpen, AlertTriangle, Check, Copy, Upload, Trash2, Download, GitCommit, DatabaseZap, Clock, Archive, Eye } from 'lucide-react';

interface DataVaultProps {
    eventLog: EventLog[];
    crystals: MemoryCrystal[];
    genesisPatches: GenesisPatch[];
    logosBits: HyperBit[];
    onForge: () => void;
    onLoad: (crystal: MemoryCrystal) => void;
    onDelete: (crystalId: string) => void;
    onImport: (crystalString: string) => boolean;
    onWipeAll: () => void;
    onStartImmersion: (crystal: MemoryCrystal) => void;
}

const DataVault: React.FC<DataVaultProps> = (props) => {
    const { eventLog, crystals, genesisPatches, logosBits, onForge, onLoad, onDelete, onImport, onWipeAll, onStartImmersion } = props;
    const [activeTab, setActiveTab] = useState('logos');

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'logos':
                return <LogosArchive logosBits={logosBits} />;
            case 'events':
                return <EventTimeline eventLog={eventLog} />;
            case 'genesis':
                return <GenesisArchive genesisPatches={genesisPatches} />;
            case 'crystals':
                return <CrystalArchive {...props} />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full h-full glass-panel rounded-xl p-6 flex flex-col text-slate-200 overflow-hidden">
            <header className="flex justify-between items-center border-b border-emerald-400/20 pb-2 mb-4">
                <h2 className="text-xl font-bold font-data text-emerald-400">ХРОНИКИ ХРАНИТЕЛЯ</h2>
                <div className="flex items-center gap-2 rounded-lg p-1 bg-slate-900/50">
                    <TabButton id="logos" activeTab={activeTab} onClick={setActiveTab} icon={DatabaseZap} label="Архив Логоса" />
                    <TabButton id="events" activeTab={activeTab} onClick={setActiveTab} icon={Clock} label="Лента Судьбы" />
                    <TabButton id="genesis" activeTab={activeTab} onClick={setActiveTab} icon={GitCommit} label="Архив Генезиса" />
                    <TabButton id="crystals" activeTab={activeTab} onClick={setActiveTab} icon={Archive} label="Архив Сознания" />
                </div>
            </header>
            <main className="flex-1 overflow-hidden">
                {renderActiveTab()}
            </main>
        </div>
    );
};

const TabButton: React.FC<{id: string, activeTab: string, onClick: (id: string) => void, icon: React.ElementType, label: string}> = ({ id, activeTab, onClick, icon: Icon, label }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 text-xs font-data px-3 py-1.5 rounded-md transition-colors ${activeTab === id ? 'bg-slate-700/80 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
    >
        <Icon size={14} />
        {label}
    </button>
);

const LogosArchive: React.FC<{ logosBits: HyperBit[] }> = ({ logosBits }) => (
    <div className="h-full flex flex-col">
        <p className="text-sm text-slate-400 font-data mb-2">Синтезированные принципы ядра, основанные на коллективном сознании.</p>
        <div className="flex-1 bg-slate-900/30 rounded-lg p-3 overflow-y-auto space-y-3">
            {logosBits.length === 0 ? (
                <div className="text-center text-slate-500 text-sm h-full flex items-center justify-center">Архив Логоса пуст. Ожидание синтеза...</div>
            ) : (
                [...logosBits].map(bit => (
                    <div key={bit.id} className="glass-panel p-3 rounded-md border-l-4 border-amber-300 animate-fade-in">
                        <p className="text-sm text-slate-300">{bit.content}</p>
                        <p className="text-xs text-slate-500 font-data mt-1">{new Date(bit.timestamp).toLocaleString('ru-RU')}</p>
                    </div>
                ))
            )}
        </div>
    </div>
);


const EventTimeline: React.FC<{ eventLog: EventLog[] }> = ({ eventLog }) => (
    <div className="h-full flex flex-col">
        <p className="text-sm text-slate-400 font-data mb-2">Журнал всех значимых событий в ядре системы.</p>
        <div className="flex-1 bg-slate-900/30 rounded-lg p-3 overflow-y-auto space-y-3">
            {[...eventLog].reverse().map(event => (
                <div key={event.id} className="text-sm flex gap-3">
                    <span className="font-data text-slate-500">{new Date(event.timestamp).toLocaleTimeString('ru-RU')}</span>
                    <span className="text-slate-300">{event.description}</span>
                </div>
            ))}
        </div>
    </div>
);

const GenesisArchive: React.FC<{ genesisPatches: GenesisPatch[] }> = ({ genesisPatches }) => (
     <div className="h-full flex flex-col">
        <p className="text-sm text-slate-400 font-data mb-2">Список всех изменений, внесенных в ядро через КодЛаб.</p>
        <div className="flex-1 bg-slate-900/30 rounded-lg p-3 overflow-y-auto space-y-2">
            {genesisPatches.length === 0 ? (
                <div className="text-center text-slate-500 text-xs h-full flex items-center justify-center">Патчи не найдены.</div>
            ) : (
                [...genesisPatches].reverse().map(patch => (
                    <div key={patch.id} className="text-sm flex gap-3 p-2 bg-slate-800/50 rounded-md" title={`КОД:\n\n${patch.properties?.code || patch.description}`}>
                        <GitCommit size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-slate-300 font-bold">{patch.description}</p>
                            <span className="font-data text-xs text-slate-500">{new Date(patch.createdAt || Date.now()).toLocaleString('ru-RU')}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

const CrystalArchive: React.FC<Omit<DataVaultProps, 'eventLog' | 'genesisPatches' | 'logosBits'>> = (props) => {
    const { crystals, onForge, onLoad, onDelete, onImport, onWipeAll, onStartImmersion } = props;
    const [importString, setImportString] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (crystal: MemoryCrystal) => {
        const crystalString = btoa(JSON.stringify(crystal));
        navigator.clipboard.writeText(crystalString);
        setCopiedId(crystal.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleImport = () => {
        try {
            const decodedString = atob(importString);
            const success = onImport(decodedString);
            if(success) {
                setImportString('');
                alert('Кристалл успешно манифестирован!');
            } else {
                 alert('Ошибка: Неверный формат кристалла.');
            }
        } catch (e) {
            alert('Ошибка: Неверная Base64 строка.');
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <button onClick={onForge} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50">
                <BookOpen size={20} /> Выковать Кристалл Памяти
            </button>
            <div className="flex-1 bg-slate-900/30 rounded-lg p-3 overflow-y-auto space-y-2">
                {crystals.length === 0 ? (
                    <div className="text-center text-slate-500 h-full flex items-center justify-center">Архив пуст.</div>
                ) : (
                    [...crystals].reverse().map(crystal => (
                        <div key={crystal.id} className="glass-panel p-3 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-bold text-amber-400">Кристалл #{crystal.id.slice(8)}</p>
                                <p className="text-xs text-slate-400 font-data">
                                    {new Date(crystal.timestamp).toLocaleString('ru-RU')} | Ур. {crystal.stateSnapshot.progression?.level ?? 1}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => onStartImmersion(crystal)} title="Погружение" className="p-2 hover:bg-slate-700 rounded-md transition"><Eye size={16} /></button>
                                <button onClick={() => onLoad(crystal)} title="Загрузить" className="p-2 hover:bg-slate-700 rounded-md transition"><Download size={16} /></button>
                                <button onClick={() => handleCopy(crystal)} title="Копировать" className="p-2 hover:bg-slate-700 rounded-md transition">{copiedId === crystal.id ? <Check size={16} className="text-green-400"/> : <Copy size={16} />}</button>
                                <button onClick={() => onDelete(crystal.id)} title="Удалить" className="p-2 hover:bg-red-900/50 text-red-400 rounded-md transition"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="flex gap-2">
                <input type="text" value={importString} onChange={(e) => setImportString(e.target.value)} placeholder="Вставить строку кристалла..." className="flex-1 bg-slate-900/70 border border-slate-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
                <button onClick={handleImport} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md transition flex items-center gap-2"><Upload size={16}/> Манифест</button>
            </div>
            <div className="border-t border-red-500/20 pt-4 mt-auto">
                <button onClick={onWipeAll} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/50">
                    <AlertTriangle size={16}/> Разбить все Кристаллы (Сброс)
                </button>
            </div>
        </div>
    );
};


export default DataVault;
