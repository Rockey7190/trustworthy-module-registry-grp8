import express from 'express';
import bodyParser from 'body-parser';
import { router } from './routes';
import userAuthRoutes from './Api/UserAuthentication';
import uploadPackageRoutes from './Api/uploadPackage'; // Upload package routes

const app = express();
const port = 3000;

// Middleware for parsing JSON and form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Include user authentication routes
app.use('/api', userAuthRoutes);

// Include main router (if necessary)
app.use('/api', router);

// Register the upload routes
app.use('/api', uploadPackageRoutes);  // Upload package routes

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

