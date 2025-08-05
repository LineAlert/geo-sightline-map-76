import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  user_id: string;
  location: string;
  created_at: string;
  updated_at: string;
}

interface StateCoordinates {
  lat: number;
  lng: number;
  zoom: number;
}

const US_STATE_COORDINATES: Record<string, StateCoordinates> = {
  'United States': { lat: 39.8283, lng: -98.5795, zoom: 4 },
  'Alabama': { lat: 32.806671, lng: -86.79113, zoom: 7 },
  'Alaska': { lat: 61.570716, lng: -152.404419, zoom: 5 },
  'Arizona': { lat: 33.729759, lng: -111.431221, zoom: 7 },
  'Arkansas': { lat: 34.969704, lng: -92.373123, zoom: 7 },
  'California': { lat: 36.116203, lng: -119.681564, zoom: 6 },
  'Colorado': { lat: 39.059811, lng: -105.311104, zoom: 7 },
  'Connecticut': { lat: 41.597782, lng: -72.755371, zoom: 8 },
  'Delaware': { lat: 39.318523, lng: -75.507141, zoom: 9 },
  'Florida': { lat: 27.766279, lng: -81.686783, zoom: 7 },
  'Georgia': { lat: 33.040619, lng: -83.643074, zoom: 7 },
  'Hawaii': { lat: 21.094318, lng: -157.498337, zoom: 7 },
  'Idaho': { lat: 44.240459, lng: -114.478828, zoom: 6 },
  'Illinois': { lat: 40.349457, lng: -88.986137, zoom: 7 },
  'Indiana': { lat: 39.849426, lng: -86.258278, zoom: 7 },
  'Iowa': { lat: 42.011539, lng: -93.210526, zoom: 7 },
  'Kansas': { lat: 38.5266, lng: -96.726486, zoom: 7 },
  'Kentucky': { lat: 37.668140, lng: -84.670067, zoom: 7 },
  'Louisiana': { lat: 31.169546, lng: -91.867805, zoom: 7 },
  'Maine': { lat: 44.693947, lng: -69.381927, zoom: 7 },
  'Maryland': { lat: 39.063946, lng: -76.802101, zoom: 8 },
  'Massachusetts': { lat: 42.230171, lng: -71.530106, zoom: 8 },
  'Michigan': { lat: 43.326618, lng: -84.536095, zoom: 7 },
  'Minnesota': { lat: 45.694454, lng: -93.900192, zoom: 7 },
  'Mississippi': { lat: 32.741646, lng: -89.678696, zoom: 7 },
  'Missouri': { lat: 38.456085, lng: -92.288368, zoom: 7 },
  'Montana': { lat: 47.052952, lng: -110.454353, zoom: 6 },
  'Nebraska': { lat: 41.12537, lng: -98.268082, zoom: 7 },
  'Nevada': { lat: 37.881212, lng: -117.220068, zoom: 6 },
  'New Hampshire': { lat: 43.452492, lng: -71.563896, zoom: 8 },
  'New Jersey': { lat: 40.298904, lng: -74.756138, zoom: 8 },
  'New Mexico': { lat: 34.307144, lng: -106.018066, zoom: 7 },
  'New York': { lat: 42.165726, lng: -74.948051, zoom: 7 },
  'North Carolina': { lat: 35.630066, lng: -79.806419, zoom: 7 },
  'North Dakota': { lat: 47.528912, lng: -99.784012, zoom: 7 },
  'Ohio': { lat: 40.388783, lng: -82.764915, zoom: 7 },
  'Oklahoma': { lat: 35.565342, lng: -96.928917, zoom: 7 },
  'Oregon': { lat: 44.931109, lng: -123.029159, zoom: 7 },
  'Pennsylvania': { lat: 40.590752, lng: -77.209755, zoom: 7 },
  'Rhode Island': { lat: 41.680893, lng: -71.51178, zoom: 9 },
  'South Carolina': { lat: 33.856892, lng: -80.945007, zoom: 7 },
  'South Dakota': { lat: 44.299782, lng: -99.438828, zoom: 7 },
  'Tennessee': { lat: 35.747845, lng: -86.692345, zoom: 7 },
  'Texas': { lat: 31.054487, lng: -97.563461, zoom: 6 },
  'Utah': { lat: 40.150032, lng: -111.862434, zoom: 7 },
  'Vermont': { lat: 44.045876, lng: -72.710686, zoom: 8 },
  'Virginia': { lat: 37.769337, lng: -78.169968, zoom: 7 },
  'Washington': { lat: 47.400902, lng: -121.490494, zoom: 7 },
  'West Virginia': { lat: 38.491226, lng: -80.954453, zoom: 8 },
  'Wisconsin': { lat: 44.268543, lng: -89.616508, zoom: 7 },
  'Wyoming': { lat: 42.755966, lng: -107.302490, zoom: 7 },
};

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const getLocationCoordinates = (location: string): StateCoordinates => {
    return US_STATE_COORDINATES[location] || US_STATE_COORDINATES['United States'];
  };

  const getUserLocationCoordinates = (): StateCoordinates => {
    if (!profile) return US_STATE_COORDINATES['United States'];
    return getLocationCoordinates(profile.location);
  };

  return {
    profile,
    loading,
    getLocationCoordinates,
    getUserLocationCoordinates,
    US_STATE_COORDINATES,
  };
};