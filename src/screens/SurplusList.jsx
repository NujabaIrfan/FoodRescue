// screens/SurplusList.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import SurplusItemCard from '../components/SurplusItemCard';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SurplusList = () => {
    const navigation = useNavigation(); 
    const route = useRoute();
    const { providerId, providerName } = route.params || {};
    const [surplusItems, setSurplusItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        const fetchSurplusItems = async () => {
            if (!providerId) {
                setError("No donor information provided.");
                setLoading(false);
                return;
            }
            try {
                const q = query(
                    collection(db, 'surplusItems'),
                    where('providerId', '==', providerId)
                );
                const querySnapshot = await getDocs(q);
                const items = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }))
                    // Filter out items with quantity zero or less
                    .filter(item => item.quantity > 0)
                    // Also filter out items with status 'unavailable' if that field exists
                    .filter(item => item.status !== 'unavailable');
                
                setSurplusItems(items);
            } catch (err) {
                console.error("Error fetching surplus items: ", err);
                setError("Failed to load surplus items. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchSurplusItems();
    }, [providerId]);

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#4a90e2" />
                <Text style={styles.loadingText}>Loading items...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Icon name="error-outline" size={40} color="#e74c3c" />
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>{providerName}'s Surplus</Text>
            <Text style={styles.headerSubtitle}>Available items for collection.</Text>
            
            <FlatList
                contentContainerStyle={surplusItems.length === 0 ? styles.emptyListContainer : styles.listContainer}
                data={surplusItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <SurplusItemCard item={item} />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Icon name="fastfood-off" size={60} color="#bdc3c7" />
                        <Text style={styles.emptyText}>
                            No items are available from this donor at the moment.
                        </Text>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8dd8c', // light soft background
        paddingTop: 20,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB', // subtle neutral background
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1E293B', // dark navy
        paddingHorizontal: 20,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#070c14ff', // cool gray
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    listContainer: {
        paddingHorizontal: 12,
        paddingBottom: 20,
    },
    emptyListContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#64748B', // softer gray for empty message
        textAlign: 'center',
        marginTop: 10,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#2563EB', // clean blue for loading
    },
    errorText: {
        color: '#DC2626', // modern red
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        fontWeight: '600',
    },
});

export default SurplusList;