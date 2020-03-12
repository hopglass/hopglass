export interface DataSubscriber {
    setData(data: Data): void,
}

export interface MeshNode {
    nodeinfo: {
        node_id: string;
    };
    statistics: any;
}

export class MeshLink {
    getId(): string {
        return `${this.source.nodeinfo.node_id}-${this.target.nodeinfo.node_id}`;
    }
    source: MeshNode;
    target: MeshNode;
}

export interface Data {
    nodes: {[key: string]: MeshNode},
    links: {[key: string]: MeshLink},
}

export class DataRouter {
    private readonly subscribers: DataSubscriber[];
    data: Data;

    constructor() {
        this.subscribers = [];
    }

    subscribe(sub: DataSubscriber) {
        this.subscribers.push(sub);
    }

    setData(data: Data) {
        this.data = data;
        for (let sub of this.subscribers) sub.setData(this.data);
    }
}