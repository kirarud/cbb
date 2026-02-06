

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Globe, Users, Zap, Share2, Activity, Radio, ShieldCheck, User, Network, Heart } from 'lucide-react';
import { Language, SystemLog, PeerNode, HyperBit, EmotionType, ConsciousnessType } from '../types';
import { TRANSLATIONS, EMOTION_COLORS } from '../constants';
import { HyperbitCard } from '../components/HyperbitCard';
import { processExperience } from '../services/progressionService';

interface SocialProps {
    language: Language;
    username: string;
    muzaState: any;
    setMuzaState: any;
    hiveFeed: HyperBit[];
    onEcho: (hb: HyperBit) => void;
}

export const Social: React.FC<SocialProps> = ({ language, username, muzaState, setMuzaState, hiveFeed, onEcho }) => {
  const t = TRANSLATIONS[language].social;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activePeers, setActivePeers] = useState<PeerNode[]>([
      { id: 'alpha', name: 'Node-Alpha', status: 'CONNECTED', role: 'LOGIC', latency: 45, sharedBits: 124 },
      { id: 'beta', name: 'Node-Beta', status: 'CONNECTED', role: 'CREATIVE', latency: 12, sharedBits: 890 },
      { id: 'gamma', name: 'Node-Gamma', status: 'IDLE', role: 'STORAGE', latency: 120, sharedBits: 5 }
  ]);

  // --- HIVE CONSENSUS ALGORITHM ---
  const consensus = useMemo(() => {
      if (hiveFeed.length === 0) return { emotion: EmotionType.NEUTRAL, strength: 0 };
      const counts: Record<string, number> = {};
      hiveFeed.forEach(bit => {
          counts[bit.type] = (counts[bit.type] || 0) + bit.energy;
      });
      let dominant = EmotionType.NEUTRAL;
      let maxVal = 0;
      Object.entries(counts).forEach(([type, val]) => {
          if (val > maxVal) { maxVal = val; dominant = EmotionType.HAPPY; } // Simple mapping
      });
      return { emotion: dominant, strength: Math.min(1, maxVal / hiveFeed.length) };
  }, [hiveFeed]);

  // --- SWARM VISUALIZATION ---
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrame: number;
      let time = 0;

      const render = () => {
          time += 0.01;
          canvas.width = canvas.parentElement?.clientWidth || 400;
          canvas.height = canvas.parentElement?.clientHeight || 400;

          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Central Pulse (Consensus)
          const pulse = 40 + Math.sin(time * 3) * 10;
          const color = EMOTION_COLORS[consensus.emotion] || '#22d3ee';
          
          ctx.shadowBlur = 40;
          ctx.shadowColor = color;
          ctx.beginPath();
          ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
          ctx.fillStyle = `${color}22`;
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Mesh Connections
          activePeers.forEach((peer, i) => {
              const angle = (i / activePeers.length) * Math.PI * 2 + time * 0.2;
              const dist = 140 + Math.sin(time + i) * 20;
              const px = cx + Math.cos(angle) * dist;
              const py = cy + Math.sin(angle) * dist;

              // Data flow line
              ctx.beginPath();
              ctx.moveTo(cx, cy);
              ctx.lineTo(px, py);
              ctx.setLineDash([5, 15]);
              ctx.lineDashOffset = -time * 30;
              ctx.strokeStyle = peer.status === 'CONNECTED' ? '#4ade8044' : '#94a3b822';
              ctx.stroke();
              ctx.setLineDash([]);

              // Peer Node
              ctx.beginPath();
              ctx.arc(px, py, 6, 0, Math.PI * 2);
              ctx.fillStyle = peer.role === 'LOGIC' ? '#60a5fa' : '#c084fc';
              ctx.fill();
          });

          animationFrame = requestAnimationFrame(render);
      };
      render();
      return () => cancelAnimationFrame(animationFrame);
  }, [activePeers, consensus]);

  const handleManualSync = () => {
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 2000);
  };

  const handleEcho = (hb: HyperBit) => {
      onEcho(hb);
      const { newState } = processExperience(muzaState, 'IMPORT', hb.type);
      setMuzaState(newState);
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-hidden flex flex-col bg-slate-950 relative">
      {isScanning && <div className="absolute inset-0 z-50 pointer-events-none scan-wave opacity-20 bg-cyan-500"></div>}
      
      <div className="max-w-7xl w-full mx-auto flex flex-col h-full gap-8">
        <div className="flex justify-between items-end shrink-0">
          