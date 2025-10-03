import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch, TextInput, Alert, Button, RefreshControl } from "react-native";
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
  const [refreshing, setRefreshing] = useState(false);
  const [completedWorkPhotos, setCompletedWorkPhotos] = useState([]); 

  useEffect(() => {
    navigation.setOptions({ title: 'My Profile' });
  }, [navigation]);
  
  const fetchVolunteerData = async () => {
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
      setRefreshing(false);
    }
  };

  // Update your useEffect to use the new function
  useEffect(() => {
    fetchVolunteerData();
    fetchAvailableWorks();
  }, []);

  // Add pull-to-refresh functionality
  const onRefresh = () => {
    setRefreshing(true);
    fetchVolunteerData();
    fetchAvailableWorks();
  };

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

  // Fetch available food requests (corrected)
  const fetchAvailableWorks = async () => {
    try {
      console.log("🟡 STARTING fetchAvailableWorks");
      
      const worksSnapshot = await getDocs(collection(db, "foodRequests"));
      console.log("🔵 Total documents in foodRequests:", worksSnapshot.size);
      
      const works = [];
      
      worksSnapshot.forEach((doc) => {
        const requestData = doc.data();
        
        // FIX: Check both possible status locations - NESTED FIRST
        const status = requestData.foodRequest?.status || requestData.status || "Pending";
        
        console.log("📄 Processing document:", doc.id);
        console.log("🔍 Document status:", requestData.status);
        console.log("🔍 FoodRequest status:", requestData.foodRequest?.status);
        console.log("🔍 Final status used:", status);
        
        // Only include pending requests
        if (status === "Pending") {
          console.log("✅ ADDING to available works");
          
          // Handle different possible data structures
          let foodItem = "";
          let organizationName = "";
          let requestedBy = "";
          
          // Get food item from nested structure
          if (requestData.foodRequest?.items?.[0]?.item) {
            foodItem = requestData.foodRequest.items[0].item;
          } else if (requestData.foodItem) {
            foodItem = requestData.foodItem;
          } else if (requestData.items?.[0]?.item) {
            foodItem = requestData.items[0].item;
          }
          
          console.log("🍲 Food item found:", foodItem);
          
          // Check organization structure
          if (typeof requestData.organization === 'string') {
            organizationName = requestData.organization;
          } else if (requestData.organization?.name) {
            organizationName = requestData.organization.name;
          }
          
          // Check requestedBy structure
          if (requestData.requestedBy) {
            requestedBy = requestData.requestedBy;
          } else if (requestData.organization?.requestedBy) {
            requestedBy = requestData.organization.requestedBy;
          }

          // FIX: Convert Firestore Timestamps to readable strings
          const convertTimestamp = (timestamp) => {
            if (!timestamp) return "";
            try {
              if (timestamp.seconds && timestamp.nanoseconds) {
                // It's a Firestore Timestamp
                const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
                return date.toLocaleDateString();
              } else if (timestamp.toDate) {
                // It's a Firestore Timestamp object with toDate method
                return timestamp.toDate().toLocaleDateString();
              }
              return String(timestamp);
            } catch {
              return "Invalid date";
            }
          };

          const convertTime = (timestamp) => {
            if (!timestamp) return "";
            try {
              if (timestamp.seconds && timestamp.nanoseconds) {
                // It's a Firestore Timestamp
                const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } else if (timestamp.toDate) {
                // It's a Firestore Timestamp object with toDate method
                return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
              return String(timestamp);
            } catch {
              return "Invalid time";
            }
          };
          
          works.push({ 
            id: doc.id,
            title: foodItem || "Food Request",
            description: foodItem || "Food Donation",
            amount: requestData.foodRequest?.items?.[0]?.amount || "1",
            item: foodItem || "Food",
            foodItem: foodItem,
            priority: requestData.foodRequest?.priority || "Medium",
            // FIX: Convert timestamps to strings
            pickupDate: convertTimestamp(requestData.foodRequest?.pickupDate),
            pickupTime: convertTime(requestData.foodRequest?.pickupTime),
            availableDate: convertTimestamp(requestData.foodRequest?.pickupDate),
            availableTime: convertTime(requestData.foodRequest?.pickupTime),
            requiredBefore: convertTimestamp(requestData.foodRequest?.requiredBefore) || "",
            status: status,
            organization: {
              name: organizationName || "Unknown Organization",
              requestedBy: requestedBy || ""
            },
            type: "food_request"
          });
        } else {
          console.log("❌ SKIPPING - Status is not Pending:", status);
        }
      });
      
      console.log("📦 Final works array length:", works.length);
      console.log("📦 Final works:", works);
      
      setAvailableWorks(works);
    } catch (error) {
      console.error("❌ Error fetching available works:", error);
    }
  };

  // Pick work functionality (updated for food requests)
  const pickWork = async (work) => {
    try {
      const user = auth.currentUser;
      if (user && work.id) {
        const volunteerDocRef = doc(db, "Volunteers", user.uid);
        
        // Get current volunteer data
        const volunteerDoc = await getDoc(volunteerDocRef);
        const volunteerData = volunteerDoc.exists() ? volunteerDoc.data() : {};
        const existingPendingWorks = volunteerData.pendingWorks || [];
        
        // Create work object
        const acceptedWork = {
          id: work.id,
          title: work.title || "Food Request",
          type: "food_request",
          status: "Accepted",
          pickedAt: new Date().toISOString(),
          volunteerId: user.uid,
          volunteerName: user.displayName || "Volunteer",
          foodItem: work.foodItem,
          organization: work.organization,
          availableDate: work.availableDate,
          availableTime: work.availableTime,
          requiredBefore: work.requiredBefore,
          priority: work.priority
        };
        
        const updatedPendingWorks = [...existingPendingWorks, acceptedWork];
        
        // Update BOTH status fields in food request
        await updateDoc(doc(db, "foodRequests", work.id), {
          status: "Accepted", // Document level
          "foodRequest.status": "Accepted", // Nested level
          acceptedBy: user.uid,
          acceptedByVolunteer: user.displayName || "Volunteer",
          acceptedAt: new Date().toISOString(),
          donor: user.displayName || "Volunteer"
        });
        
        // Update volunteer document
        await updateDoc(volunteerDocRef, { 
          pendingWorks: updatedPendingWorks 
        });
        
        // Update local state
        setPendingWorks(updatedPendingWorks);
        
        // Refresh available works to remove the accepted one
        fetchAvailableWorks();
        
        Toast.show({
          type: 'success',
          text1: 'Request Accepted!',
          text2: 'Food request added to your pending tasks'
        });
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to accept request: ' + error.message
      });
    }
  };

  //Complete work functionality
  const completeWork = async (workIndex) => {
    try {
      const user = auth.currentUser;
      if (user && pendingWorks[workIndex]) {
        const work = pendingWorks[workIndex];
        
        // Remove from pending works
        const updatedPendingWorks = pendingWorks.filter((_, index) => index !== workIndex);
        
        // Add to completed works WITH empty photos array
        const completedWork = {
          ...work,
          completedAt: new Date().toISOString(),
          status: "Completed",
          completionPhotos: [] // Initialize empty photos array
        };
        
        const updatedCompletedWorks = [...completedWorks, completedWork];
        const newCompletedCount = completedWorkCount + 1;
        
        console.log("📝 Adding to completed works:", completedWork);
        console.log("📊 Updated completed works array:", updatedCompletedWorks);
        
        // Update volunteer document in Firestore
        await updateDoc(doc(db, "Volunteers", user.uid), {
          pendingWorks: updatedPendingWorks,
          completedWorks: updatedCompletedWorks,
          completedWorkCount: newCompletedCount
        });
        
        // If it's a food request, update its status in the foodRequests collection
        if (work.type === "food_request" && work.id) {
          await updateDoc(doc(db, "foodRequests", work.id), {
            status: "Completed",
            completedAt: new Date().toISOString(),
            completedBy: user.uid,
            completedByVolunteer: user.displayName || "Volunteer"
          });
        }
        
        // Update local state
        setPendingWorks(updatedPendingWorks);
        setCompletedWorks(updatedCompletedWorks);
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to mark work as completed'
      });
    }
  };

  const renderPendingWorks = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏳ My Pending Works ({pendingWorks.length})</Text>
        {pendingWorks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateText}>No pending works</Text>
            <Text style={styles.emptyStateSubtext}>
              Click "Browse All Food Requests" to find available tasks
            </Text>
          </View>
        ) : (
          pendingWorks.map((work, index) => (
            <View key={index} style={styles.workCard}>
              {/* Header with title and status */}
              <View style={styles.cardHeader}>
                <Text style={styles.workTitle}>{work.title || work.foodItem || "Food Request"}</Text>
                <View style={[
                  styles.statusBadge,
                  work.priority === "High" && styles.highPriorityBadge,
                  work.priority === "Urgent" && styles.urgentPriorityBadge
                ]}>
                  <Text style={styles.statusText}>
                    {work.priority || "Medium"}
                  </Text>
                </View>
              </View>

              {/* Organization */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>🏢 Organization:</Text>
                <Text style={styles.detailValue}>
                  {work.organization?.name || work.organization || "Unknown Organization"}
                </Text>
              </View>

              {/* Food Item */}
              {work.foodItem && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🍲 Food Item:</Text>
                  <Text style={styles.detailValue}>{work.foodItem}</Text>
                </View>
              )}

              {/* Pickup Details */}
              {work.availableDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>📅 Pickup:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(work.availableDate).toLocaleDateString()} at {work.availableTime || "specified time"}
                  </Text>
                </View>
              )}

              {/* Required Before */}
              {work.requiredBefore && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>⏰ Required Before:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(work.requiredBefore).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {/* Accepted Date */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>✅ Accepted:</Text>
                <Text style={styles.detailValue}>
                  {work.pickedAt ? new Date(work.pickedAt).toLocaleDateString() : 'Recently'}
                </Text>
              </View>

              {/* Complete Button */}
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

  const pickCompletedWorkPhoto = (workIndex) => {
  console.log("📸 Uploading photo for work index:", workIndex);
  console.log("📁 Current completed works:", completedWorks);
  
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

        // Check if work exists
        if (!completedWorks[workIndex]) {
          Toast.show({
            type: 'error',
            text1: 'Work Not Found',
            text2: 'Completed work not found for photo upload.',
            position: 'top'
          });
          return;
        }

        // Check maximum photos limit per work
        const MAX_PHOTOS_PER_WORK = 3;
        const currentWork = completedWorks[workIndex];
        
        const currentPhotos = currentWork.completionPhotos || [];
        if (currentPhotos.length >= MAX_PHOTOS_PER_WORK) {
          Toast.show({
            type: 'error',
            text1: 'Maximum Photos Reached',
            text2: `You can only upload up to ${MAX_PHOTOS_PER_WORK} photos per work.`,
            position: 'top'
          });
          return;
        }

        setUploading(true);
        
        // Determine MIME type
        let mimeType = file.type;
        if (!mimeType || mimeType === 'undefined') {
          if (file.fileName) {
            if (file.fileName.toLowerCase().endsWith('.png')) {
              mimeType = 'image/png';
            } else if (file.fileName.toLowerCase().endsWith('.gif')) {
              mimeType = 'image/gif';
            } else {
              mimeType = 'image/jpeg';
            }
          } else {
            mimeType = 'image/jpeg';
          }
        }
        
        console.log("Detected MIME type:", mimeType);
        
        // Convert to Base64 string
        const base64Image = `data:${mimeType};base64,${file.base64}`;
        
        // Add photo to specific work
        const updatedCompletedWorks = [...completedWorks];
        if (!updatedCompletedWorks[workIndex].completionPhotos) {
          updatedCompletedWorks[workIndex].completionPhotos = [];
        }
        updatedCompletedWorks[workIndex].completionPhotos.push(base64Image);
        
        console.log("🔄 Updated work with photo:", updatedCompletedWorks[workIndex]);
        
        try {
          const user = auth.currentUser;
          if (user) {
            await updateDoc(doc(db, "Volunteers", user.uid), { 
              completedWorks: updatedCompletedWorks 
            });
            setCompletedWorks(updatedCompletedWorks);
            Toast.show({ 
              type: 'success', 
              text1: 'Work photo added!',
              text2: `Photo ${updatedCompletedWorks[workIndex].completionPhotos.length}/${MAX_PHOTOS_PER_WORK}`
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
    <ScrollView contentContainerStyle={styles.container} refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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
                <Text style={styles.sectionTitle}>Find New Tasks</Text>
                <TouchableOpacity 
                  style={styles.navigateButton}
                  onPress={() => navigation.navigate('foodRequestListScreen')}
                >
                  <Text style={styles.navigateButtonText}>📋 Browse All Food Requests</Text>
                </TouchableOpacity>
              </View>

              {/* Pending Works Section */}
              {renderPendingWorks()}

              {/* Medals Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏆 My Medals</Text>
                <Text style={styles.workCount}>📊 Completed Works: {completedWorkCount}</Text>
                
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
                  onPress={pickCompletedWorkPhoto }
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

  section: {
    marginBottom: 25,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 15,
    textAlign: 'center',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
  
  // Work Card
  workCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    flex: 1,
    marginRight: 10,
  },
  
  // Priority Badge
  statusBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
  },
  highPriorityBadge: {
    backgroundColor: '#fd7e14',
  },
  urgentPriorityBadge: {
    backgroundColor: '#dc3545',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Detail Rows
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#6c757d',
    flex: 1,
  },
  
  // Complete Button
  completeButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // No Data Text
  noData: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 16,
    fontStyle: 'italic',
    marginVertical: 20,
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
  navigateButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 10,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});