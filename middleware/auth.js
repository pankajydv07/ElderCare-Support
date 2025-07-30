// Check if user is authenticated
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// Check if user has specific role
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.session.user || req.session.user.role !== role) {
            return res.status(403).render('error', { error: 'Access denied' });
        }
        next();
    };
};

// Check if user is elder
const requireElder = requireRole('elder');

// Check if user is volunteer
const requireVolunteer = requireRole('volunteer');

// Check if user is admin
const requireAdmin = requireRole('admin');

module.exports = {
    requireAuth,
    requireRole,
    requireElder,
    requireVolunteer,
    requireAdmin
};
