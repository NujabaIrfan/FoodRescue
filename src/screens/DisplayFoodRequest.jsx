import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import {
  deleteDoc,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from 'react-native-ui-datepicker';

const DisplayFoodRequest = ({ route }) => {
  const { requestId } = route.params;
  const navigation = useNavigation();
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // for update feature
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [showEditRequiredDate, setShowEditRequiredDate] = useState(false);
  const [showEditPickupDate, setShowEditPickupDate] = useState(false);
  const [showEditPickupTime, setShowEditPickupTime] = useState(false);

  useEffect(() => {
    const fetchRequestData = async () => {
      if (!requestId) return;
      try {
        const docRef = doc(db, 'foodRequests', requestId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRequestData({
            id: docSnap.id,
            ...docSnap.data(),
          });
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching request: ', error);
        Alert.alert('Error', 'Failed to fetch request data');
      } finally {
        setLoading(false);
      }
    };
    fetchRequestData();
  }, [requestId]);
  // const fetchRequestData = async () => {
  //   if (!requestId.trim()) {
  //     Alert.alert('Error', 'Please enter a Request ID');
  //     return;
  //   }
  //   setLoading(true);
  //   setNotFound(false);
  //   setRequestData(null);

  //   try {

  //     const docRef = doc(db, "foodRequests", requestId.trim());
  //     const docSnap = await getDoc(docRef);

  //     if (docSnap.exists()) {
  //       setRequestData({
  //         id: docSnap.id,
  //         ...docSnap.data(),
  //       });
  //     } else {
  //       setNotFound(true);
  //       Alert.alert("Not Found", "No request found with this ID");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching request: ", error);
  //     Alert.alert("Error", "Failed to fetch request data");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const volunteerAcceptFoodRequest = async (requestId) => {
    try {
      const docRef = doc(db, 'foodRequests', requestId);
      await updateDoc(docRef, { 'foodRequest.volunteerAccepted': 'true' });
      Alert.alert('Success', 'Request assigned successfully');

      setRequestData((prev) => ({
        ...prev,
        foodRequest: { ...prev.foodRequest, volunteerAccepted: 'true' },
      }));
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert(
        'Error',
        'Failed to assign the request. Check console for details.'
      );
    }
  };

  const cancelVolunteerAssignment = async (requestId) => {
    try {
      const docRef = doc(db, 'foodRequests', requestId);
      await updateDoc(docRef, { 'foodRequest.volunteerAccepted': 'false' });
      Alert.alert('Success', 'Assignment cancelled');

      setRequestData((prev) => ({
        ...prev,
        foodRequest: { ...prev.foodRequest, volunteerAccepted: 'false' },
      }));
    } catch (error) {
      console.error('Error cancelling assignment:', error);
      Alert.alert('Error', 'Failed to cancel assignment');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not specified';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Not specified';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid time';
    }
  };

  const formatCreatedAt = (timestamp) => {
    if (!timestamp) return 'Not available';
    try {
      // Handle Firestore timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return 'Invalid timestamp';
    }
  };

  const clearSearch = () => {
    setReqestId('');
    setRequestData(null);
    setNotFound(false);
  };

  const deleteFoodRequest = async (requestId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete the request',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'foodRequests', requestId));
              Alert.alert('Success', 'Your request has been deleted');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting request: ', error);
              Alert.alert('Error', 'Failed to delete request');
            }
          },
        },
      ]
    );
  };

  // edit & update
  const handleEditMode = () => {
    setIsEditing(true);
    setEditData({
      items: requestData.foodRequest.items,
      requiredBefore: requestData.foodRequest.requiredBefore.toDate
        ? requestData.foodRequest.requiredBefore.toDate()
        : new Date(requestData.foodRequest.requiredBefore),
      priority: requestData.foodRequest.priority,
      pickupDate: requestData.foodRequest.pickupDate.toDate
        ? requestData.foodRequest.pickupDate.toDate()
        : new Date(requestData.foodRequest.pickupDate),
      pickupTime: requestData.foodRequest.pickupTime.toDate
        ? requestData.foodRequest.pickupTime.toDate()
        : new Date(requestData.foodRequest.pickupTime),
    });
  };

  const handleUpdateRequest = async () => {
    try {
      const docRef = doc(db, 'foodRequests', requestData.id);
      await updateDoc(docRef, {
        'foodRequest.items': editedData.items,
        'foodRequest.requiredBefore': Timestamp.formatDate(
          editedData.requiredBefore
        ),
        'foodRequest.priority': editedData.priority,
        'foodRequest.pickupDate': Timestamp.fromDate(editedData.pickupDate),
        'foodRequest.pickupTime': Timestamp.fromDate(editedData.pickupTime),
      });

      Alert.alert('Success', 'Request updated successfully');

      setRequestData((prev) => ({
        ...prev,
        foodRequest: {
          ...prev.foodRequest,
          items: editedData.items,
          requiredBefore: Timestamp.fromDate(editedData.requiredBefore),
          priority: editedData.priority,
          pickupDate: Timestamp.fromDate(editedData.pickupDate),
          pickupTime: Timestamp.fromDate(editedData.pickupTime),
        },
      }));

      setIsEditing(false);
    } catch (error) {
      console.log('Error updating request', error);
      Alert.alert('Error', 'Failed to update request');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* search section */}
        {/* <View style={styles.searchSection}>
          <Text style={styles.searchTitle}>Food Request Lookup</Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={requestId}
              onChangeText={setReqestId}
              placeholder="Enter Request ID"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.searchButton, loading && styles.disabledButton]}
                onPress={fetchRequestData}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearSearch}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View> */}

        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : notFound ? (
          <Text>No request found with ID: {requestId}</Text>
        ) : (
          requestData && (
            <View style={styles.resultContainer}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Request Details</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Request ID: </Text>
                  <Text style={styles.value}>{requestData.id}</Text>
                </View>

                {/* <View style={styles.detailRow}>
                <Text style={styles.label}>Request submitted on: </Text>
                <Text style={styles.value}>
                  {formatCreatedAt(requestData.createdAt)}
                </Text>
              </View> */}

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Organization: </Text>
                  <Text style={styles.value}>
                    {requestData.organization?.name || 'Not specified'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Requested By: </Text>
                  <Text style={styles.value}>
                    {requestData.organization?.requestedBy || 'Not specified'}
                  </Text>
                </View>

                {/* status section */}
                <View>
                  <Text style={styles.label}>Status:</Text>
                  <Text style={styles.value}>
                    {requestData.foodRequest?.status || 'Pending'}
                  </Text>
                </View>
              </View>

              {/* food details integrated with edit fucntion*/}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Food Details</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Donor:</Text>
                  <Text style={styles.value}>
                    {requestData.donor || 'Not assigned yet'}
                  </Text>
                </View>

                {/* food item + edit */}
                <View style={styles.foodItemsContainer}>
                  <Text style={styles.label}>Food Item(s)</Text>

                  {isEditing
                    ? editedData.items.map((item, index) => (
                        <View key={index} style={styles.foodItem}>
                          <Text style={styles.foodItemName}>{item.item}</Text>
                          <View style={styles.counterContainer}>
                            <TouchableOpacity
                              style={styles.counterButton}
                              onPress={() => {
                                const newItems = [...editedData.items];
                                newItems[index].amount = Math.max(
                                  1,
                                  parseInt(item.amount) - 1
                                ).toString();
                                setEditedData({
                                  ...editedData,
                                  items: newItems,
                                });
                              }}
                            >
                              <Text style={styles.counterText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.amountValue}>
                              {item.amount}
                            </Text>

                            <TouchableOpacity
                              style={styles.counterButton}
                              onPress={() => {
                                const newItems = [...editedData.items];
                                newItems[index].amount = (
                                  parseInt(item.amount) + 1
                                ).toString();
                                setEditedData({
                                  ...editedData,
                                  items: newItems,
                                });
                              }}
                            >
                              <Text style={styles.counterText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    : requestData.foodRequest?.items?.map((item, index) => (
                        <View key={index} style={styles.foodItem}>
                          <Text style={styles.foodItemName}>{item.item}</Text>
                          <Text style={styles.foodItemAmount}>
                            {item.amount}
                          </Text>
                        </View>
                      ))}
                </View>

                      {/* here to edit next */}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Required before:</Text>
                  <Text style={styles.value}>
                    {formatDate(requestData.foodRequest?.requiredBefore)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Priority:</Text>
                  <Text
                    style={[
                      styles.value,
                      styles.priorityText,
                      requestData.foodRequest?.priority === 'High' &&
                        styles.highPriority,
                      requestData.foodRequest?.priority === 'Urgent' &&
                        styles.urgentPriority,
                    ]}
                  >
                    {requestData.foodRequest?.priority || 'Medium'}
                  </Text>
                </View>
              </View>

              {/* Pick-up Details Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pick-up Details</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Available date:</Text>
                  <Text style={styles.value}>
                    {formatDate(requestData.foodRequest?.pickupDate)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Available time:</Text>
                  <Text style={styles.value}>
                    {formatTime(requestData.foodRequest?.pickupTime)}
                  </Text>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                {requestData.foodRequest?.status === 'Approved' && (
                  <TouchableOpacity
                    style={[
                      styles.searchButton,
                      requestData.foodRequest?.volunteerAccepted === 'true' &&
                        styles.disabledButton,
                    ]}
                    onPress={() => volunteerAcceptFoodRequest(requestData.id)}
                    disabled={
                      requestData.foodRequest?.volunteerAccepted === 'true'
                    }
                  >
                    <Text style={styles.searchButtonText}>
                      Assign Request to yourself
                    </Text>
                  </TouchableOpacity>
                )}

                {requestData.foodRequest?.volunteerAccepted === 'true' && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => cancelVolunteerAssignment(requestData.id)}
                  >
                    <Text style={styles.clearButtonText}>
                      Cancel Assignment
                    </Text>
                  </TouchableOpacity>
                )}

                {/* delete req */}
                {requestData.foodRequest?.status === 'Pending' && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteFoodRequest(requestData.id)}
                  >
                    <Text style={styles.deleteButtonText}>
                      Withdraw Request
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  searchSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  searchContainer: {
    gap: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
  },
  resultContainer: {
    gap: 15,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    flex: 1,
    minWidth: 120,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    fontWeight: '400',
  },
  foodItemsContainer: {
    marginBottom: 15,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    marginTop: 5,
  },
  foodItemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  foodItemAmount: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  priorityText: {
    fontWeight: 'bold',
  },
  highPriority: {
    color: '#dc3545',
  },
  urgentPriority: {
    color: '#e74c3c',
  },
  statusContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#6c757d',
  },
  pendingStatus: {
    backgroundColor: '#ffc107',
  },
  inProgressStatus: {
    backgroundColor: '#17a2b8',
  },
  completedStatus: {
    backgroundColor: '#28a745',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notFoundContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  notFoundText: {
    fontSize: 16,
    color: '#856404',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notFoundSubtext: {
    fontSize: 14,
    color: '#856404',
  },
  buttonContainer: {
    gap: 10,
    marginTop: 10,
  },

  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DisplayFoodRequest;
