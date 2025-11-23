import { useState, useEffect } from 'react';
import type { Screen } from '../../App';
import { ExerciseLayout } from './ExerciseLayout';
import { STRESS_BUSTER_CONTENT, getRandomContent, type ExerciseContent } from '../../utils/exerciseContent';

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
  const [content, setContent] = useState<ExerciseContent | null>(null);
  const [encouragement, setEncouragement] = useState<string>('');

  const current = TECHNIQUES[currentTechnique];

  // Load pre-generated content when technique changes
  useEffect(() => {
    const variations = STRESS_BUSTER_CONTENT[current.title];
    if (variations && variations.length > 0) {
      setContent(getRandomContent(variations));
    } else {
      // Fallback to default
      setContent({
        instruction: current.instruction,
        tips: ['Take your time', 'Be gentle with yourself'],
        encouragement: 'You\'re doing great!'
      });
    }
  }, [currentTechnique, current.title, current.instruction]);

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
      if (currentTechnique < TECHNIQUES.length - 1) {
        setCurrentTechnique((prev) => prev + 1);
        setTimeLeft(TECHNIQUES[currentTechnique + 1].duration);
      } else {
        handleComplete();
      }
    }

    return () => clearInterval(interval);
  }, [timeLeft, isActive, currentTechnique]);

  const startExercise = () => setIsActive(true);
  const pauseExercise = () => setIsActive(false);
  const resetExercise = () => {
    setCurrentTechnique(0);
    setTimeLeft(TECHNIQUES[0].duration);
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
      title="Stress Buster"
      subtitle="Quick techniques to release tension"
      backgroundImage="https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
      overlayColor="from-orange-500/90 to-red-600/90"
      onBack={() => onNavigate('meditation')}
    >
      {!isComplete ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white mb-2">{current.title}</h2>
            <p className="text-white/90 text-lg">{current.description}</p>
            
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 mt-6 space-y-4">
              <p className="text-white text-lg leading-relaxed">
                {content?.instruction || current.instruction}
              </p>
              {content?.tips && content.tips.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-white/80 text-sm mb-2">💡 Tips:</p>
                  <ul className="text-left space-y-1">
                    {content.tips.map((tip, idx) => (
                      <li key={idx} className="text-white/90 text-sm">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {encouragement && (
              <div className="bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl p-4 mt-4 animate-pulse">
                <p className="text-green-100 text-sm">✨ {encouragement}</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-4">{formatTime(timeLeft)}</div>
            <p className="text-white/80">
              Technique {currentTechnique + 1} of {TECHNIQUES.length}
            </p>
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
          <p className="text-white/90 text-lg text-center">
            You've completed all stress relief techniques. Feel the calm.
          </p>
        </div>
      )}
    </ExerciseLayout>
  );
};

export default StressBuster;

