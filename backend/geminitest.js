import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("API KEY:", process.env.GEMINI_API_KEY);
console.log("KEY LENGTH:", process.env.GEMINI_API_KEY?.length);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-pro",
});

const result = await model.generateContent("Say hello");
console.log(result.response.text());
