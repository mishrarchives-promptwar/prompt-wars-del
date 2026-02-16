import React from 'react';
import { AICommentary } from '../types';

interface Props {
  commentary: AICommentary | null;
  loading: boolean;
}

const AIHeckler: React.FC<Props> = ({ commentary, loading }) => {
  if (!commentary && !loading) return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 min-h-[100px] flex items-center justify-center text-gray-500">
      <p className="text-sm italic">Waiting for gameplay data...</p>
    </div>
  );

  const getBorderColor = (mood?: string) => {
    switch (mood) {
      case 'roasting': return 'border-red-500 text-red-400';
      case 'encouraging': return 'border-green-500 text-green-400';
      case 'sarcastic': return 'border-yellow-500 text-yellow-400';
      default: return 'border-blue-500 text-blue-400';
    }
  };

  return (
    <div className={`relative bg-gray-900 p-6 rounded-lg border-2 shadow-lg transition-colors duration-500 ${commentary ? getBorderColor(commentary.mood) : 'border-gray-700'}`}>
      <div className="absolute -top-3 left-4 bg-gray-900 px-2 text-xs font-bold uppercase tracking-wider text-gray-400">
        Game Director (Gemini)
      </div>
      
      {loading ? (
        <div className="flex items-center space-x-2 animate-pulse">
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
           <span className="text-xs text-gray-500 font-mono">Analyzing Board...</span>
        </div>
      ) : (
        <p className={`font-mono text-lg md:text-xl leading-relaxed ${commentary ? getBorderColor(commentary.mood).split(' ')[1] : 'text-gray-300'}`}>
          "{commentary?.text}"
        </p>
      )}
    </div>
  );
};

export default AIHeckler;
