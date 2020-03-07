import moment from "moment"
import V from "virtual-dom"

export default class SimpleNodeList {
  constructor(nodes, field, router, title) {
    this.nodes = nodes
    this.field = field
    this.router = router
    this.title = title
  }

  render(d) {
    this.el = document.createElement("div")
    d.appendChild(this.el)
  }

  setData() {
    const list = data.nodes[this.nodes]

    if (list.length === 0) {
      while (this.el.firstChild)
            this.el.removeChild(this.el.firstChild)

      this.tbody = null

      return
    }

    if (!this.tbody) {
      const h2 = document.createElement("h2")
      h2.textContent = this.title
      this.el.appendChild(h2)

      const table = document.createElement("table")
      this.el.appendChild(table)

      this.tbody = document.createElement("this.tbody")
      this.tbody.last = V.h("this.tbody")
      table.appendChild(this.tbody)
    }

    const items = list.map(d => {
      const time = moment(d[this.field]).from(data.now)
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
      const td2 = V.h("td", time)

      return V.h("tr", [td1, td2])
    })

    const tbodyNew = V.h("this.tbody", items)
    this.tbody = V.patch(this.tbody, V.diff(this.tbody.last, tbodyNew))
    this.tbody.last = tbodyNew
  }
}
