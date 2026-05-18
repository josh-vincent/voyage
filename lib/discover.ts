// Shared discover data — same source the chat `thingsToDo` tool reads from.
// Adding here lets the screen render without going through the assistant.
import { findAirport } from './airports';
import { cityCoord, offsetFromCity } from './cityCoords';
import { photoForActivity } from './photoProvider';

export type ActivityKind =
  | 'food'
  | 'culture'
  | 'outdoors'
  | 'nightlife'
  | 'view'
  | 'shopping';

export type Activity = {
  id: string;
  title: string;
  area: string;
  kind: ActivityKind;
  priceLevel: 1 | 2 | 3;
  when: string;
  city: string;
  blurb?: string;
  lat?: number;
  lng?: number;
  photo?: string;
};

type SeedActivity = Omit<Activity, 'id' | 'city'> & { blurb?: string };

const SEED: Record<string, SeedActivity[]> = {
  'New York': [
    {
      title: 'Coffee crawl in the West Village',
      area: 'Manhattan',
      kind: 'food',
      priceLevel: 2,
      when: 'morning',
      blurb: 'Three pours, three philosophies. Walk the loop end-to-end before noon.',
    },
    {
      title: 'Brooklyn Bridge sunset walk',
      area: 'Brooklyn',
      kind: 'view',
      priceLevel: 1,
      when: 'evening',
      blurb: 'Start at City Hall, finish at Dumbo. Best on a clear evening.',
    },
    {
      title: 'MoMA late hours',
      area: 'Midtown',
      kind: 'culture',
      priceLevel: 2,
      when: 'late afternoon',
      blurb: 'Quieter crowds after 4pm. Members entry off 53rd.',
    },
    {
      title: 'Dive bar hop on the LES',
      area: 'Lower East Side',
      kind: 'nightlife',
      priceLevel: 2,
      when: 'night',
      blurb: 'Pick three places, walk between them. Pizza stop encouraged.',
    },
    {
      title: 'High Line + Chelsea galleries',
      area: 'Chelsea',
      kind: 'outdoors',
      priceLevel: 1,
      when: 'afternoon',
      blurb: 'Walk the rail, drop into two galleries on 24th.',
    },
  ],
  'Los Angeles': [
    {
      title: 'Pacific Coast Highway drive to Malibu',
      area: 'Coast',
      kind: 'outdoors',
      priceLevel: 2,
      when: 'afternoon',
      blurb: 'Open windows. Stop at El Matador for the photo.',
    },
    {
      title: 'Griffith Observatory at dusk',
      area: 'Griffith',
      kind: 'view',
      priceLevel: 1,
      when: 'evening',
      blurb: 'Park early, walk the upper path for the city panorama.',
    },
    {
      title: 'Grand Central Market tasting',
      area: 'Downtown',
      kind: 'food',
      priceLevel: 2,
      when: 'lunch',
      blurb: 'Three stalls is the sweet spot. Eggslut for breakfast.',
    },
    {
      title: 'Venice canals + Abbot Kinney',
      area: 'Venice',
      kind: 'shopping',
      priceLevel: 2,
      when: 'afternoon',
      blurb: 'Quiet canals first, then drift north for shops and coffee.',
    },
  ],
  London: [
    {
      title: 'Borough Market brunch',
      area: 'Bankside',
      kind: 'food',
      priceLevel: 2,
      when: 'morning',
      blurb: 'Get there by 10. The cheese stalls draw the line.',
    },
    {
      title: 'Tate Modern + Millennium Bridge',
      area: 'South Bank',
      kind: 'culture',
      priceLevel: 1,
      when: 'afternoon',
      blurb: 'Free entry, except special exhibitions. Cross at golden hour.',
    },
    {
      title: 'Primrose Hill sunset picnic',
      area: 'Camden',
      kind: 'view',
      priceLevel: 1,
      when: 'evening',
      blurb: 'Bring a blanket and one bottle of something cold.',
    },
    {
      title: 'Soho tiny-restaurant crawl',
      area: 'Soho',
      kind: 'food',
      priceLevel: 3,
      when: 'night',
      blurb: 'One small place, one drink, repeat. Bouchon Racine for the wine.',
    },
  ],
  Paris: [
    {
      title: "Bakery breakfast on Rue Cler",
      area: '7th',
      kind: 'food',
      priceLevel: 2,
      when: 'morning',
      blurb: 'Croissant + café crème. Stand at the counter like everyone else.',
    },
    {
      title: "Musée d'Orsay at opening",
      area: '7th',
      kind: 'culture',
      priceLevel: 2,
      when: 'morning',
      blurb: 'Go for the upper floor first. Cézanne before crowds.',
    },
    {
      title: 'Canal Saint-Martin apéro',
      area: '10th',
      kind: 'food',
      priceLevel: 2,
      when: 'evening',
      blurb: 'Pick a bench by the water. Order whatever they have on tap.',
    },
    {
      title: 'Montmartre after dark',
      area: '18th',
      kind: 'view',
      priceLevel: 1,
      when: 'night',
      blurb: 'Less touristy past 9pm. Sacré-Cœur steps catch the breeze.',
    },
  ],
  Tokyo: [
    {
      title: 'Tsukiji outer market sushi breakfast',
      area: 'Tsukiji',
      kind: 'food',
      priceLevel: 2,
      when: 'morning',
      blurb: 'Seven stalls deep. Don\'t skip the tamagoyaki.',
    },
    {
      title: 'teamLab Planets',
      area: 'Toyosu',
      kind: 'culture',
      priceLevel: 2,
      when: 'afternoon',
      blurb: 'Book ahead. The water room is the keeper.',
    },
    {
      title: 'Shibuya crossing + Nonbei Yokocho',
      area: 'Shibuya',
      kind: 'nightlife',
      priceLevel: 2,
      when: 'night',
      blurb: 'See the crossing once. Drink in the alleys behind it.',
    },
    {
      title: 'Yanaka Ginza quiet wander',
      area: 'Yanaka',
      kind: 'outdoors',
      priceLevel: 1,
      when: 'afternoon',
      blurb: 'Old Tokyo in low gear. Croquettes at the corner shop.',
    },
  ],
  Lisbon: [
    {
      title: 'Miradouro da Graça sunset',
      area: 'Graça',
      kind: 'view',
      priceLevel: 1,
      when: 'evening',
      blurb: 'A glass of vinho verde at the kiosk. Stay for the lights.',
    },
    {
      title: 'Tram 28 ride',
      area: 'Alfama',
      kind: 'outdoors',
      priceLevel: 1,
      when: 'morning',
      blurb: 'End-to-end in 40 minutes. Hop off at Estrela.',
    },
    {
      title: 'Pastéis in Belém',
      area: 'Belém',
      kind: 'food',
      priceLevel: 1,
      when: 'afternoon',
      blurb: 'Original, always warm, take three.',
    },
    {
      title: 'Bairro Alto late-night bars',
      area: 'Bairro Alto',
      kind: 'nightlife',
      priceLevel: 2,
      when: 'night',
      blurb: 'Walk slow, drink on the street, end on a fado stop.',
    },
  ],
  Rome: [
    {
      title: 'Early Colosseum with guide',
      area: 'Centre',
      kind: 'culture',
      priceLevel: 2,
      when: 'morning',
      blurb: '7:30 entry is the only quiet hour. Worth the guided ticket.',
    },
    {
      title: 'Trastevere dinner crawl',
      area: 'Trastevere',
      kind: 'food',
      priceLevel: 2,
      when: 'night',
      blurb: 'One antipasto, two primi, one dolce. Spread across three places.',
    },
    {
      title: 'Aventine keyhole + Rose garden',
      area: 'Aventine',
      kind: 'view',
      priceLevel: 1,
      when: 'afternoon',
      blurb: 'Walk up Via Petroselli. Look through the door. Then the roses.',
    },
  ],
  Barcelona: [
    {
      title: 'Sagrada Família timed entry',
      area: 'Eixample',
      kind: 'culture',
      priceLevel: 2,
      when: 'morning',
      blurb: 'First slot of the day. Light through the east windows.',
    },
    {
      title: 'Tapas tour in El Born',
      area: 'El Born',
      kind: 'food',
      priceLevel: 2,
      when: 'evening',
      blurb: 'Vermouth, jamón, anchovy. Repeat at the next bar.',
    },
    {
      title: 'Bunkers del Carmel sunset',
      area: 'El Carmel',
      kind: 'view',
      priceLevel: 1,
      when: 'evening',
      blurb: 'Long climb, full panorama. Bring water and an extra layer.',
    },
  ],
  Amsterdam: [
    {
      title: 'Canal bike loop',
      area: 'Centre',
      kind: 'outdoors',
      priceLevel: 2,
      when: 'morning',
      blurb: 'Stay outside the inner ring early. Cars and cobbles wake later.',
    },
    {
      title: 'Foodhallen lunch',
      area: 'Oud-West',
      kind: 'food',
      priceLevel: 2,
      when: 'lunch',
      blurb: 'Pick three stalls. Bitterballen are obligatory.',
    },
    {
      title: 'Van Gogh Museum',
      area: 'Museumplein',
      kind: 'culture',
      priceLevel: 2,
      when: 'afternoon',
      blurb: 'Late tickets keep the rooms calm. Audio guide on.',
    },
  ],
  Dubai: [
    {
      title: 'Old Dubai souks + abra crossing',
      area: 'Deira',
      kind: 'shopping',
      priceLevel: 1,
      when: 'morning',
      blurb: 'Gold then spice. Take the abra across for a dirham.',
    },
    {
      title: 'Dune drive at golden hour',
      area: 'Desert',
      kind: 'outdoors',
      priceLevel: 3,
      when: 'evening',
      blurb: 'Pick a quiet operator. Stay for stars after the camp.',
    },
    {
      title: 'Burj Khalifa at the top',
      area: 'Downtown',
      kind: 'view',
      priceLevel: 3,
      when: 'sunset',
      blurb: 'Book the 124th floor at sunset for the best balance.',
    },
  ],
  Singapore: [
    {
      title: 'Hawker crawl at Maxwell',
      area: 'Chinatown',
      kind: 'food',
      priceLevel: 1,
      when: 'lunch',
      blurb: 'Hainanese chicken rice first. Three more stalls if you can.',
    },
    {
      title: 'Gardens by the Bay at night',
      area: 'Marina',
      kind: 'view',
      priceLevel: 2,
      when: 'night',
      blurb: 'Supertree light show, then the cooled conservatories.',
    },
    {
      title: 'Tiong Bahru indie cafés',
      area: 'Tiong Bahru',
      kind: 'food',
      priceLevel: 2,
      when: 'morning',
      blurb: 'Slow, art-deco, well-fed. Pick a single café and stay.',
    },
  ],
  Sydney: [
    {
      title: 'Bondi to Coogee coastal walk',
      area: 'East',
      kind: 'outdoors',
      priceLevel: 1,
      when: 'morning',
      blurb: '6km along the cliffs. Coffee at Bondi, swim at Bronte.',
    },
    {
      title: 'Opera Bar at sunset',
      area: 'Circular Quay',
      kind: 'view',
      priceLevel: 2,
      when: 'evening',
      blurb: 'Walk in, no reservation, perfect light against the sails.',
    },
    {
      title: 'Chinatown yum cha',
      area: 'CBD',
      kind: 'food',
      priceLevel: 2,
      when: 'lunch',
      blurb: 'Go for the trolleys, not the menu. Saturdays are loudest.',
    },
  ],
  Miami: [
    {
      title: 'Wynwood mural loop',
      area: 'Wynwood',
      kind: 'culture',
      priceLevel: 1,
      when: 'morning',
      blurb: 'Start at the Walls, drift outward. Coffee at Panther.',
    },
    {
      title: 'South Beach swim + Espanola Way dinner',
      area: 'South Beach',
      kind: 'outdoors',
      priceLevel: 2,
      when: 'afternoon',
      blurb: 'Swim first, eat later. Patio tables fill at sunset.',
    },
    {
      title: 'Little Havana sunset',
      area: 'Little Havana',
      kind: 'food',
      priceLevel: 2,
      when: 'evening',
      blurb: 'Calle Ocho energy. Window service for café cubano.',
    },
  ],
};

function activityId(city: string, idx: number, t: string) {
  return `${city.toLowerCase().replace(/\s+/g, '-')}_${idx}_${t.toLowerCase().slice(0, 12).replace(/[^a-z0-9]+/g, '-')}`;
}

const ALL: Record<string, Activity[]> = Object.fromEntries(
  Object.entries(SEED).map(([city, list]) => {
    const centroid = cityCoord(city);
    return [
      city,
      list.map((a, i) => {
        const base: Activity = { ...a, city, id: activityId(city, i, a.title) };
        if (centroid) {
          const offset = offsetFromCity(centroid, i + 1, 1.8);
          base.lat = offset.lat;
          base.lng = offset.lng;
        }
        base.photo = photoForActivity(base);
        return base;
      }),
    ];
  }),
);

export function listSupportedCities(): string[] {
  return Object.keys(ALL);
}

export function getCityActivities(query: string): { city: string; activities: Activity[] } | null {
  if (!query) return null;
  const direct = ALL[query];
  if (direct) return { city: query, activities: direct };
  const ci = Object.keys(ALL).find((c) => c.toLowerCase() === query.trim().toLowerCase());
  if (ci) return { city: ci, activities: ALL[ci] };
  const upper = query.trim().toUpperCase();
  const airport = findAirport(upper);
  if (airport && ALL[airport.city]) return { city: airport.city, activities: ALL[airport.city] };
  return null;
}

export function getActivityById(id: string): Activity | null {
  for (const list of Object.values(ALL)) {
    const found = list.find((a) => a.id === id);
    if (found) return found;
  }
  return null;
}

export const KIND_META: Record<
  ActivityKind,
  { label: string; icon: string; accent: string }
> = {
  food: { label: 'Food', icon: 'Utensils', accent: '#c97d4a' },
  culture: { label: 'Culture', icon: 'Library', accent: '#7b6e8c' },
  outdoors: { label: 'Outdoors', icon: 'Trees', accent: '#1f6b43' },
  nightlife: { label: 'Nightlife', icon: 'Music', accent: '#1a3d8c' },
  view: { label: 'View', icon: 'Mountain', accent: '#b86b3d' },
  shopping: { label: 'Shopping', icon: 'ShoppingBag', accent: '#a04848' },
};
