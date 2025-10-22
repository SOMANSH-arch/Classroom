import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  teacher: { type: ObjectId, ref: 'User', required: true },
  students: [{ type: ObjectId, ref: 'User' }],
  
  // --- NEW FIELD ADDED ---
  // Price in the smallest currency unit (e.g., paise for INR)
  // 1000 = ₹10.00
  price: { type: Number, required: true, default: 0 },
  
  published: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Course', CourseSchema);