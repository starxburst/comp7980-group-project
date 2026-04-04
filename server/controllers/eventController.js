const mongoose = require('mongoose')
const Event    = require('../models/Event')
const MyPet    = require('../models/MyPet')
const { uploadFile } = require('../utils/uploadToMinio')

exports.list = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }).populate('hostId', 'name avatar')
    res.json(events)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.get = async (req, res) => {
  try {
    const events = await Event.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
      { $unwind: { path: '$attendees', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'mypets', localField: 'attendees.petId',  foreignField: '_id', as: 'attendees.pet' } },
      { $lookup: { from: 'users',  localField: 'attendees.userId', foreignField: '_id', as: 'attendees.owner' } },
      { $unwind: { path: '$attendees.pet',   preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$attendees.owner', preserveNullAndEmptyArrays: true } },
      { $group: {
          _id:         '$_id',
          title:       { $first: '$title' },
          type:        { $first: '$type' },
          date:        { $first: '$date' },
          location:    { $first: '$location' },
          coverPhoto:  { $first: '$coverPhoto' },
          description: { $first: '$description' },
          maxAttendees:{ $first: '$maxAttendees' },
          hostId:      { $first: '$hostId' },
          attendees:   { $push: '$attendees' },
      }},
    ])
    if (!events.length) return res.status(404).json({ message: 'Event not found' })
    res.json(events[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.create = async (req, res) => {
  try {
    const { title, type, date, location, description, maxAttendees } = req.body
    let coverPhoto = ''
    if (req.file) coverPhoto = await uploadFile(req.file.buffer, req.file.originalname, 'events')
    const event = await Event.create({
      hostId: req.user.id,
      title,
      type,
      date,
      location,
      description,
      coverPhoto,
      maxAttendees: maxAttendees ? Number(maxAttendees) : null,
    })
    res.status(201).json(event)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.update = async (req, res) => {
  try {
    const update = { ...req.body }
    if (update.maxAttendees !== undefined) {
      update.maxAttendees = update.maxAttendees ? Number(update.maxAttendees) : null
    }
    if (req.file) update.coverPhoto = await uploadFile(req.file.buffer, req.file.originalname, 'events')
    // host can update their own event; admin can update any
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, hostId: req.user.id }
    const event = await Event.findOneAndUpdate(filter, update, { new: true })
    if (!event) return res.status(404).json({ message: 'Event not found or forbidden' })
    res.json(event)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.remove = async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, hostId: req.user.id }
    await Event.findOneAndDelete(filter)
    res.json({ message: 'Event deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// POST /events/:id/rsvp — idempotent-safe: rejects duplicate userId
exports.rsvp = async (req, res) => {
  try {
    const { petId } = req.body
    const userId = new mongoose.Types.ObjectId(req.user.id)
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    if (event.attendees.some(attendee => String(attendee.userId) === String(userId))) {
      return res.status(400).json({ message: 'Already RSVPed' })
    }
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ message: 'This event is full' })
    }

    let attendeePetId
    if (petId) {
      const pet = await MyPet.findOne({ _id: petId, ownerId: req.user.id })
      if (!pet) return res.status(400).json({ message: 'Selected pet is invalid' })
      attendeePetId = pet._id
    }

    event.attendees.push({ userId, petId: attendeePetId })
    await event.save()
    res.json({ message: 'RSVP recorded' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// DELETE /events/:id/rsvp — cancel own RSVP
exports.cancelRsvp = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id)
    await Event.findByIdAndUpdate(req.params.id, {
      $pull: { attendees: { userId } }
    })
    res.json({ message: 'RSVP cancelled' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// DELETE /events/:id/attendees/:userId — admin force-remove any attendee
exports.removeAttendee = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId)
    await Event.findByIdAndUpdate(req.params.id, {
      $pull: { attendees: { userId } }
    })
    res.json({ message: 'Attendee removed' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
