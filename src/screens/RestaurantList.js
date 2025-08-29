import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import { db } from '../../firebaseConfig';
import RestaurantCard from '../components/RestaurantCard';
import { collection, getDocs } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const RestaurantList = () => {
  const navigation = useNavigation();

  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // 🔹 Setup navigation header style + profile icon
  useEffect(() => {
    navigation.setOptions({
      title: 'Donors',
      headerStyle: {
        backgroundColor: '#389c9a',
        elevation: 0, // Android shadow
        shadowOpacity: 0, // iOS shadow
      },
      headerTintColor: '#fff', // back arrow / text color
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 20,
      },
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 15 }}
          onPress={() => navigation.navigate('donorSignUp')} // 👈 Navigate to DonorSignUp screen
        >
          <Icon name="account-circle" size={28} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // 🔹 Fetch Restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'restaurant'));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRestaurants(data);
        setFilteredRestaurants(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  // 🔹 Filter
  useEffect(() => {
    if (searchQuery === '') {
      setFilteredRestaurants(restaurants);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = restaurants.filter((restaurant) => {
      if (activeFilter === 'name') {
        return restaurant.name?.toLowerCase().includes(lowerCaseQuery);
      } else if (activeFilter === 'location') {
        return restaurant.address?.toLowerCase().includes(lowerCaseQuery);
      } else {
        return (
          restaurant.name?.toLowerCase().includes(lowerCaseQuery) ||
          restaurant.address?.toLowerCase().includes(lowerCaseQuery)
        );
      }
    });

    setFilteredRestaurants(filtered);
  }, [searchQuery, restaurants, activeFilter]);

  const handleSearch = (text) => setSearchQuery(text);
  const clearSearch = () => {
    setSearchQuery('');
    setActiveFilter('all');
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#389c9a" />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error}</Text>
        <Text style={styles.errorHelp}>
          Please check your internet connection
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔎 Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon
            name="search"
            size={20}
            color="#555"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or location..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Icon name="close" size={20} color="#555" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {['all', 'name', 'location'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.activeFilter,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      {searchQuery.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredRestaurants.length} restaurant
            {filteredRestaurants.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Restaurant List */}
      {filteredRestaurants.length === 0 ? (
        <View style={styles.center}>
          <Icon name="search-off" size={50} color="#ccc" />
          <Text style={styles.emptyText}>No restaurants found.</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery.length > 0
              ? 'Try a different search term'
              : 'No restaurants available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RestaurantCard restaurant={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 45, fontSize: 16, color: '#1d1d1d' },
  clearButton: { padding: 4 },
  filterContainer: { flexDirection: 'row' },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  activeFilter: { backgroundColor: '#389c9a' },
  filterText: { color: '#555', fontWeight: '500' },
  activeFilterText: { color: '#fff' },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e6f7f7',
  },
  resultsText: { color: '#389c9a', fontSize: 14 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  loadingText: { marginTop: 10, color: '#555', fontSize: 16 },
  error: {
    color: '#E64848',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHelp: { color: '#555', fontSize: 14, textAlign: 'center' },
  emptyText: { fontSize: 18, color: '#555', marginTop: 12, fontWeight: '500' },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  list: { padding: 16 },
});

export default RestaurantList;
