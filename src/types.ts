declare global {
  interface Window {
    React: any
    ReactDOM: any
    roamAlphaAPI: any
    extensionAPI: any
  }
}

export type AISettings = {
  openaiAPIKey: string
  aiTrigger: string
  aiResponsePrefix: string
  aiPromptPrefix: string
  model: string
  maxTokens: number
  temperature: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
}
