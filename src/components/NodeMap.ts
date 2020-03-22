import {Data, DataSubscriber, MeshNode} from "../DataRouter";
import {View} from "../StateRouter";
import {html, customElement} from "lit-element";
import {Config} from "../Config";
import styles from "../styles";
import {median} from "d3-array";

import Feature from "ol/Feature";
import OlMap from "ol/Map";
import OlView from "ol/View";
import VectorLayer from "ol/layer/Vector";
import TileLayer from "ol/layer/Tile";
import VectorSource from "ol/source/Vector";
import XYZSource from "ol/source/XYZ";
import {addCommon, transform} from "ol/proj";
import Point from "ol/geom/Point";
import Geometry from "ol/geom/Geometry";
import Style from "ol/style/Style";
import TextStyle from "ol/style/Text";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

@customElement("hopglass-nodemap")
export class NodeMap extends View implements DataSubscriber {
    id: string = "m";

    private olMap: OlMap;
    private config: Config;
    private data: Data;
    private readonly nodeFeatures: VectorSource<Geometry>;

    private static readonly onlineNodeStyle = new CircleStyle( {
        radius: 6,
        fill: new Fill({ color: 'rgba(120, 180, 255, 0.9)', }),
        stroke: new Stroke({ color: 'rgba(60, 90, 120, 1)', }),
    });
    private static readonly offlineNodeStyle = new CircleStyle( {
        radius: 6,
        fill: new Fill({ color: 'rgba(255, 90, 60, 0.9)', }),
        stroke: new Stroke({ color: 'rgba(120, 90, 60, 1)', }),
    });
    private nodeStyle = (feature: Feature<Geometry>) => new Style({
         image: (<MeshNode> feature.get("node")).flags.online ? NodeMap.onlineNodeStyle : NodeMap.offlineNodeStyle,
    });
    private labelStyle = (feature: Feature<Geometry>) => new Style({
        text: new TextStyle({
            offsetY: -13,
            text: (<MeshNode> feature.get("node")).nodeinfo.hostname,
            fill: new Fill({
                color: 'rgba(0, 0, 0, 1)',
            }),
        }),
    });

    constructor(config: Config) {
        super();
        addCommon();
        this.nodeFeatures = new VectorSource();
        this.config = config;
    }

    connectedCallback(): void {
        super.connectedCallback();
        if (!this.olMap) setTimeout(() => {
            this.olMap = new OlMap({
                target: <HTMLElement> this.shadowRoot.querySelector(".map"),
                layers: [
                    new TileLayer({
                        source: new XYZSource({
                            url: this.config.mapLayers[0].url,
                        }),
                    }),
                    new VectorLayer({
                        source: this.nodeFeatures,
                        style: this.nodeStyle.bind(this),
                    }),
                    new VectorLayer({
                        source: this.nodeFeatures,
                        style: this.labelStyle.bind(this),
                        declutter: true,
                    }),
                ],
                view: new OlView({
                    center: transform(this.getCenter(), "CRS:84", "EPSG:900913"),
                    zoom: 12,
                }),
            });
        }, 0);
    }

    static get styles() {
        return styles;
    }

    render() {
        return html`
            <div class="map">
            </div>
        `;
    }

    setData(data: Data) {
        this.data = data;
        const features = Object.entries(data.nodes).filter(NodeMap.hasLocation).map(([_k, n]) =>
            new Feature({
                geometry: new Point(transform([
                    n.nodeinfo.location.longitude,
                    n.nodeinfo.location.latitude,
                ], "CRS:84", "EPSG:900913")),
                node: n,
            })
        );
        this.nodeFeatures.clear();
        this.nodeFeatures.addFeatures(features);
    }

    private static hasLocation([_k, n]: [string, MeshNode]) {
        return n.nodeinfo.location && n.nodeinfo.location.latitude && n.nodeinfo.location.longitude && true;
    }

    private getCenter() {
        const nodesWithLocation = Object.entries(this.data.nodes).filter(NodeMap.hasLocation);

        const latitudes = nodesWithLocation.map(([_k, n]) => n.nodeinfo.location.latitude);
        const longitudes = nodesWithLocation.map(([_k, n]) => n.nodeinfo.location.longitude);

        return [median(longitudes), median(latitudes)];
    }
}
