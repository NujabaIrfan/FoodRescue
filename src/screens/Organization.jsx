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
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

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
};

const Organization = () => {
  const organizationData = dummyData;
  const navigator = useNavigation();
  const [isShowingFullDescription, setIsShowingFullDescription] =
    useState(false);

  return (
    <ScrollView style={styles.content}>
      <View style={styles.organizationHeader}>
        {organizationData.image ? (
          <Image
            source={organizationData.image}
            style={styles.organizationImage}
          />
        ) : (
          <Icon name="building-ngo" size={60} color="#606060" />
        )}
        <View>
          <Text style={styles.primaryHeading}>{organizationData.name}</Text>
          <Text style={styles.infoText}>
            Created on{' '}
            {new Date(
              organizationData.orgDetails.createdDate
            ).toLocaleDateString()}
          </Text>
          <Text style={styles.infoText}>
            {organizationData.orgDetails.memberCount} members
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
      <OrganizationEvent />
      <OrganizationEvent />
      <OrganizationEvent />
      <OrganizationEvent />
      <OrganizationEvent />
      <OrganizationEvent />
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
