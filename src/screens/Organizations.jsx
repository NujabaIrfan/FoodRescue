import { useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6Icon from 'react-native-vector-icons/FontAwesome6';
import OrganizationCard from '../components/OrganizationCard';
import { useNavigation } from '@react-navigation/native';

// temporary data
const dummyData = [
  {
    name: 'Food Helpers',
    image: null,
    orgDetails: {
      memberCount: 45,
      createdDate: Date.now() - 1000 * 60 * 60 * 24 * 200, // 200 days ago
    },
  },
  {
    name: 'Green Plate',
    image:
      'https://static.vecteezy.com/system/resources/thumbnails/005/380/829/small/group-of-hands-holding-together-free-photo.JPG',
    joinedDetails: {
      joinedDate: Date.now() - 1000 * 60 * 60 * 24 * 60, // 60 days ago
      position: 'Coordinator',
    },
    orgDetails: {
      memberCount: 150,
      createdDate: Date.now() - 1000 * 60 * 60 * 24 * 500, // 500 days ago
    },
  },
  {
    name: 'Rescue Meals',
    image:
      'https://static.vecteezy.com/system/resources/thumbnails/005/380/829/small/group-of-hands-holding-together-free-photo.JPG',
    orgDetails: {
      memberCount: 30,
      createdDate: Date.now() - 1000 * 60 * 60 * 24 * 100, // 100 days ago
    },
  },
  {
    name: 'NGO B',
    image: null,
    orgDetails: {
      memberCount: 99,
      createdDate: Date.now() - 1000 * 60 * 60 * 24 * 365, // 1 year ago
    },
  },
  {
    name: 'NGO C',
    image: null,
    orgDetails: {
      memberCount: 99,
      createdDate: Date.now() - 1000 * 60 * 60 * 24 * 365, // 1 year ago
    },
  },
  {
    name: 'NGO D',
    image: null,
    orgDetails: {
      memberCount: 99,
      createdDate: Date.now() - 1000 * 60 * 60 * 24 * 365, // 1 year ago
    },
  },
  {
    name: 'NGO E',
    image: null,
    orgDetails: {
      memberCount: 99,
      createdDate: Date.now() - 1000 * 60 * 60 * 24 * 365, // 1 year ago
    },
  },
  {
    name: 'NGO F',
    image: null,
    joinedDetails: {
      joinedDate: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
      position: 'Member',
    },
  },
];

const organizationSearchMode = {
  ALL: 0,
  MY: 1,
  OTHER: 2,
};

const Organizations = () => {
  const navigator = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(organizationSearchMode.ALL);
  let organizationData = dummyData;
  organizationData = organizationData.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const myOrganizations = organizationData.filter(
    (organization) => !!organization.joinedDetails
  );
  const otherOrganizations = organizationData.filter(
    (organization) => !organization.joinedDetails
  );

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
        <ScrollView horizontal={true}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              viewMode === organizationSearchMode.ALL && styles.activeFilter,
            ]}
            onPress={() => setViewMode(organizationSearchMode.ALL)}
          >
            <Text
              style={[
                styles.filterText,
                viewMode === organizationSearchMode.ALL &&
                  styles.activeFilterText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              viewMode === organizationSearchMode.MY && styles.activeFilter,
            ]}
            onPress={() => setViewMode(organizationSearchMode.MY)}
          >
            <Text
              style={[
                styles.filterText,
                viewMode === organizationSearchMode.MY &&
                  styles.activeFilterText,
              ]}
            >
              My organizations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              viewMode === organizationSearchMode.OTHER && styles.activeFilter,
            ]}
            onPress={() => setViewMode(organizationSearchMode.OTHER)}
          >
            <Text
              style={[
                styles.filterText,
                viewMode === organizationSearchMode.OTHER &&
                  styles.activeFilterText,
              ]}
            >
              Available
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <ScrollView style={styles.content}>
        {(viewMode === organizationSearchMode.ALL ||
          viewMode === organizationSearchMode.MY) && (
          <View>
            <Text style={styles.primaryHeading}>My Organizations</Text>
            {searchQuery.length > 0 && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsText}>
                  {myOrganizations.length} restaurant
                  {myOrganizations.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            )}
            {myOrganizations.map((org, index) => (
              <OrganizationCard
                key={index}
                name={org.name}
                image={org.image}
                joinedDetails={org.joinedDetails}
                orgDetails={org.orgDetails}
              />
            ))}
          </View>
        )}
        {(viewMode === organizationSearchMode.ALL ||
          viewMode === organizationSearchMode.OTHER) && (
          <View>
            <Text style={styles.primaryHeading}>Discover</Text>
            {searchQuery.length > 0 && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsText}>
                  {otherOrganizations.length} restaurant
                  {otherOrganizations.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            )}
            {otherOrganizations.map((org, index) => (
              <OrganizationCard
                key={index}
                name={org.name}
                image={org.image}
                orgDetails={org.orgDetails}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <TouchableOpacity
        style={styles.newOrganizationIcon}
        onPress={() => navigator.navigate('createOrganization')}
      >
        <FontAwesome6Icon name="plus" color="#ffffff" size={20} />
      </TouchableOpacity>
    </View>
  );
};

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
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  activeFilter: {
    backgroundColor: '#389c9a',
  },
  filterText: {
    color: '#555',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e6f7f7',
    marginBottom: 8,
  },
  resultsText: {
    color: '#389c9a',
    fontSize: 14,
  },
  newOrganizationIcon: {
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
  },
});

export default Organizations;
