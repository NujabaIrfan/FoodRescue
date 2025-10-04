import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

export default function VolunteerForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    navigation.setOptions({
    title: 'Change Your Password',
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

  const checkEmailExists = async (email) => {
    try {
      const volunteersRef = collection(db, 'Volunteers');
      const q = query(volunteersRef, where('email', '==', email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.log('Error checking email:', error);
      return false;
    }
  };

  const handleSendResetEmail = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your email address',
        position: 'top'
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
        position: 'top'
      });
      return;
    }

    setLoading(true);

    try {
      setCheckingEmail(true);
      const emailExists = await checkEmailExists(email);
      setCheckingEmail(false);

      if (!emailExists) {
        Toast.show({
          type: 'error',
          text1: 'Email Not Found',
          text2: 'This email is not registered as a volunteer. Please check your email or sign up first.',
          position: 'top'
        });
        setLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, email);
      
      setEmailSent(true);
      Toast.show({
        type: 'success',
        text1: 'Password Reset Email Sent!',
        text2: 'If this email is registered, you will receive a reset link shortly.',
        position: 'top',
        visibilityTime: 5000
      });
      
    } catch (error) {
      setCheckingEmail(false);
      console.log('Password Reset Error:', error.message);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      let errorTitle = 'Reset Failed';
      
      switch(error.code) {
        case 'auth/invalid-email':
          errorMessage = 'The email address is invalid.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'This email is not registered. Please check your email or sign up first.';
          errorTitle = 'Email Not Found';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Password reset is not enabled. Please contact support.';
          break;
      }
      
      Toast.show({
        type: 'error',
        text1: errorTitle,
        text2: errorMessage,
        position: 'top'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('volunteerLogin');
  };

  const handleSendAnother = () => {
    setEmailSent(false);
    setEmail('');
  };

  const handleSignUpInstead = () => {
    navigation.navigate('volunteerSignUp');
  };

  return (
    <LinearGradient
        colors={['#87b34eff', '#d5d5b1ff', '#87b34eff']}  // Steel Blue → Midnight Blue
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}>
        <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.card}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
                <Icon name="arrow-back" size={24} color="#6B8E23" />
                <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>

            <Text style={styles.heading}>
                {emailSent ? 'Check Your Email' : 'Reset Your Password'}
            </Text>

            <Text style={styles.subtitle}>
                {emailSent 
                ? `We've sent instructions to ${email}` 
                : 'Enter your registered volunteer email address'
                }
            </Text>

            {!emailSent ? (
                <>
                <View style={styles.field}>
                    <Text style={styles.label}>Volunteer Email Address</Text>
                    <View style={styles.inputContainer}>
                    <Icon name="email" size={20} color="#5A3F2B" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Registered Volunteer Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />
                    </View>
                    <Text style={styles.hintText}>
                    Only registered volunteer emails will receive reset links
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, (loading || checkingEmail) && styles.buttonDisabled]}
                    onPress={handleSendResetEmail}
                    disabled={loading || checkingEmail}
                >
                    {(loading || checkingEmail) ? (
                    <ActivityIndicator size="small" color="#F5F5DC" />
                    ) : (
                    <Text style={styles.buttonText}>
                        {checkingEmail ? 'Checking Email...' : 'Send Reset Link'}
                    </Text>
                    )}
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>Not a volunteer yet?</Text>
                    <TouchableOpacity onPress={handleSignUpInstead}>
                    <Text style={styles.signupLink}>Sign up here</Text>
                    </TouchableOpacity>
                </View>
                </>
            ) : (
                <>
                <View style={styles.successContainer}>
                    <Icon name="mark-email-read" size={80} color="#6B8E23" style={styles.successIcon} />
                    <Text style={styles.successTitle}>Check Your Email</Text>
                    <Text style={styles.successMessage}>
                    If <Text style={styles.emailText}>{email}</Text> is registered in our system, 
                    you should receive a password reset link shortly.
                    </Text>
                    
                    <View style={styles.instructions}>
                    <Text style={styles.instructionsTitle}>What to do next:</Text>
                    <View style={styles.instructionStep}>
                        <Icon name="check-circle" size={16} color="#6B8E23" />
                        <Text style={styles.instructionText}>Check your email inbox</Text>
                    </View>
                    <View style={styles.instructionStep}>
                        <Icon name="check-circle" size={16} color="#6B8E23" />
                        <Text style={styles.instructionText}>Click the reset password link</Text>
                    </View>
                    <View style={styles.instructionStep}>
                        <Icon name="check-circle" size={16} color="#6B8E23" />
                        <Text style={styles.instructionText}>Set your new password</Text>
                    </View>
                    <View style={styles.instructionStep}>
                        <Icon name="check-circle" size={16} color="#6B8E23" />
                        <Text style={styles.instructionText}>Return to app and login</Text>
                    </View>
                    </View>
                </View>

                <View style={styles.buttonGroup}>       
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleSendAnother}>
                    <Text style={styles.secondaryButtonText}>Try Different Email</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.tertiaryButton} onPress={handleBackToLogin}>
                    <Text style={styles.tertiaryButtonText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
                </>
            )}

            <View style={styles.infoBox}>
                <Icon name="info" size={18} color="#4682B4" />
                <Text style={styles.infoText}>
                {!emailSent 
                    ? 'Reset links are only sent to registered volunteer email addresses.'
                    : "If you don't see the email within 5 minutes, check your spam folder or verify the email address."
                }
                </Text>
            </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  card: {
    backgroundColor: '#F5F5DC', // Beige card background
    borderRadius: 12,
    padding: 20,
    shadowColor: '#5A3F2B', // Dark brown shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#5A3F2B', // Dark brown border
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  backText: {
    color: '#6B8E23', // Olive green
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600'
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#5A3F2B', // Dark brown text
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 14,
    color: '#5A3F2B', // Dark brown text
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    opacity: 0.8
  },
  field: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    color: '#5A3F2B', // Dark brown text
    marginBottom: 8,
    fontWeight: '600'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5A3F2B', // Dark brown border
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F5F5DC' // Beige background
  },
  inputIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#5A3F2B', // Dark brown text
  },
  hintText: {
    fontSize: 12,
    color: '#5A3F2B', // Dark brown text
    marginTop: 5,
    fontStyle: 'italic',
    opacity: 0.7
  },
  button: {
    backgroundColor: '#6B8E23', // Olive green
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#5A3F2B', // Dark brown when disabled
    opacity: 0.7
  },
  buttonText: {
    color: '#F5F5DC', // Beige text
    fontSize: 16,
    fontWeight: 'bold'
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15
  },
  signupText: {
    fontSize: 14,
    color: '#5A3F2B', // Dark brown text
    marginRight: 5
  },
  signupLink: {
    fontSize: 14,
    color: '#4682B4', // Steel blue
    fontWeight: 'bold'
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10
  },
  successIcon: {
    marginBottom: 20
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5A3F2B', // Dark brown text
    marginBottom: 15,
    textAlign: 'center'
  },
  successMessage: {
    fontSize: 16,
    color: '#5A3F2B', // Dark brown text
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    opacity: 0.9
  },
  emailText: {
    fontWeight: 'bold',
    color: '#4682B4', // Steel blue
  },
  instructions: {
    backgroundColor: '#F5F5DC', // Beige background
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#5A3F2B', // Dark brown border
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5A3F2B', // Dark brown text
    marginBottom: 10
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  instructionText: {
    fontSize: 14,
    color: '#5A3F2B', // Dark brown text
    marginLeft: 8,
    flex: 1,
    opacity: 0.9
  },
  buttonGroup: {
    marginTop: 20
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#4682B4' // Steel blue border
  },
  secondaryButtonText: {
    color: '#4682B4', // Steel blue text
    fontSize: 16,
    fontWeight: 'bold'
  },
  tertiaryButton: {
    alignItems: 'center',
    paddingVertical: 12
  },
  tertiaryButtonText: {
    color: '#5A3F2B', // Dark brown text
    fontSize: 14,
    opacity: 0.8
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#4682B4', // Steel blue background
    padding: 12,
    borderRadius: 8,
    marginTop: 20
  },
  infoText: {
    fontSize: 12,
    color: '#F5F5DC', // Beige text
    marginLeft: 8,
    flex: 1,
    lineHeight: 16
  }
});