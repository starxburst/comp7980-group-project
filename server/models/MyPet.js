const mongoose = require('mongoose')

const myPetSchema = new mongoose.Schema({
  ownerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:       { type: String, required: true, trim: true },
  species:    { type: String, required: true },
  breed:      { type: String, default: '' },
  dob:        { type: Date },
  sex:        { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
  color:      { type: String, default: '' },
  weight:     { type: Number, default: null },
  photos:     [{ type: String }],
  isPublic:   { type: Boolean, default: true },
  aiBreedRaw: { type: String, default: '' },
  description: { type: String, default: '' },
  personality: [{ type: String }],

  // Adoption fields — only meaningful when adoptionStatus != 'none'
  adoptionStatus:       { type: String, enum: ['none', 'available', 'pending', 'adopted'], default: 'none' },
  adoptedBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  adoptionContactEmail: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('MyPet', myPetSchema)
