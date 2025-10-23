import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  teacher: { type: ObjectId, ref: 'User', required: true },
  students: [{ type: ObjectId, ref: 'User' }],
  
  price: { type: Number, required: true, default: 0 },
  
  published: { type: Boolean, default: false },

  // --- NEW FIELD ADDED ---
  materials: [{
    title: { type: String, required: true },
    description: String,
    createdAt: { type: Date, default: Date.now }
  }]

}, { timestamps: true });

export default mongoose.model('Course', CourseSchema);