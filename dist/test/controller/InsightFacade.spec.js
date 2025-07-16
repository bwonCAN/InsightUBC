"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const TestUtil_1 = require("../TestUtil");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
describe("InsightFacade", function () {
    let facade;
    let facade2;
    let facade3;
    let sections;
    let validSet;
    let noCoursesFolder;
    let emptyCourses;
    let noJSON;
    let invalidResult;
    let emptyResults;
    let emptyZIP;
    let invalidPath;
    let noValidSection;
    let emptyStringValid;
    let oneValidSection;
    let twoValidSections;
    let oneValidCourse;
    let only9Queries;
    let campus;
    let noIndex;
    let removedLink;
    let smallValidRoom;
    before(async function () {
        sections = await (0, TestUtil_1.getContentFromArchives)("pair.zip");
        validSet = await (0, TestUtil_1.getContentFromArchives)("validSet.zip");
        noCoursesFolder = await (0, TestUtil_1.getContentFromArchives)("noCoursesFolder.zip");
        emptyCourses = await (0, TestUtil_1.getContentFromArchives)("noCourses.zip");
        noJSON = await (0, TestUtil_1.getContentFromArchives)("noJSON.zip");
        invalidResult = await (0, TestUtil_1.getContentFromArchives)("invalidResult.zip");
        emptyResults = await (0, TestUtil_1.getContentFromArchives)("emptyResults.zip");
        emptyZIP = await (0, TestUtil_1.getContentFromArchives)("emptyZIP.zip");
        invalidPath = await (0, TestUtil_1.getContentFromArchives)("invalidPath.zip");
        noValidSection = await (0, TestUtil_1.getContentFromArchives)("noValidSection.zip");
        emptyStringValid = await (0, TestUtil_1.getContentFromArchives)("emptyStringValid.zip");
        oneValidSection = await (0, TestUtil_1.getContentFromArchives)("1course1valid1invalid.zip");
        twoValidSections = await (0, TestUtil_1.getContentFromArchives)("2validSections.zip");
        oneValidCourse = await (0, TestUtil_1.getContentFromArchives)("1validcourse1invalidcourse.zip");
        only9Queries = await (0, TestUtil_1.getContentFromArchives)("1courseOnly9Q.zip");
        campus = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
        noIndex = await (0, TestUtil_1.getContentFromArchives)("campus_no_index.zip");
        removedLink = await (0, TestUtil_1.getContentFromArchives)("removedLink.zip");
        smallValidRoom = await (0, TestUtil_1.getContentFromArchives)("smallValidRoom.zip");
        await (0, TestUtil_1.clearDisk)();
    });
    describe("AddDataset", function () {
        beforeEach(function () {
            facade = new InsightFacade_1.default();
        });
        afterEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("campus no index", async function () {
            const result = facade.addDataset("valid", noIndex, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with invalid Kind (using sections)", function () {
            const result = facade.addDataset("validID", campus, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail with removed link", function () {
            const result = facade.addDataset("validID", removedLink, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("adding 1 valid roomset", async () => {
            const result = await facade.addDataset("room1", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.have.members(["room1"]);
        });
        it("adding 3 valid roomsets", async () => {
            await facade.addDataset("room1", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
            await facade.addDataset("room2", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
            const result = await facade.addDataset("room3", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.have.members(["room1", "room2", "room3"]);
        });
        it("adding 1 small valid roomset", async () => {
            const result = await facade.addDataset("smallValid", smallValidRoom, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.have.members(["smallValid"]);
        });
        it("should reject with an empty dataset id", function () {
            const result = facade.addDataset("", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should accept and add a small valid dataset", function () {
            const result = facade.addDataset("validSet", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["validSet"]);
        });
        it("should successfully add a large valid dataset", function () {
            const result = facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["ubc"]);
        });
        it("should reject with an underscore in id", function () {
            const result = facade.addDataset("my_dataset", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should accept with whitespace in id", function () {
            const result = facade.addDataset("my  dataset", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["my  dataset"]);
        });
        it("should reject with only whitespace in id", function () {
            const result = facade.addDataset("  ", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject duplicate id", async function () {
            await facade.addDataset("dupId", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = facade.addDataset("dupId", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject if not a base64 string", function () {
            const result = facade.addDataset("invalid", "invalid_content", IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject if base64 but not a zip", function () {
            const result = Buffer.from("notzip").toString("base64");
            const result2 = facade.addDataset("notzip", result, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result2).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject ZIP with no courses folder", function () {
            const result = facade.addDataset("validID", noCoursesFolder, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject ZIP with empty courses folder", function () {
            const result = facade.addDataset("validID", emptyCourses, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject ZIP with no JSON files", function () {
            const result = facade.addDataset("validID", noJSON, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject ZIP with invalid result key", function () {
            const result = facade.addDataset("validID", invalidResult, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject ZIP with empty results", function () {
            const result = facade.addDataset("validID", emptyResults, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject empty ZIP", function () {
            const result = facade.addDataset("validID", emptyZIP, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject ZIP with invalid path", function () {
            const result = facade.addDataset("validID", invalidPath, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject ZIP with no valid section", function () {
            const result = facade.addDataset("validID", noValidSection, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should accept ZIP with 1 valid section", function () {
            const result = facade.addDataset("validSection", oneValidSection, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["validSection"]);
        });
        it("should accept ZIP with 2 valid sections", function () {
            const result = facade.addDataset("validSections", twoValidSections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["validSections"]);
        });
        it("should accept ZIP with 1 valid course and 1 invalid course", function () {
            const result = facade.addDataset("validCourse", oneValidCourse, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["validCourse"]);
        });
        it("should accept ZIP with Valid Query as empty strings", function () {
            const result = facade.addDataset("validID", emptyStringValid, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["validID"]);
        });
        it("should accept 2 valid datasets with unique IDs", async function () {
            await facade.addDataset("id1", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = facade.addDataset("id2", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["id1", "id2"]);
        });
        it("should reject ZIP with 1 course and only 9 valid queries (not 10)", function () {
            const result = facade.addDataset("validID", only9Queries, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with invalid Kind (using rooms)", function () {
            const result = facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
    });
    describe("Persistence/caching", function () {
        facade = new InsightFacade_1.default();
        afterEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("Should remove with 3rd facade instance", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            facade2 = new InsightFacade_1.default();
            await (0, chai_1.expect)(facade2.removeDataset("validID")).to.eventually.equal("validID");
            await facade2.addDataset("validID2", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            const datasets = await facade2.listDatasets();
            (0, chai_1.expect)(datasets.map((d) => d.id)).to.not.include("validID");
            facade3 = new InsightFacade_1.default();
            await (0, chai_1.expect)(facade3.removeDataset("validID2")).to.eventually.equal("validID2");
            const dataset3 = await facade3.listDatasets();
            return (0, chai_1.expect)(dataset3.map((d) => d.id)).to.not.include("validID2");
        });
        it("Should reject adding the same dataset with facade2", async function () {
            await facade.addDataset("dupId", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            facade2 = new InsightFacade_1.default();
            const result2 = facade2.addDataset("dupId", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result2).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should list a single dataset after add from facade2", async function () {
            facade = new InsightFacade_1.default();
            await facade.addDataset("validID", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            facade2 = new InsightFacade_1.default();
            const result = await facade2.listDatasets();
            (0, chai_1.expect)(result).to.have.lengthOf(1);
            return (0, chai_1.expect)(result[0]).to.deep.include({
                id: "validID",
                kind: IInsightFacade_1.InsightDatasetKind.Sections,
                numRows: 64612,
            });
        });
    });
    describe("RemoveDataset", function () {
        beforeEach(function () {
            facade = new InsightFacade_1.default();
        });
        afterEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("should reject with an empty dataset id (remove method)", function () {
            const result = facade.removeDataset("");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an empty dataset id after 1 set has been added", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = facade.removeDataset("");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with a dataset id with underscore after 1 set has been added", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = facade.removeDataset("valid_ID");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with a dataset id with only whitespace after 1 set has been added", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = facade.removeDataset("  ");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should accept valid add then remove that same id", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.removeDataset("validID");
            const datasets = await facade.listDatasets();
            return (0, chai_1.expect)(datasets.map((d) => d.id)).to.not.include("validID");
        });
        it("should accept valid add then remove that same id #2", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(facade.removeDataset("validID")).to.eventually.equal("validID");
        });
        it("should reject when removing right away", function () {
            const result = facade.removeDataset("validID");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.NotFoundError);
        });
        it("should accept 2 valid adds then remove one id", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("validID2", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, chai_1.expect)(facade.removeDataset("validID")).to.eventually.equal("validID");
            const datasets = await facade.listDatasets();
            (0, chai_1.expect)(datasets.map((d) => d.id)).to.include("validID2");
            return (0, chai_1.expect)(datasets.map((d) => d.id)).to.not.include("validID");
        });
        it("should reject 2 valid adds then remove different id", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("validID2", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, chai_1.expect)(facade.removeDataset("validID3")).to.eventually.be.rejectedWith(IInsightFacade_1.NotFoundError);
            const datasets = await facade.listDatasets();
            (0, chai_1.expect)(datasets.map((d) => d.id)).to.include("validID");
            return (0, chai_1.expect)(datasets.map((d) => d.id)).to.include("validID2");
        });
        it("should accept 2 valid adds then remove those 2 ids", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("validID2", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, chai_1.expect)(facade.removeDataset("validID")).to.eventually.equal("validID");
            await (0, chai_1.expect)(facade.removeDataset("validID2")).to.eventually.equal("validID2");
            const datasets = await facade.listDatasets();
            (0, chai_1.expect)(datasets.map((d) => d.id)).to.not.include("validID");
            return (0, chai_1.expect)(datasets.map((d) => d.id)).to.not.include("validID2");
        });
        it("should accept 1 add then 1 remove (twice && same id)", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, chai_1.expect)(facade.removeDataset("validID")).to.eventually.equal("validID");
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, chai_1.expect)(facade.removeDataset("validID")).to.eventually.equal("validID");
            const datasets = await facade.listDatasets();
            return (0, chai_1.expect)(datasets.map((d) => d.id)).to.not.include("validID");
        });
        it("should accept 1 add then 1 remove (twice && different ids)", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, chai_1.expect)(facade.removeDataset("validID")).to.eventually.equal("validID");
            await facade.addDataset("validID2", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, chai_1.expect)(facade.removeDataset("validID2")).to.eventually.equal("validID2");
            const datasets = await facade.listDatasets();
            (0, chai_1.expect)(datasets.map((d) => d.id)).to.not.include("validID");
            return (0, chai_1.expect)(datasets.map((d) => d.id)).to.not.include("validID2");
        });
        it("should reject 1 add then 2 removes", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, chai_1.expect)(facade.removeDataset("validID")).to.eventually.equal("validID");
            return (0, chai_1.expect)(facade.removeDataset("validID")).to.eventually.be.rejectedWith(IInsightFacade_1.NotFoundError);
        });
    });
    describe("ListDataset", function () {
        beforeEach(function () {
            facade = new InsightFacade_1.default();
        });
        afterEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("should return an empty array with no datasets added", async function () {
            const result = await facade.listDatasets();
            return (0, chai_1.expect)(result).to.be.an("array").that.is.empty;
        });
        it("should list a single dataset after add", async function () {
            await facade.addDataset("validID", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.have.lengthOf(1);
            return (0, chai_1.expect)(result[0]).to.deep.include({
                id: "validID",
                kind: IInsightFacade_1.InsightDatasetKind.Sections,
                numRows: 64612,
            });
        });
        it("should list a single dataset after add Rooms", async function () {
            await facade.addDataset("validID", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.have.lengthOf(1);
            return (0, chai_1.expect)(result[0]).to.deep.include({
                id: "validID",
                kind: IInsightFacade_1.InsightDatasetKind.Rooms,
                numRows: 364,
            });
        });
        it("should list a single dataset after Rooms add", async function () {
            await facade.addDataset("validID", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.have.lengthOf(1);
            return (0, chai_1.expect)(result[0]).to.deep.include({
                id: "validID",
                kind: IInsightFacade_1.InsightDatasetKind.Rooms,
                numRows: 364,
            });
        });
        it("should list 2 different datasets after Rooms and Sections add", async function () {
            await facade.addDataset("validID", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
            await facade.addDataset("validID2", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result[0]).to.deep.include({
                id: "validID",
                kind: IInsightFacade_1.InsightDatasetKind.Rooms,
                numRows: 364,
            });
            return (0, chai_1.expect)(result[1]).to.deep.include({
                id: "validID2",
                kind: IInsightFacade_1.InsightDatasetKind.Sections,
                numRows: 64612,
            });
        });
        it("should list two datasets after they are added", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("validID2", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result[1]).to.deep.include({
                id: "validID2",
                kind: IInsightFacade_1.InsightDatasetKind.Sections,
                numRows: 64612,
            });
            return (0, chai_1.expect)(result.map((d) => d.id)).to.include.members(["validID", "validID2"]);
        });
        it("should not list a dataset after it is removed", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.removeDataset("validID");
            const result = await facade.listDatasets();
            return (0, chai_1.expect)(result).to.be.an("array").that.is.empty;
        });
        it("should list the correct datasets after adding and removing", async function () {
            await facade.addDataset("validID1", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("validID2", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.removeDataset("validID1");
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.have.lengthOf(1);
            return (0, chai_1.expect)(result[0].id).to.equal("validID2");
        });
        it("should list a dataset after removing and re-adding the same dataset", async function () {
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.removeDataset("validID");
            await facade.addDataset("validID", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.have.lengthOf(1);
            return (0, chai_1.expect)(result[0].id).to.equal("validID");
        });
        it("should list no datasets after adding and removing", async function () {
            await facade.addDataset("validID1", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("validID2", validSet, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.removeDataset("validID1");
            await facade.removeDataset("validID2");
            const result = await facade.listDatasets();
            return (0, chai_1.expect)(result).to.be.an("array").that.is.empty;
        });
    });
    describe("PerformQuery", function () {
        async function checkQuery() {
            if (!this.test) {
                throw new Error("Invalid call to checkQuery." +
                    "Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
                    "Do not invoke the function directly.");
            }
            const { input, expected, errorExpected } = await (0, TestUtil_1.loadTestQuery)(this.test.title);
            let result;
            try {
                result = await facade.performQuery(input);
                if (this.test.title === "[valid/noOrder.json] no order test") {
                    facade2 = new InsightFacade_1.default();
                    result = await facade2.performQuery(input);
                }
            }
            catch (err) {
                if (!errorExpected) {
                    chai_1.expect.fail(`performQuery threw unexpected error: ${err}`);
                }
                if (err instanceof IInsightFacade_1.InsightError) {
                    (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
                }
                else {
                    (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.ResultTooLargeError);
                }
                return;
            }
            if (errorExpected) {
                chai_1.expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
            }
            (0, chai_1.expect)(result).to.deep.equal(expected);
            return;
        }
        before(async function () {
            const timeoutExt = 10000;
            this.timeout(timeoutExt);
            facade = new InsightFacade_1.default();
            const loadDatasetPromises = [
                facade.addDataset("sections", sections, IInsightFacade_1.InsightDatasetKind.Sections),
                facade.addDataset("validSet", validSet, IInsightFacade_1.InsightDatasetKind.Sections),
                facade.addDataset("twoValidSections", twoValidSections, IInsightFacade_1.InsightDatasetKind.Sections),
                facade.addDataset("rooms", campus, IInsightFacade_1.InsightDatasetKind.Rooms),
            ];
            try {
                await Promise.all(loadDatasetPromises);
            }
            catch (err) {
                throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
            }
        });
        after(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
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
        it("[valid/emptyResult.json] empty result", checkQuery);
        it("[valid/avgEqualZero.json] avg equal zero", checkQuery);
        it("[valid/contradictCase.json] contradict case", checkQuery);
        it("[valid/aggregationTest.json] Aggregation functionality test", checkQuery);
        it("[valid/minAgg.json] Aggregation minimum test", checkQuery);
        it("[valid/maxAgg.json] Aggregation maximum test", checkQuery);
        it("[valid/countAgg.json] count aggregation test", checkQuery);
        it("[valid/countNotNum.json] count not number test", checkQuery);
        it("[valid/avgAgg.json] average aggregation", checkQuery);
        it("[valid/avgAgg2.json] average aggregation 2", checkQuery);
        it("[valid/sumAgg.json] sum aggregation", checkQuery);
        it("[valid/complexRooms.json] Aggregation rooms test", checkQuery);
        it("[valid/complexAgg2.json] Aggregation complex test", checkQuery);
        it("[valid/complexAgg3.json] Aggregation complex test", checkQuery);
        it("[valid/complexAgg4.json] Aggregation complex test", checkQuery);
        it("[valid/complexAgg5.json] Aggregation complex test", checkQuery);
        it("[valid/complexAgg6.json] Aggregation complex test", checkQuery);
        it("[valid/complexAgg7.json] Aggregation complex test", checkQuery);
        it("[valid/aggRoomFields.json] aggregation fields for room", checkQuery);
        it("[valid/twoApply.json] two apply aggregations", checkQuery);
        it("[invalid/twoApplyKeys.json] two duplicate apply aggregations", checkQuery);
        it("[invalid/columnNotGroup.json] column keys not group", checkQuery);
        it("[invalid/transformationMissingApply.json] missing apply field in aggregation", checkQuery);
        it("[invalid/aggString.json] max on non numeric field", checkQuery);
        it("[invalid/emptyAggstring.json] Agg string is empty", checkQuery);
        it("[invalid/noApplyKey.json] Agg string is empty", checkQuery);
        it("[invalid/dupApply.json] Agg string is empty", checkQuery);
        it("[invalid/sumNotNumeric.json] sum has non numeric key", checkQuery);
        it("[invalid/emptyGroup.json] Group empty", checkQuery);
        it("[invalid/maxuuid.json] uuid should not be able to be used with max", checkQuery);
        it("[valid/advSorting.json] advanced sorting test", checkQuery);
        it("[valid/sortingTiebreak.json] Sorting tiebreak test", checkQuery);
        it("[valid/sortingTiebreak2.json] Sorting tiebreak test 2", checkQuery);
        it("[valid/transformationWithRooms.json] trans with Rooms", checkQuery);
        it("[valid/sortingTiebreak3.json] Sorting tiebreak test 3", checkQuery);
        it("[invalid/orderNotColumns2.json] order keys not in columns", checkQuery);
        it("[invalid/invalidDir.json] invalid Direction", checkQuery);
        it("[invalid/invalidKeysInOrder.json] invalid keys in Order", checkQuery);
        it("[invalid/transformationMissingApply.json] missing apply field in aggregation", checkQuery);
        it("[invalid/duplicateApplyKey.json] missing duplicate apply key", checkQuery);
        it("[invalid/duplicateApplySimple.json] simple missing duplicate apply key", checkQuery);
        it("[invalid/invalidColumnKeyWithGroup.json] invalid column key with group", checkQuery);
        it("[invalid/invalidKeyTypeAvg.json] invalid avg", checkQuery);
        it("[invalid/invalidKeyTypeMax.json] invalid Max", checkQuery);
        it("[invalid/invalidKeyTypeMin.json] invalid Min", checkQuery);
        it("[invalid/invalidKeyTypeSort.json] invalid Sort", checkQuery);
        it("[invalid/multipleSortKeysNotInColumn.json] multiple sort keys not in columns", checkQuery);
        it("[invalid/sortKeyNotInColumns.json] sort key not in columns", checkQuery);
        it("[valid/roomFields.json] All room fields functionality test", checkQuery);
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map