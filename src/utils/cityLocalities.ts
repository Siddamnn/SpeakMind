/**
 * Localities/Areas for major Indian cities
 */

export const CITY_LOCALITIES: Record<string, string[]> = {
  'Delhi': [
    'Connaught Place',
    'Rajouri Garden',
    'Karol Bagh',
    'Lajpat Nagar',
    'Saket',
    'Dwarka',
    'Rohini',
    'Janakpuri',
    'Nehru Place',
    'Greater Kailash',
    'Vasant Kunj',
    'Hauz Khas',
    'Defence Colony',
    'Mayur Vihar',
    'Pitampura'
  ],
  'Mumbai': [
    'Andheri',
    'Bandra',
    'Juhu',
    'Powai',
    'Borivali',
    'Malad',
    'Goregaon',
    'Dadar',
    'Worli',
    'Lower Parel',
    'Colaba',
    'Marine Drive',
    'Churchgate',
    'Fort',
    'Thane'
  ],
  'Bangalore': [
    'Koramangala',
    'Indiranagar',
    'Whitefield',
    'Electronic City',
    'HSR Layout',
    'BTM Layout',
    'Jayanagar',
    'Malleshwaram',
    'JP Nagar',
    'Bannerghatta Road',
    'Hebbal',
    'Marathahalli',
    'Yelahanka',
    'Rajajinagar',
    'MG Road'
  ],
  'Hyderabad': [
    'Hitech City',
    'Gachibowli',
    'Madhapur',
    'Banjara Hills',
    'Jubilee Hills',
    'Begumpet',
    'Secunderabad',
    'Kukatpally',
    'Miyapur',
    'Kondapur',
    'KPHB',
    'Ameerpet',
    'Somajiguda',
    'Malakpet',
    'LB Nagar'
  ],
  'Chennai': [
    'T Nagar',
    'Anna Nagar',
    'Adyar',
    'Velachery',
    'Porur',
    'Tambaram',
    'Mylapore',
    'Nungambakkam',
    'Besant Nagar',
    'OMR',
    'Guindy',
    'Egmore',
    'Chromepet',
    'Pallavaram',
    'Sholinganallur'
  ],
  'Pune': [
    'Koregaon Park',
    'Viman Nagar',
    'Kothrud',
    'Hinjewadi',
    'Wakad',
    'Baner',
    'Aundh',
    'Shivajinagar',
    'FC Road',
    'Kalyani Nagar',
    'Magarpatta',
    'Hadapsar',
    'Kharadi',
    'Pimpri',
    'Chinchwad'
  ],
  'Ahmedabad': [
    'Satellite',
    'Vastrapur',
    'Bodakdev',
    'SG Highway',
    'Prahlad Nagar',
    'Navrangpura',
    'CG Road',
    'Ambawadi',
    'Thaltej',
    'Maninagar',
    'Naranpura',
    'Chandkheda',
    'Gota',
    'Bopal',
    'Paldi'
  ],
  'Kolkata': [
    'Park Street',
    'Salt Lake',
    'Ballygunge',
    'Alipore',
    'New Town',
    'Rajarhat',
    'Howrah',
    'Behala',
    'Jadavpur',
    'Gariahat',
    'Esplanade',
    'Dum Dum',
    'Barasat',
    'Sealdah',
    'Garia'
  ],
  'Jaipur': [
    'C Scheme',
    'Vaishali Nagar',
    'Malviya Nagar',
    'Mansarovar',
    'Tonk Road',
    'JLN Marg',
    'MI Road',
    'Ajmer Road',
    'Sodala',
    'Bani Park',
    'Raja Park',
    'Jagatpura',
    'Sitapura',
    'Sanganer',
    'Pratap Nagar'
  ]
}

// Default localities for cities not in the detailed list
export const DEFAULT_LOCALITIES = [
  'Central Area',
  'North Zone',
  'South Zone',
  'East Zone',
  'West Zone',
  'City Center'
]

export const getLocalitiesForCity = (city: string): string[] => {
  return CITY_LOCALITIES[city] || DEFAULT_LOCALITIES
}
