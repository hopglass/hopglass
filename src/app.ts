import {Config, ConfigJSON} from "./config";
import {Data, DataRouter, DataSubscriber} from "./dataRouter";
import {StateRouter, StateSubscriber} from "./stateRouter";
import {Sidebar} from "./sidebar";
import {html, render} from "lit-html";
import {NodeGraph} from "./nodeGraph";
import {NodeMap} from "./nodeMap";

export default class App implements DataSubscriber, StateSubscriber {
    private config: Config;
    private dataRouter: DataRouter;
    private stateRouter: StateRouter;
    private sidebar: Sidebar;

    constructor(config: ConfigJSON) {
        this.config = Config.fromJSON(config);
        this.dataRouter = new DataRouter();
        this.stateRouter = new StateRouter();
        this.sidebar = new Sidebar();

        this.dataRouter.subscribe(this.stateRouter);
        this.dataRouter.subscribe(this);

        const nodeMap = new NodeMap(this.stateRouter);
        this.stateRouter.addView(nodeMap);
        this.dataRouter.subscribe(nodeMap);

        const nodeGraph = new NodeGraph(this.stateRouter);
        this.stateRouter.addView(nodeGraph);
        this.dataRouter.subscribe(nodeGraph);
    }

    async fetchData() {
        const data: Data = {links: {}, nodes: {}};
        const files = await Promise.all(this.config.dataPath.map(path => {
            return fetch(path + "nodes.json").then(res => res.json());
        }).concat(this.config.dataPath.map(path => {
            return fetch(path + "graph.json").then(res => res.json());
        })));
        let nodesArray = [];
        let linksArray = [];
        for (let json of files) {
            if ("nodes" in json) nodesArray = nodesArray.concat(json.nodes);
            if ("batadv" in json) {
                linksArray = linksArray.concat(json.batadv.links.map(link => {
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
        return data;
    }

    async run() {
        console.log("Hello HopGlass!");
        this.dataRouter.setData(await this.fetchData());
        this.stateRouter.start();
        setInterval(async () => {
            this.dataRouter.setData(await this.fetchData())
        }, 60000);
    }

    render() {
        render(html`
            <div class="content">${this.stateRouter.state.currentView.template()}</div>
            <div class="sidebar">${this.sidebar.template(this.stateRouter.state, this.dataRouter.data)}</div>
        `, document.body);
    }

    setState() {
        this.render();
    }

    setData(data: any) {
        this.render();
    }
}