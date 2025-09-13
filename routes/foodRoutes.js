const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' });
        }
    }
    res.status(400).json({ error: error.message });
};

// Get all food items
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('food_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new food item with image upload
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'Only image files are allowed' });
        }

        // Upload image to Supabase Storage
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `food-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('food-images')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) {
            if (uploadError.message.includes('already exists')) {
                return res.status(400).json({ error: 'File with this name already exists' });
            }
            throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('food-images')
            .getPublicUrl(filePath);

        // Insert food item into database
        const { data, error: dbError } = await supabase
            .from('food_items')
            .insert([{
                name,
                description,
                price: parseFloat(price),
                category,
                image_url: publicUrl
            }])
            .select();

        if (dbError) throw dbError;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update food item with optional image update
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category } = req.body;
        const file = req.file;

        let imageUrl = null;

        // If new image is provided, upload it
        if (file) {
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `food-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('food-images')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('food-images')
                .getPublicUrl(filePath);

            imageUrl = publicUrl;
        }

        // Prepare update data
        const updateData = {
            name,
            description,
            price: parseFloat(price),
            category,
            updated_at: new Date().toISOString()
        };

        // If new image was uploaded, add it to update data
        if (imageUrl) {
            updateData.image_url = imageUrl;
        }

        const { data, error } = await supabase
            .from('food_items')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Use multer error handling middleware
router.use(handleMulterError);

module.exports = router;