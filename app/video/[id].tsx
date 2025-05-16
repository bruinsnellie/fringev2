import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Video } from 'expo-av';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';

const VIDEO_DATA = {
  '1': {
    id: '1',
    title: 'Driver Swing Analysis',
    coach: 'Mike Johnson',
    date: 'March 15, 2024',
    videoUrl: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
    feedback: {
      timestamp: 'March 16, 2024',
      text: 'Great follow-through on your swing! A few things to work on:\n\n1. Keep your head more still during the backswing\n2. Try to maintain a slightly wider stance\n3. Your grip pressure looks good, keep that consistent',
      drills: [
        'Practice swing with alignment sticks',
        'Mirror work focusing on head position',
        'Slow-motion swings emphasizing stance width',
      ],
    },
  },
};

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams();
  const video = VIDEO_DATA[id as keyof typeof VIDEO_DATA];
  const [status, setStatus] = useState({});

  if (!video) {
    return (
      <View style={styles.container}>
        <Text>Video not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity style={styles.backButton}>
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.videoContainer}>
        <Video
          style={styles.video}
          source={{ uri: video.videoUrl }}
          useNativeControls
          resizeMode="contain"
          isLooping
          onPlaybackStatusUpdate={status => setStatus(() => status)}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.metadata}>
          Submitted on {video.date} • Reviewed by {video.coach}
        </Text>

        {video.feedback && (
          <View style={styles.feedbackSection}>
            <View style={styles.feedbackHeader}>
              <MessageCircle size={20} color="#2D6A4F" />
              <Text style={styles.feedbackTitle}>Coach Feedback</Text>
            </View>
            <Text style={styles.feedbackTimestamp}>Received {video.feedback.timestamp}</Text>
            <Text style={styles.feedbackText}>{video.feedback.text}</Text>

            <View style={styles.drillsSection}>
              <Text style={styles.drillsTitle}>Recommended Drills</Text>
              {video.feedback.drills.map((drill, index) => (
                <View key={index} style={styles.drillItem}>
                  <Text style={styles.drillNumber}>{index + 1}</Text>
                  <Text style={styles.drillText}>{drill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1B4332',
    marginBottom: 8,
  },
  metadata: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
    marginBottom: 24,
  },
  feedbackSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1B4332',
  },
  feedbackTimestamp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
    marginBottom: 12,
  },
  feedbackText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1B4332',
    lineHeight: 24,
  },
  drillsSection: {
    marginTop: 24,
  },
  drillsTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1B4332',
    marginBottom: 12,
  },
  drillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  drillNumber: {
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
  drillText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1B4332',
  },
});