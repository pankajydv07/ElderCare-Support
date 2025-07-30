const Request = require('../models/Request');
const User = require('../models/User');

const volunteerController = {
    // Show volunteer dashboard
    dashboard: async (req, res) => {
        try {
            const volunteer = await User.findById(req.session.user.id);
            
            const myTasks = await Request.find({ 
                volunteer: req.session.user.id,
                status: { $in: ['assigned', 'in-progress'] }
            })
            .populate('elder', 'name phone')
            .sort({ assignedAt: -1 })
            .limit(5);

            const availableRequests = await Request.find({ 
                status: 'open',
                'location.city': { $in: volunteer.serviceableLocations }
            })
            .populate('elder', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

            const stats = {
                completedTasks: volunteer.completedTasks,
                activeTasks: await Request.countDocuments({ 
                    volunteer: req.session.user.id, 
                    status: { $in: ['assigned', 'in-progress'] }
                }),
                rating: volunteer.rating,
                badges: volunteer.badges.length
            };

            res.render('volunteer/dashboard', { 
                volunteer, 
                myTasks, 
                availableRequests, 
                stats 
            });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading dashboard' });
        }
    },

    // Browse available requests
    browseRequests: async (req, res) => {
        try {
            const volunteer = await User.findById(req.session.user.id);
            const { category, urgency, radius = 10 } = req.query;

            // Check if volunteer has location coordinates
            if (!volunteer.address || !volunteer.address.coordinates) {
                return res.render('volunteer/browse-requests', {
                    requests: [],
                    categories: ['grocery-shopping', 'medicine-delivery', 'companionship', 'tech-support', 'transportation', 'other'],
                    urgencyLevels: ['low', 'medium', 'high'],
                    filters: { category, urgency, radius },
                    error: 'Please update your profile with a valid address to see nearby requests.'
                });
            }

            let filter = { status: 'open' };
            
            if (category) filter.category = category;
            if (urgency) filter.urgency = urgency;

            // Get all open requests with elder location populated
            let requests = await Request.find(filter)
                .populate({
                    path: 'elder',
                    select: 'name age address',
                    match: {
                        'address.coordinates.latitude': { $exists: true },
                        'address.coordinates.longitude': { $exists: true }
                    }
                })
                .sort({ createdAt: -1 });

            // Filter out requests where elder couldn't be populated (no coordinates)
            requests = requests.filter(request => request.elder);

            // Calculate distances and filter by radius
            const volunteerCoords = volunteer.address.coordinates;
            const nearbyRequests = requests.filter(request => {
                const elderCoords = request.elder.address.coordinates;
                const distance = calculateDistance(
                    volunteerCoords.latitude, volunteerCoords.longitude,
                    elderCoords.latitude, elderCoords.longitude
                );
                
                // Add distance to request object for display
                request.distance = parseFloat(distance.toFixed(1));
                
                return distance <= parseFloat(radius);
            });

            // Sort by distance (nearest first)
            nearbyRequests.sort((a, b) => a.distance - b.distance);

            const categories = ['grocery-shopping', 'medicine-delivery', 'companionship', 'tech-support', 'transportation', 'other'];
            const urgencyLevels = ['low', 'medium', 'high'];

            res.render('volunteer/browse-requests', { 
                requests: nearbyRequests, 
                categories, 
                urgencyLevels,
                filters: { category, urgency, radius },
                volunteerLocation: volunteerCoords,
                error: null
            });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading requests' });
        }
    },

    // Accept a request
    acceptRequest: async (req, res) => {
        try {
            const request = await Request.findById(req.params.id);
            
            if (!request || request.status !== 'open') {
                return res.json({ success: false, message: 'Request not available' });
            }

            request.status = 'assigned';
            request.volunteer = req.session.user.id;
            request.assignedAt = new Date();

            await request.save();
            res.json({ success: true, message: 'Request accepted successfully!' });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: 'Error accepting request' });
        }
    },

    // Show volunteer's tasks
    myTasks: async (req, res) => {
        try {
            const tasks = await Request.find({ volunteer: req.session.user.id })
                .populate('elder', 'name phone address')
                .sort({ assignedAt: -1 });

            res.render('volunteer/my-tasks', { tasks });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading tasks' });
        }
    },

    // Update task status
    updateTaskStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const request = await Request.findById(req.params.id);

            if (!request || request.volunteer.toString() !== req.session.user.id) {
                return res.json({ success: false, message: 'Task not found' });
            }

            request.status = status;
            if (status === 'completed') {
                request.completedAt = new Date();
            }

            await request.save();
            res.json({ success: true, message: 'Task status updated successfully!' });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: 'Error updating task status' });
        }
    },

    // Show volunteer profile
    profile: async (req, res) => {
        try {
            const volunteer = await User.findById(req.session.user.id);
            const stats = {
                completedTasks: volunteer.completedTasks || 0,
                rating: volunteer.rating || 0,
                badges: volunteer.badges || [],
                memberSince: volunteer.createdAt,
                isVerified: volunteer.isVerified
            };
            res.render('volunteer/profile', { volunteer, stats, success: null, error: null });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading profile' });
        }
    },

    // Update volunteer profile
    updateProfile: async (req, res) => {
        console.log('updateProfile called with body:', req.body);
        console.log('updateProfile called with method:', req.method);
        try {
            const { 
                name, 
                email, 
                phone, 
                address, 
                city, 
                latitude, 
                longitude, 
                state, 
                zipCode, 
                skills, 
                availability, 
                bio 
            } = req.body;
            
            // Build address object with coordinates if provided
            let addressData = {};
            if (address || city) {
                addressData = {
                    street: address || '',
                    city: city || '',
                    state: state || '',
                    zipCode: zipCode || ''
                };
                
                // Add coordinates if provided
                if (latitude && longitude) {
                    addressData.coordinates = {
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude)
                    };
                }
            }
            
            const updateData = {
                name,
                email,
                phone,
                address: addressData,
                skills: skills ? skills.split(',').map(skill => skill.trim()) : [],
                availability,
                bio
            };

            const volunteer = await User.findByIdAndUpdate(
                req.session.user.id,
                updateData,
                { new: true, runValidators: true }
            );

            // Update session data
            req.session.user.name = volunteer.name;
            req.session.user.email = volunteer.email;

            const stats = {
                completedTasks: volunteer.completedTasks || 0,
                rating: volunteer.rating || 0,
                badges: volunteer.badges || [],
                memberSince: volunteer.createdAt,
                isVerified: volunteer.isVerified
            };

            res.render('volunteer/profile', { 
                volunteer, 
                stats, 
                success: 'Profile updated successfully!', 
                error: null 
            });
        } catch (error) {
            console.error('Error in updateProfile:', error);
            const volunteer = await User.findById(req.session.user.id);
            const stats = {
                completedTasks: volunteer.completedTasks || 0,
                rating: volunteer.rating || 0,
                badges: volunteer.badges || [],
                memberSince: volunteer.createdAt,
                isVerified: volunteer.isVerified
            };
            res.render('volunteer/profile', { 
                volunteer, 
                stats, 
                success: null, 
                error: 'Error updating profile. Please try again.' 
            });
        }
    }
};

module.exports = volunteerController;

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
