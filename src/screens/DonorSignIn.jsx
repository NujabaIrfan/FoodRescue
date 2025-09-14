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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const DonorSignIn = () => {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: 'Sign In as Donor',
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

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const { email, password } = form;

    if (!email || !password) {
      showToast('error', 'Missing Fields', 'Please fill in all fields.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('error', 'Invalid Email', 'Enter a valid email address.');
      return false;
    }

    return true;
  };

const updateVerificationStatus = async (user) => {
  try {
    console.log('Searching for user with email:', user.email);
    
    // Search for the user document by email
    const q = query(
      collection(db, 'restaurant'), 
      where('email', '==', user.email)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Found documents:', querySnapshot.size);
    
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        console.log('Document data:', doc.data());
        console.log('Current isVerified:', doc.data().isVerified);
      });
      
      // Get the first matching document
      const userDoc = querySnapshot.docs[0];
      
      // Update the isVerified field if it's not already true
      if (!userDoc.data().isVerified) {
        await updateDoc(userDoc.ref, {
          isVerified: true,
          emailVerifiedAt: new Date()
        });
        console.log('Verification status updated in Firestore');
      } else {
        console.log('User already verified in Firestore');
      }
    } else {
      console.log('No user document found with email:', user.email);
    }
  } catch (error) {
    console.error('Error updating verification status:', error);
  }
};

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Sign in with Firebase Auth
      const cred = await signInWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      const user = cred.user;

      // Check if email is verified
      if (!user.emailVerified) {
        showToast(
          'error',
          'Email Not Verified',
          'Please verify your email before signing in.'
        );
        await auth.signOut();
        return;
      }

      // Update Firestore verification status
      await updateVerificationStatus(user);

      showToast('success', 'Welcome Back!', 'Successfully signed in.');

      // Navigate to donor dashboard or home screen
      // navigation.navigate('DonorDashboard');
      
    } catch (error) {
      console.error('Sign in error:', error);
      let message = 'Something went wrong. Please try again.';
      if (error.code === 'auth/invalid-credential') 
        message = 'Invalid email or password.';
      if (error.code === 'auth/user-not-found')
        message = 'No account found with this email.';
      if (error.code === 'auth/wrong-password')
        message = 'Incorrect password.';

      showToast('error', 'Sign In Failed', message);
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
          <Text style={styles.title}>Welcome Back, Donor!</Text>
          <Text style={styles.subtitle}>
            Sign in to continue reducing food waste in your community.
          </Text>
        </View>

        <View style={styles.formContainer}>
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

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWrapper}>
              <Icon name="lock" size={20} color="#389c9a" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Your password"
                placeholderTextColor="#999"
                secureTextEntry
                value={form.password}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('password', text)}
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => console.log('Navigate to forgot password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Redirect to Sign Up */}
          <View style={styles.signUpRedirect}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('donorSignUp')}>
              <Text style={styles.signUpLink}>Sign Up Here</Text>
            </TouchableOpacity>
          </View>
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
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, paddingVertical: 12, color: '#333' },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#389c9a',
    fontSize: 14,
    fontWeight: '500',
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
  signUpRedirect: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  signUpText: { color: '#555', fontSize: 16 },
  signUpLink: { color: '#389c9a', fontSize: 16, fontWeight: 'bold' },
});

export default DonorSignIn;