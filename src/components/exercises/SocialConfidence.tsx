import { useState, useEffect } from 'react';
import type { Screen } from '../../App';
import { ExerciseLayout } from './ExerciseLayout';
import { generateExerciseContent, generateEncouragement, generateExerciseReflection } from '../../utils/exerciseAI';

interface SocialConfidenceProps {
  onNavigate: (screen: Screen) => void;
}

type ConfidenceExercise = {
  id: number;
  title: string;
  description: string;
  practice: string;
  affirmation: string;
  duration: number;
};

const EXERCISES: ConfidenceExercise[] = [
  {
    id: 1,
    title: 'Power Poses',
    description: 'Build confidence through body language',
    practice: 'Stand tall, shoulders back, hands on hips. Hold for 2 minutes. Feel your confidence grow.',
    affirmation: 'I am confident and capable in social situations',
    duration: 120,
  },
  {
    id: 2,
    title: 'Conversation Starters',
    description: 'Practice engaging with others',
    practice: 'Think of 3 open-ended questions you could ask someone. Practice saying them out loud.',
    affirmation: 'I have interesting things to share and ask',
    duration: 180,
  },
  {
    id: 3,
    title: 'Self-Acceptance',
    description: 'Embrace your authentic self',
    practice: 'List 3 things you like about yourself. Say them with conviction. You are enough.',
    affirmation: 'I am worthy of connection and friendship',
    duration: 180,
  },
  {
    id: 4,
    title: 'Visualization',
    description: 'See yourself succeeding socially',
    practice: 'Close your eyes. Picture yourself in a social situation feeling confident and at ease.',
    affirmation: 'I am comfortable being myself around others',
    duration: 240,
  },
];

export const SocialConfidence = ({ onNavigate }: SocialConfidenceProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXERCISES[0].duration);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [aiContent, setAiContent] = useState<{instruction: string; tips: string[]; encouragement: string} | null>(null);
  const [encouragement, setEncouragement] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [reflection, setReflection] = useState<string>('');
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  
  // Interactive states
  const [isHoldingPose, setIsHoldingPose] = useState(false);
  const [conversationStarters, setConversationStarters] = useState<string[]>(['', '', '']);
  const [selfAcceptanceItems, setSelfAcceptanceItems] = useState<string[]>(['', '', '']);
  const [visualizationProgress, setVisualizationProgress] = useState(0);

  const exercise = EXERCISES[currentExercise];

  // Generate AI content when exercise changes
  useEffect(() => {
    setIsLoadingAI(true);
    generateExerciseContent('confidence', exercise.title)
      .then((content) => {
        setAiContent({
          instruction: content.personalizedInstruction || exercise.practice,
          tips: content.tips.length > 0 ? content.tips : ['You are worthy', 'Your voice matters'],
          encouragement: content.encouragement || exercise.affirmation
        });
        setIsLoadingAI(false);
      })
      .catch(() => {
        setAiContent({
          instruction: exercise.practice,
          tips: ['You are worthy', 'Your voice matters'],
          encouragement: exercise.affirmation
        });
        setIsLoadingAI(false);
      });
  }, [currentExercise, exercise.title, exercise.practice, exercise.affirmation]);

  // Generate and show AI encouragement at intervals
  useEffect(() => {
    if (isActive && timeLeft > 0 && timeLeft % 30 === 0 && timeLeft !== EXERCISES[currentExercise].duration) {
      generateEncouragement('confidence', timeLeft, exercise.title)
        .then((msg) => {
          setEncouragement(msg);
          setTimeout(() => setEncouragement(''), 5000);
        })
        .catch(() => {
          setEncouragement(aiContent?.encouragement || exercise.affirmation);
          setTimeout(() => setEncouragement(''), 5000);
        });
    }
  }, [timeLeft, isActive, currentExercise, exercise, aiContent]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      const newCompleted = [...completedExercises, exercise.title];
      setCompletedExercises(newCompleted);
      
      if (currentExercise < EXERCISES.length - 1) {
        setCurrentExercise((prev) => prev + 1);
        setTimeLeft(EXERCISES[currentExercise + 1].duration);
      } else {
        handleComplete(newCompleted);
      }
    }

    return () => clearInterval(interval);
  }, [timeLeft, isActive, currentExercise]);

  const startExercise = () => setIsActive(true);
  const pauseExercise = () => setIsActive(false);
  const resetExercise = () => {
    setCurrentExercise(0);
    setTimeLeft(EXERCISES[0].duration);
    setIsActive(false);
    setIsComplete(false);
  };

  const handleComplete = async (completed: string[]) => {
    setIsActive(false);
    
    generateExerciseReflection('confidence', completed)
      .then((reflectionText) => {
        setReflection(reflectionText);
        setIsComplete(true);
      })
      .catch(() => {
        setReflection('You\'ve completed your confidence-building exercises! Remember, you are capable, worthy, and strong.');
        setIsComplete(true);
      });
    
    setTimeout(() => onNavigate('meditation'), 5000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Power Pose Timer
  useEffect(() => {
    if (isActive && exercise.title === 'Power Poses' && isHoldingPose) {
      const poseTimer = setInterval(() => {
        setVisualizationProgress((prev) => {
          if (prev >= 100) {
            setIsHoldingPose(false);
            return 0;
          }
          return prev + 0.5; // 2 minutes = 120 seconds, so 0.5% per second
        });
      }, 1000);
      return () => clearInterval(poseTimer);
    }
  }, [isActive, exercise.title, isHoldingPose]);

  // Interactive components
  const PowerPoseGuide = () => {
    if (exercise.title !== 'Power Poses') return null;

    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 my-6 space-y-4">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">💪</div>
          <h3 className="text-xl font-bold text-white mb-1">Power Pose</h3>
          <div className="text-white/80 text-sm">Stand tall, shoulders back, hands on hips</div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 mb-4">
            <div 
              className={`w-40 h-40 rounded-full transition-all duration-300 flex items-center justify-center ${
                isHoldingPose ? 'bg-pink-500/30 scale-110' : 'bg-white/10 scale-100'
              }`}
              style={{
                boxShadow: isHoldingPose ? '0 0 40px rgba(236, 72, 153, 0.5)' : 'none'
              }}
            >
              <div className="text-6xl">👤</div>
            </div>
            
            {isHoldingPose && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-2xl font-bold mb-1">{Math.floor(visualizationProgress)}%</div>
                  <div className="text-xs">Hold for 2 min</div>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              setIsHoldingPose(!isHoldingPose);
              if (!isHoldingPose) setVisualizationProgress(0);
            }}
            className={`px-8 py-3 rounded-full font-semibold transition-all ${
              isHoldingPose
                ? 'bg-pink-500 text-white'
                : 'bg-white/20 text-white border-2 border-white/30'
            }`}
            disabled={!isActive}
          >
            {isHoldingPose ? 'Stop Pose' : 'Start Power Pose'}
          </button>
        </div>
      </div>
    );
  };

  const ConversationStartersGuide = () => {
    if (exercise.title !== 'Conversation Starters') return null;

    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 my-6 space-y-4">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">💬</div>
          <h3 className="text-xl font-bold text-white mb-1">Practice Questions</h3>
          <div className="text-white/80 text-sm">Think of open-ended questions</div>
        </div>
        
        <div className="space-y-3">
          {conversationStarters.map((starter, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                starter.trim() 
                  ? 'bg-pink-500 border-pink-400' 
                  : 'bg-white/20 border-white/40'
              }`}>
                {starter.trim() && <span className="text-white text-sm">✓</span>}
              </div>
              <input
                type="text"
                placeholder={`Question ${idx + 1}...`}
                value={starter}
                onChange={(e) => {
                  const newStarters = [...conversationStarters];
                  newStarters[idx] = e.target.value;
                  setConversationStarters(newStarters);
                }}
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400/50"
                disabled={!isActive}
              />
            </div>
          ))}
        </div>
        
        {conversationStarters.filter(Boolean).length === 3 && (
          <div className="mt-4 p-4 bg-pink-500/20 rounded-lg border border-pink-400/30">
            <p className="text-pink-100 text-sm">✨ Great! Practice saying these out loud.</p>
          </div>
        )}
      </div>
    );
  };

  const SelfAcceptanceGuide = () => {
    if (exercise.title !== 'Self-Acceptance') return null;

    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 my-6 space-y-4">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">❤️</div>
          <h3 className="text-xl font-bold text-white mb-1">What you like about yourself</h3>
        </div>
        
        <div className="space-y-3">
          {selfAcceptanceItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                item.trim() 
                  ? 'bg-pink-500 border-pink-400' 
                  : 'bg-white/20 border-white/40'
              }`}>
                {item.trim() && <span className="text-white text-sm">✓</span>}
              </div>
              <input
                type="text"
                placeholder={`Quality ${idx + 1}...`}
                value={item}
                onChange={(e) => {
                  const newItems = [...selfAcceptanceItems];
                  newItems[idx] = e.target.value;
                  setSelfAcceptanceItems(newItems);
                }}
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400/50"
                disabled={!isActive}
              />
            </div>
          ))}
        </div>
        
        {selfAcceptanceItems.filter(Boolean).length === 3 && (
          <div className="mt-4 p-4 bg-pink-500/20 rounded-lg border border-pink-400/30">
            <p className="text-pink-100 text-sm">✨ Say them with conviction: "I am..."</p>
          </div>
        )}
      </div>
    );
  };

  const VisualizationGuide = () => {
    if (exercise.title !== 'Visualization') return null;

    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 my-6 space-y-4">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🌠</div>
          <h3 className="text-xl font-bold text-white mb-1">Visualize Success</h3>
          <div className="text-white/80 text-sm">Picture yourself confident and at ease</div>
        </div>
        
        <div className="space-y-4">
          <div className="relative h-32 bg-white/10 rounded-xl overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-blue-500/30 transition-all duration-1000"
              style={{ 
                opacity: visualizationProgress / 100,
                transform: `scale(${1 + visualizationProgress / 200})`
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-2xl font-bold mb-1">{Math.floor(visualizationProgress)}%</div>
                <div className="text-sm opacity-80">Visualization Progress</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              if (visualizationProgress < 100) {
                const interval = setInterval(() => {
                  setVisualizationProgress((prev) => {
                    if (prev >= 100) {
                      clearInterval(interval);
                      return 100;
                    }
                    return prev + 2; // Complete in ~50 seconds
                  });
                }, 1000);
              } else {
                setVisualizationProgress(0);
              }
            }}
            className="w-full px-8 py-3 rounded-full font-semibold bg-pink-500/30 text-white border-2 border-pink-400/50 hover:bg-pink-500/40 transition-all"
            disabled={!isActive}
          >
            {visualizationProgress >= 100 ? 'Reset Visualization' : 'Start Visualization'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <ExerciseLayout
      title="Social Confidence"
      subtitle="Build self-esteem and social skills"
      backgroundImage="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
      overlayColor="from-pink-500/90 to-rose-600/90"
      onBack={() => onNavigate('meditation')}
    >
      {!isComplete ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 w-full max-w-2xl">
          <div className="text-center space-y-4 w-full">
            <h2 className="text-3xl font-bold text-white mb-2">{exercise.title}</h2>
            <p className="text-white/90 text-lg mb-4">{exercise.description}</p>
            
            {/* Interactive Components */}
            {isActive && <PowerPoseGuide />}
            {isActive && <ConversationStartersGuide />}
            {isActive && <SelfAcceptanceGuide />}
            {isActive && <VisualizationGuide />}
            
            {!isActive && (
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 space-y-4">
                {isLoadingAI ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="ml-3 text-white/80">Generating personalized guidance...</span>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-white/80 text-sm mb-2">Practice:</p>
                      <p className="text-white text-lg leading-relaxed">
                        {aiContent?.instruction || exercise.practice}
                      </p>
                    </div>
                    {aiContent?.tips && aiContent.tips.length > 0 && (
                      <div className="border-t border-white/20 pt-4">
                        <p className="text-pink-200 text-sm mb-2 font-semibold">💪 AI Confidence Tips:</p>
                        <ul className="text-left space-y-1">
                          {aiContent.tips.map((tip, idx) => (
                            <li key={idx} className="text-white/90 text-sm">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="border-t border-white/20 pt-4">
                      <p className="text-white/80 text-sm mb-2">Affirmation:</p>
                      <p className="text-pink-200 text-xl font-semibold italic">
                        "{aiContent?.encouragement || exercise.affirmation}"
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {encouragement && (
              <div className="bg-pink-500/20 backdrop-blur-md border border-pink-400/30 rounded-xl p-4 mt-4 animate-pulse">
                <p className="text-pink-100 text-sm">💪 {encouragement}</p>
              </div>
            )}
          </div>

          <div className="text-center w-full">
            {/* Circular Progress Timer */}
            <div className="relative w-48 h-48 mx-auto mb-4">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - (EXERCISES[currentExercise].duration - timeLeft) / EXERCISES[currentExercise].duration)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white mb-1">{formatTime(timeLeft)}</div>
                  <div className="text-white/70 text-sm">Exercise {currentExercise + 1}/{EXERCISES.length}</div>
                </div>
              </div>
            </div>
            
            {/* Progress Dots */}
            <div className="flex justify-center gap-2">
              {EXERCISES.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentExercise
                      ? 'w-8 bg-white'
                      : idx < currentExercise
                      ? 'w-4 bg-white/60'
                      : 'w-2 bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {!isActive ? (
              <button
                onClick={startExercise}
                className="bg-white text-pink-600 px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
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
          <div className="text-6xl">💪</div>
          <h2 className="text-3xl font-bold text-white">Confidence Built!</h2>
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 max-w-md">
            <p className="text-white/90 text-lg text-center leading-relaxed">
              {reflection || 'You\'ve completed your confidence-building exercises! Remember, you are capable, worthy, and strong.'}
            </p>
          </div>
        </div>
      )}
    </ExerciseLayout>
  );
};

export default SocialConfidence;


