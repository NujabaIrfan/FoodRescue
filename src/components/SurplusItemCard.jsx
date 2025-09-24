import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SurplusItemCard = ({ item }) => {

  const navigation=useNavigation();

  const handleRequestPress = () => {
    navigation.navigate('createFoodRequest',{
      item: item.name
    });
    console.log(`Food request button pressed for item: ${item.name}`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <View style={styles.quantityContainer}>
          <Icon name="restaurant-menu" size={16} color="#4a90e2" />
          <Text style={styles.quantityText}>{item.quantity} servings</Text>
        </View>
      </View>
      <Text style={styles.descriptionText}>{item.description || 'No description provided.'}</Text>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Icon name="label-outline" size={16} color="#7f8c8d" style={styles.infoIcon} />
          <Text style={styles.infoText}>{item.category}</Text>
        </View>

        {item.expiryDate && (
          <View style={styles.infoRow}>
            <Icon name="event" size={16} color="#e67e22" style={styles.infoIcon} />
            <Text style={styles.infoText}>Expires: {item.expiryDate}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.requestButton} onPress={handleRequestPress}>
        <Text style={styles.buttonText}>Make a Food Request</Text>
        <Icon name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    flexShrink: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f0fe',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityText: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '600',
    marginLeft: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  infoContainer: {
    marginTop: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    fontWeight: '500',
  },
  requestButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default SurplusItemCard;