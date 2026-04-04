const mongoose = require('mongoose')

const vaccinationSchema = new mongoose.Schema({
  petId:        { type: mongoose.Schema.Types.ObjectId, ref: 'MyPet', required: true },
  vaccineName:  { type: String, required: true },
  dateGiven:    { type: Date, required: true },
  nextDueDate:  { type: Date },
  vetName:      { type: String, default: '' },
  notes:        { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Vaccination', vaccinationSchema)
