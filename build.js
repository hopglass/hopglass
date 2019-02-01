({
    baseUrl: "lib",
    name: "../node_modules/almond/almond",
    mainConfigFile: "app.js",
    include: "../app",
    wrap: true,
    optimize: "uglify",
    out: "app-combined.js"
})
