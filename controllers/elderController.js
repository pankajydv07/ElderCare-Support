const Request = require('../models/Request');
const User = require('../models/User');
const Feedback = require('../models/Feedback');

const elderController = {
    // Show elder dashboard
    dashboard: async (req, res) => {
        try {
            const requests = await Request.find({ elder: req.session.user.id })
                .populate('volunteer', 'name rating')
                .sort({ createdAt: -1 })
                .limit(5);

            const stats = {
                totalRequests: await Request.countDocuments({ elder: req.session.user.id }),
                activeRequests: await Request.countDocuments({ 
                    elder: req.session.user.id, 
                    status: { $in: ['open', 'assigned', 'in-progress'] }
                }),
                completedRequests: await Request.countDocuments({ 
                    elder: req.session.user.id, 
                    status: 'completed' 
                })
            };

            res.render('elder/dashboard', { requests, stats });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading dashboard' });
        }
    },

    // Show create request form
    showCreateRequest: (req, res) => {
        res.render('elder/create-request', { error: null });
    },

    // Create new request
    createRequest: async (req, res) => {
        try {
            const { title, description, category, urgency, preferredDate, preferredTime, specialInstructions } = req.body;

            // Get elder's profile to use their address
            const elder = await User.findById(req.session.user.id);
            
            if (!elder.address || !elder.address.coordinates) {
                return res.render('elder/create-request', { 
                    error: 'Please update your profile with a valid address before creating requests.' 
                });
            }

            const request = new Request({
                elder: req.session.user.id,
                title,
                description,
                category,
                urgency,
                preferredDate: preferredDate ? new Date(preferredDate) : null,
                preferredTime,
                location: {
                    address: elder.address.street,
                    city: elder.address.city,
                    coordinates: {
                        lat: elder.address.coordinates.latitude,
                        lng: elder.address.coordinates.longitude
                    }
                },
                specialInstructions
            });

            await request.save();
            res.redirect('/elder/my-requests');
        } catch (error) {
            console.error(error);
            res.render('elder/create-request', { error: 'Error creating request' });
        }
    },

    // Show all elder's requests
    myRequests: async (req, res) => {
        try {
            const requests = await Request.find({ elder: req.session.user.id })
                .populate('volunteer', 'name phone rating')
                .sort({ createdAt: -1 });

            res.render('elder/my-requests', { requests });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading requests' });
        }
    },

    // Show feedback form
    showFeedback: async (req, res) => {
        try {
            const request = await Request.findById(req.params.id)
                .populate('volunteer', 'name');

            if (!request || request.elder.toString() !== req.session.user.id) {
                return res.render('error', { error: 'Request not found' });
            }

            if (request.status !== 'completed') {
                return res.render('error', { error: 'Cannot provide feedback for incomplete request' });
            }

            // Check if feedback already exists
            const existingFeedback = await Feedback.findOne({ request: request._id });
            if (existingFeedback) {
                return res.render('error', { error: 'Feedback already submitted' });
            }

            res.render('elder/feedback', { request, error: null });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading feedback form' });
        }
    },

    // Submit feedback
    submitFeedback: async (req, res) => {
        try {
            const { rating, comment, wouldRecommend } = req.body;
            const request = await Request.findById(req.params.id);

            if (!request || request.elder.toString() !== req.session.user.id) {
                return res.render('error', { error: 'Request not found' });
            }

            const feedback = new Feedback({
                request: request._id,
                elder: req.session.user.id,
                volunteer: request.volunteer,
                rating: parseInt(rating),
                comment,
                wouldRecommend: wouldRecommend === 'true'
            });

            await feedback.save();

            // Update volunteer's rating and completed tasks
            const volunteer = await User.findById(request.volunteer);
            if (volunteer) {
                volunteer.completedTasks += 1;
                
                // Calculate new average rating
                const allFeedback = await Feedback.find({ volunteer: volunteer._id });
                const avgRating = allFeedback.reduce((sum, fb) => sum + fb.rating, 0) / allFeedback.length;
                volunteer.rating = Math.round(avgRating * 10) / 10;

                // Award badges based on completed tasks
                if (volunteer.completedTasks === 5 && !volunteer.badges.some(b => b.name === 'Helper')) {
                    volunteer.badges.push({ name: 'Helper' });
                } else if (volunteer.completedTasks === 20 && !volunteer.badges.some(b => b.name === 'Community Star')) {
                    volunteer.badges.push({ name: 'Community Star' });
                } else if (volunteer.completedTasks === 50 && !volunteer.badges.some(b => b.name === 'Guardian Angel')) {
                    volunteer.badges.push({ name: 'Guardian Angel' });
                }

                await volunteer.save();
            }

            res.redirect('/elder/my-requests');
        } catch (error) {
            console.error(error);
            res.render('elder/feedback', { error: 'Error submitting feedback' });
        }
    },

    // Show elder profile
    profile: async (req, res) => {
        try {
            const elder = await User.findById(req.session.user.id);
            const stats = {
                totalRequests: await Request.countDocuments({ elder: req.session.user.id }),
                completedRequests: await Request.countDocuments({ 
                    elder: req.session.user.id, 
                    status: 'completed' 
                }),
                memberSince: elder.createdAt
            };
            res.render('elder/profile', { elder, stats, success: null, error: null });
        } catch (error) {
            console.error(error);
            res.render('error', { error: 'Error loading profile' });
        }
    },

    // Update elder profile
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
                emergencyContact, 
                emergencyPhone, 
                preferences 
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
                emergencyContact,
                emergencyPhone,
                preferences
            };

            const elder = await User.findByIdAndUpdate(
                req.session.user.id,
                updateData,
                { new: true, runValidators: true }
            );

            // Update session data
            req.session.user.name = elder.name;
            req.session.user.email = elder.email;

            const stats = {
                totalRequests: await Request.countDocuments({ elder: req.session.user.id }),
                completedRequests: await Request.countDocuments({ 
                    elder: req.session.user.id, 
                    status: 'completed' 
                }),
                memberSince: elder.createdAt
            };

            res.render('elder/profile', { 
                elder, 
                stats, 
                success: 'Profile updated successfully!', 
                error: null 
            });
        } catch (error) {
            console.error('Elder profile update error:', error);
            const elder = await User.findById(req.session.user.id);
            const stats = {
                totalRequests: await Request.countDocuments({ elder: req.session.user.id }),
                completedRequests: await Request.countDocuments({ 
                    elder: req.session.user.id, 
                    status: 'completed' 
                }),
                memberSince: elder.createdAt
            };
            res.render('elder/profile', { 
                elder, 
                stats, 
                success: null, 
                error: 'Error updating profile. Please try again.' 
            });
        }
    }
};

module.exports = elderController;
