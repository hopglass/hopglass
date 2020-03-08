import Link from "./link"
import Node from "./node"
import Location from "./location"

export default class Infobox {
  constructor(config, sidebar, router) {
    this.config = config
    this.sidebar = sidebar
    this.router = router
  }

  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el)
      this.el = undefined
      this.sidebar.reveal()
    }
  }

  create() {
    this.destroy()
    this.sidebar.ensureVisible()
    this.sidebar.hide()

    this.el = document.createElement("div")
    this.sidebar.container.insertBefore(this.el, this.sidebar.container.firstChild)

    this.el.scrollIntoView(false)
    this.el.classList.add("infobox")
    this.el.destroy = this.destroy

    const closeButton = document.createElement("button")
    closeButton.classList.add("close")
    closeButton.onclick = this.router.reset
    this.el.appendChild(closeButton)
  }

  resetView() {
    this.destroy()
  }

  gotoNode(d) {
    this.create()
    new Node(this.config, this.el, this.router, d)
  }

  gotoLink(d) {
    this.create()
    new Link(this.config, this.el, this.router, d)
  }

  gotoLocation(d) {
    this.create()
    new Location(this.config, this.el, this.router, d)
  }
}
