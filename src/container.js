export default class Container {
  constructor(tag) {
    if (!tag)
      tag = "div"

    this.container = document.createElement(tag)
  }
  add(d) {
    d.render(this.container)
  }

  render(el) {
    el.appendChild(this.container)
  }
}
