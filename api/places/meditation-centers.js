// API route for fetching major meditation organizations using Google Places API
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
  const { city } = req.method === 'POST' ? req.body : req.query;

  console.log(`[Meditation API] Request for city: ${city}`);

  if (!city) {
    console.error('[Meditation API] Missing required parameter: city');
    return res.status(400).json({
      success: false,
      error: 'City is required',
      places: [],
      count: 0
    });
  }

  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('[Meditation API] GOOGLE_PLACES_API_KEY not configured in environment');
    return res.status(500).json({
      success: false,
      error: 'API key not configured',
      places: [],
      count: 0
    });
  }

  try {
    // Search queries for major meditation organizations
    const organizations = [
      'Osho meditation center',
      'Art of Living center',
      'Isha Foundation Sadhguru center',
      'Brahma Kumaris meditation center',
      'Vipassana meditation center',
      'Heartfulness meditation center'
    ];

    const queries = organizations.map(org => `${org} in ${city}, India`);

    console.log(`[Meditation API] Searching ${queries.length} organizations`);

    // Fetch all results in parallel with timeout
    const searchPromises = queries.map(async (searchQuery) => {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`[Meditation API] HTTP error for "${searchQuery}": ${response.status}`);
          return { status: 'ERROR', results: [] };
        }
        
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`[Meditation API] Fetch error for "${searchQuery}":`, error.message);
        return { status: 'ERROR', results: [] };
      }
    });

    const results = await Promise.all(searchPromises);

    // Combine and deduplicate results
    const allPlaces = new Map();

    results.forEach((data, index) => {
      if (data.status === 'OK' && data.results) {
        data.results.forEach(place => {
          if (!allPlaces.has(place.place_id)) {
            // Determine organization type
            let orgType = 'Meditation Center';
            const name = place.name.toLowerCase();
            if (name.includes('osho')) orgType = 'Osho';
            else if (name.includes('art of living')) orgType = 'Art of Living';
            else if (name.includes('isha') || name.includes('sadhguru')) orgType = 'Isha Foundation';
            else if (name.includes('brahma kumaris')) orgType = 'Brahma Kumaris';
            else if (name.includes('vipassana')) orgType = 'Vipassana';
            else if (name.includes('heartfulness')) orgType = 'Heartfulness';

            allPlaces.set(place.place_id, {
              name: place.name,
              address: place.formatted_address || place.vicinity || 'Address not available',
              rating: place.rating || null,
              type: orgType,
              phone: null,
              website: place.website || null,
              distance: null
            });
          }
        });
      }
    });

    const places = Array.from(allPlaces.values());

    const executionTime = Date.now() - startTime;
    console.log(`[Meditation API] Success! Found ${places.length} places in ${executionTime}ms`);

    return res.status(200).json({
      success: true,
      places: places.slice(0, 10), // Limit to top 10 results
      count: places.length,
      error: null
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[Meditation API] Error after ${executionTime}ms:`, error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch meditation centers',
      places: [],
      count: 0
    });
  }
}
