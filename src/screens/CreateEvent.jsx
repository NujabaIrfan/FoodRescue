import Checkbox from 'expo-checkbox';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';

import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from 'react-native-ui-datepicker';
import pinImage from '../../assets/pin.png';
import { addDoc, collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import EventMap from '../components/EventMap';
import Toast from 'react-native-toast-message';
import { getProximityData } from '../services/geminiMemberProximityService';
import FontAwesome6Icon from 'react-native-vector-icons/FontAwesome6';

export default function CreateEvent({ route }) {

  const { id } = route.params

  const [image, setImage] = useState(require('../../assets/default-image.jpg'));
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [eventDateTime, setEventDateTime] = useState(new Date());
  const [hasPhysicalVenue, setHasPhysicalVenue] = useState(false);
  const [venue, setVenue] = useState("Sri Lanka")
  const coordinatesRef = useRef()
  const [memberLocations, setMemberLocations] = useState([])
  const [coordinatesTrigger, setCoordinatesTrigger] = useState(Date.now())
  const [proximityApproximationSuccess, setProximityApproximationSuccess] = useState(false)
  const [proximityApproximationMessage, setProximityApproximationMessage] = useState("")
  const [proximityApproximationLoading, setProximityApproximationLoading] = useState(false)
  const debounceTimerRef = useRef(null)
  const navigator = useNavigation()

  const uploadImage = async () => {
    let res = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 500,
      maxHeight: 500,
      selectionLimit: 1,
    });
    if (res.assets.length === 1) setImage({ uri: res.assets[0].uri });
  };

  async function requestLocationPermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  useEffect(() => {
    (async () => {
      const [lon, lat] = coordinatesRef.current;
      const lookupResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
        headers: {
          "User-Agent": "FoodRescue/1.0 (senirupasan@gmail.com)"
        }
      });
      const locationName = (await lookupResponse.json()).display_name;
      setVenue(locationName);

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          setProximityApproximationLoading(true)
          console.log('AI proximity request triggered...');
          const result = await getProximityData(memberLocations, [lon, lat]);
          const { success, message } = JSON.parse(result)
          setProximityApproximationSuccess(success)
          setProximityApproximationMessage(message)
        } catch (err) {
          console.error('AI request failed', err);
        } finally {
          setProximityApproximationLoading(false)
        }
      }, 2000);

    })();
  }, [coordinatesTrigger]);

  useEffect(() => {
    (async () => {
      try {
        const membersSnap = await getDocs(collection(db, "Organizations", id, "members"))

        const locations = await Promise.all(
          membersSnap.docs.map(async (m) => {
            const userSnap = await getDoc(doc(db, "Volunteers", m.id))
            const userData = userSnap.data()
            return [userData.address, userData.preferredArea]
          })
        )

        setMemberLocations(locations.flat())
      } catch (err) {
        console.error(err)
        setIsFetchError(true)
      }
    })()
  }, [id])

  const createEvent = async () => {
    const { currentUser } = auth;
    if (!currentUser) return Toast.show({
      type: "error",
      text1: "You must log in to perform this action",
      position: 'top'
    });
    if (!name.trim()) return Toast.show({
      type: "error",
      text1: "Please provide a valid name for your event",
      position: "top"
    });
    if (!description.trim()) return Toast.show({
      type: "error",
      text1: "Please provide a valid description for your event",
      position: "top"
    })


    const eventRef = collection(db, "Organizations", id, "events")


    await addDoc(eventRef, {
      name,
      description,
      eventDateTime,
      venue,
      venueCoordinates: coordinatesRef.current,
      image,
    })

    navigator.navigate("organization", { id })

  }

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.primaryHeading}>Create an event</Text>

      <Text style={styles.label}>Event name</Text>
      <TextInput
        style={styles.input}
        onChangeText={setName}
        placeholder="Name of the event" />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.textarea}
        placeholder="Type here"
        onChangeText={setDescription}
        multiline={true}
      />

      <Text style={styles.label}>Date/Time</Text>
      <DateTimePicker
        timePicker={true}
        date={eventDateTime}
        styles={{
          today: { borderColor: '#fed871', borderWidth: 1, borderRadius: 4 },
          selected: { backgroundColor: '#389c9a', borderRadius: 4 },
          selected_label: { color: '#ffffff' },
        }}
        onChange={(result) => setEventDateTime(result.date)}
        style={styles.calendar}
      />

      <View style={[styles.flexRow, { gap: 30 }]}>
        <Text style={styles.label}>Venue</Text>
        <View style={[styles.flexRow, { gap: 5 }]}>
          <Checkbox
            value={hasPhysicalVenue}
            onValueChange={setHasPhysicalVenue}
          />
          <Text style={[styles.infoText, { fontSize: 14 }]}>
            This event has a physical venue
          </Text>
        </View>
      </View>

      {hasPhysicalVenue && (
        <View>
          <Text style={styles.infoText}>Please select a venue below.</Text>
          <View style={styles.mapContainer}>
            {hasPhysicalVenue && (
              <EventMap
                coordinatesRef={coordinatesRef}
                onCoordinatesChange={setCoordinatesTrigger}
                memberLocations={memberLocations}
              />
            )}

            <View>
              {proximityApproximationLoading ? (
                <View style={[styles.iconText, styles.aiLoadingContainer]}>
                  <FontAwesome6Icon name='magnifying-glass-location' color="white" size={14} />
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>Finding your crowd...</Text>
                </View>
              ) : (
                proximityApproximationSuccess && (
                  <View style={[styles.iconText, styles.aiResultContainer]}>
                    <FontAwesome6Icon name="wand-sparkles" color="white" size={14} />
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
                      {proximityApproximationMessage}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
          <View>
            <Text style={styles.infoText}>{venue}</Text>
          </View>
        </View>
      )}

      <View style={styles.imageUploadView}>
        <Image source={image} style={styles.imagePreview} />
        <View style={{ flexGrow: 1 }}>
          <Text style={styles.label}>Upload an image</Text>
          <TouchableOpacity style={styles.button} onPress={uploadImage}>
            <Text style={styles.buttonText}>Upload</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <Text style={styles.infoText}>Recommended size: 500×500px</Text>
          <Text style={styles.infoText}>File types: JPG, JPEG, PNG</Text>
          <Text style={styles.infoText}>Max file size: 2MB</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.button, { marginBottom: 80 }]} onPress={createEvent}>
        <Text style={styles.buttonText}>Create event</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    backgroundColor: '#fefefe'
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 4,
    color: '#444',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  imageUploadView: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 15,
    marginBottom: 30,
  },
  imagePreview: {
    width: 130,
    height: 130,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
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
    alignSelf: 'stretch',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoText: {
    fontWeight: 'light',
    color: '#555',
    fontSize: 12,
  },
  separator: {
    height: 1,
    marginVertical: 3,
  },
  calendar: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  mapView: {
    width: '100%',
    height: 300,
    marginTop: 10,
    marginBottom: 10,
  },
  mapContainer: {
    position: 'relative',
  },
  mapCenterMark: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    zIndex: 10,
  },
  aiLoadingContainer: {
    backgroundColor: "#ffa500",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    borderColor: "#ffd700",
    shadowColor: "#ffb300",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
  aiResultContainer: {
    backgroundColor: "#00c875",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    borderColor: "#00ff9f",
    shadowColor: "#00ff9f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 15,
  },
  iconText: { gap: 8, flexDirection: "row", alignItems: "center" }
});