import { useState, useEffect } from 'react';
import type { Screen } from '../../App';
import { ExerciseLayout } from './ExerciseLayout';
import { generateExerciseContent, generateEncouragement, generateExerciseReflection } from '../../utils/exerciseAI';

interface MoodBoosterProps {
  onNavigate: (screen: Screen) => void;
}

type Activity = {
  id: number;
  title: string;
  description: string;
  steps: string[];
  duration: number;
};

const ACTIVITIES: Activity[] = [
  {
    id: 1,
    title: 'Gratitude Practice',
    description: 'Focus on what brings you joy',
    steps: [
      'Think of 3 things you\'re grateful for today',
      'Write them down or say them out loud',
      'Feel the warmth of appreciation',
      'Carry this feeling with you',
    ],
    duration: 300,
  },
  {
    id: 2,
    title: 'Positive Affirmations',
    description: 'Boost your self-confidence',
    steps: [
      'Repeat: "I am capable and strong"',
      'Say: "I deserve happiness and peace"',
      'Affirm: "I am growing every day"',
      'Believe in your own power',
    ],
    duration: 240,
  },
  {
    id: 3,
    title: 'Energy Movement',
    description: 'Get your body moving',
    steps: [
      'Stand up and stretch your arms high',
      'Take 5 deep breaths',
      'Do 10 gentle jumps or stretches',
      'Feel the energy flowing through you',
    ],
    duration: 180,
  },
];

export const MoodBooster = ({ onNavigate }: MoodBoosterProps) => {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ACTIVITIES[0].duration);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [aiContent, setAiContent] = useState<{instruction: string; tips: string[]; encouragement: string} | null>(null);
  const [encouragement, setEncouragement] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [reflection, setReflection] = useState<string>('');
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  
  // Interactive states
  const [gratitudeItems, setGratitudeItems] = useState<string[]>(['', '', '']);
  const [affirmations, setAffirmations] = useState<string[]>(['', '', '', '']);
  const [movementSteps, setMovementSteps] = useState<boolean[]>([false, false, false, false]);

  const activity = ACTIVITIES[currentActivity];
  const stepDuration = activity.duration / activity.steps.length;

  // Generate AI content when activity changes
  useEffect(() => {
    setIsLoadingAI(true);
    generateExerciseContent('mood', activity.title)
      .then((content) => {
        setAiContent({
          instruction: content.personalizedInstruction || `Step ${currentStep + 1}: ${activity.steps[currentStep]}`,
          tips: content.tips.length > 0 ? content.tips : ['Focus on the positive', 'Be present'],
          encouragement: content.encouragement || 'You\'re building positive energy!'
        });
        setIsLoadingAI(false);
      })
      .catch(() => {
        setAiContent({
          instruction: `Step ${currentStep + 1}: ${activity.steps[currentStep]}`,
          tips: ['Focus on the positive', 'Be present'],
          encouragement: 'You\'re building positive energy!'
        });
        setIsLoadingAI(false);
      });
  }, [currentActivity, activity.title, currentStep, activity.steps]);

  // Generate and show AI encouragement at intervals
  useEffect(() => {
    if (isActive && timeLeft > 0 && timeLeft % 30 === 0 && timeLeft !== activity.duration) {
      generateEncouragement('mood', timeLeft, activity.title)
        .then((msg) => {
          setEncouragement(msg);
          setTimeout(() => setEncouragement(''), 5000);
        })
        .catch(() => {
          setEncouragement(aiContent?.encouragement || 'Keep that positive energy flowing!');
          setTimeout(() => setEncouragement(''), 5000);
        });
    }
  }, [timeLeft, isActive, currentActivity, activity, aiContent]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      if (currentStep < activity.steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
        setTimeLeft(stepDuration);
      } else if (currentActivity < ACTIVITIES.length - 1) {
        const newCompleted = [...completedActivities, activity.title];
        setCompletedActivities(newCompleted);
        setCurrentActivity((prev) => prev + 1);
        setCurrentStep(0);
        setTimeLeft(ACTIVITIES[currentActivity + 1].duration);
      } else {
        const finalCompleted = [...completedActivities, activity.title];
        handleComplete(finalCompleted);
      }
    }

    return () => clearInterval(interval);
  }, [timeLeft, isActive, currentActivity, currentStep, activity, stepDuration]);

  const startExercise = () => setIsActive(true);
  const pauseExercise = () => setIsActive(false);
  const resetExercise = () => {
    setCurrentActivity(0);
    setCurrentStep(0);
    setTimeLeft(ACTIVITIES[0].duration);
    setIsActive(false);
    setIsComplete(false);
  };

  const handleComplete = async (completed: string[]) => {
    setIsActive(false);
    
    generateExerciseReflection('mood', completed)
      .then((reflectionText) => {
        setReflection(reflectionText);
        setIsComplete(true);
      })
      .catch(() => {
        setReflection('You\'ve completed all mood-boosting activities! Keep that positive energy flowing throughout your day.');
        setIsComplete(true);
      });
    
    setTimeout(() => onNavigate('meditation'), 5000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Interactive components
  const GratitudePractice = () => {
    if (activity.title !== 'Gratitude Practice') return null;

    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 my-6 space-y-4">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🙏</div>
          <h3 className="text-xl font-bold text-white mb-1">What are you grateful for?</h3>
        </div>
        
        <div className="space-y-3">
          {gratitudeItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                item.trim() 
                  ? 'bg-yellow-500 border-yellow-400' 
                  : 'bg-white/20 border-white/40'
              }`}>
                {item.trim() && <span className="text-white text-sm">✓</span>}
              </div>
              <input
                type="text"
                placeholder={`Gratitude ${idx + 1}...`}
                value={item}
                onChange={(e) => {
                  const newItems = [...gratitudeItems];
                  newItems[idx] = e.target.value;
                  setGratitudeItems(newItems);
                }}
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                disabled={!isActive}
              />
            </div>
          ))}
        </div>
        
        {gratitudeItems.filter(Boolean).length === 3 && (
          <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
            <p className="text-yellow-100 text-sm">✨ Feel the warmth of appreciation!</p>
          </div>
        )}
      </div>
    );
  };

  const AffirmationsPractice = () => {
    if (activity.title !== 'Positive Affirmations') return null;

    const affirmationPrompts = [
      'I am capable and strong',
      'I deserve happiness and peace',
      'I am growing every day',
      'I believe in my own power'
    ];

    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 my-6 space-y-4">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">💪</div>
          <h3 className="text-xl font-bold text-white mb-1">Repeat with conviction</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {affirmationPrompts.map((prompt, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border-2 transition-all ${
                affirmations[idx]
                  ? 'bg-yellow-500/30 border-yellow-400 scale-105'
                  : 'bg-white/10 border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{prompt}</span>
                <button
                  onClick={() => {
                    const newAffirmations = [...affirmations];
                    newAffirmations[idx] = newAffirmations[idx] ? '' : prompt;
                    setAffirmations(newAffirmations);
                  }}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    affirmations[idx]
                      ? 'bg-yellow-500 border-yellow-400'
                      : 'bg-white/20 border-white/40'
                  }`}
                  disabled={!isActive}
                >
                  {affirmations[idx] && <span className="text-white text-xs">✓</span>}
                </button>
              </div>
              {affirmations[idx] && (
                <div className="text-yellow-200 text-sm mt-2">✨ Say it out loud: "{prompt}"</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const EnergyMovement = () => {
    if (activity.title !== 'Energy Movement') return null;

    const movementStepsList = [
      'Stand up and stretch your arms high',
      'Take 5 deep breaths',
      'Do 10 gentle jumps or stretches',
      'Feel the energy flowing through you'
    ];

    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 my-6 space-y-4">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🏃</div>
          <h3 className="text-xl font-bold text-white mb-1">Get Moving!</h3>
        </div>
        
        <div className="space-y-3">
          {movementStepsList.map((step, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border-2 transition-all ${
                movementSteps[idx]
                  ? 'bg-orange-500/30 border-orange-400'
                  : 'bg-white/10 border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white">{step}</span>
                <button
                  onClick={() => {
                    const newSteps = [...movementSteps];
                    newSteps[idx] = !newSteps[idx];
                    setMovementSteps(newSteps);
                  }}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    movementSteps[idx]
                      ? 'bg-orange-500 border-orange-400'
                      : 'bg-white/20 border-white/40'
                  }`}
                  disabled={!isActive}
                >
                  {movementSteps[idx] && <span className="text-white text-xs">✓</span>}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {movementSteps.every(Boolean) && (
          <div className="mt-4 p-4 bg-orange-500/20 rounded-lg border border-orange-400/30">
            <p className="text-orange-100 text-sm">✨ Feel that energy flowing!</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <ExerciseLayout
      title="Mood Booster"
      subtitle="Activities to lift your spirits"
      backgroundImage="https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
      overlayColor="from-yellow-500/90 to-orange-500/90"
      onBack={() => onNavigate('meditation')}
    >
      {!isComplete ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 w-full max-w-2xl">
          <div className="text-center space-y-4 w-full">
            <h2 className="text-3xl font-bold text-white mb-2">{activity.title}</h2>
            <p className="text-white/90 text-lg mb-4">{activity.description}</p>
            
            {/* Interactive Components */}
            {isActive && <GratitudePractice />}
            {isActive && <AffirmationsPractice />}
            {isActive && <EnergyMovement />}
            
            {!isActive && (
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 space-y-4">
                {isLoadingAI ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="ml-3 text-white/80">Generating personalized guidance...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-white text-lg leading-relaxed mb-2">
                      {aiContent?.instruction || `Step ${currentStep + 1}: ${activity.steps[currentStep]}`}
                    </p>
                    {aiContent?.tips && aiContent.tips.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-yellow-200 text-sm mb-2 font-semibold">✨ AI Tips:</p>
                        <ul className="text-left space-y-1">
                          {aiContent.tips.map((tip, idx) => (
                            <li key={idx} className="text-white/90 text-sm">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {encouragement && (
              <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 rounded-xl p-4 mt-4 animate-pulse">
                <p className="text-yellow-100 text-sm">✨ {encouragement}</p>
              </div>
            )}
            
            {/* Step Progress */}
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6">
              <div className="flex justify-center gap-2">
                {activity.steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStep
                        ? 'bg-yellow-400 w-8'
                        : idx < currentStep
                        ? 'bg-yellow-600/50 w-2'
                        : 'bg-white/20 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>
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
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - (activity.duration - timeLeft) / activity.duration)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white mb-1">{formatTime(timeLeft)}</div>
                  <div className="text-white/70 text-sm">Activity {currentActivity + 1}/{ACTIVITIES.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {!isActive ? (
              <button
                onClick={startExercise}
                className="bg-white text-yellow-600 px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
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
          <div className="text-6xl">🌟</div>
          <h2 className="text-3xl font-bold text-white">Mood Boosted!</h2>
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 max-w-md">
            <p className="text-white/90 text-lg text-center leading-relaxed">
              {reflection || 'You\'ve completed all mood-boosting activities! Keep that positive energy flowing throughout your day.'}
            </p>
          </div>
        </div>
      )}
    </ExerciseLayout>
  );
};

export default MoodBooster;

