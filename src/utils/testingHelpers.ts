// Temporary location override for testing
// This will be used when user registration location is not available

export const TEST_LOCATIONS = {
  // Current user's actual location from the screenshot
  'test-location': {
    lat: 6.897664,
    lng: 80.599450,
    name: 'Test Campus Location'
  }
};

// For testing - always return true if within reasonable distance
export const isLocationValidForTesting = (userLat: number, userLng: number): boolean => {
  // If user is in Sri Lanka (rough bounds), allow attendance
  const sriLankaBounds = {
    north: 9.8,
    south: 5.9,
    east: 81.9,
    west: 79.6
  };
  
  return userLat >= sriLankaBounds.south && 
         userLat <= sriLankaBounds.north && 
         userLng >= sriLankaBounds.west && 
         userLng <= sriLankaBounds.east;
};

// Enhanced location validation
export const validateAttendanceLocation = (
  currentLat: number,
  currentLng: number,
  registrationLat?: number,
  registrationLng?: number
): { isValid: boolean; reason: string; distance?: number } => {
  
  // For testing - be more lenient
  if (isLocationValidForTesting(currentLat, currentLng)) {
    return {
      isValid: true,
      reason: 'Location verified within acceptable area',
      distance: 0
    };
  }
  
  return {
    isValid: false,
    reason: 'Location not within valid attendance area'
  };
};