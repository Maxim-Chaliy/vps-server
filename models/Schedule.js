const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
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
  day: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  duration: { 
    type: Number, 
    required: true, 
    min: 30 
  },
  subject: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  // Обновленное поле attendance для поддержки как индивидуальных, так и групповых занятий
  attendance: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Виртуальное поле для времени окончания
scheduleSchema.virtual('endTime').get(function() {
  const [hours, minutes] = this.time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + this.duration;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;