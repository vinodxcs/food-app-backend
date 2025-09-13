const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const express = require('express'); // Don't forget to import express!
const supabase = require('../config/supabase'); // Check your actual config path

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Get user's cart
router.get('/', async (req, res) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { data, error } = await supabase
            .from('shopping_carts')
            .select(`
        *,
        cart_items (*,
          food_items (*)
        )
      `)
            .eq('user_id', user.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add item to cart
router.post('/add', async (req, res) => {
    try {
        const { food_item_id, quantity } = req.body;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Get or create cart
        let { data: cart } = await supabase
            .from('shopping_carts')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!cart) {
            const { data: newCart } = await supabase
                .from('shopping_carts')
                .insert([{ user_id: user.id }])
                .select()
                .single();
            cart = newCart;
        }

        // Check if item already exists in cart
        const { data: existingItem } = await supabase
            .from('cart_items')
            .select('*')
            .eq('cart_id', cart.id)
            .eq('food_item_id', food_item_id)
            .single();

        if (existingItem) {
            // Update quantity
            const { data, error } = await supabase
                .from('cart_items')
                .update({ quantity: existingItem.quantity + quantity })
                .eq('id', existingItem.id)
                .select();

            if (error) throw error;
            res.json(data);
        } else {
            // Add new item
            const { data, error } = await supabase
                .from('cart_items')
                .insert([
                    {
                        cart_id: cart.id,
                        food_item_id,
                        quantity
                    }
                ])
                .select();

            if (error) throw error;
            res.json(data);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove item from cart
router.delete('/remove/:item_id', async (req, res) => {
    try {
        const { item_id } = req.params;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', item_id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update item quantity
router.put('/update/:item_id', async (req, res) => {
    try {
        const { item_id } = req.params;
        const { quantity } = req.body;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { data, error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', item_id)
            .select();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;