const User = require('../models/User')
const { uploadFile } = require('../utils/uploadToMinio')

exports.searchUsers = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(30, Math.max(1, Number.parseInt(req.query.limit, 10) || 12))

    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { bio: { $regex: q, $options: 'i' } },
          ],
        }
      : {}

    const [items, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ followersCount: -1, name: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ])

    res.json({
      items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body
    let avatar
    if (req.file) avatar = await uploadFile(req.file.buffer, req.file.originalname, 'avatars')
    const update = { name, bio }
    if (avatar) update.avatar = avatar
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-passwordHash')
    res.json(user)
  } catch (err) { res.status(500).json({ message: err.message }) }
}
