import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../supabase/types';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useTranslation } from 'react-i18next';

type Address = Database['public']['Tables']['addresses']['Row'];
type Company = Database['public']['Tables']['companies']['Row'] & {
  addresses?: Address;
};
type Membership = Database['public']['Tables']['memberships']['Row'];

const TIER_COLORS = {
  S: 'bg-[#7C3AED]',
  M: 'bg-[#2563EB]',
  L: 'bg-[#059669]',
};

export default function EmployerDashboard() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const { t } = useTranslation();

  const TIER_DESCRIPTIONS = {
    S: t('descriptions.premium_tier'),
    M: t('descriptions.advanced_tier'),
    L: t('descriptions.complete_tier'),
  };

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
      <View className='flex-1 items-center justify-center bg-white'>
        <Text className='text-gray-500 text-base'>Loading...</Text>
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
    <ScrollView className='flex-1 bg-white'>
      <View className='p-6'>
        {/* Company Section */}
        <View className='bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200'>
          <Text className='text-2xl font-bold text-gray-900 mb-2'>
            {company?.name}
          </Text>
          <Text className='text-base text-gray-600'>{formatAddress()}</Text>
        </View>

        {/* Memberships Section */}
        <View className='bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200'>
          <Text className='text-2xl font-semibold text-gray-900 mb-6'>
            {t('common.active')} {t('common.memberships')}
          </Text>
          <ScrollView
            className='max-h-[400px]'
            showsVerticalScrollIndicator={false}
          >
            <View>
              {memberships.map((membership, index) => (
                <View
                  key={membership.id}
                  className={`rounded-2xl p-6 shadow-sm ${
                    index > 0 ? 'mt-6' : ''
                  } ${
                    TIER_COLORS[
                      membership.plan_type as keyof typeof TIER_COLORS
                    ]
                  }`}
                >
                  <View className='flex-row justify-between items-center'>
                    <View className='flex-1 mr-4'>
                      <Text className='text-xl font-bold text-white mb-2'>
                        {t('common.tier')} {membership.plan_type}
                      </Text>
                      <Text className='text-base text-white/90'>
                        {
                          TIER_DESCRIPTIONS[
                            membership.plan_type as keyof typeof TIER_DESCRIPTIONS
                          ]
                        }
                      </Text>
                    </View>
                    <View className='bg-white/20 rounded-full p-3'>
                      <Ionicons name='star' size={28} color='#FFFFFF' />
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
