// ### Imports
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// ### Local Modules
const userRoutes = require('./api/user');

// ### Environment Viariables
dotenv.config();
const apiUrl = '/api';
const clientApp = '../public';
const viewsFolder = 'views';

// ### App
const app = express();

// ### Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());

// ### Views
app.use('/', express.static(path.join(__dirname, clientApp)));
app.use('/server', express.static(path.join(__dirname, viewsFolder)));

// ### REST API
app.get(`${apiUrl}/`, (req, res) => {
  res.json({ info: 'Nodejs REST API' });
});
app.use(`${apiUrl}/user`, userRoutes);

// ### Start Server
const HOSTNAME = process.env.HOSTNAME || 'localhost';
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(process.env.TEST || '');
  console.log(`Server started on http://${HOSTNAME}:${PORT}`);
});

// ### Stop Server
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed: Process Terminated!');
  });
});