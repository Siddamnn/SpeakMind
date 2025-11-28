// AI-powered exercise content generation using Gemini
import { callGeminiAPI } from './geminiAPI'

export interface ExerciseAIContent {
  personalizedInstruction: string
  tips: string[]
  encouragement: string
  reflection?: string
}

/**
 * Generate personalized exercise content using Gemini AI
 */
export const generateExerciseContent = async (
  exerciseType: 'stress' | 'anxiety' | 'mood' | 'confidence',
  techniqueTitle: string,
  userContext?: string
): Promise<ExerciseAIContent> => {
  const prompts = {
    stress: `You are a stress relief expert. Generate personalized guidance for the technique "${techniqueTitle}". 
Provide:
1. A personalized instruction (2-3 sentences, encouraging and clear)
2. 3 practical tips (short, actionable)
3. An encouraging message (1 sentence, supportive)
${userContext ? `User context: ${userContext}` : ''}
Format as JSON: {"instruction": "...", "tips": ["...", "...", "..."], "encouragement": "..."}`,

    anxiety: `You are an anxiety relief specialist. Generate personalized guidance for the technique "${techniqueTitle}". 
Provide:
1. A calming, personalized instruction (2-3 sentences, reassuring)
2. 3 grounding tips (short, practical)
3. A supportive encouragement message (1 sentence, calming)
${userContext ? `User context: ${userContext}` : ''}
Format as JSON: {"instruction": "...", "tips": ["...", "...", "..."], "encouragement": "..."}`,

    mood: `You are a mood enhancement coach. Generate personalized guidance for the activity "${techniqueTitle}". 
Provide:
1. An uplifting, personalized instruction (2-3 sentences, positive)
2. 3 mood-boosting tips (short, energizing)
3. An encouraging message (1 sentence, motivating)
${userContext ? `User context: ${userContext}` : ''}
Format as JSON: {"instruction": "...", "tips": ["...", "...", "..."], "encouragement": "..."}`,

    confidence: `You are a confidence building expert. Generate personalized guidance for the exercise "${techniqueTitle}". 
Provide:
1. An empowering, personalized instruction (2-3 sentences, confidence-building)
2. 3 confidence tips (short, empowering)
3. An encouraging message (1 sentence, affirming)
${userContext ? `User context: ${userContext}` : ''}
Format as JSON: {"instruction": "...", "tips": ["...", "...", "..."], "encouragement": "..."}`
  }

  const prompt = prompts[exerciseType]
  
  try {
    const response = await callGeminiAPI(prompt)
    
    if (response.success && response.text) {
      // Try to parse JSON from response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          personalizedInstruction: parsed.instruction || '',
          tips: Array.isArray(parsed.tips) ? parsed.tips : [],
          encouragement: parsed.encouragement || '',
        }
      }
      
      // Fallback: extract content from text response
      return parseTextResponse(response.text)
    }
  } catch (error) {
    console.error('Error generating exercise content:', error)
  }

  // Fallback content
  return getFallbackContent(exerciseType, techniqueTitle)
}

/**
 * Generate post-exercise reflection using Gemini AI
 */
export const generateExerciseReflection = async (
  exerciseType: 'stress' | 'anxiety' | 'mood' | 'confidence',
  completedTechniques: string[]
): Promise<string> => {
  const prompt = `You are a wellness coach. The user just completed ${exerciseType} relief exercises: ${completedTechniques.join(', ')}.
Generate a brief, personalized reflection message (2-3 sentences) that:
- Acknowledges their effort
- Highlights the benefits
- Encourages continued practice
Be warm, supportive, and specific.`

  try {
    const response = await callGeminiAPI(prompt)
    if (response.success && response.text) {
      // Extract first 2-3 sentences
      const sentences = response.text.match(/[^.!?]+[.!?]+/g) || []
      return sentences.slice(0, 3).join(' ').trim()
    }
  } catch (error) {
    console.error('Error generating reflection:', error)
  }

  return getFallbackReflection(exerciseType)
}

/**
 * Generate real-time encouragement during exercise
 */
export const generateEncouragement = async (
  exerciseType: 'stress' | 'anxiety' | 'mood' | 'confidence',
  timeRemaining: number,
  techniqueTitle: string
): Promise<string> => {
  const prompts = {
    stress: `Generate a brief, encouraging message (1 sentence) for someone doing "${techniqueTitle}" with ${timeRemaining} seconds remaining. Be supportive and calming.`,
    anxiety: `Generate a brief, reassuring message (1 sentence) for someone doing "${techniqueTitle}" with ${timeRemaining} seconds remaining. Be calming and safe.`,
    mood: `Generate a brief, uplifting message (1 sentence) for someone doing "${techniqueTitle}" with ${timeRemaining} seconds remaining. Be positive and energizing.`,
    confidence: `Generate a brief, empowering message (1 sentence) for someone doing "${techniqueTitle}" with ${timeRemaining} seconds remaining. Be affirming and confident.`
  }

  try {
    const response = await callGeminiAPI(prompts[exerciseType])
    if (response.success && response.text) {
      // Extract first sentence
      const sentence = response.text.match(/[^.!?]+[.!?]+/)?.[0] || response.text.split('.')[0]
      return sentence.trim()
    }
  } catch (error) {
    console.error('Error generating encouragement:', error)
  }

  return getFallbackEncouragement(exerciseType)
}

// Helper functions
function parseTextResponse(text: string): ExerciseAIContent {
  const lines = text.split('\n').filter(l => l.trim())
  const instruction = lines.find(l => l.toLowerCase().includes('instruction') || l.length > 50) || lines[0] || ''
  const tips: string[] = []
  const encouragement = lines.find(l => l.toLowerCase().includes('encourag') || l.includes('✨')) || ''

  lines.forEach(line => {
    if (line.match(/^[-•*]\s/) || line.match(/^\d+\./)) {
      tips.push(line.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '').trim())
    }
  })

  return {
    personalizedInstruction: instruction,
    tips: tips.length > 0 ? tips : ['Take your time', 'Be gentle with yourself', 'You\'re doing great'],
    encouragement: encouragement || 'Keep going, you\'re doing amazing!'
  }
}

function getFallbackContent(exerciseType: string, techniqueTitle: string): ExerciseAIContent {
  const fallbacks = {
    stress: {
      personalizedInstruction: `Let's practice ${techniqueTitle}. Take your time and focus on the present moment.`,
      tips: ['Breathe naturally', 'Stay present', 'Be patient with yourself'],
      encouragement: 'You\'re doing great! Keep going.'
    },
    anxiety: {
      personalizedInstruction: `Let's use ${techniqueTitle} to help you feel safe and grounded. You're safe here.`,
      tips: ['You are safe', 'This feeling will pass', 'Focus on your breathing'],
      encouragement: 'You\'re taking care of yourself. Keep going.'
    },
    mood: {
      personalizedInstruction: `Let's boost your mood with ${techniqueTitle}. Focus on the positive energy.`,
      tips: ['Focus on the positive', 'Be present', 'Feel the energy'],
      encouragement: 'You\'re building positive energy!'
    },
    confidence: {
      personalizedInstruction: `Let's build your confidence with ${techniqueTitle}. You are capable and strong.`,
      tips: ['You are worthy', 'Your voice matters', 'Believe in yourself'],
      encouragement: 'You\'re growing stronger!'
    }
  }

  return fallbacks[exerciseType as keyof typeof fallbacks] || fallbacks.stress
}

function getFallbackReflection(exerciseType: string): string {
  const reflections = {
    stress: 'You\'ve completed your stress relief exercises. Take a moment to notice how you feel. These techniques are always here when you need them.',
    anxiety: 'You\'ve completed your anxiety relief sequence. You\'re safe, and you\'ve shown yourself that you can handle difficult moments.',
    mood: 'You\'ve completed your mood-boosting activities! Keep that positive energy flowing throughout your day.',
    confidence: 'You\'ve completed your confidence-building exercises! Remember, you are capable, worthy, and strong.'
  }

  return reflections[exerciseType as keyof typeof reflections] || reflections.stress
}

function getFallbackEncouragement(exerciseType: string): string {
  const encouragements = {
    stress: 'You\'re doing great! Keep focusing on your breathing.',
    anxiety: 'You\'re safe. This feeling will pass.',
    mood: 'Keep that positive energy flowing!',
    confidence: 'You\'re growing stronger with each moment!'
  }

  return encouragements[exerciseType as keyof typeof encouragements] || encouragements.stress
}
