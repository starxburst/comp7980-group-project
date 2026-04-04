const MyPet = require('../models/MyPet')

// GET /api/adopt?status=available|pending|adopted
// Default returns available + pending + adopted (frontend handles default hide of adopted)
exports.list = async (req, res) => {
  try {
    const { status } = req.query
    const query = status
      ? { adoptionStatus: status }
      : { adoptionStatus: { $in: ['available', 'pending', 'adopted'] } }

    const pets = await MyPet.find(query)
      .populate('ownerId',  'name avatar email')
      .populate('adoptedBy', 'name avatar')
      .sort({ adoptionStatus: 1, createdAt: -1 })
    res.json(pets)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// GET /api/adopt/mine — shelter staff: their own adoption listings
exports.mine = async (req, res) => {
  try {
    const pets = await MyPet.find({ ownerId: req.user.id, adoptionStatus: { $ne: 'none' } })
      .populate('adoptedBy', 'name avatar')
      .sort({ createdAt: -1 })
    res.json(pets)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// GET /api/adopt/:id
exports.get = async (req, res) => {
  try {
    const pet = await MyPet.findById(req.params.id)
      .populate('ownerId',  'name avatar email')
      .populate('adoptedBy', 'name avatar')
    if (!pet || pet.adoptionStatus === 'none')
      return res.status(404).json({ message: 'Pet not found' })
    res.json(pet)
  } catch (err) { res.status(500).json({ message: err.message }) }
}
