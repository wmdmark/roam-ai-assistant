// globals
import { fetchCompletion } from "./ai"
import { getAllBlocksAboveElement, getBlockUIDFromElement } from "./dom"
import { getCurrentUserName, getBlock } from "./queries"
import {
  getBlockDirectReferenceNotes,
  getBlockReferencedPageNotes,
} from "./references"
import { createSettings, getAISettings } from "./settings"

import "./types"
import { AISettings } from "./types"

let unmonitor: any = null

const monitor = () => {
  let activeBlockElement: any = null
  let activeBlockUID: string = null
  let input: string = ""
  const username = getCurrentUserName() || "user"

  const createAIResponseBlock = () => {
    let uid = window.roamAlphaAPI.util.generateUID()
    uid = `_ai${uid.slice(3, uid.length)}`
    let block = { uid: uid, string: "__AI is typing...__" }
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": activeBlockUID, order: 0 },
      block,
    })
    return block
  }

  const doAIResponse = async () => {
    settings = getAISettings()
    const openaiAPIKey = settings.openaiAPIKey
    if (!openaiAPIKey) {
      alert("Please set your OpenAI API Key in the settings")
      return
    }

    let respBlock = await createAIResponseBlock()
    const prompt = getPrompt(getBlocksThread(activeBlockElement))
    console.log(prompt)
    const response = await fetchCompletion(settings, prompt)
    let string = response.choices[0].text.trim()
    string = `${settings.aiResponsePrefix} ${string}`
    console.log(string)

    window.roamAlphaAPI.updateBlock({
      block: { uid: respBlock.uid, string },
    })
  }

  const handleKeyDown = (e) => {
    // make sure the target is still mounted
    // keep track of the input
    if (e.target.classList.contains("rm-block-input")) {
      input = e.target.value
    }

    if (!!e.target.parentElement) {
      activeBlockElement = e.target.closest(".roam-block-container")
      const el = activeBlockElement?.getElementsByClassName("rm-block-text")
      if (el?.length > 0) {
        activeBlockUID = getBlockUIDFromElement(el[0])
      }
    }
  }

  const handleKeyUp = (e) => {
    // if the enter key is pressed, we check to see if a new block was created and if it started with the AI trigger
    if (e.key === "Enter" && activeBlockElement) {
      // we need to see if this enter key actually closed the block
      setTimeout(async () => {
        const focused = window.roamAlphaAPI.ui.getFocusedBlock()["block-uid"]

        // TODO: wrap any aiTrigger text in activeBlockElement in a span with the class of ai-trigger
        // the block text is in .rm-block-text > span

        if (focused !== activeBlockUID) {
          if (input.indexOf(settings.aiTrigger) > -1) {
            await doAIResponse()
            input = ""
            activeBlockUID = null
          }
        }
      }, 100)
    }
  }
  // add a global key handler
  document.addEventListener("keydown", handleKeyDown)
  document.addEventListener("keyup", handleKeyUp)

  const getBlocksThread = (el) => {
    let blocks = getAllBlocksAboveElement(el).reverse()
    const firstAITriggerIndex = blocks.findIndex((b) => {
      const isTrigger = b[":block/string"]?.indexOf(settings.aiTrigger) > -1
      // TODO: we need to make sure this block is a parent of the active block
      const activeBlock = getBlock(activeBlockUID)

      // TODO: figure out fix for parent issue
      const parents = activeBlock[":block/parents"]
      const isParent = !!parents?.find(
        (p) => p[":block/uid"] === activeBlockUID
      )
      return isTrigger && isParent
    })
    blocks = blocks.slice(firstAITriggerIndex, blocks.length)
    return blocks
  }

  const getPrompt = (blocks: any) => {
    // TODO: move this to a function
    const block = getBlock(activeBlockUID)

    //TODO: add page to the top of blocks
    // blocks = [...blocks]

    const introPrompt = [
      `This is a collaborative note taking session between the user (${username}) and an intelligent and friendly AI.`,
    ]

    // if (refNotes) {
    //   prompt.push(refNotes)
    // }
    let convoPrompt = []
    blocks.forEach((b) => {
      let value = b[":block/string"].trim()
      const isAI = b[":block/uid"].startsWith("_ai")
      // const isAI = value.indexOf(settings.aiResponsePrefix) > -1
      const isUser = !isAI

      if (isUser) {
        // replace any prompt initiator that is at the start of the line
        value = value.replace(settings.aiTrigger, "")
        // value = `${username}: ${value}`
        value = `user: ${value}`
      }
      if (isAI) {
        value = value.replace(settings.aiResponsePrefix, "")
        value = `ai: ${value}`
      }

      convoPrompt.push(value)
    })
    convoPrompt.push("ai:")

    // Handle refs
    const hasRefs = block[":block/refs"] && block[":block/refs"].length > 0

    let refNotes: any = []
    if (hasRefs) {
      const refPageNotes = getBlockReferencedPageNotes(block)
      const refMentionNotes = getBlockDirectReferenceNotes(block)
      refNotes = [...refPageNotes, ...refMentionNotes]
    }

    // 2048 limit
    const countWords = (str) => str.split(" ").length
    const corePromptWords = [...introPrompt, ...convoPrompt].reduce(
      (acc, cur) => acc + countWords(cur),
      0
    )
    let wordsRemaining = 2048 - corePromptWords
    let refPrompt = []

    // while there are words remaining, inject the reference notes
    if (refNotes.length > 0) {
      while (wordsRemaining > 0) {
        const line = refNotes.shift()
        if (line) {
          const words = countWords(line)
          if (words > wordsRemaining) {
            break
          }
          refPrompt.push(line)
          wordsRemaining -= words
        } else {
          break
        }
      }
    }

    const prompt = [...introPrompt, ...refPrompt, ...convoPrompt]

    // We need to inject the prompt notes but only up to the word limit (minus 1000 characters)

    return prompt.join("\n")
  }

  return () => {
    console.log("unmonitor()")
    document.removeEventListener("keydown", handleKeyDown)
    document.removeEventListener("keyup", handleKeyUp)
  }
}

let settings: AISettings

const onload = ({ extensionAPI }: any) => {
  createSettings(extensionAPI)
  settings = getAISettings()
  unmonitor = monitor()
}

const onunload = () => {
  if (unmonitor) unmonitor()
}

export default {
  onload: onload,
  onunload: onunload,
}
