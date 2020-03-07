export default class Legend {
  constructor() {
  }

  render(el) {
    const p = document.createElement("p")
    p.setAttribute("class", "legend")
    el.appendChild(p)

    const spanNew = document.createElement("span")
    spanNew.setAttribute("class", "legend-new")
    const symbolNew = document.createElement("span")
    symbolNew.setAttribute("class", "symbol")
    const textNew = document.createTextNode(" Neuer Knoten")
    spanNew.appendChild(symbolNew)
    spanNew.appendChild(textNew)
    p.appendChild(spanNew)

    const spanOnline = document.createElement("span")
    spanOnline.setAttribute("class", "legend-online")
    const symbolOnline = document.createElement("span")
    symbolOnline.setAttribute("class", "symbol")
    const textOnline = document.createTextNode(" Knoten ist online")
    spanOnline.appendChild(symbolOnline)
    spanOnline.appendChild(textOnline)
    p.appendChild(spanOnline)

    const spanOffline = document.createElement("span")
    spanOffline.setAttribute("class", "legend-offline")
    const symbolOffline = document.createElement("span")
    symbolOffline.setAttribute("class", "symbol")
    const textOffline = document.createTextNode(" Knoten ist offline")
    spanOffline.appendChild(symbolOffline)
    spanOffline.appendChild(textOffline)
    p.appendChild(spanOffline)
  }
}

