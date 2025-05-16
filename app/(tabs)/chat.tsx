import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

const CHATS = [
  {
    id: '1',
    name: 'Sarah Chen',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&h=100&fit=crop',
    lastMessage: 'Great progress on your putting technique!',
    time: '2m ago',
    unread: 2,
  },
  {
    id: '2',
    name: 'Mike Johnson',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&h=100&fit=crop',
    lastMessage: 'Lets schedule your next lesson',
    time: '1h ago',
    unread: 0,
  },
  {
    id: '3',
    name: 'Emma Wilson',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&h=100&fit=crop',
    lastMessage: 'Ive reviewed your swing video. Heres what I noticed...',
    time: '3h ago',
    unread: 1,
  },
];

export default function ChatScreen() {
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {CHATS.map((chat) => (
        <Link href={`/chat/${chat.id}`} key={chat.id} asChild>
          <TouchableOpacity style={styles.chatItem}>
            <Image source={{ uri: chat.image }} style={styles.avatar} />
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.name}>{chat.name}</Text>
                <Text style={styles.time}>{chat.time}</Text>
              </View>
              <View style={styles.messageRow}>
                <Text 
                  style={[
                    styles.lastMessage,
                    chat.unread > 0 && styles.unreadMessage
                  ]}
                  numberOfLines={1}
                >
                  {chat.lastMessage}
                </Text>
                {chat.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{chat.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Link>
      ))}
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
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1B4332',
  },
  time: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#52796F',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    fontFamily: 'Inter_600SemiBold',
    color: '#1B4332',
  },
  unreadBadge: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },
});