const gulp = require("gulp");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const rollup = require("@rollup/stream");
const source = require("vinyl-source-stream");
const sourcemaps = require("gulp-sourcemaps");
const buffer = require("vinyl-buffer");
const {terser} = require("rollup-plugin-terser");
const typescript = require("@rollup/plugin-typescript");
const resolve = require("@rollup/plugin-node-resolve");
const fs = require("fs");
const del = require("del");
const serve = require("gulp-serve");
const litStyles = require("rollup-plugin-lit-styles");

let cache;
try {
    cache = require("./cache.json");
} catch(e) {
    cache = {};
}

const js = (production) => {
    return () => {
        return rollup({
            input: "src/main.ts",
            cache,
            plugins: [
                resolve(),
                litStyles({
                    postCssPlugins: [
                        autoprefixer(),
                        production && cssnano(),
                    ],
                }),
                typescript(),
                production && terser({
                    output:{
                        comments: false,
                        ecma: "2015",
                    },
                }),
            ],
            output: {
                sourceMap: true,
                options: {format: "es"},
                strict: true,
                file: "main.min.js",
            },
        })
            .on("bundle", (bundle) => {
                cache = bundle;
                fs.writeFile("./cache.json", JSON.stringify(cache), () => {});
            })
            .pipe(source("main.js"))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(sourcemaps.write("."))
            .pipe(gulp.dest("build"));
    };
};

gulp.task("jsdist", js(true));
gulp.task("jsdev", js(false));

gulp.task("assets", () => {
    return gulp.src("./assets/**")
        .pipe(gulp.dest("build"))
});

gulp.task("watch", async () => {
    gulp.watch("./assets/**", gulp.parallel("assets"));
    gulp.watch("./src/**/*.ts", gulp.parallel("jsdev"));
    gulp.watch("./scss/**/*.scss", gulp.parallel("cssdev"));
});

gulp.task("clean", (cb) => {
    return del("build/**", cb);
});

gulp.task("serve", serve("build"));

gulp.task("dev", gulp.parallel("jsdev", "assets", "watch", "serve"));
gulp.task("default", gulp.series("clean", gulp.parallel("jsdist", "assets")));
