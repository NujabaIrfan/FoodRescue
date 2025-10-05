import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import DonationRequest from '../components/DonationRequest';
import OrganizationEvent from '../components/OrganizationEvent';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { auth } from '../../firebaseConfig';
import Toast from 'react-native-toast-message';

const Organization = ({ route }) => {
  const { currentUser } = auth
  const navigator = useNavigation();
  const [organizationData, setOrganizationData] = useState(null)
  const [isShowingFullDescription, setIsShowingFullDescription] = useState(false);
  const [isFetchError, setIsFetchError] = useState(false)
  const { id } = route.params
  if (!id) return (
    <View>
      <Text>What</Text>
    </View>
  )

  const hasAdminRights = !!(currentUser && (organizationData?.orgDetails?.members || [])
    .find(member => member.id === currentUser.uid && (member.role === "owner" || member.role === "manager")))

  useEffect(() => {
    (async () => {
      try {
        const res = await getDoc(doc(db, "Organizations", id))
        if (!res.exists()) return setIsFetchError(true)

        const data = res.data()

        // fetch members subcollection
        const membersSnap = await getDocs(collection(db, "Organizations", id, "members"))
        const members = membersSnap.docs.map(m => ({
          id: m.id,
          ...m.data()
        }))

        // fetch events subcollection
        const eventsSnap = await getDocs(collection(db, "Organizations", id, "events"))
        const events = eventsSnap.docs.map(e => ({
          id: e.id,
          ...e.data()
        }))

        setOrganizationData({
          name: data.name,
          description: data.description,
          image: data.image,
          orgDetails: {
            members,
            memberCount: members.length,
            createdDate: data.createdDate
          },
          events
        })
      } catch (err) {
        console.error(err)
        setIsFetchError(true)
      }
    })()
  }, [id])


  if (isFetchError) return Toast.show({
    type: "error",
    text1: "Cannot fetch the organization"
  });

  if (!organizationData) return // initial render (before fetch)

  return (
    <ScrollView style={styles.content}>
      <View style={styles.organizationHeader}>
        {organizationData.image ? (
          <Image
            source={{ uri: organizationData.image }}
            style={styles.organizationImage}
          />
        ) : (
          <Icon name="building-ngo" size={60} color="#606060" />
        )}
        <View>
          <Text style={styles.primaryHeading}>{organizationData.name}</Text>
          <Text style={styles.infoText}>
            Created on{' '}
            {organizationData.orgDetails.createdDate.toDate().toLocaleDateString()}
          </Text>
          <Text style={styles.infoText}>
            {organizationData.orgDetails.memberCount || 0} members
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => navigator.navigate("organizationVolunteers", { id })}>
            <Text style={styles.buttonText}>View members</Text>
          </TouchableOpacity>
          {hasAdminRights && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigator.navigate("organizationSettings", { id })}
            >
              <Text style={styles.buttonText}>View settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text
        style={[styles.infoText, { marginTop: 8, marginBottom: 8 }]}
        numberOfLines={isShowingFullDescription ? null : 4}
        ellipsizeMode="head"
        onPress={() => setIsShowingFullDescription(!isShowingFullDescription)}
      >
        {organizationData.description}
      </Text>
      <View style={styles.heading}>
        <Text style={styles.primaryHeading}>Events</Text>
        {hasAdminRights && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigator.navigate('organizationEvents', { id })}
          >
            <Text style={styles.buttonText}>Manage events</Text>
          </TouchableOpacity>
        )}
      </View>

      {organizationData.events.map((event, index) => (
        <OrganizationEvent
          key={index}
          image={event.image}
          name={event.name}
          description={event.description}
          eventDateTime={event.eventDateTime === 0 ? 0 : new Date(event.eventDateTime.toDate())}
          venue={event.venue}
        />
      ))}

      <View style={styles.heading}>
        <Text style={styles.primaryHeading}>Requests</Text>
        {hasAdminRights && (
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Manage requests</Text>
          </TouchableOpacity>
        )}
      </View>
      <DonationRequest />
      <DonationRequest />
      <DonationRequest />
      <DonationRequest />
      <DonationRequest />
      <DonationRequest />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  organizationImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  organizationHeader: {
    flexDirection: 'row',
    gap: 10,
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
});

export default Organization;
