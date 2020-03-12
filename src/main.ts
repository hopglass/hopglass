import App from "./App";

const main = async () => {
    const configJSON = await fetch("config.json").then(res => res.json());
    document.body.innerHTML = "";
    document.body.appendChild(new App(configJSON));
};

main().catch(e => {
    console.error(e);
    document.body.textContent = e;
});
