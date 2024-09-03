import express from 'express';
import { imageController } from '../../controller';


const router = express.Router();

router.post('/upload-image', imageController.upload.single('image'), imageController.uploadImage)
router.get('/get-images', imageController.getImages);
router.delete('/delete-image/:id', imageController.deleteImage);

export default router;