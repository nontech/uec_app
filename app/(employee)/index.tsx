import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Database } from '../../supabase/types';
import { Svg, Circle } from 'react-native-svg';

type AppUser = Database['public']['Tables']['app_users']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type Membership = Database['public']['Tables']['memberships']['Row'];

type UserWithDetails = AppUser & {
  companies?: Company;
  memberships?: Membership;
};

export default function Dashboard() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserWithDetails | null>(null);
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

    // Get the end of the current week (Friday)
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 4); // +4 to get to Friday
    currentWeekEnd.setHours(23, 59, 59, 999);

    // If the current week is not within the membership period, return 0
    if (currentWeekEnd < start || currentWeekStart > end) {
      return 0;
    }

    // Calculate remaining working days in the week
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // If it's weekend, return 0
    if (isWeekend) {
      return 0;
    }

    // Calculate remaining days (including current day)
    const remainingDays =
      dayOfWeek >= 1 && dayOfWeek <= 5 ? 5 - dayOfWeek + 1 : 0;

    // Return the minimum between meals_per_week and remaining days
    return Math.min(mealsPerWeek, remainingDays);
  };

  const getCurrentMonthName = () => {
    return new Date().toLocaleString('default', { month: 'long' });
  };

  async function fetchUserData() {
    try {
      // Fetch user details with company and membership
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('*, companies(*), memberships(*)')
        .eq('id', session?.user?.id)
        .single();

      if (userError) throw userError;
      if (userData) {
        setUserDetails(userData);
        setCompany(userData.companies);
        setMembership(userData.memberships);
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

  const Card = ({ children }: { children: React.ReactNode }) => (
    <View className="bg-white rounded-2xl p-6 shadow-sm mb-4 border border-gray-100">
      {children}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-600">Loading...</Text>
      </View>
    );
  }

  const weeklyMeals =
    membership?.start_date &&
    membership?.end_date &&
    userDetails?.meals_per_week
      ? calculateWeeklyMeals(
          membership.start_date,
          membership.end_date,
          userDetails.meals_per_week
        )
      : 0;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Profile Card */}
        <Card>
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-[#6B4EFF] rounded-full mr-4 items-center justify-center">
              <Text className="text-white text-2xl font-semibold">
                {userDetails?.first_name?.[0]?.toUpperCase() || ''}
              </Text>
            </View>
            <View>
              <Text className="text-xl font-semibold text-gray-900">
                {userDetails?.first_name} {userDetails?.last_name}
              </Text>
              <Text className="text-gray-500">{userDetails?.email}</Text>
            </View>
          </View>
        </Card>

        {/* Company & Membership Info Card */}
        <Card>
          <View className="space-y-4">
            <View className="flex-row justify-between items-center pb-4 border-b border-gray-100">
              <Text className="text-gray-500 font-medium">Company</Text>
              <Text className="text-gray-900 font-semibold">
                {company?.name}
              </Text>
            </View>
            {membership && (
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-500 font-medium">Membership</Text>
                <View className="bg-purple-100 px-3 py-1 rounded-full">
                  <Text className="text-purple-700 font-medium">
                    Plan {membership.plan_type}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Meals Progress Card */}
        <Card>
          <Text className="text-xl font-semibold text-gray-900 mb-6">
            Meals Remaining
          </Text>
          <View className="items-center">
            <CircularProgress
              value={weeklyMeals}
              maxValue={userDetails?.meals_per_week || 0}
              text="This week"
              size={160}
            />
            <View className="mt-6 bg-purple-50 px-4 py-3 rounded-lg">
              <Text className="text-purple-700 text-center">
                {weeklyMeals} of {userDetails?.meals_per_week} meals available
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
