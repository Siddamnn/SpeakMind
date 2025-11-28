# Google Places API - Production Setup Guide

## ✅ Production Readiness Checklist

### 1. Environment Variables (Vercel)
Ensure you have set the following environment variable in your Vercel project settings:

```
GOOGLE_PLACES_API_KEY=your_actual_api_key_here
```

**How to set in Vercel:**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add `GOOGLE_PLACES_API_KEY` with your Google Places API key
4. Deploy type: Production, Preview, Development (select all)
5. Click "Save"

### 2. Google Cloud Platform Setup
Ensure your Google Places API key has the following APIs enabled:

- ✅ **Places API** (for nearby search and place details)
- ✅ **Geocoding API** (for converting addresses to coordinates - **REQUIRED**)
- ✅ **Maps JavaScript API** (optional, for future map features)

**IMPORTANT:** Both **Places API** and **Geocoding API** must be enabled for the Places feature to work.

**API Restrictions (Recommended):**
- Application restrictions: None (or HTTP referrers if you want to restrict)
- Website restrictions (if using HTTP referrers): 
  - `https://your-domain.vercel.app/*`
  - `https://*.vercel.app/*` (for preview deployments)
- API restrictions: Select "Places API" and "Geocoding API"

### 3. Production Features Implemented

#### ✨ Client-Side Improvements
- **Timeout handling**: 10-12 second timeouts for API requests
- **Abort controllers**: Graceful request cancellation
- **Error logging**: Detailed error messages via Logger utility
- **Loading states**: User feedback during API calls
- **Success tracking**: Logs count and execution time

#### ✨ Serverless Function Improvements  
- **Two-step search**: Geocoding + Nearby Search for better accuracy
- **Fallback mechanism**: Text search as backup if nearby search fails
- **Request logging**: All requests logged with timestamps
- **Timeout protection**: 8-second timeout per Google API call
- **Parallel requests**: Religious and meditation APIs fetch multiple results simultaneously
- **Error handling**: Graceful degradation on partial failures
- **CORS enabled**: Works from any domain
- **Performance tracking**: Execution time logged for monitoring

### 4. API Endpoints

All endpoints are available at:
- **Yoga Centers**: `POST /api/places/yoga`
- **Religious Places**: `POST /api/places/religious`  
- **Meditation Centers**: `POST /api/places/meditation-centers`

**Request Format:**
```json
POST /api/places/yoga
Content-Type: application/json

{
  "city": "Mumbai",
  "locality": "Andheri"
}
```

**Response Format:**
```json
{
  "success": true,
  "places": [
    {
      "name": "Peace Yoga Center",
      "address": "123 Main St, Andheri, Mumbai",
      "rating": 4.5,
      "type": "Yoga & Meditation Center",
      "phone": null,
      "website": null,
      "distance": null
    }
  ],
  "count": 10,
  "error": null
}
```

### 5. How to Test in Production

#### Method 1: Browser Console (After Deploy)
```javascript
// Open your deployed site and run in browser console:
fetch('https://your-domain.vercel.app/api/places/yoga', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ city: 'Mumbai', locality: 'Andheri' })
})
  .then(r => r.json())
  .then(console.log)
```

#### Method 2: Use the UI
1. Navigate to Sharing screen
2. Click Events tab
3. Select a city from dropdown
4. Select a locality from dropdown
5. Click on category buttons (Yoga, Religious, Meditation)
6. Places should load automatically

#### Method 3: Vercel Logs
1. Go to Vercel Dashboard → Your Project → Logs
2. Navigate to the Events tab in your app
3. Select locality and category
4. Watch logs in real-time to see:
   - `[Yoga API] Request for city: Mumbai, locality: Andheri`
   - `[Yoga API] Success! Found 10 places in 1234ms`

### 6. Monitoring & Debugging

**Expected Log Patterns (Production):**
```
[Yoga API] Request for city: Mumbai, locality: Andheri
[Yoga API] Geocoding location: Andheri, Mumbai, India
[Yoga API] Location found: 19.1136, 72.8697
[Yoga API] Google Places response status: OK
[Yoga API] Success! Found 10 places in 1523ms
```

**Error Log Patterns:**
```
[Yoga API] Missing required parameters
[Yoga API] GOOGLE_PLACES_API_KEY not configured in environment
[Yoga API] Google Places API error: OVER_QUERY_LIMIT
[Yoga API] HTTP error for "temples in Andheri, Mumbai": 500
[Yoga API] Error after 8234ms: Request timeout
```

### 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not configured" | Set `GOOGLE_PLACES_API_KEY` in Vercel env vars and redeploy |
| "Failed to locate [city]" | Enable **Geocoding API** in Google Cloud Console - this is required! |
| "OVER_QUERY_LIMIT" | Check Google Cloud Platform quotas and billing |
| "Request timed out" | Google API is slow; timeout is 8s per request, 10-12s total |
| "ZERO_RESULTS" | Normal - no places found in that locality |
| Empty results | Check if locality/city name is spelled correctly |
| CORS errors | Serverless functions have CORS enabled; check network tab |
| "REQUEST_DENIED" | Enable both Places API AND Geocoding API in GCP |

### 8. Performance Expectations

- **Single API (Yoga)**: ~1-2 seconds
- **Parallel APIs (Religious)**: ~3-5 seconds (4 parallel requests)
- **Parallel APIs (Meditation)**: ~4-6 seconds (6 parallel requests)
- **Timeout**: 8 seconds per request, 10-12 seconds total with buffer

### 9. Google Places API Quotas

**Free Tier:**
- Text Search: $0.032 per request
- Free credit: $200/month
- Approx ~6,250 searches/month free

**Recommendations:**
- Enable billing in Google Cloud Platform
- Set budget alerts
- Monitor usage in GCP Console

### 10. Production Deployment

After making changes, deploy to Vercel:
```bash
git add .
git commit -m "Production-ready Places API with enhanced logging"
git push origin main
```

Vercel will auto-deploy. Check logs at:
- https://vercel.com/[your-username]/[project-name]/logs

---

## 🎯 Quick Verification Checklist

- [ ] `GOOGLE_PLACES_API_KEY` set in Vercel environment variables
- [ ] Google Places API enabled in Google Cloud Platform
- [ ] API key restrictions configured (optional but recommended)
- [ ] Deployed to Vercel successfully
- [ ] Checked Vercel logs for API requests
- [ ] Tested in UI by selecting city → locality → category
- [ ] Verified places are displayed in the UI

---

## 📝 Notes

- **Local Development**: Uses direct Google API calls (requires `VITE_GOOGLE_PLACES_API_KEY` in `.env`)
- **Production**: Automatically uses serverless functions (no client-side API key exposure)
- **Environment Detection**: Handled automatically via `apiConfig.ts`
- **Logging**: Verbose in production for monitoring; visible in Vercel logs
- **Security**: API keys never exposed to client in production mode

---

**Questions?** Check Vercel logs or contact support with specific error messages.
