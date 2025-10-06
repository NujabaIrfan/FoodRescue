import React, { useState , useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { CheckBox } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

export default function VolunteerSignUp() {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [availability, setAvailability] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Please grant camera roll permissions to upload images.',
          position: 'top'
        });
        return;
      }

      // Launch image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const fileSizeLimit = 2 * 1024 * 1024; // 2 MB

        // Check file size if available
        if (file.fileSize && file.fileSize > fileSizeLimit) {
          Toast.show({
            type: 'error',
            text1: 'File Too Large',
            text2: 'Please select an image smaller than 2MB.',
            position: 'top'
          });
          return;
        }

        setProfilePhoto(file.uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select image',
        position: 'top'
      });
    }
  };

  const [skills, setSkills] = useState({
    cooking: false,
    delivery: false,
    packing: false,
    driving: false,
  });
  const toggleSkill = (skill) => {
    setSkills({...skills, [skill] : !skills[skill]})
  }
  const [preferredArea, setPreferredArea] = useState('');

  useEffect(() => {
    navigation.setOptions({
      title: 'Volunteer Registration',
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

  const validatePassword = (password) => {
    const minLength = 6;
    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters long`;
    }
    return null;
  };

  const handleSignup = async () => {
    if(!name || !email || !phone || !password || !confirmPassword || password !== confirmPassword){
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields and make sure passwords match.',
        position: 'top'
      });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: passwordError,
        position: 'top'
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);
      
      const photoURL = profilePhoto || null;

      await setDoc(doc(db, "Volunteers", user.uid), {
        name,
        email,
        phone,
        address,
        availability,
        profilePhoto: photoURL || null,
        skills,
        preferredArea,
        emailVerified: false, // Add this field to track verification status
        createdAt: new Date()
      });

      Toast.show({
        type: 'success',
        text1: 'Account Created Successfully!',
        text2: 'A verification email has been sent. Please verify your email.',
        position: 'top',
        visibilityTime: 3000
      });

      // Wait for the toast to show, then navigate to login
      setTimeout(() => {
        // Reset fields
        setName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setPassword('');
        setConfirmPassword('');
        setAvailability('');
        setProfilePhoto(null);
        setSkills({cooking:false, delivery:false, packing:false, driving:false});
        setPreferredArea('');
        
        // Navigate to login screen with success message
        navigation.navigate('volunteerLogin', { 
          signupSuccess: true,
          message: 'Account created successfully! Please check your email to verify your account before logging in.' 
        });
      }, 2000);

    } catch(error) {
      console.error('Signup Error:', error.message);
      
      let errorMessage = 'An error occurred during signup.';
      
      // Handle specific Firebase auth errors
      switch(error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please use a different email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address is invalid.';
          break;
        case 'auth/weak-password':
          errorMessage = 'The password is too weak. Please use a stronger password.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        default:
          errorMessage = error.message;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: errorMessage,
        position: 'top'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#87b34eff', '#d5d5b1ff', '#87b34eff']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBackground}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.card}>
            <Text style={styles.heading}>Volunteer Sign Up</Text>
            <Text style={styles.subtitle}>Join our community and make a difference</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Icon name="person" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter your full name" value={name} onChangeText={setName}/>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Icon name="email" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Icon name="phone" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter your phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Address</Text>
              <View style={styles.inputContainer}>
                <Icon name="home" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter your address" value={address} onChangeText={setAddress} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Create a password (min. 6 characters)" value={password} onChangeText={setPassword} secureTextEntry />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Confirm your password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Availability Status</Text>
              <View style={styles.inputContainer}>
                <Icon name="event-available" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Available / Not Available" value={availability} onChangeText={setAvailability} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Profile Photo</Text>
              <View style={styles.imageUploadContainer}>
                {profilePhoto ? (
                  <Image source={{uri: profilePhoto}} style={styles.imagePreview}/>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Icon name="camera-alt" size={30} color="#6c757d" />
                    <Text style={styles.placeholderText}>No Image Selected</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Icon name="cloud-upload" size={16} color="#fff" style={styles.uploadIcon} />
                  <Text style={styles.uploadButtonText}>Upload Photo</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Skills</Text>
              <View style={styles.skillsContainer}>
                <View style={styles.checkboxRow}>
                  <CheckBox title="Cooking" checked={skills.cooking} onPress={() => toggleSkill('cooking')} containerStyle={styles.checkboxContainer} textStyle={styles.checkboxText} checkedColor="#4CAF50"/>
                  <CheckBox title="Delivery" checked={skills.delivery} onPress={() => toggleSkill('delivery')} containerStyle={styles.checkboxContainer} textStyle={styles.checkboxText} checkedColor="#4CAF50"/>
                </View>
                <View style={styles.checkboxRow}>
                  <CheckBox title="Packing" checked={skills.packing} onPress={() => toggleSkill('packing')} containerStyle={styles.checkboxContainer} textStyle={styles.checkboxText} checkedColor="#4CAF50"/>
                  <CheckBox title="Driving" checked={skills.driving} onPress={() => toggleSkill('driving')} containerStyle={styles.checkboxContainer} textStyle={styles.checkboxText} checkedColor="#4CAF50"/>
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Preferred Volunteering Area</Text>
              <View style={styles.inputContainer}>
                <Icon name="place" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g., City Center, Food Bank" value={preferredArea} onChangeText={setPreferredArea}/>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.termsText}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Text>

            <TouchableOpacity 
              style={styles.loginLink}
              onPress={() => navigation.navigate('volunteerLogin')}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLinkText}>Login here</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#6B8E23',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5A3F2B',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6B8E23',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#5A3F2B',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#6B8E23',
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#5A3F2B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6B8E23',
    borderRadius: 10,
    backgroundColor: '#F5F5DC',
    overflow: 'hidden',
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#5A3F2B',
  },
  button: {
    backgroundColor: '#4682B4',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#6B8E23',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  imageUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F5F5DC',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F5F5DC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6B8E23',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 12,
    marginLeft: 14,
    color: '#5A3F2B',
  },
  uploadButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  uploadIcon: {
    marginRight: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  skillsContainer: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
    width: '48%',
  },
  checkboxText: {
    fontWeight: 'normal',
    color: '#5A3F2B',
  },
  termsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    color: '#6B8E23',
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#5A3F2B',
  },
  loginLinkText: {
    color: '#DC143C',
    fontWeight: '600',
  },
});