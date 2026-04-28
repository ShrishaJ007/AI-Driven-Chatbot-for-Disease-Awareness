import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Circle,
  useMap,
} from 'react-leaflet';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MapPinned, Navigation, Building2, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

type CareSearchType = 'hospital' | 'doctor' | 'clinic';

type NearbyCareState = {
  disease?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  recommendedType?: CareSearchType;
  specialty?: string;
  source?: 'prediction' | 'manual';
};

type SearchType = 'hospital' | 'doctor' | 'clinic';

type CarePlace = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
  address: string;
};

const defaultCenter: [number, number] = [12.9716, 77.5946];

const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const placeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function getOverpassQuery(
  lat: number,
  lon: number,
  radius: number,
  searchType: CareSearchType,
  specialty?: string
) {
  const specialtyFilter = specialty?.trim()
  ? `["healthcare:speciality"~"${specialty.trim()}",i]`
  : '';

  if (searchType === 'hospital') {
    return `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"]${specialtyFilter}(around:${radius},${lat},${lon});
        way["amenity"="hospital"]${specialtyFilter}(around:${radius},${lat},${lon});
        relation["amenity"="hospital"]${specialtyFilter}(around:${radius},${lat},${lon});
      );
      out center tags;
    `;
  }

  if (searchType === 'doctor') {
    return `
      [out:json][timeout:25];
      (
        node["amenity"="doctors"]${specialtyFilter}(around:${radius},${lat},${lon});
        way["amenity"="doctors"]${specialtyFilter}(around:${radius},${lat},${lon});
        relation["amenity"="doctors"]${specialtyFilter}(around:${radius},${lat},${lon});
        node["healthcare"="doctor"]${specialtyFilter}(around:${radius},${lat},${lon});
        way["healthcare"="doctor"]${specialtyFilter}(around:${radius},${lat},${lon});
        relation["healthcare"="doctor"]${specialtyFilter}(around:${radius},${lat},${lon});
      );
      out center tags;
    `;
  }

  return `
    [out:json][timeout:25];
    (
      node["amenity"="clinic"]${specialtyFilter}(around:${radius},${lat},${lon});
      way["amenity"="clinic"]${specialtyFilter}(around:${radius},${lat},${lon});
      relation["amenity"="clinic"]${specialtyFilter}(around:${radius},${lat},${lon});
    );
    out center tags;
  `;
}

function formatAddress(tags: Record<string, string>) {
  const parts = [
    tags['addr:housename'],
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:state'],
    tags['addr:postcode'],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Address not available';
}

function mapDiseaseToSpecialty(disease: string): string {
  const value = disease.trim().toLowerCase();

const mapping: Record<string, string> = {
  migraine: 'neurology',
  headache: 'neurology',
  seizure: 'neurology',
  epilepsy: 'neurology',
  stroke: 'neurology',

  heart: 'cardiology',
  'chest pain': 'cardiology',
  hypertension: 'cardiology',
  'blood pressure': 'cardiology',

  cough: 'pulmonology',
  asthma: 'pulmonology',
  bronchitis: 'pulmonology',
  pneumonia: 'pulmonology',
  breathing: 'pulmonology',
  'breathing problem': 'pulmonology',

  sinusitis: 'ent',
  'ear pain': 'ent',
  'throat pain': 'ent',
  cold: 'ent',
  fever: 'general',
  'allergic rhinitis': 'ent',

  'urine infection': 'urology',
  uti: 'urology',
  'kidney stone': 'urology',

  'stomach pain': 'gastroenterology',
  gastritis: 'gastroenterology',
  acidity: 'gastroenterology',
  ulcer: 'gastroenterology',

  'skin rash': 'dermatology',
  acne: 'dermatology',
  eczema: 'dermatology',
  allergy: 'dermatology',

  diabetes: 'endocrinology',
  thyroid: 'endocrinology',
};

  return mapping[value] || '';
}

export default function NearbyCareFinder() {
  const [userLocation, setUserLocation] = useState<[number, number]>(defaultCenter);
  const [places, setPlaces] = useState<CarePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('hospital');
  const [radius, setRadius] = useState(5000);
  const [hasUserLocation, setHasUserLocation] = useState(false);
  const zoom = useMemo(() => (hasUserLocation ? 14 : 12), [hasUserLocation]);
  const [searchMode, setSearchMode] = useState<'recommended' | 'manual'>('manual'); 
  const [specialty, setSpecialty] = useState('');
  const [predictedDisease, setPredictedDisease] = useState('');
  const location = useLocation();
  const routeState = (location.state as NearbyCareState | null) || null;
  const [manualDisease, setManualDisease] = useState('');
  const [manualSpecialty, setManualSpecialty] = useState('');
  const [lastSearchTime, setLastSearchTime] = useState(0);
  
  

  useEffect(() => {
  if (routeState?.source === 'prediction') {
    setSearchMode('recommended');
    setSearchType(routeState.recommendedType || 'hospital');
    setSpecialty(routeState.specialty || '');
    setPredictedDisease(routeState.disease || '');
  }
}, [routeState]);

  const getUserLocation = () => {
    setLocationLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setHasUserLocation(true);
        setLocationLoading(false);
      },
      () => {
        setError('Unable to get your location. Please allow location access.');
        setLocationLoading(false);
      }
    );
  };

  

  const searchNearbyPlaces = async () => {

    const now = Date.now();
    if (now - lastSearchTime < 15000) {
      setError('Please wait a few seconds before searching again.');
      return;
    }
    setLastSearchTime(now);

  setLoading(true);
  setError('');
  setPlaces([]);

  try {
    const [lat, lon] = userLocation;

    const derivedSpecialty =
      searchMode === 'manual'
        ? manualSpecialty || mapDiseaseToSpecialty(manualDisease)
        : specialty;

    let query = getOverpassQuery(lat, lon, radius, searchType, derivedSpecialty);

    let response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: 'data=' + encodeURIComponent(query),
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 429) {
        throw new Error('Too many search requests. Please wait 20 to 30 seconds and try again.');
      }

      if (response.status === 504) {
        throw new Error('The map server is busy right now. Try again or reduce the radius.');
      }

      throw new Error(`Failed to fetch nearby places: ${response.status} ${errorText}`);
    }

    let data = await response.json();

    if ((data.elements || []).length === 0 && derivedSpecialty) {
      query = getOverpassQuery(lat, lon, radius, searchType);

      response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: 'data=' + encodeURIComponent(query),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fallback search failed: ${response.status} ${errorText}`);
      }

      data = await response.json();

      if ((data.elements || []).length > 0) {
        setError('No exact specialty match found. Showing general nearby doctors/clinics instead.');
      }
    }

    const mappedPlaces: CarePlace[] = (data.elements || [])
      .map((element: any, index: number) => {
        const elLat = element.lat ?? element.center?.lat;
        const elLon = element.lon ?? element.center?.lon;

        if (typeof elLat !== 'number' || typeof elLon !== 'number') {
          return null;
        }

        return {
          id: `${element.type}-${element.id}-${index}`,
          name: element.tags?.name || `Unnamed ${searchType}`,
          lat: elLat,
          lon: elLon,
          type:
            element.tags?.['healthcare:speciality'] ||
            element.tags?.amenity ||
            searchType,
          address: formatAddress(element.tags || {}),
        };
      })
      .filter(Boolean) as CarePlace[];

    setPlaces(mappedPlaces);

    if (mappedPlaces.length === 0) {
      setError('No nearby matching care providers found in the selected radius.');
    }
  } catch (err: any) {
    setError(err.message || 'Something went wrong while searching nearby care.');
  } finally {
    setLoading(false);
  }
};

  const openDirections = (place: CarePlace) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openInMap = (place: CarePlace) => {
    const url = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=16/${place.lat}/${place.lon}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nearby Hospital / Doctor Finder</h1>
          <p className="mt-2 text-slate-600">
            Find nearby hospitals, doctors, and clinics using OpenStreetMap.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Search Controls</h2>
          </CardHeader>

          <CardContent>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">Search Mode</label>
              <select value={searchMode} onChange={(e) => setSearchMode(e.target.value as any)} className="w-full rounded-xl border border-slate-300 px-4 py-3">
                <option value="manual">🔍 Manual Search</option>
                <option value="recommended">⭐ Recommended</option>
              </select>
            </div>

            {searchMode === 'recommended' && predictedDisease && (
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                <p className="text-sm font-medium text-teal-800">
                  Recommended nearby care for {predictedDisease}
                </p>
                <p className="mt-1 text-sm text-teal-700">
                  Searching for {searchType}
                  {specialty ? ` with specialty in ${specialty}` : ''}
                </p>
              </div>
            )}

            {searchMode === 'manual' && (
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Disease / Condition</label>
                  <input value={manualDisease} onChange={(e) => setManualDisease(e.target.value)} placeholder="e.g. migraine, chest pain" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Specialist Type</label>
                  <input value={manualSpecialty} onChange={(e) => setManualSpecialty(e.target.value)} placeholder="e.g. neurology, cardiology" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search Type
                </label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="hospital">Hospital</option>
                  <option value="doctor">Doctor</option>
                  <option value="clinic">Clinic</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Radius
                </label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value={2000}>2 km</option>
                  <option value={5000}>5 km</option>
                  <option value={10000}>10 km</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={getUserLocation}
                  className="w-full gap-2"
                  variant="outline"
                >
                  {locationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPinned className="h-4 w-4" />
                  )}
                  Use My Location
                </Button>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={searchNearbyPlaces}
                  className="w-full gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  Search Nearby
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Map View</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl">
              <MapContainer
                center={userLocation}
                zoom={zoom}
                scrollWheelZoom={true}
                style={{ height: '500px', width: '100%' }}
              >
                <MapUpdater center={userLocation} zoom={zoom} />

                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={userLocation} icon={userIcon}>
                  <Popup>Your current location</Popup>
                </Marker>

                <Circle
                  center={userLocation}
                  radius={radius}
                  pathOptions={{ color: '#0f766e', fillColor: '#14b8a6', fillOpacity: 0.12 }}
                />

                {places.map((place) => (
                  <Marker key={place.id} position={[place.lat, place.lon]} icon={placeIcon}>
                    <Popup>
                      <div className="space-y-2">
                        <p className="font-semibold">{place.name}</p>
                        <p className="text-sm">{place.address}</p>
                        <p className="text-xs capitalize text-slate-500">{place.type}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Nearby Results</h2>
          </CardHeader>
          <CardContent>
            {places.length === 0 ? (
              <p className="text-slate-500">
                No nearby results yet. Use your location and run a search.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {places.map((place) => (
                  <div
                    key={place.id}
                    className="rounded-2xl border border-slate-200 p-4 space-y-3"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{place.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{place.address}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                        {place.type}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => openInMap(place)}
                      >
                        <MapPinned className="h-4 w-4" />
                        Open in Map
                      </Button>

                      <Button
                        type="button"
                        className="gap-2"
                        onClick={() => openDirections(place)}
                      >
                        <Navigation className="h-4 w-4" />
                        Get Directions
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}