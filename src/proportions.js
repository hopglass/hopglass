import chroma from "chroma-js"
import V from "virtual-dom"
import numeral from "numeral"
import Filter from "./filters/genericnode.js"
import vercomp from "./vercomp.js"

export default class Proportions {
  constructor(config, filterManager) {
    this.config = config
    this.filterManager = filterManager
    this.scale = chroma.scale("YlGnBu").mode("lab")

    this.statusTable = document.createElement("table")
    this.statusTable.classList.add("proportion")

    this.fwTable = document.createElement("table")
    this.fwTable.classList.add("proportion")

    this.hwTable = document.createElement("table")
    this.hwTable.classList.add("proportion")

    this.geoTable = document.createElement("table")
    this.geoTable.classList.add("proportion")

    this.autoTable = document.createElement("table")
    this.autoTable.classList.add("proportion")

    this.uplinkTable = document.createElement("table")
    this.uplinkTable.classList.add("proportion")

    this.gwNodesTable = document.createElement("table")
    this.gwNodesTable.classList.add("proportion")

    this.gwClientsTable = document.createElement("table")
    this.gwClientsTable.classList.add("proportion")

    this.siteTable = document.createElement("table")
    this.siteTable.classList.add("proportion")
  }

  showStatGlobal(o) {
    return showStat(o)
  }

  count(nodes, key, f) {
    const dict = {}

    nodes.forEach(d => {
      const v = dictGet(d, key.slice(0))

      if (f !== undefined)
        v = f(v)

      if (v === null)
        return

      dict[v] = 1 + (v in dict ? dict[v] : 0)
    })

    return Object.keys(dict).map(d => { return [d, dict[d], key, f] })
  }

  countClients(nodes, key, f) {
    const dict = {}

    nodes.forEach(d => {
      const v = dictGet(d, key.slice(0))

      if (f !== undefined)
        v = f(v)

      if (v === null)
        return

      dict[v] = d.statistics.clients.total + (v in dict ? dict[v] : 0)
    })

    return Object.keys(dict).map(d => { return [d, dict[d], key, f] })
  }


  addFilter(filter) {
    return () => {
      this.filterManager.addFilter(filter)

      return false
    }
  }

  fillTable(name, table, data) {
    if (!table.last)
      table.last = V.h("table")

    const max = 0
    data.forEach(d => {
      if (d[1] > max)
        max = d[1]
    })

    const items = data.map(d => {
      const v = d[1] / max
      const c1 = chroma.contrast(scale(v), "white")
      const c2 = chroma.contrast(scale(v), "black")

      const filter = new Filter(name, d[2], d[0], d[3])

      const a = V.h("a", { href: "#", onclick: addFilter(filter) }, d[0])

      const th = V.h("th", a)
      const td = V.h("td", V.h("span", {style: {
                                       width: Math.round(v * 100) + "%",
                                       backgroundColor: scale(v).hex(),
                                       color: c1 > c2 ? "white" : "black"
                                     }}, numeral(d[1]).format("0,0")))

      return V.h("tr", [th, td])
    })

    const tableNew = V.h("table", items)
    table = V.patch(table, V.diff(table.last, tableNew))
    table.last = tableNew
  }

  setData(data) {
    const onlineNodes = data.nodes.all.filter(online)
    const nodes = onlineNodes.concat(data.nodes.lost)
    const nodeDict = {}

    data.nodes.all.forEach(d => {
      nodeDict[d.nodeinfo.node_id] = d
    })

    const statusDict = count(nodes, ["flags", "online"], d => {
      return d ? "online" : "offline"
    })
    const fwDict = count(nodes, ["nodeinfo", "software", "firmware", "release"])
    const hwDict = count(nodes, ["nodeinfo", "hardware", "model"], d => {
      if (d) {
        d = d.replace(/\(r\)|\(tm\)/gi, "").replace(/AMD |Intel |TP-Link | CPU| Processor/g, "")
        if (d.indexOf("@") > 0) d = d.substring(0, d.indexOf("@"))
      }
      return d
    })
    const geoDict = count(nodes, ["nodeinfo", "location"], d => {
      return d && d.longitude && d.latitude ? "ja" : "nein"
    })

    const autoDict = count(nodes, ["nodeinfo", "software", "autoupdater"], d => {
      if (d === null)
        return null
      else if (d.enabled)
        return d.branch
      else
        return "(deaktiviert)"
    })

    const uplinkDict = count(nodes, ["flags", "uplink"], d => {
      return d ? "ja" : "nein"
    })

    const gwNodesDict = count(onlineNodes, ["statistics", "gateway"], d => {
      if (d === null)
        return null

      if (d.node)
        return d.node.nodeinfo.hostname

      if (d.id)
        return d.id

      return d
    })

    const gwClientsDict = countClients(onlineNodes, ["statistics", "gateway"], d => {
      if (d === null)
        return null

      if (d.node)
        return d.node.nodeinfo.hostname

      if (d.id)
        return d.id

      return d
    })

    const siteDict = count(nodes, ["nodeinfo", "system", "site_code"], d => {
      const rt = d
      if (this.config.siteNames)
        this.config.siteNames.forEach(t => {
          if(d === t.site)
            rt = t.name
        })
      return rt
    })

    fillTable("Status", this.statusTable, statusDict.sort((a, b) => b[1] - a[1]))
    fillTable("Firmware", this.fwTable, fwDict.sort((a, b) => vercomp(b[0], a[0])))
    fillTable("Hardware", this.hwTable, hwDict.sort((a, b) => b[1] - a[1]))
    fillTable("Koordinaten", this.geoTable, geoDict.sort((a, b) => b[1] - a[1]))
    fillTable("Uplink", this.uplinkTable, uplinkDict.sort((a, b) => b[1] - a[1]))
    fillTable("Autom. Updates", this.autoTable, autoDict.sort((a, b) => b[1] - a[1]))
    fillTable("Gateway", this.gwNodesTable, gwNodesDict.sort((a, b) => b[1] - a[1]))
    fillTable("Gateway", this.gwClientsTable, gwClientsDict.sort((a, b) => b[1] - a[1]))
    fillTable("Site", this.siteTable, siteDict.sort((a, b) => b[1] - a[1]))
  }

  render(el) {
    let h2
    this.renderSingle(el, "Status", this.statusTable)
    this.renderSingle(el, "Nodes an Gateway", this.gwNodesTable)
    this.renderSingle(el, "Clients an Gateway", this.gwClientsTable)
    this.renderSingle(el, "Firmwareversionen", this.fwTable)
    this.renderSingle(el, "Uplink", this.uplinkTable)
    this.renderSingle(el, "Hardwaremodelle", this.hwTable)
    this.renderSingle(el, "Auf der Karte sichtbar", this.geoTable)
    this.renderSingle(el, "Autoupdater", this.autoTable)
    this.renderSingle(el, "Site", this.siteTable)

    if (this.config.globalInfos)
      this.config.globalInfos.forEach((globalInfo) => {
        h2 = document.createElement("h2")
        h2.textContent = globalInfo.name
        el.appendChild(h2)
        el.appendChild(showStatGlobal(globalInfo))
      })
    }

  renderSingle(el, heading, table) {
     let h2
     h2 = document.createElement("h2")
     h2.textContent = heading
     h2.onclick = () => {
       table.classList.toggle("hidden")
     }
     el.appendChild(h2)
     el.appendChild(table)
   }
}
