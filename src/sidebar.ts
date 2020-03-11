import {html} from "lit-html";
import {State} from "./stateRouter";
import {Data} from "./dataRouter";

export class Sidebar {
    private static toggleSidebar(evt) {
        evt.target.parentElement.classList.toggle("hidden");
    }

    template(state: State, data: Data) {
        return html`
            <button class="sidebarhandle" @click=${Sidebar.toggleSidebar}></button>
            <h3>Nodes: ${Object.keys(data.nodes).length}</h3>
        `;
    }
}