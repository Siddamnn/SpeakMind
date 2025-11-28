import { useState, useEffect, useCallback, useRef } from 'react';
import type { Screen } from '../../App';
import { ExerciseLayout } from './ExerciseLayout';
import { generateExerciseContent, generateEncouragement, generateExerciseReflection } from '../../utils/exerciseAI';

interface StressBusterProps {
  onNavigate: (screen: Screen) => void;
}

type StressTechnique = {
  id: number;
  title: string;
  description: string;
  instruction: string;
  duration: number;
};

const TECHNIQUES: StressTechnique[] = [
  {
    id: 1,
    title: '5-4-3-2-1 Grounding',
    description: 'Ground yourself in the present moment',
    instruction: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste',
    duration: 60,
  },
  {
    id: 2,
    title: 'Progressive Muscle Relaxation',
    description: 'Release tension from your body',
    instruction: 'Tense each muscle group for 5 seconds, then release. Start from toes to head.',
    duration: 120,
  },
  {
    id: 3,
    title: 'Box Breathing',
    description: 'Calm your nervous system',
    instruction: 'Inhale for 4, hold for 4, exhale for 4, hold for 4. Repeat.',
    duration: 180,
  },
];

export const StressBuster = ({ onNavigate }: StressBusterProps) => {
  const [currentTechnique, setCurrentTechnique] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TECHNIQUES[0].duration);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [aiContent, setAiContent] = useState<{instruction: string; tips: string[]; encouragement: string} | null>(null);
  const [encouragement, setEncouragement] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [reflection, setReflection] = useState<string>('');
  const [completedTechniques, setCompletedTechniques] = useState<string[]>([]);
  
  // Interactive states - use refs to prevent reset on timer ticks
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const groundingItemsRef = useRef<{type: string; count: number; items: string[]}>({
    type: 'see',
    count: 5,
    items: []
  });
  const [groundingItems, setGroundingItems] = useState<{type: string; count: number; items: string[]}>({
    type: 'see',
    count: 5,
    items: []
  });
  const [muscleProgress, setMuscleProgress] = useState<string[]>([]);
  
  // Sync ref with state
  useEffect(() => {
    groundingItemsRef.current = groundingItems;
  }, [groundingItems]);

  const current = TECHNIQUES[currentTechnique];

  // Generate AI content when technique changes
  useEffect(() => {
    setIsLoadingAI(true);
    generateExerciseContent('stress', current.title)
      .then((content) => {
        setAiContent({
          instruction: content.personalizedInstruction || current.instruction,
          tips: content.tips.length > 0 ? content.tips : ['Take your time', 'Be gentle with yourself'],
          encouragement: content.encouragement || 'You\'re doing great!'
        });
        setIsLoadingAI(false);
      })
      .catch(() => {
        // Fallback to default
        setAiContent({
          instruction: current.instruction,
          tips: ['Take your time', 'Be gentle with yourself'],
          encouragement: 'You\'re doing great!'
        });
        setIsLoadingAI(false);
      });
  }, [currentTechnique, current.title, current.instruction]);

  // Generate and show AI encouragement at intervals
  useEffect(() => {
    if (isActive && timeLeft > 0 && timeLeft % 30 === 0 && timeLeft !== TECHNIQUES[currentTechnique].duration) {
      generateEncouragement('stress', timeLeft, current.title)
        .then((msg) => {
          setEncouragement(msg);
          setTimeout(() => setEncouragement(''), 5000);
        })
        .catch(() => {
          setEncouragement(aiContent?.encouragement || 'You\'re doing great!');
          setTimeout(() => setEncouragement(''), 5000);
        });
    }
  }, [timeLeft, isActive, currentTechnique, current.title, aiContent]);

  // Breathing animation for Box Breathing
  useEffect(() => {
    if (isActive && current.title === 'Box Breathing') {
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
      }, 4000); // 4 seconds per phase
      return () => clearInterval(breathingInterval);
    }
  }, [isActive, current.title]);

  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const newCompleted = [...completedTechniques, current.title];
          setCompletedTechniques(newCompleted);
          
          if (currentTechnique < TECHNIQUES.length - 1) {
            setTimeout(() => {
              setCurrentTechnique((prev) => prev + 1);
              setTimeLeft(TECHNIQUES[currentTechnique + 1].duration);
              // Reset interactive states
              setBreathingPhase('inhale');
              setGroundingItems({ type: 'see', count: 5, items: [] });
              setMuscleProgress([]);
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
    setTimeLeft(TECHNIQUES[0].duration);
    setIsActive(false);
    setIsComplete(false);
  };

  const handleComplete = async (completed: string[]) => {
    setIsActive(false);
    
    // Generate AI reflection
    generateExerciseReflection('stress', completed)
      .then((reflectionText) => {
        setReflection(reflectionText);
        setIsComplete(true);
      })
      .catch(() => {
        setReflection('You\'ve completed all stress relief techniques. Take a moment to notice how you feel.');
        setIsComplete(true);
      });
    
    setTimeout(() => onNavigate('meditation'), 5000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Interactive components - useCallback to prevent re-renders
  const BreathingGuide = useCallback(() => {
    if (current.title !== 'Box Breathing') return null;
    
    const getPhaseText = () => {
      switch (breathingPhase) {
        case 'inhale': return { text: 'Breathe In', count: '4' };
        case 'hold': return { text: 'Hold', count: '4' };
        case 'exhale': return { text: 'Breathe Out', count: '4' };
        case 'rest': return { text: 'Rest', count: '4' };
        default: return { text: 'Breathe', count: '' };
      }
    };

    const phase = getPhaseText();
    const scale = breathingPhase === 'inhale' ? 1.15 : breathingPhase === 'exhale' ? 0.85 : 1;

    return (
      <div className="flex flex-col items-center justify-center my-6">
        <div 
          className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center transition-all duration-4000"
          style={{
            transform: `scale(${scale})`,
          }}
        >
          <div className="text-center text-white">
            <div className="text-xl font-bold mb-1">{phase.text}</div>
            <div className="text-lg">{phase.count}</div>
          </div>
        </div>
      </div>
    );
  }, [current.title, breathingPhase]);

  const GroundingGuide = useCallback(() => {
    if (current.title !== '5-4-3-2-1 Grounding') return null;

    const groundingSteps = [
      { type: 'see', count: 5, label: '5 things you see' },
      { type: 'touch', count: 4, label: '4 things you can touch' },
      { type: 'hear', count: 3, label: '3 things you hear' },
      { type: 'smell', count: 2, label: '2 things you smell' },
      { type: 'taste', count: 1, label: '1 thing you taste' }
    ];

    const currentStep = groundingSteps.find(s => s.type === groundingItems.type) || groundingSteps[0];
    const filledCount = groundingItems.items.filter(Boolean).length;

    const handleInputChange = (idx: number, value: string) => {
      const newItems = [...groundingItems.items];
      newItems[idx] = value;
      setGroundingItems({ ...groundingItems, items: newItems });
    };

    const handleInputBlur = () => {
      if (groundingItems.items.filter(Boolean).length === currentStep.count) {
        const currentIndex = groundingSteps.findIndex(s => s.type === groundingItems.type);
        if (currentIndex < groundingSteps.length - 1) {
          setGroundingItems({
            type: groundingSteps[currentIndex + 1].type,
            count: groundingSteps[currentIndex + 1].count,
            items: []
          });
        }
      }
    };

    return (
      <div className="bg-white/20 backdrop-blur-md rounded-xl p-5 my-4">
        <h3 className="text-lg font-semibold text-white mb-3 text-center">{currentStep.label}</h3>
        
        <div className="space-y-2">
          {Array.from({ length: currentStep.count }).map((_, idx) => (
            <div key={`${groundingItems.type}-${idx}`} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                groundingItems.items[idx] 
                  ? 'bg-green-500 border-green-400' 
                  : 'bg-white/20 border-white/40'
              }`}>
                {groundingItems.items[idx] && <span className="text-white text-xs">✓</span>}
              </div>
              <input
                type="text"
                placeholder={`Item ${idx + 1}...`}
                defaultValue={groundingItems.items[idx] || ''}
                key={`${groundingItems.type}-${idx}-${groundingItems.items[idx] || ''}`}
                onChange={(e) => {
                  const newItems = [...groundingItems.items];
                  newItems[idx] = e.target.value;
                  setGroundingItems({ ...groundingItems, items: newItems });
                }}
                onBlur={() => {
                  if (groundingItems.items.filter(Boolean).length === currentStep.count) {
                    const currentIndex = groundingSteps.findIndex(s => s.type === groundingItems.type);
                    if (currentIndex < groundingSteps.length - 1) {
                      setGroundingItems({
                        type: groundingSteps[currentIndex + 1].type,
                        count: groundingSteps[currentIndex + 1].count,
                        items: []
                      });
                    }
                  }
                }}
                className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                disabled={!isActive}
              />
            </div>
          ))}
        </div>

        <div className="mt-3 text-center text-white/70 text-xs">
          {filledCount} / {currentStep.count} completed
        </div>
      </div>
    );
  }, [current.title, groundingItems, isActive]);

  const MuscleRelaxationGuide = useCallback(() => {
    if (current.title !== 'Progressive Muscle Relaxation') return null;

    const muscleGroups = ['Toes', 'Calves', 'Thighs', 'Hands', 'Arms', 'Shoulders', 'Face', 'Full Body'];
    const currentGroupIndex = Math.floor((TECHNIQUES[currentTechnique].duration - timeLeft) / 15);
    const currentGroup = muscleGroups[Math.min(currentGroupIndex, muscleGroups.length - 1)];

    return (
      <div className="bg-white/20 backdrop-blur-md rounded-xl p-5 my-4">
        <h3 className="text-lg font-semibold text-white mb-3 text-center">Focus: {currentGroup}</h3>
        <p className="text-white/80 text-sm text-center mb-4">Tense for 5 seconds, then release</p>

        <div className="grid grid-cols-2 gap-2">
          {muscleGroups.map((group, idx) => {
            const isActiveGroup = idx === currentGroupIndex;
            const isCompleted = idx < currentGroupIndex;
            
            return (
              <div
                key={group}
                className={`p-3 rounded-lg border transition-all ${
                  isActiveGroup
                    ? 'bg-orange-500/30 border-orange-400'
                    : isCompleted
                    ? 'bg-green-500/20 border-green-400/50'
                    : 'bg-white/10 border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">{group}</span>
                  {isCompleted && <span className="text-green-400 text-xs">✓</span>}
                  {isActiveGroup && <span className="text-orange-400 text-xs">●</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [current.title, currentTechnique, timeLeft]);

  return (
    <ExerciseLayout
      title="Stress Buster"
      subtitle="Quick techniques to release tension"
      backgroundImage="https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
      overlayColor="from-orange-500/90 to-red-600/90"
      onBack={() => onNavigate('meditation')}
    >
      {!isComplete ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="text-center space-y-4 w-full max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-1">{current.title}</h2>
            <p className="text-white/80 text-sm mb-4">{current.description}</p>
            
            {/* Simple Interactive Guides - Only show when active */}
            {isActive && current.title === 'Box Breathing' && <BreathingGuide />}
            {isActive && current.title === '5-4-3-2-1 Grounding' && <GroundingGuide />}
            {isActive && current.title === 'Progressive Muscle Relaxation' && <MuscleRelaxationGuide />}
            
            {/* Instructions - Show when not active or for non-interactive techniques */}
            {(!isActive || (current.title !== 'Box Breathing' && current.title !== '5-4-3-2-1 Grounding' && current.title !== 'Progressive Muscle Relaxation')) && (
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
                        <p className="text-white/70 text-xs mb-2 font-medium">Tips:</p>
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
              <div className="bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-lg p-3">
                <p className="text-green-100 text-xs">✨ {encouragement}</p>
              </div>
            )}
          </div>

          <div className="text-center w-full">
            {/* Simple Timer */}
            <div className="text-6xl font-bold text-white mb-2">{formatTime(timeLeft)}</div>
            <p className="text-white/70 text-sm mb-4">
              Technique {currentTechnique + 1} of {TECHNIQUES.length}
            </p>
            
            {/* Simple Progress Bar */}
            <div className="w-full max-w-xs mx-auto h-1.5 bg-white/20 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${((TECHNIQUES[currentTechnique].duration - timeLeft) / TECHNIQUES[currentTechnique].duration) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4">
            {!isActive ? (
              <button
                onClick={startExercise}
                className="bg-white text-orange-600 px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Start
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
          <div className="text-6xl">🎉</div>
          <h2 className="text-3xl font-bold text-white">Well Done!</h2>
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 max-w-md">
            <p className="text-white/90 text-lg text-center leading-relaxed">
              {reflection || 'You\'ve completed all stress relief techniques. Take a moment to notice how you feel. These techniques are always here when you need them.'}
            </p>
          </div>
        </div>
      )}
    </ExerciseLayout>
  );
};

export default StressBuster;

