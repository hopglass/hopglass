import chroma from "chroma-js"
//import Map from "./map.js"
import Sidebar from "./sidebar.js"
import Tabs from "./tabs.js"
import Container from "./container.js"
import Meshstats from "./meshstats.js"
import Legend from "./legend.js"
import Linklist from "./linklist.js"
import Nodelist from "./nodelist.js"
import SimpleNodelist from "./simplenodelist.js"
import Infobox from "./infobox/main.js"
import Proportions from "./proportions.js"
import ForceGraph from "./forcegraph.js"
import Title from "./title.js"
import About from "./about.js"
import DataDistributor from "./datadistributor.js"
import FilterGUI from "./filters/filtergui.js"

export default class GUI {
  constructor(config, router) {
    this.config = config
    this.router = router

    this.linkScale = chroma.scale(chroma.bezier(["#04C714", "#FF5500", "#F02311"])).domain([1, 5])
    this.buttons = document.createElement("div")
    this.buttons.classList.add("buttons")

    this.fanout = new DataDistributor()
    this.fanoutUnfiltered = new DataDistributor()
    this.fanoutUnfiltered.add(this.fanout)

    const loader = document.getElementsByClassName("loader")[0]
    loader.classList.add("hide")

    this.contentDiv = document.createElement("div")
    this.contentDiv.classList.add("this.content")
    document.body.appendChild(this.contentDiv)

    this.sidebar = new Sidebar(document.body)

    this.contentDiv.appendChild(this.buttons)

    const buttonToggle = document.createElement("button")
    buttonToggle.textContent = "\uF133"
    buttonToggle.onclick = function () {
      if (this.content.constructor === Map)
        this.router.view("g")
      else
        this.router.view("m")
    }

    this.buttons.appendChild(buttonToggle)

    const title = new Title(this.config)

    const header = new Container("header")
    const infobox = new Infobox(this.config, this.sidebar, this.router)
    const tabs = new Tabs()
    const overview = new Container()
    const meshstats = new Meshstats(config)
    const legend = new Legend()
    const newnodeslist = new SimpleNodelist("new", "firstseen", this.router, "Neue Knoten")
    const lostnodeslist = new SimpleNodelist("lost", "lastseen", this.router, "Verschwundene Knoten")
    const nodelist = new Nodelist(this.router)
    const linklist = new Linklist(this.linkScale, this.router)
    const statistics = new Proportions(this.config, this.fanout)
    const about = new About()

    this.fanoutUnfiltered.add(meshstats)
    this.fanoutUnfiltered.add(newnodeslist)
    this.fanoutUnfiltered.add(lostnodeslist)
    this.fanout.add(nodelist)
    this.fanout.add(linklist)
    this.fanout.add(statistics)

    this.sidebar.add(header)
    header.add(meshstats)
    header.add(legend)

    overview.add(newnodeslist)
    overview.add(lostnodeslist)

    const filterGUI = new FilterGUI(this.fanout)
    header.add(filterGUI)

    this.sidebar.add(tabs)
    tabs.add("Aktuelles", overview)
    tabs.add("Knoten", nodelist)
    tabs.add("Verbindungen", linklist)
    tabs.add("Statistiken", statistics)
    tabs.add("Über", about)

    this.router.addTarget(title)
    this.router.addTarget(infobox)

    //this.router.addView("m", this.mkView(Map))
    this.router.addView("g", this.mkView(ForceGraph))

    //this.router.view("m")
    this.router.view("g")
  }
  removeContent() {
    if (!this.content)
      return

    this.router.removeTarget(this.content)
    this.fanout.remove(this.content)

    this.content.destroy()

    this.content = null
  }

  addContent(K) {
    this.removeContent()

    this.content = new K(this.config, this.linkScale, this.sidebar, this.router, this.buttons)
    this.content.render(this.contentDiv)

    this.fanout.add(this.content)
    this.router.addTarget(this.content)
  }

  mkView(K) {
    return () => {
      this.addContent(K)
    }
  }

  setData(d) {
    this.fanoutUnfiltered.setData(d)
  }
}
