import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { getFoodItems, searchFoodItems } from '../services/foodItemsService';
import { createChatSession, generateResponse } from '../services/geminiService';

export default function FoodChatBot() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hi! I can help you find available surplus food. Try asking me "What food is available?" or "Show me items from Lily\'s restaurant"',
      sender: 'bot',
      timeStamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatSession = useRef(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    chatSession.current = createChatSession();
  }, []);

  const handleSend = async () => {
  if (!inputText.trim()) return;

  const userMessage = {
    id: Date.now().toString(),
    text: inputText,
    sender: 'user',
    timeStamp: new Date(),
  };

  setMessages((prev) => [...prev, userMessage]);
  setInputText('');
  setLoading(true);

  try {
    let foodData = await getFoodItems({ status: 'available' });

    console.log('Food data fetched:', foodData);
    console.log('Number of items:', foodData.length);
    console.log('First item:', foodData[0]);

    const searchTerms = inputText.toLowerCase();
    // Only search if they're asking for something specific
    if (
      searchTerms.includes('rice') ||
      searchTerms.includes('flour') ||
      searchTerms.includes('apple') ||
      searchTerms.includes('dhal') ||
      searchTerms.includes('from') // for "from restaurant name"
    ) {
      const searchResult = await searchFoodItems(inputText);
      // Only use search results if something was found
      if (searchResult.length > 0) {
        foodData = searchResult;
      }
      // If nothing found in search, keep the full foodData so AI can suggest alternatives
    }

    const botResponse = await generateResponse(
      chatSession.current,
      inputText,
      foodData
    );

    const botMessage = {
      id: (Date.now() + 1).toString(),
      text: botResponse,
      sender: 'bot',
      timeStamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
  } catch (error) {
    const errorMessage = {
      id: (Date.now() + 1).toString(),
      text: 'Sorry. I encountered an error. Please try again.',
      sender: 'bot',
      timeStamp: new Date(),
    };
    setMessages((prev) => [...prev, errorMessage]);
    console.error('Chat error: ', error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Food Finder Assistant</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.sender === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text 
                style={[
                styles.messageText,
                message.sender === 'user' ? styles.userText : styles.botText,
              ]}
            >
                {message.text}

            </Text>

            <Text style={styles.timestamp}>
              {message.timeStamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}

        {loading && (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.loadingText}>Thinking...</Text>
            </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder='Ask about available food...'
            placeholderTextColor='#999'
            multiline
            maxLength={500}
        />
        <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
        >
            <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 16,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
