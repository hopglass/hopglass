import { showTq, showStat, showDistance, dictGet, has_location, attributeEntry, getClients } from "../helper.js"
import { html, render } from "lit-html"
import moment from "moment"
import numeral from "numeral"
import Tablesort from "tablesort"

export default class Node {
  constructor(config, el, router, d) {
    const hwImg = this.getHwImg(config, d)
    render(html`
      ${hwImg ? '' : html`
        <h2>${d.nodeinfo.hostname}</h2>
      `}
      <table class="attributes">
        ${hwImg ? attributeEntry(hwImg, d.nodeinfo.hostname) : ''}

        ${attributeEntry("Status", this.showStatus(d))}
        ${attributeEntry("Gateway", d.flags.gateway ? "ja" : null)}
        ${attributeEntry("Koordinaten", this.showGeoURI(d))}

        ${config.showContact ? html`
          ${attributeEntry("Kontakt", dictGet(d.nodeinfo, ["owner", "contact"]))}
        ` : ''}

        ${attributeEntry("Hardware",  dictGet(d.nodeinfo, ["hardware", "model"]))}
        ${attributeEntry("Primäre MAC", dictGet(d.nodeinfo, ["network", "mac"]))}
        ${attributeEntry("Node ID", dictGet(d.nodeinfo, ["node_id"]))}
        ${attributeEntry("Firmware", this.showFirmware(d))}
        ${attributeEntry("Site", this.showSite(d, config))}
        ${attributeEntry("Uptime", this.showUptime(d))}
        ${attributeEntry("Teil des Netzes", this.showFirstseen(d))}
        ${Object.entries(this.getChannels(d)).map(({chan, channel}) => html`
          ${attributeEntry("Airtime " + chan, this.showAirtime(channel))}
        `)}
        ${attributeEntry("Systemlast", this.showLoad(d))}
        ${attributeEntry("Arbeitsspeicher", this.showRAM(d))}
        ${attributeEntry("IP Adressen", this.showIPs(d))}
        ${attributeEntry("Webseite", this.showPages(d))}
        ${attributeEntry("Gewähltes Gateway", this.showGateway(d, router))}
        ${attributeEntry("Autom. Updates", this.showAutoupdate(d))}
        ${attributeEntry("Clients", this.showClients(d), this.showMeshClients(d))}
      </table>
      ${(config.nodeInfos || []).map(nodeInfo => html`
        <h4>${nodeInfo.name}</h4>
        ${this.showStatImg(nodeInfo, d)}
      `)}
    `, el)
  }

  getHwImg(config, d) {
    if (!config.hwImg) return null

    const top = document.createElement("div")
    top.id = "routerpicdiv"
    try {
      config.hwImg.forEach(hwImg => {
        try {
          top.appendChild(this.showNodeImg(hwImg, dictGet(d, ["nodeinfo", "hardware", "model"])))
        } catch (err) {
          console.log(err.message)
        }
      })
    } catch (err) {
      console.log(err.message)
    }
    return top
  }

  getChannels(d) {
    if (!("airtime" in d.statistics)) return []
    return d.statistics.airtime.sort((a, b) => {
      return a.frequency - b.frequency
    }).map(channel => {
      const mode = Math.floor(channel.frequency / 1000)

      let chan
      if (mode === 2)
        chan = "Kanal " + (channel.frequency - 2407) / 5
      else if (mode === 5)
        chan = "Kanal " + (channel.frequency - 5000) / 5
      else
        chan = channel.frequency.toString() + " MHz"

      return {
        chan,
        channel
      }
    })
  }

  showNeighbours(d) {
    if (d.neighbours.length === 0) return ""
    
    const h3 = document.createElement("h3")
    h3.textContent = "Links (" + d.neighbours.length + ")"
    el.appendChild(h3)

    const table = document.createElement("table")
    const thead = document.createElement("thead")

    const tr = document.createElement("tr")
    const th1 = document.createElement("th")
    th1.textContent = " "
    tr.appendChild(th1)

    const th2 = document.createElement("th")
    th2.textContent = "Knoten"
    th2.classList.add("sort-default")
    tr.appendChild(th2)

    const th3 = document.createElement("th")
    th3.textContent = "TQ"
    tr.appendChild(th3)

    const th4 = document.createElement("th")
    th4.textContent = "Typ"
    tr.appendChild(th4)

    const th5 = document.createElement("th")
    th5.textContent = "Entfernung"
    tr.appendChild(th5)

    thead.appendChild(tr)
    table.appendChild(thead)

    const tbody = document.createElement("tbody")

    d.neighbours.forEach(d => {
      const unknown = !(d.node)
      const tr = document.createElement("tr")

      const td1 = document.createElement("td")
      td1.appendChild(document.createTextNode(d.incoming ? " ← " : " → "))
      tr.appendChild(td1)

      const td2 = document.createElement("td")
      td2.appendChild(this.createLink(d, router))

      if (!unknown && has_location(d.node)) {
        const span = document.createElement("span")
        span.classList.add("icon")
        span.classList.add("ion-location")
        td2.appendChild(span)
      }

      tr.appendChild(td2)

      const td3 = document.createElement("td")
      const a2 = document.createElement("a")
      a2.href = "#"
      a2.textContent = showTq(d.link)
      a2.onclick = this.router.link(d.link)
      td3.appendChild(a2)
      tr.appendChild(td3)

      const td4 = document.createElement("td")
      const a3 = document.createElement("a")
      a3.href = "#"
      a3.textContent = d.link.type
      a3.onclick = this.router.link(d.link)
      td4.appendChild(a3)
      tr.appendChild(td4)

      const td5 = document.createElement("td")
      const a4 = document.createElement("a")
      a4.href = "#"
      a4.textContent = showDistance(d.link)
      a4.onclick = this.router.link(d.link)
      td5.appendChild(a4)
      td5.setAttribute("data-sort", d.link.distance !== undefined ? -d.link.distance : 1)
      tr.appendChild(td5)

      tbody.appendChild(tr)
    })

    table.appendChild(tbody)
    table.className = "node-links"

    new Tablesort(table)

    return table
  }

  showLatitude(d) {
    const suffix = Math.sign(d) > -1 ? "' N" : "' S"
    d = Math.abs(d)
    let a = Math.floor(d)
    const min = (d * 60) % 60
    a = (a < 10 ? "0" : "") + a

    return a + "° " + numeral(min).format("0.000") + suffix
  }

  showLongitude(d) {
    const suffix = Math.sign(d) > -1 ? "' E" : "' W"
    d = Math.abs(d)
    let a = Math.floor(d)
    const min = (d * 60) % 60
    a = (a < 100 ? "0" + (a < 10 ? "0" : "") : "") + a

    return a + "° " + numeral(min).format("0.000") + suffix
  }


  showGeoURI(d) {
    if (!has_location(d))
      return undefined

    return (el) => {
      const latitude = d.nodeinfo.location.latitude
      const longitude = d.nodeinfo.location.longitude
      const a = document.createElement("a")
      a.textContent = this.showLatitude(latitude) + " " +
                      this.showLongitude(longitude)

      a.href = "geo:" + latitude + "," + longitude
      el.appendChild(a)
    }
  }

  showStatus(d) {
    return el => {
      el.classList.add(d.flags.unseen ? "unseen" : (d.flags.online ? "online" : "offline"))
      if (d.flags.online)
        el.textContent = "online, letzte Nachricht " + d.lastseen.fromNow() + " (" + d.lastseen.format("DD.MM.YYYY,  H:mm:ss") + ")"
      else
        el.textContent = "offline, letzte Nachricht " + d.lastseen.fromNow() + " (" + d.lastseen.format("DD.MM.YYYY,  H:mm:ss") + ")"
    }
  }

  showFirmware(d) {
    const release = dictGet(d.nodeinfo, ["software", "firmware", "release"])
    const base = dictGet(d.nodeinfo, ["software", "firmware", "base"])

    if (release === null || base === null)
      return undefined

    return release + " / " + base
  }

  showSite(d, config) {
    const site = dictGet(d.nodeinfo, ["system", "site_code"])
    const rt = site
    if (config.siteNames)
      config.siteNames.forEach(t => {
        if(site === t.site)
          rt = t.name
      })
    return rt
  }

  showUptime(d) {
    if (!("uptime" in d.statistics))
      return undefined

    return moment.duration(d.statistics.uptime, "seconds").humanize()
  }

  showFirstseen(d) {
    if (!("firstseen" in d))
      return undefined

    return d.firstseen.fromNow(true)
  }

  showClients(d) {
    if (!d.flags.online)
      return undefined

    const meshclients = this.getMeshClients(d)
    this.resetMeshClients(d)
    const before = "     ("
    const after = " in der lokalen Wolke)"
    return el => {
      el.appendChild(document.createTextNode(d.statistics.clients.total > 0 ? d.statistics.clients.total : "keine"))
      el.appendChild(document.createTextNode(before))
      el.appendChild(document.createTextNode(meshclients > 0 ? meshclients : "keine"))
      el.appendChild(document.createTextNode(after))
      el.appendChild(document.createElement("br"))

      const clientTypes = getClients(d.statistics)
      for (const clientsNum in clientTypes) {
        const clients = clientTypes[clientsNum]
        const span = document.createElement("span")
        span.classList.add("clients")
        span.textContent = " ".repeat(clients.count)
        span.style.color = clients.color
        el.appendChild(span)
      }

      const spanmesh = document.createElement("span")
      spanmesh.classList.add("clientsMesh")
      spanmesh.textContent = " ".repeat(meshclients - d.statistics.clients.total)
      el.appendChild(spanmesh)
    }
  }

  getMeshClients(node) {
    let meshclients = 0
    if (node.statistics && !isNaN(node.statistics.clients.total))
      meshclients = node.statistics.clients.total

    if (!node)
      return 0

    if (node.parsed)
      return 0

    node.parsed = 1
    node.neighbours.forEach(neighbour => {
      if (!neighbour.link.isVPN && neighbour.node)
        meshclients += this.getMeshClients(neighbour.node)
    })

    return meshclients
  }

  resetMeshClients(node) {
    if (!node.parsed)
      return

    node.parsed = 0

    node.neighbours.forEach(neighbour => {
      if (!neighbour.link.isVPN && neighbour.node)
        this.resetMeshClients(neighbour.node)
    })
  }

  showMeshClients(d) {
    if (!d.flags.online)
      return undefined

    const meshclients = this.getMeshClients(d)
    this.resetMeshClients(d)
    return el => {
      el.appendChild(document.createTextNode(meshclients > 0 ? meshclients : "keine"))
      el.appendChild(document.createElement("br"))
    }
  }

  showIPs(d) {
    const ips = dictGet(d.nodeinfo, ["network", "addresses"])
    if (ips === null)
      return undefined

    ips.sort()

    return el => {
      ips.forEach((ip, i) => {
        const link = !ip.startsWith("fe80:")

        if (i > 0)
          el.appendChild(document.createElement("br"))

        if (link) {
          const a = document.createElement("a")
          if (ip.includes("."))
            a.href = "http://" + ip + "/"
          else
            a.href = "http://[" + ip + "]/"
          a.textContent = ip
          el.appendChild(a)
        } else
          el.appendChild(document.createTextNode(ip))
      })
    }
  }

  showBar(className, v) {
    const span = document.createElement("span")
    span.classList.add("bar")
    span.classList.add(className)

    const bar = document.createElement("span")
    bar.style.width = (v * 100) + "%"
    span.appendChild(bar)

    const label = document.createElement("label")
    label.textContent = (Math.round(v * 100)) + " %"
    span.appendChild(label)

    return span
  }

  showLoadBar(className, v) {
    const span = document.createElement("span")
    span.classList.add("bar")
    span.classList.add(className)

    const bar = document.createElement("span")
    if (v  >= 1) {
    bar.style.width = ((v * 100) % 100) + "%"
    bar.style.background = "rgba(255, 50, 50, 0.9)"
    span.style.background = "rgba(255, 50, 50, 0.6)"
    span.appendChild(bar)
    }
    else
    {
      bar.style.width = (v * 100) + "%"
      span.appendChild(bar)
    }

    const label = document.createElement("label")
    label.textContent = +(Math.round(v + "e+2")  + "e-2")
    span.appendChild(label)

    return span
  }

  showLoad(d) {
    if (!("loadavg" in d.statistics))
      return undefined

    return (el) => {
      el.appendChild(this.showLoadBar("load-avg", d.statistics.loadavg))
    }
  }

  showRAM(d) {
    if (!("memory_usage" in d.statistics))
      return undefined

    return (el) => {
      el.appendChild(this.showBar("memory-usage", d.statistics.memory_usage))
    }
  }

  showAirtime(v) {
    if (!v) return
    v.wait = v.busy - v.rx - v.tx

    const span = document.createElement("span")

    span.classList.add("bar")
    span.classList.add("airtime")
    span.setAttribute("title", "RX:" + Math.round(v.rx * 100) + "%, TX:" + Math.round(v.tx * 100) + "%, Wait:" + Math.round(v.wait * 100) + "%")

    const rxbar = document.createElement("span")
    rxbar.style.width = (v.rx * 100) + "%"
    rxbar.style.background = "rgba(85, 128, 32, 0.8)"
    span.appendChild(rxbar)

    const txbar = document.createElement("span")
    txbar.style.width = (v.tx * 100) + "%"
    txbar.style.background = "rgba(233, 85, 32, 1)"
    span.appendChild(txbar)

    const waitbar = document.createElement("span")
    waitbar.style.width = (v.wait * 100) + "%"
    waitbar.style.background = "rgba(32, 85, 128, 1)"
    span.appendChild(waitbar)

    span.style.background = "rgba(85, 128, 32, 0.5)"

    const label = document.createElement("label")
    label.textContent = Math.round(v.busy * 100) + " %"
    span.appendChild(label)

    return el => {
      el.appendChild(span)
    }
  }

  createLink(target, router) {
    if (!target) return document.createTextNode("unknown")
    const unknown = !(target.node)
    const text = unknown ? (target.id ? target.id : target) : target.node.nodeinfo.hostname
    if (!unknown) {
      const link = document.createElement("a")
      link.classList.add("hostname-link")
      link.href = "#"
      link.onclick = router.node(target.node)
      link.textContent = text
      return link
    }
    return document.createTextNode(text)
  }

  showGateway(d, router) {
    let nh
    if (dictGet(d.statistics, ["nexthop"]))
      nh = dictGet(d.statistics, ["nexthop"])
    if (dictGet(d.statistics, ["gateway_nexthop"]))
      nh = dictGet(d.statistics, ["gateway_nexthop"])
    const gw = dictGet(d.statistics, ["gateway"])

    if (!gw) return null
    return el => {
      let num = 0
      while (gw && nh && gw.id !== nh.id && num < 10) {
        if (num !== 0) el.appendChild(document.createTextNode(" -> "))
        el.appendChild(this.createLink(nh, router))
        num++
        if (!nh.node || !nh.node.statistics) break
        if (!dictGet(nh.node.statistics, ["gateway"]) || !dictGet(nh.node.statistics, ["gateway"]).id) break
        if (dictGet(nh.node.statistics, ["gateway"]).id !== gw.id) break
        if (dictGet(nh.node.statistics, ["gateway_nexthop"]))
          nh = dictGet(nh.node.statistics, ["gateway_nexthop"])
        else if (dictGet(nh.node.statistics, ["nexthop"]))
          nh = dictGet(nh.node.statistics, ["nexthop"])
        else
          break
      }
      if (gw && nh && gw.id !== nh.id) {
        if (num !== 0) el.appendChild(document.createTextNode(" -> "))
        num++
        el.appendChild(document.createTextNode("..."))
      }
      if (num !== 0) el.appendChild(document.createTextNode(" -> "))
      el.appendChild(this.createLink(gw, router))
    }
  }

  showPages(d) {
    const webpages = dictGet(d.nodeinfo, ["pages"])
    if (webpages === null)
      return undefined

    webpages.sort()

    return (el) => {
      webpages.forEach((webpage, i) => {
        if (i > 0)
          el.appendChild(document.createElement("br"))

        const a = document.createElement("span")
        const link = document.createElement("a")
        link.href = webpage
        if (webpage.search(/^https:\/\//i) !== -1) {
          const lock = document.createElement("span")
          lock.className = "ion-android-lock"
          a.appendChild(lock)
          const t1 = document.createTextNode(" ")
          a.appendChild(t1)
          link.textContent = webpage.replace(/^https:\/\//i, "")
          }
        else
          link.textContent = webpage.replace(/^http:\/\//i, "")
        a.appendChild(link)
        el.appendChild(a)
      })
    }
  }

  showAutoupdate(d) {
    const au = dictGet(d.nodeinfo, ["software", "autoupdater"])
    if (!au)
      return undefined

    return au.enabled ? "aktiviert (" + au.branch + ")" : "deaktiviert"
  }

  showNodeImg(o, model) {
    if (!model)
      return document.createTextNode("Knotenname")

    let content, caption
    const modelhash = model.split("").reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)

    content = document.createElement("img")
    content.id = "routerpicture"
    content.classList.add("nodeImg")
    content.src = o.thumbnail.replace("{MODELHASH}", modelhash)
    content.onerror = () => {
      document.getElementById("routerpicdiv").outerHTML = "Knotenname"
    }

    if (o.caption) {
      caption = o.caption.replace("{MODELHASH}", modelhash)

      if (!content)
        content = document.createTextNode(caption)
    }

    const p = document.createElement("p")
    p.appendChild(content)

    return content
  }

  showStatImg(o, d) {
    const subst = {}
    subst["{NODE_ID}"] = d.nodeinfo.node_id ? d.nodeinfo.node_id : "unknown"
    subst["{NODE_NAME}"] = d.nodeinfo.hostname ? d.nodeinfo.hostname : "unknown"
    return showStat(o, subst)
  }
}
