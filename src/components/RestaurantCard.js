// components/RestaurantCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RestaurantCard = ({ restaurant, onPress }) => {
  const handleCall = () => {
    if (restaurant.phone) {
      Linking.openURL(`tel:${restaurant.phone}`);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: restaurant.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.favoriteIcon}>
        <Icon name="favorite-border" size={28} color="#fff" />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.name}>{restaurant.name}</Text>
        <Text style={styles.cuisine}>{restaurant.cuisine}</Text>

        {/* Description */}
        {restaurant.description && (
          <Text style={styles.description} numberOfLines={2}>
            {restaurant.description}
          </Text>
        )}

        <View style={styles.detailsContainer}>
          {/* Address */}
          <View style={styles.detailRow}>
            <Icon name="location-on" size={20} color="#389c9a" />
            <Text style={styles.detailText} numberOfLines={1}>
              {restaurant.address}
            </Text>
          </View>

          {/* Hours */}
          {restaurant.hours && (
            <View style={styles.detailRow}>
              <Icon name="access-time" size={20} color="#389c9a" />
              <Text style={styles.detailText}>{restaurant.hours}</Text>
            </View>
          )}

          {/* Phone */}
          {restaurant.phone && (
            <View style={styles.detailRow}>
              <Icon name="phone" size={20} color="#389c9a" />
              <Text style={styles.detailText}>{restaurant.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>View Available Donations</Text>
          </TouchableOpacity>
          {restaurant.phone && (
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Icon name="phone" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#1d1d1d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200, // Slightly increased height
  },
  favoriteIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(29,29,29,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  cardContent: {
    padding: 18, // Increased padding
  },
  name: {
    fontSize: 24, // Increased from 20
    fontWeight: 'bold',
    color: '#1d1d1d',
    marginBottom: 6,
  },
  cuisine: {
    fontSize: 16, // Increased from 14
    fontWeight: '600',
    color: '#389c9a',
    marginBottom: 10,
  },
  description: {
    fontSize: 15, // Increased from 13
    color: '#666',
    marginBottom: 14,
    lineHeight: 20,
  },
  detailsContainer: {
    marginBottom: 14,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14, // Increased from 12
    color: '#555',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#389c9a',
    paddingVertical: 14, // Increased padding
    paddingHorizontal: 18,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
    shadowColor: '#389c9a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16, // Increased from 14
  },
  callButton: {
    backgroundColor: '#fedb71',
    padding: 14, // Increased padding
    borderRadius: 8,
    width: 54, // Increased width
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d1d1d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default RestaurantCard;
