import { useState, useEffect } from 'react';
import type { Screen } from '../../App';
import { ExerciseLayout } from './ExerciseLayout';
import { SLEEP_STORIES_CONTENT, getRandomContent } from '../../utils/exerciseContent';

interface SleepStoriesProps {
  onNavigate: (screen: Screen) => void;
}

type Story = {
  id: number;
  title: string;
  description: string;
  story: string[];
  duration: number;
};

const STORIES: Story[] = [
  {
    id: 1,
    title: 'The Peaceful Forest',
    description: 'A gentle walk through a serene forest',
    story: [
      'Imagine yourself walking through a peaceful forest...',
      'The trees sway gently in the breeze...',
      'You hear the soft rustling of leaves...',
      'A gentle stream flows nearby...',
      'The sunlight filters through the canopy...',
      'You feel completely at peace...',
      'Your body begins to relax...',
      'Let yourself drift into sleep...',
    ],
    duration: 1200, // 20 minutes
  },
  {
    id: 2,
    title: 'Ocean Waves',
    description: 'Drift away with the rhythm of the ocean',
    story: [
      'You are lying on a warm beach...',
      'The waves gently lap the shore...',
      'Each wave brings deeper relaxation...',
      'The sound is rhythmic and soothing...',
      'You feel the warm sand beneath you...',
      'The ocean breeze is gentle...',
      'Your mind is calm and clear...',
      'Sleep comes naturally...',
    ],
    duration: 1200,
  },
];

export const SleepStories = ({ onNavigate }: SleepStoriesProps) => {
  const [selectedStory, setSelectedStory] = useState<number | null>(null);
  const [currentLine, setCurrentLine] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [dynamicStory, setDynamicStory] = useState<string[]>([]);

  const story = selectedStory !== null ? STORIES[selectedStory] : null;

  // Load pre-generated story content when story is selected
  useEffect(() => {
    if (selectedStory !== null && story) {
      const variations = SLEEP_STORIES_CONTENT[story.title];
      if (variations && variations.length > 0) {
        setDynamicStory(getRandomContent(variations));
      } else {
        // Fallback to default story
        setDynamicStory(story.story);
      }
    }
  }, [selectedStory, story]);

  useEffect(() => {
    if (isPlaying && story) {
      const storyLines = dynamicStory.length > 0 ? dynamicStory : story.story;
      const timer = setTimeout(() => {
        if (currentLine < storyLines.length - 1) {
          setCurrentLine((prev) => prev + 1);
        }
      }, (story.duration / storyLines.length) * 1000);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentLine, story, dynamicStory]);

  useEffect(() => {
    if (isPlaying && story) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isPlaying, story]);

  const startStory = (storyId: number) => {
    setSelectedStory(storyId);
    setCurrentLine(0);
    setTimeLeft(STORIES[storyId].duration);
    setIsPlaying(true);
  };

  const pauseStory = () => setIsPlaying(false);
  const resumeStory = () => setIsPlaying(true);
  const stopStory = () => {
    setIsPlaying(false);
    setSelectedStory(null);
    setCurrentLine(0);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <ExerciseLayout
      title="Sleep Stories"
      subtitle="Guided narratives for peaceful sleep"
      backgroundImage="https://images.pexels.com/photos/18554368/pexels-photo-18554368.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
      overlayColor="from-indigo-500/90 to-purple-600/90"
      onBack={() => onNavigate('meditation')}
    >
      {!selectedStory ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-6">Choose a Story</h2>
          {STORIES.map((s) => (
            <button
              key={s.id}
              onClick={() => startStory(s.id - 1)}
              className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-6 text-left hover:bg-white/30 transition-all"
            >
              <h3 className="text-xl font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-white/80">{s.description}</p>
              <p className="text-white/60 text-sm mt-2">{formatTime(s.duration)}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-white">{story?.title}</h2>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 min-h-[200px] flex items-center justify-center">
              <p className="text-white text-xl leading-relaxed">
                {(dynamicStory.length > 0 ? dynamicStory : story?.story)[currentLine]}
              </p>
            </div>
            <div className="text-white/80">
              {currentLine + 1} / {dynamicStory.length > 0 ? dynamicStory.length : story?.story.length}
            </div>
            <div className="text-3xl font-bold text-white">{formatTime(timeLeft)}</div>
          </div>

          <div className="flex gap-4">
            {!isPlaying ? (
              <button
                onClick={resumeStory}
                className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Resume
              </button>
            ) : (
              <button
                onClick={pauseStory}
                className="bg-white/20 backdrop-blur-md text-white border-2 border-white/30 px-8 py-3 rounded-full font-semibold hover:bg-white/30 transition-all"
              >
                Pause
              </button>
            )}
            <button
              onClick={stopStory}
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-full font-semibold hover:bg-white/20 transition-all"
            >
              Stop
            </button>
          </div>
        </div>
      )}
    </ExerciseLayout>
  );
};

export default SleepStories;

