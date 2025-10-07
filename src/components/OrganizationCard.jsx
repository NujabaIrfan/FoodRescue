import { useNavigation } from '@react-navigation/native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { auth, db } from '../../firebaseConfig';
import { arrayUnion, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

const OrganizationCard = ({ name, image, joinedDetails, orgDetails, id }) => {

  const { currentUser } = auth

  const navigator = useNavigation()

  const joinOrganization = async () => {
    if (!currentUser) return console.error("Not logged in")
    let organizationRef = doc(db, "Organizations", id)
    // add member
    await setDoc(doc(organizationRef, "members", currentUser.uid), {
      joinedDate: serverTimestamp(),
      role: "member"
    })
    navigator.navigate("organization", { id })
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigator.navigate("organization", { id })}
      activeOpacity={0.8}
    >
      <View style={styles.organization}>
        <View style={styles.organizationDetails}>
          {image ? (
            <Image style={styles.organizationImage} source={typeof image === "string" ? { uri: image } : image} />
          ) : (
            <View style={{ padding: 20 }}>
              <Icon name="building-ngo" size={60} color="#606060" />
            </View>
          )}

          <View>
            <Text style={styles.organizationName}>{name}</Text>
            {joinedDetails ? (
              <View>
                <Text style={styles.infoText}>{joinedDetails.position}</Text>
                <Text style={styles.infoText}>
                  Joined on{' '}
                  {joinedDetails?.joinedDate?.toLocaleDateString()}
                </Text>
              </View>
            ) : (
              <View>
                <Text style={styles.infoText}>
                  {orgDetails.memberCount || 0} members
                </Text>
                <Text style={styles.infoText}>
                  Created on{' '}
                  {orgDetails?.createdDate?.toDate()?.toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ margin: 10 }}>
          {(!joinedDetails && currentUser) && (
            <TouchableOpacity style={styles.button} onPress={joinOrganization}>
              <Text style={styles.buttonText}>Join</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
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
  },
  organization: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  organizationDetails: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  organizationImage: {
    width: 75,
    height: 75,
    margin: 5,
    borderRadius: 11,
  },
  organizationName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  infoText: {
    fontWeight: 'light',
    color: '#555',
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

export default OrganizationCard;
