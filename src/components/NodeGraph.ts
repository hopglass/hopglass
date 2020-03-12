import {Data, DataSubscriber} from "../DataRouter";
import {View} from "../StateRouter";
import {customElement, html} from "lit-element";

@customElement("hopglass-nodegraph")
export class NodeGraph extends View implements DataSubscriber {
    id: string = "g";

    render() {
        return html`
            <canvas></canvas>
        `;
    }

    setData(data: Data): void {
    }
}