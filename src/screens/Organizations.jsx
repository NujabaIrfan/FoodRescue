import { useEffect, useState } from 'react';
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
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { collection, getDocs, Query } from 'firebase/firestore';

const organizationSearchMode = {
  ALL: 0,
  MY: 1,
  OTHER: 2,
};

const Organizations = () => {
  const isFocused = useIsFocused()
  const navigator = useNavigation();
  const [organizationsData, setOrganizationsData] = useState([])
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(organizationSearchMode.ALL);

  const { currentUser } = auth

  useEffect(() => {
    (async () => {
      const orgSnap = await getDocs(collection(db, "Organizations"))

      const orgs = await Promise.all(
        orgSnap.docs.map(async (orgDoc) => {
          const d = orgDoc.data()

          // get members subcollection
          const membersSnap = await getDocs(collection(db, "Organizations", orgDoc.id, "members"))

          const members = membersSnap.docs.map(m => ({
            id: m.id,
            ...m.data()
          }))

          let joinedDetails = members.find((member) => member.id === currentUser?.uid)
          joinedDetails = {
            position: joinedDetails?.role,
            joinedDate: joinedDetails?.joinedDate?.toDate()
          }

          return {
            name: d.name,
            image: d.image,
            id: orgDoc.id,
            orgDetails: {
              founder: d.user,
              createdDate: d.createdDate,
              members,
              memberCount: members.length
            },
            joinedDetails
          }
        })
      )
      setOrganizationsData(orgs)
    })()
  }, [currentUser, useIsFocused])


  const searchFilteredOrganizations = organizationsData
    .filter((org) => org?.name?.toLowerCase()?.includes(searchQuery.trim().toLowerCase()));
  const myOrganizations = currentUser
    ? searchFilteredOrganizations
      .filter((org) => (org?.orgDetails?.members || []).some(user => user.id === currentUser.uid))
    : []
  const otherOrganizations = currentUser
    ? searchFilteredOrganizations
      .filter((org) => !(org?.orgDetails?.members || []).some(user => user.id === currentUser.uid))
    : searchFilteredOrganizations

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
                    {myOrganizations.length} organization
                    {myOrganizations.length !== 1 ? 's' : ''} found
                  </Text>
                </View>
              )}
              {myOrganizations.length === 0 ? (
                <Text style={styles.filterText}>
                  Join an organization and it will appear here.
                </Text>
              ) :
                myOrganizations.map((org, index) => (
                  <OrganizationCard
                    key={index}
                    name={org.name}
                    image={org.image}
                    id={org.id}
                    joinedDetails={org.joinedDetails || {}}
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
                    {otherOrganizations.length} organization
                    {otherOrganizations.length !== 1 ? 's' : ''} found
                  </Text>
                </View>
              )}
              {otherOrganizations.length === 0 ? (
                <Text style={styles.filterText}>
                  No organizations to display
                </Text>
              ) : otherOrganizations.map((org, index) => (
                <OrganizationCard
                  key={index}
                  name={org.name}
                  image={org.image}
                  id={org.id}
                  orgDetails={org.orgDetails || {}}
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
