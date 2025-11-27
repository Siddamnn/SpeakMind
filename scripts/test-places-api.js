/**
 * Test script for Google Places API
 * Tests the API key by making a simple request
 * 
 * Usage: node scripts/test-places-api.js
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '.env') })

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY

async function testPlacesAPI() {
  console.log('\n🔍 Testing Google Places API...\n')
  
  if (!GOOGLE_PLACES_API_KEY) {
    console.error('❌ ERROR: GOOGLE_PLACES_API_KEY not found in .env file')
    console.log('   Please add GOOGLE_PLACES_API_KEY=your-api-key to your .env file')
    process.exit(1)
  }

  console.log('✓ API Key found:', GOOGLE_PLACES_API_KEY.substring(0, 10) + '...')
  
  // Test query: Search for yoga centers in Delhi
  const testQuery = 'yoga meditation centers in Delhi, India'
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(testQuery)}&key=${GOOGLE_PLACES_API_KEY}`
  
  console.log('\n📍 Test Query:', testQuery)
  console.log('🌐 API Endpoint: Google Places Text Search API')
  
  try {
    console.log('\n⏳ Making API request...')
    const response = await fetch(url)
    const data = await response.json()
    
    console.log('\n📊 Response Status:', data.status)
    
    if (data.status === 'OK') {
      console.log('✅ SUCCESS! API key is working correctly\n')
      console.log(`   Found ${data.results.length} results`)
      
      if (data.results.length > 0) {
        console.log('\n📍 Sample Results:')
        data.results.slice(0, 3).forEach((place, index) => {
          console.log(`\n   ${index + 1}. ${place.name}`)
          console.log(`      Address: ${place.formatted_address || place.vicinity || 'N/A'}`)
          console.log(`      Rating: ${place.rating ? '⭐ ' + place.rating : 'N/A'}`)
        })
      }
      
      console.log('\n✅ All tests passed! Your Google Places API is configured correctly.')
      console.log('   You can now use the Places API in your application.\n')
    } else if (data.status === 'ZERO_RESULTS') {
      console.log('⚠️  WARNING: API key works but no results found for this query')
      console.log('   This might be normal depending on the location.\n')
    } else if (data.status === 'REQUEST_DENIED') {
      console.log('❌ ERROR: Request denied by Google Places API')
      console.log('   Error message:', data.error_message)
      console.log('\n   Possible issues:')
      console.log('   1. API key is invalid or expired')
      console.log('   2. Places API is not enabled in Google Cloud Console')
      console.log('   3. API key restrictions are blocking the request')
      console.log('\n   Please check your Google Cloud Console:\n   https://console.cloud.google.com/apis/credentials\n')
      process.exit(1)
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.log('❌ ERROR: Over query limit')
      console.log('   You have exceeded your quota for the Places API')
      console.log('   Please check your usage in Google Cloud Console\n')
      process.exit(1)
    } else {
      console.log('❌ ERROR: Unexpected status:', data.status)
      if (data.error_message) {
        console.log('   Error message:', data.error_message)
      }
      console.log('\n   Full response:', JSON.stringify(data, null, 2), '\n')
      process.exit(1)
    }
    
  } catch (error) {
    console.log('\n❌ ERROR: Failed to make API request')
    console.log('   ', error.message)
    console.log('\n   This might be a network issue or invalid API endpoint.\n')
    process.exit(1)
  }
}

// Run the test
testPlacesAPI()
