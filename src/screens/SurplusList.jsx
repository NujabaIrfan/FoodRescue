// screens/SurplusList.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import SurplusItemCard from '../components/SurplusItemCard';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SurplusList = () => {
    const route = useRoute();
    const { providerId, providerName } = route.params || {};
    const [surplusItems, setSurplusItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                const items = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
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
        backgroundColor: '#389c9a',
        paddingTop: 20,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
        paddingHorizontal: 20,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    listContainer: {
        paddingHorizontal: 10,
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
        color: '#95a5a6',
        textAlign: 'center',
        marginTop: 10,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4a90e2',
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        fontWeight: '500',
    },
});

export default SurplusList;