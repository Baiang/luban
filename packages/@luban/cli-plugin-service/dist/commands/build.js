"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_shared_utils_1 = require("@luban-cli/cli-shared-utils");
const webpack_1 = __importDefault(require("webpack"));
const webpack_bundle_analyzer_1 = require("webpack-bundle-analyzer");
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const formatStats_1 = require("./../utils/formatStats");
const fs_1 = require("fs");
async function build(args, api, options) {
    const spinner = new cli_shared_utils_1.Spinner();
    spinner.logWithSpinner("Build bundle... \n");
    const defaultEntryFile = api.getEntryFile();
    const entryFile = args.entry || `src/${defaultEntryFile}`;
    if (!fs_1.existsSync(api.resolve(entryFile))) {
        cli_shared_utils_1.error(`The entry file ${entryFile} not exit, please check it`);
        process.exit();
    }
    if (args.dest) {
        options.outputDir = args.dest;
    }
    const targetDir = api.resolve(options.outputDir);
    const webpackConfig = api.resolveWebpackConfig(api.resolveChainableWebpackConfig());
    webpackConfig.entry = {
        app: api.resolve(entryFile),
    };
    if (args.report) {
        if (Array.isArray(webpackConfig.plugins)) {
            webpackConfig.plugins.push(new webpack_bundle_analyzer_1.BundleAnalyzerPlugin({
                logLevel: "error",
                openAnalyzer: false,
                analyzerMode: args.report ? "static" : "disabled",
                reportFilename: "report.html",
            }));
        }
    }
    return new Promise((resolve, reject) => {
        webpack_1.default(webpackConfig, (err, stats) => {
            spinner.stopSpinner();
            if (err) {
                return reject(err);
            }
            formatStats_1.logStatsErrorsAndWarnings(stats);
            if (stats.hasErrors()) {
                return reject("Build failed with some Compilation errors occurred.");
            }
            const targetDirShort = path_1.default.relative(api.service.context, targetDir);
            cli_shared_utils_1.log(formatStats_1.formatStats(stats, targetDirShort, api));
            cli_shared_utils_1.done(`Build complete. The ${chalk_1.default.cyan(targetDirShort)} directory is ready to be deployed.`);
            resolve();
        });
    });
}
function default_1(api, options) {
    api.registerCommand("build", {
        description: "build for production",
        usage: "luban-cli-service build [options]",
        options: {
            "--entry": "specify entry file",
            "--config": "specify config file",
            "--mode": "specify env mode (default: production)",
            "--dest": "specify output directory (default: ${options.outputDir})",
            "--report": "generate report.html to help analyze bundle content",
        },
    }, async (args) => {
        await build(args, api, options);
    });
}
exports.default = default_1;
//# sourceMappingURL=build.js.map