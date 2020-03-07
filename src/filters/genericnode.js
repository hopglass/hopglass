import { html, render } from "lit-html"
import { classMap } from "lit-html/directives/class-map.js"

export default class Filter {
  constructor(name, key, value, f) {
    this.name = name
    this.key = key
    this.value = value
    this.f = f

    this.negate = false
    this.div = document.createElement("div")
    this.draw()
  }

  clicked() {
    this.negate = !this.negate

    this.draw()

    if (this.refresh)
      this.refresh()
  }

  run(d) {
    let o = dictGet(d, this.key.slice(0))

    if (this.f)
      o = this.f(o)

    return o === this.value ? !this.negate : this.negate
  }

  setRefresh(f) {
    this.refresh = f
  }

  draw() {
    render(html`
      <label @click=${this.clicked} class=${classMap({not: this.negate})}>
        ${this.name}
        <strong>
          ${this.negate ? "¬" : ""} ${value}
        </strong>
      </label>
    `, this.div)
  }
}
