import OpenAI from 'openai'

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  return new OpenAI({ apiKey })
}

// Centralized AI configuration
export function getAIConfig() {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const temperatureEnv = process.env.OPENAI_TEMPERATURE || 0.2
  const temperature = temperatureEnv !== undefined ? Number(temperatureEnv) : 0.2
  return { model, temperature }
}
