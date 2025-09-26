import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Animated, TouchableWithoutFeedback, FlatList, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Modal } from 'react-native';

const { width } = Dimensions.get('window');

export default function VolunteerSection() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('medals'); // Default sort by medals
  const animation = useRef(new Animated.Value(0)).current;

  // Medal priority for sorting (higher number = higher priority)
  const medalPriority = {
    'gold': 3,
    'silver': 2, 
    'bronze': 1,
    'none': 0
  };

  useEffect(() => {
    navigation.setOptions({ title: 'Volunteer Network' });
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
            // ✅ ADD MEDAL-RELATED DATA
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

        <View style={styles.volunteerCard}>
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
        </View>
      </View>
    );
  };

  // Add sorting options
  const SortingOptions = () => (
    <View style={styles.sortingContainer}>
      <Text style={styles.sortingTitle}>Sort by:</Text>
      <TouchableOpacity 
        style={[styles.sortButton, sortBy === 'medals' && styles.activeSortButton]}
        onPress={() => setSortBy('medals')}
      >
        <Text style={[styles.sortButtonText, sortBy === 'medals' && styles.activeSortText]}>
          🏆 Medals
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.sortButton, sortBy === 'completed' && styles.activeSortButton]}
        onPress={() => setSortBy('completed')}
      >
        <Text style={[styles.sortButtonText, sortBy === 'completed' && styles.activeSortText]}>
          ✅ Completed Works
        </Text>
      </TouchableOpacity>
    </View>
  );

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
    <View style={styles.container}>
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

      {/* Sorting Options */}
      <SortingOptions />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5DC', // Beige background from palette
  },
  
  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#5A3F2B', // Brown shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#5A3F2B', // Brown text
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B8E23', // Olive green
    fontWeight: '500',
  },

  // Enhanced Stats Overview
  statsOverview: {
    flexDirection: 'row',
    backgroundColor: '#4682B4', // Steel blue from palette
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(90,63,43,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  goldStat: {
    color: '#FFA500', // Orange gold from palette
    textShadowColor: 'rgba(255,165,0,0.3)',
  },
  silverStat: {
    color: '#F5F5F5',
    textShadowColor: 'rgba(245,245,245,0.3)',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Enhanced Sorting Options
  sortingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  sortingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A3F2B',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5DC', // Beige
    borderWidth: 1,
    borderColor: '#D4C9B8',
    marginRight: 8,
  },
  activeSortButton: {
    backgroundColor: '#6B8E23', // Olive green
    borderColor: '#5A7A1A',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#5A3F2B',
    fontWeight: '600',
  },
  activeSortText: {
    color: '#FFFFFF',
  },

  // Content Area
  content: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#F5F5DC',
  },

  // Enhanced Volunteer Card
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    position: 'relative',
  },
  volunteerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 0,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },

  // Rank Indicator (Left Side)
  rankIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: '#6B8E23', // Olive green
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

  // Medal Ribbon (Top Right)
  medalRibbon: {
    position: 'absolute',
    top: 15,
    right: -25,
    paddingHorizontal: 30,
    paddingVertical: 6,
    transform: [{ rotate: '45deg' }],
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Availability Badge
  availabilityBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Card Content (Shifted for rank indicator)
  cardContent: {
    marginLeft: 50,
    padding: 20,
  },

  // Enhanced Card Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    borderColor: '#4682B4', // Steel blue border
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
    fontSize: 18,
    fontWeight: '700',
    color: '#5A3F2B', // Brown text
    marginBottom: 2,
  },
  volunteerTitle: {
    fontSize: 13,
    color: '#4682B4', // Steel blue
    fontWeight: '600',
    marginBottom: 6,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F5F0', // Light beige
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  statItemHorizontal: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 4,
  },
  statNumberHorizontal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A3F2B',
    marginBottom: 2,
  },
  statLabelHorizontal: {
    fontSize: 10,
    color: '#6B8E23', // Olive green
    fontWeight: '600',
  },
  statDividerHorizontal: {
    width: 1,
    height: 40,
    backgroundColor: '#D4C9B8',
    marginHorizontal: 10,
  },

  // Medal Badges
  medalsSection: {
    marginBottom: 16,
  },
  medalsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A3F2B',
    marginBottom: 8,
  },
  medalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  medalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  goldMedal: {
    backgroundColor: '#FFF4E0', // Light orange
    borderWidth: 1,
    borderColor: '#FFA500', // Orange gold
  },
  silverMedal: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#C0C0C0',
  },
  bronzeMedal: {
    backgroundColor: '#F5E6D3', // Light bronze
    borderWidth: 1,
    borderColor: '#CD7F32',
  },
  medalText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: '#5A3F2B',
  },
  noMedalsContainer: {
    padding: 12,
    backgroundColor: '#F8F5F0',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  noMedalText: {
    fontSize: 12,
    color: '#8A7B6B',
    fontStyle: 'italic',
  },

  // Skills Section
  skillsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A3F2B',
    marginBottom: 8,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4E8', // Light olive green
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4E8D4',
  },
  skillIcon: {
    marginRight: 4,
  },
  skillText: {
    fontSize: 11,
    color: '#6B8E23', // Olive green
    fontWeight: '600',
  },
  noSkillsText: {
    fontSize: 12,
    color: '#8A7B6B',
    fontStyle: 'italic',
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E0D5',
  },
  joinDate: {
    fontSize: 11,
    color: '#8A7B6B',
    fontWeight: '500',
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4682B4', // Steel blue
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  performanceText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // List Header
  listHeader: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
  },
  listTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#5A3F2B',
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 13,
    color: '#6B8E23',
    lineHeight: 18,
  },

  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F5F5DC',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5A3F2B',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#6B8E23',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F5F5DC',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8A7B6B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A89C8B',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#6B8E23', // Olive green
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  contactSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F5F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  contactItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  contactItemLeft: {
    borderRightWidth: 1,
    borderRightColor: '#D4C9B8',
    paddingRight: 12,
    marginRight: 12,
  },
  contactItemRight: {
    // No border for the right item
  },
  contactText: {
    fontSize: 12,
    color: '#5A3F2B',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  
  // Profile dropdown styles
  profileContainer: {
    alignItems: 'flex-end',
  },
  profileButton: {
    position: 'relative',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#4682B4', // Steel blue
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6B8E23', // Olive green
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(90, 63, 43, 0.1)', // Brown tint
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 110,
    paddingRight: 20,
  },
  modalDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#5A3F2B',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    paddingVertical: 8,
    width: 180,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  profileDropdownButton: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logoutDropdownButton: {
    backgroundColor: '#DC143C', // Crimson from palette
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#5A3F2B',
    fontWeight: '600',
  },
  logoutDropdownText: {
    color: '#FFFFFF',
  },
});
