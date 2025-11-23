import { useState } from 'react'
import { IoChevronBack, IoSparkles, IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5'
import type { Screen } from '../App'
import { analyzeThought, getDistortionDescription, type ThoughtAnalysis } from '../utils/cognitiveDistortionAnalysis'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'

interface ThoughtAnalysisScreenProps {
  onNavigate: (screen: Screen) => void
}

export default function ThoughtAnalysisScreen({ onNavigate }: ThoughtAnalysisScreenProps) {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const [thought, setThought] = useState('')
  const [analysis, setAnalysis] = useState<ThoughtAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!thought.trim() || thought.trim().length < 10) {
      setError('Please enter at least 10 characters to analyze')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)

    try {
      const result = await analyzeThought(thought.trim())
      if (result) {
        setAnalysis(result)
      } else {
        setError('Unable to analyze thought. Please try again.')
      }
    } catch (err) {
      console.error('Error analyzing thought:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getDistortionColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'catastrophizing': 'bg-red-100 text-red-800 border-red-200',
      'all-or-nothing thinking': 'bg-orange-100 text-orange-800 border-orange-200',
      'overgeneralization': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'mental filter': 'bg-purple-100 text-purple-800 border-purple-200',
      'jumping to conclusions': 'bg-pink-100 text-pink-800 border-pink-200',
      'magnification': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'emotional reasoning': 'bg-blue-100 text-blue-800 border-blue-200',
      'should statements': 'bg-teal-100 text-teal-800 border-teal-200',
      'labeling': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'personalization': 'bg-rose-100 text-rose-800 border-rose-200',
      'mind reading': 'bg-violet-100 text-violet-800 border-violet-200',
      'fortune telling': 'bg-amber-100 text-amber-800 border-amber-200'
    }
    return colorMap[type.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-dark-bg dark:via-dark-bg-secondary dark:to-dark-bg pb-20 transition-colors duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-white/30 dark:border-dark-border/30">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-card-hover rounded-full transition-colors"
          >
            <IoChevronBack className="w-6 h-6 text-gray-700 dark:text-dark-text" />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Thought Analysis</h1>
            <p className="text-xs text-gray-500 dark:text-dark-text-secondary">CBT-powered insights</p>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Input Section */}
        <div className="mb-6">
          <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 dark:border-dark-border shadow-lg">
            <label className="block mb-3">
              <div className="flex items-center gap-2 mb-2">
                <IoSparkles className="w-5 h-5 theme-text" style={{ color: colors.primary }} />
                <span className="font-semibold text-gray-900 dark:text-dark-text">Enter your thought</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-3">
                Write down a thought that's bothering you. Our AI will analyze it for cognitive distortions and help you reframe it.
              </p>
            </label>
            <textarea
              value={thought}
              onChange={(e) => {
                setThought(e.target.value)
                setError(null)
                if (analysis) setAnalysis(null)
              }}
              placeholder="Example: I failed this test, I'm terrible at everything, I'll never succeed..."
              className="w-full h-32 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-900 dark:text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 resize-none"
              style={{ 
                '--tw-ring-color': colors.primary 
              } as React.CSSProperties & { '--tw-ring-color': string }}
            />
            {error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !thought.trim() || thought.trim().length < 10}
              className="w-full mt-4 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`
              }}
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                'Analyze Thought'
              )}
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4 animate-fadeIn">
            {/* Distortions Detected */}
            {analysis.distortions.length > 0 && (
              <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 dark:border-dark-border shadow-lg">
                <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-3 flex items-center gap-2">
                  <IoCloseCircle className="w-5 h-5 text-red-500" />
                  Cognitive Distortions Detected
                </h3>
                <div className="space-y-2">
                  {analysis.distortions.map((distortion, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border ${getDistortionColor(distortion.type)}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-sm">{distortion.type}</span>
                        <span className="text-xs opacity-70">Severity: {distortion.severity}/10</span>
                      </div>
                      <p className="text-xs mt-1 opacity-80">{distortion.description}</p>
                      <p className="text-xs mt-2 opacity-70 italic">
                        {getDistortionDescription(distortion.type)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence & Counter-Evidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.evidence.length > 0 && (
                <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 dark:border-dark-border shadow-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-3 text-sm">Evidence Supporting</h3>
                  <ul className="space-y-2">
                    {analysis.evidence.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-dark-text-secondary">
                        <IoCheckmarkCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.counterEvidence.length > 0 && (
                <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 dark:border-dark-border shadow-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-3 text-sm">Counter-Evidence</h3>
                  <ul className="space-y-2">
                    {analysis.counterEvidence.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-dark-text-secondary">
                        <IoCheckmarkCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Reframed Thought */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-5 border-2 border-purple-200 dark:border-purple-700 shadow-lg">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-3 flex items-center gap-2">
                <IoSparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Balanced Reframe
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 dark:text-dark-text-secondary mb-1">Original Thought:</p>
                  <p className="text-sm text-gray-800 dark:text-dark-text italic bg-white/50 dark:bg-dark-card/50 p-2 rounded-lg">
                    "{analysis.originalThought}"
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-dark-text-secondary mb-1">Reframed Thought:</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-text bg-white/70 dark:bg-dark-card/70 p-3 rounded-lg">
                    {analysis.balancedThought || analysis.reframe}
                  </p>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 dark:border-dark-border shadow-lg">
                <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-3">Practical Suggestions</h3>
                <ul className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-gray-700 dark:text-dark-text-secondary">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{
                          background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`
                        }}
                      >
                        {index + 1}
                      </div>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!analysis && !isAnalyzing && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.gradientFrom}20 0%, ${colors.gradientTo}20 100%)`
              }}
            >
              <IoSparkles className="w-10 h-10 theme-text" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">Ready to analyze your thoughts?</h3>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary max-w-md mx-auto">
              Write down a thought that's bothering you, and we'll help you identify cognitive distortions and create a more balanced perspective.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

