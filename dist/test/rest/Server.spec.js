"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
const http_status_codes_1 = require("http-status-codes");
const Log_1 = __importDefault(require("@ubccpsc310/folder-test/build/Log"));
const Server_1 = __importDefault(require("../../src/rest/Server"));
const TestUtil_1 = require("../TestUtil");
const promises_1 = __importDefault(require("fs/promises"));
describe("Facade C3", function () {
    let server;
    before(async function () {
        const portNumber = 4321;
        server = new Server_1.default(portNumber);
        try {
            await server.start();
            Log_1.default.info("Test::before - Server started");
        }
        catch (err) {
            Log_1.default.error("Test::before - Error starting server: ");
            throw err;
        }
    });
    after(async function () {
        try {
            await server.stop();
            Log_1.default.info("Test::after - Server stopped");
        }
        catch (_err) {
            Log_1.default.error("Test::after - Error stopping server: ");
        }
    });
    beforeEach(async function () {
        Log_1.default.info("Test::beforeEach - Test started");
        await (0, TestUtil_1.clearDisk)();
    });
    afterEach(async function () {
        Log_1.default.info("Test::afterEach - Test finished");
    });
    it("PUT test (pass) for courses dataset", async function () {
        const SERVER_URL = "http://localhost:4321";
        const ENDPOINT_URL = "/dataset/courses/sections";
        const ZIP_FILE_DATA = await promises_1.default.readFile("test/resources/archives/pair.zip");
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res) {
                Log_1.default.info("Test::PUT - Response received, status: " + res.status);
                (0, chai_1.expect)(res.status).to.be.equal(http_status_codes_1.StatusCodes.OK);
                Log_1.default.info("Test::PUT - Success");
            })
                .catch(function () {
                Log_1.default.error("Test::PUT - Error: ");
                chai_1.expect.fail("PUT request failed");
            });
        }
        catch (err) {
            Log_1.default.error("Test::PUT - Exception caught: " + err);
            chai_1.expect.fail("Unexpected error occurred");
        }
    });
    it("PUT test (fail) for courses dataset with no valid sections", async function () {
        const SERVER_URL = "http://localhost:4321";
        const ENDPOINT_URL = "/dataset/courses/sections";
        const ZIP_FILE_DATA = await promises_1.default.readFile("test/resources/archives/noValidSection.zip");
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res) {
                Log_1.default.info("Test::PUT - Response received, status: " + res.status);
                (0, chai_1.expect)(res.status).to.be.equal(http_status_codes_1.StatusCodes.BAD_REQUEST);
                Log_1.default.info("Test::PUT - Success - was not added");
            })
                .catch(function () {
                Log_1.default.error("Test::PUT - Error: ");
                chai_1.expect.fail("PUT request failed");
            });
        }
        catch (err) {
            Log_1.default.error("Test::PUT - Exception caught: " + err);
            chai_1.expect.fail("Unexpected error occurred");
        }
    });
    it("DELETE test (pass) for courses dataset", async function () {
        const SERVER_URL = "http://localhost:4321";
        const ENDPOINT_URL = "/dataset/courses/sections";
        const ZIP_FILE_DATA = await promises_1.default.readFile("test/resources/archives/pair.zip");
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(async function (res) {
                Log_1.default.info("Test::PUT - Response received, status: " + res.status);
                (0, chai_1.expect)(res.status).to.be.equal(http_status_codes_1.StatusCodes.OK);
                Log_1.default.info("Test::PUT - Success");
                return (0, supertest_1.default)(SERVER_URL)
                    .delete("/dataset/courses")
                    .then(function (deleteRes) {
                    Log_1.default.info("Test::DELETE - Response received, status: " + deleteRes.status);
                    (0, chai_1.expect)(deleteRes.status).to.be.equal(http_status_codes_1.StatusCodes.OK);
                    Log_1.default.info("Test::DELETE - Dataset removed successfully");
                });
            })
                .catch(function (err) {
                Log_1.default.error("Test::PUT or DELETE - Error: " + err.message);
                chai_1.expect.fail("PUT or DELETE request failed");
            });
        }
        catch (err) {
            Log_1.default.error("Test::PUT - Exception caught: " + err);
            chai_1.expect.fail("Unexpected error occurred");
        }
    });
    it("DELETE test (fail) for NOTFOUND dataset", async function () {
        const SERVER_URL = "http://localhost:4321";
        const ENDPOINT_URL = "/dataset/courses/sections";
        const ZIP_FILE_DATA = await promises_1.default.readFile("test/resources/archives/pair.zip");
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(async function (res) {
                Log_1.default.info("Test::PUT - Response received, status: " + res.status);
                (0, chai_1.expect)(res.status).to.be.equal(http_status_codes_1.StatusCodes.OK);
                Log_1.default.info("Test::PUT - Success");
                return (0, supertest_1.default)(SERVER_URL)
                    .delete("/dataset/invalid")
                    .then(function (deleteRes) {
                    Log_1.default.info("Test::DELETE - Response received, status: " + deleteRes.status);
                    (0, chai_1.expect)(deleteRes.status).to.be.equal(http_status_codes_1.StatusCodes.NOT_FOUND);
                    Log_1.default.info("Test::DELETE - Dataset not found");
                });
            })
                .catch(function (err) {
                Log_1.default.error("Test::PUT or DELETE - Error: " + err.message);
                chai_1.expect.fail("PUT or DELETE request failed");
            });
        }
        catch (err) {
            Log_1.default.error("Test::PUT - Exception caught: " + err);
            chai_1.expect.fail("Unexpected error occurred");
        }
    });
    it("DELETE test (fail) for invalid id dataset", async function () {
        const SERVER_URL = "http://localhost:4321";
        const ENDPOINT_URL = "/dataset/courses/sections";
        const ZIP_FILE_DATA = await promises_1.default.readFile("test/resources/archives/pair.zip");
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(async function (res) {
                Log_1.default.info("Test::PUT - Response received, status: " + res.status);
                (0, chai_1.expect)(res.status).to.be.equal(http_status_codes_1.StatusCodes.OK);
                Log_1.default.info("Test::PUT - Success");
                return (0, supertest_1.default)(SERVER_URL)
                    .delete("/dataset/invalid_id")
                    .then(function (deleteRes) {
                    Log_1.default.info("Test::DELETE - Response received, status: " + deleteRes.status);
                    (0, chai_1.expect)(deleteRes.status).to.be.equal(http_status_codes_1.StatusCodes.BAD_REQUEST);
                    Log_1.default.info("Test::DELETE - Dataset id invalid");
                });
            })
                .catch(function (err) {
                Log_1.default.error("Test::PUT or DELETE - Error: " + err.message);
                chai_1.expect.fail("PUT or DELETE request failed");
            });
        }
        catch (err) {
            Log_1.default.error("Test::PUT - Exception caught: " + err);
            chai_1.expect.fail("Unexpected error occurred");
        }
    });
    it("POST test (pass)", async function () {
        const SERVER_URL = "http://localhost:4321";
        const ENDPOINT_URL = "/dataset/sections/sections";
        const ZIP_FILE_DATA = await promises_1.default.readFile("test/resources/archives/pair.zip");
        const QUERY = {
            WHERE: {
                GT: {
                    sections_avg: 97,
                },
            },
            OPTIONS: {
                COLUMNS: ["sections_dept", "sections_avg"],
                ORDER: "sections_avg",
            },
        };
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(async function (res) {
                Log_1.default.info("Test::PUT - Response received, status: " + res.status);
                (0, chai_1.expect)(res.status).to.be.equal(http_status_codes_1.StatusCodes.OK);
                Log_1.default.info("Test::PUT - Success");
                return (0, supertest_1.default)(SERVER_URL)
                    .post("/query")
                    .send(QUERY)
                    .set("Content-Type", "application/json")
                    .then(function (queryRes) {
                    Log_1.default.info("Test::POST - Response received, status: " + queryRes.status);
                    (0, chai_1.expect)(queryRes.status).to.be.equal(http_status_codes_1.StatusCodes.OK);
                    (0, chai_1.expect)(queryRes.body.result).to.be.an("array");
                    Log_1.default.info("Test::POST - Query executed successfully, results received");
                });
            })
                .catch(function (err) {
                Log_1.default.error("Test::PUT or QUERY - Error: " + err.message);
                chai_1.expect.fail("PUT or DELETE request failed");
            });
        }
        catch (err) {
            Log_1.default.error("Test::PUT - Exception caught: " + err);
            chai_1.expect.fail("Unexpected error occurred");
        }
    });
    it("POST test (fail)", async function () {
        const SERVER_URL = "http://localhost:4321";
        const ENDPOINT_URL = "/dataset/sections/sections";
        const ZIP_FILE_DATA = await promises_1.default.readFile("test/resources/archives/pair.zip");
        const QUERY = {
            WHERE: {
                AND: [],
            },
            OPTIONS: {
                COLUMNS: ["sections_dept", "sections_avg"],
            },
        };
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(async function (res) {
                Log_1.default.info("Test::PUT - Response received, status: " + res.status);
                (0, chai_1.expect)(res.status).to.be.equal(http_status_codes_1.StatusCodes.OK);
                Log_1.default.info("Test::PUT - Success");
                return (0, supertest_1.default)(SERVER_URL)
                    .post("/query")
                    .send(QUERY)
                    .set("Content-Type", "application/json")
                    .then(function (queryRes) {
                    Log_1.default.info("Test::POST - Response received, status: " + queryRes.status);
                    (0, chai_1.expect)(queryRes.status).to.be.equal(http_status_codes_1.StatusCodes.BAD_REQUEST);
                    Log_1.default.info("Test::POST - Query failed successfully");
                });
            })
                .catch(function (err) {
                Log_1.default.error("Test::PUT or QUERY - Error: " + err.message);
                chai_1.expect.fail("PUT or DELETE request failed");
            });
        }
        catch (err) {
            Log_1.default.error("Test::PUT - Exception caught: " + err);
            chai_1.expect.fail("Unexpected error occurred");
        }
    });
    it("GET test", async function () {
        const SERVER_URL = "http://localhost:4321";
        const ENDPOINT_URL = "/dataset/sections/sections";
        const ZIP_FILE_DATA = await promises_1.default.readFile("test/resources/archives/pair.zip");
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(async function (res) {
                Log_1.default.info("Test::PUT - Response received, status: " + res.status);
                (0, chai_1.expect)(res.status).to.be.equal(http_status_codes_1.StatusCodes.OK);
                Log_1.default.info("Test::PUT - Success");
                return (0, supertest_1.default)(SERVER_URL)
                    .get("/datasets")
                    .then(function (response) {
                    Log_1.default.info("Test::GET - Response received, status: " + response.status);
                    (0, chai_1.expect)(response.status).to.be.equal(http_status_codes_1.StatusCodes.OK);
                    (0, chai_1.expect)(response.body.result).to.be.an("array");
                    (0, chai_1.expect)(response.body.result).to.have.lengthOf(1);
                    Log_1.default.info("Test::GET - Datasets list received successfully");
                });
            })
                .catch(function (err) {
                Log_1.default.error("Test::PUT or GET - Error: " + err.message);
                chai_1.expect.fail("PUT or GET request failed");
            });
        }
        catch (err) {
            Log_1.default.error("Test::PUT - Exception caught: " + err);
            chai_1.expect.fail("Unexpected error occurred");
        }
    });
    it("GET test (empty)", async function () {
        const SERVER_URL = "http://localhost:4321";
        return (0, supertest_1.default)(SERVER_URL)
            .get("/datasets")
            .then(function (response) {
            Log_1.default.info("Test::GET - Response received, status: " + response.status);
            (0, chai_1.expect)(response.status).to.be.equal(http_status_codes_1.StatusCodes.OK);
            (0, chai_1.expect)(response.body.result).to.be.an("array");
            (0, chai_1.expect)(response.body.result).to.have.lengthOf(0);
            Log_1.default.info("Test::GET - Datasets list received successfully");
        })
            .catch(function (err) {
            Log_1.default.error("Test::GET - Error: " + err.message);
            chai_1.expect.fail("GET request failed");
        });
    });
});
//# sourceMappingURL=Server.spec.js.map