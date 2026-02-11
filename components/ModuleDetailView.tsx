import React, { useState, useEffect } from 'react';
import { StudyModule, ModuleResource } from '../types';
import { fetchModuleResources } from '../services/geminiService';
import TutorChat from './TutorChat';

interface ModuleDetailViewProps {
  module: StudyModule;
  onClose: () => void;
  onComplete: () => void;
}

const ModuleDetailView: React.FC<ModuleDetailViewProps> = ({ module, onClose, onComplete }) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'tutor'>('resources');
  const [resources, setResources] = useState<ModuleResource[]>([]);
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getResources = async () => {
      setLoading(true);
      const data = await fetchModuleResources(module.title, module.topics, module.estimatedMinutes);
      setResources(data.resources);
      setAdvice(data.advice);
      setLoading(false);
    };
    getResources();
  }, [module]);

  // Utility to handle inline bolding **text**
  const renderLineContent = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Advanced Parser for the curated advice
  const formatAdvice = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    
    return lines.map((line, i) => {
      const trimmed = line.trim();
      
      // 1. Big Headers (# Title)
      if (trimmed.startsWith('#')) {
        return (
          <h2 key={i} className="text-5xl sm:text-6xl font-black text-slate-900 mt-20 mb-10 first:mt-0 tracking-tighter leading-tight border-b-8 border-indigo-50 pb-4">
            {trimmed.replace(/#/g, '').trim()}
          </h2>
        );
      }

      // 2. Phase Headers (**Phase: ...**)
      const phaseMatch = trimmed.match(/^\*\*(Phase|Step|[\w\s-]+):\s*\*?\*?\s*(.*?)$/i);
      if (phaseMatch) {
        return (
          <div key={i} className="mt-14 mb-6 group">
            <div className="flex items-center gap-4 mb-4">
               <span className="px-4 py-1.5 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-indigo-100">
                 {phaseMatch[1].replace(/:$/, '')}
               </span>
               <div className="h-[2px] flex-1 bg-slate-100 rounded-full group-hover:bg-indigo-100 transition-colors" />
            </div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {phaseMatch[2].replace(/\*\*$/, '').trim()}
            </h3>
          </div>
        );
      }

      // 3. Isolated Links ([Title](URL))
      const linkMatch = trimmed.match(/^\[(.*?)\]\((.*?)\)(.*)$/);
      if (linkMatch) {
        const [_, title, url, description] = linkMatch;
        return (
          <a 
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row items-center gap-6 p-7 bg-indigo-50/40 hover:bg-indigo-600 border border-indigo-100/50 hover:border-indigo-400 rounded-[2.5rem] transition-all duration-500 group/link my-8 hover:shadow-[0_30px_60px_-15px_rgba(79,70,229,0.3)]"
          >
            <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-sm group-hover/link:rotate-12 transition-all duration-500 group-hover/link:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-2xl font-black text-slate-900 group-hover/link:text-white transition-colors tracking-tight">
                {title}
              </h4>
              {description && (
                <p className="text-sm font-bold text-indigo-400 group-hover/link:text-indigo-100 transition-colors mt-2">
                  {description.replace(/^[\s\-\:]+/, '')}
                </p>
              )}
            </div>
            <div className="p-3 bg-white/10 rounded-full text-indigo-300 group-hover/link:text-white transition-all group-hover/link:translate-x-1 group-hover/link:-translate-y-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
            </div>
          </a>
        );
      }

      // 4. Bullets (* or -)
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        return (
          <div key={i} className="flex gap-5 mb-5 pl-5 group/bullet">
             <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-3.5 group-hover/bullet:scale-150 transition-transform flex-shrink-0" />
             <p className="text-2xl text-slate-600 font-medium leading-relaxed">
               {renderLineContent(trimmed.replace(/^[-*]\s*/, '').trim())}
             </p>
          </div>
        );
      }

      // 5. Standard Paragraphs
      return (
        <p key={i} className="text-2xl text-slate-500 font-medium leading-relaxed mb-10 last:mb-0">
          {renderLineContent(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in overflow-hidden">
      <div className="bg-white w-full max-w-6xl h-[95vh] rounded-[4.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border border-white/10">
        
        {/* Compact Sticky Header */}
        <div className="px-14 py-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('resources')}
              className={`py-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-full border-2 ${activeTab === 'resources' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-100 text-slate-400 hover:text-indigo-600'}`}
            >
              Tactical Flow
            </button>
            <button 
              onClick={() => setActiveTab('tutor')}
              className={`py-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-full border-2 ${activeTab === 'tutor' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-100 text-slate-400 hover:text-indigo-600'}`}
            >
              Live Assistant
            </button>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={onComplete}
              className="px-8 py-3 bg-slate-900 text-white hover:bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 group"
            >
              Finish Step
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </button>
            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all hover:rotate-90">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Flow */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar selection:bg-indigo-100">
          {activeTab === 'resources' ? (
            <div className="p-14 lg:p-28 space-y-12 max-w-5xl mx-auto pb-60">
              {/* Module Headline - Now part of scrollable content */}
              <div className="mb-20 animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100">
                        Precision Module
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 bg-slate-50 px-5 py-2 rounded-full">
                        {module.estimatedMinutes}m Session
                    </span>
                </div>
                <h1 className="text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-6">
                    {module.title}
                </h1>
                <p className="text-2xl text-slate-400 font-medium leading-relaxed max-w-3xl">
                    {module.description}
                </p>
                <div className="h-2 w-24 bg-indigo-600 mt-12 rounded-full" />
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-12">
                  <div className="relative">
                    <div className="w-24 h-24 border-[8px] border-slate-50 border-t-indigo-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Syncing Curriculum...</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applying temporal constraints</p>
                  </div>
                </div>
              ) : (
                <article className="animate-fade-in-up">
                  {formatAdvice(advice)}
                </article>
              )}
            </div>
          ) : (
            <div className="h-full">
              <TutorChat module={module} onClose={onClose} onComplete={onComplete} isEmbedded={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleDetailView;