"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const Log_1 = __importDefault(require("@ubccpsc310/folder-test/build/Log"));
const cors_1 = __importDefault(require("cors"));
const InsightFacade_1 = __importDefault(require("../controller/InsightFacade"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
class Server {
    port;
    express;
    server;
    constructor(port) {
        Log_1.default.info(`Server::<init>( ${port} )`);
        this.port = port;
        this.express = (0, express_1.default)();
        this.registerMiddleware();
        this.registerRoutes();
        this.express.use(express_1.default.static("./frontend/public"));
        this.express.get("/insights/:id", (req, res) => {
            const id = req.params.id;
            Log_1.default.info(`Received id: ${id}`);
            res.sendFile("insights.html", { root: "./frontend/public" });
        });
    }
    async start() {
        return new Promise((resolve, reject) => {
            Log_1.default.info("Server::start() - start");
            if (this.server !== undefined) {
                Log_1.default.error("Server::start() - server already listening");
                reject();
            }
            else {
                this.server = this.express
                    .listen(this.port, () => {
                    Log_1.default.info(`Server::start() - server listening on port: ${this.port}`);
                    resolve();
                })
                    .on("error", (err) => {
                    Log_1.default.error(`Server::start() - server ERROR: ${err.message}`);
                    reject(err);
                });
            }
        });
    }
    async stop() {
        Log_1.default.info("Server::stop()");
        return new Promise((resolve, reject) => {
            if (this.server === undefined) {
                Log_1.default.error("Server::stop() - ERROR: server not started");
                reject();
            }
            else {
                this.server.close(() => {
                    Log_1.default.info("Server::stop() - server closed");
                    resolve();
                });
            }
        });
    }
    registerMiddleware() {
        this.express.use(express_1.default.json());
        this.express.use(express_1.default.raw({ type: "application/*", limit: "10mb" }));
        this.express.use((0, cors_1.default)());
    }
    registerRoutes() {
        this.express.get("/echo/:msg", Server.echo);
        this.express.put("/dataset/:id/:kind", Server.addDataset);
        this.express.delete("/dataset/:id", Server.removeDataset);
        this.express.post("/query", Server.performQuery);
        this.express.get("/datasets", Server.listDatasets);
    }
    static async listDatasets(req, res) {
        try {
            Log_1.default.info(`Server::listDatasets(..) - params: ${JSON.stringify(req.params)}`);
            const insightFacade = new InsightFacade_1.default();
            const arr = await insightFacade.listDatasets();
            res.status(http_status_codes_1.StatusCodes.OK).json({ result: arr });
        }
        catch (err) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
        }
    }
    static async performQuery(req, res) {
        try {
            Log_1.default.info(`Server::performQuery(..) - params: ${JSON.stringify(req.params)}`);
            const query = req.body;
            const insightFacade = new InsightFacade_1.default();
            const arr = await insightFacade.performQuery(query);
            res.status(http_status_codes_1.StatusCodes.OK).json({ result: arr });
        }
        catch (err) {
            Log_1.default.error(`Server::addDataset(..) - ERROR: ${err}`);
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
        }
    }
    static async removeDataset(req, res) {
        try {
            Log_1.default.info(`Server::removeDataset(..) - params: ${JSON.stringify(req.params)}`);
            const id = req.params.id;
            const insightFacade = new InsightFacade_1.default();
            const str = await insightFacade.removeDataset(id);
            res.status(http_status_codes_1.StatusCodes.OK).json({ result: str });
        }
        catch (err) {
            if (err instanceof IInsightFacade_1.NotFoundError) {
                res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: err.message });
            }
            else {
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
            }
        }
    }
    static async addDataset(req, res) {
        try {
            Log_1.default.info(`Server::addDataset(..) - params: ${JSON.stringify(req.params)}`);
            const id = req.params.id;
            const kind = req.params.kind;
            const base64Data = req.body.toString("base64");
            const insightFacade = new InsightFacade_1.default();
            const arr = await insightFacade.addDataset(id, base64Data, kind);
            res.status(http_status_codes_1.StatusCodes.OK).json({ result: arr });
        }
        catch (err) {
            Log_1.default.error(`Server::addDataset(..) - ERROR: ${err}`);
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
        }
    }
    static echo(req, res) {
        try {
            Log_1.default.info(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
            const response = Server.performEcho(req.params.msg);
            res.status(http_status_codes_1.StatusCodes.OK).json({ result: response });
        }
        catch (err) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
        }
    }
    static performEcho(msg) {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        }
        else {
            return "Message not provided";
        }
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map