import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch, TextInput, Alert, Button } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { CheckBox } from "react-native-elements";
import { launchImageLibrary } from 'react-native-image-picker';

export default function VolunteerProfile() {
  const navigation = useNavigation();
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [skills, setSkills] = useState({});
  const [profilePhoto, setProfilePhoto] = useState("");
  const [preferredArea, setPreferredArea] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [completedWorks, setCompletedWorks] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [pendingWorks, setPendingWorks] = useState([]);
  const [availableWorks, setAvailableWorks] = useState([]);
  const [medals, setMedals] = useState([]);
  const [completedWorkCount, setCompletedWorkCount] = useState(0);

  useEffect(() => {
    navigation.setOptions({ title: 'My Profile' });
  }, [navigation]);
  
  useEffect(() => {
    const fetchVolunteer = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "Volunteers", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setVolunteer(data);
            setForm(data);
            setSkills(data.skills || {});
            setProfilePhoto(data.profilePhoto || "");
            setPreferredArea(data.preferredArea || "");
            setCompletedWorks(data.completedWorks || []);
            setPendingWorks(data.pendingWorks || []);
            setCompletedWorkCount(data.completedWorkCount || 0);
            setMedals(data.medals || []);
            
            calculateMedals(data.completedWorkCount || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching volunteer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteer();
    fetchAvailableWorks();
  }, []);

  //Medal calculation
  const calculateMedals = (count) => {
    const newMedals = [];
    if (count >= 10) newMedals.push("gold");
    if (count >= 5) newMedals.push("silver");
    if (count >= 1) newMedals.push("bronze");
    setMedals(newMedals);
    updateMedalsInDatabase(newMedals, count);
  };

  const updateMedalsInDatabase = async (newMedals, count) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "Volunteers", user.uid), {
          medals: newMedals,
          completedWorkCount: count
        });
      }
    } catch (error) {
      console.error("Error updating medals:", error);
    }
  };

  //Fetch available works
  const fetchAvailableWorks = async () => {
    try {
      const worksSnapshot = await getDocs(collection(db, "Organizations"));
      const works = [];
      worksSnapshot.forEach((doc) => {
        works.push({ id: doc.id, ...doc.data() });
      });
      setAvailableWorks(works);
    } catch (error) {
      console.error("Error fetching available works:", error);
    }
  };

  //Pick work functionality
  const pickWork = async (work) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "Volunteers", user.uid);
        const updatedPendingWorks = [...pendingWorks, { ...work, pickedAt: new Date() }];
        
        await updateDoc(docRef, {
          pendingWorks: updatedPendingWorks
        });
        
        setPendingWorks(updatedPendingWorks);
        await deleteDoc(doc(db, "Organizations", work.id));
        
        Toast.show({
          type: 'success',
          text1: 'Work Picked!',
          text2: 'The work has been added to your pending tasks'
        });
        
        fetchAvailableWorks();
      }
    } catch (error) {
      console.error("Error picking work:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick work'
      });
    }
  };

  //Complete work functionality
  const completeWork = async (workIndex) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const updatedPendingWorks = pendingWorks.filter((_, index) => index !== workIndex);
        const newCompletedCount = completedWorkCount + 1;
        
        await updateDoc(doc(db, "Volunteers", user.uid), {
          pendingWorks: updatedPendingWorks,
          completedWorkCount: newCompletedCount
        });
        
        setPendingWorks(updatedPendingWorks);
        setCompletedWorkCount(newCompletedCount);
        calculateMedals(newCompletedCount);
        
        Toast.show({
          type: 'success',
          text1: 'Work Completed!',
          text2: `Total completed works: ${newCompletedCount}`
        });
      }
    } catch (error) {
      console.error("Error completing work:", error);
    }
  };

  const renderPendingWorks = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏳ My Pending Works ({pendingWorks.length})</Text>
        {pendingWorks.length === 0 ? (
          <Text style={styles.noData}>No pending works.</Text>
        ) : (
          pendingWorks.map((work, index) => (
            <View key={index} style={styles.workCard}>
              <Text style={styles.workTitle}>{work.title}</Text>
              <Text style={styles.workDescription}>{work.description}</Text>
              <Text style={styles.pickedDate}>
                📅 Picked: {work.pickedAt ? new Date(work.pickedAt).toLocaleDateString() : 'Recently'}
              </Text>
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={() => completeWork(index)}
              >
                <Text style={styles.completeButtonText}>🏁 Mark as Completed</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderAchievements = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 My Achievements</Text>
        <View style={styles.achievementsContainer}>
          <Text style={styles.achievementText}>
            📊 Completed Works: <Text style={styles.count}>{completedWorkCount}</Text>
          </Text>
          
          <View style={styles.medalsContainer}>
            <Text style={styles.medalsTitle}>Medals Earned:</Text>
            <View style={styles.medalsList}>
              {medals.includes('bronze') ? (
                <Text style={styles.medal}>🥉 Bronze</Text>
              ) : (
                <Text style={styles.medalLocked}>🔒 Bronze (need 1+ works)</Text>
              )}
              
              {medals.includes('silver') ? (
                <Text style={styles.medal}>🥈 Silver</Text>
              ) : (
                <Text style={styles.medalLocked}>🔒 Silver (need 5+ works)</Text>
              )}
              
              {medals.includes('gold') ? (
                <Text style={styles.medal}>🥇 Gold</Text>
              ) : (
                <Text style={styles.medalLocked}>🔒 Gold (need 10+ works)</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

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
              position: 'top',
              visibilityTime: 3000
            });
            return;
          }

          setProfilePhoto(file.uri);
        }
      }
    );
  };

  const toggleSkill = (skillName) => {
    const updatedSkills = { ...skills, [skillName]: !skills[skillName] };
    setSkills(updatedSkills);
    setForm({ ...form, skills: updatedSkills });
  };

  const handleUpdate = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "Volunteers", user.uid);
        const updatedForm = { ...form, profilePhoto, preferredArea, skills };
        await updateDoc(docRef, updatedForm);
        setVolunteer(updatedForm);
        setForm(updatedForm);
        setIsEditing(false);
        Toast.show({ type: "success", text1: "Profile Updated" });
      }
    } catch (error) {
      console.error("Error updating profile: ", error);
      Toast.show({ type: "error", text1: "Error", text2: error.message });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate("volunteerLogin");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, "Volunteers", user.uid));
        await user.delete();
        Toast.show({ type: "success", text1: "Profile Deleted" });
        navigation.replace("volunteerSignUp");
      }
    } catch (error) {
      console.error(error);
      Toast.show({ type: "error", text1: "Error", text2: error.message });
    }
  };

  const toggleAvailability = async (value) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const newStatus = value ? "Available" : "Not Available";
        await updateDoc(doc(db, "Volunteers", user.uid), { availability: newStatus });
        setVolunteer({ ...volunteer, availability: newStatus });
        setForm({ ...form, availability: newStatus });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDirectPasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({ type: "error", text1: "Error", text2: "Please fill in all fields" });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({ type: "error", text1: "Error", text2: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({ type: "error", text1: "Error", text2: "Password must be at least 6 characters" });
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);

        Toast.show({ type: "success", text1: "Password Updated Successfully" });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      Toast.show({ type: "error", text1: "Error", text2: error.message });
    }
  };

  const pickCompletedWork = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 1, includeBase64: true },
      async (response) => {
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

          // Check maximum photos limit
          const MAX_WORK_PHOTOS = 3;
          if (completedWorks.length >= MAX_WORK_PHOTOS) {
            Toast.show({
              type: 'error',
              text1: 'Maximum Photos Reached',
              text2: `You can only upload up to ${MAX_WORK_PHOTOS} work photos.`,
              position: 'top'
            });
            return;
          }

          setUploading(true);
          
          // FIX: Determine the correct MIME type
          let mimeType = file.type;
          if (!mimeType || mimeType === 'undefined') {
            // Fallback to common image MIME types based on file extension or default to jpeg
            if (file.fileName) {
              if (file.fileName.toLowerCase().endsWith('.png')) {
                mimeType = 'image/png';
              } else if (file.fileName.toLowerCase().endsWith('.gif')) {
                mimeType = 'image/gif';
              } else {
                mimeType = 'image/jpeg'; // Default to jpeg
              }
            } else {
              mimeType = 'image/jpeg'; // Final fallback
            }
          }
          
          console.log("Detected MIME type:", mimeType);
          
          // Convert to Base64 string with correct MIME type
          const base64Image = `data:${mimeType};base64,${file.base64}`;
          const updatedWorks = [...completedWorks, base64Image];
          
          console.log("Adding new work photo. New array length:", updatedWorks.length);
          
          try {
            const user = auth.currentUser;
            if (user) {
              await updateDoc(doc(db, "Volunteers", user.uid), { 
                completedWorks: updatedWorks 
              });
              setCompletedWorks(updatedWorks);
              Toast.show({ 
                type: 'success', 
                text1: 'Work photo added!',
                text2: `${updatedWorks.length}/${MAX_WORK_PHOTOS} photos`
              });
            }
          } catch (error) {
            console.error("Error adding work photo:", error);
            Toast.show({ 
              type: 'error', 
              text1: 'Failed to add work photo' 
            });
          }
          
          setUploading(false);
        }
      }
    );
  };

  const deleteCompletedWork = async (index) => {
    console.log("Delete clicked for index:", index);
    
    try {
      // Create a new array without the deleted item
      const newWorks = [...completedWorks];
      newWorks.splice(index, 1); // Remove 1 item at index
      
      console.log("New array length:", newWorks.length);
      
      const user = auth.currentUser;
      if (user) {
        // Update Firestore
        await updateDoc(doc(db, "Volunteers", user.uid), {
          completedWorks: newWorks
        });
        
        // Update local state
        setCompletedWorks(newWorks);
        
        Toast.show({
          type: 'success',
          text1: 'Photo deleted!',
          text2: `${newWorks.length} photos remaining`
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2: error.message
      });
    }
  };

  if (loading) return <Text style={styles.loadingText}>Loading...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ---------------- Password Change Mode ---------------- */}
      {showPasswordForm ? (
        <View style={styles.passwordFormContainer}>
          <View style={styles.passwordFormHeader}>
            <Icon name="lock" size={24} color="#3498db" />
            <Text style={styles.passwordFormTitle}>Change Password</Text>
            <Text style={styles.passwordFormSubtitle}>Update your password to keep your account secure</Text>
          </View>

          <View style={styles.passwordInputContainer}>
            <View style={styles.inputWrapper}>
              <Icon name="vpn-key" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="Current Password"
                placeholderTextColor="#95a5a6"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Icon name="lock-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="New Password"
                placeholderTextColor="#95a5a6"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Icon name="lock" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm New Password"
                placeholderTextColor="#95a5a6"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          <View style={styles.passwordButtonContainer}>
            <TouchableOpacity 
              style={[styles.passwordButton, styles.updateButton]} 
              onPress={handleDirectPasswordUpdate}
            >
              <Icon name="check" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.passwordButtonText}>Update Password</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.passwordButton, styles.cancelButton]} 
              onPress={() => {
                setShowPasswordForm(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              <Icon name="close" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.passwordButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.passwordRequirements}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirementItem}>
              <Icon name={newPassword.length >= 6 ? "check-circle" : "radio-button-unchecked"} 
                    size={16} 
                    color={newPassword.length >= 6 ? "#27ae60" : "#bdc3c7"} />
              <Text style={styles.requirementText}>At least 6 characters</Text>
            </View>
            <View style={styles.requirementItem}>
              <Icon name={newPassword === confirmPassword && newPassword ? "check-circle" : "radio-button-unchecked"} 
                    size={16} 
                    color={newPassword === confirmPassword && newPassword ? "#27ae60" : "#bdc3c7"} />
              <Text style={styles.requirementText}>Passwords must match</Text>
            </View>
          </View>
        </View>
      ) : (
        <>
          {/* ---------------- Profile / Edit Mode ---------------- */}

          {isEditing ? (
            <ScrollView style={styles.editFormContainer} showsVerticalScrollIndicator={false}>
              {/* Profile Photo Upload */}
              <View style={styles.editSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="photo-camera" size={22} color="#3498db" />
                  <Text style={styles.sectionTitle}>Profile Photo</Text>
                </View>
                <View style={styles.uploadCard}>
                  <View style={styles.uploadContent}>
                    {profilePhoto ? (
                      <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: profilePhoto }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.replaceButton} onPress={pickImage}>
                          <Icon name="edit" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <Icon name="cloud-upload" size={40} color="#bdc3c7" />
                        <Text style={styles.uploadPlaceholderText}>Upload Profile Photo</Text>
                        <Text style={styles.uploadSubtext}>Recommended: 500x500px</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <Icon name="photo-library" size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.uploadButtonText}>
                      {profilePhoto ? 'Change Photo' : 'Select Photo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Personal Information */}
              <View style={styles.editSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="person" size={22} color="#3498db" />
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <Icon name="badge" size={20} color="#7f8c8d" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      value={form.name}
                      onChangeText={(t) => setForm({ ...form, name: t })}
                      placeholder="Full Name"
                      placeholderTextColor="#95a5a6"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Icon name="phone" size={20} color="#7f8c8d" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      value={form.phone}
                      onChangeText={(t) => setForm({ ...form, phone: t })}
                      placeholder="Phone Number"
                      placeholderTextColor="#95a5a6"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Icon name="home" size={20} color="#7f8c8d" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      value={form.address}
                      onChangeText={(t) => setForm({ ...form, address: t })}
                      placeholder="Address"
                      placeholderTextColor="#95a5a6"
                      multiline
                    />
                  </View>
                </View>
              </View>

              {/* Volunteering Preferences */}
              <View style={styles.editSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="place" size={22} color="#3498db" />
                  <Text style={styles.sectionTitle}>Volunteering Preferences</Text>
                </View>
                
                <View style={styles.inputWrapper}>
                  <Icon name="location-on" size={20} color="#7f8c8d" style={styles.inputIcon} />
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., City Center, Food Bank, Community Kitchen"
                    value={preferredArea}
                    onChangeText={setPreferredArea}
                    placeholderTextColor="#95a5a6"
                  />
                </View>
              </View>

              {/* Skills */}
              <View style={styles.editSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="build" size={22} color="#3498db" />
                  <Text style={styles.sectionTitle}>Skills & Abilities</Text>
                </View>
                
                <Text style={styles.skillsDescription}>Select the skills you can contribute:</Text>
                
                <View style={styles.skillsGrid}>
                  <View style={styles.skillRow}>
                    <TouchableOpacity 
                      style={[styles.skillButton, skills.cooking && styles.skillButtonActive]} 
                      onPress={() => toggleSkill('cooking')}
                    >
                      <Icon name="restaurant" size={20} color={skills.cooking ? "#fff" : "#7f8c8d"} />
                      <Text style={[styles.skillText, skills.cooking && styles.skillTextActive]}>
                        Cooking
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.skillButton, skills.delivery && styles.skillButtonActive]} 
                      onPress={() => toggleSkill('delivery')}
                    >
                      <Icon name="local-shipping" size={20} color={skills.delivery ? "#fff" : "#7f8c8d"} />
                      <Text style={[styles.skillText, skills.delivery && styles.skillTextActive]}>
                        Delivery
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.skillRow}>
                    <TouchableOpacity 
                      style={[styles.skillButton, skills.packing && styles.skillButtonActive]} 
                      onPress={() => toggleSkill('packing')}
                    >
                      <Icon name="inventory" size={20} color={skills.packing ? "#fff" : "#7f8c8d"} />
                      <Text style={[styles.skillText, skills.packing && styles.skillTextActive]}>
                        Packing
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.skillButton, skills.driving && styles.skillButtonActive]} 
                      onPress={() => toggleSkill('driving')}
                    >
                      <Icon name="directions-car" size={20} color={skills.driving ? "#fff" : "#7f8c8d"} />
                      <Text style={[styles.skillText, skills.driving && styles.skillTextActive]}>
                        Driving
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleUpdate}>
                  <Icon name="check" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Save Changes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => setIsEditing(false)}>
                  <Icon name="close" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <>
              {/* View Mode */}
              {volunteer?.profilePhoto && (
                <Image source={{ uri: volunteer.profilePhoto }} style={styles.profileImage} />
              )}
              
              <Text style={styles.name}>{volunteer?.name}</Text>
              <Text style={styles.email}>{volunteer?.email}</Text>

              <View style={styles.detailsContainer}>
                <Text style={styles.detail}>
                  <Text style={styles.label}>Phone:</Text> {volunteer?.phone || 'Not provided'}
                </Text>
                <Text style={styles.detail}>
                  <Text style={styles.label}>Address:</Text> {volunteer?.address || 'Not provided'}
                </Text>
                <Text style={styles.detail}>
                  <Text style={styles.label}>Preferred Area:</Text> {volunteer?.preferredArea || 'Not specified'}
                </Text>

                <Text style={[styles.label, {marginTop: 10}]}>Skills:</Text>
                <View style={styles.skillsContainer}>
                  {Object.entries(volunteer?.skills || {}).map(([skill, value]) =>
                    value ? <Text key={skill} style={styles.skill}>{skill}</Text> : null
                  )}
                  {!volunteer?.skills || Object.values(volunteer.skills).filter(Boolean).length === 0 ? (
                    <Text style={[styles.detail, {color: '#bdc3c7'}]}>No skills selected</Text>
                  ) : null}
                </View>

                <View style={styles.availabilityRow}>
                  <Icon 
                    name={volunteer?.availability === "Available" ? "check-circle" : "cancel"} 
                    size={20} 
                    color={volunteer?.availability === "Available" ? "#27ae60" : "#e74c3c"} 
                  />
                  <Text style={styles.availabilityText}>
                    {volunteer?.availability === "Available" ? "Currently Available" : "Currently Unavailable"}
                  </Text>
                  <Switch
                    value={volunteer?.availability === "Available"}
                    onValueChange={toggleAvailability}
                    style={{ marginLeft: 'auto' }}
                    trackColor={{ false: '#bdc3c7', true: '#27ae60' }}
                    thumbColor={volunteer?.availability === "Available" ? '#ffffff' : '#ffffff'}
                  />
                </View>
              </View>

              {/* Available Works Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Works</Text>
                <TouchableOpacity 
                  style={styles.selectButton} 
                  onPress={() => navigation.navigate('organizations')}
                >
                  <Icon name="work" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Browse Available Works</Text>
                </TouchableOpacity>
              </View>

              {/* Pending Works Section */}
              {renderPendingWorks()}

              {/*Achivements Section*/}
              {renderAchievements()}

              {/* Medals Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Medals</Text>
                <Text style={styles.workCount}>Completed Works: {completedWorkCount}</Text>
                
                <View style={styles.medalsContainer}>
                  {medals.includes("bronze") && (
                    <View style={styles.medal}>
                      <Icon name="emoji-events" size={30} color="#cd7f32" />
                      <Text style={styles.medalText}>Bronze</Text>
                      <Text style={styles.medalSubtext}>1+ works</Text>
                    </View>
                  )}
                  
                  {medals.includes("silver") && (
                    <View style={styles.medal}>
                      <Icon name="emoji-events" size={30} color="#c0c0c0" />
                      <Text style={styles.medalText}>Silver</Text>
                      <Text style={styles.medalSubtext}>5+ works</Text>
                    </View>
                  )}
                  
                  {medals.includes("gold") && (
                    <View style={styles.medal}>
                      <Icon name="emoji-events" size={30} color="#ffd700" />
                      <Text style={styles.medalText}>Gold</Text>
                      <Text style={styles.medalSubtext}>10+ works</Text>
                    </View>
                  )}
                  
                  {medals.length === 0 && (
                    <Text style={styles.emptyText}>Complete works to earn medals!</Text>
                  )}
                </View>
              </View>

              {/* Completed Works Section */}
              <View style={styles.completedWorksSection}>
                <Text style={styles.sectionTitle}>Completed Work Photos ({completedWorks.length})</Text>
                
                <TouchableOpacity 
                  style={[styles.selectButton, uploading && styles.disabledButton]} 
                  onPress={pickCompletedWork}
                  disabled={uploading}
                >
                  <Icon name="add-a-photo" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>
                    {uploading ? 'Uploading...' : 'Add Work Photo'}
                  </Text>
                </TouchableOpacity>
                
                {completedWorks.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <Icon name="photo-library" size={60} color="#ddd" style={styles.emptyStateIcon} />
                    <Text style={styles.emptyStateText}>No work photos uploaded yet</Text>
                    <Text style={styles.emptyStateSubtext}>Click "Add Work Photo" above to get started</Text>
                  </View>
                ) : (
                  <View style={styles.completedWorksContainer}>
                    {completedWorks.map((base64Image, idx) => (
                      <View key={idx} style={styles.imageContainer}>
                        <Image 
                          source={{ uri: base64Image }}
                          style={styles.completedWorkImage} 
                        />
                        <TouchableOpacity 
                          style={styles.deleteImageButton} 
                          onPress={() => deleteCompletedWork(idx)}
                        >
                          <Icon name="delete" size={18} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.imageIndex}>#{idx + 1}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.updateButton]} onPress={() => setIsEditing(true)}>
                  <Icon name="edit" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Update Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, styles.passwordButton]} 
                  onPress={() => setShowPasswordForm(true)}
                >
                  <Icon name="lock" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Change Password</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
                  <Icon name="delete-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Delete Profile</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
                  <Icon name="exit-to-app" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F5F5DC', // Beige background
  },

  // Password Change Mode Styles
  passwordFormContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginVertical: 10,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  passwordFormHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  passwordFormTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5A3F2B', // Brown text
    marginTop: 10,
    marginBottom: 5,
  },
  passwordFormSubtitle: {
    fontSize: 14,
    color: '#6B8E23', // Olive green
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordInputContainer: {
    marginBottom: 25,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F5F0', // Light beige
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#D4C9B8',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
    color: '#6B8E23', // Olive green icons
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#5A3F2B', // Brown text
    fontWeight: '500',
    paddingVertical: 8,
  },
  passwordButtonContainer: {
    gap: 12,
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
    width: "100%",
  },
  updateButton: {
    backgroundColor: '#6B8E23', // Olive green
  },
  cancelButton: {
    backgroundColor: '#8A7B6B', // Muted brown
  },
  buttonIcon: {
    marginRight: 8,
    color: '#FFFFFF',
  },
  passwordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordRequirements: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8F5F0',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4682B4', // Steel blue
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A3F2B',
    marginBottom: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 13,
    color: '#6B8E23',
    marginLeft: 8,
  },

  // Edit Mode Styles
  editFormContainer: {
    flex: 1,
  },
  editSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5A3F2B',
    marginLeft: 10,
  },
  uploadCard: {
    alignItems: 'center',
  },
  uploadContent: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4682B4', // Steel blue border
  },
  replaceButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#4682B4', // Steel blue
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F5F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D4C9B8',
    borderStyle: 'dashed',
  },
  uploadPlaceholderText: {
    fontSize: 12,
    color: '#6B8E23',
    marginTop: 5,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 10,
    color: '#8A7B6B',
    marginTop: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4682B4', // Steel blue
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputGroup: {
    gap: 15,
  },
  formInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#5A3F2B',
  },
  skillsDescription: {
    fontSize: 14,
    color: '#6B8E23',
    marginBottom: 15,
  },
  skillsGrid: {
    gap: 10,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  skillButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4C9B8',
    backgroundColor: '#F8F5F0',
  },
  skillButtonActive: {
    backgroundColor: '#6B8E23', // Olive green
    borderColor: '#5A7A1A',
  },
  skillText: {
    fontSize: 14,
    color: '#5A3F2B',
    marginLeft: 8,
    fontWeight: '500',
  },
  skillTextActive: {
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#6B8E23', // Olive green
  },
  cancelEditButton: {
    backgroundColor: '#8A7B6B', // Muted brown
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // View Mode Styles
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#4682B4', // Steel blue
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5A3F2B',
    textAlign: 'center',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#6B8E23',
    textAlign: 'center',
    marginBottom: 30,
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  detail: {
    fontSize: 16,
    color: '#5A3F2B',
    marginBottom: 10,
    lineHeight: 22,
  },
  label: {
    fontWeight: '600',
    color: '#5A3F2B',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  skill: {
    backgroundColor: '#4682B4', // Steel blue
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: '500',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E0D5',
  },
  availabilityText: {
    fontSize: 16,
    color: '#5A3F2B',
    marginLeft: 10,
    flex: 1,
  },

  // Section Styles
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5A3F2B',
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4682B4', // Steel blue
    paddingLeft: 10,
  },

  // Button Styles
  buttonContainer: {
    gap: 12,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4', // Steel blue
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  updateButton: {
    backgroundColor: '#4682B4', // Steel blue
  },
  passwordButton: {
    backgroundColor: '#6B8E23', // Olive green
  },
  deleteButton: {
    backgroundColor: '#DC143C', // Crimson
  },
  logoutButton: {
    backgroundColor: '#8A7B6B', // Muted brown
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Work Cards Styles
  workCard: {
    backgroundColor: '#F8F5F0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4682B4', // Steel blue
  },
  pendingWorkCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500', // Orange gold
  },
  workTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5A3F2B',
    marginBottom: 5,
  },
  workDescription: {
    fontSize: 14,
    color: '#6B8E23',
    marginBottom: 8,
    lineHeight: 18,
  },
  workNGO: {
    fontSize: 13,
    color: '#4682B4',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  pickedDate: {
    fontSize: 12,
    color: '#8A7B6B',
    marginBottom: 10,
  },
  pickWorkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B8E23', // Olive green
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pickWorkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  completeWorkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B8E23', // Olive green
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  completeWorkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },

  // Medals Section
  workCount: {
    fontSize: 16,
    color: '#6B8E23',
    marginBottom: 15,
    textAlign: 'center',
  },
  medalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 15,
  },
  medal: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F5F0',
    borderRadius: 10,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  medalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A3F2B',
    marginTop: 5,
  },
  medalSubtext: {
    fontSize: 11,
    color: '#6B8E23',
  },

  // Completed Works Section
  completedWorksSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#5A3F2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  completedWorksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E8E0D5',
  },
  completedWorkImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  deleteImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(220, 20, 60, 0.8)', // Crimson
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndex: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(90, 63, 43, 0.8)', // Brown
    color: '#FFFFFF',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // Empty States
  emptyText: {
    fontSize: 14,
    color: '#8A7B6B',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    marginBottom: 15,
    color: '#8A7B6B',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8A7B6B',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#8A7B6B',
    textAlign: 'center',
  },
  noData: {
    textAlign: 'center',
    color: '#8A7B6B',
    fontStyle: 'italic',
    padding: 10,
  },

  // Achievements Section
  achievementsContainer: {
    padding: 10,
  },
  achievementText: {
    fontSize: 16,
    marginBottom: 15,
    color: '#5A3F2B',
  },
  count: {
    fontWeight: 'bold',
    color: '#4682B4', // Steel blue
    fontSize: 18,
  },
  medalsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#5A3F2B',
  },
  medalsList: {
    gap: 8,
  },
  medalAchievement: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B8E23', // Olive green
    padding: 5,
  },
  medalLocked: {
    fontSize: 14,
    color: '#8A7B6B',
    fontStyle: 'italic',
    padding: 5,
  },

  // Contact Section (for side by side layout)
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
  contactText: {
    fontSize: 12,
    color: '#5A3F2B',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
});