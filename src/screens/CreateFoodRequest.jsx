import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import { auth, db } from '../../firebaseConfig';
import {
  collection,
  addDoc,
  where,
  getDocs,
  query,
  doc,
  getDoc,
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import DateTimePickerCommunity from '@react-native-community/datetimepicker';  

const CreateFoodRequest = ({ route }) => {
  const passedItem = route?.params?.item;
  const navigation = useNavigation();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [providerName, setProviderName] = useState('');
  const defaultStyles = useDefaultStyles();

  const [foodItems, setFoodItems] = useState([
    {
      item: passedItem || '',
      amount: '1',
    },
  ]);
  const [maxQuantity, setMaxQuantity] = useState(null);
  const [requiredBefore, setRequiredBefore] = useState(new Date());
  const [priority, setPriority] = useState('Medium');
  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState(new Date());

  const [showRequiredDate, setShowRequiredDate] = useState(false);
  const [showPickupDate, setShowPickupDate] = useState(false);
  const [showPickupTime, setShowPickupTime] = useState(false);

  useEffect(() => {
    // check auth
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        Alert.alert('Access Denied', 'Please log in to create a food request');
        navigation.navigate('volunteerLogin');
      } else {
        const userId = user.uid;
        console.log('User uid', userId);

        try {
          const userDocRef = doc(db, 'Volunteers', userId);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRequestedBy(userData.name || user.email || 'User');
            console.log('User name: ', userData.name);
          } else {
            setRequestedBy(user.email || 'User');
          }

          // fetch orgnizations
          const orgsQuery = query(
            collection(db, 'Organizations'),
            where('user', '==', userId)
          );
          const orgsSnapshot = await getDocs(orgsQuery);

          const userOrgs = [];
          orgsSnapshot.forEach((doc) => {
            userOrgs.push({
              id: doc.id,
              ...doc.data(),
            });
          });

          setOrganizations(userOrgs);

          //check user organizations
          if (userOrgs.length === 0) {
            Alert.alert(
              'No Organization Found',
              'You need to own an organization before creating a food request.',
              [
                {
                  text: 'Create Organization',
                  onPress: () => navigation.navigate('organizations'),
                },
                {
                  text: 'Go Back',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
            return;
          }

          if (userOrgs.length > 0) {
            setSelectedOrgId(userOrgs[0].id);
            // setOrgName(userOrgs[0]);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setRequestedBy(user.email || 'User');
        }
      }
    });

    // fetch items
    const fetchSurplusItem = async () => {
      if (!passedItem) return;

      try {
        const q = query(
          collection(db, 'surplusItems'),
          where('name', '==', passedItem),
          where('status', '==', 'available')
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const itemData = querySnapshot.docs[0].data();
          setMaxQuantity(itemData.quantity);
          setProviderName(itemData.providerName || 'Unknown Donor');
        }
      } catch (error) {
        console.error('Error fetching surplus item: ', error);
      }
    };

    fetchSurplusItem();
    return () => unsubscribe();
  }, [passedItem]);

  const addFoodItem = () => {
    setFoodItems([...foodItems, { item: '', amount: '1' }]);
  };

  const updateFoodItem = (index, field, value) => {
    const updatedItems = [...foodItems];
    updatedItems[index][field] = value;
    setFoodItems(updatedItems);
  };

  const removeFoodItem = (index) => {
    if (foodItems.length > 1) {
      const updatedItems = foodItems.filter((_, i) => i !== index);
      setFoodItems(updatedItems);
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedOrgId || !requestedBy) {
      Alert.alert('Error', 'Please select an organization');
      return;
    }
    const selectedOrg = organizations.find((org) => org.id === selectedOrgId);

    const hasEmptyItems = foodItems.some((item) => !item.item);
    if (hasEmptyItems) {
      Alert.alert('Error', 'Please fill in all food items');
      return;
    }

    const requestData = {
      createdAt: Timestamp.fromDate(new Date()),
      organization: {
        name: selectedOrg.name,
        id: selectedOrgId,
        requestedBy,
      },
      donor: providerName,
      foodRequest: {
        items: foodItems,
        requiredBefore: Timestamp.fromDate(requiredBefore),
        priority,
        pickupDate: Timestamp.fromDate(pickupDate),
        pickupTime: Timestamp.fromDate(pickupTime),
        status: 'Pending',
        volunteerAccepted: 'false',
      },
    };

    try {
      await addDoc(collection(db, 'foodRequests'), requestData);

      Alert.alert('Success', 'Food request created successfully');
      console.log(requestData);
      navigation.navigate('tabs', { screen: 'Donors' });
    } catch (error) {
      console.error('Error adding document: ', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString();
  };

  const formatTime = (date) => {
    return date.toLocaleDateString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* organization details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Organization</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedOrgId}
                onValueChange={(itemValue) => {
                  selectedOrgId(itemValue);
                  // const selectedOrg = organizations.find(org => org.id === itemValue);
                  // if(selectedOrg){
                  //   setOrgName(selectedOrg.name);
                  //   setOrgID(itemValue);
                  // }
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select an Organization" value="" />

                {organizations.map((org) => (
                  <Picker.Item key={org.id} label={org.name} value={org.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Request Made By</Text>
            <TextInput
              style={styles.input}
              value={requestedBy}
              onChangeText={setRequestedBy}
              placeholder="logged in user fetched"
              editable={false}
            />
          </View>
        </View>

        {/* Food request details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Request Details</Text>

          {/* Food items */}
          {foodItems.map((item, index) => (
            <View key={index} style={styles.foodItemRow}>
              <View style={styles.foodItemContainer}>
                <Text style={styles.label}>Food Item</Text>
                <TextInput
                  style={[styles.input, styles.foodItemInput]}
                  value={item.item}
                  onChangeText={(value) => updateFoodItem(index, 'item', value)}
                  placeholder="Select or type"
                />
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.label}>Amount</Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() =>
                      updateFoodItem(
                        index,
                        'amount',
                        Math.max(1, parseInt(item.amount) - 1)
                      )
                    }
                  >
                    <Text style={styles.counterText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.amountValue}>{item.amount}</Text>
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      maxQuantity &&
                        parseInt(item.amount) >= maxQuantity &&
                        styles.disabledButton,
                    ]}
                    onPress={() => {
                      const newAmount = parseInt(item.amount) + 1;
                      if (!maxQuantity || newAmount <= maxQuantity) {
                        updateFoodItem(index, 'amount', newAmount);
                      } else {
                        Alert.alert(
                          'Limit Reached',
                          `Maximum available: ${maxQuantity}`
                        );
                      }
                    }}
                    disabled={
                      maxQuantity && parseInt(item.amount) >= maxQuantity
                    }
                  >
                    <Text style={styles.counterText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {foodItems.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFoodItem(index)}
                >
                  <Text style={styles.removeButtonText}>x</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* add another item button */}
          {/* <View>
          <TouchableOpacity style={styles.addButton} onPress={addFoodItem}>
            <Text style={styles.addButtonText}>+ Add another item</Text>
          </TouchableOpacity>
          </View> */}

          {/* Required date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Required Before</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowRequiredDate(true)}
            >
              <Text style={styles.dateButtonText}>
                {formatDate(requiredBefore)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={priority}
                onValueChange={setPriority}
                style={styles.picker}
              >
                <Picker.Item label="Low" value="Low" />
                <Picker.Item label="Medium" value="Medium" />
                <Picker.Item label="High" value="High" />
                <Picker.Item label="Urgent" value="Urgent" />
              </Picker>
            </View>
          </View>

          {/* pickup date and time */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Available Pick-Up Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPickupDate(true)}
            >
              <Text style={styles.dateButtonText}>
                {formatDate(pickupDate)}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Available Pick-Up Time</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPickupTime(true)}
            >
              <Text style={styles.dateButtonText}>
                {formatTime(pickupTime)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* submit button */}
        <View>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCreateRequest}
          >
            <Text style={styles.submitButtonText}>Create Request</Text>
          </TouchableOpacity>
        </View>

        {/* Date, time pickers */}
        {showRequiredDate && (
  <Modal
    visible={showRequiredDate}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setShowRequiredDate(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <DateTimePicker
          mode="single"
          date={requiredBefore}  
          minDate={new Date()}
          onChange={({ date }) => {  
            if (date) setRequiredBefore(date);
          }}
          styles={defaultStyles}  
        />
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => setShowRequiredDate(false)}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}

        {showPickupDate && (
  <Modal
    visible={showPickupDate}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setShowPickupDate(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <DateTimePicker
          mode="single"
          date={pickupDate}
          minDate={new Date()}
          onChange={({ date }) => {
            if (date) setPickupDate(date);
          }}
          styles={defaultStyles}
        />
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => setShowPickupDate(false)}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}

        {showPickupTime && (
  <Modal
    visible={showPickupTime}
    transparent={true}
    animationType="fade"
    onRequestClose={() => setShowPickupTime(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <DateTimePickerCommunity
          value={pickupTime}
          mode="time"
          display="default"  // 'spinner' on iOS for wheel, 'default' on Android for clock
          is24Hour={false}  // Set true for 24hr format (matches your use12Hours)
          onChange={(event, selectedTime) => {
            setShowPickupTime(false);  // Auto-close on selection (native behavior)
            if (selectedTime) setPickupTime(selectedTime);
          }}
        />
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => setShowPickupTime(false)}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#106a25ff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountContainer: {
    marginVertical: 10,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  amountValue: {
    marginHorizontal: 20,
    fontSize: 18,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
  backgroundColor: 'white',
  borderRadius: 10,
  padding: 20,
  alignItems: 'center',
  justifyContent: 'flex-start',  
  width: '90%',  
  maxHeight: '80%',  
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
},
dateButton: {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 4,
  padding: 10,
  backgroundColor: '#fff',
  alignItems: 'center',
},
dateButtonText: {
  fontSize: 14,
  color: '#333',
},
  doneButton: {
    marginTop: 20,
    backgroundColor: '#106a25ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateFoodRequest;
