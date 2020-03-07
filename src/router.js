export default class router {
  constructor() {
    this.objects = { nodes: {}, links: {} }
    this.targets = []
    this.views = {}
    this.running = false
  }

  saveState() {
    const e = []

    if (this.currentView)
      e.push("v:" + this.currentView)

    if (this.currentObject) {
      if ("node" in this.currentObject)
        e.push("n:" + encodeURIComponent(this.currentObject.node.nodeinfo.node_id))

      if ("link" in this.currentObject)
        e.push("l:" + encodeURIComponent(this.currentObject.link.id))
    }

    const s = "#!" + e.join(";")

    window.history.pushState(s, undefined, s)
  }

  resetView(push) {
    push = trueDefault(push)

    this.targets.forEach(t => t.resetView())

    if (push) {
      this.currentObject = undefined
      saveState()
    }
  }

  gotoNode(d) {
    if (!d)
      return false

    this.targets.forEach(t => t.gotoNode(d))

    return true
  }

  gotoLink(d) {
    if (!d)
      return false

    this.targets.forEach(t => t.gotoLink(d))

    return true
  }

  gotoLocation(d) {
    if (!d)
      return false

    this.targets.forEach(t => {
      if (!t.gotoLocation)
        console.warn("has no gotoLocation", t)
      t.gotoLocation(d)
    })

    return true
  }

  loadState(s) {
    if (!s)
      return false

    s = decodeURIComponent(s)

    if (!s.startsWith("#!"))
      return false

    let targetSet = false

    s.slice(2).split(";").forEach(d => {
      const args = d.split(":")

      if (args[0] === "v" && args[1] in this.views) {
        this.currentView = args[1]
        this.views[args[1]]()
      }

      let id

      if (args[0] === "n") {
        id = args[1]
        if (id in this.objects.nodes) {
          this.currentObject = { node: this.objects.nodes[id] }
          gotoNode(this.objects.nodes[id])
          targetSet = true
        }
      }

      if (args[0] === "l") {
        id = args[1]
        if (id in this.objects.links) {
          this.currentObject = { link: this.objects.links[id] }
          gotoLink(this.objects.links[id])
          targetSet = true
        }
      }
    })

    return targetSet
  }

  start() {
    this.running = true

    if (!loadState(window.location.hash))
      resetView(false)

    window.onpopstate = (d) => {
      if (!loadState(d.state))
        resetView(false)
    }
  }

  view(d) {
    if (d in this.views) {
      this.views[d]()

      if (!this.currentView || this.running)
        this.currentView = d

      if (!this.running)
        return

      saveState()

      if (!this.currentObject) {
        resetView(false)
        return
      }

      if ("node" in this.currentObject)
        gotoNode(this.currentObject.node)

      if ("link" in this.currentObject)
        gotoLink(this.currentObject.link)
    }
  }

  node(d) {
    return () => {
      if (gotoNode(d)) {
        this.currentObject = { node: d }
        saveState()
      }

      return false
    }
  }

  link(d) {
    return () => {
      if (gotoLink(d)) {
        this.currentObject = { link: d }
        saveState()
      }

      return false
    }
  }

  reset() {
    resetView()
  }

  addTarget(d) {
    this.targets.push(d)
  }

  removeTarget(d) {
    this.targets = this.targets.filter(e => d !== e)
  }

  addView(k, d) {
    this.views[k] = d
  }

  setData(data) {
    this.objects.nodes = {}
    this.objects.links = {}

    data.nodes.all.forEach(d => this.objects.nodes[d.nodeinfo.node_id] = d)
    data.graph.links.forEach(d => this.objects.links[d.id] = d)
  }
}
