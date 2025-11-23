// Cognitive Distortion Analysis using Gemini AI
// Analyzes user thoughts/journal entries for cognitive distortions and provides CBT reframes

import { callGeminiAPI } from './geminiAPI'

export interface CognitiveDistortion {
  type: string
  description: string
  severity: number // 1-10
}

export interface ThoughtAnalysis {
  originalThought: string
  distortions: CognitiveDistortion[]
  evidence: string[]
  counterEvidence: string[]
  reframe: string
  balancedThought: string
  suggestions: string[]
}

const DISTORTION_TYPES = [
  'catastrophizing',
  'all-or-nothing thinking',
  'overgeneralization',
  'mental filter',
  'jumping to conclusions',
  'magnification',
  'emotional reasoning',
  'should statements',
  'labeling',
  'personalization',
  'mind reading',
  'fortune telling'
]

/**
 * Analyze a thought or journal entry for cognitive distortions
 */
export const analyzeThought = async (thought: string): Promise<ThoughtAnalysis | null> => {
  if (!thought || thought.trim().length < 10) {
    return null
  }

  const prompt = `You are a cognitive behavioral therapy (CBT) expert. Analyze the following thought or journal entry for cognitive distortions.

Thought: "${thought}"

Please analyze this thought and provide:
1. List of cognitive distortions present (from: ${DISTORTION_TYPES.join(', ')})
2. Evidence supporting the thought (facts that support it)
3. Counter-evidence (facts that challenge it)
4. A balanced, realistic reframe
5. Practical suggestions for challenging this thought

Respond in JSON format with this structure:
{
  "distortions": [
    {
      "type": "distortion name",
      "description": "brief description of how this distortion appears",
      "severity": number from 1-10
    }
  ],
  "evidence": ["fact 1", "fact 2"],
  "counterEvidence": ["fact 1", "fact 2"],
  "reframe": "balanced, realistic reframe of the thought",
  "balancedThought": "a more balanced version of the original thought",
  "suggestions": ["suggestion 1", "suggestion 2"]
}

Be compassionate, supportive, and practical. Focus on helping the person see their thought from a more balanced perspective.`

  try {
    const response = await callGeminiAPI(prompt)
    
    if (!response.success || !response.text) {
      return getFallbackAnalysis(thought)
    }

    // Try to parse JSON from response
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = response.text
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) || jsonText.match(/```\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonText = jsonMatch[1]
      }

      const parsed = JSON.parse(jsonText)
      
      return {
        originalThought: thought,
        distortions: parsed.distortions || [],
        evidence: parsed.evidence || [],
        counterEvidence: parsed.counterEvidence || [],
        reframe: parsed.reframe || '',
        balancedThought: parsed.balancedThought || parsed.reframe || '',
        suggestions: parsed.suggestions || []
      }
    } catch (parseError) {
      // If JSON parsing fails, try to extract information from text
      return extractAnalysisFromText(thought, response.text)
    }
  } catch (error) {
    console.error('Error analyzing thought:', error)
    return getFallbackAnalysis(thought)
  }
}

/**
 * Extract analysis from unstructured text response
 */
const extractAnalysisFromText = (thought: string, text: string): ThoughtAnalysis => {
  const analysis: ThoughtAnalysis = {
    originalThought: thought,
    distortions: [],
    evidence: [],
    counterEvidence: [],
    reframe: '',
    balancedThought: '',
    suggestions: []
  }

  // Try to find distortions mentioned
  DISTORTION_TYPES.forEach(distortion => {
    if (text.toLowerCase().includes(distortion.toLowerCase())) {
      analysis.distortions.push({
        type: distortion,
        description: `This thought shows signs of ${distortion}`,
        severity: 5
      })
    }
  })

  // Extract reframe (usually in quotes or after "reframe", "balanced", etc.)
  const reframeMatch = text.match(/(?:reframe|balanced thought|alternative):\s*["']?([^"'\n]+)["']?/i)
  if (reframeMatch) {
    analysis.reframe = reframeMatch[1].trim()
    analysis.balancedThought = analysis.reframe
  } else {
    // Fallback: use a generic reframe
    analysis.reframe = "Let's look at this thought from a more balanced perspective. What evidence supports it? What evidence challenges it?"
    analysis.balancedThought = analysis.reframe
  }

  // Extract suggestions (usually bullet points or numbered)
  const suggestionMatches = text.match(/(?:suggestion|tip|try):\s*([^\n]+)/gi)
  if (suggestionMatches) {
    analysis.suggestions = suggestionMatches.slice(0, 3).map(s => s.replace(/^(?:suggestion|tip|try):\s*/i, '').trim())
  }

  return analysis
}

/**
 * Get fallback analysis when API fails
 */
const getFallbackAnalysis = (thought: string): ThoughtAnalysis => {
  const thoughtLower = thought.toLowerCase()
  
  const distortions: CognitiveDistortion[] = []
  
  // Simple pattern matching for common distortions
  if (thoughtLower.includes('never') || thoughtLower.includes('always') || thoughtLower.includes('everyone') || thoughtLower.includes('nobody')) {
    distortions.push({
      type: 'overgeneralization',
      description: 'Using words like "never" or "always" suggests overgeneralization',
      severity: 6
    })
  }
  
  if (thoughtLower.includes('terrible') || thoughtLower.includes('awful') || thoughtLower.includes('disaster') || thoughtLower.includes('worst')) {
    distortions.push({
      type: 'catastrophizing',
      description: 'Using extreme negative language suggests catastrophizing',
      severity: 7
    })
  }
  
  if (thoughtLower.includes('should') || thoughtLower.includes('must') || thoughtLower.includes('have to')) {
    distortions.push({
      type: 'should statements',
      description: 'Using "should" or "must" suggests rigid thinking',
      severity: 5
    })
  }

  return {
    originalThought: thought,
    distortions: distortions.length > 0 ? distortions : [{
      type: 'unclear',
      description: 'This thought may contain cognitive distortions. Consider examining it more closely.',
      severity: 5
    }],
    evidence: ['Consider what facts support this thought'],
    counterEvidence: ['What facts challenge this thought?', 'Have there been times when this wasn\'t true?'],
    reframe: 'Let\'s examine this thought from a balanced perspective. What evidence supports it? What evidence challenges it?',
    balancedThought: 'Consider a more balanced view that acknowledges both the challenges and the possibilities.',
    suggestions: [
      'Write down evidence that supports this thought',
      'Write down evidence that challenges this thought',
      'Consider alternative explanations or perspectives'
    ]
  }
}

/**
 * Get description for a distortion type
 */
export const getDistortionDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    'catastrophizing': 'Expecting the worst possible outcome',
    'all-or-nothing thinking': 'Seeing things in black and white, no middle ground',
    'overgeneralization': 'Making broad conclusions from a single event',
    'mental filter': 'Focusing only on negative details while filtering out positive',
    'jumping to conclusions': 'Making negative interpretations without definite facts',
    'magnification': 'Exaggerating the importance of negative events',
    'emotional reasoning': 'Believing that negative feelings reflect reality',
    'should statements': 'Using "should", "must", or "ought" statements that set unrealistic expectations',
    'labeling': 'Attaching negative labels to yourself or others',
    'personalization': 'Believing you are responsible for events outside your control',
    'mind reading': 'Assuming you know what others are thinking',
    'fortune telling': 'Predicting negative outcomes without evidence'
  }
  
  return descriptions[type.toLowerCase()] || 'A cognitive distortion that may be affecting your thinking'
}

