import d3 from "d3"
import { sum, localStorageTest, getClientColor } from "./helper.js"

const MARGIN = 200
const NODE_RADIUS = 15
const LINE_RADIUS = 7
const LINK_DISTANCE = 70

export default class ForceGraph {
  constructor(config, linkScale, sidebar, router) {
    this.linkScale = linkScale
    this.sidebar = sidebar
    this.router = router

    this.doAnimation = false
    this.intNodes = []
    this.intLinks = []
    this.highlightedNodes = []
    this.highlightedLinks = []
    this.nodes = []
    this.uplinkNodes = []
    this.nonUplinkNodes = []
    this.unseenNodes = []
    this.unknownNodes = []

    this.draggableNode = d3.behavior.drag()
                        .on("dragstart", this.dragstart.bind(this))
                        .on("drag", this.dragmove.bind(this))
                        .on("dragend", this.dragend.bind(this))

    this.el = document.createElement("div")
    this.el.classList.add("graph")

    this.zoomBehavior = d3.behavior.zoom()
                     .scaleExtent([1 / 3, 3])
                     .on("zoom", this.onPanZoom.bind(this))
                     .translate([this.sidebar.getWidth(), 0])

    this.canvas = d3.select(this.el)
               .attr("tabindex", 1)
               .on("keypress", this.keyboardZoom.bind(this))
               .call(this.zoomBehavior)
               .append("canvas")
               .on("click", this.onClick.bind(this))
               .call(this.draggableNode)
               .node()

    this.ctx = this.canvas.getContext("2d")

    this.force = d3.layout.force()
              .charge(-250)
              .gravity(0.1)
              .linkDistance(d => d.o.isVPN ? 0 : LINK_DISTANCE)
              .linkStrength(d => d.o.isVPN ? 0 : Math.max(0.5, 1 / d.o.tq))
              .on("tick", this.redraw.bind(this))
              .on("end", this.savePositions.bind(this))

    window.addEventListener("resize", this.resizeCanvas)

    this.panzoom()
  }

  graphDiameter(nodes) {
    return Math.sqrt(nodes.length / Math.PI) * LINK_DISTANCE * 1.41
  }

  savePositions() {
    if (!localStorageTest())
      return

    const save = this.intNodes.map(d => {
      return { id: d.o.id, x: d.x, y: d.y }
    })
    localStorage.setItem("graph/nodeposition", JSON.stringify(save))
  }

  nodeName(d) {
    if (d.o.node && d.o.node.nodeinfo)
      return d.o.node.nodeinfo.hostname
    else
      return d.o.id
  }

  dragstart() {
    const e = this.translateXY(d3.mouse(this.el))

    const nodes = this.intNodes.filter((d) => this.distancePoint(e, d) < NODE_RADIUS)

    if (nodes.length === 0)
      return

    this.draggedNode = nodes[0]
    d3.event.sourceEvent.stopPropagation()
    d3.event.sourceEvent.preventDefault()
    this.draggedNode.fixed |= 2

    this.draggedNode.px = this.draggedNode.x
    this.draggedNode.py = this.draggedNode.y
  }

  dragmove() {
    if (this.draggedNode) {
      const e = this.translateXY(d3.mouse(this.el))

      this.draggedNode.px = e.x
      this.draggedNode.py = e.y
      this.force.resume()
    }
  }

  dragend() {
    if (this.draggedNode) {
      d3.event.sourceEvent.stopPropagation()
      d3.event.sourceEvent.preventDefault()
      this.draggedNode.fixed &= ~2
      this.draggedNode = undefined
    }
  }

  animatePanzoom(translate, scale) {
    const translateP = this.zoomBehavior.translate()
    const scaleP = this.zoomBehavior.scale()

    if (!this.doAnimation) {
      this.zoomBehavior.translate(translate)
      this.zoomBehavior.scale(scale)
      this.panzoom()
    } else {
      const start = {x: translateP[0], y: translateP[1], scale: scaleP}
      const end = {x: translate[0], y: translate[1], scale: scale}

      const interpolate = d3.interpolateObject(start, end)
      const duration = 500

      const ease = d3.ease("cubic-in-out")

      d3.timer(t => {
        if (t >= duration)
          return true

        const v = interpolate(ease(t / duration))
        this.zoomBehavior.translate([v.x, v.y])
        this.zoomBehavior.scale(v.scale)
        this.panzoom()

        return false
      })
    }
  }

  onPanZoom() {
    this.savedPanZoom = {
      translate: this.zoomBehavior.translate(),
      scale: this.zoomBehavior.scale()
    }
    this.panzoom()
  }

  panzoom() {
    const translate = this.zoomBehavior.translate()
    const scale = this.zoomBehavior.scale()

    this.panzoomReal(translate, scale)
  }

  panzoomReal(translate, scale) {
    this.screenRect = {
      left: -translate[0] / scale, top: -translate[1] / scale,
      right: (this.canvas.width - translate[0]) / scale,
      bottom: (this.canvas.height - translate[1]) / scale
    }

    requestAnimationFrame(this.redraw.bind(this))
  }

  getSize() {
    const sidebarWidth = this.sidebar.getWidth()
    const width = this.el.offsetWidth - sidebarWidth
    const height = this.el.offsetHeight

    return [width, height]
  }

  panzoomTo(a, b) {
    const sidebarWidth = this.sidebar.getWidth()
    const size = this.getSize()

    const targetWidth = Math.max(1, b[0] - a[0])
    const targetHeight = Math.max(1, b[1] - a[1])

    const scaleX = size[0] / targetWidth
    const scaleY = size[1] / targetHeight
    const scaleMax = this.zoomBehavior.scaleExtent()[1]
    const scale = 0.5 * Math.min(scaleMax, Math.min(scaleX, scaleY))

    const centroid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const x = -centroid[0] * scale + size[0] / 2
    const y = -centroid[1] * scale + size[1] / 2
    const translate = [x + sidebarWidth, y]

    this.animatePanzoom(translate, scale)
  }

  updateHighlight(nopanzoom) {
    this.highlightedNodes = []
    this.highlightedLinks = []

    if (this.highlight !== undefined)
      if (this.highlight.type === "node") {
        const n = this.nodesDict[this.highlight.o.nodeinfo.node_id]

        if (n) {
          this.highlightedNodes = [n]

          if (!nopanzoom)
            this.panzoomTo([n.x, n.y], [n.x, n.y])
        }

        return
      } else if (this.highlight.type === "link") {
        const l = this.linksDict[this.highlight.o.id]

        if (l) {
          this.highlightedLinks = [l]

          if (!nopanzoom) {
            const x = d3.extent([l.source, l.target], (d) => d.x)
            const y = d3.extent([l.source, l.target], (d) => d.y)
            this.panzoomTo([x[0], y[0]], [x[1], y[1]])
          }
        }

        return
      }

    if (!nopanzoom)
      if (!this.savedPanZoom)
        this.panzoomTo([0, 0], this.force.size())
      else
        this.animatePanzoom(this.savedPanZoom.translate, this.savedPanZoom.scale)
  }

  drawLabel(d) {
    const neighbours = d.neighbours.filter(d => !d.link.o.isVPN)

    const sum = neighbours.reduce((a, b) => [a[0] + b.node.x, a[1] + b.node.y], [0, 0])

    const sumCos = sum[0] - d.x * neighbours.length
    const sumSin = sum[1] - d.y * neighbours.length

    let angle = Math.PI / 2

    if (neighbours.length > 0)
      angle = Math.PI + Math.atan2(sumSin, sumCos)

    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const width = d.labelWidth
    const height = d.labelHeight

    const x = d.x + d.labelA * Math.pow(Math.abs(cos), 2 / 5) * Math.sign(cos) - width / 2
    const y = d.y + d.labelB * Math.pow(Math.abs(sin), 2 / 5) * Math.sign(sin) - height / 2

    this.ctx.drawImage(d.label, x, y, width, height)
  }

  visibleLinks(d) {
    return (d.o.isVPN ||
            d.source.x > this.screenRect.left && d.source.x < this.screenRect.right &&
            d.source.y > this.screenRect.top && d.source.y < this.screenRect.bottom) ||
           (d.target.x > this.screenRect.left && d.target.x < this.screenRect.right &&
            d.target.y > this.screenRect.top && d.target.y < this.screenRect.bottom)
  }

  visibleNodes(d) {
    return d.x + MARGIN > this.screenRect.left && d.x - MARGIN < this.screenRect.right &&
           d.y + MARGIN > this.screenRect.top && d.y - MARGIN < this.screenRect.bottom
  }

  drawNode(color, radius, scale, r) {
    const node = document.createElement("canvas")
    node.width = scale * radius * 8 * r
    node.height = node.width

    const nctx = node.getContext("2d")
    nctx.scale(scale * r, scale * r)
    nctx.save()

    nctx.translate(-node.width / scale, -node.height / scale)
    nctx.lineWidth = radius

    nctx.beginPath()
    nctx.moveTo(radius, 0)
    nctx.arc(0, 0, radius, 0, 2 * Math.PI)

    nctx.strokeStyle = "rgba(255, 0, 0, 1)"
    nctx.shadowOffsetX = node.width * 1.5 + 0
    nctx.shadowOffsetY = node.height * 1.5 + 3
    nctx.shadowBlur = 12
    nctx.shadowColor = "rgba(0, 0, 0, 0.16)"
    nctx.stroke()
    nctx.shadowOffsetX = node.width * 1.5 + 0
    nctx.shadowOffsetY = node.height * 1.5 + 3
    nctx.shadowBlur = 12
    nctx.shadowColor = "rgba(0, 0, 0, 0.23)"
    nctx.stroke()

    nctx.restore()
    nctx.translate(node.width / 2 / scale / r, node.height / 2 / scale / r)

    nctx.beginPath()
    nctx.moveTo(radius, 0)
    nctx.arc(0, 0, radius, 0, 2 * Math.PI)

    nctx.strokeStyle = color
    nctx.lineWidth = radius
    nctx.stroke()

    return node
  }

  redraw() {
    const r = window.devicePixelRatio
    const translate = this.zoomBehavior.translate()
    const scale = this.zoomBehavior.scale()
    const links = this.intLinks.filter(this.visibleLinks.bind(this))

    this.ctx.save()
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.restore()

    this.ctx.save()
    this.ctx.translate(translate[0], translate[1])
    this.ctx.scale(scale, scale)

    const unknownColor = "#D10E2A"
    const nonUplinkColor = "#F2E3C6"
    const uplinkColor = "#5BAAEB"
    const unseenColor = "#FFA726"
    const highlightColor = "rgba(252, 227, 198, 0.15)"
    const nodeRadius = 6
    const cableColor = "#50B0F0"

    // -- draw links --
    this.ctx.save()
    links.forEach(d => {
      let dx = d.target.x - d.source.x
      let dy = d.target.y - d.source.y
      const a = Math.sqrt(dx * dx + dy * dy) * 2
      dx /= a
      dy /= a

      const distancex = d.target.x - d.source.x - (10 * dx)
      const distancey = d.target.y - d.source.y - (10 * dy)

      this.ctx.beginPath()
      this.ctx.moveTo(d.source.x + dx * nodeRadius, d.source.y + dy * nodeRadius)
      this.ctx.lineTo(d.target.x - (distancex / 2) - dx * nodeRadius, d.target.y - (distancey / 2) - dy * nodeRadius)
      this.ctx.strokeStyle = d.o.type === "Kabel" ? cableColor : d.color
      this.ctx.globalAlpha = d.o.isVPN ? 0.1 : 0.8
      this.ctx.lineWidth = d.o.isVPN ? 1.5 : 2.5
      this.ctx.stroke()
    })

    this.ctx.restore()

    // -- draw unknown nodes --
    this.ctx.beginPath()
    this.unknownNodes.filter(this.visibleNodes.bind(this)).forEach(d => {
      this.ctx.moveTo(d.x + nodeRadius, d.y)
      this.ctx.arc(d.x, d.y, nodeRadius, 0, 2 * Math.PI)
    })

    this.ctx.strokeStyle = unknownColor
    this.ctx.lineWidth = nodeRadius

    this.ctx.stroke()


    // -- draw nodes --
    this.ctx.save()
    this.ctx.scale(1 / scale / r, 1 / scale / r)

    const nonUplinkNode = this.drawNode(nonUplinkColor, nodeRadius, scale, r)
    this.nonUplinkNodes.filter(this.visibleNodes.bind(this)).forEach(d => {
      this.ctx.drawImage(nonUplinkNode, scale * r * d.x - nonUplinkNode.width / 2, scale * r * d.y - nonUplinkNode.height / 2)
    })

    const uplinkNode = this.drawNode(uplinkColor, nodeRadius, scale, r)
    this.uplinkNodes.filter(this.visibleNodes.bind(this)).forEach(d => {
      this.ctx.drawImage(uplinkNode, scale * r * d.x - uplinkNode.width / 2, scale * r * d.y - uplinkNode.height / 2)
    })

    const unseenNode = this.drawNode(unseenColor, nodeRadius, scale, r)
    this.unseenNodes.filter(this.visibleNodes.bind(this)).forEach(d => {
      this.ctx.drawImage(unseenNode, scale * r * d.x - unseenNode.width / 2, scale * r * d.y - unseenNode.height / 2)
    })

    this.ctx.restore()

    // -- draw clients --
    this.ctx.save()
    this.ctx.beginPath()
    if (scale > 0.9)
      this.nodes.filter(this.visibleNodes.bind(this)).forEach(d => {
        const clients = d.o.node.statistics.clients.total

        if (clients === 0)
          return

        const startDistance = 16
        const radius = 3
        const a = 1.2
        const startAngle = Math.PI

        for (let orbit = 0, i = 0; i < clients; orbit++) {
          const distance = startDistance + orbit * 2 * radius * a
          const n = Math.floor((Math.PI * distance) / (a * radius))
          const delta = clients - i

          for (let j = 0; j < Math.min(delta, n); i++, j++) {
            const angle = 2 * Math.PI / n * j
            const x = d.x + distance * Math.cos(angle + startAngle)
            const y = d.y + distance * Math.sin(angle + startAngle)

            this.ctx.beginPath()
            this.ctx.moveTo(x, y)
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI)
            this.ctx.fillStyle = getClientColor(d.o.node.statistics, i)
            this.ctx.fill()
          }
        }
      })

    this.ctx.restore()

    // -- draw node highlights --
    if (this.highlightedNodes.length) {
      this.ctx.save()
      this.ctx.shadowColor = "rgba(255, 255, 255, 1.0)"
      this.ctx.shadowBlur = 10 * nodeRadius
      this.ctx.shadowOffsetX = 0
      this.ctx.shadowOffsetY = 0
      this.ctx.globalCompositeOperation = "lighten"
      this.ctx.fillStyle = highlightColor

      this.ctx.beginPath()
      this.highlightedNodes.forEach(d => {
        this.ctx.moveTo(d.x + 5 * nodeRadius, d.y)
        this.ctx.arc(d.x, d.y, 5 * nodeRadius, 0, 2 * Math.PI)
      })
      this.ctx.fill()

      this.ctx.restore()
    }

    // -- draw link highlights --
    if (this.highlightedLinks.length) {
      this.ctx.save()
      this.ctx.lineWidth = 2 * 5 * nodeRadius
      this.ctx.shadowColor = "rgba(255, 255, 255, 1.0)"
      this.ctx.shadowBlur = 10 * nodeRadius
      this.ctx.shadowOffsetX = 0
      this.ctx.shadowOffsetY = 0
      this.ctx.globalCompositeOperation = "lighten"
      this.ctx.strokeStyle = highlightColor
      this.ctx.lineCap = "round"

      this.ctx.beginPath()
      this.highlightedLinks.forEach(d => {
        this.ctx.moveTo(d.source.x, d.source.y)
        this.ctx.lineTo(d.target.x, d.target.y)
      })
      this.ctx.stroke()

      this.ctx.restore()
    }

    // -- draw labels --
    if (scale > 0.9)
      this.intNodes.filter(this.visibleNodes.bind(this)).forEach(this.drawLabel.bind(this))

    this.ctx.restore()
  }

  resizeCanvas() {
    const r = window.devicePixelRatio
    this.canvas.width = this.el.offsetWidth * r
    this.canvas.height = this.el.offsetHeight * r
    this.canvas.style.width = this.el.offsetWidth + "px"
    this.canvas.style.height = this.el.offsetHeight + "px"
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.scale(r, r)
    requestAnimationFrame(this.redraw.bind(this))
  }

  distance(ax, ay, bx, by) {
    return Math.pow(ax - bx, 2) + Math.pow(ay - by, 2)
  }

  distancePoint(a, b) {
    return Math.sqrt(this.distance(a.x, a.y, b.x, b.y))
  }

  distanceLink(p, a, b) {
    /* http://stackoverflow.com/questions/849211 */

    const bx = b.x - ((b.x - a.x) / 2)
    const by = b.y - ((b.y - a.y) / 2)

    const l2 = this.distance(a.x, a.y, bx, by)

    if (l2 === 0)
      return this.distance(p.x, p.y, a.x, a.y)

    const t = ((p.x - a.x) * (bx - a.x) + (p.y - a.y) * (by - a.y)) / l2

    if (t < 0)
      return this.distance(p.x, p.y, a.x, a.y)

    if (t > 1)
      return this.distance(p.x, p.y, bx, by)

    return Math.sqrt(this.distance(p.x, p.y, a.x + t * (bx - a.x), a.y + t * (by - a.y) ))
  }

  translateXY(d) {
    const translate = this.zoomBehavior.translate()
    const scale = this.zoomBehavior.scale()

    return {
      x: (d[0] - translate[0]) / scale,
      y: (d[1] - translate[1]) / scale
    }
  }

  onClick() {
    if (d3.event.defaultPrevented)
      return

    const e = this.translateXY(d3.mouse(this.el))

    const nodes = this.intNodes.filter(d => this.distancePoint(e, d) < NODE_RADIUS)

    if (nodes.length > 0) {
      this.router.node(nodes[0].o.node)()
      return
    }

    const links = this.intLinks
      .filter(d => !d.o.isVPN)
      .filter(d => this.distanceLink(e, d.source, d.target) < LINE_RADIUS)

    if (links.length > 0) {
      this.router.link(links[0].o)()
      return
    }
  }

  zoom(scale) {
    const size = this.getSize()
    const newSize = [size[0] / scale, size[1] / scale]

    const sidebarWidth = this.sidebar.getWidth()
    const delta = [size[0] - newSize[0], size[1] - newSize[1]]
    const translate = this.zoomBehavior.translate()
    const translateNew = [sidebarWidth + (translate[0] - sidebarWidth - delta[0] / 2) * scale, (translate[1] - delta[1] / 2) * scale]

    this.animatePanzoom(translateNew, this.zoomBehavior.scale() * scale)
  }

  keyboardZoom() {
    const e = d3.event

    if (e.altKey || e.ctrlKey || e.metaKey)
      return

    if (e.keyCode === 43)
      this.zoom(1.41)

    if (e.keyCode === 45)
      this.zoom(1 / 1.41)
  }

  setData(data) {
    const oldNodes = {}
    this.intNodes.forEach(d => oldNodes[d.o.id] = d)

    this.intNodes = data.graph.nodes.map(d => {
      const e = d.id in oldNodes ? oldNodes[d.id] : {}
      e.o = d
      return e
    })

    const newNodesDict = {}
    this.intNodes.forEach(d => newNodesDict[d.o.id] = d)

    const oldLinks = {}
    this.intLinks.forEach(d => oldLinks[d.o.id] = d)

    this.intLinks = data.graph.links.map(d => {
      const e = d.id in oldLinks ? oldLinks[d.id] : {}

      e.o = d
      e.source = newNodesDict[d.source.id]
      e.target = newNodesDict[d.target.id]

      if (d.isVPN)
        e.color = "rgba(255, 255, 255, " + (0.6 / d.tq) + ")"
      else
        e.color = this.linkScale(d.tq).hex()

      return e
    })

    this.linksDict = {}
    this.nodesDict = {}

    this.intNodes.forEach(d => {
      d.neighbours = {}

      if (d.o.node)
        this.nodesDict[d.o.node.nodeinfo.node_id] = d

      const name = this.nodeName(d)

      const offset = 5
      const lineWidth = 3
      const buffer = document.createElement("canvas")
      const r = window.devicePixelRatio
      const bctx = buffer.getContext("2d")
      bctx.font = "11px Roboto"
      const width = bctx.measureText(name).width
      const scale = this.zoomBehavior.scaleExtent()[1] * r
      buffer.width = (width + 2 * lineWidth) * scale
      buffer.height = (16 + 2 * lineWidth) * scale
      bctx.scale(scale, scale)
      bctx.textBaseline = "middle"
      bctx.textAlign = "center"
      bctx.fillStyle = "rgba(242, 227, 198, 1.0)"
      bctx.shadowColor = "rgba(0, 0, 0, 1)"
      bctx.shadowBlur = 5
      bctx.fillText(name, buffer.width / (2 * scale), buffer.height / (2 * scale))

      d.label = buffer
      d.labelWidth = buffer.width / scale
      d.labelHeight = buffer.height / scale
      d.labelA = offset + buffer.width / (2 * scale)
      d.labelB = offset + buffer.height / (2 * scale)
    })

    this.intLinks.forEach(d => {
      d.source.neighbours[d.target.o.id] = {node: d.target, link: d}
      d.target.neighbours[d.source.o.id] = {node: d.source, link: d}

      if (d.o.source && d.o.target)
        this.linksDict[d.o.id] = d
    })

    this.intLinks.forEach(d => {
      if (this.linksDict[d.target.o.node_id + "-" + d.source.o.node_id])
        return

      const obj = {
        source: d.target,
        target: d.source,
        o: {
          isVPN: d.o.isVPN,
          type: "dead",
          id: d.target.o.node_id + "-" + d.source.o.node_id,
          tq: 1
        },
        color: "rgba(255, 255, 255, 0.6)"
      }
      this.intLinks.push(obj)
      this.linksDict[d.target.o.node_id + "-" + d.source.o.node_id] = obj
    })

    this.intNodes.forEach(d => d.neighbours = Object.keys(d.neighbours).map(k => d.neighbours[k]))

    this.nodes = this.intNodes.filter(d => !d.o.unseen && d.o.node)
    this.uplinkNodes = this.nodes.filter(d => d.o.node.flags.uplink)
    this.nonUplinkNodes = this.nodes.filter(d => !d.o.node.flags.uplink)
    this.unseenNodes = this.intNodes.filter(d => d.o.unseen && d.o.node)
    this.unknownNodes = this.intNodes.filter(d => !d.o.node)

    if (localStorageTest()) {
      const save = JSON.parse(localStorage.getItem("graph/nodeposition"))

      if (save) {
        const nodePositions = {}
        save.forEach(d => nodePositions[d.id] = d)

        this.intNodes.forEach(d => {
          if (nodePositions[d.o.id] && (d.x === undefined || d.y === undefined)) {
            d.x = nodePositions[d.o.id].x
            d.y = nodePositions[d.o.id].y
          }
        })
      }
    }

    const diameter = this.graphDiameter(this.intNodes)

    this.force.nodes(this.intNodes)
         .links(this.intLinks)
         .size([diameter, diameter])

    this.updateHighlight(true)

    this.force.start()
    this.resizeCanvas()
  }

  resetView() {
    this.highlight = undefined
    this.updateHighlight()
    this.doAnimation = true
  }

  gotoNode(d) {
    this.highlight = {type: "node", o: d}
    this.updateHighlight()
    this.doAnimation = true
  }

  gotoLink(d) {
    this.highlight = {type: "link", o: d}
    this.updateHighlight()
    this.doAnimation = true
  }

  destroy() {
    this.force.stop()
    this.canvas.remove()
    this.force = null

    if (this.el.parentNode)
      this.el.parentNode.removeChild(this.el)
  }

  render(d) {
    d.appendChild(this.el)
    this.resizeCanvas()
    this.updateHighlight()
  }
}
