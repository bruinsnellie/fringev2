import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Search as SearchIcon, Filter, Star, MapPin, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [coaches, setCoaches] = useState<Profile[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCoaches();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCoaches(coaches);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = coaches.filter(coach => 
      coach.full_name.toLowerCase().includes(query)
    );
    setFilteredCoaches(filtered);
  }, [searchQuery, coaches]);

  const fetchCoaches = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'coach');

      if (fetchError) throw fetchError;

      setCoaches(data || []);
      setFilteredCoaches(data || []);
    } catch (err) {
      console.error('Error fetching coaches:', err);
      setError('Failed to load coaches');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon size={20} color="#52796F" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or specialty"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#52796F"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#2D6A4F" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.results} 
        contentContainerStyle={styles.resultsContent} 
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            <Text style={styles.resultsTitle}>
              {filteredCoaches.length} Available Coach{filteredCoaches.length !== 1 ? 'es' : ''}
            </Text>
            
            {filteredCoaches.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No coaches found</Text>
                <Text style={styles.emptyStateSubtext}>Try adjusting your search criteria</Text>
              </View>
            ) : (
              filteredCoaches.map((coach) => (
                <Link href={`/coach/${coach.id}`} key={coach.id} asChild>
                  <TouchableOpacity style={styles.coachCard}>
                    <Image 
                      source={{ 
                        uri: coach.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200'
                      }} 
                      style={styles.coachImage} 
                    />
                    <View style={styles.coachInfo}>
                      <View style={styles.coachHeader}>
                        <Text style={styles.coachName}>{coach.full_name}</Text>
                        <View style={styles.priceTag}>
                          <Text style={styles.price}>$85</Text>
                          <Text style={styles.priceUnit}>/hour</Text>
                        </View>
                      </View>

                      <Text style={styles.coachSpecialty}>Golf Pro</Text>

                      <View style={styles.coachMeta}>
                        <View style={styles.metaItem}>
                          <Star size={16} color="#2D6A4F" fill="#2D6A4F" />
                          <Text style={styles.metaText}>4.9 (128)</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Clock size={16} color="#52796F" />
                          <Text style={styles.metaText}>15+ years</Text>
                        </View>
                      </View>

                      <View style={styles.coachFooter}>
                        <View style={styles.locationContainer}>
                          <MapPin size={16} color="#52796F" />
                          <Text style={styles.location}>San Francisco, CA</Text>
                        </View>
                        <Text style={styles.availability}>Next available: Today</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Link>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1B4332',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  results: {
    flex: 1,
    padding: 16,
  },
  resultsContent: {
    paddingBottom: 80,
  },
  resultsTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1B4332',
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#E63946',
    textAlign: 'center',
    marginTop: 24,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1B4332',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#52796F',
  },
  coachCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    overflow: 'hidden',
  },
  coachImage: {
    width: 100,
    height: 140,
  },
  coachInfo: {
    flex: 1,
    padding: 12,
  },
  coachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  coachName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1B4332',
    flex: 1,
  },
  priceTag: {
    backgroundColor: '#E6F2ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#2D6A4F',
  },
  priceUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#52796F',
    marginLeft: 2,
  },
  coachSpecialty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
    marginBottom: 8,
  },
  coachMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
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
  coachFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
  },
  availability: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#2D6A4F',
  },
});