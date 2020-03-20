import {Data, DataSubscriber, MeshNode} from "../DataRouter";
import {View} from "../StateRouter";
import {html, customElement} from "lit-element";
import {Config} from "../Config";
import styles from "../styles";
import {median} from "d3-array";

import {Map as OlMap, View as OlView, Feature} from "ol";
import {Vector as VectorLayer, Tile as TileLayer} from "ol/layer";
import {Vector as VectorSource, XYZ as XYZSource} from "ol/source";
import {addCommon, transform} from "ol/proj";
import {Point, Geometry} from "ol/geom";
import {Style, Text as TextStyle, Circle as CircleStyle, Fill, Stroke} from "ol/style";

@customElement("hopglass-nodemap")
export class NodeMap extends View implements DataSubscriber {
    id: string = "m";
    olMap: OlMap;
    config: Config;
    private data: Data;
    private readonly nodeFeatures: VectorSource<Geometry>;
    private nodeStyle = (feature: Feature<Geometry>) => new Style({
         image: new CircleStyle( {
             radius: 6,
             fill: new Fill({
                 color: 'rgba(120, 180, 255, 1)',
             }),
             stroke: new Stroke({
                 color: 'rgba(60, 90, 120, 1)',
             }),
         }),
    });
    private labelStyle = (feature: Feature<Geometry>) => new Style({
        text: new TextStyle({
            offsetY: -13,
            text: feature.get("node").nodeinfo.hostname,
            fill: new Fill({
                color: `rgba(0, 0, 0, 1)`,
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
