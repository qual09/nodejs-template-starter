// ### Imports
import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Server } from 'http';
import { Application, Request, Response, NextFunction } from 'express';

// ### Local Modules
import { userRoutes } from './api/user';
import { authRoutes } from './api/auth';

// ### Environment Viariables
dotenv.config();
const apiUrl: string = '/api';
const clientApp: string = '/../public';
const viewsFolder: string = 'views';

// ### App
const app: Application = express();

// ### Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());

// ### Views
app.use('/', express.static(__dirname + clientApp));
app.use('/server', express.static(path.join(__dirname, viewsFolder)));

// ### REST API
app.get(`${apiUrl}/`, (req: Request, res: Response, next: NextFunction) => {
  const currentDate: string = new Date().toISOString();
  res.json({ info: 'Nodejs REST API', timestamp: currentDate });
});
app.use(`${apiUrl}/user`, userRoutes);
app.use(`${apiUrl}/auth`, authRoutes);

// ### Start Server
const HOSTNAME: string = process.env.HOSTNAME || 'localhost';
const PORT: number = Number(process.env.PORT) || 3000;
const server: Server = app.listen(PORT, () => {
  console.log(process.env.TEST || '');
  console.log(`Server started on http://${HOSTNAME}:${PORT}`);
});

// ### Stop Server
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed: Process Terminated!');
  });
});