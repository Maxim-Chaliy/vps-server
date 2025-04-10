const mongoose = require('mongoose');

const setMatSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, maxlength: 255, required: false },
    category: { type: String, required: true },
    visibility: { type: String, required: true },
    file: { type: [String], required: false },
    image: { type: [String], required: false },
    updatedAt: { type: Date, default: Date.now },
});

const SetMat = mongoose.model('SetMat', setMatSchema);

module.exports = SetMat;
