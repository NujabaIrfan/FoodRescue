import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FoodChatBot from '../components/FoodChatbot';

const ChatbotScreen = () => {
  return (
    <View style={styles.container}>
        <FoodChatBot/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
   marginBottom:50
  },
});

export default ChatbotScreen;
