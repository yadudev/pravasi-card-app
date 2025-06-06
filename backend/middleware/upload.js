const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Helpers = require('../utils/helpers');

class UploadMiddleware {
  static createStorage(destination = 'uploads') {
    // Ensure upload directory exists
    const uploadPath = path.join(__dirname, '..', destination);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const sanitizedName = Helpers.sanitizeFilename(file.originalname);
        const ext = path.extname(sanitizedName);
        const name = path.basename(sanitizedName, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
      },
    });
  }

  static fileFilter(allowedTypes) {
    return (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
          ),
          false
        );
      }
    };
  }

  static imageUpload(options = {}) {
    const {
      destination = 'uploads/images',
      maxSize = 5 * 1024 * 1024, // 5MB
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    } = options;

    return multer({
      storage: this.createStorage(destination),
      limits: { fileSize: maxSize },
      fileFilter: this.fileFilter(allowedTypes),
    });
  }

  static documentUpload(options = {}) {
    const {
      destination = 'uploads/documents',
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    } = options;

    return multer({
      storage: this.createStorage(destination),
      limits: { fileSize: maxSize },
      fileFilter: this.fileFilter(allowedTypes),
    });
  }

  static async optimizeImage(inputPath, outputPath, options = {}) {
    const { width = 1200, height = 800, quality = 80 } = options;

    try {
      await sharp(inputPath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toFile(outputPath);

      // Remove original file
      fs.unlinkSync(inputPath);

      return outputPath;
    } catch (error) {
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }
}

module.exports = UploadMiddleware;
