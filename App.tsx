import React, { useState, useEffect } from 'react';
import { AppState, StudyPlan, StudyModule } from './types';
import { generateStudyPlan } from './services/geminiService';
import PlanView from './components/PlanView';
import ModuleDetailView from './components/ModuleDetailView';
import QuizView from './components/QuizView';
import { BrainIcon } from './components/Icons';

const STORAGE_KEY = 'cognito_study_data';

const TIME_OPTIONS = [
    { label: 'Speed (1h)', value: 60 },
    { label: 'Normal (2h)', value: 120 },
    { label: 'Deep (5h)', value: 300 },
    { label: 'Expert (10h+)', value: 600 }
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.HOME);
  const [topic, setTopic] = useState('');
  const [targetTime, setTargetTime] = useState<number | null>(120);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [activeModule, setActiveModule] = useState<StudyModule | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSavedPlan, setHasSavedPlan] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.plan) {
          setHasSavedPlan(true);
        }
      } catch (e) {
        console.error("Failed to parse saved plan", e);
      }
    }
  }, []);

  useEffect(() => {
    if (plan) {
      const dataToSave = {
        plan,
        completedModules,
        lastUpdated: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setHasSavedPlan(true);
    }
  }, [plan, completedModules]);

  const handleCreatePlan = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    
    // Check if we already have a plan for this exact topic (case insensitive)
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.plan && parsed.plan.topic.toLowerCase() === topic.trim().toLowerCase()) {
          setPlan(parsed.plan);
          setCompletedModules(parsed.completedModules || []);
          setState(AppState.PLANNING);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error checking existing plan", e);
      }
    }

    try {
      const generatedPlan = await generateStudyPlan(topic, targetTime || undefined);
      generatedPlan.modules = generatedPlan.modules.map((m, i) => ({
          ...m,
          id: m.id || `mod-${Date.now()}-${i}`
      }));
      setPlan(generatedPlan);
      setCompletedModules([]);
      setState(AppState.PLANNING);
    } catch (err) {
      setError("Failed to create study plan. Please try a different topic or try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSavedPlan = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlan(parsed.plan);
        setCompletedModules(parsed.completedModules || []);
        setTopic(parsed.plan.topic);
        setState(AppState.PLANNING);
      } catch (e) {
        setError("Could not load the saved plan.");
      }
    }
  };

  const handleStartModule = (module: StudyModule) => {
    setActiveModule(module);
    setState(AppState.STUDYING);
  };

  const handleCompleteModule = () => {
    if (activeModule) {
        if (!completedModules.includes(activeModule.id)) {
            setCompletedModules(prev => [...prev, activeModule.id]);
        }
        setActiveModule(null);
        setState(AppState.PLANNING);
    }
  };

  const handleCloseDetail = () => {
    setActiveModule(null);
    setState(AppState.PLANNING);
  };

  const handleNewTopic = () => {
    setState(AppState.HOME);
    setTopic('');
  };

  const showLoadOption = hasSavedPlan && !topic.trim();

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700 overflow-x-hidden">
      
      {/* Premium Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={handleNewTopic}
          >
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-200 group-hover:scale-110 group-hover:rotate-12 transition-all">
                <BrainIcon className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">Cognito</span>
          </div>
          {state !== AppState.HOME && (
             <button 
                onClick={handleNewTopic}
                className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-2xl transition-all border border-slate-200/50"
             >
                New Goal
             </button>
          )}
        </div>
      </nav>

      <main className="pb-20">
        {state === AppState.HOME && (
          <div className="max-w-4xl mx-auto px-6 pt-24 sm:pt-40 text-center animate-fade-in relative">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-3xl -z-10 animate-pulse"></div>

            <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.9]">
              Learn <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600">Anything.</span><br/>
              Master <span className="underline decoration-indigo-200 underline-offset-8">Everything.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-14 max-w-2xl mx-auto font-medium leading-relaxed">
              Define your learning objective and available time. Our AI engineers a precision curriculum with real-world resources.
            </p>
            
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (showLoadOption ? handleLoadSavedPlan() : handleCreatePlan())}
                  placeholder="What do you want to learn today?"
                  className="relative w-full px-10 py-7 bg-white border border-slate-100 rounded-[2rem] text-2xl font-bold shadow-2xl shadow-slate-200/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="bg-white/70 backdrop-blur-md border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Duration Commitment</span>
                    <span className="text-2xl font-black text-indigo-600">
                        {targetTime ? (targetTime >= 60 ? `${Math.floor(targetTime/60)}h ${targetTime%60}m` : `${targetTime}m`) : 'Unrestricted'}
                    </span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    {TIME_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setTargetTime(opt.value)}
                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${targetTime === opt.value ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {showLoadOption && !topic.trim() ? (
                  <button
                    onClick={handleLoadSavedPlan}
                    className="w-full py-6 bg-emerald-600 text-white rounded-[1.8rem] font-black text-xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 flex items-center justify-center gap-3 active:scale-95"
                  >
                    Resume Journey
                  </button>
                ) : (
                  <button
                    onClick={handleCreatePlan}
                    disabled={loading || !topic.trim()}
                    className="w-full py-6 bg-indigo-600 text-white rounded-[1.8rem] font-black text-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95"
                  >
                    {loading ? (
                        <>
                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            Synthesizing...
                        </>
                    ) : 'Engineer My Plan'}
                  </button>
                )}
              </div>
            </div>
            
            {error && (
                <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-[1.5rem] text-sm font-bold inline-block border border-red-100">
                    {error}
                </div>
            )}

            <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
                {[
                    { title: 'Time Scaling', desc: 'Custom curriculums that dynamically adjust to your available window.' },
                    { title: 'Web Grounded', desc: 'Direct links to official docs, top articles, and high-signal videos.' },
                    { title: 'Socratic Tutor', desc: 'Interactive AI coaching that helps you derive answers, not just see them.' }
                ].map((f, i) => (
                    <div key={i} className="p-8 rounded-[2rem] bg-white border border-slate-50 shadow-xl shadow-slate-100/30 hover:border-indigo-100 transition-colors group">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                             <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                           </svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{f.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                    </div>
                ))}
            </div>
          </div>
        )}

        {state === AppState.PLANNING && plan && (
          <PlanView 
            plan={plan} 
            completedModules={completedModules}
            onStartModule={handleStartModule}
            onTakeQuiz={() => setState(AppState.QUIZ)}
          />
        )}

        {state === AppState.STUDYING && activeModule && (
          <ModuleDetailView 
            module={activeModule}
            onClose={handleCloseDetail}
            onComplete={handleCompleteModule}
          />
        )}

        {state === AppState.QUIZ && plan && (
            <QuizView 
                topic={plan.topic}
                onExit={() => setState(AppState.PLANNING)}
            />
        )}
      </main>
    </div>
  );
};

export default App;