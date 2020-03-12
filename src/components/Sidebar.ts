import {html} from "lit-html";
import {State, StateSubscriber} from "../StateRouter";
import {Data, DataSubscriber} from "../DataRouter";
import {customElement, LitElement, property} from "lit-element";
import styles from "../styles";
import {classMap} from "lit-html/directives/class-map";
import {chevronBack} from "ionicons/icons";
import {unsafeHTML} from "lit-html/directives/unsafe-html";

@customElement("hopglass-sidebar")
export class Sidebar extends LitElement implements StateSubscriber, DataSubscriber {
    @property() nodeCount: Number;
    @property() visible = true;

    private static toggleSidebar(evt: MouseEvent) {
        (<HTMLElement>evt.target).parentElement.classList.toggle("hidden");
    }

    constructor() {
        super();
    }

    render() {
        return html`
            <div class=${classMap({sidebar: true, hidden: !this.visible})}>
                <button class="sidebarhandle" @click=${this.toggleVisibility}>
<!--${unsafeHTML(`<img src="${chevronBack}">`)} -->
</button>
                <div class=${classMap({container: true, hide: !this.visible})}>
                    <h3>Nodes: ${this.nodeCount}</h3>
                </div>
            </div>
        `;
    }

    toggleVisibility() {
        this.visible = !this.visible;
    }

    setData(data: Data): void {
        this.nodeCount = data.nodes && Object.keys(data.nodes).length;
    }

    setState(_state: State): void {
    }
    
    static get styles() {
        return styles;
    }
}