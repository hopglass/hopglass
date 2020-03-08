export default class Sidebar {
  constructor(el) {
    this.sidebar = document.createElement("div")
    this.sidebar.classList.add("sidebar")
    el.appendChild(this.sidebar)

    const button = document.createElement("button")
    this.sidebar.appendChild(button)

    button.classList.add("sidebarhandle")
    button.onclick = () => {
      this.sidebar.classList.toggle("hidden")
    }

    this.container = document.createElement("div")
    this.container.classList.add("container")
    this.sidebar.appendChild(this.container)
  }

  getWidth() {
    if (this.sidebar.classList.contains("hidden"))
        return 0

    const small = window.matchMedia("(max-width: 630pt)")
    return small.matches ? 0 : this.sidebar.offsetWidth
  }

  add(d) {
    d.render(this.sidebar)
  }

  ensureVisible() {
    this.sidebar.classList.remove("hidden")
  }

  hide() {
    this.sidebar.classList.add("hidden")
  }

  reveal() {
    this.sidebar.classList.remove("hidden")
  }
}
