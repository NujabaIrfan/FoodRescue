import { Image } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';

const OrganizationEvent = ({ image, name, eventDateTime, venue, description }) => {
  console.log(eventDateTime, typeof eventDateTime)
  return (
    <View style={styles.card}>
      <Text style={styles.eventName}>{name}</Text>
      <View style={styles.eventContainer}>
        <View>
          {image ? (
            <Image source={ image } style={styles.eventImage} />
          ) : (
            <Icon name="event-note" size={60} color="#606060" />
          )}
        </View>
        <View style={{ width: "100%" }}>
          <View style={styles.dataRow}>
            <Icon name='calendar-month' size={18} color='#606060'></Icon>
            <Text style={styles.infoText}>{eventDateTime.toLocaleString()}</Text>
          </View>
          <View style={styles.dataRow}>
            <Icon name='share-location' size={18} color='#606060'></Icon>
            <Text style={styles.infoText}>{venue}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text
              onPress={() => Toast.show({
                position: "top",
                type: "info",
                text1: description
              })}
              style={styles.description}
              ellipsizeMode="tail"
            >{description}</Text>
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
    gap: 6,
    width: "100%"
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
  description: {
    fontWeight: 'normal',
    color: "#555",
    fontStyle: "italic",
    marginTop: 8,
    flexShrink: 1,
  },
  dataRow: {
    flexDirection: 'row',
    flexWrap: "wrap",
    width: "75%",
  }
});

export default OrganizationEvent;
