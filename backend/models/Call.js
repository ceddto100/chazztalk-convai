const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CallSchema = new Schema({
  customerId: {
    type: String,
    required: [true, 'Customer ID is required'],
    trim: true,
    index: true
  },
  callDetails: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    enum: {
      values: ['initiated', 'answered', 'completed', 'missed'],
      message: 'Status must be one of: initiated, answered, completed, missed'
    },
    default: 'initiated'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    min: 0
  },
  metadata: {
    elevenlabsSessionId: String,
    elevenlabsSignedUrl: String,
    elevenlabsAgentId: String,
    initiatedBy: {
      type: String,
      enum: ['ai', 'customer', 'system'],
      default: 'customer'
    },
    tags: [String]
  },
  transcript: [{
    speaker: String,
    text: String,
    timestamp: Date
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true, // Automatically create createdAt and updatedAt fields
  toJSON: { virtuals: true }, // Include virtuals when converting to JSON
  toObject: { virtuals: true } // Include virtuals when converting to object
});

// Virtual property to calculate call duration
CallSchema.virtual('calculatedDuration').get(function() {
  if (this.endTime && this.startTime) {
    return (this.endTime - this.startTime) / 1000; // Duration in seconds
  }
  return null;
});

// Pre-save middleware to calculate duration
CallSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = (this.endTime - this.startTime) / 1000; // Duration in seconds
  }
  next();
});

// Index to improve query performance
CallSchema.index({ status: 1, createdAt: -1 });
CallSchema.index({ customerId: 1, createdAt: -1 });

// Static method to get active calls
CallSchema.statics.getActiveCalls = function() {
  return this.find({ status: { $in: ['initiated', 'answered'] } }).sort({ createdAt: -1 });
};

// Instance method to complete a call
CallSchema.methods.completeCall = function() {
  this.status = 'completed';
  this.endTime = new Date();
  return this.save();
};

module.exports = mongoose.model('Call', CallSchema);