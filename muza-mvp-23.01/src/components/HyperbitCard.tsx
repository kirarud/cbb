
import React from 'react';
import { HyperBit, Language, ConsciousnessType } from '../types';
import { TYPE_LABELS } from '../constants';
import { calculateOptics } from '../services/opticsEngine';
import { ImageIcon } from 'lucide-react';

interface HyperbitCardProps {
  hyperbit: HyperBit;
  onClick?: () => void;
  language?: Language;
}

export const HyperbitCard: React.FC<HyperbitCardProps> = ({ hyperbit, onClick, language = 'en' }) => {
  // Optimization: Optics might not be stored, calculate if missing
  const optics = hyperbit.optics || calculateOptics(hyperbit.type, hyperbit.energy);
  const glowColor = optics.baseColor;
  
  const typeLabel = TYPE_LABELS[language][hyperbit.type];
  const isImage = hyperbit.type === ConsciousnessType.IMAGE;

  return (
    <div 
      onClick={onClick}
      className="relative p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-all cursor-pointer group overflow-hidden"
    >
      {/* Dynamic Glow Border on Hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${glowColor}, transparent 70%)` }}
      />
      
      <div className="flex justify-between items-start mb-2 relative z-10">
        <span 
          className="text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1"
          style={{ backgroundColor: `${glowColor}20`, color: glowColor }}
        >
          {isImage && <ImageIcon className="w-3 h-3" />}
          {typeLabel}
        </span>
        <span className="text-slate-500 text-xs font-mono">
          E:{(hyperbit.energy * 100).toFixed(0)}%
        </span>
      </div>
      
      {isImage ? (
          <div className="relative rounded-lg overflow-hidden border border-slate-700 mt-2 bg-black/50">
              <img 
                  src={hyperbit.content} 
                  alt="Neural Dream" 
                  className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  loading="lazy"
              />
          </div>
      ) : (
          <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 relative z-10">
            {hyperbit.content}
          </p>
      )}
      
      <div className="mt-3 flex items-center justify-between text-xs text-slate-600 relative z-10">
        <span>{new Date(hyperbit.timestamp).toLocaleTimeString()}</span>
        <span>ID: {hyperbit.id.slice(0,6)}</span>
      </div>
    </div>
  );
};