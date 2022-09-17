import { normalizePageTitle } from "./utils"

/*
Note: Bellow functions were copied and slightly modified from roamjs-components
*/
export const getCurrentUser = (): string[] => {
  const globalAppState = JSON.parse(
    localStorage.getItem("globalAppState") || '["","",[]]'
  ) as (string | string[])[]
  const userIndex = globalAppState.findIndex((s) => s === "~:user")
  if (userIndex > 0) {
    return globalAppState[userIndex + 1] as string[]
  }
  return []
}

export const getCurrentUserDisplayName = (): string => {
  const userArray = getCurrentUser()
  const uidIndex = userArray.findIndex((s) => s === "~:display-name")
  if (uidIndex > 0) {
    return userArray[uidIndex + 1] || ""
  }
  return ""
}

export const getCurrentUserName = (): string => {
  const name = getCurrentUserDisplayName()
  return name.split(" ")[0]
}

const sortBasicNodes = (c: any[]): any[] =>
  c
    .sort(({ order: a }, { order: b }) => a - b)
    .map(({ order: _, children = [], ...node }) => ({
      children: sortBasicNodes(children),
      ...node,
    }))

export const getBasicTreeByParentUid = (uid: string): any[] =>
  sortBasicNodes(
    window.roamAlphaAPI
      .q(
        `[:find (pull ?c [[:block/string :as "text"] :block/uid :block/order {:block/children ...}]) :where [?b :block/uid "${uid}"] [?b :block/children ?c]]`
      )
      .map((a: any) => a[0] as any)
  )

/* End roamjs-components section */

export const getBlockUidsAndTextsReferencingPage = (
  title: string
): { uid: string; text: string }[] =>
  (
    window.roamAlphaAPI.data.fast.q(
      `[:find (pull ?r [:block/uid :block/string]) :where [?p :node/title "${normalizePageTitle(
        title
      )}"] [?r :block/refs ?p]]`
    ) as [any][]
  ).map(([node]) => ({
    uid: node[":block/uid"] || "",
    text: node[":block/string"] || "",
  }))

export const getBlock = (uid: string) => {
  return window.roamAlphaAPI.data.pull(
    `[
        :block/uid 
        :block/string
        {:block/page [
            :node/title
            :node/uid
          ]
        }
        {:block/parents [
            :block/uid
            :block/order
            :block/string
            :node/title
          ]
        } 
        {:block/children 
          [
            :block/uid 
            :block/order
            :block/string
          ]
        }
        {:block/refs
          [
            :block/uid
            :block/string
            :node/title
            :create/time
          ]
        }
      ]`,
    [":block/uid", uid]
  )
}
