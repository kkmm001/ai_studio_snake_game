
import React from 'react';
import { OracleComment } from '../types';

interface OracleMessageProps {
  comment: OracleComment | null;
  loading: boolean;
}

const OracleMessage: React.FC<OracleMessageProps> = ({ comment, loading }) => {
  return (
    <div className="min-h-[100px] w-full max-w-md p-4 bg-black/40 border-l-4 border-[#00f3ff] backdrop-blur-md rounded-r-lg flex flex-col justify-center transition-all duration-500 overflow-hidden">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 bg-[#00f3ff] animate-pulse rounded-full"></div>
        <span className="text-[10px] uppercase tracking-widest text-[#00f3ff] font-bold">Snake Oracle Interface</span>
      </div>
      
      {loading ? (
        <div className="flex gap-1 items-center">
            <div className="w-1 h-4 bg-[#00f3ff]/30 animate-[bounce_1s_infinite_0ms]"></div>
            <div className="w-1 h-4 bg-[#00f3ff]/30 animate-[bounce_1s_infinite_200ms]"></div>
            <div className="w-1 h-4 bg-[#00f3ff]/30 animate-[bounce_1s_infinite_400ms]"></div>
            <span className="text-xs text-slate-500 ml-2 italic">Decrypting oracle transmission...</span>
        </div>
      ) : comment ? (
        <p className={`text-lg italic font-medium leading-tight ${comment.type === 'snarky' ? 'text-pink-400' : comment.type === 'encouraging' ? 'text-green-400' : 'text-[#00f3ff]'}`}>
          "{comment.text}"
        </p>
      ) : (
        <p className="text-slate-500 italic text-sm">Waiting for the snake to challenge reality...</p>
      )}
    </div>
  );
};

export default OracleMessage;
