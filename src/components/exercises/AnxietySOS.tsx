import { useState, useEffect } from 'react';
import type { Screen } from '../../App';
import { ExerciseLayout } from './ExerciseLayout';
import { ANXIETY_SOS_CONTENT, getRandomContent, type ExerciseContent } from '../../utils/exerciseContent';

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
  const [content, setContent] = useState<ExerciseContent | null>(null);
  const [encouragement, setEncouragement] = useState<string>('');

  const current = SOS_TECHNIQUES[currentTechnique];

  // Load pre-generated content when technique changes
  useEffect(() => {
    const variations = ANXIETY_SOS_CONTENT[current.title];
    if (variations && variations.length > 0) {
      setContent(getRandomContent(variations));
    } else {
      // Fallback to default
      setContent({
        instruction: current.instruction,
        tips: ['You are safe', 'This feeling will pass'],
        encouragement: 'You\'re taking care of yourself.'
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
      if (currentTechnique < SOS_TECHNIQUES.length - 1) {
        setCurrentTechnique((prev) => prev + 1);
        setTimeLeft(SOS_TECHNIQUES[currentTechnique + 1].duration);
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
    setTimeLeft(SOS_TECHNIQUES[0].duration);
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
      title="Anxiety SOS"
      subtitle="Emergency relief when anxiety strikes"
      backgroundImage="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
      overlayColor="from-blue-500/90 to-cyan-600/90"
      onBack={() => onNavigate('meditation')}
    >
      {!isComplete ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="text-center space-y-4">
            <div className="bg-red-500/20 backdrop-blur-md border-2 border-red-400/50 rounded-full px-6 py-3 mb-4">
              <span className="text-red-200 font-bold text-lg">SOS MODE</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">{current.title}</h2>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 space-y-4">
              <p className="text-white text-lg leading-relaxed">
                {content?.instruction || current.instruction}
              </p>
              {content?.tips && content.tips.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-blue-200 text-sm mb-2 font-semibold">💙 Remember:</p>
                  <ul className="text-left space-y-1">
                    {content.tips.map((tip, idx) => (
                      <li key={idx} className="text-white/90 text-sm">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {encouragement && (
              <div className="bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-xl p-4 mt-4 animate-pulse">
                <p className="text-blue-100 text-sm">💙 {encouragement}</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-4">{formatTime(timeLeft)}</div>
            <p className="text-white/80">
              Step {currentTechnique + 1} of {SOS_TECHNIQUES.length}
            </p>
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
          <p className="text-white/90 text-lg text-center">
            You've completed the anxiety relief sequence. Take a deep breath. You've got this.
          </p>
        </div>
      )}
    </ExerciseLayout>
  );
};

export default AnxietySOS;

