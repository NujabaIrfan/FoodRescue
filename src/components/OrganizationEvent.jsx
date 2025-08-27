import { Image } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const OrganizationEvent = ({ image, eventName, datetime, venue }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.eventName}>{eventName}</Text>
      <View style={styles.eventContainer}>
        <View>
          {image ? (
            <Image source={{ uri: image }} style={styles.eventImage} />
          ) : (
            <Icon name="event-note" size={60} color="#606060" />
          )}
        </View>
        <View>
          <View style={styles.dataRow}>
            <Icon name='calendar-month' size={18} color='#606060'></Icon>
            <Text style={styles.infoText}>{datetime.toLocaleString()}</Text>
          </View>
          <View style={styles.dataRow}>
            <Icon name='share-location' size={18} color='#606060'></Icon>
            <Text style={styles.infoText}>{venue}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 5,
    marginBottom: 5,
    shadowColor: '#1d1d1d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    padding: 8
  },
  eventContainer: {
    flexDirection: 'row',
    gap: 6
  },
  eventImage: {
    width: 75,
    height: 75,
    margin: 5,
    borderRadius: 11,
  },
  eventName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  infoText: {
    fontWeight: 'light',
    color: '#555',
  },
  dataRow: {
    flexDirection: 'row',
    gap: 5
  }
});

export default OrganizationEvent;
