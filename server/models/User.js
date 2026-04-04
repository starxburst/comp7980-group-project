const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true },
  passwordHash:   { type: String, required: true },
  role:           { type: String, enum: ['owner', 'shelter_staff', 'admin'], default: 'owner' },
  avatar:         { type: String, default: '' },
  bio:            { type: String, default: '' },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  savedPets:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'MyPet' }],
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
