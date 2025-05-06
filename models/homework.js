const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: function() { return !this.group_id; } 
  },
  group_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Group', 
    required: function() { return !this.student_id; } 
  },
  day: { type: String, required: true },
  dueDate: { type: Date, required: true },
  files: { type: [String], required: true },
  answer: { type: [String], default: [] },
  grades: { 
    type: Map,
    of: Number,
    default: {}
  },
  uploadedAt: { type: Date, default: Date.now },
  sentAt: { type: Date }
});

const Homework = mongoose.model('Homework', homeworkSchema);

module.exports = Homework;