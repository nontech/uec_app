import React from 'react';
import { View, Text } from 'react-native';
import { CircularProgress } from './CircularProgress';
import { Database } from '../../supabase/types';
import {
  calculateWeeklyMeals,
  calculateMonthlyMeals,
} from '../../utils/mealUtils';

interface MealBalancesProps {
  mealBalance: Database['public']['Tables']['meal_balances']['Row'] | null;
  membership: Database['public']['Tables']['memberships']['Row'] | null;
}

export const MealBalances = ({
  mealBalance,
  membership,
}: MealBalancesProps) => {
  const weeklyMeals =
    mealBalance?.start_date &&
    mealBalance?.end_date &&
    mealBalance?.remaining_meals
      ? calculateWeeklyMeals(
          mealBalance.start_date,
          mealBalance.end_date,
          mealBalance.remaining_meals,
          // @ts-ignore - meals_per_week exists in the database but not in types yet
          membership?.meals_per_week || 2
        )
      : 0;

  const monthlyMeals = mealBalance?.remaining_meals
    ? calculateMonthlyMeals(mealBalance.remaining_meals)
    : 0;

  return (
    <View className="mt-8">
      <Text className="text-xl font-semibold mb-6">Meals Remaining</Text>
      <View className="flex-row justify-around">
        <CircularProgress
          value={weeklyMeals}
          maxValue={membership?.meals_per_week || 2}
          text="This week"
        />
        <CircularProgress
          value={monthlyMeals}
          maxValue={(membership?.meals_per_week || 2) * 4}
          text="In December"
        />
      </View>
    </View>
  );
};
