const MyPet = require('../models/MyPet')
const { uploadFile } = require('../utils/uploadToMinio')

exports.list = async (req, res) => {
  try {
    const pets = await MyPet.find({ ownerId: req.user.id })
    res.json(pets)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.get = async (req, res) => {
  try {
    const pet = await MyPet.findById(req.params.id)
    if (!pet) return res.status(404).json({ message: 'Pet not found' })
    res.json(pet)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.create = async (req, res) => {
  try {
    const { name, species, breed, dob, sex, color, weight,
            description, personality, aiBreedRaw } = req.body
    let photos = []
    if (req.files?.length)
      photos = await Promise.all(req.files.map(f => uploadFile(f.buffer, f.originalname, 'pets')))
    const pet = await MyPet.create({
      ownerId: req.user.id,
      name, species, breed, dob, sex, color,
      weight: weight ? Number(weight) : undefined,
      photos, isPublic: true, description, aiBreedRaw,
      personality: personality ? personality.split(',').map(s => s.trim()).filter(Boolean) : [],
    })
    res.status(201).json(pet)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.update = async (req, res) => {
  try {
    const { name, species, breed, dob, sex, color, weight,
            description, personality, aiBreedRaw } = req.body
    const update = { name, species, breed, dob, sex, color, isPublic: true, description, aiBreedRaw }
    if (weight !== undefined) update.weight = weight ? Number(weight) : null
    if (personality !== undefined)
      update.personality = typeof personality === 'string'
        ? personality.split(',').map(s => s.trim()).filter(Boolean)
        : personality
    if (req.files?.length)
      update.photos = await Promise.all(req.files.map(f => uploadFile(f.buffer, f.originalname, 'pets')))
    const pet = await MyPet.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id }, update, { new: true }
    )
    if (!pet) return res.status(404).json({ message: 'Pet not found' })
    res.json(pet)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.remove = async (req, res) => {
  try {
    await MyPet.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id })
    res.json({ message: 'Pet deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// PATCH /api/my-pets/:id/adoption — shelter_staff sets adoption status & contact email
exports.setAdoption = async (req, res) => {
  try {
    const { adoptionStatus, adoptionContactEmail } = req.body
    const update = {}
    if (adoptionStatus       !== undefined) update.adoptionStatus       = adoptionStatus
    if (adoptionContactEmail !== undefined) update.adoptionContactEmail = adoptionContactEmail
    // Clear adoptedBy when re-opening
    if (adoptionStatus && adoptionStatus !== 'adopted') update.adoptedBy = null
    const pet = await MyPet.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id }, update, { new: true }
    )
    if (!pet) return res.status(404).json({ message: 'Pet not found' })
    res.json(pet)
  } catch (err) { res.status(500).json({ message: err.message }) }
}
