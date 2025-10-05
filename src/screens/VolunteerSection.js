import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Animated, TouchableWithoutFeedback, FlatList, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


const { width } = Dimensions.get('window');

export default function VolunteerSection() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('medals'); 
  const animation = useRef(new Animated.Value(0)).current;

  // Medal priority for sorting (higher number = higher priority)
  const medalPriority = {
    'gold': 3,
    'silver': 2, 
    'bronze': 1,
    'none': 0
  };

  useEffect(() => {
    navigation.setOptions({ title: 'Volunteer Network',
      headerBackground: () => (
        <LinearGradient
          colors={['#87b34eff', '#d5d5b1ff', '#87b34eff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      ),
      headerTintColor: '#5A3F2B', 
      headerTitleStyle: {
        fontWeight: 'bold',
        color: '#fff',
      },
    });
  }, [navigation]);

  // Fetch current user and profile photo
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'Volunteers', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserPhoto(data.profilePhoto || 'https://via.placeholder.com/40');
          } 
        } catch (err) {
          console.log('Error fetching profile photo:', err);
          setUserPhoto('https://via.placeholder.com/40');
        }
      } else {
        setUserPhoto(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch all volunteers from database
  useEffect(() => {
    const fetchAllVolunteers = async () => {
      try {
        setLoading(true);
        const volunteersCollection = collection(db, 'Volunteers');
        const volunteersSnapshot = await getDocs(volunteersCollection);
        
        const volunteersList = [];
        volunteersSnapshot.forEach((doc) => {
          const volunteerData = doc.data();
          volunteersList.push({
            id: doc.id,
            name: volunteerData.name || 'Unknown Volunteer',
            email: volunteerData.email || 'No email',
            profilePhoto: volunteerData.profilePhoto || 'https://via.placeholder.com/100',
            skills: volunteerData.skills || {},
            availability: volunteerData.availability || 'Unknown',
            phone: volunteerData.phone || 'Not provided',
            address: volunteerData.address || 'Not provided',
            preferredArea: volunteerData.preferredArea || 'Not specified',
            joinDate: volunteerData.joinDate || 'Recent',
            medals: volunteerData.medals || [],
            completedWorkCount: volunteerData.completedWorkCount || 0,
            pendingWorks: volunteerData.pendingWorks || []
          });
        });
        
        // Sort volunteers by medals (highest first)
        const sortedVolunteers = sortVolunteersByMedals(volunteersList);
        setVolunteers(sortedVolunteers);
      } catch (error) {
        console.error('Error fetching volunteers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllVolunteers();
  }, []);

  // Sort volunteers by medal priority
  const sortVolunteersByMedals = (volunteersList) => {
    return volunteersList.sort((a, b) => {
      const aHighestMedal = getHighestMedal(a.medals);
      const bHighestMedal = getHighestMedal(b.medals);
      
      // Sort by medal priority (highest first)
      if (medalPriority[bHighestMedal] !== medalPriority[aHighestMedal]) {
        return medalPriority[bHighestMedal] - medalPriority[aHighestMedal];
      }
      
      // If same medal level, sort by completed work count
      return (b.completedWorkCount || 0) - (a.completedWorkCount || 0);
    });
  };

  // Get the highest medal for a volunteer
  const getHighestMedal = (medals) => {
    if (medals.includes('gold')) return 'gold';
    if (medals.includes('silver')) return 'silver';
    if (medals.includes('bronze')) return 'bronze';
    return 'none';
  };

  // Get medal display text and color
  const getMedalInfo = (medals) => {
    const highestMedal = getHighestMedal(medals);
    const medalCount = medals.length;
    
    switch (highestMedal) {
      case 'gold':
        return { text: '🥇 Gold Volunteer', color: '#FFD700', level: 'gold' };
      case 'silver':
        return { text: '🥈 Silver Volunteer', color: '#C0C0C0', level: 'silver' };
      case 'bronze':
        return { text: '🥉 Bronze Volunteer', color: '#CD7F32', level: 'bronze' };
      default:
        return { text: '🌟 New Volunteer', color: '#3498db', level: 'none' };
    }
  };

  // Render medal badges
  const renderMedalBadges = (medals) => {
    if (!medals || medals.length === 0) {
      return (
        <View style={styles.medalContainer}>
          <Text style={styles.noMedalText}>No medals yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.medalContainer}>
        {medals.includes('gold') && (
          <View style={[styles.medalBadge, styles.goldMedal]}>
            <Text style={styles.medalText}>🥇</Text>
          </View>
        )}
        {medals.includes('silver') && (
          <View style={[styles.medalBadge, styles.silverMedal]}>
            <Text style={styles.medalText}>🥈</Text>
          </View>
        )}
        {medals.includes('bronze') && (
          <View style={[styles.medalBadge, styles.bronzeMedal]}>
            <Text style={styles.medalText}>🥉</Text>
          </View>
        )}
      </View>
    );
  };

  // Animate dropdown open/close
  useEffect(() => {
    Animated.timing(animation, {
      toValue: showMenu ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showMenu]);

  const handleSignOut = async () => {
    await signOut(auth);
    setShowMenu(false);
  };

  const dropdownTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const dropdownOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Add this helper function for medal ribbon colors
  const getMedalRibbonColor = (medalLevel) => {
    switch (medalLevel) {
      case 'gold': return '#FFA500'; // Orange
      case 'silver': return '#C0C0C0'; // Silver
      case 'bronze': return '#CD7F32'; // Bronze
      default: return '#6B8E23'; // Olive green for no medals
    }
  };

  const getAvailabilityColor = (isAvailable) => {
    return isAvailable ? '#6B8E23' : '#DC143C'; // Olive green or crimson
  };

  // Render each volunteer item
  const renderVolunteerItem = ({ item, index }) => {
    const medalInfo = getMedalInfo(item.medals);
    const isAvailable = item.availability === 'Available';
    
    return (
      <View style={styles.cardContainer}>
        {/* Rank Indicator */}
        <View style={styles.rankIndicator}>
          <Text style={styles.rankNumber}>{index + 1}</Text>
          <Text style={styles.rankText}>RANK</Text>
        </View>

        {/* Medal Ribbon */}
        <View style={[styles.medalRibbon, { backgroundColor: getMedalRibbonColor(medalInfo.level) }]}></View>

        {/* Availability Badge */}
        <View style={[styles.availabilityBadge, { backgroundColor: getAvailabilityColor(isAvailable) }]}></View>

        <LinearGradient colors={['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.15)']} style={styles.volunteerCard}>
          {/* Volunteer Header with Medal Info */}
          <View style={styles.cardHeader}>
            <View style={styles.profileSection}>
              <Image source={{ uri: item.profilePhoto }} style={styles.volunteerImage} />
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={16} color="#3498db" />
              </View>
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={styles.volunteerName}>{item.name}</Text>
              <Text style={[styles.volunteerTitle, { color: medalInfo.color }]}>
                {medalInfo.text}
              </Text>
              
              {/* Completed Works Count */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialIcons name="work" size={14} color="#7f8c8d" />
                  <Text style={styles.statText}>{item.completedWorkCount || 0} Completed</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="schedule" size={14} color="#7f8c8d" />
                  <Text style={styles.statText}>{item.pendingWorks?.length || 0} Pending</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Medal Badges */}
          <View style={styles.medalsDisplay}>
            {renderMedalBadges(item.medals)}
          </View>

          {/* Contact Info */}
          <View style={styles.contactSection}>
            <View style={[styles.contactItem, styles.contactItemLeft]}>
              <MaterialIcons name="email" size={16} color="#7f8c8d" />
              <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
            </View>
            <View style={[styles.contactItem, styles.contactItemRight]}>
              <MaterialIcons name="location-on" size={16} color="#7f8c8d" />
              <Text style={styles.contactText} numberOfLines={1}>{item.preferredArea}</Text>
            </View>
          </View>

          {/* Skills Section */}
          <View style={styles.skillsSection}>
            <Text style={styles.sectionTitle}>Specializations</Text>
            <View style={styles.skillsGrid}>
              {Object.entries(item.skills).map(([skill, hasSkill]) => 
                hasSkill ? (
                  <View key={skill} style={styles.skillPill}>
                    <MaterialIcons 
                      name={getSkillIcon(skill)} 
                      size={14} 
                      color="#27ae60" 
                      style={styles.skillIcon} 
                    />
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ) : null
              ).filter(Boolean)}
              {(!item.skills || Object.keys(item.skills).filter(skill => item.skills[skill]).length === 0) && (
                <Text style={styles.noSkillsText}>No skills specified</Text>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.joinDate}>Joined {item.joinDate}</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>Rank #{index + 1}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  // Helper function for skill icons
  const getSkillIcon = (skill) => {
    const icons = {
      cooking: 'restaurant',
      delivery: 'local-shipping',
      packing: 'inventory',
      driving: 'directions-car',
    };
    return icons[skill.toLowerCase()] || 'build';
  };

  return (
    <LinearGradient
      colors={['#87b34eff', '#F5F5DC', '#87b34eff']}  // Steel Blue → Midnight Blue
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBackground}>
        <ScrollView style={styles.container}>
          {/* Enhanced Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>Volunteer Network</Text>
                <Text style={styles.headerSubtitle}>Connect with our dedicated volunteers</Text>
              </View>
              
              <View style={styles.profileContainer}>
                {user ? (
                  <View style={styles.profileDropdownWrapper}>
                    <TouchableOpacity 
                      onPress={() => setShowMenu(!showMenu)} 
                      style={styles.profileButton}
                    >
                      <Image source={{ uri: userPhoto }} style={styles.profileImage} />
                      <View style={styles.onlineIndicator} />
                    </TouchableOpacity>

                    <Modal
                      transparent={true}
                      visible={showMenu}
                      animationType="fade"
                      onRequestClose={() => setShowMenu(false)}
                    >
                      <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                        <View style={styles.modalOverlay}>
                          <View style={styles.modalDropdownMenu}>
                            <TouchableOpacity
                              onPress={() => {
                                setShowMenu(false);
                                navigation.navigate('volunteerProfile');
                              }}
                              style={[styles.dropdownButton, styles.profileDropdownButton]}
                            >
                              <MaterialIcons name="person" size={20} color="#333" style={styles.dropdownIcon} />
                              <Text style={styles.dropdownButtonText}>My Profile</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={handleSignOut}
                              style={[styles.dropdownButton, styles.logoutDropdownButton]}
                            >
                              <MaterialIcons name="logout" size={20} color="#fff" style={styles.dropdownIcon} />
                              <Text style={[styles.dropdownButtonText, styles.logoutDropdownText]}>Sign Out</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableWithoutFeedback>
                    </Modal>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.loginButton} 
                    onPress={() => navigation.navigate('volunteerLogin')}
                  >
                    <Text style={styles.loginText}>Join Us</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Stats Overview */}
            <View style={styles.statsOverview}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{volunteers.length}</Text>
                <Text style={styles.statLabel}>Total Volunteers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, styles.goldStat]}>
                  {volunteers.filter(v => v.medals?.includes('gold')).length}
                </Text>
                <Text style={styles.statLabel}>Gold 🥇</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, styles.silverStat]}>
                  {volunteers.filter(v => v.medals?.includes('silver')).length}
                </Text>
                <Text style={styles.statLabel}>Silver 🥈</Text>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <MaterialIcons name="people" size={60} color="#3498db" />
                <Text style={styles.loadingTitle}>Loading Volunteers</Text>
                <Text style={styles.loadingSubtitle}>Connecting to our network...</Text>
              </View>
            ) : volunteers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="group-off" size={80} color="#bdc3c7" />
                <Text style={styles.emptyTitle}>No Volunteers Yet</Text>
                <Text style={styles.emptySubtitle}>Be the first to join our volunteer network!</Text>
                <TouchableOpacity 
                  style={styles.ctaButton}
                  onPress={() => navigation.navigate('volunteerLogin')}
                >
                  <Text style={styles.ctaText}>Become a Volunteer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={volunteers}
                renderItem={renderVolunteerItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={
                  <View style={styles.listHeader}>
                    <Text style={styles.listTitle}>Volunteer Leaderboard</Text>
                    <Text style={styles.listSubtitle}>
                      Ranked by achievements and contributions
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </ScrollView>
      
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: { 
    flex: 1, 
  },
  
  // ========== HEADER STYLES ==========
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#5A3F2B',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B8E23',
    fontWeight: '600',
    opacity: 0.9,
  },

  // ========== STATS OVERVIEW ==========
  statsOverview: {
    flexDirection: 'row',
    backgroundColor: '#4682B4',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#2C5282',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -0.5,
  },
  goldStat: {
    color: '#FFA500',
    textShadowColor: 'rgba(255,165,0,0.4)',
  },
  silverStat: {
    color: '#F5F5F5',
    textShadowColor: 'rgba(0,0,0,0.2)',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 2,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
  },

  // ========== SORTING OPTIONS ==========
  sortingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#F0EDE5',
  },
  sortingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5A3F2B',
    marginRight: 16,
    letterSpacing: 0.2,
  },
  sortButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FAF8F3',
    borderWidth: 2,
    borderColor: '#E8E0D5',
    marginRight: 10,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeSortButton: {
    backgroundColor: '#6B8E23',
    borderColor: '#5A7A1A',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#5A3F2B',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  activeSortText: {
    color: '#FFFFFF',
  },

  // ========== CONTENT AREA ==========
  content: {
    flex: 1,
    paddingTop: 12,
    backgroundColor: '#F5F5RD', // Beige from palette
  },
  listContainer: {
    paddingBottom: 24,
  },

  // ========== VOLUNTEER CARD ==========
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    position: 'relative',
  },
  volunteerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },

  // ========== RANK INDICATOR ==========
  rankIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: '#6B8E23',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#5A7A1A',
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rankText: {
    fontSize: 10,
    color: '#E8F4E8',
    fontWeight: '600',
    marginTop: 2,
  },

  // ========== MEDAL RIBBON ==========
  medalRibbon: {
    position: 'absolute',
    top: 20,
    right: -30,
    paddingHorizontal: 35,
    paddingVertical: 8,
    transform: [{ rotate: '45deg' }],
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // ========== AVAILABILITY BADGE ==========
  availabilityBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ========== CARD HEADER ==========
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  profileSection: {
    position: 'relative',
    marginRight: 16,
  },
  volunteerImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#4682B4',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#5A3F2B',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  volunteerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.2,
  },

  // ========== STATS ROW ==========
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F5F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#E8E0D5',
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statText: {
    fontSize: 12,
    color: '#5A3F2B',
    fontWeight: '600',
    marginLeft: 6,
  },

  // ========== MEDAL BADGES ==========
  medalsDisplay: {
    marginBottom: 18,
  },
  medalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  medalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  goldMedal: {
    backgroundColor: '#FFF8E7',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  silverMedal: {
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  bronzeMedal: {
    backgroundColor: '#F5E6D3',
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  medalText: {
    fontSize: 16,
    marginLeft: 2,
  },
  noMedalText: {
    fontSize: 13,
    color: '#A89C8B',
    fontStyle: 'italic',
    fontWeight: '500',
  },

  // ========== CONTACT SECTION ==========
  contactSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F5F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#E8E0D5',
  },
  contactItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  contactItemLeft: {
    borderRightWidth: 2,
    borderRightColor: '#D4C9B8',
    paddingRight: 12,
    marginRight: 12,
  },
  contactText: {
    fontSize: 12,
    color: '#5A3F2B',
    marginLeft: 8,
    flex: 1,
    fontWeight: '600',
  },

  // ========== SKILLS SECTION ==========
  skillsSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5A3F2B',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4E8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#C8E0C8',
    shadowColor: '#6B8E23',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  skillIcon: {
    marginRight: 6,
  },
  skillText: {
    fontSize: 12,
    color: '#5A7A1A',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  noSkillsText: {
    fontSize: 13,
    color: '#A89C8B',
    fontStyle: 'italic',
    fontWeight: '500',
  },

  // ========== CARD FOOTER ==========
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#F0EDE5',
  },
  joinDate: {
    fontSize: 12,
    color: '#8A7B6B',
    fontWeight: '600',
  },
  rankBadge: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#2C5282',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  // ========== LIST HEADER ==========
  listHeader: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F0EDE5',
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#5A3F2B',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  listSubtitle: {
    fontSize: 14,
    color: '#6B8E23',
    lineHeight: 20,
    fontWeight: '600',
  },

  // ========== LOADING & EMPTY STATES ==========
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F5F5RD', // Beige from palette
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5A3F2B',
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  loadingSubtitle: {
    fontSize: 15,
    color: '#6B8E23',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F5F5RD', // Beige from palette
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8A7B6B',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#A89C8B',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    fontWeight: '500',
  },
  ctaButton: {
    backgroundColor: '#6B8E23',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#4A6815',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },

  // ========== PROFILE DROPDOWN ==========
  profileContainer: {
    alignItems: 'flex-end',
  },
  profileButton: {
    position: 'relative',
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#4682B4',
    shadowColor: '#2C5282',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#6B8E23',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#6B8E23',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  loginButton: {
    marginTop: 5,
    marginLeft: 2,
    backgroundColor: '#4682B4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#2C5282',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(90, 63, 43, 0.15)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 110,
    paddingRight: 20,
  },
  modalDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 12,
    shadowColor: '#5A3F2B',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    paddingVertical: 10,
    width: 190,
    borderWidth: 2,
    borderColor: '#F0EDE5',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  profileDropdownButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#F8F5F0',
  },
  logoutDropdownButton: {
    backgroundColor: '#DC143C',
    marginTop: 6,
    marginHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: '#5A3F2B',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  logoutDropdownText: {
    color: '#FFFFFF',
  },
});