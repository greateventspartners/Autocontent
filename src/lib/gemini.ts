import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!client) client = new GoogleGenerativeAI(key);
  return client;
}

export function getModel(model?: string): GenerativeModel | null {
  const genAI = getGeminiClient();
  if (!genAI) return null;
  return genAI.getGenerativeModel({
    model: model || process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });
}

export function getImageModel(): GenerativeModel | null {
  const genAI = getGeminiClient();
  if (!genAI) return null;
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-exp-image-generation",
  });
}
