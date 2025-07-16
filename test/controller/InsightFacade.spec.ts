import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

// "//A" above a test case means that test case could have been assisted by ChatGPT

describe("InsightFacade", function () {
	let facade: IInsightFacade;
	let facade2: IInsightFacade;
	let facade3: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let validSet: string;
	let noCoursesFolder: string;
	let emptyCourses: string;
	let noJSON: string;
	let invalidResult: string;
	let emptyResults: string;
	let emptyZIP: string;
	let invalidPath: string;
	let noValidSection: string;
	let emptyStringValid: string;
	let oneValidSection: string;
	let twoValidSections: string;
	let oneValidCourse: string;
	let only9Queries: string;
	let campus: string;
	let noIndex: string;
	// let noBuildingFiles: string;
	// let uneditedIndex: string;
	let removedLink: string;
	let smallValidRoom: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		validSet = await getContentFromArchives("validSet.zip");
		noCoursesFolder = await getContentFromArchives("noCoursesFolder.zip");
		emptyCourses = await getContentFromArchives("noCourses.zip");
		noJSON = await getContentFromArchives("noJSON.zip");
		invalidResult = await getContentFromArchives("invalidResult.zip");
		emptyResults = await getContentFromArchives("emptyResults.zip");
		emptyZIP = await getContentFromArchives("emptyZIP.zip");
		invalidPath = await getContentFromArchives("invalidPath.zip");
		noValidSection = await getContentFromArchives("noValidSection.zip");
		emptyStringValid = await getContentFromArchives("emptyStringValid.zip");
		oneValidSection = await getContentFromArchives("1course1valid1invalid.zip");
		twoValidSections = await getContentFromArchives("2validSections.zip");
		oneValidCourse = await getContentFromArchives("1validcourse1invalidcourse.zip");
		only9Queries = await getContentFromArchives("1courseOnly9Q.zip");
		campus = await getContentFromArchives("campus.zip");
		noIndex = await getContentFromArchives("campus_no_index.zip");
		// noBuildingFiles = await getContentFromArchives("noBuildingFiles.zip");
		// uneditedIndex = await getContentFromArchives("smallRoomUneditedIndex.zip");
		removedLink = await getContentFromArchives("removedLink.zip");
		smallValidRoom = await getContentFromArchives("smallValidRoom.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		// Brian
		it("campus no index", async function () {
			const result = facade.addDataset("valid", noIndex, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with invalid Kind (using sections)", function () {
			const result = facade.addDataset("validID", campus, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// it("should pass with no buildings", function () {
		// 	const result = facade.addDataset("validID", noBuildingFiles, InsightDatasetKind.Rooms);
		// 	return expect(result).to.eventually.have.members(["validID"]);
		// });

		// it("should pass with 1 deleted building", function () {
		// 	const result = facade.addDataset("validID", uneditedIndex, InsightDatasetKind.Rooms);
		// 	return expect(result).to.eventually.have.members(["validID"]);
		// });

		it("should fail with removed link", function () {
			const result = facade.addDataset("validID", removedLink, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// end

		it("adding 1 valid roomset", async () => {
			const result = await facade.addDataset("room1", campus, InsightDatasetKind.Rooms);
			return expect(result).to.have.members(["room1"]);
		});

		it("adding 3 valid roomsets", async () => {
			await facade.addDataset("room1", campus, InsightDatasetKind.Rooms);
			await facade.addDataset("room2", campus, InsightDatasetKind.Rooms);
			const result = await facade.addDataset("room3", campus, InsightDatasetKind.Rooms);
			return expect(result).to.have.members(["room1", "room2", "room3"]);
		});

		it("adding 1 small valid roomset", async () => {
			const result = await facade.addDataset("smallValid", smallValidRoom, InsightDatasetKind.Rooms);
			return expect(result).to.have.members(["smallValid"]);
		});

		it("should reject with an empty dataset id", function () {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should accept and add a small valid dataset", function () {
			const result = facade.addDataset("validSet", validSet, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["validSet"]);
		});

		it("should successfully add a large valid dataset", function () {
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		it("should reject with an underscore in id", function () {
			const result = facade.addDataset("my_dataset", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should accept with whitespace in id", function () {
			const result = facade.addDataset("my  dataset", validSet, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["my  dataset"]);
		});

		it("should reject with only whitespace in id", function () {
			const result = facade.addDataset("  ", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject duplicate id", async function () {
			await facade.addDataset("dupId", sections, InsightDatasetKind.Sections);
			const result = facade.addDataset("dupId", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if not a base64 string", function () {
			const result = facade.addDataset("invalid", "invalid_content", InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		//A
		it("should reject if base64 but not a zip", function () {
			const result = Buffer.from("notzip").toString("base64");
			const result2 = facade.addDataset("notzip", result, InsightDatasetKind.Sections);
			return expect(result2).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject ZIP with no courses folder", function () {
			const result = facade.addDataset("validID", noCoursesFolder, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject ZIP with empty courses folder", function () {
			const result = facade.addDataset("validID", emptyCourses, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject ZIP with no JSON files", function () {
			const result = facade.addDataset("validID", noJSON, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject ZIP with invalid result key", function () {
			const result = facade.addDataset("validID", invalidResult, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject ZIP with empty results", function () {
			const result = facade.addDataset("validID", emptyResults, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject empty ZIP", function () {
			const result = facade.addDataset("validID", emptyZIP, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject ZIP with invalid path", function () {
			const result = facade.addDataset("validID", invalidPath, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject ZIP with no valid section", function () {
			const result = facade.addDataset("validID", noValidSection, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should accept ZIP with 1 valid section", function () {
			const result = facade.addDataset("validSection", oneValidSection, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["validSection"]);
		});

		it("should accept ZIP with 2 valid sections", function () {
			const result = facade.addDataset("validSections", twoValidSections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["validSections"]);
		});

		it("should accept ZIP with 1 valid course and 1 invalid course", function () {
			const result = facade.addDataset("validCourse", oneValidCourse, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["validCourse"]);
		});

		it("should accept ZIP with Valid Query as empty strings", function () {
			const result = facade.addDataset("validID", emptyStringValid, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["validID"]);
		});

		it("should accept 2 valid datasets with unique IDs", async function () {
			await facade.addDataset("id1", validSet, InsightDatasetKind.Sections);
			const result = facade.addDataset("id2", validSet, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["id1", "id2"]);
		});

		it("should reject ZIP with 1 course and only 9 valid queries (not 10)", function () {
			const result = facade.addDataset("validID", only9Queries, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with invalid Kind (using rooms)", function () {
			const result = facade.addDataset("validID", validSet, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});
	describe("Persistence/caching", function () {
		facade = new InsightFacade();
		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});
		// it("Should delete the 2 added datasets with facade2", async function () {
		// 	await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
		// 	await facade.addDataset("validID2", validSet, InsightDatasetKind.Sections);
		// 	facade2 = new InsightFacade();
		// 	await expect(facade2.removeDataset("validID")).to.eventually.equal("validID");
		// 	await expect(facade2.removeDataset("validID2")).to.eventually.equal("validID2");
		// 	const datasets = await facade2.listDatasets();
		// 	expect(datasets.map((d) => d.id)).to.not.include("validID");
		// 	return expect(datasets.map((d) => d.id)).to.not.include("validID2");
		// });

		it("Should remove with 3rd facade instance", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			//await facade.addDataset("validID2", validSet, InsightDatasetKind.Sections);
			facade2 = new InsightFacade();
			await expect(facade2.removeDataset("validID")).to.eventually.equal("validID");
			await facade2.addDataset("validID2", validSet, InsightDatasetKind.Sections);
			const datasets = await facade2.listDatasets();
			expect(datasets.map((d) => d.id)).to.not.include("validID");
			facade3 = new InsightFacade();
			await expect(facade3.removeDataset("validID2")).to.eventually.equal("validID2");
			const dataset3 = await facade3.listDatasets();
			return expect(dataset3.map((d) => d.id)).to.not.include("validID2");
		});

		it("Should reject adding the same dataset with facade2", async function () {
			await facade.addDataset("dupId", sections, InsightDatasetKind.Sections);
			facade2 = new InsightFacade();
			const result2 = facade2.addDataset("dupId", sections, InsightDatasetKind.Sections);
			return expect(result2).to.eventually.be.rejectedWith(InsightError);
		});

		it("should list a single dataset after add from facade2", async function () {
			facade = new InsightFacade();
			await facade.addDataset("validID", sections, InsightDatasetKind.Sections);
			facade2 = new InsightFacade();
			const result = await facade2.listDatasets();
			expect(result).to.have.lengthOf(1);
			return expect(result[0]).to.deep.include({
				id: "validID",
				kind: InsightDatasetKind.Sections,
				numRows: 64612,
			});
		});
	});

	describe("RemoveDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should reject with an empty dataset id (remove method)", function () {
			const result = facade.removeDataset("");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an empty dataset id after 1 set has been added", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			const result = facade.removeDataset("");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a dataset id with underscore after 1 set has been added", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			const result = facade.removeDataset("valid_ID");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a dataset id with only whitespace after 1 set has been added", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			const result = facade.removeDataset("  ");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		//A
		it("should accept valid add then remove that same id", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			await facade.removeDataset("validID");
			const datasets = await facade.listDatasets();
			return expect(datasets.map((d) => d.id)).to.not.include("validID");
		});

		it("should accept valid add then remove that same id #2", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			return expect(facade.removeDataset("validID")).to.eventually.equal("validID");
		});

		it("should reject when removing right away", function () {
			const result = facade.removeDataset("validID");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("should accept 2 valid adds then remove one id", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			await facade.addDataset("validID2", validSet, InsightDatasetKind.Sections);
			await expect(facade.removeDataset("validID")).to.eventually.equal("validID");
			const datasets = await facade.listDatasets();
			expect(datasets.map((d) => d.id)).to.include("validID2");
			return expect(datasets.map((d) => d.id)).to.not.include("validID");
		});

		it("should reject 2 valid adds then remove different id", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			await facade.addDataset("validID2", validSet, InsightDatasetKind.Sections);
			await expect(facade.removeDataset("validID3")).to.eventually.be.rejectedWith(NotFoundError);
			const datasets = await facade.listDatasets();
			expect(datasets.map((d) => d.id)).to.include("validID");
			return expect(datasets.map((d) => d.id)).to.include("validID2");
		});

		it("should accept 2 valid adds then remove those 2 ids", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			await facade.addDataset("validID2", validSet, InsightDatasetKind.Sections);
			await expect(facade.removeDataset("validID")).to.eventually.equal("validID");
			await expect(facade.removeDataset("validID2")).to.eventually.equal("validID2");
			const datasets = await facade.listDatasets();
			expect(datasets.map((d) => d.id)).to.not.include("validID");
			return expect(datasets.map((d) => d.id)).to.not.include("validID2");
		});

		it("should accept 1 add then 1 remove (twice && same id)", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			await expect(facade.removeDataset("validID")).to.eventually.equal("validID");
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			await expect(facade.removeDataset("validID")).to.eventually.equal("validID");
			const datasets = await facade.listDatasets();
			return expect(datasets.map((d) => d.id)).to.not.include("validID");
		});

		it("should accept 1 add then 1 remove (twice && different ids)", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			await expect(facade.removeDataset("validID")).to.eventually.equal("validID");
			await facade.addDataset("validID2", validSet, InsightDatasetKind.Sections);
			await expect(facade.removeDataset("validID2")).to.eventually.equal("validID2");
			const datasets = await facade.listDatasets();
			expect(datasets.map((d) => d.id)).to.not.include("validID");
			return expect(datasets.map((d) => d.id)).to.not.include("validID2");
		});

		it("should reject 1 add then 2 removes", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			await expect(facade.removeDataset("validID")).to.eventually.equal("validID");
			return expect(facade.removeDataset("validID")).to.eventually.be.rejectedWith(NotFoundError);
		});
	});

	describe("ListDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		//A
		it("should return an empty array with no datasets added", async function () {
			const result = await facade.listDatasets();
			return expect(result).to.be.an("array").that.is.empty;
		});

		//A
		it("should list a single dataset after add", async function () {
			await facade.addDataset("validID", sections, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			expect(result).to.have.lengthOf(1);
			return expect(result[0]).to.deep.include({
				id: "validID",
				kind: InsightDatasetKind.Sections,
				numRows: 64612,
			});
		});

		it("should list a single dataset after add Rooms", async function () {
			await facade.addDataset("validID", campus, InsightDatasetKind.Rooms);
			const result = await facade.listDatasets();
			expect(result).to.have.lengthOf(1);
			return expect(result[0]).to.deep.include({
				id: "validID",
				kind: InsightDatasetKind.Rooms,
				numRows: 364,
			});
		});

		it("should list a single dataset after Rooms add", async function () {
			await facade.addDataset("validID", campus, InsightDatasetKind.Rooms);
			const result = await facade.listDatasets();
			expect(result).to.have.lengthOf(1);
			return expect(result[0]).to.deep.include({
				id: "validID",
				kind: InsightDatasetKind.Rooms,
				numRows: 364,
			});
		});

		it("should list 2 different datasets after Rooms and Sections add", async function () {
			await facade.addDataset("validID", campus, InsightDatasetKind.Rooms);
			await facade.addDataset("validID2", sections, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			// expect(result).to.have.lengthOf(2);
			expect(result[0]).to.deep.include({
				id: "validID",
				kind: InsightDatasetKind.Rooms,
				numRows: 364,
			});
			return expect(result[1]).to.deep.include({
				id: "validID2",
				kind: InsightDatasetKind.Sections,
				numRows: 64612,
			});
		});

		it("should list two datasets after they are added", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			await facade.addDataset("validID2", sections, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			expect(result[1]).to.deep.include({
				id: "validID2",
				kind: InsightDatasetKind.Sections,
				numRows: 64612,
			});
			return expect(result.map((d) => d.id)).to.include.members(["validID", "validID2"]);
		});

		it("should not list a dataset after it is removed", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			await facade.removeDataset("validID");
			const result = await facade.listDatasets();
			return expect(result).to.be.an("array").that.is.empty;
		});

		it("should list the correct datasets after adding and removing", async function () {
			await facade.addDataset("validID1", validSet, InsightDatasetKind.Sections);
			await facade.addDataset("validID2", validSet, InsightDatasetKind.Sections);
			await facade.removeDataset("validID1");
			const result = await facade.listDatasets();
			expect(result).to.have.lengthOf(1);
			return expect(result[0].id).to.equal("validID2");
		});

		it("should list a dataset after removing and re-adding the same dataset", async function () {
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			await facade.removeDataset("validID");
			await facade.addDataset("validID", validSet, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			expect(result).to.have.lengthOf(1);
			return expect(result[0].id).to.equal("validID");
		});

		it("should list no datasets after adding and removing", async function () {
			await facade.addDataset("validID1", validSet, InsightDatasetKind.Sections);
			await facade.addDataset("validID2", validSet, InsightDatasetKind.Sections);
			await facade.removeDataset("validID1");
			await facade.removeDataset("validID2");
			const result = await facade.listDatasets();
			return expect(result).to.be.an("array").that.is.empty;
		});
	});

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[];
			try {
				result = await facade.performQuery(input);
				if (this.test.title === "[valid/noOrder.json] no order test") {
					facade2 = new InsightFacade();
					result = await facade2.performQuery(input);
				}
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				// return expect.fail("Write your assertion(s) here."); // TODO: replace with your assertions
				// expect(err).to.be.instanceOf(Error);
				// return;
				if (err instanceof InsightError) {
					expect(err).to.be.instanceOf(InsightError);
				} else {
					expect(err).to.be.instanceOf(ResultTooLargeError);
				}
				return;
			}
			if (errorExpected) {
				expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
			}
			// return expect.fail("Write your assertion(s) here."); // TODO: replace with your assertions
			expect(result).to.deep.equal(expected);
			return;
		}

		before(async function () {
			const timeoutExt = 10000;
			this.timeout(timeoutExt);
			facade = new InsightFacade();
			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
				facade.addDataset("validSet", validSet, InsightDatasetKind.Sections),
				facade.addDataset("twoValidSections", twoValidSections, InsightDatasetKind.Sections),
				//facade.addDataset("validID2", validSet, InsightDatasetKind.Sections),
				facade.addDataset("rooms", campus, InsightDatasetKind.Rooms),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
			// const loadDatasetPromises2: Promise<string[]>[] = [
			// 	// facade.addDataset("sections", sections, InsightDatasetKind.Sections),
			// 	facade.addDataset("validSet", validSet, InsightDatasetKind.Sections),
			// 	// facade.addDataset("twoValidSections", twoValidSections, InsightDatasetKind.Sections)
			// ];

			// try {
			// 	await Promise.all(loadDatasetPromises2);
			// } catch (err) {
			// 	throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			// }
			// const loadDatasetPromises3: Promise<string[]>[] = [
			// 	// facade.addDataset("sections", sections, InsightDatasetKind.Sections),
			// 	// facade.addDataset("validSet", validSet, InsightDatasetKind.Sections),
			// 	facade.addDataset("twoValidSections", twoValidSections, InsightDatasetKind.Sections)
			// ];

			// try {
			// 	await Promise.all(loadDatasetPromises3);
			// } catch (err) {
			// 	throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			// }
		});

		after(async function () {
			await clearDisk();
		});
		//it("[valid/twoGroup.json] two fields in group", checkQuery); // two groups
		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery);
		it("[valid/LTcase.json] SELECT dept, avg WHERE avg < 50", checkQuery);
		it("[valid/eQcase.json] SELECT dept, avg WHERE avg = 65", checkQuery);
		it("[valid/isCase.json] only cpsc should show", checkQuery);
		it("[valid/startsWitha.json] a* should show", checkQuery);
		it("[valid/endsWithb.json] *b should show", checkQuery);
		it("[valid/containsOL.json] *ol* should show", checkQuery);
		it("[valid/noOrder.json] no order test", checkQuery);
		it("[valid/andTest.json] AND test", checkQuery);
		it("[valid/orTest.json] OR test", checkQuery);
		it("[valid/andOrTest.json] AND OR test", checkQuery);
		it("[valid/notTest.json] not test", checkQuery);
		it("[valid/EQorCase.json] EQorCase test", checkQuery);
		it("[valid/asteriksValid.json] Asteriks valid and test", checkQuery);
		//it("[valid/uuidTest.json] not test", checkQuery); //commented out because ordering issues
		//it("[valid/resultNotTooBigEdge.json] Query result is slightly under 5000", checkQuery);
		//it("[valid/result5000.json] Query result is 5000", checkQuery);

		it("[invalid/invalid.json] Query missing WHERE", checkQuery);
		it("[invalid/notAnObject.json] Query not an object", checkQuery);
		it("[invalid/twoKeys.json] Query has 2 keys", checkQuery);
		it("[invalid/resultTooBig.json] Query result too big", checkQuery);
		it("[invalid/resultTooBigEdge.json] Query result is slightly over 5000", checkQuery);
		it("[invalid/invalidOrder.json] invalid Order", checkQuery);
		it("[invalid/invalidField.json] invalid field", checkQuery);
		it("[invalid/emptyQuery.json] empty Query", checkQuery);
		it("[invalid/notTestTooBig.json] result too large", checkQuery);
		it("[invalid/invalidKey.json] invalid key", checkQuery);
		it("[invalid/orderKeyNotInColumns.json] order key not in columns", checkQuery);
		it("[invalid/invalidCombo.json] invalid and or combo", checkQuery);
		it("[invalid/invalidTypeInGT.json] used a string instead of a number", checkQuery);
		it("[invalid/invalidTypeInIS.json] used a number instead of a string", checkQuery);
		it("[invalid/invalidSet.json] unknown dataset id used", checkQuery);
		it("[invalid/invalidOrderKey.json] order key not in columns", checkQuery);
		it("[invalid/emptyColumns.json] empty columns", checkQuery);
		it("[invalid/asteriksError.json] asteriks Error", checkQuery);
		it("[invalid/underscoreError.json] underscore Error", checkQuery);
		it("[invalid/multipleDatabase.json] multiple keys of dataset", checkQuery);
		it("[invalid/moreThanOneSet.json] more than 1 set is referenced", checkQuery);
		it("[invalid/notObject.json] query is a number", checkQuery);
		it("[invalid/invalidNotObject.json] query is a string", checkQuery);
		it("[invalid/missingOptions.json] missing options", checkQuery);
		it("[invalid/missingKeyInWhere.json] missing key in where", checkQuery);
		it("[invalid/andZeroKey.json] and is missing key in where", checkQuery);
		it("[invalid/andIsEmptyArray.json] and is empty array", checkQuery);
		it("[invalid/notZeroKeys.json] not has 0 keys", checkQuery);
		it("[invalid/isZeroKeys.json] is has 0 keys", checkQuery);
		it("[invalid/columnsEmptyArray.json] columns is empty array", checkQuery);
		it("[invalid/optionsMissingColumns.json] options is missing columns", checkQuery);

		it("[valid/emptyWhere.json] empty Where", checkQuery);
		//it("[valid/complexValid.json] complex Valid", checkQuery);
		it("[valid/emptyResult.json] empty result", checkQuery);
		it("[valid/avgEqualZero.json] avg equal zero", checkQuery);
		it("[valid/contradictCase.json] contradict case", checkQuery);

		//---------------- Aggregation tests -------------------
		// -- basic tests
		it("[valid/aggregationTest.json] Aggregation functionality test", checkQuery); //functionality
		it("[valid/minAgg.json] Aggregation minimum test", checkQuery); //min
		it("[valid/maxAgg.json] Aggregation maximum test", checkQuery); //max
		it("[valid/countAgg.json] count aggregation test", checkQuery); //count
		it("[valid/countNotNum.json] count not number test", checkQuery); //count on non numeric field
		it("[valid/avgAgg.json] average aggregation", checkQuery); //avg
		it("[valid/avgAgg2.json] average aggregation 2", checkQuery); //avg
		it("[valid/sumAgg.json] sum aggregation", checkQuery); // sum
		it("[valid/complexRooms.json] Aggregation rooms test", checkQuery); //rooms
		it("[valid/complexAgg2.json] Aggregation complex test", checkQuery); //rooms2
		it("[valid/complexAgg3.json] Aggregation complex test", checkQuery); //rooms3
		it("[valid/complexAgg4.json] Aggregation complex test", checkQuery); //rooms3
		it("[valid/complexAgg5.json] Aggregation complex test", checkQuery); //rooms3
		it("[valid/complexAgg6.json] Aggregation complex test", checkQuery); //rooms3
		it("[valid/complexAgg7.json] Aggregation complex test", checkQuery); //rooms3

		it("[valid/aggRoomFields.json] aggregation fields for room", checkQuery); //more rooms tests

		// -- edge tests
		it("[valid/twoApply.json] two apply aggregations", checkQuery); //two apply
		it("[invalid/twoApplyKeys.json] two duplicate apply aggregations", checkQuery); // too dupe apply names
		it("[invalid/columnNotGroup.json] column keys not group", checkQuery); //column keys not in group
		it("[invalid/transformationMissingApply.json] missing apply field in aggregation", checkQuery); // missing apply
		it("[invalid/aggString.json] max on non numeric field", checkQuery); // agg on non numeric
		it("[invalid/emptyAggstring.json] Agg string is empty", checkQuery); // agg on non numeric
		it("[invalid/noApplyKey.json] Agg string is empty", checkQuery); // agg on non numeric
		it("[invalid/dupApply.json] Agg string is empty", checkQuery); // agg on non numeric
		it("[invalid/sumNotNumeric.json] sum has non numeric key", checkQuery); //minmaxavgsum on non numeric key
		it("[invalid/emptyGroup.json] Group empty", checkQuery); //group empty
		it("[invalid/maxuuid.json] uuid should not be able to be used with max", checkQuery); //no uuid in max

		//---------------- Sorting tests -------------------
		it("[valid/advSorting.json] advanced sorting test", checkQuery);
		it("[valid/sortingTiebreak.json] Sorting tiebreak test", checkQuery);
		it("[valid/sortingTiebreak2.json] Sorting tiebreak test 2", checkQuery);
		it("[valid/transformationWithRooms.json] trans with Rooms", checkQuery);
		it("[valid/sortingTiebreak3.json] Sorting tiebreak test 3", checkQuery);
		it("[invalid/orderNotColumns2.json] order keys not in columns", checkQuery);
		it("[invalid/invalidDir.json] invalid Direction", checkQuery);
		it("[invalid/invalidKeysInOrder.json] invalid keys in Order", checkQuery);

		it("[invalid/transformationMissingApply.json] missing apply field in aggregation", checkQuery);

		// Brian
		it("[invalid/duplicateApplyKey.json] missing duplicate apply key", checkQuery);
		it("[invalid/duplicateApplySimple.json] simple missing duplicate apply key", checkQuery);
		it("[invalid/invalidColumnKeyWithGroup.json] invalid column key with group", checkQuery);
		it("[invalid/invalidKeyTypeAvg.json] invalid avg", checkQuery);
		it("[invalid/invalidKeyTypeMax.json] invalid Max", checkQuery);
		it("[invalid/invalidKeyTypeMin.json] invalid Min", checkQuery);
		it("[invalid/invalidKeyTypeSort.json] invalid Sort", checkQuery);
		it("[invalid/multipleSortKeysNotInColumn.json] multiple sort keys not in columns", checkQuery);
		it("[invalid/sortKeyNotInColumns.json] sort key not in columns", checkQuery);
		//---------------- Room tests -------------------
		it("[valid/roomFields.json] All room fields functionality test", checkQuery); //room keys test
	});
});
