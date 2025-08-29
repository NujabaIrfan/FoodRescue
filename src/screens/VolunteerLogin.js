import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

export default function VolunteerLogin() {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async() => {
    if(!email || !password){
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields',
        position: 'top'
      });
      return;
    }

    setLoading(true);

    try{
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User Logged in Successfully");
      Toast.show({
        type: 'success',
        text1: 'User Logged in Successfully',
        position: 'top'
      });
      navigation.navigate('volunteerSection');
    }catch(error){
      console.log(error.message);
      Toast.show({
        type: 'error',
        text1: 'Logged in Unsuccessfull. Please try again',
        position: 'top'
      });
    }
  }

  useEffect(() => {
    navigation.setOptions({
      title: 'Volunteer Login'
    })
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.heading}>Login Here!</Text>
        <Text style={styles.subtitle}>Your Journey to Make a Difference Starts Here</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email Address: </Text>
          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color="#6c757d" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password: </Text>
          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#6c757d" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry/>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login Here</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('forgotPassword')} style={styles.linkContainer}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.registrationContainer}>
          <Text style={styles.registerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('volunteerSignUp')}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20
  },
  field: {
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f1f3f5'
  },
  inputIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 16
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  linkContainer: {
    marginTop: 10,
    alignItems: 'center'
  },
  linkText: {
    color: '#007bff',
    fontSize: 14
  },
  registrationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15
  },
  registerText: {
    fontSize: 14,
    color: '#495057'
  },
  registerLink: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: 'bold'
  }
});
