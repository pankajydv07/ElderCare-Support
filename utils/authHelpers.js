// Authentication helper functions

/**
 * Get the authenticated user's ID from the session
 * @param {Object} req - Express request object
 * @returns {String} - User ID from session
 */
const getUserId = (req) => {
    return req.session.user ? req.session.user.id : null;
};

/**
 * Get the authenticated user from the session
 * @param {Object} req - Express request object
 * @returns {Object} - User object from session
 */
const getUser = (req) => {
    return req.session.user || null;
};

/**
 * Check if user is authenticated
 * @param {Object} req - Express request object
 * @returns {Boolean} - Whether user is authenticated
 */
const isAuthenticated = (req) => {
    return !!(req.session && req.session.user);
};

/**
 * Check if user has a specific role
 * @param {Object} req - Express request object
 * @param {String} role - Role to check for
 * @returns {Boolean} - Whether user has the specified role
 */
const hasRole = (req, role) => {
    return req.session && req.session.user && req.session.user.role === role;
};

module.exports = {
    getUserId,
    getUser,
    isAuthenticated,
    hasRole
};