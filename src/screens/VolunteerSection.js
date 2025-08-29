import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function VolunteerSection() {
  const navigation = useNavigation();

  const [user, setUser] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  // Set navigation title
  useEffect(() => {
    navigation.setOptions({ title: 'Volunteers' });
  }, [navigation]);

  // Fetch user and profile photo
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

  // Animate dropdown open/close
  useEffect(() => {
    Animated.timing(animation, {
      toValue: showMenu ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showMenu]);

  // Sign out
  const handleSignOut = async () => {
    await signOut(auth);
    setShowMenu(false);
  };

  const dropdownTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0], // Slide down
  });

  const dropdownOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Volunteers</Text>

        <View style={styles.profileContainer}>
          {user ? (
            <View style={{ position: 'relative' }}>
              <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
                <Image source={{ uri: userPhoto }} style={styles.profileImage} />
              </TouchableOpacity>

              {showMenu && (
                <>
                  {/* Overlay to detect outside click */}
                  <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                    <View style={styles.overlay} />
                  </TouchableWithoutFeedback>

                  {/* Animated dropdown */}
                  <Animated.View
                    style={[
                      styles.dropdownMenu,
                      { opacity: dropdownOpacity, transform: [{ translateY: dropdownTranslateY }] },
                    ]}
                  >
                    {/* Profile Button */}
                    <TouchableOpacity
                      onPress={() => {
                        setShowMenu(false);
                        navigation.navigate('volunteerProfile');
                      }}
                      style={[styles.dropdownButton, { borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }]}
                    >
                      <MaterialIcons name="person" size={20} color="#333" style={{ marginRight: 8 }} />
                      <Text style={styles.dropdownButtonText}>Profile</Text>
                    </TouchableOpacity>

                    {/* Sign Out Button */}
                    <TouchableOpacity
                      onPress={handleSignOut}
                      style={[styles.dropdownButton, { backgroundColor: '#ff4d4d', borderBottomWidth: 0 }]}
                    >
                      <MaterialIcons name="logout" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={[styles.dropdownButtonText, { color: '#fff' }]}>Sign Out</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
            </View>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('volunteerLogin')}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={{ marginTop: 20 }}>
        <Text>Welcome to Volunteer Section!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Keep title on left
  },
  profileContainer: {
    marginLeft: 'auto', // Push profile/login to the right
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  profileImage: { width: 40, height: 40, borderRadius: 20 },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    paddingVertical: 5,
    width: 160,
    zIndex: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  loginText: { fontSize: 16, color: '#007bff' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
});
