
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;
        const gap = 8; // distance from element

        // Adjust coordinates based on window scroll to ensure fixed positioning is correct
        // Note: If using fixed positioning in portal, we rely on clientRect (viewport relative)
        switch (position) {
            case 'top':
                top = rect.top - gap;
                left = rect.left + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + rect.width / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - gap;
                break;
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + gap;
                break;
        }
        setCoords({ top, left });
    }
  }, [isVisible, position]);

  const tooltipElement = isVisible ? (
      <div 
        className="fixed z-[9999] px-3 py-2 text-xs text-white bg-slate-900 border border-slate-600 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
        style={{ 
            top: coords.top, 
            left: coords.left, 
            transform: position === 'top' ? 'translate(-50%, -100%)' : 
                       position === 'bottom' ? 'translate(-50%, 0)' :
                       position === 'left' ? 'translate(-100%, -50%)' :
                       'translate(0, -50%)' 
        }}
      >
          {content}
          {/* Arrow */}
          <div className="absolute w-2 h-2 bg-slate-900 border-r border-b border-slate-600 transform rotate-45"
            style={{
                bottom: position === 'top' ? '-5px' : 'auto',
                top: position === 'bottom' ? '-5px' : 'auto',
                left: (position === 'top' || position === 'bottom') ? 'calc(50% - 4px)' : (position === 'left' ? 'auto' : '-5px'),
                right: position === 'left' ? '-5px' : 'auto',
                display: 'block'
            }}
          />
      </div>
  ) : null;

  // Use Portal to render outside of any overflow:hidden containers
  return (
    <>
        <div 
            ref={triggerRef}
            className="relative flex items-center justify-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onTouchStart={() => setIsVisible(true)}
            onTouchEnd={() => setIsVisible(false)}
        >
            {children}
        </div>
        {typeof document !== 'undefined' && document.body && createPortal(tooltipElement, document.body)}
    </>
  );
};