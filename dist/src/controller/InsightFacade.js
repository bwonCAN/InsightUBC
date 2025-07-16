"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const jszip_1 = __importDefault(require("jszip"));
const Section_1 = require("./Section");
const fs_extra_1 = __importDefault(require("fs-extra"));
const InsightFacadeHelperFunctions_1 = __importDefault(require("./InsightFacadeHelperFunctions"));
const path_1 = __importDefault(require("path"));
const RoomsHelpers_1 = require("./RoomsHelpers");
class InsightFacade extends InsightFacadeHelperFunctions_1.default {
    datasets = [];
    overallEquivalent = 1900;
    maxReturnEntries = 5000;
    datasetCache = new Map();
    async addDataset(id, content, kind) {
        if (!id || id.trim().length === 0 || id.includes("_")) {
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid id"));
        }
        await this.checkIfDatasetExists(id);
        const data = this.decodeBase64Content(content);
        const zip = await this.loadZip(data);
        let validData;
        try {
            if (kind === IInsightFacade_1.InsightDatasetKind.Sections) {
                validData = await this.processSet(zip);
            }
            else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
                validData = await (0, RoomsHelpers_1.processRooms)(zip);
            }
            else {
                return Promise.reject(new IInsightFacade_1.InsightError("Invalid Kind"));
            }
        }
        catch (error) {
            return Promise.reject(new IInsightFacade_1.InsightError(error.message));
        }
        if (validData.length === 0) {
            return Promise.reject(new IInsightFacade_1.InsightError("No valid data found"));
        }
        await this.storeDatasetToDisk(id, validData);
        this.datasetCache.set(id, validData);
        const newDataset = {
            id: id,
            kind: kind,
            numRows: validData.length,
        };
        this.datasets.push(newDataset);
        return Promise.resolve(this.datasets.map((dataset) => dataset.id));
    }
    async checkIfDatasetExists(id) {
        const filePath = path_1.default.join(`data/`, `${id}.json`);
        const pathExists = await fs_extra_1.default.pathExists(filePath);
        if (pathExists) {
            return Promise.reject(new IInsightFacade_1.InsightError("Dataset already exists on disk"));
        }
    }
    decodeBase64Content(content) {
        try {
            return Buffer.from(content, "base64");
        }
        catch (error) {
            throw new IInsightFacade_1.InsightError(error.message);
        }
    }
    async loadZip(data) {
        try {
            return await jszip_1.default.loadAsync(data);
        }
        catch (error) {
            return Promise.reject(new IInsightFacade_1.InsightError(error.message));
        }
    }
    async storeDatasetToDisk(id, data) {
        const dataPath = path_1.default.resolve("data");
        try {
            await fs_extra_1.default.ensureDir(dataPath);
            const filePath = `data/${id}.json`;
            await fs_extra_1.default.writeJson(filePath, data);
        }
        catch (error) {
            return Promise.reject(new IInsightFacade_1.InsightError(error.message));
        }
    }
    async processSet(zip) {
        const sections = [];
        const folder = zip.folder("courses/");
        if (!folder) {
            return Promise.reject(new IInsightFacade_1.InsightError("No courses folder"));
        }
        const files = folder.filter((_relativePath, file) => file.name.endsWith(".json") || !file.name.includes("."));
        const readFilesPromises = files.map(async (file) => {
            const content = await file.async("string");
            let parsed;
            try {
                parsed = JSON.parse(content);
            }
            catch {
                return [];
            }
            if (parsed && Array.isArray(parsed.result)) {
                return parsed.result
                    .filter((section) => this.isValidSection(section))
                    .map((section) => this.makeSection(section));
            }
            return [];
        });
        const results = await Promise.all(readFilesPromises);
        sections.push(...results.flat());
        return sections;
    }
    makeSection(section) {
        let secYear;
        if (section.Section === "overall") {
            secYear = Number(this.overallEquivalent);
        }
        else {
            secYear = Number(section.Year);
        }
        return new Section_1.Section(section.id, section.Course, section.Title, section.Professor, section.Subject, secYear, section.Avg, section.Pass, section.Fail, section.Audit);
    }
    isValidSection(section) {
        return (section &&
            (typeof section.id === "number" || typeof section.id === "string") &&
            (typeof section.Course === "number" || typeof section.Course === "string") &&
            (typeof section.Title === "number" || typeof section.Title === "string") &&
            (typeof section.Professor === "number" || typeof section.Professor === "string") &&
            (typeof section.Subject === "number" || typeof section.Subject === "string") &&
            (typeof section.Year === "number" || typeof section.Year === "string") &&
            (typeof section.Avg === "number" || typeof section.Avg === "string") &&
            (typeof section.Pass === "number" || typeof section.Pass === "string") &&
            (typeof section.Fail === "number" || typeof section.Fail === "string") &&
            (typeof section.Audit === "number" || typeof section.Audit === "string"));
    }
    async removeDataset(id) {
        if (!id || id.trim().length === 0 || id.includes("_")) {
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid id"));
        }
        const filePath = `data/${id}.json`;
        const datasetExistsOnDisk = await fs_extra_1.default.pathExists(filePath);
        if (!datasetExistsOnDisk) {
            return Promise.reject(new IInsightFacade_1.NotFoundError("Dataset not found on disk"));
        }
        const datasetIndex = this.datasets.findIndex((dataset) => dataset.id === id);
        if (datasetIndex !== -1) {
            this.datasets.splice(datasetIndex, 1);
        }
        try {
            await fs_extra_1.default.remove(filePath);
            this.datasetCache.delete(id);
        }
        catch (error) {
            return Promise.reject(new IInsightFacade_1.InsightError("Error removing dataset from disk: " + error.message));
        }
        return Promise.resolve(id);
    }
    async listDatasets() {
        const dataPath = path_1.default.resolve("data");
        try {
            await fs_extra_1.default.ensureDir(dataPath);
            const files = await fs_extra_1.default.readdir(dataPath);
            const datasetFiles = files.filter((file) => file.endsWith(".json"));
            const datasetPromises = datasetFiles.map(async (datasetFile) => {
                const filePath = path_1.default.join(dataPath, datasetFile);
                try {
                    const data = await fs_extra_1.default.readJson(filePath);
                    if (Array.isArray(data) && data.length > 0 && "ID" in data[0]) {
                        return {
                            id: path_1.default.basename(datasetFile, ".json"),
                            kind: IInsightFacade_1.InsightDatasetKind.Sections,
                            numRows: data.length,
                        };
                    }
                    else if (Array.isArray(data) && data.length > 0 && "fullName" in data[0]) {
                        return {
                            id: path_1.default.basename(datasetFile, ".json"),
                            kind: IInsightFacade_1.InsightDatasetKind.Rooms,
                            numRows: data.length,
                        };
                    }
                    else {
                        return Promise.reject(new IInsightFacade_1.InsightError("Unknown dataset structure"));
                    }
                }
                catch (_error) {
                    return Promise.reject(new IInsightFacade_1.InsightError("Error listing dataset"));
                }
            });
            const resolvedDatasets = await Promise.all(datasetPromises);
            return resolvedDatasets.filter((dataset) => dataset !== null);
        }
        catch (_error) {
            return Promise.reject(new IInsightFacade_1.InsightError("Error listing datasets from disk"));
        }
    }
    async performQuery(query) {
        try {
            this.validateQuery(query);
            const datasetId = this.extractDatasetId(query);
            let dataset;
            if (this.datasetCache.has(datasetId)) {
                dataset = this.datasetCache.get(datasetId);
            }
            else {
                dataset = await this.loadDatasetFromDisk(datasetId);
                this.datasetCache.set(datasetId, dataset);
            }
            const filteredData = this.applyWhereClause(query.WHERE, dataset);
            const resultData = this.applyTransformationsAndOptions(query, filteredData);
            if (resultData.length > this.maxReturnEntries) {
                return Promise.reject(new IInsightFacade_1.ResultTooLargeError("Result set exceeds the limit of 5000 entries"));
            }
            this.datasetId = "";
            return Promise.resolve(resultData);
        }
        catch (error) {
            this.datasetId = "";
            if (error instanceof IInsightFacade_1.ResultTooLargeError) {
                return Promise.reject(error);
            }
            return Promise.reject(new IInsightFacade_1.InsightError(error.message));
        }
    }
    validateQuery(query) {
        if (typeof query !== "object" || query === null) {
            throw new IInsightFacade_1.InsightError("Query must be an object");
        }
        if (!("WHERE" in query && "OPTIONS" in query)) {
            throw new IInsightFacade_1.InsightError("Query must contain WHERE and OPTIONS clauses");
        }
        this.validateWhere(query.WHERE);
        this.validateOptions(query.OPTIONS);
        if ("TRANSFORMATIONS" in query) {
            this.validateTransformations(query.TRANSFORMATIONS);
        }
    }
    validateWhere(where) {
        if (typeof where !== "object" || where === null || Array.isArray(where)) {
            throw new IInsightFacade_1.InsightError("The WHERE clause must be an object.");
        }
    }
    validateOptions(options) {
        if (typeof options !== "object" || !Array.isArray(options.COLUMNS) || options.COLUMNS.length === 0) {
            throw new IInsightFacade_1.InsightError("OPTIONS must be an object and must contain COLUMNS as an array");
        }
    }
    validateTransformations(transformations) {
        if (typeof transformations !== "object" ||
            !Array.isArray(transformations.GROUP) ||
            !Array.isArray(transformations.APPLY)) {
            throw new IInsightFacade_1.InsightError("TRANSFORMATIONS must be an object and must contain GROUP and APPLY as an array");
        }
    }
    extractDatasetId(query) {
        const columns = query.OPTIONS.COLUMNS;
        if (!columns || columns.length === 0) {
            throw new IInsightFacade_1.InsightError("COLUMNS must have at least one key");
        }
        const firstKey = columns[0];
        let datasetId = "";
        if (firstKey.includes("_")) {
            datasetId = firstKey.split("_")[0];
        }
        else if (Array.isArray(query.TRANSFORMATIONS.APPLY)) {
            datasetId = this.getApplyFields(query.TRANSFORMATIONS).split("_")[0];
        }
        if (!datasetId) {
            throw new IInsightFacade_1.InsightError("Invalid dataset ID");
        }
        return datasetId;
    }
    async loadDatasetFromDisk(datasetId) {
        const filePath = `data/${datasetId}.json`;
        try {
            const dataset = await fs_extra_1.default.readJson(filePath);
            return dataset;
        }
        catch (_error) {
            return Promise.reject(new IInsightFacade_1.InsightError(`Dataset ${datasetId} not found on disk`));
        }
    }
    applyWhereClause(where, dataset) {
        if (Object.keys(where).length === 0) {
            return dataset;
        }
        const filteredDataset = dataset.filter((section) => this.evaluateFilter(where, section));
        return filteredDataset;
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map