import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';

const DonorSignUp = () => {
  const navigation = useNavigation();

  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    hours: '',
    cuisine: '',
  });

  const [imageUri, setImageUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: 'Sign Up as Donor',
      headerStyle: {
        backgroundColor: '#389c9a',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 20,
      },
    });
  }, [navigation]);

  // Step 1: Update the pickImage function to use Base64
  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('error', 'Permission required', 'Please grant camera roll permissions to upload images');
        return;
      }

      // Launch image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // Reduce quality to make file size smaller
        base64: true, // This is important - get image as base64
      });

      if (!result.canceled) {
        // Convert image to base64 string
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setImageUri(base64Image);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('error', 'Error', 'Failed to pick image');
    }
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const showToast = (type, text1, text2 = '') => {
    Toast.show({
      type,
      text1,
      text2,
      position: 'top',
      visibilityTime: 3000,
    });
  };

  const validateForm = () => {
    const { username, password, name, address, phone, email } = form;

    if (!username || !password || !name || !address || !phone || !email) {
      showToast('error', 'Missing Fields', 'Please fill in all required fields.');
      return false;
    }

    if (username.length < 4) {
      showToast('error', 'Invalid Username', 'Must be at least 4 characters.');
      return false;
    }

    const passwordRegex =
      /^(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      showToast(
        'error',
        'Weak Password',
        'Include uppercase, lowercase, number & special symbol.'
      );
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('error', 'Invalid Email', 'Enter a valid email address.');
      return false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      showToast('error', 'Invalid Phone', 'Phone must be exactly 10 digits.');
      return false;
    }

    return true;
  };

  // Step 2: Update the handleRegister function to save Base64 image
  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // ✅ Create Firebase Auth account
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      const user = cred.user;

      // ✅ Send verification email
      await sendEmailVerification(user);

      // ✅ Save donor profile in Firestore with Base64 image
      await addDoc(collection(db, 'restaurant'), {
        uid: user.uid,
        role: 'donor',
        username: form.username.trim(),
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        description: form.description.trim(),
        hours: form.hours.trim(),
        cuisine: form.cuisine.trim(),
        imageUrl: imageUri, // This now contains the base64 string
        createdAt: serverTimestamp(),
      });

      showToast(
        'success',
        'Verify Your Email',
        'We sent a verification link. Please check your inbox.'
      );

      // Clear form
      setForm({
        username: '',
        password: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        description: '',
        hours: '',
        cuisine: '',
      });
      setImageUri(null);

      setTimeout(() => {
        navigation.navigate('donorSignIn');
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      let message = 'Something went wrong. Please try again.';
      if (error.code === 'auth/email-already-in-use')
        message = 'Email already in use.';
      if (error.code === 'auth/invalid-email')
        message = 'Invalid email address.';
      if (error.code === 'auth/weak-password')
        message = 'Password is too weak.';

      showToast('error', 'Registration Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Become a Food Donor</Text>
          <Text style={styles.subtitle}>
            Join our mission to reduce food waste and help feed your community.
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Restaurant Image Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Restaurant Image</Text>
            <TouchableOpacity 
              style={styles.imageUploadButton}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              {/* Step 3: Display the Base64 Image - this works the same as before */}
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              ) : uploadingImage ? (
                <ActivityIndicator color="#389c9a" />
              ) : (
                <>
                  <Icon name="cloud-upload" size={20} color="#389c9a" />
                  <Text style={styles.imageUploadText}>Upload Image</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="person"
                size={20}
                color="#389c9a"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor="#999"
                value={form.username}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('username', text)}
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWrapper}>
              <Icon name="lock" size={20} color="#389c9a" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Create a secure password"
                placeholderTextColor="#999"
                secureTextEntry
                value={form.password}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('password', text)}
                editable={!isSubmitting}
              />
            </View>
            <Text style={styles.passwordHint}>
              Must include uppercase, lowercase, number, and special character
            </Text>
          </View>

          {/* Restaurant Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Restaurant Name *</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="restaurant"
                size={20}
                color="#389c9a"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Your restaurant's name"
                placeholderTextColor="#999"
                value={form.name}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('name', text)}
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="location-on"
                size={20}
                color="#389c9a"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Street, City, Zip Code"
                placeholderTextColor="#999"
                value={form.address}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('address', text)}
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="phone"
                size={20}
                color="#389c9a"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="10-digit phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={form.phone}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('phone', text)}
                editable={!isSubmitting}
                maxLength={10}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="email"
                size={20}
                color="#389c9a"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Your email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('email', text)}
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Cuisine Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cuisine Type</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="restaurant-menu"
                size={20}
                color="#389c9a"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g., Italian, Chinese, Mexican"
                placeholderTextColor="#999"
                value={form.cuisine}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('cuisine', text)}
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Operating Hours */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operating Hours</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="access-time"
                size={20}
                color="#389c9a"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g., 9:00 AM - 10:00 PM"
                placeholderTextColor="#999"
                value={form.hours}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('hours', text)}
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Restaurant Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Restaurant Description</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <Icon
                name="description"
                size={20}
                color="#389c9a"
                style={styles.icon}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about your restaurant..."
                placeholderTextColor="#999"
                value={form.description}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('description', text)}
                editable={!isSubmitting}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register Now</Text>
            )}
          </TouchableOpacity>

          {/* Redirect to Login */}
          <View style={styles.loginRedirect}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('donorSignIn')}>
              <Text style={styles.loginLink}>Sign In Here</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerNote}>* All fields are required.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8dd8c', padding: 20 },
  header: { marginBottom: 30, marginTop: 20, alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: '#333', fontWeight: '600', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, paddingVertical: 12, color: '#333' },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#389c9a',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#f0f9f8',
  },
  imageUploadText: {
    marginLeft: 10,
    color: '#389c9a',
    fontWeight: 'bold',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#389c9a',
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: '#389c9a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonDisabled: { backgroundColor: '#a0a0a0' },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginRedirect: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  loginText: { color: '#555', fontSize: 16 },
  loginLink: { color: '#389c9a', fontSize: 16, fontWeight: 'bold' },
  footerNote: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
});

export default DonorSignUp;