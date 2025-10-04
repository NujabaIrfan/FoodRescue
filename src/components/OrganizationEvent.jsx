import { doc, updateDoc } from 'firebase/firestore';
import { Alert, Image, Platform, TouchableOpacity } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { db } from '../../firebaseConfig';

const OrganizationEvent = ({
  organizationId,
  eventId,
  image,
  name,
  eventDateTime,
  venue,
  description,
  showEditButton,
  showDeleteButton,
  showCancelButton,
}) => {

  const deleteEvent = () => {
    console.log("delete event")
  }

  const cancelEvent = async () => {
    await updateDoc(doc(db, "Organizations", organizationId, "events", eventId), {
      eventDateTime: 0
    })
  }

  const showDeleteConfirmation = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure to delete this event?")) cancelEvent();
    } else {
      Alert.alert(
        "Confirm",
        "Are you sure to cancel this event?",
        [
          { text: "No", style: "cancel" },
          { text: "Cancel event", style: "destructive", onPress: cancelEvent }
        ]
      );
    }

  }

  const showCancellationConfirmation = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure to delete this event?")) cancelEvent();
    } else {
      Alert.alert(
        "Confirm",
        "Are you sure to cancel this event?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: deleteEvent }
        ]
      );
    }

  }

  return (
    <View style={styles.card}>
      <Text style={styles.eventName}>{name}</Text>
      <View style={styles.eventContainer}>
        <View>
          {image ? (
            <Image source={image} style={styles.eventImage} />
          ) : (
            <Icon name="event-note" size={60} color="#606060" />
          )}
        </View>
        <View style={{ width: "100%" }}>
          <View style={styles.dataRow}>
            <Icon name='calendar-month' size={18} color='#606060'></Icon>
            <Text style={styles.infoText}>{eventDateTime === 0 ? "Cancelled" : eventDateTime.toLocaleString()}</Text>
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
          <View style={[styles.dataRow, {
            justifyContent: "flex-end",
            paddingTop: (showEditButton || showCancelButton || showDeleteButton) ? 10 : 0
          }]}>
            {showEditButton && (
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Edit event</Text>
              </TouchableOpacity>
            )}
            {showCancelButton && (
              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={showCancellationConfirmation}
              >
                <Text style={styles.buttonText}>Cancel event</Text>
              </TouchableOpacity>
            )}
            {showDeleteButton && (
              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={showDeleteConfirmation}
              >
                <Text style={styles.buttonText}>Delete event</Text>
              </TouchableOpacity>
            )}
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
  },
  button: {
    backgroundColor: '#389c9a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    margin: 2,
    shadowColor: '#389c9a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  dangerButton: {
    backgroundColor: '#DC143C',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OrganizationEvent;
