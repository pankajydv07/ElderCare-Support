const express = require('express');
const router = express.Router();

// Session check endpoint for localStorage sync
router.get('/session-check', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ 
            user: {
                id: req.session.user.id,
                name: req.session.user.name,
                email: req.session.user.email,
                role: req.session.user.role
            }
        });
    } else {
        res.json({ user: null });
    }
});

module.exports = router;