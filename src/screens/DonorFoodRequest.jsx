import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const FoodRequestViewer = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const navigation = useNavigation(); 

      useEffect(() => {
          navigation.setOptions({
              title: 'Surplus List',
              headerStyle: {
                  backgroundColor: '#389c9a',
                  elevation: 0, // Android shadow
                  shadowOpacity: 0, // iOS shadow
              },
              headerTintColor: '#fff', // back arrow / text color
              headerTitleStyle: {
                  fontWeight: 'bold',
                  fontSize: 20,
              },
          });
      }, [navigation]);

  useEffect(() => {
    fetchFoodRequests();
  }, []);

  const fetchFoodRequests = async () => {
    try {
      const db = getFirestore();
      const querySnapshot = await getDocs(collection(db, 'foodRequests'));
      
      const requestsData = [];
      querySnapshot.forEach((doc) => {
        requestsData.push({ id: doc.id, ...doc.data() });
      });
      
      setRequests(requestsData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const updateSurplusItems = async (requestItems) => {
    try {
      const db = getFirestore();
      const batch = writeBatch(db);
      
      for (const item of requestItems) {
        // Find matching surplus items by name
        const surplusQuery = query(
          collection(db, 'surplusItems'),
          where('name', '==', item.item),
          where('status', '==', 'available')
        );
        
        const surplusSnapshot = await getDocs(surplusQuery);
        
        if (surplusSnapshot.empty) {
          console.warn(`No available surplus items found for: ${item.item}`);
          continue;
        }

        let remainingQuantity = item.amount;
        
        // Process surplus items to reduce quantity
        for (const surplusDoc of surplusSnapshot.docs) {
          if (remainingQuantity <= 0) break;
          
          const surplusData = surplusDoc.data();
          const surplusId = surplusDoc.id;
          const currentQuantity = surplusData.quantity;
          
          if (currentQuantity > 0) {
            const quantityToReduce = Math.min(remainingQuantity, currentQuantity);
            const newQuantity = currentQuantity - quantityToReduce;
            
            // Update the surplus item
            const surplusRef = doc(db, 'surplusItems', surplusId);
            
            if (newQuantity === 0) {
              // If quantity becomes zero, mark as unavailable
              batch.update(surplusRef, {
                quantity: 0,
                status: 'unavailable',
                updatedAt: new Date()
              });
            } else {
              // Otherwise just reduce the quantity
              batch.update(surplusRef, {
                quantity: newQuantity,
                updatedAt: new Date()
              });
            }
            
            remainingQuantity -= quantityToReduce;
            console.log(`Reduced ${quantityToReduce} units of ${item.item} from surplus item ${surplusId}`);
          }
        }
        
        if (remainingQuantity > 0) {
          console.warn(`Insufficient surplus quantity for ${item.item}. Needed: ${item.amount}, Remaining: ${remainingQuantity}`);
        }
      }
      
      // Commit all updates
      await batch.commit();
      console.log('Successfully updated surplus items');
      
    } catch (err) {
      console.error('Error updating surplus items:', err);
      throw new Error(`Failed to update surplus items: ${err.message}`);
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      setUpdatingId(requestId);
      const db = getFirestore();
      const requestRef = doc(db, 'foodRequests', requestId);
      
      // Get the current request data to access items
      const currentRequest = requests.find(req => req.id === requestId);
      const requestItems = currentRequest?.foodRequest?.items || [];

      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
      };

      // Also update the nested foodRequest status using dot notation
      updateData['foodRequest.status'] = newStatus;

      // Add acceptedAt timestamp if accepting
      if (newStatus === 'Accepted') {
        updateData.acceptedAt = new Date();
        updateData.acceptedBy = 'current_user_id';
        updateData.acceptedByVolunteer = 'Volunteer';

        // Update surplus items when request is accepted
        try {
          await updateSurplusItems(requestItems);
          console.log('Surplus items updated successfully');
        } catch (surplusError) {
          // Even if surplus update fails, still mark the request as accepted
          // but show a warning to the user
          console.warn('Request accepted but surplus update failed:', surplusError);
          Alert.alert(
            'Warning', 
            'Request accepted but there was an issue updating inventory. Please check surplus items manually.'
          );
        }
      }

      // Add completedAt timestamp if rejecting
      if (newStatus === 'Rejected') {
        updateData.completedAt = new Date();
        updateData.completedBy = 'current_user_id';
        updateData.completedByVolunteer = 'Volunteer';
      }

      await updateDoc(requestRef, updateData);
      
      // Update local state immediately - update both status fields
      setRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? { 
                ...request, 
                status: newStatus,
                foodRequest: {
                  ...request.foodRequest,
                  status: newStatus
                },
                ...(newStatus === 'Accepted' && {
                  acceptedAt: new Date(),
                  acceptedBy: 'current_user_id',
                  acceptedByVolunteer: 'Volunteer'
                }),
                ...(newStatus === 'Rejected' && {
                  completedAt: new Date(),
                  completedBy: 'current_user_id',
                  completedByVolunteer: 'Volunteer'
                })
              }
            : request
        )
      );
      
      Alert.alert('Success', `Request ${newStatus.toLowerCase()} successfully!`);
    } catch (err) {
      Alert.alert('Error', `Failed to update request: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAccept = (requestId) => {
    Alert.alert(
      'Accept Request',
      'Are you sure you want to accept this food request? This will reduce the available surplus items quantity.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => updateRequestStatus(requestId, 'Accepted') }
      ]
    );
  };

  const handleReject = (requestId) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this food request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', onPress: () => updateRequestStatus(requestId, 'Rejected') }
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'accepted':
        return '#3b82f6';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#ea580c';
      case 'low':
        return '#16a34a';
      default:
        return '#6b7280';
    }
  };

  const renderActionButtons = (request) => {
    const currentStatus = request.status?.toLowerCase();
    
    // Don't show buttons for completed or rejected requests
    if (currentStatus === 'completed' || currentStatus === 'rejected' || currentStatus === 'accepted') {
      return (
        <View style={[styles.actionButtons, styles.singleButton]}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completedButton, { backgroundColor: getStatusColor(request.status) }]}
            disabled
          >
            <Text style={styles.completedButtonText}>
              {request.status}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show Accept/Reject buttons for pending requests
    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(request.id)}
          disabled={updatingId === request.id}
        >
          {updatingId === request.id ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.rejectButtonText}>Reject</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAccept(request.id)}
          disabled={updatingId === request.id}
        >
          {updatingId === request.id ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading food requests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHint}>Please check your Firebase configuration</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchFoodRequests}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Food Requests Dashboard</Text>
        <Text style={styles.subtitle}>Manage and track all food donation requests</Text>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Requests Found</Text>
          <Text style={styles.emptyText}>There are currently no food requests in the system.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchFoodRequests}
          >
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {requests.map((request) => (
            <View key={request.id} style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderContent}>
                  <Text style={styles.orgName} numberOfLines={2}>
                    {request.organization?.name || 'N/A'}
                  </Text>
                  <Text style={styles.orgId}>ID: {request.organization?.id || 'N/A'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                  <Text style={styles.statusText}>{request.status || 'Unknown'}</Text>
                </View>
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                {/* Items List */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Requested Items</Text>
                  {request.foodRequest?.items?.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.item}</Text>
                      <View style={styles.amountBadge}>
                        <Text style={styles.amountText}>{item.amount} units</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Request Details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Priority</Text>
                    <Text style={[styles.detailValue, { color: getPriorityColor(request.foodRequest?.priority) }]}>
                      {request.foodRequest?.priority || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={[styles.detailValue, { color: getStatusColor(request.status) }]} numberOfLines={1}>
                      {request.status || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Dates */}
                <View style={styles.section}>
                  <View style={styles.dateRow}>
                    <Text style={styles.dateLabel}>Pickup Date</Text>
                    <Text style={styles.dateValue}>{formatDate(request.foodRequest?.pickupDate)}</Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Text style={styles.dateLabel}>Required Before</Text>
                    <Text style={styles.dateValue}>{formatDate(request.foodRequest?.requiredBefore)}</Text>
                  </View>
                </View>

                {/* People Involved */}
                <View style={[styles.section, styles.borderTop]}>
                  <View style={styles.peopleRow}>
                    <Text style={styles.peopleLabel}>Requested By</Text>
                    <Text style={styles.peopleValue} numberOfLines={1}>{request.requestedBy || 'N/A'}</Text>
                  </View>
                  <View style={styles.peopleRow}>
                    <Text style={styles.peopleLabel}>Donor</Text>
                    <Text style={styles.peopleValue} numberOfLines={1}>{request.donor || 'N/A'}</Text>
                  </View>
                  {request.acceptedBy && (
                    <View style={styles.peopleRow}>
                      <Text style={styles.peopleLabel}>Accepted By</Text>
                      <Text style={styles.peopleValue} numberOfLines={1}>{request.acceptedByVolunteer || 'N/A'}</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                {renderActionButtons(request)}

                {/* Timestamps */}
                <View style={[styles.section, styles.borderTop]}>
                  {request.acceptedAt && (
                    <View style={styles.dateRow}>
                      <Text style={styles.dateLabel}>Accepted At</Text>
                      <Text style={styles.dateValue}>{formatDate(request.acceptedAt)}</Text>
                    </View>
                  )}
                  {request.completedAt && (
                    <View style={styles.dateRow}>
                      <Text style={styles.dateLabel}>Completed At</Text>
                      <Text style={styles.dateValue}>{formatDate(request.completedAt)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8dd8c',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: '#fca5a5',
    maxWidth: 400,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#991b1b',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: isTablet ? 32 : 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#6b7280',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 48,
    margin: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  cardsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#389c9a',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  orgName: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  orgId: {
    fontSize: 12,
    color: '#c7d2fe',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  amountBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338ca',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailLabel: {
    fontSize: 11,
    color: '#78716c',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateRow: {
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  peopleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  peopleLabel: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  peopleValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  singleButton: {
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  completedButton: {
    backgroundColor: '#6b7280',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  completedButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FoodRequestViewer;