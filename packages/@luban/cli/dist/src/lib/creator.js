"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execa_1 = __importDefault(require("execa"));
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const packageManager_1 = require("../utils/packageManager");
const promptModuleAPI_1 = require("./promptModuleAPI");
const sortObject_1 = require("../utils/sortObject");
const getReadme_1 = require("./../utils/getReadme");
const getVersions_1 = require("../utils/getVersions");
const cli_shared_utils_1 = require("@luban-cli/cli-shared-utils");
const generator_1 = require("./generator");
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
class Creator {
    constructor(name, context, options, promptModules) {
        this.name = name;
        this.options = options;
        this.context = context;
        this.installLocalPlugin = options.localPlugin || false;
        this.run = this.run.bind(this);
        this.shouldInitGit = this.shouldInitGit.bind(this);
        this.injectedPrompts = [];
        this.promptCompletedCallbacks = [];
        this.outroPrompts = this.resolveOutroPrompts();
        const promptAPI = new promptModuleAPI_1.PromptModuleAPI(this);
        promptModules.forEach((m) => m(promptAPI));
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            const { options, context, name, shouldInitGit, run } = this;
            const preset = yield this.promptAndResolvePreset();
            const adaptedPreset = lodash_clonedeep_1.default(preset);
            const rootOptions = { projectName: name, preset };
            adaptedPreset.plugins["@luban-cli/cli-plugin-service"] = rootOptions;
            const packageManager = this._pkgManager || "npm";
            const pkgManager = new packageManager_1.PackageManager({ context, forcePackageManager: packageManager });
            yield cli_shared_utils_1.clearConsole();
            cli_shared_utils_1.logWithSpinner(`✨`, `Creating project in ${chalk_1.default.yellow(context)}.`);
            cli_shared_utils_1.log();
            const resolvedPlugins = yield this.resolvePlugins(lodash_clonedeep_1.default(adaptedPreset.plugins));
            const { latestMinor } = yield getVersions_1.getVersions();
            const pkg = {
                name,
                version: "0.1.0",
                private: true,
                devDependencies: {},
                ["__luban_config__"]: adaptedPreset,
            };
            const deps = Object.keys(adaptedPreset.plugins);
            deps.forEach((dep) => {
                let packageDirName = "";
                let packageDirPath = "";
                const packageDirNameMatchResult = /^@luban-cli\/(cli-plugin-.+)$/.exec(dep);
                if (Array.isArray(packageDirNameMatchResult)) {
                    packageDirName = packageDirNameMatchResult[1];
                    packageDirPath = path_1.default.resolve(process.cwd(), `../../${packageDirName}`);
                }
                pkg.devDependencies[dep] = this.installLocalPlugin
                    ? `file:${packageDirPath}`
                    : `~${latestMinor}`;
            });
            yield cli_shared_utils_1.writeFileTree(context, {
                "package.json": JSON.stringify(pkg, null, 2),
            });
            const shouldInitGitFlag = shouldInitGit(options);
            if (shouldInitGitFlag) {
                cli_shared_utils_1.logWithSpinner(`🗃`, `Initializing git repository...`);
                yield run("git init");
            }
            cli_shared_utils_1.log();
            cli_shared_utils_1.stopSpinner();
            cli_shared_utils_1.log(`⚙\u{fe0f}  Installing CLI plugins. This might take a while...`);
            cli_shared_utils_1.log();
            yield pkgManager.install();
            cli_shared_utils_1.log();
            cli_shared_utils_1.log(`🚀  Invoking plugin's generators...`);
            const generator = new generator_1.Generator(context, { plugins: resolvedPlugins, pkg: pkg });
            yield generator.generate();
            cli_shared_utils_1.log();
            cli_shared_utils_1.stopSpinner();
            cli_shared_utils_1.log(`📦   Installing additional dependencies...`);
            yield pkgManager.install();
            cli_shared_utils_1.log();
            cli_shared_utils_1.stopSpinner();
            cli_shared_utils_1.logWithSpinner("📄   Generating README.md...");
            yield cli_shared_utils_1.writeFileTree(context, {
                "README.md": getReadme_1.generateReadme(generator.pkg, packageManager),
            });
            cli_shared_utils_1.log();
            cli_shared_utils_1.log(chalk_1.default.green("🎉   create project successfully!"));
            cli_shared_utils_1.log(`
      ${chalk_1.default.bgWhiteBright.black("🚀   Run Application  ")}
      ${chalk_1.default.yellow(`cd ${name}`)}
      ${chalk_1.default.yellow("npm start")}
    `);
            cli_shared_utils_1.log();
            cli_shared_utils_1.log(`🔗  More documentation to visit ${chalk_1.default.underline(`${require("./../../package.json").homepage}`)}`);
            cli_shared_utils_1.log();
            cli_shared_utils_1.log(chalk_1.default.redBright("💻   Happy coding"));
            cli_shared_utils_1.log();
            generator.printExitLogs();
            process.exit(1);
        });
    }
    run(command, args) {
        if (!args) {
            [command, ...args] = command.split(/\s+/);
        }
        return execa_1.default(command, args, { cwd: this.context });
    }
    promptAndResolvePreset() {
        return __awaiter(this, void 0, void 0, function* () {
            yield cli_shared_utils_1.clearConsole();
            const answers = yield inquirer_1.default.prompt(this.resolveFinalPrompts());
            const preset = {
                plugins: { "@luban-cli/cli-plugin-service": {} },
            };
            this.promptCompletedCallbacks.forEach((cb) => cb(answers, preset));
            return preset;
        });
    }
    shouldInitGit(cliOptions) {
        if (!cli_shared_utils_1.hasGit()) {
            return false;
        }
        if (cliOptions.skipGit) {
            return false;
        }
        if (cliOptions.forceGit) {
            return true;
        }
        if (typeof cliOptions.git === "string") {
            return true;
        }
        return cli_shared_utils_1.hasProjectGit(this.context);
    }
    resolveFinalPrompts() {
        this.injectedPrompts.forEach((prompt) => {
            const originalWhen = prompt.when || (() => true);
            prompt.when = function (answers) {
                if (typeof originalWhen === "function") {
                    return originalWhen(answers);
                }
                return originalWhen;
            };
        });
        return [...this.injectedPrompts, ...this.outroPrompts];
    }
    resolveOutroPrompts() {
        const outroPrompts = [];
        return outroPrompts;
    }
    resolvePlugins(rawPlugins) {
        return __awaiter(this, void 0, void 0, function* () {
            const sortedRawPlugins = sortObject_1.sortObject(rawPlugins, ["@luban-cli/cli-plugin-service"], true);
            const plugins = [];
            const pluginIDs = Object.keys(sortedRawPlugins);
            for (const id of pluginIDs) {
                const apply = cli_shared_utils_1.loadModule(`${id}/generator`, this.context) || (() => undefined);
                plugins.push({ id: id, apply, options: sortedRawPlugins[id] || {} });
            }
            return plugins;
        });
    }
}
exports.Creator = Creator;
//# sourceMappingURL=creator.js.map