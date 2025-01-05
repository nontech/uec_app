import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../supabase/types';

type Company = Database['public']['Tables']['companies']['Row'];
type Membership = Database['public']['Tables']['memberships']['Row'];

export default function EmployerDashboard() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      // Fetch employer's company data
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('company_id')
        .eq('id', session?.user?.id)
        .single();

      if (userError) throw userError;

      if (userData?.company_id) {
        // Fetch company details
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single();

        if (companyError) throw companyError;
        setCompany(companyData);

        // Fetch membership details
        const { data: membershipData, error: membershipError } = await supabase
          .from('memberships')
          .select('*')
          .eq('company_id', userData.company_id)
          .eq('status', 'active')
          .single();

        if (membershipError) throw membershipError;
        setMembership(membershipData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      <View className="p-6">
        <Text className="text-3xl font-bold mb-8">{company?.name}</Text>

        {/* Plan Details Card */}
        <View className="bg-blue-500 rounded-3xl p-8 mb-8">
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-3xl text-black font-semibold">
              Each Employee
            </Text>
            <Text className="text-xl text-white">
              Plan {membership?.plan_type}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
