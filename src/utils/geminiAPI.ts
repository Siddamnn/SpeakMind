// Gemini AI API integration utility
// This file handles all interactions with Google's Gemini AI API
// API keys are protected via serverless function

import { USE_SERVERLESS } from '../config/apiConfig'

export interface GeminiResponse {
  success: boolean
  text?: string
  error?: string
}

/**
 * Call Gemini AI API with a wellness-focused prompt
 * @param question - User's question about mental wellness/meditation
 * @returns Promise<GeminiResponse>
 */
export const callGeminiAPI = async (question: string): Promise<GeminiResponse> => {
  if (USE_SERVERLESS) {
    // Call serverless function (API key is protected)
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question })
      })

      if (response.ok) {
        const data = await response.json()
        return data
      } else {
        return {
          success: false,
          error: 'Failed to get AI response. Please try again.'
        }
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error)
      return {
        success: true,
        text: getFallbackResponse(question)
      }
    }
  } else {
    // Direct API call (for local development only - exposes API key)
    return callGeminiAPIDirect(question)
  }
}

// Direct API call (only for local development)
const callGeminiAPIDirect = async (question: string): Promise<GeminiResponse> => {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here' || GEMINI_API_KEY === 'your-gemini-api-key') {
    return {
      success: false,
      error: 'Gemini API key not configured. Please copy .env.example to .env and add your actual VITE_GEMINI_API_KEY. Get your key from: https://makersuite.google.com/app/apikey'
    }
  }

  const GEMINI_ENDPOINTS = [
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  ]

  const requestBody = {
    contents: [{
      parts: [{
        text: `You are a compassionate mental wellness coach and meditation expert named "Mindful Guide". Please provide helpful, supportive guidance for this question about mindfulness, meditation, or mental health: "${question}". 

Keep your response warm, encouraging, practical, and limited to 2-3 paragraphs. Focus on mindfulness and wellness techniques.`
      }]
    }]
  }

  for (let i = 0; i < GEMINI_ENDPOINTS.length; i++) {
    const endpoint = GEMINI_ENDPOINTS[i]

    try {
      const response = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          return {
            success: true,
            text: data.candidates[0].content.parts[0].text
          }
        }
      }

      if (i === GEMINI_ENDPOINTS.length - 1) {
        return {
          success: true,
          text: getFallbackResponse(question)
        }
      }
    } catch (error) {
      if (i === GEMINI_ENDPOINTS.length - 1) {
        return {
          success: true,
          text: getFallbackResponse(question)
        }
      }
    }
  }

  return {
    success: true,
    text: getFallbackResponse(question)
  }
}

/**
 * Get fallback response when API is not available
 */
const getFallbackResponse = (question: string): string => {
  const questionLower = question.toLowerCase()

  // Provide contextual responses based on common meditation/wellness questions
  if (questionLower.includes('stress') || questionLower.includes('anxious')) {
    return "I understand you're feeling stressed or anxious. Here's a simple technique that can help: Take three deep breaths, inhaling for 4 counts, holding for 4, and exhaling for 6. This activates your parasympathetic nervous system and promotes calm. Remember, it's okay to feel this way - acknowledge your feelings without judgment and be gentle with yourself."
  }

  if (questionLower.includes('meditation') || questionLower.includes('meditate')) {
    return "Meditation is a wonderful practice for mental wellness! Start small - even 2-3 minutes daily is more beneficial than longer sessions done inconsistently. Find a quiet space, sit comfortably, and focus on your breath. When your mind wanders (and it will!), gently bring your attention back without judgment. This is the practice - not achieving a blank mind, but returning to presence."
  }

  if (questionLower.includes('sleep') || questionLower.includes('insomnia')) {
    return "Sleep issues can be challenging. Try creating a calming bedtime routine: dim the lights an hour before bed, avoid screens, and practice gentle breathing exercises. The 4-7-8 breathing technique can be particularly helpful: inhale for 4, hold for 7, exhale for 8. Remember, rest is essential for your mental wellness journey."
  }

  if (questionLower.includes('focus') || questionLower.includes('concentration')) {
    return "Improving focus takes practice and patience. Try the 5-4-3-2-1 grounding technique: Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This brings your attention to the present moment. Regular meditation practice also strengthens your ability to focus and maintain attention."
  }

  // Default response for any other questions
  return "Thank you for reaching out about your wellness journey. Remember that mindfulness is about observing your thoughts and feelings without judgment. Take a moment to breathe deeply and be present with whatever you're experiencing. Your mental wellness journey is unique to you - be patient and compassionate with yourself as you develop these practices. If you're feeling overwhelmed, consider speaking with a mental health professional."
}

/**
 * Test if Gemini API key is working with a simple request
 */
export const testGeminiAPI = async (): Promise<{ success: boolean, error?: string }> => {
  // Testing is not available when using serverless functions
  if (USE_SERVERLESS) {
    return { success: true, error: 'API key testing not available in serverless mode' }
  }

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

  try {
    console.log('Testing Gemini API with key:', GEMINI_API_KEY?.substring(0, 10) + '...')

    const testEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    const testBody = {
      contents: [{
        parts: [{
          text: "Hello, this is a test message."
        }]
      }]
    }

    const response = await fetch(`${testEndpoint}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBody)
    })

    console.log('Test response status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('Test API Response:', data)
      return { success: true }
    } else {
      const errorText = await response.text()
      console.log('Test API Error:', errorText)
      return {
        success: false,
        error: `API test failed with status ${response.status}: ${errorText}`
      }
    }
  } catch (error) {
    console.log('Test API Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get predefined wellness responses for common scenarios
 */
export const getWellnessTips = () => {
  const tips = [
    "Take three deep breaths. Inhale for 4 counts, hold for 4, exhale for 6. This activates your parasympathetic nervous system and promotes calm.",
    "Try the 5-4-3-2-1 grounding technique: Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
    "Remember that mindfulness is about observing your thoughts without judgment. You don't need to stop thinking - just notice when your mind wanders and gently bring attention back to the present.",
    "Start small with meditation. Even 2-3 minutes daily is more beneficial than longer sessions done inconsistently.",
    "Your mental wellness journey is unique to you. Be patient and compassionate with yourself as you develop these practices."
  ]

  return tips[Math.floor(Math.random() * tips.length)]
}