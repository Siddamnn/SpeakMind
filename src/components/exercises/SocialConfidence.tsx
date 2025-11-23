import { useState, useEffect } from 'react';
import type { Screen } from '../../App';
import { ExerciseLayout } from './ExerciseLayout';
import { SOCIAL_CONFIDENCE_CONTENT, getRandomContent, type ExerciseContent } from '../../utils/exerciseContent';

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
  const [content, setContent] = useState<ExerciseContent | null>(null);
  const [encouragement, setEncouragement] = useState<string>('');

  const exercise = EXERCISES[currentExercise];

  // Load pre-generated content when exercise changes
  useEffect(() => {
    const variations = SOCIAL_CONFIDENCE_CONTENT[exercise.title];
    if (variations && variations.length > 0) {
      setContent(getRandomContent(variations));
    } else {
      // Fallback to default
      setContent({
        instruction: exercise.practice,
        tips: ['You are worthy', 'Your voice matters'],
        encouragement: exercise.affirmation
      });
    }
  }, [currentExercise, exercise.title, exercise.practice, exercise.affirmation]);

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
      if (currentExercise < EXERCISES.length - 1) {
        setCurrentExercise((prev) => prev + 1);
        setTimeLeft(EXERCISES[currentExercise + 1].duration);
      } else {
        handleComplete();
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
      title="Social Confidence"
      subtitle="Build self-esteem and social skills"
      backgroundImage="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
      overlayColor="from-pink-500/90 to-rose-600/90"
      onBack={() => onNavigate('meditation')}
    >
      {!isComplete ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white mb-2">{exercise.title}</h2>
            <p className="text-white/90 text-lg mb-4">{exercise.description}</p>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-white/80 text-sm mb-2">Practice:</p>
                <p className="text-white text-lg leading-relaxed">
                  {content?.instruction || exercise.practice}
                </p>
              </div>
              {content?.tips && content.tips.length > 0 && (
                <div className="border-t border-white/20 pt-4">
                  <p className="text-pink-200 text-sm mb-2 font-semibold">💪 Confidence Tips:</p>
                  <ul className="text-left space-y-1">
                    {content.tips.map((tip, idx) => (
                      <li key={idx} className="text-white/90 text-sm">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="border-t border-white/20 pt-4">
                <p className="text-white/80 text-sm mb-2">Affirmation:</p>
                <p className="text-pink-200 text-xl font-semibold italic">
                  "{content?.encouragement || exercise.affirmation}"
                </p>
              </div>
            </div>
            
            {encouragement && (
              <div className="bg-pink-500/20 backdrop-blur-md border border-pink-400/30 rounded-xl p-4 mt-4 animate-pulse">
                <p className="text-pink-100 text-sm">💪 {encouragement}</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-4">{formatTime(timeLeft)}</div>
            <p className="text-white/80">
              Exercise {currentExercise + 1} of {EXERCISES.length}
            </p>
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
          <p className="text-white/90 text-lg text-center">
            You've completed all confidence exercises. Remember: you are capable, worthy, and ready to shine!
          </p>
        </div>
      )}
    </ExerciseLayout>
  );
};

export default SocialConfidence;


