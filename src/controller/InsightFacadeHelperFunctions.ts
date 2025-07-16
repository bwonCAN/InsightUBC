import { InsightError, InsightResult } from "./IInsightFacade";
import { Section } from "./Section";
import InsightFacadeAggregationHelperFunctions, {
	checkUnderscoreCount,
} from "./InsightFacadeAggregationHelperFunctions";
import { Room } from "./Room";
import { sortResults } from "./SortHelper";

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

export default class InsightFacadeHelperFunctions extends InsightFacadeAggregationHelperFunctions {
	protected datasetId: String = "";
	protected evaluateFilter(filter: any, section: Section | Room): boolean {
		//type SectionField = keyof Section;
		if (filter.length === 0) {
			throw new InsightError("filter length is 0");
		}
		if (Object.keys(filter).length > 1) {
			throw new InsightError("more than 1 key");
		}
		if ("AND" in filter) {
			const subFilters = filter.AND;
			this.checkLength(subFilters);
			return subFilters.every((subFilter: any) => this.evaluateFilter(subFilter, section));
		}
		if ("OR" in filter) {
			const subFilters = filter.OR;
			this.checkLength(subFilters);
			return subFilters.some((subFilter: any) => this.evaluateFilter(subFilter, section));
		}
		if ("LT" in filter) {
			return this.ltFilter(filter, section);
		}
		if ("GT" in filter) {
			return this.gtFilter(filter, section);
		}
		if ("EQ" in filter) {
			return this.eqFilter(filter, section);
		}

		if ("IS" in filter) {
			//console.log(section);
			return this.isFilter(filter, section);
		}

		if ("NOT" in filter) {
			return !this.evaluateFilter(filter.NOT, section);
		}
		throw new InsightError("No filter matched");
	}
	protected checkLength(subFilter: any): boolean {
		if (subFilter.length === 0) {
			throw new InsightError("filter cannot be empty");
		}
		return true;
	}

	protected checkValidField(field: string): boolean {
		if (!validFields.includes(field)) {
			throw new InsightError("invalid field");
		}
		return true;
	}

	protected applyTransformationsAndOptions(query: any, filteredData: any): any {
		let resultData = [];
		if (typeof query.TRANSFORMATIONS === "object") {
			const transKeys = this.getTransformationKeys(query.TRANSFORMATIONS);
			let aggregatedData = this.applyTransformationsClause(query.TRANSFORMATIONS, filteredData);
			if (aggregatedData.length > 0) {
				aggregatedData = aggregatedData[0]; // If any transformation data exists, get the first result
			}
			resultData = this.applyOptionsClause(query.OPTIONS, aggregatedData, transKeys);
		} else {
			resultData = this.applyOptionsClause(query.OPTIONS, filteredData);
		}
		return resultData;
	}

	protected isFilter(filter: any, section: any): boolean {
		type SectionField = keyof Section | keyof Room;
		const field = Object.keys(filter.IS)[0] as SectionField;
		checkUnderscoreCount(field, 1);
		const newField = field.split("_")[1] as SectionField;
		this.checkValidField(newField);
		let mappedField = "";
		if (newField in fieldMappings && validFields.includes(newField)) {
			mappedField = fieldMappings[newField];
		} else {
			mappedField = newField;
		}

		const value = filter.IS[field];
		const currentId = field.split("_")[0];
		if (this.datasetId === "") {
			this.datasetId = currentId;
		} else if (this.datasetId !== currentId) {
			// error getting thrown here when not supposed to (Max Min Sum Avg)
			throw new InsightError("more than 1 id");
		}
		if (value === "**" || value === "*" || value === "") {
			return true;
		}
		return this.evaluateStringComparison(String(section[mappedField as keyof Section | keyof Room]), value);
	}

	protected ltFilter(filter: any, section: any): boolean {
		type SectionField = keyof Section | keyof Room;
		const field = Object.keys(filter.LT)[0] as SectionField;
		checkUnderscoreCount(field, 1);
		const value = filter.LT[field];
		let finalField = "";

		if (field.split("_")[1] in fieldMappings && validFields.includes(field.split("_")[1])) {
			finalField = fieldMappings[field.split("_")[1]] as SectionField;
		} else {
			finalField = field.split("_")[1];
			this.checkValidField(finalField);
		}

		const currentId = field.split("_")[0];
		if (this.datasetId === "") {
			this.datasetId = currentId;
		} else if (this.datasetId !== currentId) {
			throw new InsightError("more than 1 id");
		}
		if (typeof value !== "number") {
			throw new InsightError("invalid type in LT");
		}
		const sectionField = section[finalField as keyof Section | keyof Room];

		if (typeof sectionField !== "number") {
			throw new InsightError("invalid style in LT");
		}
		return sectionField < value;
	}
	protected gtFilter(filter: any, section: any): boolean {
		type SectionField = keyof Section | keyof Room;

		//const field = fieldMappings[(Object.keys(filter.LT)[0]).split("_")[1]] as SectionField;
		const field = Object.keys(filter.GT)[0] as SectionField;

		checkUnderscoreCount(field, 1);
		const value = filter.GT[field];
		//const finalField = fieldMappings[field.split("_")[1]] as SectionField;
		let finalField = "";

		if (field.split("_")[1] in fieldMappings && validFields.includes(field.split("_")[1])) {
			finalField = fieldMappings[field.split("_")[1]] as SectionField;
		} else {
			finalField = field.split("_")[1];
			this.checkValidField(finalField);
		}
		const currentId = field.split("_")[0];
		if (this.datasetId === "") {
			this.datasetId = currentId;
		} else if (this.datasetId !== currentId) {
			throw new InsightError("more than 1 id");
		}
		if (typeof value !== "number") {
			throw new InsightError("invalid type in GT");
		}
		const sectionField = section[finalField as keyof Section | keyof Room];
		//console.log(sectionField);
		if (typeof sectionField !== "number") {
			throw new InsightError("invalid style in GT");
		}
		return sectionField > value;
	}

	protected eqFilter(filter: any, section: any): boolean {
		type SectionField = keyof Section | keyof Room;
		const field = Object.keys(filter.EQ)[0] as SectionField;
		checkUnderscoreCount(field, 1);
		const value = filter.EQ[field];
		//const finalField = fieldMappings[field.split("_")[1]] as SectionField;
		let finalField = "";
		if (field.split("_")[1] in fieldMappings && validFields.includes(field.split("_")[1])) {
			finalField = fieldMappings[field.split("_")[1]] as SectionField;
		} else {
			finalField = field.split("_")[1];
			this.checkValidField(finalField);
		}
		const currentId = field.split("_")[0];
		if (this.datasetId === "") {
			this.datasetId = currentId;
		} else if (this.datasetId !== currentId) {
			throw new InsightError("more than 1 id");
		}
		if (typeof value !== "number") {
			throw new InsightError("invalid type in EQ");
		}
		const sectionField = section[finalField as keyof Section | keyof Room];
		if (typeof sectionField !== "number") {
			throw new InsightError("invalid style in EQ");
		}
		return sectionField === value;
	}

	// protected checkUnderscoreCount(field: string, maxAllowed: number): void {
	// 	const underscoreCount = (field.match(/_/g) || []).length;
	// 	if (underscoreCount > maxAllowed) {
	// 		throw new InsightError(`Field "${field}" contains more than ${maxAllowed} underscore(s).`);
	// 	}
	// }

	protected evaluateStringComparison(fieldValue: string, comparisonValue: string): boolean {
		// console.log(`Comparing strings: fieldValue = "${fieldValue}", comparisonValue = "${comparisonValue}"`);

		if (comparisonValue === "") {
			comparisonValue = "*";
		}
		if (!fieldValue || typeof fieldValue !== "string") {
			// console.log("Field value is not a string.");
			return false;
		}

		if (comparisonValue.includes("**") && comparisonValue !== "**") {
			throw new InsightError("Consecutive asterisks '**' are not allowed in the comparison string.");
		}

		if (comparisonValue.includes("*") && !comparisonValue.startsWith("*") && !comparisonValue.endsWith("*")) {
			throw new InsightError("Asterisk '*' is only allowed at the beginning or end of the comparison string.");
		}

		if (comparisonValue.startsWith("*") && comparisonValue.endsWith("*")) {
			const strippedValue = comparisonValue.slice(1, -1);
			// console.log(`Wildcard *value*: checking if "${fieldValue}" includes "${strippedValue}"`);
			return fieldValue.includes(strippedValue);
		} else if (comparisonValue.startsWith("*")) {
			const strippedValue = comparisonValue.slice(1);
			// console.log(`Wildcard *value: checking if "${fieldValue}" ends with "${strippedValue}"`);
			return fieldValue.endsWith(strippedValue);
		} else if (comparisonValue.endsWith("*")) {
			const strippedValue = comparisonValue.slice(0, -1);
			// console.log(`Wildcard value*: checking if "${fieldValue}" starts with "${strippedValue}"`);
			return fieldValue.startsWith(strippedValue);
		} else {
			// console.log(`Exact match: checking if "${fieldValue}" === "${comparisonValue}"`);
			return fieldValue === comparisonValue;
		}
	}

	// protected applyTransformationsClause(trans: any, filteredData: any[]): any[] {
	// 	const apply = trans.APPLY;
	// 	const groupKeys = trans.GROUP;
	// 	//groups based on group field
	// 	const groupedData = this.groupData(filteredData, groupKeys);
	// 	return groupedData.map((group) => this.applyAggregations(group, groupKeys, apply));
	// }
	protected getApplyFields(transformations: any): string {
		for (const applyRule of transformations.APPLY) {
			const applyOperation = Object.values(applyRule)[0] as Record<string, string>;
			const field = Object.values(applyOperation)[0];
			return field;
		}
		return "";
	}
	protected applyTransformationsClause(trans: any, filteredData: any[]): any[] {
		const apply = trans.APPLY;
		const groupKeys = trans.GROUP;
		//groups based on group field
		const groupedData = this.groupData(filteredData, groupKeys);
		return groupedData.map((group) => this.applyAggregations(group, groupKeys, apply));
	}

	protected applyOptionsClause(options: any, data: any[], transKeys: string[] | null = null): InsightResult[] {
		const validOptionsKeys = ["COLUMNS", "ORDER"];

		Object.keys(options).forEach((key) => {
			if (!validOptionsKeys.includes(key)) {
				throw new InsightError(`Invalid key '${key}' in OPTIONS. Only 'COLUMNS' and 'ORDER' are allowed.`);
			}
		});
		const columns = options.COLUMNS;
		const order = options.ORDER;
		this.validateOrderInColumns(order, columns);
		if (transKeys) {
			this.validateColumnsInTrans(transKeys, columns);
		}
		const results = this.mapDataToColumns(data, columns, transKeys);
		if (order) {
			sortResults(results, order, columns);
		}

		return results;
	}

	protected mapDataToColumns(data: any[], columns: string[], transKeys: string[] | null = null): any[] {
		return data.map((section) => {
			const result: any = {};
			columns.forEach((key: string) => {
				if (transKeys) {
					this.handleTransKeys(key, section, transKeys, result);
				} else {
					this.handleRegularKeys(key, section, result);
				}
			});
			this.datasetId = "";
			return result;
		});
	}
}
