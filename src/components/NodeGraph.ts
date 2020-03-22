import {Data, DataSubscriber, MeshLink, MeshNode} from "../DataRouter";
import {View} from "../StateRouter";
import {html, customElement, property} from "lit-element";
import {Config} from "../Config";
import styles from "../styles";
import {svg} from "lit-html";
import {forceCenter, forceLink, forceManyBody, forceSimulation, Simulation} from "d3-force";
import {Sidebar} from "./Sidebar";
import {classMap} from "lit-html/directives/class-map";

@customElement("hopglass-nodegraph")
export class NodeGraph extends View implements DataSubscriber {
    id: string = "g";

    private config: Config;
    private sidebar: Sidebar;
    private data: {
        nodes: MeshNode[],
        links: MeshLink[],
    };
    private running = false;
    private simulation: Simulation<MeshNode, MeshLink>;
    @property() private offset: [number, number];
    private startOffset = [0, 0];
    private dragging = false;

    constructor(config: Config, sidebar: Sidebar) {
        super();
        this.data = {
            nodes: [],
            links: [],
        };
        this.simulation = forceSimulation();
        this.simulation.stop();
        this.simulation.on('tick', () => this.requestUpdate());
        this.config = config;
        this.sidebar = sidebar;
        this.offset = [window.innerWidth / 2 + this.sidebar.getWidth(), window.innerHeight / 2]

        window.addEventListener("mouseup", this.mouseupHandler.bind(this))
    }

    static get styles() {
        return styles;
    }

    static nodeVisible(node: MeshNode) {
        return true; // node.flags.online;
    }

    mousemoveHandler(evt: MouseEvent) {
        if (!this.dragging) return;
        this.offset = [
            this.startOffset[0] + evt.clientX,
            this.startOffset[1] + evt.clientY,
        ];
    }
    mouseupHandler() {
        this.dragging = false;
    }
    mousedownHandler(evt: MouseEvent) {
        this.startOffset = [
            this.offset[0] - evt.clientX,
            this.offset[1] - evt.clientY,
        ];
        this.dragging = true;
    }

    prepX(x: number) {
        return Math.floor(x + this.offset[0]);
    }
    prepY(y: number) {
        return Math.floor(y + this.offset[1]);
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.simulation.restart();
    }

    render() {
        return svg`
            <svg @mousedown="${this.mousedownHandler}" @mousemove="${this.mousemoveHandler}" class="forcegraph">
                ${this.data.links.map(e => svg`
                    <line
                        x1="${this.prepX(e.source.x-1)}"
                        x2="${this.prepX(e.target.x+1)}"
                        y1="${this.prepY(e.source.y-1)}"
                        y2="${this.prepY(e.target.y+1)}"
                        class="${e.vpn ? "vpnlink" : "link"}">
                    </line>
                `)}
                ${this.data.nodes.map(e => svg`
                    <circle
                        cx="${this.prepX(e.x )}"
                        cy="${this.prepY(e.y )}"
                        r="12" class="node">
                    </circle>
                `)}
            </svg>
        `;
    }

    setData(data: Data) {
        this.data = {
            nodes: Object.entries(data.nodes).map(([_k, e]) => e).filter(NodeGraph.nodeVisible),
            links: Object.entries(data.links).map(([_k, e]) => e).filter(e => {
                return NodeGraph.nodeVisible(e.source) && NodeGraph.nodeVisible(e.target);
            })
        };
        this.simulation.nodes(this.data.nodes);
        this.simulation.force("links", forceLink(this.data.links)
            .distance(80)
            .strength(l => l.vpn ? 0 : 1));
        this.simulation.force("repulsion", forceManyBody()
            .distanceMax(150)
            .strength(-400));
        this.simulation.force("center", forceCenter());
        if (this.isConnected) this.simulation.restart();
        //Object.entries(data.nodes).filter(NodeMap.hasLocation)
    }
}
