require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors    = require('cors')
require('./config/db')

const app = express()

function isAllowedOrigin(origin = '') {
  if (!origin) return true
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:8100',
  ].filter(Boolean)

  if (allowedOrigins.includes(origin)) return true

  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true)
    return callback(new Error(`Origin ${origin} not allowed by CORS`))
  }
}))
app.use(express.json())

// Routes
app.use('/api/auth',         require('./routes/auth'))
app.use('/api/users',        require('./routes/users'))
app.use('/api/my-pets',      require('./routes/myPets'))
app.use('/api/posts',        require('./routes/posts'))
app.use('/api/health',       require('./routes/health'))
app.use('/api/vaccinations', require('./routes/vaccinations'))
app.use('/api/adopt',        require('./routes/adopt'))
app.use('/api/applications', require('./routes/applications'))
app.use('/api/follows',      require('./routes/follows'))
app.use('/api/events',       require('./routes/events'))
app.use('/api/admin',        require('./routes/admin'))

const PORT = process.env.PORT || 5001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
