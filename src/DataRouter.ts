import {SimulationLinkDatum, SimulationNodeDatum} from "d3-force";

export interface DataSubscriber {
    setData(data: Data): void,
}

export class MeshNode implements SimulationNodeDatum {
    flags: {
        online: boolean;
    }
    nodeinfo: {
        hostname: any;
        node_id: string;
        location: {
            latitude: number;
            longitude: number;
        };
    };
    statistics: any;

    /* d3 */
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
    linkCount: number;
}

export class MeshLink implements SimulationLinkDatum<MeshNode> {
    getId(): string {
        return `${this.source.nodeinfo.node_id}-${this.target.nodeinfo.node_id}`;
    }
    source: MeshNode;
    target: MeshNode;
    vpn: boolean;
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