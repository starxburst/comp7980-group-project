const Vaccination = require('../models/Vaccination')

exports.list = async (req, res) => {
  try {
    const records = await Vaccination.find({ petId: req.params.petId }).sort({ dateGiven: -1 })
    res.json(records)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.create = async (req, res) => {
  try {
    const { vaccineName, dateGiven, nextDueDate, vetName, notes } = req.body
    const record = await Vaccination.create({ petId: req.params.petId, vaccineName, dateGiven, nextDueDate, vetName, notes })
    res.status(201).json(record)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.update = async (req, res) => {
  try {
    const record = await Vaccination.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!record) return res.status(404).json({ message: 'Record not found' })
    res.json(record)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.remove = async (req, res) => {
  try {
    await Vaccination.findByIdAndDelete(req.params.id)
    res.json({ message: 'Vaccination record deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
