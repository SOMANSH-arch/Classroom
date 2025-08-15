import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const AssignmentSchema = new mongoose.Schema({
  course: { type: ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  instructions: { type: String, default: '' },
  dueDate: { type: Date }
}, { timestamps: true });

export default mongoose.model('Assignment', AssignmentSchema);
