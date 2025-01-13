import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../supabase/types';
import { Ionicons } from '@expo/vector-icons';

type Address = Database['public']['Tables']['addresses']['Row'];
type Company = Database['public']['Tables']['companies']['Row'] & {
  addresses?: Address;
};
type Membership = Database['public']['Tables']['memberships']['Row'];

const TIER_COLORS = {
  S: 'bg-purple-700',
  M: 'bg-blue-700',
  L: 'bg-green-700',
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
        // Fetch company details with address
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*, addresses(*)')
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

  const formatAddress = () => {
    if (!company?.addresses) return '';
    const addr = company.addresses;
    const parts = [
      addr.address,
      addr.city,
      addr.postal_code?.toString(),
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        {/* Company Section */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            {company?.name}
          </Text>
          <Text className="text-gray-600 text-base">{formatAddress()}</Text>
        </View>

        {/* Memberships Section */}
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-2xl font-semibold mb-6 text-gray-900">
            Active Memberships
          </Text>
          <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
            <View>
              {memberships.map((membership, index) => (
                <View
                  key={membership.id}
                  className={`rounded-2xl p-6 shadow-sm ${
                    TIER_COLORS[
                      membership.plan_type as keyof typeof TIER_COLORS
                    ]
                  } ${index > 0 ? 'mt-6' : ''}`}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1 mr-4">
                      <Text className="text-white text-xl font-bold mb-2">
                        Tier {membership.plan_type}
                      </Text>
                      <Text className="text-white text-base">
                        {
                          TIER_DESCRIPTIONS[
                            membership.plan_type as keyof typeof TIER_DESCRIPTIONS
                          ]
                        }
                      </Text>
                    </View>
                    <View className="bg-white/30 rounded-full p-3">
                      <Ionicons name="star" size={28} color="white" />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}
