const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const User = require('../models/User'); // make sure this is imported at the top

// Base directory for uploads (should match multer's destination)
const uploadsDir = path.join(__dirname, '../uploads');

/**
 * @desc Upload a single profile image
 * @route POST /api/upload/profile
 * @access Private (user)
 */
exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded.' });
        }

        const originalFilePath = req.file.path;
        const outputFileName = `profile-${req.user.id}-${Date.now()}.webp`;
        const outputPath = path.join(uploadsDir, 'profiles', outputFileName);

        await sharp(originalFilePath)
            .resize(400, 400, {
                fit: sharp.fit.inside,
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(outputPath);

        fs.unlink(originalFilePath, (err) => {
            if (err) console.error('Error deleting original file:', err);
        });

        const imageUrl = `/uploads/profiles/${outputFileName}`;

        // ✅ Update user record
        await User.findByIdAndUpdate(req.user.id, { profileImage: imageUrl });

        res.json({ imageUrl });

    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(500).json({ msg: 'Server error during profile image upload.' });
    }
};

/**
 * @desc Upload multiple event images
 * @route POST /api/upload/event
 * @access Private (organizer/admin)
 */
exports.uploadEventImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ msg: 'No files uploaded.' });
        }

        const imageUrls = [];
        const maxDimension = 4000; // Max 4K (3840x2160 approx, but for max dimension)

        await Promise.all(req.files.map(async (file) => {
            const originalFilePath = file.path;
            const outputFileName = `event-${Date.now()}-${file.originalname.split('.')[0]}.webp`;
            const outputPath = path.join(uploadsDir, 'events', outputFileName);

            try {
                await sharp(originalFilePath)
                    .resize(maxDimension, maxDimension, {
                        fit: sharp.fit.inside, // Ensures image fits within dimensions, maintaining aspect ratio
                        withoutEnlargement: true // Prevents upsizing small images
                    })
                    .webp({ quality: 80 }) // Convert to WebP for better performance
                    .toFile(outputPath);

                fs.unlink(originalFilePath, (err) => {
                    if (err) console.error('Error deleting original event file:', err);
                });

                // Adjust the base URL based on how your static files are served
                imageUrls.push(`/uploads/events/${outputFileName}`);
            } catch (sharpError) {
                console.error(`Error processing event image ${file.originalname}:`, sharpError);
                // Optionally, you could choose to include a placeholder or skip this image
                // For now, we'll just log and proceed without this image's URL
                fs.unlink(originalFilePath, (err) => {
                    if (err) console.error('Error deleting failed-to-process file:', err);
                });
            }
        }));

        res.json({ imageUrls });

    } catch (error) {
        console.error('Error uploading event images:', error);
        res.status(500).json({ msg: 'Server error during event images upload.' });
    }
};
