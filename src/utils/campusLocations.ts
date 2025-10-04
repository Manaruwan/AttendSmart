// Campus location configuration
export const CAMPUS_LOCATIONS = {
  'main-campus': {
    id: 'main-campus',
    name: 'Main Campus',
    center: {
      lat: 6.897664,  // User's actual location from Firebase
      lng: 80.599450
    },
    radius: 1000, // meters - increased to 1km radius
    address: 'University Main Campus',
    allowedHours: {
      start: '00:00', // Allow 24/7 for now
      end: '23:59'
    }
  },
  'secondary-campus': {
    id: 'secondary-campus', 
    name: 'Secondary Campus',
    center: {
      lat: 6.897664,
      lng: 80.599450
    },
    radius: 1000,
    address: 'University Secondary Campus',
    allowedHours: {
      start: '00:00',
      end: '23:59'
    }
  }
};

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Check if a location is within campus boundaries
export const isWithinCampus = (
  userLat: number, 
  userLng: number, 
  campusId: keyof typeof CAMPUS_LOCATIONS = 'main-campus'
): boolean => {
  const campus = CAMPUS_LOCATIONS[campusId];
  if (!campus) return false;

  const distance = calculateDistance(
    userLat, 
    userLng, 
    campus.center.lat, 
    campus.center.lng
  );

  return distance <= campus.radius;
};

// Check if current time is within allowed hours
export const isWithinAllowedHours = (
  campusId: keyof typeof CAMPUS_LOCATIONS = 'main-campus'
): boolean => {
  const campus = CAMPUS_LOCATIONS[campusId];
  if (!campus) return false;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  return currentTime >= campus.allowedHours.start && 
         currentTime <= campus.allowedHours.end;
};

// Get campus information
export const getCampusInfo = (campusId: keyof typeof CAMPUS_LOCATIONS) => {
  return CAMPUS_LOCATIONS[campusId];
};

// Get all campus locations
export const getAllCampuses = () => {
  return Object.values(CAMPUS_LOCATIONS);
};

// Dynamic campus location based on user registration
export const getDynamicCampusLocation = (userLat?: number, userLng?: number) => {
  if (userLat && userLng) {
    return {
      id: 'user-campus',
      name: 'Your Campus Location',
      center: {
        lat: userLat,
        lng: userLng
      },
      radius: 1000, // 1km radius
      address: 'Registered Campus Location',
      allowedHours: {
        start: '00:00',
        end: '23:59'
      }
    };
  }
  return CAMPUS_LOCATIONS['main-campus'];
};

// Check if a location is within user's registered campus
export const isWithinUserCampus = (
  userLat: number, 
  userLng: number, 
  registeredLat?: number,
  registeredLng?: number
): boolean => {
  if (!registeredLat || !registeredLng) {
    // Fallback to main campus if no registration location
    return isWithinCampus(userLat, userLng, 'main-campus');
  }

  const distance = calculateDistance(
    userLat, 
    userLng, 
    registeredLat, 
    registeredLng
  );

  return distance <= 1000; // 1km radius
};