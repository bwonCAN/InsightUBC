"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const Log_1 = __importDefault(require("@ubccpsc310/folder-test/build/Log"));
const Server_1 = __importDefault(require("./rest/Server"));
class App {
    async initServer(port) {
        Log_1.default.info(`App::initServer( ${port} ) - start`);
        const server = new Server_1.default(port);
        return server
            .start()
            .then(() => {
            Log_1.default.info("App::initServer() - started");
        })
            .catch((err) => {
            Log_1.default.error(`App::initServer() - ERROR: ${err.message}`);
        });
    }
}
exports.App = App;
Log_1.default.info("App - starting");
const port = 4321;
const app = new App();
(async () => {
    await app.initServer(port);
})();
//# sourceMappingURL=App.js.map