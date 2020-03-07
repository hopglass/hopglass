import pkg from "./package.json";
import {terser} from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
export default [
	{
		input: "src/app.js",
		output: [
			{
				file: pkg.module,
				format: "es",
				strict: true,
				file: "app.js",
			},
		],
		plugins: [
			resolve(),
			commonjs(),
		],
	},
	{
		input: "src/app.js",
		output: [
			{
				file: pkg.module,
				format: "es",
				strict: true,
				file: "app.min.js",
			},
		],
		plugins: [
			resolve(),
			commonjs(),
			terser({
				mangle: {
					module: true,
				},
			}),
		],
	},
];
