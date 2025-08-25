import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';

const OrganizationCard = ({ name, image, joinedDetails, orgDetails }) => {
  return (
    <View style={styles.card}>
      <View style={styles.organization}>
        <View style={styles.organizationDetails}>
          {image ? (
            <Image style={styles.organizationImage} source={image} />
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
                  {new Date(joinedDetails.joinedDate).toLocaleDateString()}
                </Text>
              </View>
            ) : (
              <View>
                <Text style={styles.infoText}>
                  {orgDetails.memberCount} members
                </Text>
                <Text style={styles.infoText}>
                  Created on{' '}
                  {new Date(orgDetails.createdDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ margin: 10 }}>
          {!joinedDetails && (
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Join</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
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
