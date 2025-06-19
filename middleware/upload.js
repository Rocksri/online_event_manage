const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determine subfolder based on the route or intent
        let subfolder = '';
        if (req.originalUrl.includes('/profile')) {
            subfolder = 'profiles';
        } else if (req.originalUrl.includes('/event')) {
            subfolder = 'events';
        } else {
            subfolder = 'others'; // Default or unhandled category
        }

        const destPath = path.join(uploadsDir, subfolder);
        // Create the subfolder if it doesn't exist
        if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
        }
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        // Generate a unique filename: fieldname-timestamp-original_extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'), false);
};

// Configure multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10 // Max 10MB per file (adjust as needed)
    },
    fileFilter: fileFilter
});

module.exports = upload;
