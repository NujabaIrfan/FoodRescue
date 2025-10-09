import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Alert, Image, Platform, TouchableOpacity } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6Icon from 'react-native-vector-icons/FontAwesome6';
import { auth, db } from '../../firebaseConfig';
import { ref } from 'firebase/storage';
import { useEffect, useState } from 'react';

const OrganizationEvent = ({
  organizationId,
  eventId,
  image,
  name,
  eventDateTime,
  venue,
  venueCoordinates,
  description,
  showEditButton,
  showDeleteButton,
  showCancelButton,
  refreshFlag,
  setRefreshFlag
}) => {

  const [distance, setDistance] = useState(Math.infinity)
  const { currentUser } = auth

  useEffect(() => {
    if (!venueCoordinates || !currentUser) return;

    const fetchDistance = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Volunteers", currentUser.uid));
        if (!userDoc.exists()) return;

        const { address, preferredArea } = userDoc.data();

        // Helper to geocode a query string
        const geocode = async (query) => {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
          const res = await fetch(url, {
            headers: { "User-Agent": "FoodRescue/1.0 (senirupasan@gmail.com)" }
          });
          const data = await res.json();
          if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
          }
          return null;
        };

        const userLocations = [];
        for (let query of [address, preferredArea]) {
          if (!query) continue;
          const loc = await geocode(query);
          if (loc) userLocations.push(loc);
        }

        if (userLocations.length === 0) return;

        // Calculate distance from event
        const eventLat = venueCoordinates[1];
        const eventLon = venueCoordinates[0];

        const toRad = (deg) => deg * (Math.PI / 180);
        const haversineDistance = (lat1, lon1, lat2, lon2) => {
          const R = 6371; // km
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        const distances = userLocations.map(loc =>
          haversineDistance(loc.lat, loc.lon, eventLat, eventLon)
        );

        setDistance(Math.min(...distances).toFixed(1)); // km, 1 decimal
      } catch (err) {
        console.error("Error fetching geocode:", err);
      }
    };

    fetchDistance();
  }, [venueCoordinates, currentUser]);


  const deleteEvent = async () => {
    await deleteDoc(doc(db, "Organizations", organizationId, "events", eventId))
    if (setRefreshFlag) setRefreshFlag(!refreshFlag)
  }

  const cancelEvent = async () => {
    await updateDoc(doc(db, "Organizations", organizationId, "events", eventId), {
      eventDateTime: 0
    })
    if (setRefreshFlag) setRefreshFlag(!refreshFlag)
  }

  const showDeleteConfirmation = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure to delete this event?")) deleteEvent();
    } else {
      Alert.alert(
        "Confirm",
        "Are you sure to cancel this event?",
        [
          { text: "No", style: "cancel" },
          { text: "Cancel event", style: "destructive", onPress: deleteEvent }
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
          { text: "Delete", style: "destructive", onPress: cancelEvent }
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
        <View style={{ width: "100%", marginTop: 8 }}>
          <View style={[styles.dataRow, styles.iconText]}>
            <Icon name='calendar-month' size={18} color='#606060'></Icon>
            <Text style={styles.infoText}>{eventDateTime === 0 ? "Cancelled" : eventDateTime.toLocaleString()}</Text>
          </View>
          <View style={[styles.dataRow, styles.iconText, { alignItems: "flex-start" }]}>
            <Icon name='share-location' size={18} color='#606060' />
            <View>
              <Text style={styles.infoText}>{venue}</Text>
              {(distance && distance < 20) && (<Text style={styles.description}>({distance} km away from you)</Text>)}
            </View>
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
                style={[styles.button, styles.dangerButton, styles.iconText]}
                onPress={showCancellationConfirmation}
              >
                <FontAwesome6Icon name='ban' color="white" />
                <Text style={styles.buttonText}>Cancel event</Text>
              </TouchableOpacity>
            )}
            {showDeleteButton && (
              <TouchableOpacity
                style={[styles.button, styles.dangerButton, styles.iconText]}
                onPress={showDeleteConfirmation}
              >
                <FontAwesome6Icon name='trash' color="white" />
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
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
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
    marginLeft: 5,
  },
  infoText: {
    fontWeight: 'light',
    color: '#555',
  },
  description: {
    fontWeight: 'normal',
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 8,
    flexShrink: 1,
  },
  dataRow: {
    flexDirection: 'row',

    width: "60%",
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
  iconText: { gap: 8, flexDirection: "row", alignItems: "center" }
});

export default OrganizationEvent;
