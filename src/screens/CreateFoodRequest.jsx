import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from 'react-native-ui-datepicker';
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, where, getDocs, query } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const CreateFoodRequest = ({ route }) => {
  const passedItem = route?.params?.item;
  const navigation=useNavigation();
  const [orgName, setOrgName] = useState('ABC Organization');
  const [orgID, setOrgID] = useState('ORG3562');
  const [requestedBy, setRequestedBy] = useState('John Doe');

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

  useEffect(()=>{
    const fetchSurplusItem = async () => {
      if(!passedItem) return;

      try{
        const q=query(
          collection(db, 'surplusItems'),
          where('name', '==', passedItem),
          where('status', '==', 'available')
        );

        const querySnapshot = await getDocs(q);

        if(!querySnapshot.empty){
          const itemData = querySnapshot.docs[0].data();
          setMaxQuantity(itemData.quantity);
        }
      } catch (error){
        console.error('Error fetching surplus item: ', error);
      }
    };

    fetchSurplusItem();
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
    if (!orgName || !orgID || !requestedBy) {
      Alert.alert('Error', 'Please fill in all organization details');
      return;
    }

    const hasEmptyItems = foodItems.some((item) => !item.item);
    if (hasEmptyItems) {
      Alert.alert('Error', 'Please fill in all food items');
      return;
    }

    const requestData = {
      organization: {
        name: orgName,
        id: orgID,
        requestedBy,
      },
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
      navigation.navigate('foodRequestListScreen');
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
            <Text style={styles.inputLabel}>Organization Name</Text>
            <TextInput
              style={styles.input}
              value={orgName}
              onChangeText={setOrgName}
              placeholder="Org name fetched"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Organization ID</Text>
            <TextInput
              style={styles.input}
              value={orgID}
              onChangeText={setOrgID}
              placeholder="Org ID fetched"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Request Made By</Text>
            <TextInput
              style={styles.input}
              value={requestedBy}
              onChangeText={setRequestedBy}
              placeholder="logged in user fetched"
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
    maxQuantity && parseInt(item.amount) >= maxQuantity && styles.disabledButton
  ]}
                    onPress={() => {
    const newAmount = parseInt(item.amount) + 1;
    if (!maxQuantity || newAmount <= maxQuantity) {
      updateFoodItem(index, 'amount', newAmount);
    } else {
      Alert.alert('Limit Reached', `Maximum available: ${maxQuantity}`);
    }
  }}
  disabled={maxQuantity && parseInt(item.amount) >= maxQuantity}
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
          <DateTimePicker
            value={requiredBefore}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowRequiredDate(false);
              if (selectedDate) setRequiredBefore(selectedDate);
            }}
          />
        )}

        {showPickupDate && (
          <DateTimePicker
            value={pickupDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPickupDate(false);
              if (selectedDate) setPickupDate(selectedDate);
            }}
          />
        )}

        {showPickupTime && (
          <DateTimePicker
            value={pickupTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowPickupTime(false);
              if (selectedTime) setPickupTime(selectedTime);
            }}
          />
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
    flexDirection: "row",
    alignItems: "center",
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  counterText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  amountValue: {
    marginHorizontal: 20,
    fontSize: 18,
    fontWeight: "500",
  },
  disabledButton: {
  backgroundColor: '#cccccc',
  opacity: 0.5,
},
});

export default CreateFoodRequest;
