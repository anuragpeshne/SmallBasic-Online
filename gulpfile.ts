import * as fs from "fs";
import * as gulp from "gulp";
import * as path from "path";
import * as helpers from "./build/gulp-helpers";
import { generateLocStrings } from "./build/generate-loc-strings";

const userLanguage = "en";

gulp.task("generate-diagnostics-strings", () => generateLocStrings("DiagnosticsResources", path.resolve(__dirname, `./build/strings/${userLanguage}/diagnostics.json`), path.resolve(__dirname, `./src/strings/diagnostics.ts`)));
gulp.task("generate-compiler-strings", () => generateLocStrings("CompilerResources", path.resolve(__dirname, `./build/strings/${userLanguage}/compiler.json`), path.resolve(__dirname, `./src/strings/compiler.ts`)));
gulp.task("generate-documentation-strings", () => generateLocStrings("DocumentationResources", path.resolve(__dirname, `./build/strings/${userLanguage}/documentation.json`), path.resolve(__dirname, `./src/strings/documentation.ts`)));
gulp.task("generate-app-editor-strings", () => generateLocStrings("EditorResources", path.resolve(__dirname, `./build/strings/${userLanguage}/editor.json`), path.resolve(__dirname, `./src/strings/editor.ts`)));

gulp.task("generate-loc-strings", [
    "generate-diagnostics-strings",
    "generate-compiler-strings",
    "generate-documentation-strings",
    "generate-app-editor-strings",
]);

gulp.task("build-source-debug", ["generate-loc-strings"], () => helpers.runWebpack({ projectPath: "./src/app/webpack.config.ts", release: false, watch: false }));
gulp.task("build-source-release", ["generate-loc-strings"], () => helpers.runWebpack({ projectPath: "./src/app/webpack.config.ts", release: true, watch: false }));

gulp.task("watch-source", () => {
    gulp.watch("build/**", ["generate-loc-strings"]);
    return helpers.runWebpack({
        projectPath: "./src/app/webpack.config.ts",
        release: false,
        watch: true
    });
});

gulp.task("build-tests-debug", () => helpers.runWebpack({ projectPath: "./tests/webpack.config.ts", release: false, watch: false }));
gulp.task("run-tests-debug",  ["build-tests-debug"], () => helpers.cmdToPromise("node", ["./node_modules/jasmine/bin/jasmine.js", "./out/tests/tests.js"]));

gulp.task("build-tests-release", () => helpers.runWebpack({ projectPath: "./tests/webpack.config.ts", release: true, watch: false }));
gulp.task("run-tests-release",  ["build-tests-release"], () => helpers.cmdToPromise("node", ["./node_modules/jasmine/bin/jasmine.js", "./out/tests/tests.js"]));

gulp.task("watch-tests", () => {
    gulp.watch("build/**", ["generate-loc-strings"]);
    gulp.watch(["src/**", "tests/**"], ["run-tests-debug"]);
});

function packageFunction(release: boolean): Promise<void> {
    const setupConfigPath = "./out/electron/electron-builder-config.json";
    const electronBuilderPath = path.resolve(__dirname, "./node_modules/.bin/electron-builder.cmd");

    return helpers.rimrafToPromise("./out/electron")
        .then(() => helpers.runWebpack({
            projectPath: "./src/electron/webpack.config.ts",
            release: release,
            watch: false
        }))
        .then(() => helpers.streamToPromise(gulp.src("./out/app/**").pipe(gulp.dest("./out/electron"))))
        .then(() => helpers.streamToPromise(gulp.src("./package.json").pipe(gulp.dest("./out/electron"))))
        .then(() => helpers.rimrafToPromise("./out/installers"))
        .then(() => new Promise<void>((resolve, reject) => {
            const config = {
                productName: "SmallBasic-Online",
                directories: {
                    app: "./out/electron",
                    output: "./out/installers"
                },
                win: {
                    target: [
                        { target: "nsis", arch: ["ia32"] }
                    ],
                    icon: "./src/electron/installer"
                }
            };
            fs.writeFile(setupConfigPath, JSON.stringify(config), "utf8", error => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        }))
        .then(() => helpers.cmdToPromise(electronBuilderPath, ["build", "--config", setupConfigPath, "--publish", "never"]));
}

gulp.task("package-debug", ["build-source-debug"], () => packageFunction(false));
gulp.task("package-release", ["build-source-release"], () => packageFunction(true));
