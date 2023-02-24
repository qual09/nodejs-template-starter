// Imports
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Local Modules
const userRoutes = require('./api/user');

// Environment Viariables
dotenv.config();
const apiUrl = '/api';

// App
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());

// Root Page
app.use('/', express.static(__dirname + '/public'));

// Views
app.use('/server', express.static(path.join(__dirname, 'views')));

// REST API
app.use(`${apiUrl}/user`, userRoutes);
app.get(`${apiUrl}/status`, (req, res) => {
  res.json({ info: 'Node.js, Express, and Postgres API' });
});

// Start
const HOSTNAME = process.env.HOSTNAME || 'localhost';
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(process.env.TEST || '');
  console.log(`Server started on http://${HOSTNAME}:${PORT}`);
});

// Stop
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed: Process Terminated!');
  });
});