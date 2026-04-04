const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/applicationController')
const auth    = require('../middleware/auth')
const role    = require('../middleware/role')

router.post('/',           auth, ctrl.apply)
router.get('/mine',        auth, ctrl.myApplications)
router.get('/staff',       auth, role('shelter_staff', 'admin'), ctrl.staffList)
router.put('/:id/status',  auth, role('shelter_staff', 'admin'), ctrl.updateStatus)

module.exports = router
