const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/eventController')
const auth    = require('../middleware/auth')
const role    = require('../middleware/role')
const upload  = require('../middleware/upload')

router.get('/',                              ctrl.list)
router.get('/:id',                           ctrl.get)
router.post('/',           auth, upload.single('coverPhoto'), ctrl.create)
router.put('/:id',         auth, upload.single('coverPhoto'), ctrl.update)
router.delete('/:id',      auth, ctrl.remove)
router.post('/:id/rsvp',   auth, ctrl.rsvp)
router.delete('/:id/rsvp', auth, ctrl.cancelRsvp)
router.delete('/:id/attendees/:userId', auth, role('admin'), ctrl.removeAttendee)

module.exports = router
