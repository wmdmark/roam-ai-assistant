import { getBlock } from "./queries"

export const getBlockUIDFromElement = (el: HTMLElement) => el.id.slice(-9)

export const getBlockDataFromContainer = (container: any) => {
  // TODO: refactor this to just return the block... do we need the container? we could just cache it by uid
  let data: any = null
  const textEl = container?.getElementsByClassName("rm-block-text")[0]
  if (textEl) {
    const blockId = getBlockUIDFromElement(textEl)
    const block = getBlock(blockId)
    if (block) {
      const level = block[":block/parents"] ? block[":block/parents"].length : 0
      data = { id: blockId, level, block, el: container, children: [] }
    } else {
      console.log("block not found", blockId)
    }
  }
  return data
}

const blockElementsByUID = {}
export const getBlockFromContainer = (container: any) => {
  const data = getBlockDataFromContainer(container)
  if (data) {
    blockElementsByUID[data.block[":block/uid"]] = data
  }
  return data.block
}

export const getAllBlocksAboveElement = (el: any) => {
  // find all blocks above this element (siblings and parents)
  const blocks: any[] = []
  let currentEl = el
  while (currentEl) {
    if (currentEl.classList.contains("roam-block-container")) {
      const block = getBlockFromContainer(currentEl)
      if (block) {
        blocks.push(block)
      }
    }
    currentEl = currentEl.previousElementSibling || currentEl.parentElement
  }
  return blocks
}
