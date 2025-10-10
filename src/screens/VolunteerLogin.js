import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

export default function VolunteerLogin() {
  const navigation = useNavigation();
  const route = useRoute();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle success message from signup navigation
  useEffect(() => {
    if (route.params?.signupSuccess) {
      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: route.params.message || 'Account created successfully! Please verify your email before logging in.',
        position: 'top',
        visibilityTime: 4000
      });
      
      // Pre-fill email if coming from signup
      if (route.params.email) {
        setEmail(route.params.email);
      }
    }
  }, [route.params]);

  const handleLogin = async() => {
    if(!email || !password){
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields',
        position: 'top'
      });
      return;
    }

    setLoading(true);

    try{
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        Toast.show({
          type: 'error',
          text1: 'Email Not Verified',
          text2: 'Please verify your email address before logging in.',
          position: 'top'
        });
        await auth.signOut();
        setLoading(false);
        return;
      }

      const docRef = doc(db, "Volunteers", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        Toast.show({
          type: 'success',
          text1: 'Volunteer Logged in Successfully',
          position: 'top'
        });
        navigation.navigate('volunteerSection');
      } else {
        // Not a volunteer → block access
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'This account is not registered as a Volunteer.',
          position: 'top'
        });
        await auth.signOut();
      }
    } catch(error) {
      console.log('Login Error:', error.message);
      
      let errorMessage = 'Login unsuccessful. Please try again.';
      
      // Handle specific Firebase auth errors
      switch(error.code) {
        case 'auth/invalid-email':
          errorMessage = 'The email address is invalid.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
        position: 'top'
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    navigation.setOptions({
      title: 'Volunteer Login',
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
        <View style={styles.card}>
          <Text style={styles.heading}>Login Here!</Text>
          <Text style={styles.subtitle}>Your Journey to Make a Difference Starts Here</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email Address: </Text>
            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color="#6c757d" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Enter your email" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password: </Text>
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#6c757d" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Enter your password" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login Here</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('volunteerForgotPassword')} style={styles.linkContainer}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.registrationContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('volunteerSignUp')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Additional info for new users */}
          {route.params?.signupSuccess && (
            <View style={styles.infoBox}>
              <Icon name="info" size={18} color="#17a2b8" />
              <Text style={styles.infoText}>
                Please check your email inbox and verify your account before logging in.
              </Text>
            </View>
          )}
        </View>
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
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#5A3F2B',
    textAlign: 'center',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#6B8E23',
    textAlign: 'center',
    marginBottom: 20
  },
  field: {
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    color: '#5A3F2B',
    marginBottom: 5
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6B8E23',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F5F5DC'
  },
  inputIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#5A3F2B'
  },
  button: {
    backgroundColor: '#4682B4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  buttonDisabled: {
    backgroundColor: '#6B8E23',
    opacity: 0.7
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  linkContainer: {
    marginTop: 10,
    alignItems: 'center'
  },
  linkText: {
    color: '#FFA500',
    fontSize: 14
  },
  registrationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    alignItems: 'center'
  },
  registerText: {
    fontSize: 14,
    color: '#5A3F2B',
    marginRight: 5
  },
  registerLink: {
    fontSize: 14,
    color: '#DC143C',
    fontWeight: 'bold'
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500'
  },
  infoText: {
    fontSize: 12,
    color: '#5A3F2B',
    marginLeft: 8,
    flex: 1
  }
});