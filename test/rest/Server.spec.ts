import { expect } from "chai";
import request, { Response } from "supertest";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import Server from "../../src/rest/Server";
import { clearDisk } from "../TestUtil";
import fs from "fs/promises";

describe("Facade C3", function () {
	let server: Server;

	before(async function () {
		// TODO: start server here once and handle errors properly
		const portNumber = 4321;
		server = new Server(portNumber);
		try {
			await server.start();
			Log.info("Test::before - Server started");
		} catch (err) {
			Log.error("Test::before - Error starting server: ");
			throw err;
		}
	});

	after(async function () {
		// TODO: stop server here once!
		try {
			await server.stop(); // Stop the server
			Log.info("Test::after - Server stopped");
		} catch (_err) {
			Log.error("Test::after - Error stopping server: ");
		}
	});

	beforeEach(async function () {
		// might want to add some process logging here to keep track of what is going on
		Log.info("Test::beforeEach - Test started");
		await clearDisk();
	});

	afterEach(async function () {
		// might want to add some process logging here to keep track of what is going on
		Log.info("Test::afterEach - Test finished");
	});

	// Sample on how to format PUT requests
	it("PUT test (pass) for courses dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/courses/sections";
		const ZIP_FILE_DATA = await fs.readFile("test/resources/archives/pair.zip");
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					Log.info("Test::PUT - Response received, status: " + res.status);
					expect(res.status).to.be.equal(StatusCodes.OK);
					Log.info("Test::PUT - Success");
				})
				.catch(function () {
					// some logging here please!
					Log.error("Test::PUT - Error: ");
					expect.fail("PUT request failed");
				});
		} catch (err) {
			Log.error("Test::PUT - Exception caught: " + err);
			expect.fail("Unexpected error occurred");
			// and some more logging here!
		}
	});

	it("PUT test (fail) for courses dataset with no valid sections", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/courses/sections";
		const ZIP_FILE_DATA = await fs.readFile("test/resources/archives/noValidSection.zip");

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					Log.info("Test::PUT - Response received, status: " + res.status);
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
					Log.info("Test::PUT - Success - was not added");
				})
				.catch(function () {
					// some logging here please!
					Log.error("Test::PUT - Error: ");
					expect.fail("PUT request failed");
				});
		} catch (err) {
			Log.error("Test::PUT - Exception caught: " + err);
			expect.fail("Unexpected error occurred");
			// and some more logging here!
		}
	});

	it("DELETE test (pass) for courses dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/courses/sections";
		const ZIP_FILE_DATA = await fs.readFile("test/resources/archives/pair.zip");

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(async function (res: Response) {
					// some logging here please!
					Log.info("Test::PUT - Response received, status: " + res.status);
					expect(res.status).to.be.equal(StatusCodes.OK);
					Log.info("Test::PUT - Success");

					return request(SERVER_URL)
						.delete("/dataset/courses")
						.then(function (deleteRes: Response) {
							Log.info("Test::DELETE - Response received, status: " + deleteRes.status);
							expect(deleteRes.status).to.be.equal(StatusCodes.OK);
							Log.info("Test::DELETE - Dataset removed successfully");
						});
				})
				.catch(function (err) {
					Log.error("Test::PUT or DELETE - Error: " + err.message);
					expect.fail("PUT or DELETE request failed");
				});
		} catch (err) {
			Log.error("Test::PUT - Exception caught: " + err);
			expect.fail("Unexpected error occurred");
			// and some more logging here!
		}
	});

	it("DELETE test (fail) for NOTFOUND dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/courses/sections";
		const ZIP_FILE_DATA = await fs.readFile("test/resources/archives/pair.zip");

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(async function (res: Response) {
					// some logging here please!
					Log.info("Test::PUT - Response received, status: " + res.status);
					expect(res.status).to.be.equal(StatusCodes.OK);
					Log.info("Test::PUT - Success");

					return request(SERVER_URL)
						.delete("/dataset/invalid")
						.then(function (deleteRes: Response) {
							Log.info("Test::DELETE - Response received, status: " + deleteRes.status);
							expect(deleteRes.status).to.be.equal(StatusCodes.NOT_FOUND);
							Log.info("Test::DELETE - Dataset not found");
						});
				})
				.catch(function (err) {
					Log.error("Test::PUT or DELETE - Error: " + err.message);
					expect.fail("PUT or DELETE request failed");
				});
		} catch (err) {
			Log.error("Test::PUT - Exception caught: " + err);
			expect.fail("Unexpected error occurred");
			// and some more logging here!
		}
	});

	it("DELETE test (fail) for invalid id dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/courses/sections";
		const ZIP_FILE_DATA = await fs.readFile("test/resources/archives/pair.zip");

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(async function (res: Response) {
					// some logging here please!
					Log.info("Test::PUT - Response received, status: " + res.status);
					expect(res.status).to.be.equal(StatusCodes.OK);
					Log.info("Test::PUT - Success");

					return request(SERVER_URL)
						.delete("/dataset/invalid_id")
						.then(function (deleteRes: Response) {
							Log.info("Test::DELETE - Response received, status: " + deleteRes.status);
							expect(deleteRes.status).to.be.equal(StatusCodes.BAD_REQUEST);
							Log.info("Test::DELETE - Dataset id invalid");
						});
				})
				.catch(function (err) {
					Log.error("Test::PUT or DELETE - Error: " + err.message);
					expect.fail("PUT or DELETE request failed");
				});
		} catch (err) {
			Log.error("Test::PUT - Exception caught: " + err);
			expect.fail("Unexpected error occurred");
			// and some more logging here!
		}
	});

	it("POST test (pass)", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/sections/sections";
		const ZIP_FILE_DATA = await fs.readFile("test/resources/archives/pair.zip");
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
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(async function (res: Response) {
					Log.info("Test::PUT - Response received, status: " + res.status);
					expect(res.status).to.be.equal(StatusCodes.OK);
					Log.info("Test::PUT - Success");

					return request(SERVER_URL)
						.post("/query")
						.send(QUERY)
						.set("Content-Type", "application/json")
						.then(function (queryRes: Response) {
							Log.info("Test::POST - Response received, status: " + queryRes.status);
							expect(queryRes.status).to.be.equal(StatusCodes.OK);
							expect(queryRes.body.result).to.be.an("array");
							Log.info("Test::POST - Query executed successfully, results received");
						});
				})
				.catch(function (err) {
					Log.error("Test::PUT or QUERY - Error: " + err.message);
					expect.fail("PUT or DELETE request failed");
				});
		} catch (err) {
			Log.error("Test::PUT - Exception caught: " + err);
			expect.fail("Unexpected error occurred");
		}
	});

	it("POST test (fail)", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/sections/sections";
		const ZIP_FILE_DATA = await fs.readFile("test/resources/archives/pair.zip");
		const QUERY = {
			WHERE: {
				AND: [],
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
			},
		};

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(async function (res: Response) {
					Log.info("Test::PUT - Response received, status: " + res.status);
					expect(res.status).to.be.equal(StatusCodes.OK);
					Log.info("Test::PUT - Success");

					return request(SERVER_URL)
						.post("/query")
						.send(QUERY)
						.set("Content-Type", "application/json")
						.then(function (queryRes: Response) {
							Log.info("Test::POST - Response received, status: " + queryRes.status);
							expect(queryRes.status).to.be.equal(StatusCodes.BAD_REQUEST);
							Log.info("Test::POST - Query failed successfully");
						});
				})
				.catch(function (err) {
					Log.error("Test::PUT or QUERY - Error: " + err.message);
					expect.fail("PUT or DELETE request failed");
				});
		} catch (err) {
			Log.error("Test::PUT - Exception caught: " + err);
			expect.fail("Unexpected error occurred");
		}
	});

	it("GET test", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/sections/sections";
		const ZIP_FILE_DATA = await fs.readFile("test/resources/archives/pair.zip");

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(async function (res: Response) {
					Log.info("Test::PUT - Response received, status: " + res.status);
					expect(res.status).to.be.equal(StatusCodes.OK);
					Log.info("Test::PUT - Success");

					return request(SERVER_URL)
						.get("/datasets")
						.then(function (response: Response) {
							Log.info("Test::GET - Response received, status: " + response.status);
							expect(response.status).to.be.equal(StatusCodes.OK);
							expect(response.body.result).to.be.an("array");
							expect(response.body.result).to.have.lengthOf(1);
							Log.info("Test::GET - Datasets list received successfully");
						});
				})
				.catch(function (err) {
					Log.error("Test::PUT or GET - Error: " + err.message);
					expect.fail("PUT or GET request failed");
				});
		} catch (err) {
			Log.error("Test::PUT - Exception caught: " + err);
			expect.fail("Unexpected error occurred");
		}
	});

	it("GET test (empty)", async function () {
		const SERVER_URL = "http://localhost:4321";

		return request(SERVER_URL)
			.get("/datasets")
			.then(function (response: Response) {
				Log.info("Test::GET - Response received, status: " + response.status);
				expect(response.status).to.be.equal(StatusCodes.OK);
				expect(response.body.result).to.be.an("array");
				expect(response.body.result).to.have.lengthOf(0);
				Log.info("Test::GET - Datasets list received successfully");
			})

			.catch(function (err) {
				Log.error("Test::GET - Error: " + err.message);
				expect.fail("GET request failed");
			});
	});
});
