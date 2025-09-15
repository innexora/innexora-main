const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  food: {
    type: mongoose.Schema.ObjectId,
    ref: 'Food',
    required: [true, 'Food item is required'],
  },
  foodName: {
    type: String,
    required: [true, 'Food name is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative'],
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [200, 'Special instructions cannot exceed 200 characters'],
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    guest: {
      type: mongoose.Schema.ObjectId,
      ref: 'Guest',
      required: [true, 'Guest is required'],
    },
    guestName: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
    },
    room: {
      type: mongoose.Schema.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
    type: {
      type: String,
      enum: ['room_service', 'restaurant', 'takeaway'],
      default: 'room_service',
    },
    deliveryTime: {
      type: Date,
    },
    estimatedPreparationTime: {
      type: Number, // in minutes
      default: 30,
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Special instructions cannot exceed 500 characters'],
    },
    preparedBy: {
      type: String,
      trim: true,
    },
    deliveredBy: {
      type: String,
      trim: true,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
orderSchema.index({ status: 1 });
orderSchema.index({ guest: 1 });
orderSchema.index({ room: 1 });
orderSchema.index({ roomNumber: 1 });
// orderNumber index removed as it's already defined as unique in schema
orderSchema.index({ createdAt: -1 });

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  
  try {
    // Generate a unique order number
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp}-${random}`;
    
    // Ensure uniqueness by checking if this order number already exists
    const existingOrder = await this.constructor.findOne({ orderNumber: this.orderNumber });
    if (existingOrder) {
      // If duplicate, generate a new one
      const newRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.orderNumber = `ORD-${timestamp}-${newRandom}`;
    }
  } catch (error) {
    console.error('Error generating order number:', error);
    // Fallback order number
    this.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  
  next();
});

// Calculate total amount before saving
orderSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((total, item) => total + item.totalPrice, 0);
  }
  next();
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60)); // in minutes
});

module.exports = mongoose.model('Order', orderSchema);
