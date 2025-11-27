// API route for fetching religious places (temples, gurudwaras, churches) using Google Places API
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

  console.log(`[Religious API] Request for city: ${city}, locality: ${locality}`);

  if (!city || !locality) {
    console.error('[Religious API] Missing required parameters');
    return res.status(400).json({
      success: false,
      error: 'City and locality are required',
      places: [],
      count: 0
    });
  }

  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('[Religious API] GOOGLE_PLACES_API_KEY not configured in environment');
    return res.status(500).json({
      success: false,
      error: 'API key not configured',
      places: [],
      count: 0
    });
  }

  try {
    // Multiple search queries for different religious places
    const queries = [
      `temples in ${locality}, ${city}, India`,
      `gurudwaras in ${locality}, ${city}, India`,
      `churches in ${locality}, ${city}, India`,
      `mosques in ${locality}, ${city}, India`
    ];

    console.log(`[Religious API] Searching ${queries.length} categories`);

    // Fetch all results in parallel with timeout
    const searchPromises = queries.map(async (searchQuery) => {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`[Religious API] HTTP error for "${searchQuery}": ${response.status}`);
          return { status: 'ERROR', results: [] };
        }
        
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`[Religious API] Fetch error for "${searchQuery}":`, error.message);
        return { status: 'ERROR', results: [] };
      }
    });

    const results = await Promise.all(searchPromises);

    // Combine and deduplicate results
    const allPlaces = new Map();
    const placeTypes = ['Temple', 'Gurudwara', 'Church', 'Mosque'];

    results.forEach((data, index) => {
      if (data.status === 'OK' && data.results) {
        data.results.forEach(place => {
          if (!allPlaces.has(place.place_id)) {
            allPlaces.set(place.place_id, {
              name: place.name,
              address: place.formatted_address || place.vicinity || 'Address not available',
              rating: place.rating || null,
              type: placeTypes[index],
              phone: null,
              website: null,
              distance: null
            });
          }
        });
      }
    });

    const places = Array.from(allPlaces.values());

    const executionTime = Date.now() - startTime;
    console.log(`[Religious API] Success! Found ${places.length} places in ${executionTime}ms`);

    return res.status(200).json({
      success: true,
      places: places.slice(0, 15), // Limit to top 15 results
      count: places.length,
      error: null
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[Religious API] Error after ${executionTime}ms:`, error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch religious places',
      places: [],
      count: 0
    });
  }
}
