const Follow = require('../models/Follow')
const User   = require('../models/User')

exports.follow = async (req, res) => {
  try {
    const followingId = req.params.id
    if (followingId === req.user.id.toString()) return res.status(400).json({ message: 'Cannot follow yourself' })
    await Follow.create({ followerId: req.user.id, followingId })
    await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: 1 } })
    await User.findByIdAndUpdate(followingId,  { $inc: { followersCount: 1 } })
    res.json({ message: 'Followed' })
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Already following' })
    res.status(500).json({ message: err.message })
  }
}

exports.unfollow = async (req, res) => {
  try {
    const result = await Follow.findOneAndDelete({ followerId: req.user.id, followingId: req.params.id })
    if (result) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: -1 } })
      await User.findByIdAndUpdate(req.params.id, { $inc: { followersCount: -1 } })
    }
    res.json({ message: 'Unfollowed' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.followers = async (req, res) => {
  try {
    const follows = await Follow.find({ followingId: req.params.id }).populate('followerId', 'name avatar')
    res.json(follows.map(f => f.followerId))
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.following = async (req, res) => {
  try {
    const follows = await Follow.find({ followerId: req.params.id }).populate('followingId', 'name avatar')
    res.json(follows.map(f => f.followingId))
  } catch (err) { res.status(500).json({ message: err.message }) }
}
