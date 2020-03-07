import { getJSON } from "../helper.js"

export default class Location {
  constructor(config, el, router, d) {
    const sidebarTitle = document.createElement("h2")
    sidebarTitle.textContent = "Location: " + d.toString()
    this.el.appendChild(sidebarTitle)

    getJSON("https://nominatim.openstreetmap.org/reverse?format=json&lat=" + d.lat + "&lon=" + d.lng + "&zoom=18&addressdetails=0")
    .then(function(result) {
      if(result.display_name)
        sidebarTitle.textContent = result.display_name
    })

    const editLat = document.createElement("input")
    editLat.type = "text"
    editLat.value = d.lat.toFixed(9)
    this.el.appendChild(this.createBox("lat", "Breitengrad", editLat))

    const editLng = document.createElement("input")
    editLng.type = "text"
    editLng.value = d.lng.toFixed(9)
    this.el.appendChild(this.createBox("lng", "Längengrad", editLng))

    const editUci = document.createElement("textarea")
    editUci.value =
      "uci set gluon-node-info.@location[0]='location'; " +
      "uci set gluon-node-info.@location[0].share_location='1';" +
      "uci set gluon-node-info.@location[0].latitude='" + d.lat.toFixed(9) + "';" +
      "uci set gluon-node-info.@location[0].longitude='" + d.lng.toFixed(9) + "';" +
      "uci commit gluon-node-info"

    this.el.appendChild(this.createBox("uci", "Befehl", editUci, false))

    const linkPlain = document.createElement("a")
    linkPlain.textContent = "plain"
    linkPlain.onclick = function() {
      this.switch2plain()
      return false
    }
    linkPlain.href = "#"

    const linkUci = document.createElement("a")
    linkUci.textContent = "uci"
    linkUci.onclick = function() {
      this.switch2uci()
      return false
    }
    linkUci.href = "#"

    const hintText = document.createElement("p")
    hintText.appendChild(document.createTextNode("Du kannst zwischen "))
    hintText.appendChild(linkPlain)
    hintText.appendChild(document.createTextNode(" und "))
    hintText.appendChild(linkUci)
    hintText.appendChild(document.createTextNode(" wechseln."))
    this.el.appendChild(hintText)
  }

  createBox(name, title, inputElem, isVisible) {
    const visible = typeof isVisible !== "undefined" ?  isVisible : true
    const box = document.createElement("div")
    const heading = document.createElement("h3")
    heading.textContent = title
    box.appendChild(heading)
    const btn = document.createElement("button")
    btn.className = "ion-ios-copy"
    btn.title = "Kopieren"
    btn.onclick = function() { this.copy2clip(inputElem.id) }
    inputElem.id = "location-" + name
    inputElem.readOnly = true
    const line = document.createElement("p")
    line.appendChild(inputElem)
    line.appendChild(btn)
    box.appendChild(line)
    box.id = "box-" + name
    box.style.display = visible ? "block" : "none"
    return box
  }

  copy2clip(id) {
    const copyField = document.querySelector("#" + id)
    copyField.select()
    try {
      document.execCommand("copy")
    } catch (err) {
      console.log(err)
    }
  }

  switch2plain() {
    document.getElementById("box-uci").style.display = "none"
    document.getElementById("box-lat").style.display = "block"
    document.getElementById("box-lng").style.display = "block"
  }

  switch2uci() {
    document.getElementById("box-uci").style.display = "block"
    document.getElementById("box-lat").style.display = "none"
    document.getElementById("box-lng").style.display = "none"
  }
}
