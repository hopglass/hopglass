export default class NodeFilter {
  constructor(filter) {
    this.filter = filter
  }
  run(data) {
    const n = Object.create(data)
    n.nodes = {}

    for (const key in data.nodes)
      n.nodes[key] = data.nodes[key].filter(this.filter)

    const filteredIds = new Set()

    n.graph = {}
    n.graph.nodes = data.graph.nodes.filter(d => {
      const r = this.filter(d.node ? d.node : {})

      if (r)
        filteredIds.add(d.id)

      return r
    })

    n.graph.links = data.graph.links.filter(d => filteredIds.has(d.source.id) && filteredIds.has(d.target.id))

    return n
  }
}
