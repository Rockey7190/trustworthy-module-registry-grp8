import express from 'express';
import bodyParser from 'body-parser';
import { router } from './routes';
import userAuthRoutes from './Api/UserAuthentication'; // Ensure this is the correct path

const app = express();
const port = 3000;

// Middleware for parsing JSON
app.use(bodyParser.json());

// Include routes from 'userAuthRoutes'
app.use('/api', userAuthRoutes);

// Include any other routes as necessary
app.use('/api', router);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
