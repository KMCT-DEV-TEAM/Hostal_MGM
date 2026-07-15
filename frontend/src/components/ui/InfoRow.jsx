import React from 'react';

const InfoRow = ({ label, children }) => (
  <div className="flex text-xs gap-3 items-start py-1">
    <span className="text-gray-500 w-28 shrink-0 flex items-center gap-1.5">{label}</span>
    <span className="text-gray-400 shrink-0 -ml-1">:</span>
    <span className="font-medium text-black flex-1 break-words whitespace-pre-wrap overflow-hidden" style={{ wordBreak: 'break-word' }}>{children}</span>
  </div>
);

export default InfoRow;
