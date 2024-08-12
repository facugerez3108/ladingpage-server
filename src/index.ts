import express from 'express';
import cors from 'cors';
import http from 'http';
import passport from 'passport';
import httpStatus from 'http-status';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import ApiError from './utils/ApiError';
import { errorConverter, errorHandler } from './middleware/error';
import routes from './routes/api';
import morgan from './config/morgan';
import config from './config/config';

const app = express();

if (config.env !== "test") {
    app.use(morgan.successHandler);
    app.use(morgan.errorHandler);
  }
  

app.use(helmet());

app.use(cors({
    credentials: true,
    origin:'http://localhost:3001'
}));

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use("/api", routes);

app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

app.use(errorConverter);
app.use(errorHandler);

const server = http.createServer(app);
server.listen(3000, () => {
    console.log("Server is running on port 3000");
});