import { defaultSettings } from "./ai"
import { AISettings } from "./types"

const SETTING_PREFIX = "rai_settings:"

const getSetting = (key: string) => {
  const settingKey = `${SETTING_PREFIX}${key}`
  const value = window.extensionAPI.settings.get(settingKey)
  return value ? value : defaultSettings[key]
}

const setSetting = (key: string, value: string) => {
  const settingKey = `${SETTING_PREFIX}${key}`
  window.extensionAPI.settings.set(settingKey, value)
}

const useSetting = (settingKey) => {
  const [value, setValue] = React.useState(() => getSetting(settingKey))
  const lastValue = React.useRef(value)

  React.useEffect(() => {
    if (value !== lastValue.current) {
      setSetting(settingKey, value)
      lastValue.current = value
    }
  }, [settingKey, value])

  return [value, setValue]
}

const OPEN_API_STORAGE_KEY = `${SETTING_PREFIX}openai-api-key`

export const getAISettings = (): AISettings => {
  return {
    ...defaultSettings,
    openaiAPIKey: localStorage.getItem(OPEN_API_STORAGE_KEY),
  }
}

const React = window.React
const V = React.createElement

const RangeSlider = ({ settingKey, min, max, step, formatValue }) => {
  const [value, setValue] = useSetting(settingKey)

  const handleChange = (event) => {
    setValue(event.target.value)
  }

  const formattedValue = formatValue ? formatValue(value) : value

  return V(
    "div",
    { className: "flex flex-col flex-shrink-0 ", style: { minWidth: "200px" } },
    V("label", {}, formattedValue),
    V(
      "input",
      {
        type: "range",
        min,
        max,
        step,
        value: value,
        onChange: handleChange,
      },
      null
    )
  )
}

const SelectSetting = ({ settingKey, options }) => {
  const [value, setValue] = useSetting(settingKey)

  const handleChange = (event) => {
    setValue(event.target.value)
  }

  return V(
    "div",
    { className: "flex flex-col flex-shrink-0 ", style: { minWidth: "200px" } },
    V(
      "select",
      {
        value,
        onChange: handleChange,
      },
      options.map((option) =>
        V("option", { value: option.value }, option.label)
      )
    )
  )
}

const ModelInfoDescription = () => {
  const desc = `The AI model to use. Read more about available models `
  const infoLink = V(
    "a",
    {
      href: "https://beta.openai.com/docs/models/gpt-3",
      target: "_blank",
    },
    "here."
  )
  return V("span", {}, [desc, infoLink])
}

export const createSettings = (extensionAPI: any) => {
  window.extensionAPI = extensionAPI

  const config = {
    tabTitle: "Roam AI Assistant",
    settings: [
      {
        id: `${SETTING_PREFIX}openai-api-key`,
        name: "OpenAI API Key",
        description: "Your OpenAI API Key",
        placeholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        action: {
          type: "input",
          onChange: (e) => {
            // we can't store the API key key on the server so are using local storage here
            localStorage.setItem(OPEN_API_STORAGE_KEY, e.target.value.trim())
          },
        },
      },
      {
        id: `${SETTING_PREFIX}model`,
        name: "AI Model",
        description: ModelInfoDescription(),
        action: {
          type: "reactComponent",
          component: () => {
            const options = [
              { value: "text-davinci-002", label: "Davinci" },
              { value: "text-curie-001", label: "Curie" },
              { value: "text-babbage-001", label: "Babbage" },
            ]
            return V(SelectSetting, { settingKey: "model", options })
          },
        },
      },
      {
        id: `${SETTING_PREFIX}temperature`,
        name: "Temperature",
        description:
          "The temperature setting in GPT-3 controls how random the predictions made by the model are. A higher temperature means more random predictions, while a lower temperature means more predictable predictions.",
        action: {
          type: "reactComponent",
          component: () => {
            const props = {
              settingKey: "temperature",
              min: 0,
              max: 1,
              step: 0.1,
              formatValue: (value) => parseFloat(value).toFixed(1),
            }
            return V(RangeSlider, props, null)
          },
        },
      },
      {
        id: `${SETTING_PREFIX}maxTokens`,
        name: "Max Tokens",
        description:
          "The maximum number of tokens (roughly words) for the AI to generate.",
        action: {
          type: "reactComponent",
          component: () => {
            const props = {
              settingKey: "maxTokens",
              min: 1,
              max: 2048,
              step: 1,
            }
            return V(RangeSlider, props, null)
          },
        },
      },
    ],
  }
  extensionAPI.settings.panel.create(config)
}
