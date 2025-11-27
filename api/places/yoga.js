// API route for fetching yoga and meditation centers using Google Places API
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const startTime = Date.now();

  // Support both query params and POST body
  const { city, locality } = req.method === 'POST' ? req.body : req.query;

  console.log(`[Yoga API] Request for city: ${city}, locality: ${locality}`);

  if (!city || !locality) {
    console.error('[Yoga API] Missing required parameters');
    return res.status(400).json({
      success: false,
      error: 'City and locality are required',
      places: [],
      count: 0
    });
  }

  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('[Yoga API] GOOGLE_PLACES_API_KEY not configured in environment');
    return res.status(500).json({
      success: false,
      error: 'API key not configured',
      places: [],
      count: 0
    });
  }

  try {
    // Search query combining city and locality
    const searchQuery = `yoga meditation centers in ${locality}, ${city}, India`;
    console.log(`[Yoga API] Search query: ${searchQuery}`);
    
    // Use Google Places Text Search API with timeout
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[Yoga API] Google Places response status: ${data.status}`);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[Yoga API] Google Places API error:', data.status, data.error_message);
      return res.status(500).json({
        success: false,
        error: `Google Places API error: ${data.status}`,
        places: [],
        count: 0
      });
    }

    // Transform results to our format
    const places = (data.results || []).map(place => ({
      name: place.name,
      address: place.formatted_address || place.vicinity || 'Address not available',
      rating: place.rating || null,
      type: 'Yoga & Meditation Center',
      phone: null, // Would need Place Details API for phone
      website: null, // Would need Place Details API for website
      distance: null // Would need user coordinates for distance calculation
    }));

    const executionTime = Date.now() - startTime;
    console.log(`[Yoga API] Success! Found ${places.length} places in ${executionTime}ms`);

    return res.status(200).json({
      success: true,
      places: places.slice(0, 10), // Limit to top 10 results
      count: places.length,
      error: null
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[Yoga API] Error after ${executionTime}ms:`, error.message);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: 'Request timeout - please try again',
        places: [],
        count: 0
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch yoga centers',
      places: [],
      count: 0
    });
  }
}
