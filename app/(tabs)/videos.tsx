import { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Platform, Alert, Modal } from 'react-native';
import { Link } from 'expo-router';
import { Upload, Play, Clock, Video as VideoIcon, ArrowRight, X, Camera, RotateCcw } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const VIDEOS = [
  {
    id: '1',
    title: 'Driver Swing Analysis',
    thumbnail: 'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg?auto=compress&cs=tinysrgb&w=600',
    coach: 'Sarah Chen',
    status: 'Reviewed',
    feedback: true,
    date: '2 days ago',
    duration: '0:45',
    videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  },
  {
    id: '2',
    title: 'Putting Form Check',
    thumbnail: 'https://images.pexels.com/photos/114972/pexels-photo-114972.jpeg?auto=compress&cs=tinysrgb&w=600',
    coach: 'Mike Johnson',
    status: 'Pending',
    feedback: false,
    date: '5 days ago',
    duration: '0:32',
    videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  },
];

const MAX_DURATION = 60; // Maximum video duration in seconds
const MAX_SIZE = 100 * 1024 * 1024; // 100MB max file size

export default function VideosScreen() {
  const { session } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState<{
    uri: string;
    type: 'local' | 'remote';
    thumbnail?: string;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = useRef<Video>(null);

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: MAX_DURATION,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        
        // Check video duration
        if (asset.duration && asset.duration > MAX_DURATION) {
          Alert.alert('Video too long', `Please select a video shorter than ${MAX_DURATION} seconds`);
          return;
        }

        // Check file size
        if (asset.fileSize && asset.fileSize > MAX_SIZE) {
          Alert.alert('File too large', 'Please select a video smaller than 100MB');
          return;
        }

        setSelectedVideo({
          uri: asset.uri,
          type: 'local',
          thumbnail: asset.uri,
        });
        setShowPreview(true);
      }
    } catch (err) {
      console.error('Error picking video:', err);
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const handleUpload = async () => {
    if (!selectedVideo || !session?.user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // In a real app, you would:
      // 1. Upload the video to storage
      // 2. Generate a thumbnail
      // 3. Create a database record
      // 4. Handle progress updates

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      Alert.alert(
        'Success',
        'Video uploaded successfully! Your coach will review it soon.',
        [{ text: 'OK', onPress: () => setShowPreview(false) }]
      );
    } catch (err) {
      console.error('Error uploading video:', err);
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoPress = (video: typeof VIDEOS[0]) => {
    setSelectedVideo({
      uri: video.videoUrl,
      type: 'remote',
      thumbnail: video.thumbnail,
    });
    setShowPreview(true);
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.uploadCard} onPress={pickVideo}>
        <View style={styles.uploadContent}>
          <View style={styles.uploadIconContainer}>
            <Camera size={24} color="#fff" />
          </View>
          <View style={styles.uploadTextContainer}>
            <Text style={styles.uploadTitle}>Record Swing Video</Text>
            <Text style={styles.uploadSubtitle}>Get expert feedback from your coach</Text>
          </View>
          <ArrowRight size={20} color="#2D6A4F" />
        </View>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Videos</Text>
        {VIDEOS.map((video) => (
          <TouchableOpacity 
            key={video.id} 
            style={styles.videoCard}
            onPress={() => handleVideoPress(video)}
          >
            <View style={styles.thumbnailContainer}>
              <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
              <TouchableOpacity 
                style={styles.playButton}
                onPress={() => handleVideoPress(video)}
              >
                <Play size={24} color="#fff" fill="#fff" />
              </TouchableOpacity>
              <View style={styles.videoDuration}>
                <VideoIcon size={12} color="#fff" />
                <Text style={styles.durationText}>{video.duration}</Text>
              </View>
            </View>
            <View style={styles.videoInfo}>
              <View style={styles.videoHeader}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: video.status === 'Reviewed' ? '#E6F2ED' : '#FFF3E6' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: video.status === 'Reviewed' ? '#2D6A4F' : '#CC8A00' }
                  ]}>{video.status}</Text>
                </View>
              </View>

              <Text style={styles.coachName}>Sent to {video.coach}</Text>

              <View style={styles.videoMeta}>
                <View style={styles.metaItem}>
                  <Clock size={14} color="#52796F" />
                  <Text style={styles.metaText}>{video.date}</Text>
                </View>
                {video.feedback && (
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => {}}
                  >
                    <Text style={styles.viewButtonText}>View Feedback</Text>
                    <ArrowRight size={16} color="#2D6A4F" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips for Better Videos</Text>
        <View style={styles.tipCard}>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>1</Text>
            <Text style={styles.tipText}>Record in landscape mode for better analysis</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>2</Text>
            <Text style={styles.tipText}>Ensure good lighting and clear background</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>3</Text>
            <Text style={styles.tipText}>Position camera at hip height for optimal angle</Text>
          </View>
        </View>
      </View>

      <Modal
        visible={showPreview}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              setShowPreview(false);
              setSelectedVideo(null);
              setIsPlaying(false);
            }}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>

          {selectedVideo && (
            <>
              <View style={styles.videoContainer}>
                <Video
                  ref={videoRef}
                  style={styles.video}
                  source={{ uri: selectedVideo.uri }}
                  useNativeControls={false}
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                  onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                />
                <TouchableOpacity 
                  style={styles.playPauseButton}
                  onPress={togglePlayPause}
                >
                  {isPlaying ? (
                    <RotateCcw size={32} color="#fff" />
                  ) : (
                    <Play size={32} color="#fff" fill="#fff" />
                  )}
                </TouchableOpacity>
              </View>

              {selectedVideo.type === 'local' && (
                <View style={styles.uploadActions}>
                  {isUploading ? (
                    <View style={styles.uploadProgress}>
                      <View 
                        style={[
                          styles.progressBar,
                          { width: `${uploadProgress}%` }
                        ]} 
                      />
                      <Text style={styles.progressText}>
                        Uploading... {uploadProgress}%
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.uploadButton}
                      onPress={handleUpload}
                    >
                      <Upload size={20} color="#fff" />
                      <Text style={styles.uploadButtonText}>
                        Upload for Review
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
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
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  uploadCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  uploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  uploadIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D6A4F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1B4332',
    marginBottom: 4,
  },
  uploadSubtitle: {
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
    marginBottom: 16,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -20 },
      { translateY: -20 }
    ],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#fff',
  },
  videoInfo: {
    flex: 1,
    padding: 12,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  videoTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1B4332',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  coachName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
    marginBottom: 12,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#2D6A4F',
  },
  tipCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2D6A4F',
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 24,
  },
  tipText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#1B4332',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playPauseButton: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  uploadButton: {
    backgroundColor: '#2D6A4F',
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  uploadProgress: {
    height: 50,
    backgroundColor: 'rgba(45, 106, 79, 0.2)',
    borderRadius: 25,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#2D6A4F',
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#fff',
    lineHeight: 50,
  },
});