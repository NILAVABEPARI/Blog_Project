const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true },
    // Short preview stored at write time so list queries can skip the full content
    excerpt: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false }
);

postSchema.pre('validate', function () {
  if (this.isModified('content') && this.content) {
    this.excerpt = this.content.slice(0, 200);
  }
});

// Public feed: newest non-deleted posts
postSchema.index({ isDeleted: 1, createdAt: -1 });
// "My posts" / filter by author
postSchema.index({ author: 1, isDeleted: 1, createdAt: -1 });
// Full text search (title weighs more than body)
postSchema.index({ title: 'text', content: 'text' }, { weights: { title: 5, content: 1 } });

module.exports = mongoose.model('Post', postSchema);
