import { View, Text, ScrollView, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Database } from '../../supabase/types';
import { Svg, Circle } from 'react-native-svg';
import Colors from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const PLAN_COLORS = {
  S: 'bg-[#7C3AED]',
  M: 'bg-[#2563EB]',
  L: 'bg-[#059669]',
};

type AppUser = Database['public']['Tables']['app_users']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type Membership = Database['public']['Tables']['memberships']['Row'];

type UserWithDetails = AppUser & {
  companies?: Company;
  memberships?: Membership;
};

export default function Dashboard() {
  const { t } = useTranslation();
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
              stroke='#EDE9FE'
              strokeWidth={strokeWidth}
              fill='transparent'
            />
            {/* Progress circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke='#6B4EFF'
              strokeWidth={strokeWidth}
              fill='transparent'
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={progressOffset}
              strokeLinecap='round'
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
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#1F2937',
              }}
            >
              {Math.floor(value)}
            </Text>
          </View>
        </View>
        <Text style={{ marginTop: 8, color: '#6B7280' }}>{text}</Text>
      </View>
    );
  };

  const Card = ({ children }: { children: React.ReactNode }) => (
    <View className='bg-white rounded-2xl p-6 shadow-sm mb-4 border border-[#E0E0E0]'>
      {children}
    </View>
  );

  if (loading) {
    return (
      <View className='flex-1 items-center justify-center'>
        <Text>{t('common.loading')}</Text>
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
    <ScrollView className='flex-1 bg-white'>
      <View className='p-4'>
        {/* Profile Card */}
        <Card>
          <View className='flex-row items-center'>
            <View className='w-16 h-16 bg-[#6B4EFF] rounded-full mr-4 items-center justify-center'>
              <Text className='text-white text-2xl font-semibold'>
                {userDetails?.first_name?.[0]?.toUpperCase() || ''}
              </Text>
            </View>
            <View>
              <Text className='text-gray-900 text-xl font-semibold'>
                {userDetails?.first_name} {userDetails?.last_name}
              </Text>
              <Text className='text-gray-600'>{userDetails?.email}</Text>
            </View>
          </View>
        </Card>

        {/* Company & Membership Info Card */}
        <Card>
          <View className='space-y-4'>
            <View className='flex-row justify-between items-center pb-4 border-b border-gray-200'>
              <Text className='text-gray-600 font-medium'>
                {t('common.company')}
              </Text>
              <Text className='text-gray-900 font-semibold'>
                {company?.name}
              </Text>
            </View>
            {membership && (
              <View className='flex-row justify-between items-center'>
                <Text className='text-gray-600 font-medium'>
                  {t('common.membership')}
                </Text>
                <View
                  className={`${
                    PLAN_COLORS[
                      membership.plan_type as keyof typeof PLAN_COLORS
                    ] || 'bg-gray-200'
                  } px-3 py-1 rounded-full`}
                >
                  <Text className='text-white font-medium'>
                    {t('common.plan')} {membership.plan_type}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Meals Progress Card */}
        <Card>
          <Text className='text-gray-900 text-xl font-semibold mb-6'>
            Meals Remaining
          </Text>
          <View className='items-center'>
            <CircularProgress
              value={weeklyMeals}
              maxValue={userDetails?.meals_per_week || 0}
              text={`${t('common.this')} ${t('common.week')}`}
            />
            <View className='mt-6 border border-[#3C3C3E] px-4 py-3 rounded-lg'>
              <Text className='text-[#3C3C3E] text-center'>
                {weeklyMeals} {t('common.of')} {userDetails?.meals_per_week}{' '}
                {t('dashboard.meals')} {t('common.available')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Actions Card */}
        <Card>
          <Text className='text-gray-900 text-xl font-semibold mb-6'>
            Quick Actions
          </Text>

          {/* AI Meal Planning Button */}
          <Pressable
            className='flex-row items-center bg-[#F5F3FF] p-4 rounded-xl mb-3 border border-[#DDD6FE]'
            onPress={() => {
              console.log('AI Meal Planning pressed');
            }}
          >
            <View className='w-10 h-10 bg-[#7C3AED] rounded-lg items-center justify-center mr-4'>
              <MaterialIcons name='restaurant' size={20} color='#ffffff' />
            </View>
            <View className='flex-1'>
              <Text className='text-gray-900 font-semibold text-lg'>
                Allow AI to plan your meals
              </Text>
              <Text className='text-gray-600 text-sm mt-1'>
                Get personalized meal recommendations
              </Text>
            </View>
            <MaterialIcons name='chevron-right' size={24} color='#7C3AED' />
          </Pressable>

          {/* Transfer Lunch Button */}
          <Pressable
            className='flex-row items-center bg-[#EFF6FF] p-4 rounded-xl mb-3 border border-[#BFDBFE]'
            onPress={() => {
              console.log('Transfer Lunch pressed');
            }}
          >
            <View className='w-10 h-10 bg-[#2563EB] rounded-lg items-center justify-center mr-4'>
              <MaterialIcons name='swap-horiz' size={20} color='#ffffff' />
            </View>
            <View className='flex-1'>
              <Text className='text-gray-900 font-semibold text-lg'>
                Transfer a lunch to a colleague
              </Text>
              <Text className='text-gray-600 text-sm mt-1'>
                Share your meal with team members
              </Text>
            </View>
            <MaterialIcons name='chevron-right' size={24} color='#2563EB' />
          </Pressable>

          {/* Create Private Group Button */}
          <Pressable
            className='flex-row items-center bg-[#ECFDF5] p-4 rounded-xl border border-[#A7F3D0]'
            onPress={() => {
              console.log('Create Group pressed');
            }}
          >
            <View className='w-10 h-10 bg-[#059669] rounded-lg items-center justify-center mr-4'>
              <MaterialIcons name='group-add' size={20} color='#ffffff' />
            </View>
            <View className='flex-1'>
              <Text className='text-gray-900 font-semibold text-lg'>
                Create your own private group
              </Text>
              <Text className='text-gray-600 text-sm mt-1'>
                Organize lunch with friends
              </Text>
            </View>
            <MaterialIcons name='chevron-right' size={24} color='#059669' />
          </Pressable>
        </Card>
      </View>
    </ScrollView>
  );
}
