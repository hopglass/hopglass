import V from "virtual-dom"

export default class SortTable {
  constructor(headings, sortIndex, renderRow) {
    this.headings = headings
    this.sortIndex = sortIndex
    this.renderRow = renderRow
    this.sortReverse = false
    this.el = document.createElement("table")
    this.elLast = V.h("table")
  }

  sortTable(i) {
    this.sortReverse = i === this.sortIndex ? !this.sortReverse : false
    this.sortIndex = i

    this.updateView()
  }

  sortTableHandler(i) {
    return () => this.sortTable(i)
  }

  updateView() {
    const children = []

    if (this.data.length !== 0) {
      const th = this.headings.map((d, i) => {
        const properties = { onclick: this.sortTableHandler(i),
                           className: "sort-header"
                         }

        if (this.sortIndex === i)
          properties.className += this.sortReverse ? " sort-up" : " sort-down"

        return V.h("th", properties, d.name)
      })

      const links = this.data.slice(0).sort(this.headings[this.sortIndex].sort)

      if (this.headings[this.sortIndex].reverse ? !this.sortReverse : this.sortReverse)
        links = links.reverse()

      children.push(V.h("thead", V.h("tr", th)))
      children.push(V.h("tbody", links.map(this.renderRow)))
    }

    const elNew = V.h("table", children)
    this.el = V.patch(this.el, V.diff(elLast, elNew))
    this.elLast = elNew
  }

  setData(d) {
    this.data = d
    this.updateView()
  }
}
