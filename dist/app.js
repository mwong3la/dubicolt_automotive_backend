"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("./routes/index"));
const error_middleware_1 = require("./middlewares/error.middleware");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const store_1 = require("./dubicolt/store");
const swagger_1 = require("./lib/swagger");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
}));
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    res.json({ message: 'Dubicolt Automotive API', version: '1.0', base: '/api', docs: '/api/docs' });
});
(0, swagger_1.setupSwagger)(app);
app.use('/api', index_1.default);
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
async function startServer() {
    try {
        await (0, store_1.initDubicoltStore)();
        server.listen(PORT, () => {
            console.log(`Dubicolt Automotive API running on http://localhost:${PORT}/api`);
            console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
