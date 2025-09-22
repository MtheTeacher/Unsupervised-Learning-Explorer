import React, { useState } from 'react';
import { InfoIcon } from './Icons';

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-1" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children || <InfoIcon className="w-4 h-4 text-gray-400 cursor-help" />}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-xs text-center text-white bg-black/80 border border-white/20 rounded-md shadow-lg z-10">
          {text}
        </div>
      )}
    </div>
  );
};