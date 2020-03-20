import {Config, ConfigJSON} from "./Config";
import {Data, DataRouter, DataSubscriber, MeshNode} from "./DataRouter";
import {StateRouter, StateSubscriber} from "./StateRouter";
import {Sidebar} from "./components/Sidebar";
import {NodeGraph} from "./components/NodeGraph";
import {NodeMap} from "./components/NodeMap";
import {html, customElement, LitElement} from "lit-element";
import styles from "./styles";
import {addProjection} from "ol/proj";

@customElement("hopglass-app")
export default class App extends LitElement implements DataSubscriber, StateSubscriber {
    private readonly config: Config;
    private dataRouter: DataRouter;
    private readonly stateRouter: StateRouter;
    private sidebar: Sidebar;

    constructor(config: ConfigJSON) {
        super();

        this.config = Config.fromJSON(config);
        this.dataRouter = new DataRouter();
        this.stateRouter = new StateRouter();

        this.dataRouter.subscribe(this.stateRouter);
        this.dataRouter.subscribe(this);
        this.stateRouter.subscribe(this);

        const nodeMap = new NodeMap(this.config);
        this.stateRouter.addView(nodeMap);
        this.dataRouter.subscribe(nodeMap);

        const nodeGraph = new NodeGraph();
        this.stateRouter.addView(nodeGraph);
        this.dataRouter.subscribe(nodeGraph);

        this.sidebar = new Sidebar();
        this.stateRouter.subscribe(this.sidebar);
        this.dataRouter.subscribe(this.sidebar);

        this.fetchData();
        setInterval(this.fetchData.bind(this), 60000);
    }

    async fetchData() {
        const data: Data = {links: {}, nodes: {}};
        const files = await Promise.all(this.config.dataPath.map(path => {
            return fetch(path + "nodes.json").then(res => res.json());
        }).concat(this.config.dataPath.map(path => {
            return fetch(path + "graph.json").then(res => res.json());
        })));
        let nodesArray: MeshNode[] = [];
        let linksArray: any[] = [];
        for (let json of files) {
            if ("nodes" in json) nodesArray = nodesArray.concat(json.nodes);
            if ("batadv" in json) {
                linksArray = linksArray.concat(json.batadv.links.map((link: any) => {
                    link.source = json.batadv.nodes[link.source];
                    link.target = json.batadv.nodes[link.target];
                    return link;
                }));
            }
        }
        for (let node of nodesArray) {
            data.nodes[node.nodeinfo.node_id] = node;
        }
        for (let link of linksArray) {
            link.source = data.nodes[link.source.node_id];
            link.target = data.nodes[link.target.node_id];
            data.links[link.source.node_id+"-"+link.target.node_id] = link;
        }
        this.dataRouter.setData(data);
    }

    render() {
        return html`
            <div class="content">
                <div class="buttons">
                    <button @click=${this.stateRouter.toggleView.bind(this.stateRouter)}></button>
                </div>
                ${this.stateRouter.state.currentView}
            </div>
            ${this.sidebar}
        `;
    }

    setState(): void {
        this.performUpdate();
    }

    setData(_data: any) {
        this.performUpdate();
    }
    
    static get styles() {
        return styles;
    }
}