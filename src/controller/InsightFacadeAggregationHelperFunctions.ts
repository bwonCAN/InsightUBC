import { InsightError, InsightResult } from "./IInsightFacade";
import { Section } from "./Section";
import { Room } from "./Room";
import Decimal from "decimal.js";

const fieldMappings: Record<string, string> = {
	avg: "Avg",
	dept: "Subject",
	id: "Course",
	uuid: "ID",
	title: "Title",
	fail: "Fail",
	pass: "Pass",
	audit: "Audit",
	year: "Year",
	instructor: "Professor",
	shortname: "shortName",
	fullname: "fullName",
};

const validFields = [
	"avg",
	"year",
	"dept",
	"id",
	"pass",
	"fail",
	"audit",
	"uuid",
	"instructor",
	"title",
	"fullname",
	"shortname",
	"number",
	"name",
	"address",
	"lat",
	"lon",
	"seats",
	"type",
	"furniture",
	"href",
];

export default class InsightFacadeAggregationHelperFunctions {
	protected max(group: InsightResult[], field: string): number {
		// if (typeof group === "string") {
		// 	throw new InsightError("wrong type");
		// }
		return Math.max(...group.map((item: Record<string, any>) => item[field]));
	}

	protected min(group: InsightResult[], field: string): number {
		// if (typeof group === "string") {
		// 	throw new InsightError("wrong type");
		// }
		return Math.min(...group.map((item: Record<string, any>) => item[field]));
	}

	protected avg(group: InsightResult[], field: string): number {
		// const sum = this.sum(group, field);
		// return sum / group.length;
		const decimal = 2;
		let total = new Decimal(0);
		for (const item of group) {
			total = total.add(new Decimal(item[field] as number));
		}
		const avg = total.toNumber() / group.length;
		const res = Number(avg.toFixed(decimal));

		return res;
	}
	// numRows might fix it noted

	protected sum(group: InsightResult[], field: string): number {
		const decimal = 2;
		const total = group.reduce((acc, item) => acc + (item[field] as number), 0);
		return Number(total.toFixed(decimal));
	}

	protected countUnique(group: InsightResult[], field: string): number {
		const uniqueItems = new Set(group.map((item) => item[field]));
		return Number(uniqueItems.size);
	}

	protected validateFieldType(operation: string, group: InsightResult[], field: string): void {
		if (["MAX", "MIN", "AVG", "SUM"].includes(operation) && typeof group[0][field] !== "number") {
			throw new InsightError(`Operation requires numeric field`);
		}
	}

	protected getTransformationKeys(transformations: any): string[] {
		const keys = new Set<string>();
		for (const groupKey of transformations.GROUP) {
			keys.add(groupKey.split("_")[1]);
		}
		for (const applyRule of transformations.APPLY) {
			const applyKey = Object.keys(applyRule)[0];

			keys.add(applyKey);
		}
		return Array.from(keys);
	}

	protected mapGroupedData(
		data: any[],
		groupKeys: string[]
	): Map<string, { items: any[]; keyValues: Record<string, any> }> {
		const groupedData = new Map<string, { items: any[]; keyValues: Record<string, any> }>();
		for (const item of data) {
			const mappedGroupKeys = groupKeys.map((key) => {
				let keyPart = key;
				if (key.includes("_")) {
					keyPart = key.split("_")[1];
				}
				if (keyPart in fieldMappings) {
					return fieldMappings[keyPart];
				}
				return keyPart;
			});
			const groupKey = mappedGroupKeys
				.map((mappedKey) => {
					return item[mappedKey];
				})
				.join("_");
			const keyValues = Object.fromEntries(
				mappedGroupKeys.map((mappedKey, index) => [groupKeys[index], item[mappedKey]])
			);
			if (!groupedData.has(groupKey)) {
				groupedData.set(groupKey, { items: [], keyValues });
			}

			groupedData.get(groupKey)!.items.push(item);
		}
		return groupedData;
	}

	protected getGroupKey(section: any, groupKeys: string[]): string {
		return groupKeys
			.map((key) => {
				// Map to the actual field name in data, or fall back to the original key if no mapping exists
				const actualField = fieldMappings[key] || key;
				return section[actualField as keyof Section | keyof Room];
			})
			.join("-");
	}
	protected handleTransKeys(key: string, section: any, transKeys: string[], result: any): any {
		const field = key as keyof Section | keyof Room;
		this.validateTransField(field, transKeys);
		let mappedField = "";

		if (validFields.includes(field.split("_")[1])) {
			mappedField = field;
			if (fieldMappings[field.split("_")[1]] === "ID") {
				return (result[key] = String(section[mappedField as keyof Section | keyof Room]));
			} else {
				return (result[key] = section[mappedField as keyof Section | keyof Room]);
			}
		} else {
			//mappedField = field;
			return (result[key] = section[field]);
		}

		//return result[key] = section[mappedField as keyof Section | keyof Room];
	}
	protected groupData(data: any[], keys: string[]): any[][] {
		const groups = new Map<string, any[]>();

		for (const section of data) {
			const groupKey = this.getGroupKey(section, keys);
			// If group key doesn't exist, initialize an empty array
			if (!groups.has(groupKey)) {
				groups.set(groupKey, []);
			}
			groups.get(groupKey)!.push(section);
		}
		return Array.from(groups.values());
	}
	protected validateNonString(group: InsightResult[], field: string): void {
		if (typeof group[0][field] === "string" || field === "ID") {
			throw new InsightError("wrong type");
		}
	}
	protected handleRegularKeys(key: string, section: any, result: any): any {
		const field = this.extractField(key);
		this.validateField(field);

		const mappedField = fieldMappings[field];

		if (mappedField === "ID") {
			result[key] = String(section[mappedField as keyof Section | keyof Room]);
		} else {
			if (field in fieldMappings) {
				result[key] = section[mappedField as keyof Section | keyof Room];
			} else {
				result[key] = section[field];
			}
		}
	}
	protected applyOperations(operation: string, group: InsightResult[], field: string): number {
		// const decimalPlace = 2;

		switch (operation) {
			case "MAX":
				this.validateNonString(group, field);
				return this.max(group, field);
			case "MIN":
				this.validateNonString(group, field);
				return this.min(group, field);
			case "AVG":
				this.validateNonString(group, field);
				return this.avg(group, field);
			case "SUM":
				this.validateNonString(group, field);
				return this.sum(group, field);
			case "COUNT":
				return this.countUnique(group, field);
			default:
				throw new InsightError(`Invalid operation: ${operation}`);
		}
	}

	protected applyAggregations(data: any[], groupKeys: string[], applyRules: any[]): any[] {
		const groupedData = this.mapGroupedData(data, groupKeys);
		const results = [];
		for (const { items: group, keyValues } of groupedData.values()) {
			const result: any = { ...keyValues };
			const uniqueApplyKeys = new Set<string>();
			for (const rule of applyRules) {
				const applyKey = Object.keys(rule)[0];
				const operation = Object.keys(rule[applyKey])[0];
				let field = rule[applyKey][operation];
				if (uniqueApplyKeys.has(applyKey)) {
					throw new InsightError(`Duplicate apply key`);
				}
				uniqueApplyKeys.add(applyKey);

				if (field.split("_")[1] in fieldMappings && validFields.includes(field.split("_")[1])) {
					field = fieldMappings[field.split("_")[1]];
				} else {
					field = field.split("_")[1];
				}
				//validate numeric field for non count
				this.validateFieldType(operation, group, field);
				result[applyKey] = this.applyOperations(operation, group, field);
			}

			results.push(result);
		}

		return results;
	}

	protected validateOrderInColumns(order: any, columns: string[]): void {
		if (!order) {
			return;
		}
		if (typeof order === "string") {
			if (!columns.includes(order)) {
				throw new InsightError("Order key not in columns");
			}
		} else if (typeof order === "object" && order.dir && Array.isArray(order.keys)) {
			const { dir, keys } = order;
			if (dir !== "UP" && dir !== "DOWN") {
				throw new InsightError("Invalid direction in order.");
			}
			for (const key of keys) {
				if (!columns.includes(key)) {
					throw new InsightError(`Order key not in columns`);
				}
			}
		} else {
			throw new InsightError("Invalid order format.");
		}
	}
	protected validateColumnsInTrans(trans: any, columns: string[]): void {
		for (let key of columns) {
			if (key.includes("_")) {
				key = key.split("_")[1];
			}
			if (!trans.includes(key)) {
				throw new InsightError(`Column not in in group/apply`);
			}
		}
	}

	protected validateField(field: keyof Section | keyof Room): void {
		if (!validFields.includes(field)) {
			throw new InsightError("invalid field");
		}
	}
	protected extractField(key: string): keyof Section | keyof Room {
		return key.includes("_") ? (key.split("_")[1] as keyof Section | keyof Room) : (key as keyof Section | keyof Room);
	}

	protected lowercaseKeys(obj: any): any {
		const lower: any = {};
		for (const key in obj) {
			lower[key.toLowerCase()] = obj[key];
		}
		return lower;
	}

	protected validateTransField(field: keyof Section | keyof Room, transField: any): void {
		// console.log(field);
		if (field.includes("_")) {
			this.validateField(field.split("_")[1] as keyof Section | keyof Room);
		} else {
			if (!transField.includes(field)) {
				throw new InsightError("invalid field");
			}
		}
	}
	protected applyTransformationsClause(trans: any, filteredData: any[]): any[] {
		const apply = trans.APPLY;
		const groupKeys = trans.GROUP;
		//groups based on group field
		const groupedData = this.groupData(filteredData, groupKeys);
		return groupedData.map((group) => this.applyAggregations(group, groupKeys, apply));
	}
}

export function checkUnderscoreCount(field: string, maxAllowed: number): void {
	const underscoreCount = (field.match(/_/g) || []).length;
	if (underscoreCount > maxAllowed) {
		throw new InsightError(`Field "${field}" contains more than ${maxAllowed} underscore(s).`);
	}
}
