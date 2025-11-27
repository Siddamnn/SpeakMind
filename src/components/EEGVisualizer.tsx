// Real-time EEG Visualizer Component
// Displays live brain wave patterns during meditation session

import { useEffect, useRef, useState } from 'react'
import type { EEGDataPoint } from '../utils/eegService'
import { useTheme } from '../contexts/ThemeContext'

interface EEGVisualizerProps {
  data: EEGDataPoint | null
  isActive: boolean
}

export default function EEGVisualizer({ data, isActive }: EEGVisualizerProps) {
  const { colors, isDarkMode } = useTheme()

  const [waveHistory, setWaveHistory] = useState<{
    alpha: number[]
    beta: number[]
    theta: number[]
    delta: number[]
    gamma: number[]
  }>({
    alpha: [],
    beta: [],
    theta: [],
    delta: [],
    gamma: []
  })

  const maxDataPoints = 100 // Show last 100 data points
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data || !isActive) return

    setWaveHistory(prev => {
      const update = (arr: number[], value: number) => {
        const newArr = [...arr, value]
        return newArr.slice(-maxDataPoints)
      }

      return {
        alpha: update(prev.alpha, data.alpha),
        beta: update(prev.beta, data.beta),
        theta: update(prev.theta, data.theta),
        delta: update(prev.delta, data.delta),
        gamma: update(prev.gamma, data.gamma)
      }
    })
  }, [data, isActive])

  const renderWave = (
    values: number[],
    color: string,
    height: number,
    yOffset: number
  ) => {
    if (values.length === 0) return null

    const width = 400
    const maxAmplitude = 50
    const normalizedValues = values.map(v => Math.max(-maxAmplitude, Math.min(maxAmplitude, v)))
    
    const points = normalizedValues.map((value, index) => {
      const x = (index / (maxDataPoints - 1)) * width
      const y = height / 2 - (value / maxAmplitude) * (height / 2) + yOffset
      return `${x},${y}`
    }).join(' ')

    return (
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        points={points}
      />
    )
  }

  const waveConfigs = [
    { key: 'alpha' as const, color: colors.primary, label: 'Alpha', freq: '8–13 Hz', description: 'Relaxed awareness' },
    { key: 'beta' as const, color: '#F97373', label: 'Beta', freq: '13–30 Hz', description: 'Focus & thinking' },
    { key: 'theta' as const, color: '#FACC6B', label: 'Theta', freq: '4–8 Hz', description: 'Deep relaxation' },
    { key: 'delta' as const, color: '#38BDF8', label: 'Delta', freq: '0.5–4 Hz', description: 'Rest & recovery' },
  ]

  const gammaValue = data?.gamma ?? 0

  if (!isActive) {
    return (
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-dark-border p-6">
        <div className="text-center text-gray-500 dark:text-dark-text-secondary">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-dark-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">EEG visualization will appear when session starts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-dark-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Live Brain Waves</h3>
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary">Updated in real time from your EEG signal</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
              isActive
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-gray-100 text-gray-500 dark:bg-dark-bg-secondary dark:text-dark-text-secondary'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            {isActive ? 'Streaming' : 'Paused'}
          </span>
        </div>
      </div>

      {/* 2x2 grid of band tiles */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {waveConfigs.map(config => {
          const values = waveHistory[config.key]
          const currentValue = data ? data[config.key] : 0

          return (
            <div
              key={config.key}
              className="relative rounded-2xl border border-gray-100 dark:border-dark-border bg-gray-50/80 dark:bg-dark-bg-secondary/80 overflow-hidden p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-800 dark:text-dark-text">
                      {config.label}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-dark-text-secondary">
                      {config.freq}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-800 dark:text-dark-text">
                    {currentValue.toFixed(1)}μV
                  </span>
                  <div className="text-[10px] text-gray-500 dark:text-dark-text-secondary">
                    {config.description}
                  </div>
                </div>
              </div>

              <div className="relative h-16 rounded-xl overflow-hidden">
                <div className="absolute inset-0 opacity-[0.15]">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.35) 1px, transparent 1px)',
                      backgroundSize: '12px 12px',
                    }}
                  />
                </div>

                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox="0 0 400 80"
                  preserveAspectRatio="none"
                  className="relative w-full h-full"
                >
                  <line
                    x1="0"
                    y1="40"
                    x2="400"
                    y2="40"
                    stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />

                  {values.length > 0 && renderWave(values, config.color, 80, 0)}
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      {/* Gamma highlight strip */}
      <div className="mt-2 flex items-center justify-between rounded-2xl border border-gray-100 dark:border-dark-border bg-gradient-to-r from-purple-50/70 via-indigo-50/70 to-sky-50/70 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-sky-900/20 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center">
            <span className="text-xs">✨</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-dark-text">Gamma activity</p>
            <p className="text-[10px] text-gray-500 dark:text-dark-text-secondary">
              High-level processing & deep focus
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-300">
            {gammaValue.toFixed(1)}μV
          </p>
        </div>
      </div>
    </div>
  )
}

