import { useState, useEffect } from 'react';
import type { Screen } from '../../App';
import { ExerciseLayout } from './ExerciseLayout';
import { generateExerciseContent, generateEncouragement, generateExerciseReflection } from '../../utils/exerciseAI';

interface AnxietySOSProps {
  onNavigate: (screen: Screen) => void;
}

type SOSTechnique = {
  id: number;
  title: string;
  instruction: string;
  duration: number;
};

const SOS_TECHNIQUES: SOSTechnique[] = [
  {
    id: 1,
    title: '4-7-8 Breathing',
    instruction: 'Inhale through nose for 4 counts, hold for 7, exhale through mouth for 8. Repeat 4 times.',
    duration: 120,
  },
  {
    id: 2,
    title: '5 Senses Check',
    instruction: 'Focus on: 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
    duration: 90,
  },
  {
    id: 3,
    title: 'Progressive Release',
    instruction: 'Tense and release each muscle group. Start with your toes, work up to your head.',
    duration: 180,
  },
  {
    id: 4,
    title: 'Safe Place Visualization',
    instruction: 'Imagine a place where you feel completely safe. Picture every detail. Stay there for a moment.',
    duration: 120,
  },
];

export const AnxietySOS = ({ onNavigate }: AnxietySOSProps) => {
  const [currentTechnique, setCurrentTechnique] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SOS_TECHNIQUES[0].duration);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [aiContent, setAiContent] = useState<{instruction: string; tips: string[]; encouragement: string} | null>(null);
  const [encouragement, setEncouragement] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [reflection, setReflection] = useState<string>('');
  const [completedTechniques, setCompletedTechniques] = useState<string[]>([]);
  
  // Interactive states
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [sensesProgress, setSensesProgress] = useState<{[key: string]: string[]}>({
    see: [],
    touch: [],
    hear: [],
    smell: [],
    taste: []
  });
  const [safePlaceDescription, setSafePlaceDescription] = useState('');

  const current = SOS_TECHNIQUES[currentTechnique];

  // Generate AI content when technique changes
  useEffect(() => {
    setIsLoadingAI(true);
    generateExerciseContent('anxiety', current.title)
      .then((content) => {
        setAiContent({
          instruction: content.personalizedInstruction || current.instruction,
          tips: content.tips.length > 0 ? content.tips : ['You are safe', 'This feeling will pass'],
          encouragement: content.encouragement || 'You\'re taking care of yourself.'
        });
        setIsLoadingAI(false);
      })
      .catch(() => {
        setAiContent({
          instruction: current.instruction,
          tips: ['You are safe', 'This feeling will pass'],
          encouragement: 'You\'re taking care of yourself.'
        });
        setIsLoadingAI(false);
      });
  }, [currentTechnique, current.title, current.instruction]);

  // Generate and show AI encouragement at intervals
  useEffect(() => {
    if (isActive && timeLeft > 0 && timeLeft % 30 === 0 && timeLeft !== SOS_TECHNIQUES[currentTechnique].duration) {
      generateEncouragement('anxiety', timeLeft, current.title)
        .then((msg) => {
          setEncouragement(msg);
          setTimeout(() => setEncouragement(''), 5000);
        })
        .catch(() => {
          setEncouragement(aiContent?.encouragement || 'You\'re safe. This feeling will pass.');
          setTimeout(() => setEncouragement(''), 5000);
        });
    }
  }, [timeLeft, isActive, currentTechnique, current.title, aiContent]);

  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const newCompleted = [...completedTechniques, current.title];
          setCompletedTechniques(newCompleted);
          
          if (currentTechnique < SOS_TECHNIQUES.length - 1) {
            setTimeout(() => {
              setCurrentTechnique((prev) => prev + 1);
              setTimeLeft(SOS_TECHNIQUES[currentTechnique + 1].duration);
              setBreathingPhase('inhale');
              setSensesProgress({ see: [], touch: [], hear: [], smell: [], taste: [] });
              setSafePlaceDescription('');
            }, 100);
          } else {
            handleComplete(newCompleted);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, currentTechnique, current.title, completedTechniques]);

  const startExercise = () => setIsActive(true);
  const pauseExercise = () => setIsActive(false);
  const resetExercise = () => {
    setCurrentTechnique(0);
    setTimeLeft(SOS_TECHNIQUES[0].duration);
    setIsActive(false);
    setIsComplete(false);
  };

  const handleComplete = async (completed: string[]) => {
    setIsActive(false);
    
    generateExerciseReflection('anxiety', completed)
      .then((reflectionText) => {
        setReflection(reflectionText);
        setIsComplete(true);
      })
      .catch(() => {
        setReflection('You\'ve completed the anxiety relief sequence. You\'re safe, and you\'ve shown yourself that you can handle difficult moments.');
        setIsComplete(true);
      });
    
    setTimeout(() => onNavigate('meditation'), 5000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Breathing animation for 4-7-8 Breathing
  useEffect(() => {
    if (isActive && current.title === '4-7-8 Breathing') {
      const breathingInterval = setInterval(() => {
        setBreathingPhase((prev) => {
          switch (prev) {
            case 'inhale': return 'hold';
            case 'hold': return 'exhale';
            case 'exhale': return 'rest';
            case 'rest': return 'inhale';
            default: return 'inhale';
          }
        });
      }, 4000); // 4s inhale, 7s hold, 8s exhale, 1s rest = 20s cycle
      return () => clearInterval(breathingInterval);
    }
  }, [isActive, current.title]);


  return (
    <ExerciseLayout
      title="Anxiety SOS"
      subtitle="Emergency relief when anxiety strikes"
      backgroundImage="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
      overlayColor="from-blue-500/90 to-cyan-600/90"
      onBack={() => onNavigate('meditation')}
    >
      {!isComplete ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="text-center space-y-4 w-full max-w-xl mx-auto">
            <div className="bg-red-500/20 backdrop-blur-md border border-red-400/50 rounded-full px-4 py-2 mb-2">
              <span className="text-red-200 font-semibold text-sm">SOS MODE</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{current.title}</h2>
            
            {/* Simple Interactive Guides - Only when active */}
            {isActive && current.title === '4-7-8 Breathing' && (
              <div className="my-6">
                <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center mx-auto transition-all duration-4000"
                  style={{
                    transform: breathingPhase === 'inhale' ? 'scale(1.2)' : breathingPhase === 'exhale' ? 'scale(0.8)' : 'scale(1)'
                  }}
                >
                  <div className="text-center text-white">
                    <div className="text-lg font-bold">{breathingPhase === 'inhale' ? 'Inhale 4' : breathingPhase === 'hold' ? 'Hold 7' : breathingPhase === 'exhale' ? 'Exhale 8' : 'Rest'}</div>
                  </div>
                </div>
              </div>
            )}
            
            {isActive && current.title === '5 Senses Check' && (
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 my-4">
                <h3 className="text-base font-semibold text-white mb-3">Ground Yourself</h3>
                <div className="space-y-2">
                  {Object.entries(sensesProgress).map(([key, items]) => {
                    const sense = { see: { label: 'See', count: 5 }, touch: { label: 'Touch', count: 4 }, hear: { label: 'Hear', count: 3 }, smell: { label: 'Smell', count: 2 }, taste: { label: 'Taste', count: 1 } }[key];
                    if (!sense) return null;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="text-white/80 text-xs">{sense.label} ({items.length}/{sense.count})</div>
                        <div className="grid grid-cols-2 gap-1">
                          {Array.from({ length: sense.count }).map((_, idx) => (
                            <input
                              key={`${key}-${idx}`}
                              type="text"
                              placeholder={`${idx + 1}...`}
                              value={items[idx] || ''}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[idx] = e.target.value;
                                setSensesProgress({ ...sensesProgress, [key]: newItems });
                              }}
                              className="bg-white/20 border border-white/30 rounded px-2 py-1 text-white text-xs placeholder-white/50 focus:outline-none"
                              disabled={!isActive}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {isActive && current.title === 'Safe Place Visualization' && (
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 my-4">
                <h3 className="text-base font-semibold text-white mb-2">Describe Your Safe Place</h3>
                <textarea
                  value={safePlaceDescription}
                  onChange={(e) => setSafePlaceDescription(e.target.value)}
                  placeholder="Imagine a safe, peaceful place..."
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:outline-none min-h-[100px] resize-none"
                  disabled={!isActive}
                />
              </div>
            )}
            
            {/* Instructions - Show when not active */}
            {!isActive && (
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-5 space-y-3">
                {isLoadingAI ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span className="ml-2 text-white/80 text-sm">Loading guidance...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-white text-base leading-relaxed">
                      {aiContent?.instruction || current.instruction}
                    </p>
                    {aiContent?.tips && aiContent.tips.length > 0 && (
                      <div className="pt-3 border-t border-white/20">
                        <p className="text-white/70 text-xs mb-2 font-medium">Reminders:</p>
                        <ul className="text-left space-y-1">
                          {aiContent.tips.map((tip, idx) => (
                            <li key={idx} className="text-white/80 text-xs">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {encouragement && (
              <div className="bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-lg p-3">
                <p className="text-blue-100 text-xs">💙 {encouragement}</p>
              </div>
            )}
          </div>

          <div className="text-center w-full">
            {/* Simple Timer */}
            <div className="text-6xl font-bold text-white mb-2">{formatTime(timeLeft)}</div>
            <p className="text-white/70 text-sm mb-4">
              Step {currentTechnique + 1} of {SOS_TECHNIQUES.length}
            </p>
            
            {/* Simple Progress Bar */}
            <div className="w-full max-w-xs mx-auto h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${((SOS_TECHNIQUES[currentTechnique].duration - timeLeft) / SOS_TECHNIQUES[currentTechnique].duration) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4">
            {!isActive ? (
              <button
                onClick={startExercise}
                className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Start Now
              </button>
            ) : (
              <button
                onClick={pauseExercise}
                className="bg-white/20 backdrop-blur-md text-white border-2 border-white/30 px-8 py-3 rounded-full font-semibold hover:bg-white/30 transition-all"
              >
                Pause
              </button>
            )}
            <button
              onClick={resetExercise}
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-full font-semibold hover:bg-white/20 transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="text-6xl">✨</div>
          <h2 className="text-3xl font-bold text-white">You're Safe</h2>
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 max-w-md">
            <p className="text-white/90 text-lg text-center leading-relaxed">
              {reflection || 'You\'ve completed the anxiety relief sequence. You\'re safe, and you\'ve shown yourself that you can handle difficult moments.'}
            </p>
          </div>
        </div>
      )}
    </ExerciseLayout>
  );
};

export default AnxietySOS;

