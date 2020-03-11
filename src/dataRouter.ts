export interface DataSubscriber {
    setData(data: any),
}

export interface MeshNode {
    nodeinfo: any;
    statistics: any;
}

export interface MeshLink {
    id: string;
}

export interface Data {
    nodes: {[key: string]: MeshNode},
    links: {[key: string]: MeshLink},
}

export class DataRouter {
    private subscribers: DataSubscriber[];
    data: Data;

    constructor() {
        this.subscribers = [];
    }

    subscribe(sub: DataSubscriber) {
        this.subscribers.push(sub);
    }

    setData(data) {
        this.data = data;
        for (let sub of this.subscribers) sub.setData(this.data);
    }
}