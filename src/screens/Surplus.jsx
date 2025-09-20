import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, auth } from '../../firebaseConfig';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const SurplusManagement = () => {
  const navigation = useNavigation();
  const [surplusItems, setSurplusItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [providerInfo, setProviderInfo] = useState({ id: null, name: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const initialFormState = {
    name: '',
    description: '',
    quantity: '',
    category: 'Prepared Food',
    expiryDate: '',
    expiryDateObj: null,
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    navigation.setOptions({
      title: 'Manage Surplus',
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
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      const fetchProviderDataAndItems = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          Toast.show({ type: 'error', text1: 'Authentication Error' });
          setLoading(false);
          navigation.navigate('donorSignIn');
          return;
        }

        const usersRef = collection(db, 'restaurant');
        const q = query(usersRef, where('uid', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          setProviderInfo({ id: userDoc.id, name: userDoc.data().name });

          const surplusRef = collection(db, 'surplusItems');
          const surplusQuery = query(surplusRef, where('providerId', '==', userDoc.id));

          const unsubscribe = onSnapshot(surplusQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSurplusItems(items);
            setLoading(false);
          }, (error) => {
            console.error("Error fetching surplus items: ", error);
            Toast.show({ type: 'error', text1: 'Error fetching items' });
            setLoading(false);
          });

          return () => unsubscribe();
        } else {
          Toast.show({ type: 'error', text1: 'Restaurant profile not found' });
          setLoading(false);
        }
      };

      fetchProviderDataAndItems();
    }, [])
  );

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const resetForm = () => {
    setForm(initialFormState);
    setIsEditing(false);
    setEditingItem(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditing(true);
    setEditingItem(item);
    const dateObj = item.expiryDate ? new Date(item.expiryDate) : null;
    setForm({
      name: item.name,
      description: item.description,
      quantity: String(item.quantity),
      category: item.category,
      expiryDate: item.expiryDate,
      expiryDateObj: dateObj,
    });
    setModalVisible(true);
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || form.expiryDateObj || new Date();
    setShowDatePicker(Platform.OS === 'ios');

    const formattedDate = currentDate.toISOString().split('T')[0];
    setForm({
      ...form,
      expiryDateObj: currentDate,
      expiryDate: formattedDate,
    });
  };

  const handleSaveSurplus = async () => {
    if (!form.name || !form.quantity || !form.category) {
      Alert.alert('Missing Information', 'Please fill out all required fields (*).');
      return;
    }
    if (!providerInfo.id) {
      Alert.alert('Error', 'Could not verify your restaurant information.');
      return;
    }

    try {
      const surplusData = {
        ...form,
        quantity: parseInt(form.quantity, 10),
        providerId: providerInfo.id,
        providerName: providerInfo.name,
        status: 'available',
      };
      // Exclude expiryDateObj before saving
      delete surplusData.expiryDateObj;

      if (isEditing && editingItem) {
        const itemRef = doc(db, 'surplusItems', editingItem.id);
        await updateDoc(itemRef, surplusData);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Surplus item updated!' });
      } else {
        await addDoc(collection(db, 'surplusItems'), {
          ...surplusData,
          createdAt: serverTimestamp(),
        });
        Toast.show({ type: 'success', text1: 'Success', text2: 'Surplus item added!' });
      }

      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} document: `, error);
      Alert.alert('Error', `Could not ${isEditing ? 'update' : 'add'} surplus item.`);
    }
  };

  const handleDeleteSurplus = (itemId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this surplus item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'surplusItems', itemId));
              Toast.show({ type: 'success', text1: 'Success', text2: 'Item deleted.' });
            } catch (error) {
              console.error('Error deleting document: ', error);
              Alert.alert('Error', 'Could not delete item.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#389c9a" />
        <Text style={styles.loadingText}>Loading your surplus items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
        <Icon name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Surplus Food</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {surplusItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="fastfood" size={60} color="#ccc" />
            <Text style={styles.emptyStateText}>No surplus items yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first item to get started!</Text>
          </View>
        ) : (
          surplusItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.description || 'No description'}
                </Text>
                <View style={styles.cardDetails}>
                  <Text style={styles.detailValue}>Quantity: {item.quantity}</Text>
                  <Text style={styles.detailValue}>Category: {item.category}</Text>
                  {item.expiryDate && (
                    <Text style={styles.detailValue}>Expiry: {item.expiryDate}</Text>
                  )}
                  <View style={[
                    styles.statusBadge,
                    item.status === 'available' ? styles.availableBadge : styles.reservedBadge
                  ]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenEditModal(item)}>
                  <Icon name="edit" size={24} color="#389c9a" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteSurplus(item.id)}>
                  <Icon name="delete" size={24} color="#f44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Surplus Food' : 'Add Surplus Food'}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollView}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Food Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Chicken Curry"
                  value={form.name}
                  onChangeText={(text) => handleChange('name', text)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe the food item, ingredients, etc."
                  value={form.description}
                  onChangeText={(text) => handleChange('description', text)}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantity (servings) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 5"
                  keyboardType="numeric"
                  value={form.quantity}
                  onChangeText={(text) => handleChange('quantity', text)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.category}
                    onValueChange={(value) => handleChange('category', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Prepared Food" value="Prepared Food" />
                    <Picker.Item label="Produce" value="Produce" />
                    <Picker.Item label="Bakery" value="Bakery" />
                    <Picker.Item label="Dairy" value="Dairy" />
                    <Picker.Item label="Other" value="Other" />
                  </Picker>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expiry Date (Optional)</Text>
                {Platform.OS === 'ios' && (
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={form.expiryDateObj || new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}
                {Platform.OS === 'android' && (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={styles.datePickerButton}
                    >
                      <Text style={styles.datePickerButtonText}>
                        {form.expiryDate || 'Select Date'}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={form.expiryDateObj || new Date()}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                      />
                    )}
                  </>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveSurplus}
              >
                <Text style={styles.buttonText}>{isEditing ? 'Update' : 'Add'} Surplus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8dd8c' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8dd8c' },
  loadingText: { marginTop: 10, color: '#389c9a', fontSize: 16 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#389c9a',
    padding: 15, margin: 16, borderRadius: 10, elevation: 5,
  },
  addButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 50 },
  emptyStateText: { fontSize: 18, fontWeight: 'bold', color: '#555', marginTop: 16 },
  emptyStateSubtext: { fontSize: 14, color: '#777', textAlign: 'center', marginTop: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 10, marginBottom: 16, flexDirection: 'row',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
  },
  cardContent: { flex: 1, padding: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginBottom: 4 },
  cardDescription: { fontSize: 14, color: '#666', marginBottom: 8 },
  cardDetails: { marginTop: 'auto', paddingTop: 8 },
  detailValue: { fontSize: 13, color: '#333', marginBottom: 3 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start', marginTop: 5,
  },
  availableBadge: { backgroundColor: '#e8f5e9' },
  reservedBadge: { backgroundColor: '#fff3e0' },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize', color: '#2e7d32' },
  cardActions: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  actionButton: { padding: 8, marginLeft: 8 },
  // Modal Styles
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20, width: '90%', maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#389c9a' },
  modalScrollView: { paddingBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden' },
  picker: { height: 50 },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', minWidth: 100 },
  cancelButton: { backgroundColor: '#e0e0e0' },
  saveButton: { backgroundColor: '#2e7d32' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelButtonText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
});

export default SurplusManagement;