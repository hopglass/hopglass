const postcss = require("gulp-postcss")
const gulp = require("gulp")
const autoprefixer = require("autoprefixer")
const cssnano = require("cssnano")
const sass = require("@csstools/postcss-sass")
const rollup = require("@rollup/stream")
const source = require("vinyl-source-stream")
const sourcemaps = require("gulp-sourcemaps")
const buffer = require("vinyl-buffer")
const {terser} = require("rollup-plugin-terser")
const resolve = require("@rollup/plugin-node-resolve")
const commonjs = require("@rollup/plugin-commonjs")

let cache = require("./cache.json")

gulp.task("css", () => {
  const plugins = [
    sass(),
    autoprefixer(),
    cssnano()
  ]

  return gulp.src("scss/main.scss")
    .pipe(postcss(plugins))
    .pipe(gulp.dest("build"))
})

gulp.task("rollup", () => {
  return rollup({
		input: "src/app.js",
		plugins: [
			resolve(),
			commonjs(),
			terser(),
		],
		output: {
      sourceMap: true,
      options: { format: "iife" },
			strict: false,
			file: "main.js",
    },
  })
    .on("bundle", (bundle) => cache = bundle)
    .pipe(source("main.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("build"))
})

gulp.task('watch', (done) => {
  gulp.watch('./src/**/*.js', gulp.series('rollup'));
})
