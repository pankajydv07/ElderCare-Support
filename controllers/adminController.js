const User = require('../models/User');
const Request = require('../models/Request');
const Feedback = require('../models/Feedback');

const adminController = {
    // Show admin dashboard
    dashboard: async (req, res) => {
        try {
            const stats = {
                totalUsers: await User.countDocuments(),
                totalElders: await User.countDocuments({ role: 'elder' }),
                totalVolunteers: await User.countDocuments({ role: 'volunteer' }),
                verifiedVolunteers: await User.countDocuments({ role: 'volunteer', isVerified: true }),
                totalRequests: await Request.countDocuments(),
                openRequests: await Request.countDocuments({ status: 'open' }),
                completedRequests: await Request.countDocuments({ status: 'completed' }),
                totalFeedbacks: await Feedback.countDocuments()
            };

            // Recent activities
            const recentRequests = await Request.find()
                .populate('elder', 'name')
                .populate('volunteer', 'name')
                .sort({ createdAt: -1 })
                .limit(10);

            const pendingVerifications = await User.find({ 
                role: 'volunteer', 
                isVerified: false 
            }).limit(5);

            res.render('admin/dashboard', { 
                stats, 
                recentRequests, 
                pendingVerifications 
            });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading admin dashboard' });
        }
    },

    // Show volunteers to verify
    verifyVolunteers: async (req, res) => {
        try {
            const volunteers = await User.find({ role: 'volunteer' })
                .sort({ createdAt: -1 });

            res.render('admin/verify-volunteers', { volunteers });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading volunteers' });
        }
    },

    // Update volunteer verification status
    updateVerification: async (req, res) => {
        try {
            const { isVerified } = req.body;
            await User.findByIdAndUpdate(req.params.id, { 
                isVerified: isVerified === 'true' 
            });

            res.json({ success: true, message: 'Verification status updated' });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: 'Error updating verification' });
        }
    },

    // Manage all requests
    manageRequests: async (req, res) => {
        try {
            const { status, category } = req.query;
            let filter = {};

            if (status) filter.status = status;
            if (category) filter.category = category;

            const requests = await Request.find(filter)
                .populate('elder', 'name email')
                .populate('volunteer', 'name email')
                .sort({ createdAt: -1 });

            const statuses = ['open', 'assigned', 'in-progress', 'completed', 'cancelled'];
            const categories = ['grocery-shopping', 'medicine-delivery', 'companionship', 'tech-support', 'transportation', 'other'];

            res.render('admin/manage-requests', { 
                requests, 
                statuses, 
                categories,
                filters: { status, category }
            });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading requests' });
        }
    },

    // Show analytics
    analytics: async (req, res) => {
        try {
            // Request analytics by category
            const requestsByCategory = await Request.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            // Request analytics by status
            const requestsByStatus = await Request.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            // Monthly request trends (last 6 months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const monthlyRequests = await Request.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            // Top volunteers
            const topVolunteers = await User.find({ role: 'volunteer' })
                .sort({ completedTasks: -1, rating: -1 })
                .limit(10)
                .select('name completedTasks rating badges');

            // Average ratings
            const avgRating = await Feedback.aggregate([
                { $group: { _id: null, avgRating: { $avg: '$rating' } } }
            ]);

            res.render('admin/analytics', {
                requestsByCategory,
                requestsByStatus,
                monthlyRequests,
                topVolunteers,
                avgRating: avgRating[0]?.avgRating || 0
            });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading analytics' });
        }
    },

    // Show all users management page
    manageUsers: async (req, res) => {
        try {
            const { role, verified, search, page = 1 } = req.query;
            const limit = 20;
            const skip = (page - 1) * limit;

            // Build filter query
            let filter = {};
            if (role && role !== 'all') {
                filter.role = role;
            }
            if (verified === 'true') {
                filter.isVerified = true;
            } else if (verified === 'false') {
                filter.isVerified = false;
            }
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }

            const users = await User.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalUsers = await User.countDocuments(filter);
            const totalPages = Math.ceil(totalUsers / limit);

            // Get user statistics
            const userStats = {
                totalElders: await User.countDocuments({ role: 'elder' }),
                totalVolunteers: await User.countDocuments({ role: 'volunteer' }),
                totalAdmins: await User.countDocuments({ role: 'admin' }),
                verifiedVolunteers: await User.countDocuments({ role: 'volunteer', isVerified: true }),
                unverifiedVolunteers: await User.countDocuments({ role: 'volunteer', isVerified: false })
            };

            res.render('admin/manage-users', { 
                users, 
                userStats,
                currentPage: parseInt(page),
                totalPages,
                totalUsers,
                filters: { role, verified, search }
            });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading users' });
        }
    },

    // Get user details for editing
    getUserDetails: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Get user's requests and tasks if applicable
            let userRequests = [];
            let userTasks = [];
            
            if (user.role === 'elder') {
                userRequests = await Request.find({ elder: user._id })
                    .populate('volunteer', 'name')
                    .sort({ createdAt: -1 });
            } else if (user.role === 'volunteer') {
                userTasks = await Request.find({ volunteer: user._id })
                    .populate('elder', 'name')
                    .sort({ createdAt: -1 });
            }

            res.json({ 
                user: user.toObject(), 
                requests: userRequests, 
                tasks: userTasks 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error fetching user details' });
        }
    },

    // Update user information
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Remove sensitive fields that shouldn't be updated through this route
            delete updates.password;
            delete updates._id;

            const user = await User.findByIdAndUpdate(id, updates, { 
                new: true, 
                runValidators: true 
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ 
                success: true, 
                message: 'User updated successfully',
                user: user.toObject()
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error updating user' });
        }
    },

    // Delete user
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Don't allow deletion of the current admin
            if (id === req.session.user.id) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Handle cascading deletions
            if (user.role === 'elder') {
                // Delete or reassign elder's requests
                await Request.deleteMany({ elder: id });
                await Feedback.deleteMany({ elder: id });
            } else if (user.role === 'volunteer') {
                // Unassign volunteer from requests
                await Request.updateMany(
                    { volunteer: id }, 
                    { $unset: { volunteer: 1 }, status: 'open' }
                );
                await Feedback.deleteMany({ volunteer: id });
            }

            await User.findByIdAndDelete(id);

            res.json({ 
                success: true, 
                message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} deleted successfully` 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error deleting user' });
        }
    },

    // Bulk user actions
    bulkUserActions: async (req, res) => {
        try {
            const { action, userIds } = req.body;

            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({ error: 'No users selected' });
            }

            let result = {};

            switch (action) {
                case 'verify':
                    result = await User.updateMany(
                        { _id: { $in: userIds }, role: 'volunteer' },
                        { isVerified: true }
                    );
                    break;
                case 'unverify':
                    result = await User.updateMany(
                        { _id: { $in: userIds }, role: 'volunteer' },
                        { isVerified: false }
                    );
                    break;
                case 'delete':
                    // Don't delete current admin
                    const filteredIds = userIds.filter(id => id !== req.session.user.id);
                    
                    // Handle cascading deletions
                    await Request.deleteMany({ elder: { $in: filteredIds } });
                    await Request.updateMany(
                        { volunteer: { $in: filteredIds } },
                        { $unset: { volunteer: 1 }, status: 'open' }
                    );
                    await Feedback.deleteMany({ 
                        $or: [
                            { elder: { $in: filteredIds } },
                            { volunteer: { $in: filteredIds } }
                        ]
                    });
                    
                    result = await User.deleteMany({ _id: { $in: filteredIds } });
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid action' });
            }

            res.json({ 
                success: true, 
                message: `${action.charAt(0).toUpperCase() + action.slice(1)} operation completed`,
                affected: result.modifiedCount || result.deletedCount
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error performing bulk action' });
        }
    }
};

module.exports = adminController;
