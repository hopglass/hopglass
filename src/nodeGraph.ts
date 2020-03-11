import {DataSubscriber} from "./dataRouter";
import {View} from "./stateRouter";
import {html, TemplateResult} from "lit-html";

export class NodeGraph extends View implements DataSubscriber {
    id: string = "g";

    constructor(stateRouter) {
        super(stateRouter);
    }

    template(): TemplateResult {
        return html`
            <div class="buttons">
                <button @click=${super.toggleView.bind(this)}></button>
            </div>
        `;
    }

    setData(data: any) {
    }
}