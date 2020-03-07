export default class Title {
  constructor(config) {
    this.config = config
  }

  setTitle(d) {
    const title = [this.config.siteName]

    if (d !== undefined)
      title.push(d)

    document.title = title.join(": ")
  }

  resetView() {
    this.setTitle()
  }

  gotoNode(d) {
    if (d)
      this.setTitle(d.nodeinfo.hostname)
  }

  gotoLink(d) {
    if (d)
      this.setTitle((d.source.node ? d.source.node.nodeinfo.hostname : d.source.id) + " – " + d.target.node.nodeinfo.hostname)
  }

  gotoLocation() {
    //ignore
  }

  destroy() {
    //ignore
  }
}
