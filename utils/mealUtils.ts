// Utility functions for meal calculations

export const calculateWeeklyMeals = (
  startDate: string,
  endDate: string,
  remainingMeals: number,
  mealsPerWeek: number
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  // Get the start of the current week (Monday)
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(
    today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
  );
  currentWeekStart.setHours(0, 0, 0, 0);

  // Get the end of the current week (Sunday)
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  // If the current week is not within the meal balance period, return 0
  if (currentWeekEnd < start || currentWeekStart > end) {
    return 0;
  }

  // Calculate remaining weeks
  const remainingWeeks = Math.ceil(
    (end.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  // Return the minimum of mealsPerWeek and the calculated weekly meals
  return Math.min(mealsPerWeek, Math.floor(remainingMeals / remainingWeeks));
};

export const calculateMonthlyMeals = (remainingMeals: number): number => {
  return remainingMeals;
};
