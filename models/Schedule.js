const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    day: { type: String, required: true },
    date: { type: Date, required: true }, // Дата как объект Date
    time: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    attendance: { type: Boolean, default: false }
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
