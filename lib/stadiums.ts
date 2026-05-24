export interface Stadium {
  id: string
  city: string
  name: string
  country: 'usa' | 'mex' | 'can'
  flag: string
  lon: number
  lat: number
  matches: number
  cap: number
  about: string
  timezone: string
  airport: string
  airportDist: string
  transit: string
  language: string
  weather: string
  image: string
  isFinal?: boolean
  // Per-stadium subreddit list used by the Scout agent for Exa domain filtering.
  // Injected from SUBREDDITS_BY_ID below — the raw data array stays metadata-only.
  subreddits: string[]
}

// Per-stadium-id list of subreddits the Scout agent searches via Exa.
// Add or remove subs here; the agent will pick them up immediately.
const SUBREDDITS_BY_ID: Record<string, string[]> = {
  lax: ['LosAngeles', 'AskLosAngeles', 'soccer', 'LAGalaxy'],
  nyc: ['nyc', 'AskNYC', 'newjersey', 'soccer', 'NYCFC'],
  dal: ['Dallas', 'DFW', 'fctexas', 'soccer'],
  atl: ['Atlanta', 'AtlantaUnited', 'soccer'],
  mia: ['Miami', 'florida', 'IntermiamiCF', 'soccer'],
  hou: ['houston', 'HoustonDynamo', 'soccer'],
  sfo: ['bayarea', 'sanfrancisco', 'sanjose', 'SJEarthquakes', 'soccer'],
  bos: ['boston', 'NERevolution', 'soccer'],
  phi: ['philadelphia', 'PhillyUnion', 'soccer'],
  kc: ['kansascity', 'SportingKC', 'soccer'],
  sea: ['SeattleWA', 'Seattle', 'SoundersFC', 'soccer'],
  tor: ['toronto', 'askTO', 'TorontoFC', 'soccer'],
  van: ['vancouver', 'askvan', 'whitecaps', 'soccer'],
  mex: ['Mexico_City', 'mexico', 'futbol', 'ClubAmerica'],
  mty: ['Monterrey', 'mexico', 'futbol', 'Rayados'],
  gdl: ['Guadalajara', 'mexico', 'futbol', 'Chivas'],
}

const RAW_STADIUMS: Omit<Stadium, 'subreddits'>[] = [
  { id: 'van', city: 'Vancouver', name: 'BC Place', country: 'can', flag: '🇨🇦', lon: -123.112, lat: 49.277, matches: 7, cap: 54500, about: 'BC Place sits in the heart of downtown Vancouver, minutes from the waterfront and Gastown. The stadium retractable roof keeps matches rain-free in any June shower. Skytrain stops directly outside gate — no car needed.', timezone: 'PT (UTC −7)', airport: 'YVR · 10 mi', airportDist: '25 min by Canada Line', transit: 'SkyTrain (Canada Line)', language: 'EN · FR', weather: '65°F · 18°C', image: 'https://upload.wikimedia.org/wikipedia/commons/8/83/BC_Place_Stadium_%282015%29.jpg' },
  { id: 'sea', city: 'Seattle', name: 'Lumen Field', country: 'usa', flag: '🇺🇸', lon: -122.332, lat: 47.595, matches: 6, cap: 68740, about: 'Lumen Field occupies the southern edge of downtown Seattle, walking distance from Pioneer Square and Pike Place Market. Light Rail connects SEA-TAC airport directly to the stadium in 38 minutes.', timezone: 'PT (UTC −7)', airport: 'SEA-TAC · 14 mi', airportDist: '38 min by Link', transit: 'Link Light Rail', language: 'EN', weather: '68°F · 20°C', image: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Lumen_Field_north_side_at_dusk.jpg' },
  { id: 'sfo', city: 'SF Bay Area', name: "Levi's Stadium", country: 'usa', flag: '🇺🇸', lon: -121.970, lat: 37.404, matches: 6, cap: 68500, about: 'Santa Clara sits in the geographic heart of Silicon Valley, 45 minutes south of San Francisco. Mediterranean climate, walkable downtowns in San Jose and SF. VTA light rail drops you 200 metres from gate F — much easier on match days.', timezone: 'PT (UTC −7)', airport: 'SJC · 4 mi', airportDist: '10 min by taxi', transit: 'VTA light rail', language: 'EN · ES · 中文', weather: '78°F · 26°C', image: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Levi%27s_Stadium_in_February_2016_prior_to_Super_Bowl_50_%2824398261729%29.jpg' },
  { id: 'lax', city: 'Los Angeles', name: 'SoFi Stadium', country: 'usa', flag: '🇺🇸', lon: -118.339, lat: 33.953, matches: 8, cap: 70240, about: 'SoFi Stadium in Inglewood offers one of the most spectacular settings in world football — an open-air design with a translucent roof and massive dual-sided video board. Metro K Line connects LAX to the stadium.', timezone: 'PT (UTC −7)', airport: 'LAX · 3 mi', airportDist: '15 min by Metro K', transit: 'Metro K Line', language: 'EN · ES', weather: '82°F · 28°C', image: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Aerial_view_of_SoFi_Stadium_%28July_2022%29.jpg' },
  { id: 'kc', city: 'Kansas City', name: 'GEHA Arrowhead', country: 'usa', flag: '🇺🇸', lon: -94.484, lat: 39.049, matches: 6, cap: 76416, about: 'GEHA Field at Arrowhead Stadium is one of the loudest venues in North American sports. The surrounding tailgate culture is legendary. Kansas City is a BBQ mecca — allow extra time before matches.', timezone: 'CT (UTC −5)', airport: 'MCI · 20 mi', airportDist: '30 min by car', transit: 'Rideshare / shuttle', language: 'EN', weather: '85°F · 29°C', image: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Aerial_view_of_Arrowhead_Stadium_08-31-2013_crop.jpg' },
  { id: 'dal', city: 'Dallas', name: 'AT&T Stadium', country: 'usa', flag: '🇺🇸', lon: -97.093, lat: 32.747, matches: 9, cap: 80000, about: 'AT&T Stadium in Arlington is a monument to excess — the world\'s largest domed stadium at time of opening. The retractable roof and sides handle Texas heat perfectly. DFW airport is 20 minutes away.', timezone: 'CT (UTC −5)', airport: 'DFW · 20 mi', airportDist: '25 min by car', transit: 'Trinity Railway Express', language: 'EN · ES', weather: '92°F · 33°C', image: 'https://upload.wikimedia.org/wikipedia/commons/9/98/ATT_Stadium_Roof_Open.jpg' },
  { id: 'hou', city: 'Houston', name: 'NRG Stadium', country: 'usa', flag: '🇺🇸', lon: -95.411, lat: 29.685, matches: 7, cap: 72220, about: 'NRG Stadium features a retractable roof essential for Houston\'s heat and humidity. The Texas Medical Center nearby makes Houston one of the most internationally diverse cities in the US — reflected in the food scene.', timezone: 'CT (UTC −5)', airport: 'IAH · 22 mi', airportDist: '30 min by car', transit: 'METRORail / shuttle', language: 'EN · ES · VI', weather: '90°F · 32°C', image: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Reliant_Stadium_Aerial.JPG' },
  { id: 'atl', city: 'Atlanta', name: 'Mercedes-Benz', country: 'usa', flag: '🇺🇸', lon: -84.401, lat: 33.755, matches: 8, cap: 71000, about: 'Mercedes-Benz Stadium is among the finest in the world — a retractable roof that opens like a camera aperture, a 360° halo board, and a pedestrian-friendly district surrounding it. MARTA runs directly to the stadium.', timezone: 'ET (UTC −4)', airport: 'ATL · 10 mi', airportDist: '25 min by MARTA', transit: 'MARTA (Vine City)', language: 'EN', weather: '88°F · 31°C', image: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Mercedes-Benz_Stadium_with_the_Georgia_Dome_remains_in_the_foreground_%2827663350329%29.jpg' },
  { id: 'mia', city: 'Miami', name: 'Hard Rock', country: 'usa', flag: '🇺🇸', lon: -80.239, lat: 25.958, matches: 7, cap: 65326, about: 'Hard Rock Stadium sits just north of Miami in Miami Gardens. The stadium added a canopy structure for shade in 2016 — critical in Florida heat. South Beach is 20 minutes south; Wynwood art district 15 minutes.', timezone: 'ET (UTC −4)', airport: 'MIA · 8 mi', airportDist: '15 min by car', transit: 'Brightline + shuttle', language: 'EN · ES · Créole', weather: '88°F · 31°C', image: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Hard_Rock_Stadium_Prior_to_first_NFL_game.jpg' },
  { id: 'phi', city: 'Philadelphia', name: 'Lincoln Financial', country: 'usa', flag: '🇺🇸', lon: -75.168, lat: 39.901, matches: 6, cap: 67594, about: 'Lincoln Financial Field is in the South Philly sports complex, a 15-minute walk from the Broad Street Line. Philadelphia is America\'s most European-feeling city — dense, walkable, with a world-class food scene in Reading Terminal Market.', timezone: 'ET (UTC −4)', airport: 'PHL · 8 mi', airportDist: '20 min by SEPTA', transit: 'SEPTA Broad Street Line', language: 'EN', weather: '80°F · 27°C', image: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Lincoln_Financial_Field_%28Aerial_view%29.jpg' },
  { id: 'nyc', city: 'New York / NJ', name: 'MetLife', country: 'usa', flag: '🇺🇸', lon: -74.074, lat: 40.814, matches: 8, cap: 82500, isFinal: true, about: 'MetLife Stadium in East Rutherford, NJ hosts the World Cup Final on July 19. The largest stadium in the competition, it\'s 8 miles from midtown Manhattan via NJ Transit. NYC offers unmatched culture, food, and nightlife before and after every match.', timezone: 'ET (UTC −4)', airport: 'EWR · 8 mi', airportDist: '20 min by NJ Transit', transit: 'NJ Transit from Penn Station', language: 'EN · ES · 中文 + 190 more', weather: '82°F · 28°C', image: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Metlife_stadium_%28Aerial_view%29.jpg' },
  { id: 'bos', city: 'Boston', name: 'Gillette', country: 'usa', flag: '🇺🇸', lon: -71.264, lat: 42.091, matches: 7, cap: 65878, about: 'Gillette Stadium is in Foxborough, 30 miles south of Boston. A dedicated Commuter Rail match-day service runs from South Station. New England seafood (chowder, lobster rolls) is essential pre-match dining.', timezone: 'ET (UTC −4)', airport: 'BOS · 35 mi', airportDist: '50 min by commuter rail', transit: 'MBTA Commuter Rail', language: 'EN', weather: '78°F · 26°C', image: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Aerial_view_of_Patriot_Place.jpg' },
  { id: 'tor', city: 'Toronto', name: 'BMO Field', country: 'can', flag: '🇨🇦', lon: -79.418, lat: 43.633, matches: 6, cap: 45500, about: 'BMO Field sits on the Lake Ontario waterfront, a 10-minute streetcar ride from Union Station. Toronto is the most multicultural city in the world — over 200 languages spoken. The waterfront district and Distillery Historic District are excellent pre-match destinations.', timezone: 'ET (UTC −4)', airport: 'YYZ · 16 mi', airportDist: '45 min by UP Express + streetcar', transit: 'TTC Streetcar (509)', language: 'EN · FR + 200 more', weather: '76°F · 24°C', image: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/BMO_Field%2C_Toronto%2C_Ontario_%2829969149766%29.jpg' },
  { id: 'mex', city: 'Mexico City', name: 'Estadio Azteca', country: 'mex', flag: '🇲🇽', lon: -99.150, lat: 19.303, matches: 5, cap: 87000, about: 'Estadio Azteca is a cathedral of world football — home to two World Cup finals and Maradona\'s Hand of God. At 2,240m altitude, teams feel the effects by the second half. The surrounding Coyoacán neighborhood and Frida Kahlo Museum are worth a full day.', timezone: 'CT (UTC −5)', airport: 'MEX · 12 mi', airportDist: '30 min by Metro Line 1', transit: 'Metro Línea 2', language: 'ES', weather: '72°F · 22°C', image: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Vista_a%C3%A9rea_del_Estadio_Azteca_-_2026_-_01.jpg' },
  { id: 'gdl', city: 'Guadalajara', name: 'Estadio Akron', country: 'mex', flag: '🇲🇽', lon: -103.463, lat: 20.682, matches: 4, cap: 49850, about: 'Estadio Akron is home to Chivas, the only club in Mexico that signs only Mexican players. Guadalajara is the birthplace of mariachi and tequila. The Historic Centre and Tlaquepaque artisan markets are exceptional for matchday culture.', timezone: 'CT (UTC −5)', airport: 'GDL · 18 mi', airportDist: '30 min by car', transit: 'Macrobús / shuttle', language: 'ES', weather: '78°F · 26°C', image: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/EstadioAkronGDL.jpg' },
  { id: 'mty', city: 'Monterrey', name: 'Estadio BBVA', country: 'mex', flag: '🇲🇽', lon: -100.244, lat: 25.669, matches: 4, cap: 53500, about: 'Estadio BBVA is considered the most beautiful stadium in Latin America, set against the Sierra Madre mountains. Monterrey is Mexico\'s industrial capital and has a sophisticated restaurant scene. Parque Fundidora (a converted steel mill) is right next door.', timezone: 'CT (UTC −5)', airport: 'MTY · 15 mi', airportDist: '25 min by car', transit: 'Metro / shuttle', language: 'ES', weather: '88°F · 31°C', image: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Estadio_BBVA_Bancomer_%281%29.jpg' },
]

export const STADIUMS: Stadium[] = RAW_STADIUMS.map(s => ({
  ...s,
  subreddits: SUBREDDITS_BY_ID[s.id] ?? ['soccer'],
}))

export function getStadium(id: string): Stadium | undefined {
  return STADIUMS.find(s => s.id === id)
}
