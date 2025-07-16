import { InsightError } from "./IInsightFacade";

// export function sortResults(
// 	results: any[],
// 	order:
// 		| string
// 		| {
// 				dir: "UP" | "DOWN";
// 				keys: string[];
// 		  },
// 	columns: string[]
// ): void {
// 	if (typeof order === "string") {
// 		if (!columns.includes(order)) {
// 			throw new InsightError(`Sort key must be in columns.`);
// 		}
// 		results.sort((a, b) => (a[order] < b[order] ? -1 : a[order] > b[order] ? 1 : 0));
// 	} else if (typeof order === "object" && order.dir && order.keys) {
// 		const { dir, keys } = order;
// 		for (const key of keys) {
// 			if (!columns.includes(key)) {
// 				throw new InsightError(`Sort key must be in columns.`);
// 			}
// 		}
// 		results.sort((a, b) => {
// 			for (const key of keys) {
// 				if (a[key] > b[key]) {
// 					return dir === "UP" ? 1 : -1;
// 				}
// 				if (a[key] < b[key]) {
// 					return dir === "UP" ? -1 : 1;
// 				}
// 			}
// 			return 0;
// 		});
// 	} else {
// 		throw new InsightError(`Invalid order format`);
// 	}
// }

export function sortResults(
	results: any[],
	order:
		| string
		| {
				dir: "UP" | "DOWN";
				keys: string[];
		  },
	columns: string[]
): void {
	if (typeof order === "string") {
		validateSingleKeyOrder(order, columns);
		sortBySingleKey(results, order);
	} else if (isComplexOrder(order)) {
		validateComplexOrder(order, columns);
		sortByMultipleKeys(results, order);
	} else {
		throw new InsightError(`Invalid order format`);
	}
}

function validateSingleKeyOrder(orderKey: string, columns: string[]): void {
	if (!columns.includes(orderKey)) {
		throw new InsightError(`Sort key must be in columns.`);
	}
}

function validateComplexOrder(order: { dir: "UP" | "DOWN"; keys: string[] }, columns: string[]): void {
	for (const key of order.keys) {
		if (!columns.includes(key)) {
			throw new InsightError(`Sort key must be in columns.`);
		}
	}
}

function sortBySingleKey(results: any[], key: string): void {
	results.sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0));
}

function sortByMultipleKeys(results: any[], order: { dir: "UP" | "DOWN"; keys: string[] }): void {
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

function isComplexOrder(order: any): order is { dir: "UP" | "DOWN"; keys: string[] } {
	return typeof order === "object" && "dir" in order && "keys" in order;
}
