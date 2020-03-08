import SortTable from "./sorttable.js"
import V from "virtual-dom"
import { showTq, showDistance } from "./helper.js"

export default class LinkList {
  constructor(linkScale, router) {
    const headings = [
      { name: "Knoten",
        sort: function (a, b) {
          return this.linkName(a).localeCompare(this.linkName(b))
        },
        reverse: false
      },
      { name: "TQ",
        sort: function (a, b) { return a.tq - b.tq},
        reverse: true
      },
      { name: "Typ",
        sort: function (a, b) {
          return a.type.localeCompare(b.type)
        },
        reverse: false
      },
      { name: "Entfernung",
        sort: function (a, b) {
          return (a.distance === undefined ? -1 : a.distance) -
            (b.distance === undefined ? -1 : b.distance)
        },
        reverse: true
      }
    ]

    this.linkScale = linkScale
    this.router = router
    this.table = new SortTable(headings, 2, this.renderRow.bind(this))
  }

  renderRow(d) {
    const td1Content = [V.h("a", {href: "#", onclick: this.router.link(d)}, this.linkName(d))]

    const td1 = V.h("td", td1Content)
    const td2 = V.h("td", {style: {color: this.linkScale(d.tq).hex()}}, showTq(d))
    const td3 = V.h("td", d.type)
    const td4 = V.h("td", showDistance(d))

    return V.h("tr", [td1, td2, td3, td4])
  }

  render(d)  {
    const el = document.createElement("div")
    el.last = V.h("div")
    d.appendChild(el)

    const h2 = document.createElement("h2")
    h2.textContent = "Verbindungen"
    el.appendChild(h2)

    el.appendChild(this.table.el)
  }

  setData(d) {
    this.table.setData(d.graph.links)
  }

  linkName(d) {
    return (d.source.node ? d.source.node.nodeinfo.hostname : d.source.id) + " – " + d.target.node.nodeinfo.hostname
  }
}
