import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { db } from "../../firebaseConfig";
import { Keyboard } from "react-native";

const memberSearchMode = {
  ALL: 0,
  MANAGER: 1,
  MEMBER: 2,
  INVITED: 3
}

const memberRoles = {
  owner: 1,
  manager: 1,
  member: 2
}

function OrganizationVolunteer({ memberId, member }) {

  /*const [userMember, setUserMember] = useState(null)

  useEffect(() => {
    (async () => {
      const res = await getDoc(doc(db, "Volunteers", memberId))
      setUserMember(res.data())
    })()
  }, [memberId])

  if (!userMember) {
    console.log("Cannot fetch user member")
    return null
  }*/

  return (
    <View style={styles.volunteerUser}>
      <View style={StyleSheet.compose({
        flexDirection: "row",
        gap: 10,
        alignItems: "center"
      })}>
        <Image source={{ uri: member.profilePhoto }} style={styles.profileImage} />
        <View>
          <Text>{member.name}</Text>
          <Text style={styles.filterText}>Member since {member.joinedDate.toDate().toLocaleDateString()}</Text>
        </View>
      </View>
      <View>
        <Text style={styles.filterText}>{member.role}</Text>
      </View>
    </View>
  )
}

export default function OrganizationVolunteers({ route }) {

  const { id } = route.params

  const [searchQuery, setSearchQuery] = useState("")
  const [activeSearchMode, setActiveSearchMode] = useState(memberSearchMode.ALL)
  const [isFetchError, setIsFetchError] = useState(false)
  const [organizationData, setOrganizationData] = useState({
    owner: null,
    members: []
  })

  const clearSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss(); // Dismiss keyboard when clearing search
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getDoc(doc(db, "Organizations", id))
        if (!res.exists()) return setIsFetchError(true)

        const data = res.data()

        const membersSnap = await getDocs(collection(db, "Organizations", id, "members"))

        const membersWithData = await Promise.all(
          membersSnap.docs.map(async (m) => {
            const memberData = m.data()
            const userSnap = await getDoc(doc(db, "Volunteers", m.id))
            return {
              id: m.id,
              ...memberData,
              name: userSnap.exists() ? userSnap.data().name : "Unknown",
              profilePhoto: userSnap.exists() ? userSnap.data().profilePhoto : null
            }
          })
        )

        setOrganizationData({
          owner: data.user,
          members: membersWithData
        })
      } catch (err) {
        console.error(err)
        setIsFetchError(true)
      }
    })()
  }, [id])


  const filteredMembers = (organizationData?.members || [])
    .filter(member =>
      (searchQuery.length > 0 ? member?.name?.toLowerCase()?.includes(searchQuery.trim().toLowerCase()) : true)
      && (activeSearchMode === memberSearchMode.ALL ? true : memberRoles[member.role] === activeSearchMode)
    )

  return (
    <View style={styles.container}>
      <ScrollView>
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
              placeholder="Search for members..."
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
                activeSearchMode === memberSearchMode.ALL && styles.activeFilter
              ]}
              onPress={() => setActiveSearchMode(memberSearchMode.ALL)}
            >
              <Text style={[
                styles.filterText,
                activeSearchMode === memberSearchMode.ALL && styles.activeFilterText
              ]}
              >All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeSearchMode === memberSearchMode.MANAGER && styles.activeFilter
              ]}
              onPress={() => setActiveSearchMode(memberSearchMode.MANAGER)}
            >
              <Text style={[
                styles.filterText,
                activeSearchMode === memberSearchMode.MANAGER && styles.activeFilterText
              ]}
              >Managers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeSearchMode === memberSearchMode.MEMBER && styles.activeFilter
              ]}
              onPress={() => setActiveSearchMode(memberSearchMode.MEMBER)}
            >
              <Text style={[
                styles.filterText,
                activeSearchMode === memberSearchMode.MEMBER && styles.activeFilterText
              ]}
              >Members
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeSearchMode === memberSearchMode.INVITED && styles.activeFilter
              ]}
              onPress={() => setActiveSearchMode(memberSearchMode.INVITED)}
            >
              <Text style={[
                styles.filterText,
                activeSearchMode === memberSearchMode.INVITED && styles.activeFilterText
              ]}
              >Invited
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredMembers.length} member
            {filteredMembers.length !== 1 ? 's' : ''} found
          </Text>
        </View>
        <View style={styles.memberSection}>
          {filteredMembers.map((member, index) => (
            <OrganizationVolunteer
              key={index}
              memberId={member.id}
              member={member}
            />
          ))}
        </View>
      </ScrollView>
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
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#4682B4', // Steel blue
  },
  volunteerUser: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 5,
    padding: 8,
    paddingBottom: 15,
    borderBottomColor: "#777777",
    borderBottomWidth: 0.5
  },
  memberSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 5,
    shadowColor: '#1d1d1d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  }
})