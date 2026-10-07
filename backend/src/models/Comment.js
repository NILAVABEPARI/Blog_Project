const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

// Comments of a post, newest first (the main read path)
commentSchema.index({ post: 1, createdAt: -1 });
// Cascade deletes / per-user lookups
commentSchema.index({ author: 1 });

module.exports = mongoose.model('Comment', commentSchema);
