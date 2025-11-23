import { useState, useEffect } from 'react';
import type { Screen } from '../../App';
import { ExerciseLayout } from './ExerciseLayout';
import { MOOD_BOOSTER_CONTENT, getRandomContent, type ExerciseContent } from '../../utils/exerciseContent';

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
  const [content, setContent] = useState<ExerciseContent | null>(null);
  const [encouragement, setEncouragement] = useState<string>('');

  const activity = ACTIVITIES[currentActivity];
  const stepDuration = activity.duration / activity.steps.length;

  // Load pre-generated content when activity changes
  useEffect(() => {
    const variations = MOOD_BOOSTER_CONTENT[activity.title];
    if (variations && variations.length > 0) {
      setContent(getRandomContent(variations));
    } else {
      // Fallback to default
      setContent({
        instruction: `Step ${currentStep + 1}: ${activity.steps[currentStep]}`,
        tips: ['Focus on the positive', 'Be present'],
        encouragement: 'You\'re building positive energy!'
      });
    }
  }, [currentActivity, activity.title, currentStep, activity.steps]);

  // Show encouragement at intervals
  useEffect(() => {
    if (isActive && timeLeft > 0 && timeLeft % 20 === 0 && content?.encouragement) {
      setEncouragement(content.encouragement);
      setTimeout(() => setEncouragement(''), 5000);
    }
  }, [timeLeft, isActive, content]);

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
        setCurrentActivity((prev) => prev + 1);
        setCurrentStep(0);
        setTimeLeft(ACTIVITIES[currentActivity + 1].duration);
      } else {
        handleComplete();
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

  const handleComplete = () => {
    setIsActive(false);
    setIsComplete(true);
    setTimeout(() => onNavigate('meditation'), 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white mb-2">{activity.title}</h2>
            <p className="text-white/90 text-lg mb-4">{activity.description}</p>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 space-y-4">
              <p className="text-white text-lg leading-relaxed mb-2">
                {content?.instruction || `Step ${currentStep + 1}: ${activity.steps[currentStep]}`}
              </p>
              {content?.tips && content.tips.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-yellow-200 text-sm mb-2 font-semibold">✨ Tips:</p>
                  <ul className="text-left space-y-1">
                    {content.tips.map((tip, idx) => (
                      <li key={idx} className="text-white/90 text-sm">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {encouragement && (
              <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 rounded-xl p-4 mt-4 animate-pulse">
                <p className="text-yellow-100 text-sm">✨ {encouragement}</p>
              </div>
            )}
            
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6">
              <div className="mt-4 flex justify-center gap-2">
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

          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-4">{formatTime(timeLeft)}</div>
            <p className="text-white/80">
              Activity {currentActivity + 1} of {ACTIVITIES.length}
            </p>
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
          <p className="text-white/90 text-lg text-center">
            You've completed all mood-boosting activities. Keep that positive energy flowing!
          </p>
        </div>
      )}
    </ExerciseLayout>
  );
};

export default MoodBooster;

