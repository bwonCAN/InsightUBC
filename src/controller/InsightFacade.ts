import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightResult,
	InsightError,
	ResultTooLargeError,
	NotFoundError,
} from "./IInsightFacade";
import JSZip from "jszip";
import { Section } from "./Section";
import fs from "fs-extra";
import InsightFacadeHelperFunctions from "./InsightFacadeHelperFunctions";
import path from "path";
import { Room } from "./Room";
import { processRooms } from "./RoomsHelpers";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

/**
 * Some functions are AI assisted
 */

export default class InsightFacade extends InsightFacadeHelperFunctions implements IInsightFacade {
	private datasets: InsightDataset[] = [];
	private overallEquivalent = 1900;
	private maxReturnEntries = 5000;
	private datasetCache: Map<string, any[]> = new Map<string, any[]>();

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!id || id.trim().length === 0 || id.includes("_")) {
			return Promise.reject(new InsightError("Invalid id"));
		}
		await this.checkIfDatasetExists(id);

		const data = this.decodeBase64Content(content);

		const zip = await this.loadZip(data);

		let validData: Section[] | Room[];
		try {
			if (kind === InsightDatasetKind.Sections) {
				validData = await this.processSet(zip);
			} else if (kind === InsightDatasetKind.Rooms) {
				validData = await processRooms(zip);
			} else {
				return Promise.reject(new InsightError("Invalid Kind"));
			}
		} catch (error) {
			return Promise.reject(new InsightError((error as Error).message));
		}
		if (validData.length === 0) {
			return Promise.reject(new InsightError("No valid data found"));
		}

		await this.storeDatasetToDisk(id, validData);
		this.datasetCache.set(id, validData);

		const newDataset: InsightDataset = {
			id: id,
			kind: kind,
			numRows: validData.length,
		};
		this.datasets.push(newDataset);
		return Promise.resolve(this.datasets.map((dataset) => dataset.id));
	}

	private async checkIfDatasetExists(id: string): Promise<void> {
		const filePath = path.join(`data/`, `${id}.json`);
		const pathExists = await fs.pathExists(filePath);

		if (pathExists) {
			return Promise.reject(new InsightError("Dataset already exists on disk"));
		}
		/*if (this.datasets.map((dataset) => dataset.id).includes(id)) {
			throw new InsightError("Dataset has already been added");
		}*/
	}

	private decodeBase64Content(content: string): Buffer {
		try {
			return Buffer.from(content, "base64");
		} catch (error) {
			throw new InsightError((error as Error).message);
		}
	}

	private async loadZip(data: Buffer): Promise<JSZip> {
		try {
			return await JSZip.loadAsync(data);
		} catch (error) {
			return Promise.reject(new InsightError((error as Error).message));
		}
	}

	private async storeDatasetToDisk(id: string, data: any): Promise<void> {
		// const filePath = `src/controller/datasets/${id}.json`;
		const dataPath = path.resolve("data");
		try {
			await fs.ensureDir(dataPath);
			const filePath = `data/${id}.json`;
			await fs.writeJson(filePath, data);
		} catch (error) {
			// const filePath = `data/${id}.json`;
			return Promise.reject(new InsightError((error as Error).message));
		}
	}

	private async processSet(zip: JSZip): Promise<Section[]> {
		const sections: Section[] = [];
		const folder = zip.folder("courses/");
		if (!folder) {
			return Promise.reject(new InsightError("No courses folder"));
		}
		const files = folder.filter((_relativePath, file) => file.name.endsWith(".json") || !file.name.includes("."));
		const readFilesPromises = files.map(async (file) => {
			const content = await file.async("string");
			let parsed: any;
			try {
				parsed = JSON.parse(content);
			} catch {
				return [];
			}
			if (parsed && Array.isArray(parsed.result)) {
				return parsed.result
					.filter((section: any) => this.isValidSection(section))
					.map((section: any) => this.makeSection(section));
			}
			return [];
		});
		const results = await Promise.all(readFilesPromises);
		sections.push(...results.flat());
		return sections;
	}

	private makeSection(section: any): Section {
		let secYear;

		if (section.Section === "overall") {
			secYear = Number(this.overallEquivalent);
		} else {
			secYear = Number(section.Year);
		}
		return new Section(
			section.id as string,
			section.Course,
			section.Title,
			section.Professor,
			section.Subject,
			secYear,
			section.Avg,
			section.Pass,
			section.Fail,
			section.Audit
		);
	}

	// private isValidSection(section: any): boolean {
	// 	return (
	// 		section &&
	// 		typeof section.id === "number" &&
	// 		typeof section.Course === "string" &&
	// 		typeof section.Title === "string" &&
	// 		typeof section.Professor === "string" &&
	// 		typeof section.Subject === "string" &&
	// 		(typeof section.Year === "string" || section.Year === "overall") &&
	// 		typeof section.Avg === "number" &&
	// 		typeof section.Pass === "number" &&
	// 		typeof section.Fail === "number" &&
	// 		typeof section.Audit === "number"
	// 	);
	// }

	private isValidSection(section: any): boolean {
		return (
			section &&
			(typeof section.id === "number" || typeof section.id === "string") &&
			(typeof section.Course === "number" || typeof section.Course === "string") &&
			(typeof section.Title === "number" || typeof section.Title === "string") &&
			(typeof section.Professor === "number" || typeof section.Professor === "string") &&
			(typeof section.Subject === "number" || typeof section.Subject === "string") &&
			(typeof section.Year === "number" || typeof section.Year === "string") &&
			(typeof section.Avg === "number" || typeof section.Avg === "string") &&
			(typeof section.Pass === "number" || typeof section.Pass === "string") &&
			(typeof section.Fail === "number" || typeof section.Fail === "string") &&
			(typeof section.Audit === "number" || typeof section.Audit === "string")
		);
	}

	public async removeDataset(id: string): Promise<string> {
		if (!id || id.trim().length === 0 || id.includes("_")) {
			return Promise.reject(new InsightError("Invalid id"));
		}
		const filePath = `data/${id}.json`;
		const datasetExistsOnDisk = await fs.pathExists(filePath);
		if (!datasetExistsOnDisk) {
			return Promise.reject(new NotFoundError("Dataset not found on disk"));
		}
		const datasetIndex = this.datasets.findIndex((dataset) => dataset.id === id);
		if (datasetIndex !== -1) {
			this.datasets.splice(datasetIndex, 1);
		}

		try {
			await fs.remove(filePath);
			this.datasetCache.delete(id);
		} catch (error) {
			return Promise.reject(new InsightError("Error removing dataset from disk: " + (error as Error).message));
		}

		return Promise.resolve(id);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		const dataPath = path.resolve("data");
		try {
			await fs.ensureDir(dataPath);
			const files = await fs.readdir(dataPath);
			const datasetFiles = files.filter((file) => file.endsWith(".json"));
			const datasetPromises = datasetFiles.map(async (datasetFile) => {
				const filePath = path.join(dataPath, datasetFile);
				try {
					const data = await fs.readJson(filePath);
					if (Array.isArray(data) && data.length > 0 && "ID" in data[0]) {
						return {
							id: path.basename(datasetFile, ".json"),
							kind: InsightDatasetKind.Sections,
							numRows: data.length,
						};
					} else if (Array.isArray(data) && data.length > 0 && "fullName" in data[0]) {
						return {
							id: path.basename(datasetFile, ".json"),
							kind: InsightDatasetKind.Rooms,
							numRows: data.length,
						};
					} else {
						return Promise.reject(new InsightError("Unknown dataset structure"));
					}
				} catch (_error) {
					return Promise.reject(new InsightError("Error listing dataset"));
				}
			});
			const resolvedDatasets = await Promise.all(datasetPromises);
			return resolvedDatasets.filter((dataset) => dataset !== null) as InsightDataset[];
		} catch (_error) {
			return Promise.reject(new InsightError("Error listing datasets from disk"));
		}
	}
	public async performQuery(query: any): Promise<InsightResult[]> {
		try {
			// console.log("Query received:", query);
			this.validateQuery(query);

			const datasetId = this.extractDatasetId(query);
			let dataset: Section[] | Room[];
			if (this.datasetCache.has(datasetId)) {
				dataset = this.datasetCache.get(datasetId)!;
			} else {
				dataset = await this.loadDatasetFromDisk(datasetId);
				this.datasetCache.set(datasetId, dataset);
			}

			const filteredData = this.applyWhereClause(query.WHERE, dataset);
			//console.log(aggregatedData[0]);
			// let resultData = [];
			// if (typeof query.TRANSFORMATIONS === "object") {
			// 	const transKeys = this.getTransformationKeys(query.TRANSFORMATIONS);
			// 	let aggregatedData = this.applyTransformationsClause(query.TRANSFORMATIONS, filteredData);
			// 	if (aggregatedData.length > 0) {
			// 		aggregatedData = aggregatedData[0];
			// 	}
			// 	resultData = this.applyOptionsClause(query.OPTIONS, aggregatedData, transKeys);
			// } else {
			// 	resultData = this.applyOptionsClause(query.OPTIONS, filteredData);
			// }
			const resultData = this.applyTransformationsAndOptions(query, filteredData);
			if (resultData.length > this.maxReturnEntries) {
				// return Promise.reject(new InsightError("Result set exceeds the limit of 5000 entries"));

				return Promise.reject(new ResultTooLargeError("Result set exceeds the limit of 5000 entries"));
			}
			this.datasetId = "";
			return Promise.resolve(resultData);
		} catch (error) {
			this.datasetId = "";
			if (error instanceof ResultTooLargeError) {
				// Propagate the specific error if it's a ResultTooLargeError
				return Promise.reject(error);
			}
			return Promise.reject(new InsightError((error as Error).message));
		}
	}

	private validateQuery(query: any): void {
		if (typeof query !== "object" || query === null) {
			throw new InsightError("Query must be an object");
		}

		if (!("WHERE" in query && "OPTIONS" in query)) {
			throw new InsightError("Query must contain WHERE and OPTIONS clauses");
		}

		this.validateWhere(query.WHERE);
		this.validateOptions(query.OPTIONS);
		if ("TRANSFORMATIONS" in query) {
			this.validateTransformations(query.TRANSFORMATIONS);
		}
	}

	private validateWhere(where: any): void {
		// if (typeof where !== "object") {
		// 	throw new InsightError("WHERE must be an object");
		// }
		if (typeof where !== "object" || where === null || Array.isArray(where)) {
			throw new InsightError("The WHERE clause must be an object.");
		}
	}
	private validateOptions(options: any): void {
		if (typeof options !== "object" || !Array.isArray(options.COLUMNS) || options.COLUMNS.length === 0) {
			throw new InsightError("OPTIONS must be an object and must contain COLUMNS as an array");
		}
	}
	private validateTransformations(transformations: any): void {
		if (
			typeof transformations !== "object" ||
			!Array.isArray(transformations.GROUP) ||
			!Array.isArray(transformations.APPLY)
		) {
			throw new InsightError("TRANSFORMATIONS must be an object and must contain GROUP and APPLY as an array");
		}
	}
	private extractDatasetId(query: any): string {
		const columns = query.OPTIONS.COLUMNS;
		if (!columns || columns.length === 0) {
			throw new InsightError("COLUMNS must have at least one key");
		}

		const firstKey = columns[0];

		let datasetId = "";
		if (firstKey.includes("_")) {
			datasetId = firstKey.split("_")[0];
		} else if (Array.isArray(query.TRANSFORMATIONS.APPLY)) {
			datasetId = this.getApplyFields(query.TRANSFORMATIONS).split("_")[0];
		}

		if (!datasetId) {
			throw new InsightError("Invalid dataset ID");
		}

		return datasetId;
	}
	private async loadDatasetFromDisk(datasetId: string): Promise<Section[] | Room[]> {
		// const filePath = `src/controller/datasets/${datasetId}.json`;
		const filePath = `data/${datasetId}.json`;
		try {
			const dataset = await fs.readJson(filePath);
			// console.log("Dataset fields:", Object.keys(dataset[0]));
			return dataset;
		} catch (_error) {
			return Promise.reject(new InsightError(`Dataset ${datasetId} not found on disk`));
		}
	}
	private applyWhereClause(where: any, dataset: any[]): any[] {
		if (Object.keys(where).length === 0) {
			return dataset;
		}
		const filteredDataset = dataset.filter((section) => this.evaluateFilter(where, section));
		return filteredDataset;
	}
}
