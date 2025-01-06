import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../supabase/types';
import { Ionicons } from '@expo/vector-icons';

type Company = Database['public']['Tables']['companies']['Row'];
type Membership = Database['public']['Tables']['memberships']['Row'];

const TIER_COLORS = {
  S: 'bg-purple-500',
  M: 'bg-blue-500',
  L: 'bg-green-500',
};

const TIER_DESCRIPTIONS = {
  S: 'Premium tier with access to exclusive S-tier restaurants',
  M: 'Advanced tier with access to S and M-tier restaurants',
  L: 'Complete tier with access to all restaurant tiers',
};

export default function EmployerDashboard() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);

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

        // Fetch all active memberships
        const { data: membershipsData, error: membershipsError } =
          await supabase
            .from('memberships')
            .select('*')
            .eq('company_id', userData.company_id)
            .eq('status', 'active')
            .order('plan_type');

        if (membershipsError) throw membershipsError;
        setMemberships(membershipsData || []);
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

        {/* Memberships Section */}
        <Text className="text-2xl font-semibold mb-4">Active Memberships</Text>
        <View className="space-y-4">
          {memberships.map((membership) => (
            <View
              key={membership.id}
              className={`rounded-3xl p-6 ${
                TIER_COLORS[membership.plan_type as keyof typeof TIER_COLORS]
              }`}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1 mr-4">
                  <Text className="text-white text-lg font-semibold">
                    Tier {membership.plan_type}
                  </Text>
                  <Text className="text-white opacity-80 mt-1">
                    {
                      TIER_DESCRIPTIONS[
                        membership.plan_type as keyof typeof TIER_DESCRIPTIONS
                      ]
                    }
                  </Text>
                </View>
                <View className="bg-white/20 rounded-full p-2">
                  <Ionicons name="star" size={24} color="white" />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
