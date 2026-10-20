import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';


export const profileImageUploadOptions = {

    storage: diskStorage({
        destination: './uploads/profile',

        filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const fileExt = extname(file.originalname);
            callback(null, `${uniqueSuffix}${fileExt}`);
        },
    }),

    fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
            return callback(new BadRequestException('Only image files are allowed (jpg, jpeg, png, webp)'), false);
        }
        callback(null, true);
    },

    limits: {
        fileSize: 5 * 1024 * 1024,
    },
};


export const paymentProofUploadOptions = {

    storage: diskStorage({
        destination: './uploads/payments',

        filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const fileExt = extname(file.originalname);
            callback(null, `${uniqueSuffix}${fileExt}`);
        },
    }),

    fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
            return callback(new BadRequestException('Only image files are allowed (jpg, jpeg, png, webp)'), false);
        }
        callback(null, true);
    },

    limits: {
        fileSize: 5 * 1024 * 1024,
    },
};


export const assigemntDocsUploadOptions = {

    storage: diskStorage({
        destination: './uploads/assigments',

        filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const fileExt = extname(file.originalname);
            callback(null, `${uniqueSuffix}${fileExt}`);
        },
    }),

    fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(pdf)$/)) {
            return callback(new BadRequestException('Only PDF files are allowed'), false);
        }
        callback(null, true);
    },

    limits: {
        fileSize: 5 * 1024 * 1024,
    },
};

export const answersheetUploadOptions = {

    storage: diskStorage({
        destination: './uploads/answer_sheets',

        filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const fileExt = extname(file.originalname);
            callback(null, `${uniqueSuffix}${fileExt}`);
        },
    }),

    fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(pdf)$/)) {
            return callback(new BadRequestException('Only PDF files are allowed'), false);
        }
        callback(null, true);
    },

    limits: {
        fileSize: 5 * 1024 * 1024,
    },
};