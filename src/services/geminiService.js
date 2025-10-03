import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);


export const createChatSession = () => {
    const model = genAI.getGenerativeModel({model: 'gemini-2.5-flash'});
    console.log('Gemini API Key:', API_KEY);

    const chat = model.startChat({
        history: [
            {
                role: 'user',
                parts: [{text: 'You are a helpful assistant for a food waste management app. Help users find available surplus food items from various restaurants and providers. Be friendly and concise.'}],
            },
            {
                role: 'model',
                parts: [{text: 'Hello! I\'m here to help you find available surplus food items. You can ask me about what food is available, search by restaurant name, or ask about specific types of food. How can I help you today?'}],
            },
        ],
        generationConfig:{
            maxOutputTokens: 500,
            temperature:0.7,
        },
    });

    return chat;
};

export const generateResponse = async(chat, userMessage, foodData) => {
    try{
        const contextPrompt =`
        User question: ${userMessage}

        Available food items in database:
        ${JSON.stringify(foodData, null, 2)}

        Please provide a helpful, natural response based on the available food items. If there are matching items, describe them in a friendly way, including the restaurant/provider name, quantity, and any relevant details. If no items match, politely let the user know and suggest alternatives.
        `;

        const result = await chat.sendMessage(contextPrompt);
        const response=await result.response;
        return response.text();
    } catch (error){
        console.error('Error generating response: ', error);
        throw error;
    }
};


