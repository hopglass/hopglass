import App from "./app.js";

const main = async () => {
    new App(await fetch("config.json").then(res => res.json())).run();
};

main().catch(e => {
    console.error(e);
    document.body.textContent = e;
});
