"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFileFromTestName = exports.loadTestQuery = exports.clearDisk = exports.getContentFromArchives = void 0;
const fs = __importStar(require("fs-extra"));
const persistDir = "./data";
async function getContentFromArchives(name) {
    const buffer = await fs.readFile("test/resources/archives/" + name);
    return buffer.toString("base64");
}
exports.getContentFromArchives = getContentFromArchives;
async function clearDisk() {
    await fs.remove(persistDir);
}
exports.clearDisk = clearDisk;
async function loadTestQuery(testname) {
    const filename = extractFileFromTestName(testname);
    const data = await fs.readFile(`test/resources/queries/${filename}`, "utf-8");
    const testQuery = JSON.parse(data);
    assertTestQuery(testQuery);
    return testQuery;
}
exports.loadTestQuery = loadTestQuery;
function extractFileFromTestName(name) {
    const match = name.match(/\[(.+)]/);
    const validMatchLength = 2;
    if (!match || match.length < validMatchLength) {
        throw new Error("Invalid test name." +
            "Test names must include a relative file path enclosed in brackets; e.g., [my/file.json]." +
            `'${name}' does not include a file path in brackets.`);
    }
    return match[1];
}
exports.extractFileFromTestName = extractFileFromTestName;
function assertTestQuery(testQuery) {
    if (Array.isArray(testQuery)) {
        throw new Error("ValidationError: Test Query must be an object not an array.");
    }
    if (!Object.hasOwn(testQuery, "input")) {
        throw new Error("ValidationError: Test Query is missing required field 'input'.");
    }
    if (!Object.hasOwn(testQuery, "expected")) {
        throw new Error("ValidationError: Test Query is missing required field 'expected'.");
    }
    if (!Object.hasOwn(testQuery, "errorExpected")) {
        throw new Error("ValidationError: Test Query is missing required field 'errorExpected'.");
    }
}
//# sourceMappingURL=TestUtil.js.map