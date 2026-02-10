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
      const data = await fetchModuleResources(module.title, module.topics);
      setResources(data.resources);
      setAdvice(data.advice);
      setLoading(false);
    };
    getResources();
  }, [module]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
      <div className="bg-white w-full max-w-5xl h-[92vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
        
        {/* Modern Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex-1">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-2">{module.title}</h3>
            <div className="flex flex-wrap items-center gap-2">
              {module.topics.map(t => (
                <span key={t} className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/50">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onComplete}
              className="px-6 py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95"
            >
              Mark Done
            </button>
            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Minimal Tab Switcher */}
        <div className="flex px-8 bg-white border-b border-slate-50">
          <button 
            onClick={() => setActiveTab('resources')}
            className={`py-4 px-6 text-sm font-extrabold transition-all border-b-4 relative ${activeTab === 'resources' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Resources & Guidance
            {activeTab === 'resources' && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full -mb-1"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('tutor')}
            className={`py-4 px-6 text-sm font-extrabold transition-all border-b-4 relative ${activeTab === 'tutor' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Interactive Tutor
            {activeTab === 'tutor' && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full -mb-1"></span>}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#fcfdfe]">
          {activeTab === 'resources' ? (
            <div className="p-8 lg:p-12 space-y-12 max-w-4xl mx-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-indigo-600 rounded-full animate-pulse" />
                    </div>
                  </div>
                  <p className="text-slate-500 font-bold tracking-tight text-lg">Curating the best material for you...</p>
                </div>
              ) : (
                <>
                  {/* Big Headline Strategy Section */}
                  <section className="relative">
                    <div className="absolute -left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full hidden md:block opacity-20"></div>
                    <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Expert Strategy</h2>
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 text-indigo-100 group-hover:text-indigo-200 transition-colors pointer-events-none">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-24 h-24 opacity-10">
                            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
                         </svg>
                      </div>
                      <div className="relative text-slate-700 leading-[1.7] text-lg font-medium space-y-4">
                        {advice.split('\n').filter(l => l.trim()).map((line, i) => (
                          <p key={i} className="flex gap-4">
                             <span className="text-indigo-400 font-black">0{i+1}</span>
                             <span>{line}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Big Headline Resources Section */}
                  <section>
                    <div className="flex items-end justify-between mb-8 px-2">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Top Learning Path</h2>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">Powered by Google</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resources.length > 0 ? resources.map((res, i) => (
                        <a 
                          key={i} 
                          href={res.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex flex-col p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all group"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl transition-all shadow-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                              </svg>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-all">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                            </svg>
                          </div>
                          <h4 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors mb-2 line-clamp-2 leading-tight">
                            {res.title}
                          </h4>
                          <div className="mt-auto flex items-center gap-2">
                            <img src={`https://www.google.com/s2/favicons?domain=${res.url}&sz=32`} className="w-4 h-4 rounded-sm" alt="" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{res.source}</p>
                          </div>
                        </a>
                      )) : (
                        <div className="col-span-full py-16 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                           <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 19.5 18v-4.162c0-.223-.033-.445-.098-.659l-1.952-6.432A2.25 2.25 0 0 0 15.302 4.5H8.698a2.25 2.25 0 0 0-2.148 1.587L4.598 12.52a2.25 2.25 0 0 1-.098.659Z" />
                             </svg>
                           </div>
                           <p className="text-slate-400 font-bold">No direct links found, use the advice strategy!</p>
                        </div>
                      )}
                    </div>
                  </section>
                </>
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