// AI-powered exercise content generation using Gemini
import { callGeminiAPI } from './geminiAPI';

export interface ExerciseContent {
  instruction: string;
  tips?: string[];
  encouragement?: string;
  personalized?: string;
}

/**
 * Generate dynamic stress relief technique content
 */
export const generateStressTechnique = async (
  techniqueName: string,
  userProgress?: number
): Promise<ExerciseContent> => {
  const prompt = `You are a stress relief expert. Generate a personalized, step-by-step instruction for the "${techniqueName}" technique. 
  
Context: User is at step ${userProgress || 1} of a stress relief session.

Provide:
1. A clear, encouraging instruction (2-3 sentences)
2. 2-3 practical tips specific to this technique
3. A brief encouragement message

Format as JSON: {"instruction": "...", "tips": ["...", "..."], "encouragement": "..."}`;

  const response = await callGeminiAPI(prompt);
  
  if (response.success && response.text) {
    try {
      // Try to parse JSON response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback to text parsing
    }
    
    return {
      instruction: response.text.substring(0, 200),
      tips: ['Focus on your breath', 'Take your time', 'Be gentle with yourself'],
      encouragement: 'You\'re doing great! Keep going.'
    };
  }
  
  return {
    instruction: `Practice the ${techniqueName} technique. Focus on your breath and stay present.`,
    tips: ['Take deep breaths', 'Stay in the moment'],
    encouragement: 'You\'re making progress!'
  };
};

/**
 * Generate dynamic sleep story content
 */
export const generateSleepStory = async (
  storyTheme: string,
  currentLine: number,
  totalLines: number
): Promise<string> => {
  const prompt = `You are a sleep story narrator. Continue a peaceful sleep story about "${storyTheme}".
  
Current progress: Line ${currentLine} of ${totalLines}
Previous context: The story is about finding peace and tranquility.

Generate the next 1-2 sentences that are:
- Calming and peaceful
- Descriptive and immersive
- Suitable for helping someone fall asleep
- Flows naturally from a peaceful narrative

Keep it brief (1-2 sentences max).`;

  const response = await callGeminiAPI(prompt);
  
  if (response.success && response.text) {
    // Clean up the response
    let story = response.text.trim();
    // Remove quotes if present
    story = story.replace(/^["']|["']$/g, '');
    return story.substring(0, 150);
  }
  
  return `The gentle rhythm continues, bringing you deeper into a state of peace and relaxation.`;
};

/**
 * Generate dynamic anxiety relief guidance
 */
export const generateAnxietyGuidance = async (
  techniqueName: string,
  userState?: 'mild' | 'moderate' | 'severe'
): Promise<ExerciseContent> => {
  const prompt = `You are an anxiety relief specialist. Provide immediate, practical guidance for the "${techniqueName}" technique.
  
User's current state: ${userState || 'moderate'} anxiety

Provide:
1. A clear, reassuring instruction (2-3 sentences)
2. Why this technique helps with anxiety
3. A calming affirmation

Format as JSON: {"instruction": "...", "tips": ["...", "..."], "encouragement": "..."}`;

  const response = await callGeminiAPI(prompt);
  
  if (response.success && response.text) {
    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback
    }
    
    return {
      instruction: response.text.substring(0, 200),
      tips: ['You are safe', 'This feeling will pass', 'Focus on your breath'],
      encouragement: 'You\'re taking care of yourself. That\'s powerful.'
    };
  }
  
  return {
    instruction: `Practice ${techniqueName}. You are safe, and this moment will pass.`,
    tips: ['Breathe slowly', 'You are in control'],
    encouragement: 'You\'re doing exactly what you need to do.'
  };
};

/**
 * Generate dynamic mood booster activity
 */
export const generateMoodActivity = async (
  activityName: string,
  currentStep: number
): Promise<ExerciseContent> => {
  const prompt = `You are a positive psychology coach. Generate an engaging, uplifting instruction for "${activityName}" activity.
  
Current step: ${currentStep}
Focus: Boosting mood and positive energy

Provide:
1. An encouraging, actionable instruction (2-3 sentences)
2. Why this activity boosts mood
3. A positive affirmation

Format as JSON: {"instruction": "...", "tips": ["...", "..."], "encouragement": "..."}`;

  const response = await callGeminiAPI(prompt);
  
  if (response.success && response.text) {
    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback
    }
    
    return {
      instruction: response.text.substring(0, 200),
      tips: ['Focus on the positive', 'Be present', 'Celebrate small wins'],
      encouragement: 'You\'re building positive energy!'
    };
  }
  
  return {
    instruction: `Engage with ${activityName}. Notice the positive feelings that arise.`,
    tips: ['Stay present', 'Feel the joy'],
    encouragement: 'You\'re creating positive change!'
  };
};

/**
 * Generate dynamic social confidence exercise
 */
export const generateConfidenceExercise = async (
  exerciseName: string,
  userLevel?: 'beginner' | 'intermediate' | 'advanced'
): Promise<ExerciseContent> => {
  const prompt = `You are a social confidence coach. Create a personalized exercise instruction for "${exerciseName}".
  
User level: ${userLevel || 'beginner'}

Provide:
1. A supportive, step-by-step instruction (2-3 sentences)
2. Why this builds confidence
3. A powerful affirmation

Format as JSON: {"instruction": "...", "tips": ["...", "..."], "encouragement": "..."}`;

  const response = await callGeminiAPI(prompt);
  
  if (response.success && response.text) {
    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback
    }
    
    return {
      instruction: response.text.substring(0, 200),
      tips: ['You are worthy', 'Your voice matters', 'Be authentic'],
      encouragement: 'You\'re building real confidence!'
    };
  }
  
  return {
    instruction: `Practice ${exerciseName}. Remember, you are capable and worthy.`,
    tips: ['Be yourself', 'You have value'],
    encouragement: 'You\'re growing in confidence!'
  };
};

/**
 * Get real-time encouragement based on progress
 */
export const getProgressEncouragement = async (
  exerciseType: string,
  progress: number,
  total: number
): Promise<string> => {
  const percentage = Math.round((progress / total) * 100);
  
  const prompt = `Give a brief (1 sentence), encouraging message for someone who is ${percentage}% through a ${exerciseType} exercise. Be warm, supportive, and motivating.`;

  const response = await callGeminiAPI(prompt);
  
  if (response.success && response.text) {
    return response.text.trim().substring(0, 100);
  }
  
  const fallbacks = [
    'You\'re making great progress!',
    'Keep going, you\'re doing amazing!',
    'You\'re almost there!',
    'Every step counts!'
  ];
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};

