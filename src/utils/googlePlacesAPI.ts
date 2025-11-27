/**
 * Google Places API Integration
 * Fetches nearby yoga centers, meditation centers, temples, and wellness centers
 */

import { USE_SERVERLESS } from '../config/apiConfig'
import Logger from './Logger'

export interface Place {
  name: string
  address: string
  rating?: number
  type: string
  phone?: string
  website?: string
  distance?: number
}

export interface PlacesResponse {
  success: boolean
  places: Place[]
  count: number
  error?: string
}

const GOOGLE_PLACES_API_KEY = import.meta.env['VITE_GOOGLE_PLACES_API_KEY']

/**
 * Direct Google Places API call (local development only)
 */
const callGooglePlacesAPI = async (searchQuery: string): Promise<any> => {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY not configured in .env')
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`
  
  const response = await fetch(url)
  const data = await response.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    Logger.error('Google Places API error:', data.status, data.error_message)
    throw new Error(`Google Places API error: ${data.status}`)
  }

  return data
}

/**
 * Fetch nearby yoga and meditation centers
 */
export const fetchYogaCenters = async (
  city: string,
  locality: string
): Promise<PlacesResponse> => {
  try {
    if (USE_SERVERLESS) {
      // Production: Use serverless function with timeout and retry
      Logger.info('[Places API] Using serverless endpoint for yoga centers')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch('/api/places/yoga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, locality }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        Logger.error('[Places API] Yoga centers fetch failed:', response.status, errorText)
        throw new Error(`Failed to fetch yoga centers: ${response.status}`)
      }

      const data = await response.json()
      Logger.info('[Places API] Yoga centers fetched successfully:', data.count, 'places')
      return data
    } else {
      // Local development: Direct API call
      Logger.info('[Places API] Using direct API call for yoga centers')
      const searchQuery = `yoga meditation centers in ${locality}, ${city}, India`
      const data = await callGooglePlacesAPI(searchQuery)

      const places = (data.results || []).map((place: any) => ({
        name: place.name,
        address: place.formatted_address || place.vicinity || 'Address not available',
        rating: place.rating || null,
        type: 'Yoga & Meditation Center',
        phone: null,
        website: null,
        distance: null
      }))

      return {
        success: true,
        places: places.slice(0, 10),
        count: places.length,
        error: undefined
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      Logger.error('[Places API] Yoga centers request timed out')
      return {
        success: false,
        places: [],
        count: 0,
        error: 'Request timed out - please try again'
      }
    }
    
    Logger.error('[Places API] Error fetching yoga centers:', error)
    return { 
      success: false, 
      places: [], 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Fetch nearby temples, gurudwaras, churches, mosques
 */
export const fetchReligiousPlaces = async (
  city: string,
  locality: string
): Promise<PlacesResponse> => {
  try {
    if (USE_SERVERLESS) {
      // Production: Use serverless function with timeout
      Logger.info('[Places API] Using serverless endpoint for religious places')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000) // 12 second timeout (parallel requests)
      
      const response = await fetch('/api/places/religious', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, locality }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        Logger.error('[Places API] Religious places fetch failed:', response.status, errorText)
        throw new Error(`Failed to fetch religious places: ${response.status}`)
      }

      const data = await response.json()
      Logger.info('[Places API] Religious places fetched successfully:', data.count, 'places')
      return data
    } else {
      // Local development: Direct API calls with parallel queries
      Logger.info('[Places API] Using direct API call for religious places')
      const queries = [
        `temples in ${locality}, ${city}, India`,
        `gurudwaras in ${locality}, ${city}, India`,
        `churches in ${locality}, ${city}, India`,
        `mosques in ${locality}, ${city}, India`
      ]

      const searchPromises = queries.map((searchQuery) => 
        callGooglePlacesAPI(searchQuery)
      )

      const results = await Promise.all(searchPromises)

      // Combine and deduplicate results
      const allPlaces = new Map()
      const placeTypes = ['Temple', 'Gurudwara', 'Church', 'Mosque']

      results.forEach((data, index) => {
        if (data.status === 'OK' && data.results) {
          data.results.forEach((place: any) => {
            if (!allPlaces.has(place.place_id)) {
              allPlaces.set(place.place_id, {
                name: place.name,
                address: place.formatted_address || place.vicinity || 'Address not available',
                rating: place.rating || null,
                type: placeTypes[index],
                phone: null,
                website: null,
                distance: null
              })
            }
          })
        }
      })

      const places = Array.from(allPlaces.values())

      return {
        success: true,
        places: places.slice(0, 15),
        count: places.length,
        error: undefined
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      Logger.error('[Places API] Religious places request timed out')
      return {
        success: false,
        places: [],
        count: 0,
        error: 'Request timed out - please try again'
      }
    }
    
    Logger.error('[Places API] Error fetching religious places:', error)
    return { 
      success: false, 
      places: [], 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Fetch major meditation centers (Osho, Art of Living, Sadhguru, Brahma Kumaris)
 */
export const fetchMeditationCenters = async (
  city: string
): Promise<PlacesResponse> => {
  try {
    if (USE_SERVERLESS) {
      // Production: Use serverless function with timeout
      Logger.info('[Places API] Using serverless endpoint for meditation centers')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000) // 12 second timeout (parallel requests)
      
      const response = await fetch('/api/places/meditation-centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        Logger.error('[Places API] Meditation centers fetch failed:', response.status, errorText)
        throw new Error(`Failed to fetch meditation centers: ${response.status}`)
      }

      const data = await response.json()
      Logger.info('[Places API] Meditation centers fetched successfully:', data.count, 'places')
      return data
    } else {
      // Local development: Direct API calls with parallel queries
      Logger.info('[Places API] Using direct API call for meditation centers')
      const organizations = [
        'Osho meditation center',
        'Art of Living center',
        'Isha Foundation Sadhguru center',
        'Brahma Kumaris meditation center',
        'Vipassana meditation center',
        'Heartfulness meditation center'
      ]

      const queries = organizations.map(org => `${org} in ${city}, India`)

      const searchPromises = queries.map((searchQuery) => 
        callGooglePlacesAPI(searchQuery)
      )

      const results = await Promise.all(searchPromises)

      // Combine and deduplicate results
      const allPlaces = new Map()

      results.forEach((data) => {
        if (data.status === 'OK' && data.results) {
          data.results.forEach((place: any) => {
            if (!allPlaces.has(place.place_id)) {
              // Determine organization type
              let orgType = 'Meditation Center'
              const name = place.name.toLowerCase()
              if (name.includes('osho')) orgType = 'Osho'
              else if (name.includes('art of living')) orgType = 'Art of Living'
              else if (name.includes('isha') || name.includes('sadhguru')) orgType = 'Isha Foundation'
              else if (name.includes('brahma kumaris')) orgType = 'Brahma Kumaris'
              else if (name.includes('vipassana')) orgType = 'Vipassana'
              else if (name.includes('heartfulness')) orgType = 'Heartfulness'

              allPlaces.set(place.place_id, {
                name: place.name,
                address: place.formatted_address || place.vicinity || 'Address not available',
                rating: place.rating || null,
                type: orgType,
                phone: null,
                website: place.website || null,
                distance: null
              })
            }
          })
        }
      })

      const places = Array.from(allPlaces.values())

      return {
        success: true,
        places: places.slice(0, 10),
        count: places.length,
        error: undefined
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      Logger.error('[Places API] Meditation centers request timed out')
      return {
        success: false,
        places: [],
        count: 0,
        error: 'Request timed out - please try again'
      }
    }
    
    Logger.error('[Places API] Error fetching meditation centers:', error)
    return { 
      success: false, 
      places: [], 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
