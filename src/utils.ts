import "./types"

function getNumberWithOrdinal(n) {
  var s = ["th", "st", "nd", "rd"],
    v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export const getRoamStyleDate = (created: string) => {
  const date = new Date(parseInt(created))
  // date format is: September 14th, 2022
  const month = date.toLocaleString("default", { month: "long" })
  const day = getNumberWithOrdinal(date.getDate())
  const year = date.getFullYear()
  console.log({ month, day, year })
  const formatted = `${month} ${day}, ${year}`

  return `[[${formatted}]]`
}

export const normalizePageTitle = (title: string): string =>
  title.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
