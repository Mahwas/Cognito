import React from 'react';
import { StudyPlan, StudyModule } from '../types';
import { BookOpenIcon, BrainIcon, ChevronRightIcon, CheckCircleIcon } from './Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PlanViewProps {
  plan: StudyPlan;
  completedModules: string[];
  onStartModule: (module: StudyModule) => void;
  onTakeQuiz: () => void;
}

const PlanView: React.FC<PlanViewProps> = ({ plan, completedModules, onStartModule, onTakeQuiz }) => {
  const totalMinutes = plan.modules.reduce((acc, m) => acc + m.estimatedMinutes, 0);
  const formattedTotal = totalMinutes >= 60 
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` 
    : `${totalMinutes}m`;

  const chartData = plan.modules.map((m, i) => ({
    name: `Mod ${i + 1}`,
    duration: m.estimatedMinutes,
    completed: completedModules.includes(m.id)
  }));

  return (
    <div className="max-w-6xl mx-auto p-6 sm:p-10 space-y-12 animate-fade-in">
      <header className="text-center space-y-6 mb-12">
        <div className="inline-flex items-center justify-center p-5 bg-indigo-600 rounded-[2rem] text-white mb-2 shadow-2xl shadow-indigo-200 animate-float">
           <BookOpenIcon className="w-10 h-10" />
        </div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">{plan.topic}</h2>
        <div className="flex items-center justify-center gap-4">
             <div className="px-5 py-2 bg-white border border-slate-100 text-slate-600 rounded-2xl text-sm font-extrabold shadow-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-indigo-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formattedTotal} Plan
             </div>
             <div className="px-5 py-2 bg-indigo-600 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-indigo-100">
                {plan.modules.length} Modules
             </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Modules List */}
        <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-end mb-4 px-2">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Curriculum</h3>
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{completedModules.length} of {plan.modules.length} Done</span>
            </div>
          {plan.modules.map((module, index) => {
            const isCompleted = completedModules.includes(module.id);
            return (
              <button 
                key={module.id}
                onClick={() => onStartModule(module)}
                className={`w-full text-left group relative bg-white border rounded-[2.5rem] p-8 transition-all duration-300 hover:shadow-2xl hover:border-indigo-300 hover:scale-[1.02] ${isCompleted ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100 shadow-sm'}`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <span className={`flex items-center justify-center w-12 h-12 rounded-2xl text-lg font-black transition-all duration-300 ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-12'}`}>
                            {isCompleted ? <CheckCircleIcon className="w-6 h-6"/> : index + 1}
                        </span>
                        <h4 className={`text-2xl font-black tracking-tight transition-colors ${isCompleted ? 'text-emerald-900' : 'text-slate-900 group-hover:text-indigo-600'}`}>{module.title}</h4>
                    </div>
                    <p className="text-slate-500 text-lg mb-6 leading-relaxed pr-8 line-clamp-2">{module.description}</p>
                    <div className="flex flex-wrap gap-2">
                        {module.topics.map(t => (
                            <span key={t} className="px-4 py-1.5 bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors border border-slate-100 group-hover:border-indigo-100">
                                {t}
                            </span>
                        ))}
                    </div>
                  </div>
                  
                  <div className="mt-2 p-3 rounded-2xl bg-slate-50 text-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm self-start">
                    <ChevronRightIcon className="w-7 h-7" />
                  </div>
                </div>
                <div className="absolute top-10 right-20 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {module.estimatedMinutes}m
                </div>
              </button>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Timeline</h3>
                <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} fontWeight={800} />
                            <Tooltip 
                                cursor={{fill: '#f1f5f9', radius: 10}} 
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontWeight: 800, padding: '12px' }}
                            />
                            <Bar dataKey="duration" radius={[8, 8, 8, 8]} barSize={32}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.completed ? '#10b981' : '#6366f1'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-center font-black text-slate-400 mt-6 uppercase tracking-widest">Temporal breakdown</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                            <BrainIcon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Final Check</h3>
                    </div>
                    <p className="text-indigo-100 text-lg mb-8 leading-relaxed font-medium">Verify your mastery with a personalized AI assessment challenge.</p>
                    <button 
                        onClick={onTakeQuiz}
                        className="w-full py-5 px-6 bg-white text-indigo-700 rounded-[1.5rem] font-black text-lg hover:bg-indigo-50 hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-indigo-950/20"
                    >
                        Start Challenge
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PlanView;