import express from 'express';
import { imageController } from '../../controller';


const router = express.Router();

router.post('/upload-image', imageController.upload.single('image'), imageController.uploadImage)