import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { Settings, Award, Clock, Star, ChevronRight, LogOut, Calendar, X, Camera } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { DEFAULT_PROFILE_PIC } from '@/constants/images';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

export default function ProfileScreen() {
  const { session, signOut, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    console.log('Profile component mounted');
    console.log('Loading state:', loading);
    console.log('Session state:', session);
    console.log('Session user:', session?.user);
    
    if (loading) {
      console.log('Still loading, returning early');
      return;
    }
    
    if (!session?.user) {
      console.log('No session, redirecting to sign-in');
      setTimeout(() => {
        router.replace('/sign-in');
      }, 0);
      return;
    }

    console.log('Fetching profile and bookings');
    fetchProfile();
    fetchBookings();
  }, [session, loading]);

  const fetchProfile = async () => {
    console.log('Fetching profile for user:', session?.user?.id);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      console.log('Profile fetched successfully:', data);
      setProfile(data);
      setEditedProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          coach:profiles!bookings_coach_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('student_id', session?.user?.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const handleSave = async () => {
    if (!profile || !editedProfile) return;

    setIsSaving(true);
    setError('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          handicap: editedProfile.handicap,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...editedProfile });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);

      if (error) throw error;
      fetchBookings();
      setShowBookingModal(false);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/sign-in');
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        await processAndUploadImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const processAndUploadImage = async (uri: string) => {
    try {
      setIsUploadingImage(true);
      setError('');
      setUploadProgress(0);

      // Compress and resize image
      const processedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Convert image to blob
      const response = await fetch(processedImage.uri);
      const blob = await response.blob();

      // Generate unique file name
      const fileExt = 'jpg';
      const fileName = `${session?.user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage with progress tracking
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session?.user?.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setEditedProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setUploadProgress(100);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to update profile picture');
      Alert.alert(
        'Error',
        'Failed to update profile picture. Would you like to try again?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: () => pickImage() }
        ]
      );
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
      </View>
    );
  }

  const upcomingBookings = bookings.filter(
    booking => new Date(booking.date) > new Date() && booking.status !== 'cancelled'
  );
  const pastBookings = bookings.filter(
    booking => new Date(booking.date) <= new Date() || booking.status === 'cancelled'
  );

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity 
            onPress={pickImage} 
            style={styles.imageContainer}
            disabled={isUploadingImage}
          >
            <Image 
              source={{ 
                uri: profile?.avatar_url || DEFAULT_PROFILE_PIC
              }} 
              style={styles.profileImage} 
            />
            <View style={styles.cameraIconContainer}>
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Camera size={20} color="#fff" />
              )}
            </View>
            {isUploadingImage && (
              <View style={styles.uploadProgressContainer}>
                <View style={[styles.uploadProgressBar, { width: `${uploadProgress}%` }]} />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editedProfile.full_name}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, full_name: text })}
                placeholder="Full Name"
              />
            ) : (
              <Text style={styles.name}>{profile?.full_name}</Text>
            )}
            <Text style={styles.email}>{profile?.email}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          {isEditing ? (
            <View style={styles.statItem}>
              <TextInput
                style={styles.editHandicapInput}
                value={editedProfile.handicap?.toString()}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, handicap: parseFloat(text) || 0 })}
                placeholder="Handicap"
                keyboardType="numeric"
              />
              <Text style={styles.statLabel}>Handicap</Text>
            </View>
          ) : (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.handicap || 'N/A'}</Text>
              <Text style={styles.statLabel}>Handicap</Text>
            </View>
          )}
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.8★</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {error ? <Text style={styles.errorMessage}>{error}</Text> : null}

        {upcomingBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Lessons</Text>
            {upcomingBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => {
                  setSelectedBooking(booking);
                  setShowBookingModal(true);
                }}
              >
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingType}>{booking.lesson_type}</Text>
                    <Text style={styles.bookingCoach}>
                      with {(booking as any).coach?.full_name}
                    </Text>
                  </View>
                  <View style={styles.bookingStatus}>
                    <Text style={styles.statusText}>{booking.status}</Text>
                  </View>
                </View>
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetail}>
                    <Calendar size={16} color="#52796F" />
                    <Text style={styles.detailText}>
                      {new Date(booking.date).toLocaleDateString()} at{' '}
                      {new Date(booking.date).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  <View style={styles.bookingDetail}>
                    <Clock size={16} color="#52796F" />
                    <Text style={styles.detailText}>{booking.duration} minutes</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {pastBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Lessons</Text>
            {pastBookings.map((booking) => (
              <View key={booking.id} style={[styles.bookingCard, styles.pastBooking]}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingType}>{booking.lesson_type}</Text>
                    <Text style={styles.bookingCoach}>
                      with {(booking as any).coach?.full_name}
                    </Text>
                  </View>
                  <View style={[
                    styles.bookingStatus,
                    booking.status === 'cancelled' && styles.cancelledStatus
                  ]}>
                    <Text style={[
                      styles.statusText,
                      booking.status === 'cancelled' && styles.cancelledStatusText
                    ]}>
                      {booking.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetail}>
                    <Calendar size={16} color="#52796F" />
                    <Text style={styles.detailText}>
                      {new Date(booking.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.bookingDetail}>
                    <Clock size={16} color="#52796F" />
                    <Text style={styles.detailText}>{booking.duration} minutes</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.menuSection}>
          {[
            { title: 'Edit Profile', icon: Settings, description: 'Update your personal information' },
            { title: 'Payment Methods', icon: Award, description: 'Manage your payment options' },
            { title: 'Reviews', icon: Star, description: 'See your coach reviews' },
          ].map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => {
                if (item.title === 'Edit Profile') {
                  setIsEditing(!isEditing);
                  if (!isEditing) {
                    setEditedProfile(profile);
                  }
                }
              }}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <item.icon size={20} color="#2D6A4F" />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#52796F" />
            </TouchableOpacity>
          ))}
        </View>

        {isEditing ? (
          <View style={styles.editActions}>
            <TouchableOpacity 
              style={[styles.editButton, styles.cancelButton]} 
              onPress={() => {
                setIsEditing(false);
                setEditedProfile(profile);
                setError('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.editButton, styles.saveButton, isSaving && styles.buttonDisabled]} 
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color="#E63946" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
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
              onPress={() => {
                setShowBookingModal(false);
                setSelectedBooking(null);
              }}
            >
              <X size={24} color="#52796F" />
            </TouchableOpacity>

            {selectedBooking && (
              <>
                <Text style={styles.modalTitle}>Lesson Details</Text>
                <View style={styles.modalDetails}>
                  <Text style={styles.modalDetailTitle}>{selectedBooking.lesson_type}</Text>
                  <Text style={styles.modalDetailText}>
                    with {(selectedBooking as any).coach?.full_name}
                  </Text>
                  <Text style={styles.modalDetailText}>
                    {new Date(selectedBooking.date).toLocaleDateString()} at{' '}
                    {new Date(selectedBooking.date).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                  <Text style={styles.modalDetailText}>
                    Duration: {selectedBooking.duration} minutes
                  </Text>
                  <Text style={styles.modalDetailPrice}>
                    ${selectedBooking.price}
                  </Text>
                </View>

                {selectedBooking.status === 'pending' && (
                  <TouchableOpacity 
                    style={styles.cancelBookingButton}
                    onPress={() => handleCancelBooking(selectedBooking)}
                  >
                    <Text style={styles.cancelBookingText}>Cancel Lesson</Text>
                  </TouchableOpacity>
                )}
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
  contentContainer: {
    paddingBottom: 80,
  },
  header: {
    backgroundColor: '#2D6A4F',
    padding: 20,
    paddingTop: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  editInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 24,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  editHandicapInput: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#1B4332',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E6E6E6',
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#1B4332',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
  },
  content: {
    padding: 20,
  },
  errorMessage: {
    color: '#E63946',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
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
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  pastBooking: {
    opacity: 0.8,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingType: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1B4332',
    marginBottom: 4,
  },
  bookingCoach: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
  },
  bookingStatus: {
    backgroundColor: '#E6F2ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cancelledStatus: {
    backgroundColor: '#FFE5E5',
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#2D6A4F',
    textTransform: 'capitalize',
  },
  cancelledStatusText: {
    color: '#E63946',
  },
  bookingDetails: {
    gap: 8,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1B4332',
    marginBottom: 2,
  },
  menuItemDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  editButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
  },
  saveButton: {
    backgroundColor: '#2D6A4F',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#52796F',
  },
  saveButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  signOutButton: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
  },
  signOutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#E63946',
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
  modalDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  modalDetailTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1B4332',
    marginBottom: 8,
  },
  modalDetailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#52796F',
    marginBottom: 4,
  },
  modalDetailPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#2D6A4F',
    marginTop: 8,
  },
  cancelBookingButton: {
    height: 50,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBookingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#E63946',
  },
  imageContainer: {
    position: 'relative',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2D6A4F',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadProgressContainer: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  uploadProgressBar: {
    height: '100%',
    backgroundColor: '#2D6A4F',
    borderRadius: 2,
  },
});