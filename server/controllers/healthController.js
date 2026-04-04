const HealthLog   = require('../models/HealthLog')
const Vaccination = require('../models/Vaccination')

exports.getLogs = async (req, res) => {
  try {
    const logs = await HealthLog.find({ petId: req.params.petId }).sort({ date: -1 })
    res.json(logs)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.addLog = async (req, res) => {
  try {
    const { date, weightKg, notes } = req.body
    const log = await HealthLog.create({ petId: req.params.petId, date, weightKg, notes, loggedBy: req.user.id })
    res.status(201).json(log)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.deleteLog = async (req, res) => {
  try {
    await HealthLog.findByIdAndDelete(req.params.id)
    res.json({ message: 'Log deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
