"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortResults = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
function sortResults(results, order, columns) {
    if (typeof order === "string") {
        validateSingleKeyOrder(order, columns);
        sortBySingleKey(results, order);
    }
    else if (isComplexOrder(order)) {
        validateComplexOrder(order, columns);
        sortByMultipleKeys(results, order);
    }
    else {
        throw new IInsightFacade_1.InsightError(`Invalid order format`);
    }
}
exports.sortResults = sortResults;
function validateSingleKeyOrder(orderKey, columns) {
    if (!columns.includes(orderKey)) {
        throw new IInsightFacade_1.InsightError(`Sort key must be in columns.`);
    }
}
function validateComplexOrder(order, columns) {
    for (const key of order.keys) {
        if (!columns.includes(key)) {
            throw new IInsightFacade_1.InsightError(`Sort key must be in columns.`);
        }
    }
}
function sortBySingleKey(results, key) {
    results.sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0));
}
function sortByMultipleKeys(results, order) {
    const { dir, keys } = order;
    results.sort((a, b) => {
        for (const key of keys) {
            if (a[key] > b[key]) {
                return dir === "UP" ? 1 : -1;
            }
            if (a[key] < b[key]) {
                return dir === "UP" ? -1 : 1;
            }
        }
        return 0;
    });
}
function isComplexOrder(order) {
    return typeof order === "object" && "dir" in order && "keys" in order;
}
//# sourceMappingURL=SortHelper.js.map