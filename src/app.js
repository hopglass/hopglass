import Router from "./router.js"
import GUI from "./gui.js"
import { getJSON, limit, sortByKey, online, offline } from "./helper.js"
import moment from "moment"
import L from "leaflet"
import numeral from "numeral"
import numeralde from "numeral/languages/de.js"

class App {
  constructor(config) {
    numeral.language("de", numeralde)
    moment.locale("de")

    this.config = config
    const router = new Router()
    const urls = []

    if (typeof this.config.dataPath === "string" || this.config.dataPath instanceof String)
      this.config.dataPath = [this.config.dataPath]

    for (const path of this.config.dataPath) {
      urls.push(path + "nodes.json")
      urls.push(path + "graph.json")
    }

    const update = () => Promise.all(urls.map(getJSON)).then(this.handleData.bind(this))

    update()
      .then(d => {
        const gui = new GUI(this.config, router)
        gui.setData(d)
        router.setData(d)
        router.start()

        window.setInterval(() => {
          update().then(d => {
            gui.setData(d)
            router.setData(d)
          })
        }, 60000)
      })
      .catch(e => {
        document.body.textContent = e
        console.log(e)
      })
  }

  handleData(data) {
    const dataNodes = {}
    dataNodes.nodes = []
    dataNodes.nodeIds = []
    const dataGraph = {}
    dataGraph.batadv = {}
    dataGraph.batadv.nodes = []
    dataGraph.batadv.links = []

    const rearrangeLinks = (d) => {
      d.source += dataGraph.batadv.nodes.length
      d.target += dataGraph.batadv.nodes.length
    }

    const fillData = (node) => {
      const position = dataNodes.nodeIds.indexOf(node.nodeinfo.node_id)
      if(position === -1){
        dataNodes.nodes.push(node)
        dataNodes.nodeIds.push(node.nodeinfo.node_id)
      }
      else
        if(node.flags.online === true)
          dataNodes.nodes[position] = node
    }

    for (let i = 0; i < data.length; ++i) {
      let vererr
      if(i % 2)
        if (data[i].version !== 1) {
          vererr = "Unsupported graph version: " + data[i].version
          console.log(vererr) //silent fail
        } else {
          data[i].batadv.links.forEach(rearrangeLinks)
          dataGraph.batadv.nodes = dataGraph.batadv.nodes.concat(data[i].batadv.nodes)
          dataGraph.batadv.links = dataGraph.batadv.links.concat(data[i].batadv.links)
          dataGraph.timestamp = data[i].timestamp
        }
      else
        if (data[i].version !== 2) {
          vererr = "Unsupported nodes version: " + data[i].version
          console.log(vererr) //silent fail
        } else {
          data[i].nodes.forEach(fillData)
          dataNodes.timestamp = data[i].timestamp
        }
    }

    const nodes = dataNodes.nodes.filter(d => {
      return "firstseen" in d && "lastseen" in d
    })

    nodes.forEach(node => {
      node.firstseen = moment.utc(node.firstseen).local()
      node.lastseen = moment.utc(node.lastseen).local()
    })

    const now = moment()
    const age = moment(now).subtract(this.config.maxAge, "days")

    const newnodes = limit("firstseen", age, sortByKey("firstseen", nodes).filter(online))
    const lostnodes = limit("lastseen", age, sortByKey("lastseen", nodes).filter(offline))

    const graphnodes = {}

    dataNodes.nodes.forEach(d => {
      graphnodes[d.nodeinfo.node_id] = d
    })

    const graph = dataGraph.batadv

    graph.nodes.forEach(d => {
      if (d.node_id in graphnodes) {
        d.node = graphnodes[d.node_id]
        if (d.unseen) {
          d.node.flags.online = true
          d.node.flags.unseen = true
        }
      }
    })

    graph.links.forEach(d => {
      d.source = graph.nodes[d.source]

      if (graph.nodes[d.target].node)
        d.target = graph.nodes[d.target]
      else
        d.target = undefined
    })

    const links = graph.links.filter(d => {
      return d.target !== undefined
    })

    links.forEach(d => {
      const unknown = (d.source.node === undefined)
      let ids
      if (unknown)
        ids = [d.source.id.replace(/:/g, ""), d.target.node.nodeinfo.node_id]
      else
        ids = [d.source.node.nodeinfo.node_id, d.target.node.nodeinfo.node_id]
      d.id = ids.join("-")

      if (unknown ||
          !d.source.node.nodeinfo.location ||
          !d.target.node.nodeinfo.location ||
          isNaN(d.source.node.nodeinfo.location.latitude) ||
          isNaN(d.source.node.nodeinfo.location.longitude) ||
          isNaN(d.target.node.nodeinfo.location.latitude) ||
          isNaN(d.target.node.nodeinfo.location.longitude))
        return

      d.latlngs = []
      d.latlngs.push(L.latLng(d.source.node.nodeinfo.location.latitude, d.source.node.nodeinfo.location.longitude))
      d.latlngs.push(L.latLng(d.target.node.nodeinfo.location.latitude, d.target.node.nodeinfo.location.longitude))

      d.distance = d.latlngs[0].distanceTo(d.latlngs[1])
    })

    nodes.forEach(d => {
      d.neighbours = []
      if (d.statistics) {
        /*eslint camelcase:0*/
        if ("gateway" in d.statistics && d.statistics.gateway in graphnodes)
          d.statistics.gateway = {"node": graphnodes[d.statistics.gateway], "id": d.statistics.gateway}
        if ("nexthop" in d.statistics && d.statistics.nexthop in graphnodes)
          d.statistics.nexthop = {"node": graphnodes[d.statistics.nexthop], "id": d.statistics.nexthop}
        if ("gateway_nexthop" in d.statistics && d.statistics.gateway_nexthop in graphnodes)
          d.statistics.gateway_nexthop = {"node": graphnodes[d.statistics.gateway_nexthop], "id": d.statistics.gateway_nexthop}
      }
    })

    links.forEach(d => {
      if (d.type === "tunnel" || d.vpn) {
        d.type = "VPN"
        d.isVPN = true
      } else if (d.type === "fastd") {
        d.type = "fastd"
        d.isVPN = true
      } else if (d.type === "l2tp") {
        d.type = "L2TP"
        d.isVPN = true
      } else if (d.type === "gre") {
        d.type = "GRE"
        d.isVPN = true
      } else if (d.type === "wireless") {
        d.type = "Wifi"
        d.isVPN = false
      } else if (d.type === "other") {
        d.type = "Kabel"
        d.isVPN = false
      } else {
        d.type = "N/A"
        d.isVPN = false
      }

      if (d.isVPN && d.target.node)
        d.target.node.flags.uplink = true

      const unknown = (d.source.node === undefined)
      if (unknown) {
        d.target.node.neighbours.push({ id: d.source.id, link: d, incoming: true })
        return
      }
      d.source.node.neighbours.push({ node: d.target.node, link: d, incoming: false })
      d.target.node.neighbours.push({ node: d.source.node, link: d, incoming: true })
      if (!d.isVPN)
        d.source.node.meshlinks = d.source.node.meshlinks ? d.source.node.meshlinks + 1 : 1
    })

    links.sort((a, b) => b.tq - a.tq)

    return {
      now: now,
      timestamp: moment.utc(dataNodes.timestamp).local(),
      nodes: {
        all: nodes,
        new: newnodes,
        lost: lostnodes
      },
      graph: {
        links: links,
        nodes: graph.nodes
      }
    }
  }
}

getJSON("config.json").then(config => new App(config))
