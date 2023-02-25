"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Imports
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
// Local Modules
const user_1 = require("./api/user");
// Environment Viariables
dotenv_1.default.config();
const apiUrl = '/api';
const clientApp = '/../public';
const viewsFolder = 'views';
// App
const app = (0, express_1.default)();
// Middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)());
app.use((0, cookie_parser_1.default)());
// Views
app.use('/', express_1.default.static(__dirname + clientApp));
app.use('/server', express_1.default.static(path_1.default.join(__dirname, viewsFolder)));
// REST API
app.get(`${apiUrl}/`, (req, res, next) => {
    res.json({ info: 'Nodejs REST API' });
});
app.use(`${apiUrl}/user`, user_1.userRoutes);
// Start Server
const HOSTNAME = process.env.HOSTNAME || 'localhost';
const PORT = Number(process.env.PORT) || 3000;
const server = app.listen(PORT, () => {
    console.log(process.env.TEST || '');
    console.log(`Server started on http://${HOSTNAME}:${PORT}`);
});
// Stop Server
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server closed: Process Terminated!');
    });
});
