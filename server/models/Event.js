const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
  hostId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:      { type: String, required: true },
  type:       { type: String, enum: ['walk', 'fair', 'training', 'meetup'], default: 'meetup' },
  date:       { type: Date, required: true },
  location:   { type: String, default: '' },
  coverPhoto:  { type: String, default: '' },
  description: { type: String, default: '' },
  maxAttendees: { type: Number, default: null, min: 1 },
  attendees:  [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    petId:  { type: mongoose.Schema.Types.ObjectId, ref: 'MyPet' },
  }],
}, { timestamps: true })

module.exports = mongoose.model('Event', eventSchema)
