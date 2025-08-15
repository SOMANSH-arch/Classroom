import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  teacher: { type: ObjectId, ref: 'User', required: true },
  students: [{ type: ObjectId, ref: 'User' }],
  published: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Course', CourseSchema);
