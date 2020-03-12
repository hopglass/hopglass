import {DataSubscriber} from "../DataRouter";
import {StateRouter, View} from "../StateRouter";
import {html, customElement, css} from "lit-element";
import {Map as OlMap, View as OlView} from "ol";
import XYZSource from "ol/source/XYZ";
import TileLayer from "ol/layer/Tile";
import {Config} from "../Config";
import styles from "../styles";

@customElement("hopglass-nodemap")
export class NodeMap extends View implements DataSubscriber {
    id: string = "m";
    olMap: OlMap;
    config: Config;

    constructor(config: Config) {
        super();
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
                ],
                view: new OlView({
                    center: [-472202, 7530279],
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

    setData(data: any) {
    }
}
