import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { collection, doc, getDocs, orderBy, query, where } from 'firebase/firestore';
import FoodRequestCard from '../components/FoodRequestCard';
import { useNavigation } from '@react-navigation/native';

const AcceptedFoodRequestList = () => {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        Alert.alert(
          'Login Required',
          'Please log in to view assigned requests'
        );
        navigation.navigate('volunteerLogin');
        return;
      }
      setCurrentUser(user);
    });

    return()=>unsubscribe();
  }, []);

  useEffect(()=>{
    if(currentUser){
        fetchRequests();
    }
  }, [currentUser]);

  const fetchRequests = async () =>{
    if(!currentUser) return;

    try{
        const q = query(
            collection(db, 'foodRequests'),
            where('foodRequest.status', '==', 'Approved'),
            where('foodRequest.volunteerAccepted', '==', 'false'),
        );
        const querySnapshot=await getDocs(q);

        const requestData = [];
        querySnapshot.forEach((doc) => {
            requestData.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        setRequests(requestData);
    } catch(error){
        console.error("Error fetching assigned requests: ", error);
        Alert.alert("Error", "Failed to load assigned requests");
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  const onRefresh=()=> {
    setRefreshing(true);
    fetchRequests();
  };

  const handleCardPress = (request) => {
    console.log("Selected assigned request: ", request.id);
    navigation.navigate('DisplayFoodRequest', {requestId: request.id});
  };

  const getRequestCounts = () => {
    return {total: requests.length};
  };

  const getFilteredRequests = () => {
    let filtered = requests;  

    if (sortBy === "newest") {
      filtered = filtered.sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return dateB - dateA;
      });
    } else if (sortBy === "oldest") {
      filtered = filtered.sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return dateA - dateB;
      });
    } else if (sortBy === "priority") {
      const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      filtered = filtered.sort((a, b) => {
        const prioA = priorityOrder[a.foodRequest?.priority] || 0;
        const prioB = priorityOrder[b.foodRequest?.priority] || 0;
        return prioB - prioA;
      });
    }

    return filtered;
  };

  const counts = getRequestCounts();
  const filteredRequests = getFilteredRequests();

  if (loading || !currentUser) {  
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
            <Text style={styles.headerTitle}>Available Requests</Text>
            <View style={styles.statsContainer}>
                <TouchableOpacity
            style={[styles.statItem, styles.activeFilter]}  
            onPress={() => {}}
          >
            <Text style={[styles.statNumber, styles.activeStatText]}>
              {counts.total}
            </Text>
            <Text style={[styles.statLabel, styles.activeStatLabel]}>
              Tasks available
            </Text>
          </TouchableOpacity>
            </View>
        </View>

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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
        }
      >
        {filteredRequests.length === 0 ?(
            <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>
              No assigned requests yet
            </Text> 
            <Text style={styles.emptySubtext}>Check back after accepting some</Text>
            </View>   
            ):(
                <View style={styles.cardsList}>
                    {filteredRequests.map((request) => (
              <FoodRequestCard
                key={request.id}
                request={request}
                onPress={handleCardPress}
              />
            ))}
                </View>
            ) 
    }

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
    paddingTop: 60,
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
    justifyContent: 'center',  // Centered for single stat
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
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
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

})

export default AcceptedFoodRequestList;
