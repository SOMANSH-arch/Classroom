import mongoose from 'mongoose'; // <-- Ensure this import is present

const { ObjectId } = mongoose.Schema.Types; // <-- Ensure this line is present

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  teacher: { type: ObjectId, ref: 'User', required: true },
  students: [{ type: ObjectId, ref: 'User' }],
  price: { type: Number, required: true, default: 0 },
  published: { type: Boolean, default: false },

  // --- MODIFIED MATERIALS ARRAY ---
  materials: [{
    title: { type: String, required: true },
    description: String,
    filePath: String, // To store the path like 'uploads/materials/12345-myfile.pdf'
    fileName: String, // Optional: Store original filename for display
    createdAt: { type: Date, default: Date.now }
  }]

}, { timestamps: true });

export default mongoose.model('Course', CourseSchema); // <-- Ensure 'default' export is present