"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const UserAuthentication_1 = __importDefault(require("./Api/UserRelatedApi/UserAuthentication"));
const uploadPackage_1 = __importDefault(require("./Api/PackageApis/uploadPackage"));
const deletePackage_1 = __importDefault(require("./Api/PackageApis/deletePackage"));
const updatePackage_1 = __importDefault(require("./Api/PackageApis/updatePackage"));
const downloadPackage_1 = __importDefault(require("./Api/PackageApis/downloadPackage"));
const fetchVersions_1 = __importDefault(require("./Api/PackageApis/fetchVersions"));
const fetchDirectory_1 = __importDefault(require("./Api/PackageApis/fetchDirectory"));
const searchPackages_1 = __importDefault(require("./Api/PackageApis/searchPackages"));
const packageCost_1 = __importDefault(require("./Api/PackageApis/packageCost"));
const fullReset_1 = __importDefault(require("./Api/PackageApis/fullReset"));
const fetchPackages_1 = __importDefault(require("./Api/PackageApis/fetchPackages"));
const getAndAddPackageID_1 = __importDefault(require("./Api/PackageApis/getAndAddPackageID"));
const packageEndpoint_1 = __importDefault(require("./Api/PackageApis/packageEndpoint"));
const byRegEx_1 = __importDefault(require("./Api/PackageApis/byRegEx"));
const packageRate_1 = __importDefault(require("./Api/PackageApis/packageRate"));
const tracks_1 = __importDefault(require("./Api/PackageApis/tracks"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000; // Use Elastic Beanstalk's PORT or fallback to 3000
// Middleware for parsing JSON and form data
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Include user authentication routes
app.use('/api', UserAuthentication_1.default);
app.use('/upload', uploadPackage_1.default); // Upload package routes
app.use('/delete', deletePackage_1.default); // Delete package routes
app.use('/update', updatePackage_1.default); // Update package routes
app.use('/download', downloadPackage_1.default); // download package routes
app.use('/versions', fetchVersions_1.default); // Fetch package versions
app.use('/directory', fetchDirectory_1.default); // Fetch directories
app.use('/search', searchPackages_1.default); // Search packages
app.use('/package', packageCost_1.default);
app.use('/reset', fullReset_1.default);
app.use('/packages', fetchPackages_1.default);
app.use('/package', getAndAddPackageID_1.default);
app.use('/package', packageEndpoint_1.default);
app.use('/package/byRegEx', byRegEx_1.default);
app.use('/package', packageRate_1.default);
app.use('/tracks', tracks_1.default);
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
