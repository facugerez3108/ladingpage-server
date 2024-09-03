import ApiError from "../utils/ApiError";
import multer from "multer";
import prisma from '../client';
import { Request, Response } from "express";
import path from "path";
import fs from 'fs';
import httpStatus from "http-status";


const storage = multer.diskStorage({
    destination: (req: Request, file, cb) => {
        const uploadDir = path.join(__dirname, "../assets");

        // Crear la carpeta si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir); // Carpeta donde se guardan las imágenes
    },
    filename: (req: Request, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Nombre del archivo
    }
});
const upload = multer({ storage });

const uploadImage = async (req: Request, res: Response) => {
   try {
        const { file } = req;
        
        if (!file) {
            throw new ApiError(httpStatus.BAD_REQUEST, "No se subió ninguna imagen");
        }

        const newImage = await prisma.image.create({
            data: {
                fileName: file.filename,
                filePath: file.path,
            }
        });

        res.status(200).json({ message: "Imagen subida con éxito", image: newImage });

    } catch(error) {
        console.log("No se logró subir la imagen", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error al subir la imagen" });
    }
}

const getImages = async (req: Request, res: Response) => {
    try {
        const images = await prisma.image.findMany({
            select: {
                id: true,
                fileName: true,
                filePath: true,
            },
            orderBy: {
                createdAt: 'desc'  
            }
        });

        res.status(httpStatus.OK).json(images);
    } catch (error) {
        console.error("Error al obtener las imágenes:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error al obtener las imágenes" });
    }
};

const deleteImage = async (req: Request, res: Response) => {
    try {
        const imageId = Number(req.params.id);
        
        const image = await prisma.image.findUnique({ 
            where: { id: imageId } 
        });
        
        if(!image){
            console.log("Imagen no encontrada");
            throw new ApiError(httpStatus.NOT_FOUND, "Imagen no encontrada");
        }

        await prisma.image.delete({
            where: { id: imageId }
        });

        res.status(httpStatus.OK).json({ message: "Imagen borrada con éxito" });
    } catch (error) {
        console.log("No se logró borrar la imagen", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error al borrar la imagen" });
    }
};
export default { 
    upload,
    deleteImage, 
    uploadImage,
    getImages
};