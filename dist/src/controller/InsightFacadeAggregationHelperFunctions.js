"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUnderscoreCount = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const decimal_js_1 = __importDefault(require("decimal.js"));
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
class InsightFacadeAggregationHelperFunctions {
    max(group, field) {
        return Math.max(...group.map((item) => item[field]));
    }
    min(group, field) {
        return Math.min(...group.map((item) => item[field]));
    }
    avg(group, field) {
        const decimal = 2;
        let total = new decimal_js_1.default(0);
        for (const item of group) {
            total = total.add(new decimal_js_1.default(item[field]));
        }
        const avg = total.toNumber() / group.length;
        const res = Number(avg.toFixed(decimal));
        return res;
    }
    sum(group, field) {
        const decimal = 2;
        const total = group.reduce((acc, item) => acc + item[field], 0);
        return Number(total.toFixed(decimal));
    }
    countUnique(group, field) {
        const uniqueItems = new Set(group.map((item) => item[field]));
        return Number(uniqueItems.size);
    }
    validateFieldType(operation, group, field) {
        if (["MAX", "MIN", "AVG", "SUM"].includes(operation) && typeof group[0][field] !== "number") {
            throw new IInsightFacade_1.InsightError(`Operation requires numeric field`);
        }
    }
    getTransformationKeys(transformations) {
        const keys = new Set();
        for (const groupKey of transformations.GROUP) {
            keys.add(groupKey.split("_")[1]);
        }
        for (const applyRule of transformations.APPLY) {
            const applyKey = Object.keys(applyRule)[0];
            keys.add(applyKey);
        }
        return Array.from(keys);
    }
    mapGroupedData(data, groupKeys) {
        const groupedData = new Map();
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
            const keyValues = Object.fromEntries(mappedGroupKeys.map((mappedKey, index) => [groupKeys[index], item[mappedKey]]));
            if (!groupedData.has(groupKey)) {
                groupedData.set(groupKey, { items: [], keyValues });
            }
            groupedData.get(groupKey).items.push(item);
        }
        return groupedData;
    }
    getGroupKey(section, groupKeys) {
        return groupKeys
            .map((key) => {
            const actualField = fieldMappings[key] || key;
            return section[actualField];
        })
            .join("-");
    }
    handleTransKeys(key, section, transKeys, result) {
        const field = key;
        this.validateTransField(field, transKeys);
        let mappedField = "";
        if (validFields.includes(field.split("_")[1])) {
            mappedField = field;
            if (fieldMappings[field.split("_")[1]] === "ID") {
                return (result[key] = String(section[mappedField]));
            }
            else {
                return (result[key] = section[mappedField]);
            }
        }
        else {
            return (result[key] = section[field]);
        }
    }
    groupData(data, keys) {
        const groups = new Map();
        for (const section of data) {
            const groupKey = this.getGroupKey(section, keys);
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(section);
        }
        return Array.from(groups.values());
    }
    validateNonString(group, field) {
        if (typeof group[0][field] === "string" || field === "ID") {
            throw new IInsightFacade_1.InsightError("wrong type");
        }
    }
    handleRegularKeys(key, section, result) {
        const field = this.extractField(key);
        this.validateField(field);
        const mappedField = fieldMappings[field];
        if (mappedField === "ID") {
            result[key] = String(section[mappedField]);
        }
        else {
            if (field in fieldMappings) {
                result[key] = section[mappedField];
            }
            else {
                result[key] = section[field];
            }
        }
    }
    applyOperations(operation, group, field) {
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
                throw new IInsightFacade_1.InsightError(`Invalid operation: ${operation}`);
        }
    }
    applyAggregations(data, groupKeys, applyRules) {
        const groupedData = this.mapGroupedData(data, groupKeys);
        const results = [];
        for (const { items: group, keyValues } of groupedData.values()) {
            const result = { ...keyValues };
            const uniqueApplyKeys = new Set();
            for (const rule of applyRules) {
                const applyKey = Object.keys(rule)[0];
                const operation = Object.keys(rule[applyKey])[0];
                let field = rule[applyKey][operation];
                if (uniqueApplyKeys.has(applyKey)) {
                    throw new IInsightFacade_1.InsightError(`Duplicate apply key`);
                }
                uniqueApplyKeys.add(applyKey);
                if (field.split("_")[1] in fieldMappings && validFields.includes(field.split("_")[1])) {
                    field = fieldMappings[field.split("_")[1]];
                }
                else {
                    field = field.split("_")[1];
                }
                this.validateFieldType(operation, group, field);
                result[applyKey] = this.applyOperations(operation, group, field);
            }
            results.push(result);
        }
        return results;
    }
    validateOrderInColumns(order, columns) {
        if (!order) {
            return;
        }
        if (typeof order === "string") {
            if (!columns.includes(order)) {
                throw new IInsightFacade_1.InsightError("Order key not in columns");
            }
        }
        else if (typeof order === "object" && order.dir && Array.isArray(order.keys)) {
            const { dir, keys } = order;
            if (dir !== "UP" && dir !== "DOWN") {
                throw new IInsightFacade_1.InsightError("Invalid direction in order.");
            }
            for (const key of keys) {
                if (!columns.includes(key)) {
                    throw new IInsightFacade_1.InsightError(`Order key not in columns`);
                }
            }
        }
        else {
            throw new IInsightFacade_1.InsightError("Invalid order format.");
        }
    }
    validateColumnsInTrans(trans, columns) {
        for (let key of columns) {
            if (key.includes("_")) {
                key = key.split("_")[1];
            }
            if (!trans.includes(key)) {
                throw new IInsightFacade_1.InsightError(`Column not in in group/apply`);
            }
        }
    }
    validateField(field) {
        if (!validFields.includes(field)) {
            throw new IInsightFacade_1.InsightError("invalid field");
        }
    }
    extractField(key) {
        return key.includes("_") ? key.split("_")[1] : key;
    }
    lowercaseKeys(obj) {
        const lower = {};
        for (const key in obj) {
            lower[key.toLowerCase()] = obj[key];
        }
        return lower;
    }
    validateTransField(field, transField) {
        if (field.includes("_")) {
            this.validateField(field.split("_")[1]);
        }
        else {
            if (!transField.includes(field)) {
                throw new IInsightFacade_1.InsightError("invalid field");
            }
        }
    }
    applyTransformationsClause(trans, filteredData) {
        const apply = trans.APPLY;
        const groupKeys = trans.GROUP;
        const groupedData = this.groupData(filteredData, groupKeys);
        return groupedData.map((group) => this.applyAggregations(group, groupKeys, apply));
    }
}
exports.default = InsightFacadeAggregationHelperFunctions;
function checkUnderscoreCount(field, maxAllowed) {
    const underscoreCount = (field.match(/_/g) || []).length;
    if (underscoreCount > maxAllowed) {
        throw new IInsightFacade_1.InsightError(`Field "${field}" contains more than ${maxAllowed} underscore(s).`);
    }
}
exports.checkUnderscoreCount = checkUnderscoreCount;
//# sourceMappingURL=InsightFacadeAggregationHelperFunctions.js.map