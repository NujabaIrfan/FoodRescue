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
  Modal,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../../firebaseConfig';
import { 
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  updatePassword,
  signOut,
  deleteUser,
  sendPasswordResetEmail
} from 'firebase/auth';

const DonorProfile = () => {
  const navigation = useNavigation();
  
  const [form, setForm] = useState({
    username: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    hours: '',
    cuisine: '',
    imageUrl: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [userDocId, setUserDocId] = useState(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: 'My Profile',
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

    fetchUserData();
  }, [navigation]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (user) {
        console.log("Fetching data for user:", user.uid);
        
        // Query the restaurant collection to find the document where uid matches the current user's uid
        const q = query(collection(db, 'restaurant'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const data = userDoc.data();
          setUserDocId(userDoc.id); // Store the document ID for updates
          
          console.log("User data found:", data);
          setForm({
            username: data.username || '',
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            email: user.email || data.email || '',
            description: data.description || '',
            hours: data.hours || '',
            cuisine: data.cuisine || '',
            imageUrl: data.imageUrl || '',
          });
        } else {
          console.log("No user document found");
          showToast('error', 'Error', 'No profile data found');
        }
      } else {
        console.log("No authenticated user found");
        showToast('error', 'Error', 'Please sign in again');
        navigation.navigate('donorSignIn');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showToast('error', 'Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
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

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const validateForm = () => {
    const { name, address, phone, username } = form;

    if (!username || !name || !address || !phone) {
      showToast('error', 'Missing Fields', 'Please fill in all required fields.');
      return false;
    }

    if (username.length < 4) {
      showToast('error', 'Invalid Username', 'Must be at least 4 characters.');
      return false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      showToast('error', 'Invalid Phone', 'Phone must be exactly 10 digits.');
      return false;
    }

    return true;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setIsUpdating(true);
    try {
      if (!userDocId) {
        showToast('error', 'Error', 'Unable to update profile. Please try again.');
        return;
      }

      await updateDoc(doc(db, 'restaurant', userDocId), {
        username: form.username.trim(),
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        description: form.description.trim(),
        hours: form.hours.trim(),
        cuisine: form.cuisine.trim(),
        imageUrl: form.imageUrl,
      });

      showToast('success', 'Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('error', 'Error', 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast('error', 'Missing Fields', 'Please fill both password fields');
      return;
    }

    const passwordRegex = /^(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      showToast(
        'error',
        'Weak Password',
        'Include uppercase, lowercase, number & special symbol.'
      );
      return;
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      showToast('success', 'Password Changed', 'Password updated successfully');
      setModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      let message = 'Failed to change password. Please try again.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Current password is incorrect';
      } else if (error.code === 'auth/weak-password') {
        message = 'New password is too weak';
      }
      showToast('error', 'Password Change Failed', message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.navigate('restaurantList');
      showToast('success', 'Signed Out', 'You have been successfully signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('error', 'Error', 'Failed to sign out');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast('error', 'Password Required', 'Please enter your password to delete your account');
      return;
    }

    setIsDeletingAccount(true);
    
    try {
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Reauthenticate the user first
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      
      // Delete user data from Firestore
      if (userDocId) {
        await deleteDoc(doc(db, 'restaurant', userDocId));
      }

      // Delete the Firebase Auth user account
      await deleteUser(user);
      
      showToast('success', 'Account Deleted', 'Your account has been permanently deleted');
      
      // Navigate away from the profile screen
      navigation.navigate('restaurantList');
      
    } catch (error) {
      console.error('Error deleting account:', error);
      
      let message = 'Failed to delete account. Please try again.';
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Password is incorrect';
      } else if (error.code === 'auth/requires-recent-login') {
        // For this error, we need to have the user sign in again
        message = 'For security, please sign out and sign in again before deleting your account';
        
        Alert.alert(
          "Reauthentication Required",
          message,
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            { 
              text: "Sign Out Now", 
              onPress: async () => {
                try {
                  await signOut(auth);
                  navigation.navigate('donorSignIn');
                } catch (signOutError) {
                  console.error('Error signing out:', signOutError);
                }
              }
            }
          ]
        );
        return;
      }
      
      showToast('error', 'Deletion Failed', message);
    } finally {
      setIsDeletingAccount(false);
      setDeletePassword('');
      setDeleteModalVisible(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Confirm Account Deletion",
      "Are you sure you want to delete your account? This action cannot be undone and will permanently remove:\n\n• Your profile information\n• All your restaurant data\n• Your account access",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        { 
          text: "Delete", 
          onPress: () => {
            setDeleteModalVisible(true);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleForgotPassword = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        showToast('error', 'Error', 'No email found for current user');
        return;
      }
      await sendPasswordResetEmail(auth, user.email);
      showToast('success', 'Email Sent', 'Password reset email has been sent to your email address');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      showToast('error', 'Error', 'Failed to send password reset email');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#389c9a" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

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
          <View style={styles.avatarContainer}>
            {form.imageUrl ? (
              <Image source={{ uri: form.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Icon name="restaurant" size={40} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.title}>
            {form.name ? `Welcome, ${form.name}!` : 'Complete Your Profile'}
          </Text>
          <Text style={styles.subtitle}>Food Donor Profile</Text>
        </View>

        {isEditing && (!form.name || !form.address || !form.phone || !form.username) && (
          <View style={styles.infoBanner}>
            <Icon name="info" size={20} color="#fff" />
            <Text style={styles.infoText}>Please complete all required fields (*)</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <View style={styles.inputWrapper}>
              <Icon name="person" size={20} color="#389c9a" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor="#999"
                value={form.username}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('username', text)}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Restaurant Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Restaurant Name *</Text>
            <View style={styles.inputWrapper}>
              <Icon name="restaurant" size={20} color="#389c9a" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Your restaurant's name"
                placeholderTextColor="#999"
                value={form.name}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('name', text)}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Icon name="email" size={20} color="#389c9a" style={styles.icon} />
              <TextInput
                style={[styles.input, styles.disabledInput]}
                placeholder="Your email address"
                placeholderTextColor="#999"
                value={form.email}
                editable={false}
              />
            </View>
            <Text style={styles.noteText}>Email cannot be changed</Text>
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <View style={styles.inputWrapper}>
              <Icon name="location-on" size={20} color="#389c9a" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Street, City, Zip Code"
                placeholderTextColor="#999"
                value={form.address}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('address', text)}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.inputWrapper}>
              <Icon name="phone" size={20} color="#389c9a" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="10-digit phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={form.phone}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('phone', text)}
                editable={isEditing}
                maxLength={10}
              />
            </View>
          </View>

          {/* Cuisine Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cuisine Type</Text>
            <View style={styles.inputWrapper}>
              <Icon name="restaurant-menu" size={20} color="#389c9a" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Italian, Chinese, Mexican"
                placeholderTextColor="#999"
                value={form.cuisine}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('cuisine', text)}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Operating Hours */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operating Hours</Text>
            <View style={styles.inputWrapper}>
              <Icon name="access-time" size={20} color="#389c9a" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 9:00 AM - 10:00 PM"
                placeholderTextColor="#999"
                value={form.hours}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('hours', text)}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Restaurant Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Restaurant Description</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <Icon name="description" size={20} color="#389c9a" style={styles.icon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about your restaurant..."
                placeholderTextColor="#999"
                value={form.description}
                selectionColor="#389c9a"
                onChangeText={(text) => handleChange('description', text)}
                editable={isEditing}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Action Buttons */}
          {isEditing ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  fetchUserData();
                }}
                disabled={isUpdating}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.passwordButton]}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.buttonText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign Out Button */}
          <TouchableOpacity
            style={[styles.button, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>

          {/* Delete Account Button */}
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={confirmDeleteAccount}
            disabled={isDeletingAccount}
          >
            {isDeletingAccount ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Delete Account</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>* All fields are required.</Text>
        </View>

        {/* Change Password Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Password</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock" size={20} color="#389c9a" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter current password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={currentPassword}
                    selectionColor="#389c9a"
                    onChangeText={setCurrentPassword}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock" size={20} color="#389c9a" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={newPassword}
                    selectionColor="#389c9a"
                    onChangeText={setNewPassword}
                  />
                </View>
                <Text style={styles.passwordHint}>
                  Must include uppercase, lowercase, number, and special character
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.forgotPasswordLink}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.modalButtonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.buttonText}>Update Password</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    setCurrentPassword('');
                    setNewPassword('');
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Account Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={() => !isDeletingAccount && setDeleteModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <Text style={styles.warningText}>
                Warning: This action is irreversible. All your data will be permanently deleted.
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Enter Password to Confirm</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock" size={20} color="#f44336" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={deletePassword}
                    selectionColor="#f44336"
                    onChangeText={setDeletePassword}
                    editable={!isDeletingAccount}
                    onSubmitEditing={handleDeleteAccount}
                  />
                </View>
              </View>

              <View style={styles.modalButtonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton, isDeletingAccount && styles.disabledButton]}
                  onPress={handleDeleteAccount}
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Delete Account</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, isDeletingAccount && styles.disabledButton]}
                  onPress={() => {
                    setDeleteModalVisible(false);
                    setDeletePassword('');
                  }}
                  disabled={isDeletingAccount}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8dd8c', padding: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8dd8c',
  },
  loadingText: {
    marginTop: 10,
    color: '#389c9a',
    fontSize: 16,
  },
  header: { marginBottom: 30, marginTop: 20, alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 22,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
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
  disabledInput: {
    color: '#666',
    backgroundColor: '#f5f5f5',
  },
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#389c9a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#389c9a',
  },
  saveButton: {
    backgroundColor: '#2e7d32',
  },
  cancelButton: {
    backgroundColor: '#757575',
  },
  passwordButton: {
    backgroundColor: '#ff9800',
  },
  signOutButton: {
    backgroundColor: '#f44336',
    marginBottom: 15,
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoBanner: {
    backgroundColor: '#ff9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  footerNote: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#389c9a',
    marginBottom: 20,
    textAlign: 'center',
  },
  warningText: {
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  forgotPasswordLink: {
    alignItems: 'center',
    marginVertical: 10,
  },
  forgotPasswordText: {
    color: '#389c9a',
    textDecorationLine: 'underline',
  },
});

export default DonorProfile;