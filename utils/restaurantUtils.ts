// Utility functions for restaurant operations

export const getDistance = (id: string): string => {
  const distances: Record<string, string> = {
    '1': '10min',
    '2': '12min',
    '3': '10min',
  };
  return distances[id] || '15min';
};

export const formatOpeningHours = (hours: string | null): string => {
  return hours || '9 am - 5 pm';
};
