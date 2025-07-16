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
const IInsightFacade_1 = require("./IInsightFacade");
const InsightFacadeAggregationHelperFunctions_1 = __importStar(require("./InsightFacadeAggregationHelperFunctions"));
const SortHelper_1 = require("./SortHelper");
const fieldMappings = {
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
class InsightFacadeHelperFunctions extends InsightFacadeAggregationHelperFunctions_1.default {
    datasetId = "";
    evaluateFilter(filter, section) {
        if (filter.length === 0) {
            throw new IInsightFacade_1.InsightError("filter length is 0");
        }
        if (Object.keys(filter).length > 1) {
            throw new IInsightFacade_1.InsightError("more than 1 key");
        }
        if ("AND" in filter) {
            const subFilters = filter.AND;
            this.checkLength(subFilters);
            return subFilters.every((subFilter) => this.evaluateFilter(subFilter, section));
        }
        if ("OR" in filter) {
            const subFilters = filter.OR;
            this.checkLength(subFilters);
            return subFilters.some((subFilter) => this.evaluateFilter(subFilter, section));
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
            return this.isFilter(filter, section);
        }
        if ("NOT" in filter) {
            return !this.evaluateFilter(filter.NOT, section);
        }
        throw new IInsightFacade_1.InsightError("No filter matched");
    }
    checkLength(subFilter) {
        if (subFilter.length === 0) {
            throw new IInsightFacade_1.InsightError("filter cannot be empty");
        }
        return true;
    }
    checkValidField(field) {
        if (!validFields.includes(field)) {
            throw new IInsightFacade_1.InsightError("invalid field");
        }
        return true;
    }
    applyTransformationsAndOptions(query, filteredData) {
        let resultData = [];
        if (typeof query.TRANSFORMATIONS === "object") {
            const transKeys = this.getTransformationKeys(query.TRANSFORMATIONS);
            let aggregatedData = this.applyTransformationsClause(query.TRANSFORMATIONS, filteredData);
            if (aggregatedData.length > 0) {
                aggregatedData = aggregatedData[0];
            }
            resultData = this.applyOptionsClause(query.OPTIONS, aggregatedData, transKeys);
        }
        else {
            resultData = this.applyOptionsClause(query.OPTIONS, filteredData);
        }
        return resultData;
    }
    isFilter(filter, section) {
        const field = Object.keys(filter.IS)[0];
        (0, InsightFacadeAggregationHelperFunctions_1.checkUnderscoreCount)(field, 1);
        const newField = field.split("_")[1];
        this.checkValidField(newField);
        let mappedField = "";
        if (newField in fieldMappings && validFields.includes(newField)) {
            mappedField = fieldMappings[newField];
        }
        else {
            mappedField = newField;
        }
        const value = filter.IS[field];
        const currentId = field.split("_")[0];
        if (this.datasetId === "") {
            this.datasetId = currentId;
        }
        else if (this.datasetId !== currentId) {
            throw new IInsightFacade_1.InsightError("more than 1 id");
        }
        if (value === "**" || value === "*" || value === "") {
            return true;
        }
        return this.evaluateStringComparison(String(section[mappedField]), value);
    }
    ltFilter(filter, section) {
        const field = Object.keys(filter.LT)[0];
        (0, InsightFacadeAggregationHelperFunctions_1.checkUnderscoreCount)(field, 1);
        const value = filter.LT[field];
        let finalField = "";
        if (field.split("_")[1] in fieldMappings && validFields.includes(field.split("_")[1])) {
            finalField = fieldMappings[field.split("_")[1]];
        }
        else {
            finalField = field.split("_")[1];
            this.checkValidField(finalField);
        }
        const currentId = field.split("_")[0];
        if (this.datasetId === "") {
            this.datasetId = currentId;
        }
        else if (this.datasetId !== currentId) {
            throw new IInsightFacade_1.InsightError("more than 1 id");
        }
        if (typeof value !== "number") {
            throw new IInsightFacade_1.InsightError("invalid type in LT");
        }
        const sectionField = section[finalField];
        if (typeof sectionField !== "number") {
            throw new IInsightFacade_1.InsightError("invalid style in LT");
        }
        return sectionField < value;
    }
    gtFilter(filter, section) {
        const field = Object.keys(filter.GT)[0];
        (0, InsightFacadeAggregationHelperFunctions_1.checkUnderscoreCount)(field, 1);
        const value = filter.GT[field];
        let finalField = "";
        if (field.split("_")[1] in fieldMappings && validFields.includes(field.split("_")[1])) {
            finalField = fieldMappings[field.split("_")[1]];
        }
        else {
            finalField = field.split("_")[1];
            this.checkValidField(finalField);
        }
        const currentId = field.split("_")[0];
        if (this.datasetId === "") {
            this.datasetId = currentId;
        }
        else if (this.datasetId !== currentId) {
            throw new IInsightFacade_1.InsightError("more than 1 id");
        }
        if (typeof value !== "number") {
            throw new IInsightFacade_1.InsightError("invalid type in GT");
        }
        const sectionField = section[finalField];
        if (typeof sectionField !== "number") {
            throw new IInsightFacade_1.InsightError("invalid style in GT");
        }
        return sectionField > value;
    }
    eqFilter(filter, section) {
        const field = Object.keys(filter.EQ)[0];
        (0, InsightFacadeAggregationHelperFunctions_1.checkUnderscoreCount)(field, 1);
        const value = filter.EQ[field];
        let finalField = "";
        if (field.split("_")[1] in fieldMappings && validFields.includes(field.split("_")[1])) {
            finalField = fieldMappings[field.split("_")[1]];
        }
        else {
            finalField = field.split("_")[1];
            this.checkValidField(finalField);
        }
        const currentId = field.split("_")[0];
        if (this.datasetId === "") {
            this.datasetId = currentId;
        }
        else if (this.datasetId !== currentId) {
            throw new IInsightFacade_1.InsightError("more than 1 id");
        }
        if (typeof value !== "number") {
            throw new IInsightFacade_1.InsightError("invalid type in EQ");
        }
        const sectionField = section[finalField];
        if (typeof sectionField !== "number") {
            throw new IInsightFacade_1.InsightError("invalid style in EQ");
        }
        return sectionField === value;
    }
    evaluateStringComparison(fieldValue, comparisonValue) {
        if (comparisonValue === "") {
            comparisonValue = "*";
        }
        if (!fieldValue || typeof fieldValue !== "string") {
            return false;
        }
        if (comparisonValue.includes("**") && comparisonValue !== "**") {
            throw new IInsightFacade_1.InsightError("Consecutive asterisks '**' are not allowed in the comparison string.");
        }
        if (comparisonValue.includes("*") && !comparisonValue.startsWith("*") && !comparisonValue.endsWith("*")) {
            throw new IInsightFacade_1.InsightError("Asterisk '*' is only allowed at the beginning or end of the comparison string.");
        }
        if (comparisonValue.startsWith("*") && comparisonValue.endsWith("*")) {
            const strippedValue = comparisonValue.slice(1, -1);
            return fieldValue.includes(strippedValue);
        }
        else if (comparisonValue.startsWith("*")) {
            const strippedValue = comparisonValue.slice(1);
            return fieldValue.endsWith(strippedValue);
        }
        else if (comparisonValue.endsWith("*")) {
            const strippedValue = comparisonValue.slice(0, -1);
            return fieldValue.startsWith(strippedValue);
        }
        else {
            return fieldValue === comparisonValue;
        }
    }
    getApplyFields(transformations) {
        for (const applyRule of transformations.APPLY) {
            const applyOperation = Object.values(applyRule)[0];
            const field = Object.values(applyOperation)[0];
            return field;
        }
        return "";
    }
    applyTransformationsClause(trans, filteredData) {
        const apply = trans.APPLY;
        const groupKeys = trans.GROUP;
        const groupedData = this.groupData(filteredData, groupKeys);
        return groupedData.map((group) => this.applyAggregations(group, groupKeys, apply));
    }
    applyOptionsClause(options, data, transKeys = null) {
        const validOptionsKeys = ["COLUMNS", "ORDER"];
        Object.keys(options).forEach((key) => {
            if (!validOptionsKeys.includes(key)) {
                throw new IInsightFacade_1.InsightError(`Invalid key '${key}' in OPTIONS. Only 'COLUMNS' and 'ORDER' are allowed.`);
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
            (0, SortHelper_1.sortResults)(results, order, columns);
        }
        return results;
    }
    mapDataToColumns(data, columns, transKeys = null) {
        return data.map((section) => {
            const result = {};
            columns.forEach((key) => {
                if (transKeys) {
                    this.handleTransKeys(key, section, transKeys, result);
                }
                else {
                    this.handleRegularKeys(key, section, result);
                }
            });
            this.datasetId = "";
            return result;
        });
    }
}
exports.default = InsightFacadeHelperFunctions;
//# sourceMappingURL=InsightFacadeHelperFunctions.js.map