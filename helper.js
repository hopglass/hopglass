function get(url) {
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest()
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

function getJSON(url) {
  return get(url).then(JSON.parse)
}

function sortByKey(key, d) {
  return d.slice().sort( function (a, b) {
    return a[key] - b[key]
  }).reverse()
}

function limit(key, m, d) {
  return d.filter( function (d) {
    return d[key].isAfter(m)
  })
}

function sum(a) {
  return a.reduce( function (a, b) {
    return a + b
  }, 0)
}

function one() {
  return 1
}

function trueDefault(d) {
  return d === undefined ? true : d
}

function dictGet(dict, key) {
  var k = key.shift()

  if (!(k in dict))
    return null

  if (key.length == 0)
    return dict[k]

  return dictGet(dict[k], key)
}

function localStorageTest() {
  var test = 'test'
  try {
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch(e) {
    return false
  }
}

function listReplace(s, subst) {
  for (key in subst) {
    var re = new RegExp(key, 'g')
    s = s.replace(re, subst[key])
  }
  return s
}

/* Helpers working with nodes */

function offline(d) {
  return !d.flags.online
}

function online(d) {
  return d.flags.online
}

function has_location(d) {
  return "location" in d.nodeinfo &&
         Math.abs(d.nodeinfo.location.latitude) < 90 &&
         Math.abs(d.nodeinfo.location.longitude) < 180
}

function subtract(a, b) {
  var ids = {}

  b.forEach( function (d) {
    ids[d.nodeinfo.node_id] = true
  })

  return a.filter( function (d) {
    return !(d.nodeinfo.node_id in ids)
  })
}

/* Helpers working with links */

function showDistance(d) {
  if (isNaN(d.distance))
    return

  return numeral(d.distance).format("0,0") + " m"
}

function showTq(d) {
  return numeral(1/d.tq).format("0%")
}

/* Infobox stuff (XXX: move to module) */

function attributeEntry(el, label, value) {
  if (value === null || value == undefined)
    return

  var tr = document.createElement("tr")
  var th = document.createElement("th")
  if (typeof label === "string")
    th.textContent = label
  else {
    th.appendChild(label)
    tr.className = "routerpic"
  }

  tr.appendChild(th)

  var td = document.createElement("td")

  if (typeof value == "function")
    value(td)
  else
    td.appendChild(document.createTextNode(value))

  tr.appendChild(td)

  el.appendChild(tr)

  return td
}

function createIframe(opt, width, height) {
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

function showStat(o, subst) {
  var content, caption
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

  var p = document.createElement("p")

  if (o.href) {
    var link = document.createElement("a")
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

function getClients(statistics) {
  if (!statistics.clients) return []
  var cableClients = Math.max(statistics.clients.total - statistics.clients.wifi, 0)
  var wifiClients = Math.max(statistics.clients.wifi - statistics.clients.wifi24 - statistics.clients.wifi5, 0)
  var wifi24Clients = statistics.clients.wifi24
  var wifi5Clients = statistics.clients.wifi5

  return [
    { count: cableClients,  label: "Kabel",         color: "#E3A619" },
    { count: wifiClients,   label: "Sonstige Wifi", color: "#D10E2A" },
    { count: wifi24Clients, label: "2.4GHz",        color: "#DC0067" },
    { count: wifi5Clients,  label: "5GHz",          color: "#0A9C92" },
  ]
}

function getClientColor(statistics, i) {
  var clients = getClients(statistics)
  var sum = clients.map(function(c) {
    return c.count
  }).reduce(function(a, b) {
    return a + b
  }, 0)
  var ret
  for (var checking = 0; checking < clients.length; checking++) {
    if (i < sum) ret = clients[checking].color;
    sum -= clients[checking].count
  }
  return ret
}
