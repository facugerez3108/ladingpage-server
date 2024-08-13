import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import multer from "multer";
import { Image, User } from "@prisma/client";
import prisma from '../client';
import { Request, Response } from "express";
import path from "path";

const storage = multer.diskStorage({
    destination: (req: Request, file, cb) => {
        cb(null, "/assets") // Carpeta donde se guardan las imágenes
    },
    filename: (req: Request, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Nombre del archivo
    }
});

const upload = multer({ storage });

const uploadImage = async (req: Request, res: Response) => {
   try{
    const { file } = req;
    const user = req.user as User;
    
    if(!file){
        throw new ApiError(httpStatus.BAD_REQUEST, "No se subió ninguna imágen")
    }

    const newImage = await prisma.image.create({
        data: {
            fileName: file.filename,
            filePath: file.path,
            userId: user.id
        }
    })

    res.status(200).json({ message: "Imagen subida con éxito", image: newImage});

   }catch(error) {
        console.log("No se logró", error);
        throw new ApiError(httpStatus.BAD_REQUEST, "No se pudo subir la imágen")
   }
}

export default { 
    upload, 
    uploadImage
}