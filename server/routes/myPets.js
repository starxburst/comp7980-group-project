const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/myPetController')
const auth    = require('../middleware/auth')
const role    = require('../middleware/role')
const upload  = require('../middleware/upload')

router.get('/',                  auth, ctrl.list)
router.get('/:id',               auth, ctrl.get)
router.post('/',                 auth, upload.array('photos', 5), ctrl.create)
router.put('/:id',               auth, upload.array('photos', 5), ctrl.update)
router.delete('/:id',            auth, ctrl.remove)
router.patch('/:id/adoption',    auth, role('shelter_staff', 'admin'), ctrl.setAdoption)

module.exports = router
