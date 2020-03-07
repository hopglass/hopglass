import { html, render } from "lit-html"

export default class Link {
  constructor(config, el, router, d) {
    const unknown = !(d.source.node)
    render(html`
      <h2>
        ${d.source.node ? html`
          <a href="#" @click=${router.node(d.source.node)}>
            ${d.source.node.nodeinfo.hostname}
          </a>
        ` : html`
          <a>
            ${d.source.id}
          </a>
        `}
        <a href="#" @click=${router.node(d.target.node)}>
          ${d.target.node.nodeinfo.hostname}
        </a>
      </h2>
      <table class="attributes">
        ${attributeEntry("TQ", showTq(d))}
        ${attributeEntry("Entfernung", showDistance(d))}
        ${attributeEntry("Typ", d.type)}
        ${attributeEntry("Hardware", this.showHardware(d))}
      </table>
      ${(config.linkInfos || []).map(linkInfo => html`
        <h4>${linkInfo.name}</h4>
        ${this.showStatImg(linkInfo, d)}
      `)}
    `, el)
  }

  showHardware(d) {
    const hw1 = d.source.node ? dictGet(d.source.node.nodeinfo, ["hardware", "model"]) : null
    const hw2 = dictGet(d.target.node.nodeinfo, ["hardware", "model"])
    (hw1 != null ? hw1 : "unbekannt") + " – " + (hw2 != null ? hw2 : "unbekannt")
  }

  showStatImg(o, d) {
    const subst = {}
    subst["{SOURCE}"] = d.source.node_id
    subst["{SOURCE_NAME}"] = d.source.node.nodeinfo.hostname ? d.source.node.nodeinfo.hostname : "unknown"
    subst["{TARGET}"] = d.target.node_id
    subst["{TARGET_NAME}"] = d.target.node.nodeinfo.hostname ? d.target.node.nodeinfo.hostname : "unknown"
    return showStat(o, subst)
  }
}
