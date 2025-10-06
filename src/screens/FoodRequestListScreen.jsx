import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import { auth, db } from '../../firebaseConfig';
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import FoodRequestCard from "../components/FoodRequestCard";
import { useNavigation } from "@react-navigation/native";

const FoodRequestListScreen = ({ route }) => {
  const { id } = route?.params || {}
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchRequests();
  }, [id]);

  const fetchRequests = async () => {
    try {
      const q = id
        ? query(collection(db, "foodRequests"), where("organization.id", "==", id))
        : query(collection(db,"foodRequests"));
      const querySnapshot=await getDocs(q);

      const requestData = [];
      querySnapshot.forEach((doc) => {
        requestData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setRequests(requestData);
    } catch (error) {
      console.error("Error fetching requests: ", error);
      Alert.alert("Error", "Failed to load food requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleCardPress = (request) => {
    console.log("Selected request: ", request.id);

    // Option 1: Navigate to DisplayFoodRequest screen with pre-filled ID
    navigation.navigate('DisplayFoodRequest', { requestId: request.id });

    // Option 2: Navigate to a dedicated detail screen
    // navigation.navigate('RequestDetails', { request });

    Alert.alert(
      "Request Selected",
      `Request ID: ${request.id}\nOrganization: ${request.organization?.name}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "View Details",
          onPress: () => console.log("Navigate to details"),
        },
      ]
    );
  };

  const getRequestCounts = () => {
  const pending = requests.filter((r) => r.foodRequest?.status === "Pending").length;
  const approved = requests.filter((r) => r.foodRequest?.status === "Approved").length;
  const rejected = requests.filter((r) => r.foodRequest?.status === "Rejected").length;
  
  return { pending, approved, rejected, total: requests.length };
};

  const getFilteredRequests = () => {
  let filtered = requests.filter(
    (request) => filterStatus === "all" || request.foodRequest?.status === filterStatus
  );

  if (sortBy === "newest") {
    filtered = filtered.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
      const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
      return dateB - dateA;  // Descending (newest first)
    });
  } else if (sortBy === "oldest") {
    filtered = filtered.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
      const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
      return dateA - dateB;  // Ascending (oldest first)
    });
  } else if (sortBy === "priority") {
    const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
    filtered = filtered.sort((a, b) => {
      const prioA = priorityOrder[a.foodRequest?.priority] || 0;
      const prioB = priorityOrder[b.foodRequest?.priority] || 0;
      return prioB - prioA;  // Descending (highest priority first)
    });
  }

  return filtered;
};

  const counts = getRequestCounts();
  const filteredRequests = getFilteredRequests();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Requests</Text>
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[
              styles.statItem,
              filterStatus === "all" && styles.activeFilter,
            ]}
            onPress={() => setFilterStatus("all")}
          >
            <Text
              style={[
                styles.statNumber,
                filterStatus === "all" && styles.activeStatText,
              ]}
            >
              {counts.total}
            </Text>
            <Text style={[styles.statLabel, filterStatus === 'all' && styles.activeStatLabel]}>
              Total
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statItem, filterStatus === 'pending' && styles.activeFilter]} 
            onPress={() => setFilterStatus('Pending')}
          >
            <Text style={[styles.statNumber, { color: '#ffc107' }, filterStatus === 'pending' && styles.activeStatText]}>
              {counts.pending}
            </Text>
            <Text style={[styles.statLabel, filterStatus === 'pending' && styles.activeStatLabel]}>
              Pending
            </Text>

          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statItem, filterStatus === 'rejected' && styles.activeFilter]} 
            onPress={() => setFilterStatus('Rejected')}
          >
            <Text style={[styles.statNumber, { color: '#b82f17ff' }, filterStatus === 'rejected' && styles.activeStatText]}>
              {counts.rejected}
            </Text>
            <Text style={[styles.statLabel, filterStatus === 'rejected' && styles.activeStatLabel]}>
              Rejected
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statItem, filterStatus === 'approved' && styles.activeFilter]} 
            onPress={() => setFilterStatus('Approved')}
          >
            <Text style={[styles.statNumber, { color: '#28a745' }, filterStatus === 'approved' && styles.activeStatText]}>
              {counts.approved}
            </Text>
            <Text style={[styles.statLabel, filterStatus === 'approved' && styles.activeStatLabel]}>
              Approved
            </Text>

          </TouchableOpacity>
        </View>
      </View>

      {filterStatus !== 'all' && (
        <View style={styles.filterInfo}>
          <Text style={styles.filterText}>
            Showing {filteredRequests.length} {filterStatus} request(s)
          </Text>
          <TouchableOpacity onPress={() => setFilterStatus('all')}>
            <Text style={styles.clearFilterText}>Show All</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'newest' && styles.activeSort]}
          onPress={() => setSortBy('newest')}
        >
          <Text style={styles.sortText}>Newest</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'oldest' && styles.activeSort]}
          onPress={() => setSortBy('oldest')}
        >
          <Text style={styles.sortText}>Oldest</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'priority' && styles.activeSort]}
          onPress={() => setSortBy('priority')}
        >
          <Text style={styles.sortText}>Priority</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filterStatus === 'all' ? 'No food requests found' : `No ${filterStatus} requests`}
            </Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {filteredRequests.map((request) => (
              <FoodRequestCard
                key={request.id}
                request={request}
                onPress={handleCardPress}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60, // Account for status bar
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeFilter: {
    backgroundColor: '#e3f2fd',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  activeStatText: {
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activeStatLabel: {
    color: '#1976d2',
    fontWeight: '600',
  },
  filterInfo: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    color: '#1976d2',
  },
  clearFilterText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  cardsList: {
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  activeSort: {
    backgroundColor: '#e3f2fd',
  },
  sortText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default FoodRequestListScreen;
