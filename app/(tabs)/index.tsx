import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Calendar, Star, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import { DEFAULT_PROFILE_PIC } from '@/constants/images';
import { DailySwingThought } from '@/components/DailySwingThought';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function Home() {
  const { session } = useAuth();
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

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>
            Welcome back, {profile ? getFirstName(profile.full_name) : 'there'}!
          </Text>
          <Text style={styles.subtitle}>Ready for your next lesson?</Text>
        </View>
        <Image 
          source={{ 
            uri: profile?.avatar_url || DEFAULT_PROFILE_PIC
          }}
          style={styles.profileImage}
        />
      </View>

      <DailySwingThought />

      <View style={styles.nextLesson}>
        <View style={styles.lessonHeader}>
          <Calendar size={20} color="#2D6A4F" />
          <Text style={styles.lessonTitle}>Next Lesson</Text>
        </View>
        <TouchableOpacity style={styles.lessonCard}>
          <View>
            <Text style={styles.lessonTime}>Today, 2:00 PM</Text>
            <Text style={styles.lessonCoach}>with Coach Mike</Text>
            <Text style={styles.lessonType}>Swing Analysis</Text>
          </View>
          <ArrowRight size={20} color="#2D6A4F" />
        </TouchableOpacity>
      </View>

      <View style={styles.featuredCoaches}>
        <Text style={styles.sectionTitle}>Featured Coaches</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coachList}>
          {[
            {
              id: '1',
              name: 'Sarah Chen',
              specialty: 'Putting Expert',
              rating: 4.9,
              image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&fit=crop',
            },
            {
              id: '2',
              name: 'Mike Johnson',
              specialty: 'Swing Analysis',
              rating: 4.8,
              image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&fit=crop',
            },
            {
              id: '3',
              name: 'Emma Wilson',
              specialty: 'Short Game',
              rating: 5.0,
              image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&fit=crop',
            },
          ].map((coach) => (
            <Link href={`/coach/${coach.id}`} key={coach.id} asChild>
              <TouchableOpacity style={styles.coachCard}>
                <Image source={{ uri: coach.image }} style={styles.coachImage} />
                <View style={styles.coachInfo}>
                  <Text style={styles.coachName}>{coach.name}</Text>
                  <Text style={styles.coachSpecialty}>{coach.specialty}</Text>
                  <View style={styles.ratingContainer}>
                    <Star size={16} color="#2D6A4F" fill="#2D6A4F" />
                    <Text style={styles.rating}>{coach.rating}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          ))}
        </ScrollView>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {[
            { title: 'Book Lesson', icon: Calendar, href: '/search' },
            { title: 'View Progress', icon: Star, href: '/profile' },
          ].map((action, index) => (
            <Link key={index} href={action.href} asChild>
              <TouchableOpacity style={styles.actionCard}>
                <action.icon size={24} color="#2D6A4F" />
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
  },
  welcomeSection: {
    flex: 1,
  },
  greeting: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1B4332',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#52796F',
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2D6A4F',
  },
  nextLesson: {
    padding: 20,
    paddingTop: 0,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  lessonTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1B4332',
  },
  lessonCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  lessonTime: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1B4332',
    marginBottom: 4,
  },
  lessonCoach: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
    marginBottom: 2,
  },
  lessonType: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
  },
  featuredCoaches: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1B4332',
    marginBottom: 16,
  },
  coachList: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  coachCard: {
    width: 160,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    overflow: 'hidden',
  },
  coachImage: {
    width: '100%',
    height: 160,
  },
  coachInfo: {
    padding: 12,
  },
  coachName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1B4332',
    marginBottom: 4,
  },
  coachSpecialty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#2D6A4F',
  },
  quickActions: {
    padding: 20,
    paddingTop: 0,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  actionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1B4332',
    textAlign: 'center',
  },
});