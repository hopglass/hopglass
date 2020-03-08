import numeral from "numeral"

export const get = (url) => {
  return new Promise(function(resolve, reject) {
    const req = new XMLHttpRequest()
    req.open('GET', url)

    req.onload = function() {
      if (req.status == 200) {
        resolve(req.response)
      }
      else {
        reject(Error(req.statusText))
      }
    }

    req.onerror = function() {
      reject(Error("Network Error"))
    }

    req.send()
  })
}

export const getJSON = (url) => {
  return get(url).then(JSON.parse)
}

export const sortByKey = (key, d) => {
  return d.slice().sort((a, b) => {
    return a[key] - b[key]
  }).reverse()
}

export const limit = (key, m, d) => {
  return d.filter((d) => {
    return d[key].isAfter(m)
  })
}

export const sum = (a) => {
  return a.reduce((a, b) => {
    return a + b
  }, 0)
}

export const one = () => {
  return 1
}

export const trueDefault = (d) => {
  return d === undefined ? true : d
}

export const dictGet = (dict, key) => {
  const k = key.shift()

  if (!(k in dict))
    return null

  if (key.length == 0)
    return dict[k]

  return dictGet(dict[k], key)
}

export const localStorageTest = () => {
  const test = 'test'
  try {
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch(e) {
    return false
  }
}

export const listReplace = (s, subst) => {
  for (key in subst) {
    const re = new RegExp(key, 'g')
    s = s.replace(re, subst[key])
  }
  return s
}

/* Helpers working with nodes */

export const offline = (d) => {
  return !d.flags.online
}

export const online = (d) => {
  return d.flags.online
}

export const has_location = (d) => {
  return "location" in d.nodeinfo &&
         Math.abs(d.nodeinfo.location.latitude) < 90 &&
         Math.abs(d.nodeinfo.location.longitude) < 180
}

export const subtract = (a, b) => {
  const ids = {}

  b.forEach((d) => {
    ids[d.nodeinfo.node_id] = true
  })

  return a.filter((d) => {
    return !(d.nodeinfo.node_id in ids)
  })
}

/* Helpers working with links */

export const showDistance = (d) => {
  if (isNaN(d.distance))
    return

  return numeral(d.distance).format("0,0") + " m"
}

export const showTq = (d) => {
  return numeral(1/d.tq).format("0%")
}

/* Infobox stuff (XXX: move to module) */

export const attributeEntry = (label, value) => {
  if (value === null || value == undefined)
    return ""

  const tr = document.createElement("tr")
  const th = document.createElement("th")
  if (typeof label === "string")
    th.textContent = label
  else {
    th.appendChild(label)
    tr.className = "routerpic"
  }

  tr.appendChild(th)

  const td = document.createElement("td")

  if (typeof value == "function")
    value(td)
  else
    td.appendChild(document.createTextNode(value))

  tr.appendChild(td)
  return tr
}

export const createIframe = (opt, width, height) => {
  el = document.createElement("iframe")
  width = typeof width !== 'undefined' ? width : '100%'
  height = typeof height !== 'undefined' ? height : '350px'

  if (opt.src)
    el.src = opt.src
  else
    el.src = opt

  if (opt.frameBorder)
    el.frameBorder = opt.frameBorder
  else
    el.frameBorder = 1

  if (opt.width)
    el.width = opt.width
  else
    el.width = width

  if (opt.height)
    el.height = opt.height
  else
    el.height = height

  el.scrolling = "no"
  el.seamless = "seamless"

  return el
}

export const showStat = (o, subst) => {
  let content, caption
  subst = typeof subst !== 'undefined' ? subst : {}

  if (o.thumbnail) {
    content = document.createElement("img")
    content.src = listReplace(o.thumbnail, subst)
  }

  if (o.caption) {
    caption = listReplace(o.caption, subst)

    if (!content)
    content = document.createTextNode(caption)
  }

  if (o.iframe) {
    content = createIframe(o.iframe, o.width, o.height)
    if (o.iframe.src)
    content.src = listReplace(o.iframe.src, subst)
    else
    content.src = listReplace(o.iframe, subst)
  }

  const p = document.createElement("p")

  if (o.href) {
    const link = document.createElement("a")
    link.target = "_blank"
    link.href = listReplace(o.href, subst)
    link.appendChild(content)

    if (caption && o.thumbnail)
    link.title = caption

    p.appendChild(link)
  } else
    p.appendChild(content)

  return p
}

export const getClients = (statistics) => {
  if (!statistics.clients) return []
  const cableClients = Math.max(statistics.clients.total - statistics.clients.wifi, 0)
  const wifiClients = Math.max(statistics.clients.wifi - statistics.clients.wifi24 - statistics.clients.wifi5, 0)
  const wifi24Clients = statistics.clients.wifi24
  const wifi5Clients = statistics.clients.wifi5

  return [
    { count: cableClients,  label: "Kabel",         color: "#E3A619" },
    { count: wifiClients,   label: "Sonstige Wifi", color: "#D10E2A" },
    { count: wifi24Clients, label: "2.4GHz",        color: "#DC0067" },
    { count: wifi5Clients,  label: "5GHz",          color: "#0A9C92" },
  ]
}

export const getClientColor = (statistics, i) => {
  const clients = getClients(statistics)
  let sum = clients.map(c => c.count).reduce((a, b) => a + b, 0)
  let ret
  for (let checking = 0; checking < clients.length; checking++) {
    if (i < sum) ret = clients[checking].color;
    sum -= clients[checking].count
  }
  return ret
}
