const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
  authorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  petId:          { type: mongoose.Schema.Types.ObjectId, ref: 'MyPet' },
  type:           { type: String, enum: ['pawpost', 'story'], default: 'pawpost' },
  mediaUrl:       { type: String, required: true },
  caption:        { type: String, default: '' },
  likeCount:      { type: Number, default: 0 },
  likedBy:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt:      { type: Date },
  adoptionBadge:  { type: Boolean, default: false },
  adoptionPetId:  { type: mongoose.Schema.Types.ObjectId, ref: 'MyPet' },
}, { timestamps: true })

module.exports = mongoose.model('Post', postSchema)
