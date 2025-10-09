import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const createChatSession = () => {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: 'You are a helpful assistant for a food waste management app. Help users find available surplus food items from various restaurants and providers. Be friendly and concise. When users ask about food, search through the provided food items and tell them what\'s available. If they ask "hi" or greet you, respond warmly and ask how you can help them find food today.'
    });

    const chat = model.startChat({
        history: [],
        generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
        },
    });

    return chat;
};

export const generateResponse = async(chat, userMessage, foodData) => {
    try {
        const contextPrompt = `Available food items in database:
${JSON.stringify(foodData, null, 2)}

User question: ${userMessage}

Based on the available food items above, provide a helpful response. If there are matching items, describe them in a friendly way including restaurant/provider name, quantity, and details. If no items match, politely let them know and suggest they try a different search.`;

        const result = await chat.sendMessage(contextPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating response: ', error);
        throw error;
    }
};