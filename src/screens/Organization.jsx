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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Toast from 'react-native-toast-message';

const dummyData = {
  name: 'Green Plate',
  description:
    'lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis maximus consequat purus, eget lacinia ipsum ultrices eu. Proin eu ex nec dolor suscipit iaculis eget et quam. Nullam vestibulum eros sit amet lacinia lacinia. Cras sed sem dolor. Quisque cursus at velit eu lacinia. Morbi aliquet risus tempus tincidunt malesuada. Mauris vitae turpis feugiat, vulputate justo a, finibus sapien. Nulla fermentum vestibulum dolor sit amet pulvinar. Nullam suscipit facilisis magna, vel pulvinar turpis lobortis a.',
  image:
    'https://static.vecteezy.com/system/resources/thumbnails/005/380/829/small/group-of-hands-holding-together-free-photo.JPG',

  orgDetails: {
    memberCount: 150,
    createdDate: Date.now() - 1000 * 60 * 60 * 24 * 500, // 500 days ago
  },
  events: [
    {
      eventName: 'Community Food Drive',
      venue: 'Colombo, Sri Lanka',
      datetime: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=80',
    },
    {
      eventName: 'Meal Distribution',
      venue: 'Kandy, Sri Lanka',
      datetime: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
      image:
        'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=500&q=80',
    },
    {
      eventName: 'Charity Lunch',
      venue: 'Galle, Sri Lanka',
      datetime: Date.now() - 1000 * 60 * 60 * 24 * 60, // 60 days ago
      image:
        'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=500&q=80',
    },
    {
      eventName: 'Food Rescue Workshop',
      venue: 'Jaffna, Sri Lanka',
      datetime: Date.now() - 1000 * 60 * 60 * 24 * 90, // 90 days ago
      image:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q',
    },
  ],
};

const Organization = ({ route }) => {  
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

  useEffect(() => {
    (async () => {
      let res = await getDoc(doc(db, "Organizations", id))
      if (!res) return setIsFetchError(true)
      let data = res.data()
      setOrganizationData({
        name: data.name,
        description: data.description,
        image: data.image,
        orgDetails: {
          members: data.members,
          memberCount: data.members.length,
          createdDate: data.createdDate
        },
        events: []
      })
    })()
  }, [])

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
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigator.navigate('createEvent')}
        >
          <Text style={styles.buttonText}>Manage events</Text>
        </TouchableOpacity>
      </View>

      {organizationData.events.map((event, index) => (
        <OrganizationEvent
          key={index}
          image={event.image}
          eventName={event.eventName}
          datetime={new Date(event.datetime)}
          venue={event.venue}
        />
      ))}

      <View style={styles.heading}>
        <Text style={styles.primaryHeading}>Requests</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Manage requests</Text>
        </TouchableOpacity>
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
