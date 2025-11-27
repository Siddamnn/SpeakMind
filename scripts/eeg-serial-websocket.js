// EEG Serial → WebSocket bridge
// Reads single-channel EEG data from Arduino (BioAmp EXG) on COM7
// and exposes band-like values over WebSocket at ws://localhost:8080/eeg
//
// Frontend expects JSON messages like:
// { alpha: number, beta: number, theta: number, delta: number, gamma: number }
//
// NOTE:
// - Make sure your Arduino is streaming at 115200 baud on COM7
//   with lines like: S,<micros>,<value>
// - Run this script with: npm run eeg:bridge

import { WebSocketServer } from 'ws'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'

const SERIAL_PORT = process.env.EEG_SERIAL_PORT || 'COM7'
const SERIAL_BAUD = 115200

const WS_PORT = Number(process.env.EEG_WS_PORT || 8080)
const WS_PATH = '/eeg'

console.log('[EEG Bridge] Starting...')
console.log(`[EEG Bridge] Serial: ${SERIAL_PORT} @ ${SERIAL_BAUD}`)
console.log(`[EEG Bridge] WebSocket: ws://localhost:${WS_PORT}${WS_PATH}`)

// --- Serial setup ---------------------------------------------------------

const serial = new SerialPort({
  path: SERIAL_PORT,
  baudRate: SERIAL_BAUD,
})

const parser = serial.pipe(new ReadlineParser({ delimiter: '\n' }))

serial.on('open', () => {
  console.log('[EEG Bridge] Serial port opened')
})

serial.on('error', (err) => {
  console.error('[EEG Bridge] Serial error:', err.message)
})

// --- WebSocket setup ------------------------------------------------------

const wss = new WebSocketServer({ port: WS_PORT, path: WS_PATH })

wss.on('connection', (ws) => {
  console.log('[EEG Bridge] WebSocket client connected')

  ws.on('close', () => {
    console.log('[EEG Bridge] WebSocket client disconnected')
  })
})

// Broadcast helper
function broadcast(data) {
  const payload = JSON.stringify(data)
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(payload)
    }
  }
}

// --- Simple "band" estimator ----------------------------------------------
// This is deliberately simple: we just transform the raw 0–1023 value into
// five smoothed channels so the UI has meaningful-looking movement.
// For real EEG analysis you would replace this with proper DSP.

let lastValue = 512
let alpha = 0
let beta = 0
let theta = 0
let delta = 0
let gamma = 0

const SMOOTH_FAST = 0.3
const SMOOTH_MED = 0.1
const SMOOTH_SLOW = 0.03

function lerp(prev, next, factor) {
  return prev + (next - prev) * factor
}

function updateBands(raw) {
  // Center around 0
  const centered = raw - 512
  const absVal = Math.abs(centered)

  // Map raw amplitude into a base microvolt-like value
  const base = absVal * 0.1 // tune this scale as needed

  // Simple relationships to get different-looking bands
  const targetAlpha = base * 1.0
  const targetBeta = base * 1.2
  const targetTheta = base * 0.8
  const targetDelta = base * 0.4
  const targetGamma = base * 1.5

  alpha = lerp(alpha, targetAlpha, SMOOTH_MED)
  beta = lerp(beta, targetBeta, SMOOTH_FAST)
  theta = lerp(theta, targetTheta, SMOOTH_SLOW)
  delta = lerp(delta, targetDelta, SMOOTH_SLOW)
  gamma = lerp(gamma, targetGamma, SMOOTH_FAST)
}

// --- Main data loop: parse serial and push to WebSocket -------------------

let sampleCount = 0

parser.on('data', (line) => {
  const trimmed = line.trim()
  if (!trimmed) return

  // Expected default format: S,<micros>,<value>
  // But be forgiving: if it doesn't match, still try to parse the last comma-separated field as an int.
  let valueStr

  if (trimmed.startsWith('S,')) {
    const parts = trimmed.split(',')
    if (parts.length < 3) return
    valueStr = parts[2]
  } else {
    const parts = trimmed.split(',')
    valueStr = parts[parts.length - 1]
  }

  const raw = Number.parseInt(valueStr, 10)
  if (Number.isNaN(raw)) return

  lastValue = raw
  updateBands(raw)

  // Log occasionally so it's easy to confirm data is flowing
  sampleCount++
  if (sampleCount % 500 === 0) {
    console.log('[EEG Bridge] Sample', sampleCount, 'raw =', raw, 'alpha =', alpha.toFixed(1))
  }

  const eegPoint = {
    alpha,
    beta,
    theta,
    delta,
    gamma,
    timestamp: Date.now(),
  }

  broadcast(eegPoint)
})

process.on('SIGINT', () => {
  console.log('\n[EEG Bridge] Shutting down...')
  serial.close(() => {
    process.exit(0)
  })
})


