const order = c => {
  if (/^\d$/.test(c))
    return 0
  else if (/^[a-z]$/i.test(c))
    return c.charCodeAt(0)
  else if (c === "~")
    return -1
  else if (c)
    return c.charCodeAt(0) + 256
  else
    return 0
}

// Based on dpkg code
const vercomp = (a, b) => {
  let apos = 0, bpos = 0
  while (apos < a.length || bpos < b.length) {
    let firstDiff = 0

    while ((apos < a.length && !/^\d$/.test(a[apos])) || (bpos < b.length && !/^\d$/.test(b[bpos]))) {
      const ac = order(a[apos])
      const bc = order(b[bpos])

      if (ac !== bc)
        return ac - bc

      apos++
      bpos++
    }

    while (a[apos] === "0")
      apos++

    while (b[bpos] === "0")
      bpos++

    while (/^\d$/.test(a[apos]) && /^\d$/.test(b[bpos])) {
      if (firstDiff === 0)
        firstDiff = a.charCodeAt(apos) - b.charCodeAt(bpos)

      apos++
      bpos++
    }

    if (/^\d$/.test(a[apos]))
      return 1

    if (/^\d$/.test(b[bpos]))
      return -1

    if (firstDiff !== 0)
      return firstDiff
  }

  return 0
}

export default vercomp
