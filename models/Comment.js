const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  from_id: { type: Number, required: true },
  date: { type: Date, required: true },
  text: { type: String, required: true },
  user: {
    id: { type: Number, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    photo_50: { type: String, required: true }
  }
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
