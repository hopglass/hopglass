import {Data, DataSubscriber, MeshLink, MeshNode} from "./DataRouter";
import {LitElement} from "lit-element";

export abstract class View extends LitElement {
    readonly id: string;
}

export interface State {
    currentView: View;
    selectedNode: MeshNode;
    selectedLink: MeshLink;
}

export interface StateSubscriber {
    setState(state: State): void,
}

export class StateRouter implements DataSubscriber {
    private readonly subscribers: StateSubscriber[];
    private readonly views: View[];
    private data: Data;
    state: State;

    constructor() {
        this.subscribers = [];
        this.views = [];
        this.state = {
            currentView: undefined,
            selectedNode: undefined,
            selectedLink: undefined,
        };
    }

    start() {
        window.onhashchange = this.hashChange.bind(this);
        this.hashChange();
    }

    subscribe(sub: StateSubscriber) {
        this.subscribers.push(sub);
    }

    setData(data: Data) {
        const firstData = !this.data;
        this.data = data;
        if (firstData) this.start();
    }

    addView(view: View) {
        this.views.push(view);
    }

    setState(newState: Partial<State>) {
        Object.assign(this.state, newState);
        for (let sub of this.subscribers) sub.setState(this.state);
        this.saveState();
    }

    saveState() {
        const components: any = {};
        if (this.state.currentView)
            components.v = encodeURIComponent(this.state.currentView.id);
        if (this.state.selectedNode)
            components.n = encodeURIComponent(this.state.selectedNode.nodeinfo.node_id);
        if (this.state.selectedLink)
            components.l = encodeURIComponent(this.state.selectedLink.getId());
        // window.history.pushState(hash, undefined, hash);
        window.location.hash = "#!" + Object.entries(components).map(e => e.join(":")).join(";");
    }

    hashChange() {
        if (!this.data) return;
        const s = decodeURIComponent(window.location.hash);

        if (!s.startsWith("#!"))
            return window.location.hash = "#!";

        this.state = {
            currentView: this.views[0],
            selectedLink: undefined,
            selectedNode: undefined,
        };

        for (let d of s.slice(2).split(";")) {
            const args = d.split(":");

            if (args[0] == "v") {
                for (let view of this.views) {
                    if (args[1] == view.id) {
                        this.state.currentView = view;
                        break;
                    }
                }
            }

            if (args[0] === "n") {
                const id = args[1];
                if (id in this.data.nodes) {
                    this.state.selectedNode = this.data.nodes[id];
                }
            }

            if (args[0] === "l") {
                const id = args[1];
                if (id in this.data.links) {
                    this.state.selectedLink = this.data.links[id];
                }
            }
        }

        if (!this.state.currentView) {
            return window.location.hash = "#!v:" + this.views[0].id;
        }

        for (let sub of this.subscribers) sub.setState(this.state);
    }

    toggleView() {
        const viewNum = this.views.indexOf(this.state.currentView);
        const newViewNum = (viewNum + 1) % this.views.length;
        this.setState({
            currentView: this.views[newViewNum],
        });
    }
}
