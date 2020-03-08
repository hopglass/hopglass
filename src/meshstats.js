import { sum, one, online } from "./helper.js"

export default class Meshstats {
  constructor(config) {
    this.config = config
  }

  setData(d) {
    const totalNodes = sum(d.nodes.all.map(one))
    const totalOnlineNodes = sum(d.nodes.all.filter(online).map(one))
    const totalOfflineNodes = sum(d.nodes.all.filter(node => !node.flags.online).map(one))
    const totalNewNodes = sum(d.nodes.new.map(one))
    const totalLostNodes = sum(d.nodes.lost.map(one))
    const totalClients = sum(d.nodes.all.filter(online).map( function (d) {
      return d.statistics.clients ? d.statistics.clients.total : 0
    }))
    const totalGateways = sum(Array.from(new Set(d.nodes.all.filter(online).map( function(d) {
      return ("gateway" in d.statistics && d.statistics.gateway.id) ? d.statistics.gateway.id : d.statistics.gateway
    }).concat(d.nodes.all.filter( function (d) {
      return d.flags.gateway
    })))).map(function(d) {
      return (typeof d === "string") ? 1 : 0
    }))

    const nodetext = [{ count: totalOnlineNodes, label: "online" },
                    { count: totalOfflineNodes, label: "offline" },
                    { count: totalNewNodes, label: "neu" },
                    { count: totalLostNodes, label: "verschwunden" }
                   ].filter( function (d) { return d.count > 0 } )
                    .map( function (d) { return [d.count, d.label].join(" ") } )
                    .join(", ")

    this.stats.textContent = totalNodes + " Knoten " +
                        "(" + nodetext + "), " +
                        totalClients + " Client" + ( totalClients === 1 ? ", " : "s, " ) +
                        totalGateways + " Gateways"

    this.timestamp.textContent = "Diese Daten sind von " + d.timestamp.format("LLLL") + "."
  }

  render(el) {
    const h2 = document.createElement("h2")
    h2.textContent = this.config.siteName
    el.appendChild(h2)

    const p = document.createElement("p")
    el.appendChild(p)
    this.stats = document.createTextNode("")
    p.appendChild(this.stats)
    p.appendChild(document.createElement("br"))
    this.timestamp = document.createTextNode("")
    p.appendChild(this.timestamp)
  }
}
