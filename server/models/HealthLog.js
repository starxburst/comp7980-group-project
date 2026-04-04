const mongoose = require('mongoose')

const healthLogSchema = new mongoose.Schema({
  petId:    { type: mongoose.Schema.Types.ObjectId, ref: 'MyPet', required: true },
  date:     { type: Date, required: true },
  weightKg: { type: Number, required: true },
  notes:    { type: String, default: '' },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('HealthLog', healthLogSchema)
