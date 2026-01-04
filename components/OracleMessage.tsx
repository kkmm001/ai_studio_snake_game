
import React from 'react';
import { OracleComment } from '../types';

interface OracleMessageProps {
  comment: OracleComment | null;
  loading: boolean;
}

const OracleMessage: React.FC<OracleMessageProps> = ({ comment, loading }) => {
  return (
    <div className="min-h-[100px] w-full max-w-md p-5 bg-white border-l-8 border-[#0f172a] shadow-lg rounded-r-xl flex flex-col justify-center transition-all duration-500 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2.5 h-2.5 bg-[#0891b2] animate-pulse rounded-full"></div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold">Neural Oracle Interface v4</span>
      </div>
      
      {loading ? (
        <div className="flex gap-1.5 items-center">
            <div className="w-1.5 h-5 bg-slate-200 animate-[bounce_1s_infinite_0ms]"></div>
            <div className="w-1.5 h-5 bg-slate-200 animate-[bounce_1s_infinite_200ms]"></div>
            <div className="w-1.5 h-5 bg-slate-200 animate-[bounce_1s_infinite_400ms]"></div>
            <span className="text-xs text-slate-400 ml-2 font-mono uppercase tracking-widest animate-pulse">Consulting Void...</span>
        </div>
      ) : comment ? (
        <p className={`text-xl font-bold leading-tight ${comment.type === 'snarky' ? 'text-pink-600' : comment.type === 'encouraging' ? 'text-green-600' : 'text-[#0f172a]'}`}>
          "{comment.text}"
        </p>
      ) : (
        <p className="text-slate-400 font-medium text-sm tracking-wide">Ready for primary directive input.</p>
      )}
    </div>
  );
};

export default OracleMessage;
