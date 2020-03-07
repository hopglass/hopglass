import NodeFilter from "./filters/nodefilter.js"

export default class DataDistributor {
  constructor() {
    this.targets = []
    this.filterObservers = []
    this.filters = []
  }

  remove(d) {
    this.targets = targets.filter(e => d !== e)
  }

  add(d) {
    this.targets.push(d)

    if (this.filteredData !== undefined)
      d.setData(this.filteredData)
  }

  setData(d) {
    this.data = d
    this.refresh()
  }

  refresh() {
    if (this.data === undefined)
      return

    const filter = this.filters.reduce((a, f) => {
      return d => a(d) && f.run(d)
    }, () => true)

    const nodeFilter = new NodeFilter(filter)
    this.filteredData = nodeFilter.run(this.data)

    this.targets.forEach(t => {
      t.setData(this.filteredData)
    })
  }

  _notifyObservers() {
    this.filterObservers.forEach(d => {
      d.filtersChanged(filters)
    })
  }

  addFilter(d) {
    this.filters.push(d)
    this._notifyObservers()
    d.setRefresh(this.refresh)
    this.refresh()
  }

  removeFilter(d) {
    this.filters = this.filters.filter(e => d !== e)
    this._notifyObservers()
    this.refresh()
  }

  watchFilters(d) {
    this.filterObservers.push(d)

    d.filtersChanged(this.filters)

    return () => {
      this.filterObservers = this.filterObservers.filter(e => d !== e)
    }
  }
}
