import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import FontAwesome6Icon from 'react-native-vector-icons/FontAwesome6';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { ScrollView } from "react-native";
import { Keyboard } from "react-native";
import { useNavigation } from "@react-navigation/native";
import OrganizationEvent from "../components/OrganizationEvent";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function OrganizationEvents({ route }) {

  const { id } = route.params
  const navigator = useNavigation()

  const [searchQuery, setSearchQuery] = useState("")
  const [events, setEvents] = useState([])
  const [refreshFlag, setRefreshFlag] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        // fetch events subcollection
        const eventsSnap = await getDocs(collection(db, "Organizations", id, "events"))
        const eventsData = eventsSnap.docs.map(e => ({
          id: e.id,
          ...e.data()
        }))
        setEvents(eventsData)
      } catch (err) {
        console.error(err)
      }
    })()
  }, [id, refreshFlag])

  const now = new Date()
  const filteredEvents = events.filter(event => event.name.trim().toLowerCase().includes(searchQuery.trim().toLowerCase()))
  const activeEvents = filteredEvents.filter(event => event.eventDateTime !== 0 && event.eventDateTime.toDate() >= now)
  const pastEvents = filteredEvents.filter(event => event.eventDateTime === 0 || event.eventDateTime.toDate() < now)

  const clearSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss(); // Dismiss keyboard when clearing search
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>

        <View style={styles.searchInputContainer}>
          <MaterialIcon
            name="search"
            size={20}
            color="#555"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for organizations..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            underlineColorAndroid="transparent"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <MaterialIcon name="close" size={20} color="#555" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.primaryHeading}>Upcoming events</Text>
        {activeEvents.length === 0
          ? (
            <Text style={styles.infoText}>
              No upcoming events...
            </Text>
          ) : activeEvents.map((event, index) => (
            <OrganizationEvent
              key={index}
              organizationId={id}
              eventId={event.id}
              image={event.image}
              name={event.name}
              description={event.description}
              eventDateTime={new Date(event.eventDateTime.toDate())}
              // showEditButton={true} // todo: set the flag based on who is logged in
              // im lazy to implement the edit feature. Don't think it is necessary. So I'll leve it as it is
              showCancelButton={true} // todo: set the flag based on who is logged in
              venue={event.venue}
              refreshFlag={refreshFlag}
              setRefreshFlag={setRefreshFlag}
            />
          ))}
        <Text style={styles.primaryHeading}>Past events</Text>
        {pastEvents.length === 0
          ? (
            <Text style={styles.infoText}>
              No past events...
            </Text>
          ) : (pastEvents.map((event, index) => (
            <OrganizationEvent
              key={index}
              organizationId={id}
              eventId={event.id}
              image={event.image}
              name={event.name}
              description={event.description}
              eventDateTime={event.eventDateTime === 0 ? 0 : new Date(event.eventDateTime.toDate())}
              showDeleteButton={true} // todo: set the flag based on who is logged in
              venue={event.venue}
              refreshFlag={refreshFlag}
              setRefreshFlag={setRefreshFlag}
            />
          )))}
        <View style={{ height: 150 }} />
      </ScrollView>
      <TouchableOpacity
        style={styles.newEventIcon}
        onPress={() => navigator.navigate('createEvent', { id })}
      >
        <FontAwesome6Icon name="plus" color="#ffffff" size={20} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  content: {
    padding: 16,
  },
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#1d1d1d',
    // These properties remove the blue highlight/underline on focus
    borderWidth: 0,
    outlineStyle: 'none', // For web if using React Native Web
  },
  clearButton: {
    padding: 4,
  },
  primaryHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  infoText: {
    fontWeight: 'light',
    color: '#555',
  },
  heading: {
    flexDirection: 'row',
    alignContent: 'space-between',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  newEventIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#389c9a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  }
});
