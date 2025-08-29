import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';


export default function Signup({}) {
  const [name, setname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = () => {
    console.log('Name:', name, 'Email:', email, 'Password:', password);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Volunteer Signup</Text>
      <TextInput style={styles.input} placeholder='Full Name' value={name} onChangeText={setname}/>
      <TextInput style={styles.input} placeholder='Email Address' value={email} onChangeText={setEmail}/>
      <TextInput style={styles.input} placeholder='Password' value={password} onChangeText={setPassword}/>
      <button title='Sign Up' onPress={handleSignUp}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    paddingHorizontal: 8,
    borderRadius: 5
  }
});
