import express from 'express';
import bodyParser from 'body-parser';
import userAuthRoutes from '../Api/UserRelatedApi/UserAuthentication'
import uploadPackageRoutes from '../Api/PackageApis/uploadPackage';
import deletePackageRoutes from '../Api/PackageApis/deletePackage';
import updatePackageRoutes from '../Api/PackageApis/updatePackage';
import downloadPackageRoutes from '../Api/PackageApis/downloadPackage';
import fetchVersions from '../Api/PackageApis/fetchVersions';
import fetchDirectory from '../Api/PackageApis/fetchDirectory';
import searchPackages from '../Api/PackageApis/searchPackages';
import packageCost from '../Api/PackageApis/packageCost';
import fullReset from '../Api/PackageApis/fullReset';
import fetchPackagesRoutes from '../Api/PackageApis/fetchPackages';
import getAndAddPackageID from '../Api/PackageApis/getAndAddPackageID';
import packageEndpoint from '../Api/PackageApis/packageEndpoint';
import byRegEx from '../Api/PackageApis/byRegEx'
import packageRate from '../Api/PackageApis/packageRate'
import tracks from '../Api/PackageApis/tracks'


const app = express();
const port = process.env.PORT || 3000; // Use Elastic Beanstalk's PORT or fallback to 3000

// Middleware for parsing JSON and form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Include user authentication routes
app.use('/api', userAuthRoutes);

app.use('/upload', uploadPackageRoutes);  // Upload package routes
app.use('/delete', deletePackageRoutes);  // Delete package routes
app.use('/update', updatePackageRoutes);  // Update package routes
app.use('/download', downloadPackageRoutes);// download package routes
app.use('/versions', fetchVersions); // Fetch package versions
app.use('/directory', fetchDirectory); // Fetch directories
app.use('/search', searchPackages); // Search packages

app.use('/package', packageCost);
app.use('/reset', fullReset);
app.use('/packages', fetchPackagesRoutes);
app.use('/package', getAndAddPackageID);
app.use('/package', packageEndpoint);
app.use('/package/byRegEx', byRegEx)
app.use('/package', packageRate)
app.use('/tracks', tracks)

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
