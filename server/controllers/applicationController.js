const Application = require('../models/Application')
const MyPet       = require('../models/MyPet')

exports.apply = async (req, res) => {
  try {
    const { petId, homeType, hasOtherPets, reason, contactEmail } = req.body
    const pet = await MyPet.findById(petId)
    if (!pet || pet.adoptionStatus !== 'available')
      return res.status(400).json({ message: 'This pet is not available for adoption' })
    if (String(pet.ownerId) === String(req.user.id))
      return res.status(400).json({ message: 'You cannot apply to adopt your own pet' })

    const existing = await Application.findOne({ petId, applicantId: req.user.id })
    if (existing) return res.status(400).json({ message: 'Already applied for this pet' })

    const app = await Application.create({
      petId, applicantId: req.user.id, contactEmail,
      applicantInfo: { homeType, hasOtherPets, reason },
    })

    if (pet.adoptionStatus === 'available') {
      pet.adoptionStatus = 'pending'
      await pet.save()
    }

    res.status(201).json(app)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.myApplications = async (req, res) => {
  try {
    const apps = await Application.find({ applicantId: req.user.id })
      .populate('petId')
      .sort({ createdAt: -1 })
    res.json(apps)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// Staff sees only applications for their own pets
exports.staffList = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50)
    const status = (req.query.status || '').trim()
    const pet = (req.query.pet || '').trim().toLowerCase()

    const apps = await Application.find()
      .populate({
        path: 'petId',
        match: { ownerId: req.user.id, adoptionStatus: { $ne: 'none' } },
      })
      .populate('applicantId', 'name avatar email')
      .sort({ createdAt: -1 })

    const filtered = apps
      .filter(app => app.petId)
      .map(app => ({
        ...app.toObject(),
        pet: app.petId,
        applicant: app.applicantId,
      }))
      .filter(app => {
        if (status && app.status !== status) return false
        if (!pet) return true
        const petName = (app.pet?.name || '').toLowerCase()
        const petBreed = (app.pet?.breed || '').toLowerCase()
        return petName.includes(pet) || petBreed.includes(pet)
      })

    const total = filtered.length
    const totalPages = Math.max(Math.ceil(total / limit), 1)
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * limit
    const data = filtered.slice(start, start + limit)

    res.json({
      data,
      meta: {
        page: safePage,
        limit,
        total,
        totalPages,
      },
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.updateStatus = async (req, res) => {
  try {
    const { status, staffNotes } = req.body
    const app = await Application.findByIdAndUpdate(
      req.params.id, { status, staffNotes }, { new: true }
    )
    if (!app) return res.status(404).json({ message: 'Application not found' })

    if (status === 'approved') {
      await MyPet.findByIdAndUpdate(app.petId, {
        adoptionStatus: 'adopted',
        adoptedBy:      app.applicantId,
      })
    } else if (status === 'rejected') {
      // Auto-restore to available if no other approved app exists
      const pet = await MyPet.findById(app.petId)
      if (pet && pet.adoptionStatus === 'pending') {
        const otherApproved = await Application.findOne({
          petId: app.petId, status: 'approved', _id: { $ne: app._id },
        })
        if (!otherApproved)
          await MyPet.findByIdAndUpdate(app.petId, { adoptionStatus: 'available' })
      }
    }
    res.json(app)
  } catch (err) { res.status(500).json({ message: err.message }) }
}
