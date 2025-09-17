import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from "firebase/firestore";


const DisplayRequestAdminInterface = () => {
  const [requestId, setReqestId] = useState("");
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchRequestData = async () => {
    if (!requestId.trim()) {
      Alert.alert('Error', 'Please enter a Request ID');
      return;
    }
    setLoading(true);
    setNotFound(false);
    setRequestData(null);

    try {
      
      const docRef = doc(db, "foodRequests", requestId.trim());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setRequestData({
          id: docSnap.id,
          ...docSnap.data(),
        });
      } else {
        setNotFound(true);
        Alert.alert("Not Found", "No request found with this ID");
      }
    } catch (error) {
      console.error("Error fetching request: ", error);
      Alert.alert("Error", "Failed to fetch request data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Not specified";
    try {
      const date = timestamp.toDate? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Not specified";
    try {
      const date = timestamp.toDate? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid time";
    }
  };

  const formatCreatedAt = (timestamp) => {
    if (!timestamp) return "Not available";
    try {
      // Handle Firestore timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return "Invalid timestamp";
    }
  };

  const clearSearch = () => {
    setReqestId("");
    setRequestData(null);
    setNotFound(false);
  };

  const acceptRequest = async (requestId) => {
  try {
    const docRef = doc(db, "foodRequests", requestId);
    await updateDoc(docRef, { "foodRequest.status": "Approved" });
    Alert.alert("Success", "Request approved successfully");
    
    setRequestData((prev) => ({ ...prev, status: "Approved" }));
  } catch (error) {
    console.error("Error updating request:", error);
    Alert.alert("Error", "Failed to approve the request. Check console for details.");
  }
};

const rejectRequest = async (requestId) => {
  try {
    const docRef = doc(db, "foodRequests", requestId);
    await updateDoc(docRef, { "foodRequest.status": "Rejected" });
    Alert.alert("Success", "Request rejected successfully");
    setRequestData((prev) => ({ ...prev, status: "Rejected" }));
  } catch (error) {
    console.error("Error updating request:", error);
    Alert.alert("Error", "Failed to reject the request. Check console for details.");
  }
};
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* search section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchTitle}>Food Request Approval</Text>

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
        </View>

        {/* Display res?ults */}
        {requestData && (
          <View style={styles.resultContainer}>
            {/* request details */}
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
                  {requestData.organization?.name || "Not specified"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Requested By: </Text>
                <Text style={styles.value}>
                  {requestData.organization?.requestedBy || "Not specified"}
                </Text>
              </View>
            </View>

            {/* food details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Food Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Donor:</Text>
                <Text style={styles.value}>
                  {requestData.donor || "Not assigned yet"}
                </Text>
              </View>

              <View style={styles.foodItemsContainer}>
                <Text style={styles.label}>Food Item(s)</Text>
                {requestData.foodRequest?.items?.map((item, index) => (
                  <View key={index} style={styles.foodItem}>
                    <Text style={styles.foodItemName}>{item.item}</Text>
                    <Text style={styles.foodItemAmount}>{item.amount}</Text>
                  </View>
                ))}
              </View>

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
                    requestData.foodRequest?.priority === "High" &&
                      styles.highPriority,
                    requestData.foodRequest?.priority === "Urgent" &&
                      styles.urgentPriority,
                  ]}
                >
                  {requestData.foodRequest?.priority || "Medium"}
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

            {/* status section */}
            <Text style={styles.statusLabel}>Status:</Text>
            <View>
                <TouchableOpacity onPress={() => acceptRequest(requestData.id)} style={styles.acceptButton}>
                    <Text style={styles.approvalButtonText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => rejectRequest(requestData.id)} style={styles.rejectButton}>
                    <Text style={styles.approvalButtonText}>Reject</Text>
                </TouchableOpacity>

                <View>
                    <Text>      </Text>
                    <Text>      </Text>
                    <Text>      </Text>
                    <Text>      </Text>
                </View>
            </View>

            {/* Not found message */}
            {notFound && (
              <View style={styles.notFoundContainer}>
                <Text style={styles.notFoundText}>
                  No request found with ID: {requestId}
                </Text>
                <Text style={styles.notFoundSubtext}>
                  Please check the ID and try again
                </Text>
              </View>
            )}
          </View>
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
  acceptButton:{
    backgroundColor: "#106a25ff",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 20,
  },
  rejectButton:{
    backgroundColor: "#6a1810ff",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 20,
  },
  approvalButtonText:{
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
});

export default DisplayRequestAdminInterface;
