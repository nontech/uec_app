import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Database } from '../../supabase/types';
import { Svg, Circle } from 'react-native-svg';

type MealBalance = Database['public']['Tables']['meal_balances']['Row'];
type AppUser = Database['public']['Tables']['app_users']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type Membership = Database['public']['Tables']['memberships']['Row'];

export default function Dashboard() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mealBalance, setMealBalance] = useState<MealBalance | null>(null);
  const [userDetails, setUserDetails] = useState<AppUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const calculateWeeklyMeals = (
    startDate: string,
    endDate: string,
    remainingMeals: number,
    mealsPerWeek: number
  ) => {
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

    // Calculate total weeks in the period
    const totalWeeks = Math.ceil(
      (end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    // Calculate meals per week based on remaining meals and remaining weeks
    const remainingWeeks = Math.ceil(
      (end.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    // Return the minimum of mealsPerWeek and the calculated weekly meals
    return Math.min(mealsPerWeek, Math.floor(remainingMeals / remainingWeeks));
  };

  const calculateMonthlyMeals = (remainingMeals: number) => {
    return remainingMeals;
  };

  async function fetchUserData() {
    try {
      // Fetch user details with company
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('*, companies(*)')
        .eq('id', session?.user?.id)
        .single();

      if (userError) throw userError;
      if (userData) {
        setUserDetails(userData);
        setCompany(userData.companies);

        // Fetch membership for the company
        const { data: membershipData, error: membershipError } = await supabase
          .from('memberships')
          .select('*, meals_per_week')
          .eq('company_id', userData.company_id)
          .eq('status', 'active')
          .single();

        if (membershipError) throw membershipError;
        // @ts-ignore - meals_per_week exists in the database but not in types yet
        setMembership(membershipData);
      }

      // Fetch meal balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('meal_balances')
        .select('*')
        .eq('employee_id', session?.user?.id)
        .single();

      if (balanceError) throw balanceError;
      if (balanceData) {
        setMealBalance(balanceData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const CircularProgress = ({
    value,
    maxValue,
    size = 120,
    text,
  }: {
    value: number;
    maxValue: number;
    size?: number;
    text: string;
  }) => {
    const progress = (value / maxValue) * 100;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progressOffset = circumference - (progress / 100) * circumference;

    return (
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F3F0FF"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#6B4EFF"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
              {Math.floor(value)}
            </Text>
          </View>
        </View>
        <Text style={{ marginTop: 8, color: '#666' }}>{text}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

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
    <View className="flex-1 bg-white">
      {/* User Info Section */}
      <View className="p-6">
        <View className="flex-row items-center mb-6">
          <View className="w-16 h-16 bg-gray-200 rounded-full mr-4" />
          <View>
            <Text className="text-xl font-semibold">
              {userDetails?.first_name} {userDetails?.last_name}
            </Text>
            <Text className="text-gray-600">{userDetails?.company_email}</Text>
          </View>
        </View>

        {/* Company Info */}
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-gray-600">Company</Text>
          <Text className="text-lg">{company?.name}</Text>
        </View>

        {/* Membership Info */}
        {membership && (
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-gray-600">Membership</Text>
            <Text className="text-lg">Plan {membership.plan_type}</Text>
          </View>
        )}

        {/* Meals Section */}
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
      </View>
    </View>
  );
}
