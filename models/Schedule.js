const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Student' },
    day: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: { type: Number, required: true, min: 30 }, // в минутах, минимум 30
    subject: { type: String, required: true },
    description: { type: String, default: '' },
    attendance: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Добавляем виртуальное поле для времени окончания
scheduleSchema.virtual('endTime').get(function() {
    const [hours, minutes] = this.time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + this.duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;