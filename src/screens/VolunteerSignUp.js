import React, { useState , useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CheckBox } from 'react-native-elements';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth, db, storage } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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

  const pickImage = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 1 },
      (response) => {
        if (!response.didCancel && !response.errorCode) {
          const file = response.assets[0];
          const fileSizeLimit = 2 * 1024 * 1024; // 2 MB

          if (file.fileSize > fileSizeLimit) {
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
      }
    );
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
    });
  }, [navigation]);

  const handleSignup = async () => {
    if(!name || !email || !phone || !password || password !== confirmPassword){
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields and make sure passwords match.',
        position: 'top'
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

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
        createdAt: new Date()
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Volunteer account created successfully!',
        position: 'top'
      });

      // Reset fields
      setTimeout(() => {
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
      }, 50);

    } catch(error) {
      console.error(error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
        position: 'top'
      });
    } finally {
      setLoading(false);
    }
 };

  return (
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
              <TextInput style={styles.input} placeholder="Create a password" value={password} onChangeText={setPassword} secureTextEntry />
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

          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>
          
          <Text style={styles.termsText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
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
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d',
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495e',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
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
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
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
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 12,
    marginLeft: 14,
    color: '#6c757d',
  },
  uploadButton: {
    backgroundColor: '#2196F3',
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
    color: '#2c3e50',
  },
  termsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    color: '#95a5a6',
  },
});