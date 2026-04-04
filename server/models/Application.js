const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema({
  petId:        { type: mongoose.Schema.Types.ObjectId, ref: 'MyPet', required: true },
  applicantId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  status:       { type: String, enum: ['pending', 'reviewing', 'approved', 'rejected'], default: 'pending' },
  contactEmail: { type: String, default: '' },
  applicantInfo: {
    homeType:     { type: String, default: '' },
    hasOtherPets: { type: Boolean, default: false },
    reason:       { type: String, default: '' },
  },
  staffNotes: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Application', applicationSchema)
