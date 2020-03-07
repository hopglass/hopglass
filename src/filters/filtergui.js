import { html, render } from "lit-html"

export default class FilterGUI {
  constructor(distributor) {
    this.div = document.createElement("div")
    this.distributor = distributor
    this.distributor.watchFilters(this)
  }

  render(el) {
    el.appendChild(this.div)
  }

  filtersChanged(filters) {
    render(html`
      ${filters.length > 0 ? html`
        <ul>
        ${filters.map(d => html`
          <li>
            ${d.render()}
            <button @click=${this.distributor.removeFilter(d)}></button>
          </li>
        `)}
        </ul>
      ` : ''}
    `, this.div)
  }
}
