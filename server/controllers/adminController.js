const User      = require('../models/User')
const Post      = require('../models/Post')
const MyPet     = require('../models/MyPet')

exports.dashboard = async (req, res) => {
  try {
    const [userCount, postCount, petCount, adoptablePetCount] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      MyPet.countDocuments(),
      MyPet.countDocuments({ adoptionStatus: { $ne: 'none' } }),
    ])
    const roleBreakdown = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ])
    res.json({ userCount, postCount, petCount, adoptablePetCount, roleBreakdown })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 })
    res.json(users)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.updateUser = async (req, res) => {
  try {
    const { role } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'User deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
