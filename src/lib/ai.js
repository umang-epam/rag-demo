import { GoogleGenAI } from '@google/genai'

export function getAiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY,
  })
}

export function getEmbeddingModel() {
  const model = process.env.EMBEDDING_MODEL
  if (!model || model.includes('text-embedding')) {
    return 'gemini-embedding-001'
  }
  return model
}

export function getChatModel() {
  const model = process.env.CHAT_MODEL
  if (!model || model.includes('gpt-') || model === 'gemini-2.5-flash') {
    return 'gemini-3.6-flash'
  }
  return model
}

export const EMBEDDING_DIMENSION = Number(process.env.EMBEDDING_DIMENSION || 1536)
