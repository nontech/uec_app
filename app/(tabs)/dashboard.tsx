import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Database } from '../../supabase/types';
import { LoadingView } from '../../components/common/LoadingView';
import { UserProfile } from '../../components/dashboard/UserProfile';
import { MealBalances } from '../../components/dashboard/MealBalances';

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

  if (loading) return <LoadingView message="Loading dashboard..." />;

  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <UserProfile
          userDetails={userDetails}
          company={company}
          membership={membership}
        />
        <MealBalances mealBalance={mealBalance} membership={membership} />
      </View>
    </View>
  );
}
