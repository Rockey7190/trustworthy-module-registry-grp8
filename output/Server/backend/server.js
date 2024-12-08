"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const routes_1 = require("./routes");
const UserAuthentication_1 = __importDefault(require("../../Api/UserRelatedApi/UserAuthentication"));
const uploadPackage_1 = __importDefault(require("../../Api/PackageApis/uploadPackage"));
const deletePackage_1 = __importDefault(require("../../Api/PackageApis/deletePackage"));
const updatePackage_1 = __importDefault(require("../../Api/PackageApis/updatePackage"));
const downloadPackage_1 = __importDefault(require("../../Api/PackageApis/downloadPackage"));
const fetchVersions_1 = __importDefault(require("../../Api/PackageApis/fetchVersions"));
const fetchDirectory_1 = __importDefault(require("../../Api/PackageApis/fetchDirectory"));
const searchPackages_1 = __importDefault(require("../../Api/PackageApis/searchPackages"));
const sizeCost_1 = __importDefault(require("../../Api/PackageApis/sizeCost"));
const fullReset_1 = __importDefault(require("../../Api/PackageApis/fullReset"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const port = 3000;
// Middleware for parsing JSON and form data
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)()); // Enable CORS for cross-origin requests
// Serve static files from the 'frontend' folder
app.use(express_1.default.static(path_1.default.join(__dirname, '../frontend')));
// Fallback route to serve 'home_page.html' if navigating directly
app.get('/home_page', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../frontend/home_page.html'));
});
// Include user authentication routes
app.use('/api', UserAuthentication_1.default);
// Include main router (if necessary)
app.use('/api', routes_1.router);
// Register the upload routes
app.use('/api', uploadPackage_1.default); // Upload package routes
app.use('/api', deletePackage_1.default); // Delete package routes
app.use('/api', updatePackage_1.default); // Update package routes
app.use('/api', downloadPackage_1.default); // download package routes
app.use('/api', fetchVersions_1.default); // Fetch package versions
app.use('/api', fetchDirectory_1.default); // Fetch directories
app.use('/api', searchPackages_1.default); // Search packages
app.use('/api', sizeCost_1.default); // Check size cost
app.use('/api', fullReset_1.default);
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
