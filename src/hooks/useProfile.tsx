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
          .maybeSingle();

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

  const isLocationInUserState = (lat: number, lng: number): boolean => {
    if (!profile || profile.location === 'United States') {
      return true; // Federal agencies see all photos
    }

    // Get approximate bounds for the user's state
    const stateCenter = getLocationCoordinates(profile.location);
    const stateBounds = getStateBounds(profile.location);
    
    return lat >= stateBounds.south && 
           lat <= stateBounds.north && 
           lng >= stateBounds.west && 
           lng <= stateBounds.east;
  };

  const getStateBounds = (location: string) => {
    // Approximate state bounds - in a real app, you'd use precise GeoJSON boundaries
    const stateBounds: Record<string, { north: number; south: number; east: number; west: number }> = {
      'Texas': { north: 36.5007, south: 25.8371, east: -93.5080, west: -106.6456 },
      'California': { north: 42.0095, south: 32.5343, east: -114.1312, west: -124.4096 },
      'Florida': { north: 31.0009, south: 24.5446, east: -80.0314, west: -87.6349 },
      'New York': { north: 45.0158, south: 40.4774, east: -71.7776, west: -79.7624 },
      'Alaska': { north: 71.5388, south: 51.2097, east: -129.9929, west: -179.1506 },
      'Pennsylvania': { north: 42.5147, south: 39.7198, east: -74.6895, west: -80.5190 },
      'Illinois': { north: 42.5083, south: 36.9540, east: -87.0199, west: -91.5130 },
      'Ohio': { north: 41.9773, south: 38.4031, east: -80.5190, west: -84.8203 },
      'Georgia': { north: 35.0008, south: 30.3176, east: -80.7014, west: -85.6051 },
      'North Carolina': { north: 36.5881, south: 33.7514, east: -75.3274, west: -84.3218 },
      'Michigan': { north: 48.2388, south: 41.6960, east: -82.1430, west: -90.4180 },
      'New Jersey': { north: 41.3574, south: 38.9284, east: -73.8935, west: -75.5594 },
      'Virginia': { north: 39.4660, south: 36.5407, east: -75.1652, west: -83.6753 },
      'Washington': { north: 49.0024, south: 45.5437, east: -116.9177, west: -124.8489 },
      'Arizona': { north: 37.0042, south: 31.3322, east: -109.0452, west: -114.8165 },
      'Massachusetts': { north: 42.8867, south: 41.2376, east: -69.8589, west: -73.5081 },
      'Tennessee': { north: 36.6781, south: 34.9829, east: -81.6469, west: -90.3103 },
      'Indiana': { north: 41.7606, south: 37.7717, east: -84.7844, west: -88.0978 },
      'Missouri': { north: 40.6136, south: 35.9957, east: -89.0988, west: -95.7742 },
      'Maryland': { north: 39.7237, south: 37.9113, east: -75.0487, west: -79.4877 },
      'Wisconsin': { north: 47.0774, south: 42.4919, east: -86.2494, west: -92.8891 },
      'Colorado': { north: 41.0034, south: 36.9949, east: -102.0424, west: -109.0489 },
      'Minnesota': { north: 49.3844, south: 43.4994, east: -89.4836, west: -97.2390 },
      'South Carolina': { north: 35.2155, south: 32.0346, east: -78.4850, west: -83.3532 },
      'Alabama': { north: 35.0080, south: 30.1955, east: -84.8880, west: -88.4731 },
      'Louisiana': { north: 33.0197, south: 28.9210, east: -88.8172, west: -94.0431 },
      'Kentucky': { north: 39.1472, south: 36.4970, east: -81.9648, west: -89.5715 },
      'Oregon': { north: 46.2991, south: 41.9918, east: -116.4635, west: -124.7034 },
      'Oklahoma': { north: 37.0020, south: 33.6323, east: -94.4312, west: -103.0025 },
      'Connecticut': { north: 42.0508, south: 40.9509, east: -71.7870, west: -73.7277 },
      'Utah': { north: 42.0013, south: 36.9979, east: -109.0452, west: -114.0524 },
      'Mississippi': { north: 35.0041, south: 30.1390, east: -88.0972, west: -91.6540 },
      'Arkansas': { north: 36.4996, south: 33.0041, east: -89.6444, west: -94.6178 },
      'Nevada': { north: 42.0022, south: 35.0018, east: -114.0396, west: -120.0057 },
      'Kansas': { north: 40.0031, south: 36.9932, east: -94.5888, west: -102.0517 },
      'New Mexico': { north: 37.0002, south: 31.3328, east: -103.0418, west: -109.0501 },
      'Nebraska': { north: 43.0017, south: 39.9999, east: -95.3080, west: -104.0573 },
      'West Virginia': { north: 40.6381, south: 37.2015, east: -77.7190, west: -82.6447 },
      'Idaho': { north: 49.0011, south: 41.9880, east: -111.0435, west: -117.2431 },
      'Hawaii': { north: 28.4318, south: 18.9117, east: -154.8066, west: -178.4438 },
      'New Hampshire': { north: 45.3058, south: 42.6970, east: -70.6103, west: -72.5570 },
      'Maine': { north: 47.4598, south: 43.0642, east: -66.9854, west: -71.0844 },
      'Montana': { north: 49.0011, south: 44.3583, east: -104.0573, west: -116.0636 },
      'Rhode Island': { north: 42.0188, south: 41.1460, east: -71.1205, west: -71.8965 },
      'Delaware': { north: 39.8394, south: 38.4510, east: -75.0489, west: -75.7888 },
      'South Dakota': { north: 45.9454, south: 42.4790, east: -96.4364, west: -104.0573 },
      'North Dakota': { north: 49.0011, south: 45.9354, east: -96.5543, west: -104.0489 },
      'Vermont': { north: 45.0155, south: 42.7269, east: -71.4653, west: -73.4379 },
      'Wyoming': { north: 45.0058, south: 40.9979, east: -104.0573, west: -111.0567 },
    };

    return stateBounds[location] || {
      north: 90, south: -90, east: 180, west: -180 // Default to show all if state not found
    };
  };

  return {
    profile,
    loading,
    getLocationCoordinates,
    getUserLocationCoordinates,
    isLocationInUserState,
    getStateBounds,
    US_STATE_COORDINATES,
  };
};