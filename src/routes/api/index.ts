import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import imagesRoute from './image.route';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/users',
    route: userRoute
  },
  {
    path: '/image',
    route: imagesRoute
  }
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

export default router;