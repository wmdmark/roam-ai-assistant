import {
  getBasicTreeByParentUid,
  getBlockUidsAndTextsReferencingPage,
  getCurrentUserName,
} from "./queries"
import { getRoamStyleDate } from "./utils"

export const getBlockDirectReferenceNotes = (
  block: any,
  limitToLast: number = 50
) => {
  // this returns all blocks that have referenced any of the page references in the given block
  let notes: any = []
  const username = getCurrentUserName() || "user"
  const pageReferences = getBlockPageReferences(block)

  if (pageReferences.length > 0) {
    pageReferences.forEach((pageRef) => {
      let refs = getBlockUidsAndTextsReferencingPage(pageRef.title)

      const isNotable = (ref) => {
        let note = ref.text.trim().replace(`[[${pageRef.title}]]`, "")
        return note.length > 3
      }
      const totalMentions = refs.length
      notes.push(
        `Begin ${username}'s recent direct notes on [[${pageRef.title}]] (${totalMentions} notes total):`
      )

      // sort by created
      refs = refs.filter(isNotable).sort((a: any, b: any) => {
        return a.created - b.created
      })

      // pop the last one off since we just made it
      refs.pop()

      // limit to last 50

      refs = refs.slice(-limitToLast)
      // get the date in Roam Format

      refs.forEach((ref: any) => {
        const dateRef = `${getRoamStyleDate(ref.created)}`
        notes.push(`- ${ref.text} on ${dateRef}`)
      })

      notes.push(
        `Begin ${username}'s recent direct notes on [[${pageRef.title}]]`
      )
    })

    return notes
  }
}

const getBlockPageReferences = (block: any) => {
  const pageReferences = block[":block/refs"]
    ? block[":block/refs"].map((ref) => {
        return {
          uid: ref[":block/uid"],
          title: ref[":node/title"],
          text: ref[":block/string"],
          created: ref[":create/time"],
        }
      })
    : []

  return pageReferences
}

export const getBlockReferencedPageNotes = (block: any) => {
  // this returns all blocks that have referenced any of the page references in the given block
  let notes: any = []
  const pageReferences = getBlockPageReferences(block)
  const username = getCurrentUserName() || "user"

  if (pageReferences.length > 0) {
    pageReferences.forEach((pageRef) => {
      const tree = getBasicTreeByParentUid(pageRef.uid)
      // recursively add the tree to notes with the proper indentation
      const addTreeToNotes = (tree: any, level: number) => {
        tree.forEach((node: any) => {
          notes.push(`${"  ".repeat(level)}- ${node.text}`)
          if (node.children) {
            addTreeToNotes(node.children, level + 1)
          }
        })
      }
      notes.push(`Begin ${username}'s notes on [[${pageRef.title}]]:`)
      addTreeToNotes(tree, 1)
      notes.push(`End ${username}'s notes on [[${pageRef.title}]]`)
    })
  }

  return notes
}
