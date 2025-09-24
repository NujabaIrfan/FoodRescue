import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from "firebase/firestore";
import Icon from 'react-native-vector-icons/MaterialIcons';

const FoodChatbot = () => {
    const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your food assistant 🤖 I can help you find available food items. Try asking me 'What food is available?' or 'Do you have pizza?'",
      isBot: true,
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const scrollViewRef = useRef();

   const genAI = new GoogleGenerativeAI('AIzaSyDDdgezGgd7mTXPVGJkZ9ggzz8ONm6S9K8');
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  React.useEffect(() => {
    fetchAvailableItems();
  }, []);

  const fetchAvailableItems = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'surplusItems'));
      const items = [];
      snapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setAvailableItems(items);
    } catch (error) {
      console.error('Firebase error:', error);
      setAvailableItems([]);
    }
  };

  const createContextPrompt = (userMessage) => {
    if (availableItems.length === 0) {
      return `You are a helpful food assistance chatbot. Currently, there are no available food items in the system. Please let the user know this and suggest they check back later.

User question: "${userMessage}"

Respond helpfully and suggest they contact the food providers directly or check back later.`;
    }

    const itemsList = availableItems
      .filter(item => item.status === 'available')
      .map(item => 
        `- ${item.name} (${item.quantity} servings, expires: ${item.expiryDate}, category: ${item.category}, provider: ${item.providerName})`
      ).join('\n');

    return `You are a helpful food assistance chatbot. Here are the currently available food items:

${itemsList}

User question: "${userMessage}"

Please help the user find food items based on their query. Be conversational and helpful. If they ask about specific items, tell them which providers have those items and when they expire. If no items match their query, suggest similar available items. Keep responses concise but friendly.`;
  };

  const getBotResponse = async (userMessage) => {
    try {
      const prompt = createContextPrompt(userMessage);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error getting bot response:', error);
      return "Sorry, I'm having trouble right now. Please try again later.";
    }
  };

  const sendMessage = async() =>{
    if(!inputText.trim()) return;

    const userMessage ={
        id: Date.now(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev=> [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    setTimeout(()=>{
        scrollViewRef.current?.scrollToEnd({animated: true});
    }, 100);

    const botResponseText = await getBotResponse(userMessage.text);

    const botMessage = {
      id: Date.now() + 1,
      text: botResponseText,
      isBot: true,
      timestamp: new Date(),
    };

     setMessages(prev => [...prev, botMessage]);
    setLoading(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS==='ios' ? 'padding': 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 90:0}
    >
        <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
        >
            {messages.map((message)=>(
                <View
                key={message.id}
                style={[
                    styles.messageContainer,
                    message.isBot? styles.botMessage : styles.userMessage,
                ]}
                >
                    <Text
                    style={[
              styles.messageText,
              message.isBot ? styles.botText : styles.userText,
            ]}
                    >
                        {message.text}

                    </Text>

                    <Text style={[
              styles.timestamp,
              message.isBot ? styles.botTimestamp : styles.userTimestamp,
            ]}>
              {formatTime(message.timestamp)}
            </Text>

                </View>
            ))}

            {loading && (
                <View style={[styles.messageContainer, styles.botMessage]}>
            <Text style={styles.loadingText}>Bot is typing...</Text>
          </View>
            )}

        </ScrollView>

        <View style={styles.inputContainer}>
            <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder='Ask me about available food...'
                multiline
                maxLength={500}
                onFocus={()=>{
                    setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
                }}
            />

            <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
            >
                <Icon name="send" size={24} color={!inputText.trim() ? '#ccc' : '#fff'} />
            </TouchableOpacity>

        </View>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginBottom:50
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  botTimestamp: {
    color: '#666',
  },
  userTimestamp: {
    color: '#e0e0e0',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
});
export default FoodChatbot;
