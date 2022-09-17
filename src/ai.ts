import { AISettings } from "./types"

export const defaultSettings: AISettings = {
  openaiAPIKey: "",
  aiTrigger: "@ai",
  aiResponsePrefix: "**ai:** ",
  aiPromptPrefix: `This is a collaborative note-taking session between the user and a helpful AI research assistant`,
  model: "text-davinci-002",
  maxTokens: 500,
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
}

export const fetchCompletion = async (settings: AISettings, prompt: string) => {
  const url = "https://api.openai.com/v1/completions"
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${settings.openaiAPIKey}`,
  }
  const body = {
    prompt,
    model: settings.model,
    max_tokens: settings.maxTokens,
    temperature: settings.temperature,
    top_p: settings.topP,
    frequency_penalty: settings.frequencyPenalty,
    presence_penalty: settings.presencePenalty,
    // stop: ["\n", "AI:"],
  }
  const result = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  return result.json()
}
