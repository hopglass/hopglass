export default class Tabs {
  constructor() {
    this.tabs = document.createElement("ul")
    this.tabs.classList.add("tabs")
    this.container = document.createElement("div")
  }

  gotoTab(li) {
    for (var i = 0; i < this.tabs.children.length; i++)
      this.tabs.children[i].classList.remove("visible")

    while (this.container.firstChild)
      this.container.removeChild(this.container.firstChild)

    li.classList.add("visible")

    const tab = document.createElement("div")
    tab.classList.add("tab")
    this.container.appendChild(tab)
    li.child.render(tab)
  }

  switchTab(e) {
    this.gotoTab(e.target)

    return false
  }

  add(title, d) {
    const li = document.createElement("li")
    li.textContent = title
    li.onclick = this.switchTab.bind(this)
    li.child = d
    this.tabs.appendChild(li)

    let anyVisible = false

    for (let i = 0; i < this.tabs.children.length; i++)
      if (this.tabs.children[i].classList.contains("visible")) {
        anyVisible = true
        break
      }

    if (!anyVisible)
      this.gotoTab(li)
  }

  render(el) {
    el.appendChild(this.tabs)
    el.appendChild(this.container)
  }
}
