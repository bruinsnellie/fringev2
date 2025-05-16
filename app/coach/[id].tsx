import { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { ArrowLeft, Star, Calendar, Clock, MapPin, Award, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/types/supabase';
import { DEFAULT_PROFILE_PIC } from '@/constants/images';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function CoachProfile() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const [coach, setCoach] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<{
    name: string;
    duration: number;
    price: number;
  } | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  useState(() => {
    fetchCoachProfile();
  }, [id]);

  const fetchCoachProfile = async () => {
    if (!id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setCoach(data);
    } catch (err) {
      console.error('Error fetching coach:', err);
      setError('Failed to load coach profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookLesson = async () => {
    if (!session?.user || !coach || !selectedLesson) return;

    setIsBooking(true);
    setError('');

    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          student_id: session.user.id,
          coach_id: coach.id,
          date: new Date().toISOString(), // This should be selected by the user
          duration: selectedLesson.duration,
          lesson_type: selectedLesson.name,
          price: selectedLesson.price,
        });

      if (bookingError) throw bookingError;

      router.push('/(tabs)');
    } catch (err) {
      console.error('Error booking lesson:', err);
      setError('Failed to book lesson');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  if (!coach) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Coach not found'}</Text>
      </View>
    );
  }

  const lessonTypes = [
    { name: 'Single Lesson', duration: 60, price: 85 },
    { name: '5 Lesson Package', duration: 60, price: 375 },
    { name: 'Playing Lesson', duration: 120, price: 150 },
  ];

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.header}>
        <Image 
          source={{ 
            uri: coach.avatar_url || DEFAULT_PROFILE_PIC
          }} 
          style={styles.coverImage} 
        />
        <View style={styles.profileInfo}>
          <Image 
            source={{ 
              uri: coach.avatar_url || DEFAULT_PROFILE_PIC
            }} 
            style={styles.profileImage} 
          />
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{coach.full_name}</Text>
            <Text style={styles.specialty}>{coach.specialty || 'Golf Pro'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Star size={20} color="#2D6A4F" />
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>(128 reviews)</Text>
          </View>
          <View style={styles.stat}>
            <Clock size={20} color="#2D6A4F" />
            <Text style={styles.statValue}>{coach.experience_years || '15'}+ years</Text>
          </View>
          <View style={styles.stat}>
            <MapPin size={20} color="#2D6A4F" />
            <Text style={styles.statValue}>{coach.location || 'San Francisco, CA'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{coach.bio || 'PGA certified instructor specializing in putting and short game improvement. I\'ve helped players of all skill levels achieve their goals through personalized coaching and data-driven analysis.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <View style={styles.certifications}>
            {['PGA Class A Professional', 'TPI Certified', 'TrackMan Certified'].map((cert, index) => (
              <View key={index} style={styles.certification}>
                <Award size={16} color="#2D6A4F" />
                <Text style={styles.certificationText}>{cert}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lesson Types</Text>
          {lessonTypes.map((lesson, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.lessonType}
              onPress={() => {
                setSelectedLesson(lesson);
                setShowBookingModal(true);
              }}
            >
              <View>
                <Text style={styles.lessonName}>{lesson.name}</Text>
                <Text style={styles.lessonDuration}>{lesson.duration} minutes</Text>
              </View>
              <View style={styles.bookButton}>
                <Text style={styles.bookButtonText}>${lesson.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowBookingModal(false)}
            >
              <X size={24} color="#52796F" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Book Lesson</Text>
            {selectedLesson && (
              <>
                <View style={styles.lessonDetails}>
                  <Text style={styles.lessonDetailTitle}>{selectedLesson.name}</Text>
                  <Text style={styles.lessonDetailText}>
                    Duration: {selectedLesson.duration} minutes
                  </Text>
                  <Text style={styles.lessonDetailPrice}>
                    ${selectedLesson.price}
                  </Text>
                </View>

                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}

                <TouchableOpacity 
                  style={[styles.confirmButton, isBooking && styles.buttonDisabled]}
                  onPress={handleBookLesson}
                  disabled={isBooking}
                >
                  {isBooking ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Calendar size={20} color="#fff" />
                      <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    color: '#E63946',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
  },
  header: {
    height: 300,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    marginTop: -60,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  nameContainer: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1B4332',
  },
  specialty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#52796F',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1B4332',
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1B4332',
    marginBottom: 12,
  },
  bio: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#52796F',
    lineHeight: 24,
  },
  certifications: {
    gap: 8,
  },
  certification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  certificationText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1B4332',
  },
  lessonType: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  lessonName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1B4332',
  },
  lessonDuration: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#2D6A4F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  closeButton: {
    position: 'absolute',
    right: 24,
    top: 24,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1B4332',
    marginBottom: 24,
  },
  lessonDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  lessonDetailTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1B4332',
    marginBottom: 8,
  },
  lessonDetailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#52796F',
    marginBottom: 4,
  },
  lessonDetailPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#2D6A4F',
    marginTop: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#2D6A4F',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});