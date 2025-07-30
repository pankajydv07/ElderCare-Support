const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    phone: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['elder', 'volunteer', 'admin'],
        default: 'elder'
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        fullAddress: String, // Complete formatted address
        coordinates: {
            latitude: {
                type: Number,
                required: true
            },
            longitude: {
                type: Number,
                required: true
            }
        }
    },
    // Elder-specific fields
    age: {
        type: Number,
        required: function() { return this.role === 'elder'; }
    },
    emergencyContact: {
        name: String,
        phone: String,
        relation: String
    },
    needs: [{
        type: String,
        enum: ['grocery-shopping', 'medicine-delivery', 'companionship', 'tech-support', 'transportation', 'other']
    }],
    // Volunteer-specific fields
    bio: {
        type: String,
        required: function() { return this.role === 'volunteer'; }
    },
    serviceableLocations: [String],
    availableTime: {
        weekdays: Boolean,
        weekends: Boolean,
        mornings: Boolean,
        afternoons: Boolean,
        evenings: Boolean
    },
    skills: [String],
    isVerified: {
        type: Boolean,
        default: false
    },
    badges: [{
        name: String,
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }],
    completedTasks: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

// Calculate distance between two users using Haversine formula
userSchema.methods.calculateDistanceTo = function(otherUser) {
    const R = 6371; // Earth's radius in kilometers
    const lat1 = this.address.coordinates.latitude * Math.PI / 180;
    const lat2 = otherUser.address.coordinates.latitude * Math.PI / 180;
    const deltaLat = (otherUser.address.coordinates.latitude - this.address.coordinates.latitude) * Math.PI / 180;
    const deltaLon = (otherUser.address.coordinates.longitude - this.address.coordinates.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in kilometers
};

// Static method to find volunteers within radius
userSchema.statics.findVolunteersNearby = async function(elderCoordinates, radiusKm = 10) {
    // Using MongoDB's geospatial queries for better performance
    return this.find({
        role: 'volunteer',
        isVerified: true,
        'address.coordinates.latitude': { $exists: true },
        'address.coordinates.longitude': { $exists: true },
        $expr: {
            $lte: [
                {
                    $multiply: [
                        6371, // Earth radius in km
                        {
                            $acos: {
                                $add: [
                                    {
                                        $multiply: [
                                            { $sin: { $multiply: [{ $divide: [elderCoordinates.latitude, 180] }, Math.PI] } },
                                            { $sin: { $multiply: [{ $divide: ['$address.coordinates.latitude', 180] }, Math.PI] } }
                                        ]
                                    },
                                    {
                                        $multiply: [
                                            { $cos: { $multiply: [{ $divide: [elderCoordinates.latitude, 180] }, Math.PI] } },
                                            { $cos: { $multiply: [{ $divide: ['$address.coordinates.latitude', 180] }, Math.PI] } },
                                            { $cos: { $subtract: [
                                                { $multiply: [{ $divide: ['$address.coordinates.longitude', 180] }, Math.PI] },
                                                { $multiply: [{ $divide: [elderCoordinates.longitude, 180] }, Math.PI] }
                                            ]}}
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                },
                radiusKm
            ]
        }
    });
};

module.exports = mongoose.model('User', userSchema);
