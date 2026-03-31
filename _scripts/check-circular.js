"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/check-circular.ts
var ts = require("typescript");
var fs = require("fs");
var path = require("path");
function getValueImports(sourceFile, filePath) {
    var valueImports = [];
    var fileDir = path.dirname(filePath);
    function visit(node) {
        var _a;
        if (ts.isImportDeclaration(node)) {
            // Check if import is type-only
            var isTypeOnly = (_a = node.importClause) === null || _a === void 0 ? void 0 : _a.isTypeOnly;
            if (!isTypeOnly && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                var importPath = node.moduleSpecifier.text;
                // Resolve relative imports
                if (importPath.startsWith('.')) {
                    var resolved = path.resolve(fileDir, importPath);
                    valueImports.push(resolved);
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return valueImports;
}
function buildModuleGraph(rootDir) {
    var graph = {};
    function scanDirectory(dir) {
        var entries = fs.readdirSync(dir, { withFileTypes: true });
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            var fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && entry.name !== 'node_modules') {
                scanDirectory(fullPath);
            }
            else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
                var content = fs.readFileSync(fullPath, 'utf-8');
                var sourceFile = ts.createSourceFile(fullPath, content, ts.ScriptTarget.Latest, true);
                var imports = getValueImports(sourceFile, fullPath);
                graph[fullPath] = imports;
            }
        }
    }
    scanDirectory(rootDir);
    return graph;
}
function findCircularDependencies(graph) {
    var cycles = [];
    var visited = new Set();
    var recursionStack = new Set();
    function dfs(node, path) {
        if (recursionStack.has(node)) {
            var cycleStart = path.indexOf(node);
            if (cycleStart !== -1) {
                cycles.push(__spreadArray(__spreadArray([], path.slice(cycleStart), true), [node], false));
            }
            return;
        }
        if (visited.has(node))
            return;
        visited.add(node);
        recursionStack.add(node);
        var imports = graph[node] || [];
        for (var _i = 0, imports_1 = imports; _i < imports_1.length; _i++) {
            var imp = imports_1[_i];
            // Find matching files (handle missing extensions)
            for (var _a = 0, _b = Object.keys(graph); _a < _b.length; _a++) {
                var file = _b[_a];
                if (file === imp ||
                    file === "".concat(imp, ".ts") ||
                    file === "".concat(imp, ".tsx") ||
                    file.replace(/\.(ts|tsx)$/, '') === imp) {
                    dfs(file, __spreadArray(__spreadArray([], path, true), [node], false));
                }
            }
        }
        recursionStack.delete(node);
    }
    for (var _i = 0, _a = Object.keys(graph); _i < _a.length; _i++) {
        var node = _a[_i];
        visited.clear();
        recursionStack.clear();
        dfs(node, []);
    }
    // Remove duplicates
    var uniqueCycles = cycles.filter(function (cycle, index, self) {
        var cycleStr = cycle.join('->');
        return self.findIndex(function (c) { return c.join('->') === cycleStr; }) === index;
    });
    return uniqueCycles;
}
// Run the checker
var srcDir = path.join(process.cwd(), 'src');
console.log('🔍 Checking for circular value dependencies...\n');
var graph = buildModuleGraph(srcDir);
var cycles = findCircularDependencies(graph);
if (cycles.length === 0) {
    console.log('✅ No circular value dependencies found!');
    process.exit(0);
}
else {
    console.log('❌ Circular value dependencies found:\n');
    cycles.forEach(function (cycle, i) {
        console.log("\nCycle ".concat(i + 1, ":"));
        cycle.forEach(function (file) {
            console.log("  ".concat(path.relative(process.cwd(), file)));
        });
    });
    process.exit(1);
}
