import { Tabs } from 'expo-router';
import { LandPlot as Home, Search, Video, MessageSquare, MessageCircle } from 'lucide-react-native';
import { Logo } from '../../components/Logo';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import { DEFAULT_PROFILE_PIC } from '@/constants/images';

type Profile = Database['public']['Tables']['profiles']['Row'];

function TabBarIcon({ Icon, focused }: { Icon: any; focused: boolean }) {
  return <Icon size={24} color={focused ? '#2D6A4F' : '#52796F'} />;
}

function LogoTitle() {
  return (
    <View style={styles.headerTitle}>
      <Logo size={28} />
      <Text style={styles.headerText}>fringe</Text>
    </View>
  );
}

export default function TabLayout() {
  const { session, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  if (loading) {
    return null;
  }

  if (!session) {
    router.replace('/sign-in');
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <LogoTitle />,
        headerRight: () => (
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Image 
              source={{ 
                uri: profile?.avatar_url || DEFAULT_PROFILE_PIC
              }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: '#fff',
        },
        tabBarActiveTintColor: '#2D6A4F',
        tabBarInactiveTintColor: '#52796F',
        tabBarStyle: {
          borderTopColor: '#E6E6E6',
          height: 60,
          paddingBottom: 2,
          paddingTop: 2,
          backgroundColor: '#fff',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabBarIcon Icon={Home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Find Coach',
          tabBarIcon: ({ focused }) => <TabBarIcon Icon={Search} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ focused }) => <TabBarIcon Icon={MessageSquare} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused }) => <TabBarIcon Icon={MessageCircle} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Videos',
          tabBarIcon: ({ focused }) => <TabBarIcon Icon={Video} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#1B4332',
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2D6A4F',
  },
});