import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);



export const getProximityData = async (memberLocations, selectedCoordinate, selectedLocation) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
  });

  // refined prompt with the help of chatGPT
  const prompt = `
    You are given the following data:
    Member locations: ${JSON.stringify(memberLocations)}
    Selected coordinate: ${JSON.stringify(selectedCoordinate)}
    Selected location: ${JSON.stringify(selectedLocation)}

    For each member, calculate the approximate distance to the selected location or coordinate. 
    Consider factors like traffic and travel time where relevant.
      Determine:
      1. The average distance for members.
      2. How many members are likely to attend this location based on proximity.

    Set "success" to true only if the number of members likely to attend is greater than 0. Otherwise, set it to false.

      IMPORTANT:
      - Return ONLY a single valid JSON object.
      - Do NOT include any Markdown, code fences, explanations, or extra characters.
      - The output must be raw JSON only, ready to parse in JavaScript.

      Format:
      {
          "success": boolean,
          "message": string
      }

      Example output:
      {"success": true, "message": "5 members are nearby and may attend this location."}
      
      (you may twist the message a little bit to add if there's any interesting data. Don't make the sentence have more than 15 words)
`;

  const result = await model.generateContent(prompt)
  return result.response.text()
}

