const User = require('../models/User')
const { uploadFile } = require('../utils/uploadToMinio')

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
