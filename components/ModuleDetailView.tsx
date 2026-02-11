import React, { useState, useEffect } from 'react';
import { StudyModule, ModuleResource } from '../types';
import { fetchModuleResources } from '../services/geminiService';
import TutorChat from './TutorChat';

interface ModuleDetailViewProps {
  overallTopic: string;
  module: StudyModule;
  onUpdate?: (module: StudyModule) => void;
  onClose: () => void;
  onComplete: () => void;
}

const ModuleDetailView: React.FC<ModuleDetailViewProps> = ({ overallTopic, module, onUpdate, onClose, onComplete }) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'tutor'>('resources');
  const [resources, setResources] = useState<ModuleResource[]>([]);
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  const getResources = async (forceRefresh = false) => {
    // 1. Check Cache
    if (!forceRefresh && module.content) {
      setResources(module.content.resources);
      setAdvice(module.content.advice);
      setIsFallback(!!module.content.isFallback);
      setLoading(false);
      return;
    }

    // 2. Fetch Fresh
    setLoading(true);
    const data = await fetchModuleResources(overallTopic, module.title, module.topics, module.estimatedMinutes);
    setResources(data.resources);
    setAdvice(data.advice);
    setIsFallback(!!data.isFallback);
    setLoading(false);

    // 3. Update Cache via Parent
    if (onUpdate) {
      onUpdate({
        ...module,
        content: {
          advice: data.advice,
          resources: data.resources,
          isFallback: !!data.isFallback
        }
      });
    }
  };

  useEffect(() => {
    getResources();
  }, [module.id]); // Changed dependency to module.id to avoid loops with object reference changes

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
        return (
          <a
            key={i}
            href={linkMatch[2]}
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
                {linkMatch[1]}
              </h4>
              {linkMatch[3] && (
                <p className="text-sm font-bold text-indigo-400 group-hover/link:text-indigo-100 transition-colors mt-2">
                  {linkMatch[3].replace(/^[\s\-\:]+/, '')}
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
                  {isFallback && (
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-50 px-5 py-2 rounded-full border border-amber-100 animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      Offline Mode
                    </span>
                  )}
                </div>
                <h1 className="text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-6">
                  {module.title}
                </h1>
                <p className="text-2xl text-slate-400 font-medium leading-relaxed max-w-3xl">
                  {module.description}
                </p>
                <div className="h-2 w-24 bg-indigo-600 mt-12 rounded-full" />
              </div>

              {/* Retry Banner for Fallback Mode */}
              {isFallback && !loading && (
                <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="text-xl font-black text-amber-800 mb-2">Live Search Unavailable</h4>
                    <p className="text-amber-700 font-medium leading-relaxed max-w-lg">
                      We've generated a high-fidelity analytical response using internal knowledge. Some external links may be missing.
                    </p>
                  </div>
                  <button
                    onClick={() => getResources()}
                    className="px-6 py-3 bg-white text-amber-700 font-bold rounded-xl border border-amber-200 shadow-sm hover:bg-amber-50 transition-all flex items-center gap-2 relative z-10 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Retry Search
                  </button>
                  {/* Decorative Background */}
                  <div className="absolute right-0 top-0 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                </div>
              )}

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