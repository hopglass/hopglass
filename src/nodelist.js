import { has_location } from "./helper.js"
import SortTable from "./sorttable.js"
import V from "virtual-dom"
import numeral from "numeral"

export default class NodeList {
  constructor(router) {
    const headings = [
      { name: "Knoten",
        sort: (a, b) => {
          const aname = typeof a.nodeinfo.hostname === "string" ? a.nodeinfo.hostname : a.nodeinfo.node_id
          const bname = typeof b.nodeinfo.hostname === "string" ? b.nodeinfo.hostname : b.nodeinfo.node_id
          if (typeof aname === "string" && typeof bname === "string")
            return aname.localeCompare(bname)
          return typeof aname === "string" ? 1 : typeof bname === "string" ? -1 : 0
        },
        reverse: false
      },
      { name: "Uptime",
        sort: (a, b) => {
          return a.uptime - b.uptime
        },
        reverse: true
      },
      { name: "#Links",
        sort: (a, b) => {
          return a.meshlinks - b.meshlinks
        },
        reverse: true
      },
      { name: "Clients",
        sort: (a, b) => {
          return ("clients" in a.statistics ? a.statistics.clients.total : -1) -
            ("clients" in b.statistics ? b.statistics.clients.total : -1)
        },
        reverse: true
      }
    ]
    this.router = router
    this.table = new SortTable(headings, 0, this.renderRow.bind(this))
  }

  renderRow(d) {
    const td1Content = []
    const aClass = ["hostname", d.flags.online ? "online" : "offline"]

    td1Content.push(V.h("a", {
      className: aClass.join(" "),
      onclick: this.router.node(d),
      href: "#!n:" + d.nodeinfo.node_id
    }, d.nodeinfo.hostname))

    if (has_location(d))
      td1Content.push(V.h("span", {className: "icon ion-location"}))

    const td1 = V.h("td", td1Content)
    const td2 = V.h("td", this.showUptime(d.uptime))
    const td3 = V.h("td", d.meshlinks.toString())
    const td4 = V.h("td", numeral("clients" in d.statistics ? d.statistics.clients.total : "").format("0,0"))

    return V.h("tr", [td1, td2, td3, td4])
  }

  render(d) {
    const el = document.createElement("div")
    d.appendChild(el)

    const h2 = document.createElement("h2")
    h2.textContent = "Alle Knoten"
    el.appendChild(h2)

    el.appendChild(this.table.el)
  }

  setData(d) {
    const data = d.nodes.all.map((e) => {
      const n = Object.create(e)
      n.uptime = this.getUptime(d.now, e) || 0
      n.meshlinks = e.meshlinks || 0
      return n
    })

    this.table.setData(data)
  }

  getUptime(now, d) {
    if (d.flags.online && "uptime" in d.statistics)
      return Math.round(d.statistics.uptime)
    else if (!d.flags.online && "lastseen" in d)
      return Math.round(-(now.unix() - d.lastseen.unix()))
  }

  showUptime(uptime) {
    let s = ""
    uptime /= 3600

    if (uptime !== undefined)
      if (Math.abs(uptime) >= 24)
        s = Math.round(uptime / 24) + "d"
      else
        s = Math.round(uptime) + "h"

    return s
  }
}
