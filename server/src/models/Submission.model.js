import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const SubmissionSchema = new mongoose.Schema({
  assignment: { type: ObjectId, ref: 'Assignment', required: true },
  student: { type: ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },     // could hold text/links
  files: [{ url: String, name: String }],
  score: { type: Number, min: 0, max: 100 },
  feedback: { type: String, default: '' },    // teacher feedback
  aiFeedback: { type: String, default: '' }   // AI suggestions
}, { timestamps: true });

SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model('Submission', SubmissionSchema);
