import React, { useState, useEffect } from 'react';
import { QuizQuestion, QuizResult } from '../types';
import { generateQuiz } from '../services/geminiService';
import { BrainIcon } from './Icons';

interface QuizViewProps {
  topic: string;
  onExit: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ topic, onExit }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await generateQuiz(topic, 'medium');
        setQuestions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === questions[currentQIndex].correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium">Generating quiz questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
      return (
        <div className="text-center p-8">
            <p className="text-red-500 mb-4">Failed to load quiz questions.</p>
            <button onClick={onExit} className="text-indigo-600 underline">Return to Plan</button>
        </div>
      )
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-xl mx-auto mt-12 text-center bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
        <div className="inline-flex p-4 bg-indigo-50 rounded-full mb-6">
            <BrainIcon className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Quiz Complete!</h2>
        <p className="text-slate-500 mb-8">Here is how you performed on {topic}</p>
        
        <div className="flex justify-center items-end gap-2 mb-8">
            <span className="text-6xl font-black text-indigo-600">{percentage}%</span>
            <span className="text-slate-400 text-xl font-medium mb-2">Score</span>
        </div>

        <div className="flex gap-4 justify-center">
            <button 
                onClick={onExit}
                className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
                Return to Plan
            </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQIndex];

  return (
    <div className="max-w-2xl mx-auto mt-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Question {currentQIndex + 1} of {questions.length}</span>
            <span>Score: {score}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
                className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
            />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 leading-relaxed">
            {currentQuestion.question}
        </h3>

        <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
                let cardClass = "w-full text-left p-4 rounded-xl border transition-all duration-200 font-medium ";
                if (isAnswered) {
                    if (idx === currentQuestion.correctAnswerIndex) {
                        cardClass += "bg-green-50 border-green-500 text-green-700";
                    } else if (idx === selectedOption) {
                        cardClass += "bg-red-50 border-red-500 text-red-700";
                    } else {
                        cardClass += "bg-white border-slate-200 text-slate-400 opacity-50";
                    }
                } else {
                    cardClass += "bg-white border-slate-200 text-slate-700 hover:border-indigo-600 hover:bg-indigo-50";
                }

                return (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        disabled={isAnswered}
                        className={cardClass}
                    >
                        <span className="inline-block w-6 font-bold opacity-60 mr-2">{String.fromCharCode(65 + idx)}.</span>
                        {option}
                    </button>
                );
            })}
        </div>

        {isAnswered && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-200">
                <span className="font-bold block mb-1 text-slate-800">Explanation:</span>
                {currentQuestion.explanation}
            </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
            onClick={handleNext}
            disabled={!isAnswered}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
            {currentQIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

export default QuizView;