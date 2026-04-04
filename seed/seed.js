require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
const path     = require('path')
const fs       = require('fs')

// ─── Load pre-uploaded MinIO images ──────────────────────────────────────────
const imagesPath = path.join(__dirname, 'images.json')
if (!fs.existsSync(imagesPath)) {
  console.error('✗  seed/images.json not found.')
  console.error('   Run  npm run fetch-images  first, then re-run seed.')
  process.exit(1)
}
const IMGS = JSON.parse(fs.readFileSync(imagesPath, 'utf8'))

// pick a random image from a category, cycling if index exceeds array length
const pickImg = (category, index) => {
  const arr = IMGS[category]
  if (!arr || !arr.length) return null
  return arr[index % arr.length]
}

// ─── Inline mini-models ───────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: String, email: String, passwordHash: String,
  role: { type: String, default: 'owner' },
  avatar: String, bio: String,
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  savedPets: [mongoose.Schema.Types.ObjectId],
}, { timestamps: true })

const myPetSchema = new mongoose.Schema({
  ownerId: mongoose.Schema.Types.ObjectId,
  name: String, species: String, breed: String,
  dob: Date, sex: String, color: String,
  photos: [String], isPublic: Boolean, aiBreedRaw: String,
  weight:               { type: Number, default: null },
  description:          { type: String, default: '' },
  personality:          [{ type: String }],
  adoptionStatus:       { type: String, default: 'none' },
  adoptedBy:            { type: mongoose.Schema.Types.ObjectId, default: null },
  adoptionContactEmail: { type: String, default: '' },
}, { timestamps: true })

const postSchema = new mongoose.Schema({
  authorId: mongoose.Schema.Types.ObjectId,
  petId:    mongoose.Schema.Types.ObjectId,
  type: { type: String, default: 'pawpost' },
  mediaUrl: String, caption: String,
  sentimentLabel: String, sentimentScore: Number,
  likedBy: [mongoose.Schema.Types.ObjectId],
  likeCount: { type: Number, default: 0 },
  expiresAt: Date,
}, { timestamps: true })

const followSchema = new mongoose.Schema({
  followerId:  mongoose.Schema.Types.ObjectId,
  followingId: mongoose.Schema.Types.ObjectId,
}, { timestamps: true })
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true })

const healthLogSchema = new mongoose.Schema({
  petId: mongoose.Schema.Types.ObjectId,
  date: Date, weightKg: Number, notes: String,
  loggedBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true })

const vaccinationSchema = new mongoose.Schema({
  petId: mongoose.Schema.Types.ObjectId,
  vaccineName: String, dateGiven: Date,
  nextDueDate: Date, vetName: String, notes: String,
}, { timestamps: true })

const eventSchema = new mongoose.Schema({
  hostId: mongoose.Schema.Types.ObjectId,
  title: String, type: String,
  date: Date, location: String, coverPhoto: String,
  description: { type: String, default: '' },
  attendees: [{ userId: mongoose.Schema.Types.ObjectId, petId: mongoose.Schema.Types.ObjectId }],
}, { timestamps: true })

const applicationSchema = new mongoose.Schema({
  petId: mongoose.Schema.Types.ObjectId,
  applicantId: mongoose.Schema.Types.ObjectId,
  status: { type: String, default: 'pending' },
  contactEmail: { type: String, default: '' },
  applicantInfo: {
    homeType: String, hasOtherPets: Boolean, reason: String,
  },
  staffNotes: String,
}, { timestamps: true })

const commentSchema = new mongoose.Schema({
  postId: mongoose.Schema.Types.ObjectId,
  authorId: mongoose.Schema.Types.ObjectId,
  content: String,
}, { timestamps: true })

const User        = mongoose.model('User',        userSchema)
const MyPet       = mongoose.model('MyPet',       myPetSchema)
const Post        = mongoose.model('Post',        postSchema)
const Follow      = mongoose.model('Follow',      followSchema)
const HealthLog   = mongoose.model('HealthLog',   healthLogSchema)
const Vaccination = mongoose.model('Vaccination', vaccinationSchema)
const Event       = mongoose.model('Event',       eventSchema)
const Application = mongoose.model('Application', applicationSchema)
const Comment     = mongoose.model('Comment',     commentSchema)

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pick   = arr => arr[Math.floor(Math.random() * arr.length)]
const pickN  = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n)
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const daysAgo = n => new Date(Date.now() - n * 86_400_000)
const daysFromNow = n => new Date(Date.now() + n * 86_400_000)

// Image helpers — pull from pre-uploaded MinIO images
let _dogIdx = 0, _catIdx = 0, _avatarIdx = 0, _eventIdx = 0
const dogImg   = () => pickImg('dogs',   _dogIdx++)
const catImg   = () => pickImg('cats',   _catIdx++)
const userImg  = () => pickImg('avatars',_avatarIdx++)
const eventImg = () => pickImg('events', _eventIdx++)

// ─── Static data pools ───────────────────────────────────────────────────────
const DOG_BREEDS = ['Golden Retriever','Labrador','Poodle','Shiba Inu','Beagle',
  'Corgi','Husky','Border Collie','Dalmatian','Pomeranian']
const CAT_BREEDS = ['Scottish Fold','Persian','Siamese','Ragdoll','Maine Coon',
  'British Shorthair','Bengal','Sphynx','Abyssinian','Burmese']
const DOG_NAMES  = ['Buddy','Max','Charlie','Cooper','Milo','Teddy','Rocky','Duke','Bear','Zeus',
  'Bella','Luna','Daisy','Molly','Lola','Sadie','Rosie','Nala','Ruby','Penny']
const CAT_NAMES  = ['Mochi','Oliver','Leo','Simba','Loki','Felix','Jasper','Oscar','Oreo','Shadow',
  'Luna','Bella','Cleo','Nala','Cleo','Mittens','Willow','Pumpkin','Hazel','Cookie']
const COLORS     = ['golden','white','black','tabby','grey','brown','cream','orange','spotted','bicolor']
const CAPTIONS   = [
  'Morning zoomies! 🏃', 'Nap time is the best time 😴', 'Caught in the act 😂',
  'This face though 🥺', 'Park adventures! 🌿', 'Sunbeam supremacy ☀️',
  'Someone found my socks again 🧦', 'Monday mood 😒', 'Treat time! 🦴',
  'Living my best life 🐾', 'Did someone say walk? 🦮', 'Rain is cancelled, sun is on. 🌤',
  'Weekend vibes only 🛋️', 'Always the star of the show ⭐', 'Zoom zoom zoom 🌀',
  'The couch is mine now 👑', 'Bath day survivor 🚿', 'Back from the vet, send snacks 🏥',
  'Found this spot, not leaving 🪴', 'Officially tired of Mondays 🗓️',
]
const BIOS = [
  'Pet parent 🐾 | Coffee addict ☕', 'Dog mom living her best life 🐕',
  'Cat dad, zero regrets 🐈', 'Rescue pet advocate 🏠❤️',
  'My pets are my children 🥰', 'Outdoor adventures with my furry crew 🏕️',
  'Sharing daily life with my spoiled pets 📸', 'Veterinary nurse & animal lover 💉🐾',
  'Pet photographer in training 📷', 'Retired & loving every moment with my pets 🌸',
]
const PERSONALITIES = ['friendly','playful','energetic','calm','affectionate',
  'curious','shy','brave','loyal','gentle','mischievous','independent']
const SHELTER_DESCS = [
  'A sweetheart looking for a forever home.',
  'Gets along great with kids and other pets.',
  'Loves cuddles and long naps on the couch.',
  'Full of energy and ready for outdoor adventures.',
  'A gentle soul who just wants to be loved.',
  'House-trained and very well-behaved.',
  'Playful and curious — will keep you entertained!',
  'Quiet and calm, perfect for apartment living.',
]
const VACCINE_NAMES = ['Rabies','DHPP','Bordetella','Leptospirosis','FVRCP','FeLV']
const VET_NAMES     = ['Dr. Chan','Dr. Lee','Dr. Wong','Dr. Patel','Dr. Kim']
const EVENT_TYPES   = ['walk','fair','training','meetup']
const EVENT_TITLES  = ['Spring Adoption Fair','Saturday Dog Walk','Puppy Training Class',
                       'Cat Café Meetup','Pet Photography Day','Summer Bark-B-Q']
const EVENT_DESCS   = [
  'Join us for a fun-filled morning at the park! Bring your furry friends for some fresh air and socializing.',
  'Our annual adoption fair — meet dozens of pets looking for forever homes. Refreshments provided.',
  'A professional trainer will guide you through basic commands. Treats provided, bring your pup!',
  'Relax with coffee and cats in a cozy café setting. Purr-fect for a lazy Sunday.',
  'Learn how to capture the best shots of your pets. Amateur-friendly, no fancy equipment needed.',
  'Summer cookout for pets and their humans! Dog-friendly BBQ snacks and wading pools.',
]
const LOCATIONS     = ['Victoria Park, HK','Bowen Road, HK','Stanley Waterfront, HK',
  'Tai Po Waterfront Park','Shing Mun Country Park','Sha Tin Park']
const COMMENT_TEXTS = [
  'So cute!',
  'Absolutely love this photo.',
  'That expression is everything.',
  'Looks like such a sweet pet.',
  'Would totally adopt if I could.',
  'Tiny superstar energy.',
  'This made my day.',
  'Sending boops and treats.',
]

// ─── Main seed ────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected — clearing collections…')

  await Promise.all([
    User.deleteMany(), MyPet.deleteMany(),
    Post.deleteMany(), Follow.deleteMany(), HealthLog.deleteMany(),
    Vaccination.deleteMany(), Event.deleteMany(), Application.deleteMany(), Comment.deleteMany(),
  ])

  const hash = await bcrypt.hash('password123', 12)

  // ── 1. Users ────────────────────────────────────────────────────────────────
  const fixedUsers = [
    { name: 'Alice Paw',            email: 'alice@demo.com',   role: 'owner',         bio: 'Dog mom 🐕',                     avatar: userImg() },
    { name: 'Bob Whiskers',         email: 'bob@demo.com',     role: 'owner',         bio: 'Cat dad 🐈',                     avatar: userImg() },
    { name: 'Happy Tails Shelter',  email: 'shelter@demo.com', role: 'shelter_staff', bio: 'Connecting pets with families',  avatar: userImg() },
    { name: 'Admin',                email: 'admin@demo.com',   role: 'admin',         bio: 'Platform admin',                 avatar: userImg() },
  ]
  const randomNames = [
    'Chris Park','Diana Wolf','Evan Finn','Fiona Bell','George Tan',
    'Hannah Rose','Ivan Cruz','Julia Moon','Kevin Lam','Laura Stone',
    'Marco Diaz','Nina Fox','Oscar Tran','Paula Reed','Quinn Hart',
    'Rachel Yip','Sam Ng','Tina Wu','Uma Chan','Victor Ho',
  ]
  const randomUsers = randomNames.map((name, i) => ({
    name,
    email: `user${i + 1}@demo.com`,
    role: 'owner',
    bio: pick(BIOS),
    avatar: userImg(),
  }))

  const allUserData = [...fixedUsers, ...randomUsers].map(u => ({
    ...u, passwordHash: hash, followersCount: 0, followingCount: 0,
  }))
  const users = await User.insertMany(allUserData)

  const [alice, bob, shelter, admin, ...owners] = users
  const allOwners = [alice, bob, ...owners]   // everyone except shelter + admin

  console.log(`  ✓ ${users.length} users`)

  // ── 2. My Pets (1–3 pets per owner) ─────────────────────────────────────────
  const petDocs = []
  for (const owner of allOwners) {
    const count = randInt(1, 3)
    for (let i = 0; i < count; i++) {
      const isDog  = Math.random() > 0.45
      const species = isDog ? 'Dog' : 'Cat'
      const breed   = isDog ? pick(DOG_BREEDS) : pick(CAT_BREEDS)
      const name    = isDog ? pick(DOG_NAMES)  : pick(CAT_NAMES)
      const imgFn   = isDog ? dogImg : catImg
      petDocs.push({
        ownerId:  owner._id,
        name, species, breed,
        dob:      daysAgo(randInt(180, 2000)),
        sex:      pick(['male', 'female']),
        color:    pick(COLORS),
        photos:   [imgFn()],
        isPublic: true,
        aiBreedRaw: breed,
        weight:   isDog ? randInt(5, 35) : randInt(3, 7),
        // No adoption fields — these are regular owner pets
      })
    }
  }

  // ── 3. Shelter's adoption pets (12 pets owned by shelter user) ───────────────
  for (let i = 0; i < 12; i++) {
    const isDog  = i < 7
    const species = isDog ? 'Dog' : 'Cat'
    const breed   = isDog ? pick(DOG_BREEDS) : pick(CAT_BREEDS)
    const name    = isDog ? pick(DOG_NAMES)  : pick(CAT_NAMES)
    const imgFn   = isDog ? dogImg : catImg
    petDocs.push({
      ownerId:              shelter._id,
      name, species, breed,
      dob:                  daysAgo(randInt(180, 2920)),
      sex:                  pick(['male', 'female']),
      color:                pick(COLORS),
      photos:               [imgFn()],
      isPublic:             true,
      aiBreedRaw:           breed,
      weight:               isDog ? randInt(5, 30) : randInt(3, 6),
      personality:          pickN(PERSONALITIES, randInt(2, 4)),
      description:          pick(SHELTER_DESCS),
      adoptionStatus:       'available',
      adoptionContactEmail: 'shelter@demo.com',
    })
  }

  const pets = await MyPet.insertMany(petDocs)
  console.log(`  ✓ ${pets.length} my_pets (incl. ${12} shelter adoption listings)`)

  // Helper: get pets owned by a user
  const petsByOwner = uid => pets.filter(p => String(p.ownerId) === String(uid))
  const shelterPets = petsByOwner(shelter._id)
  const adoptablePets = shelterPets.filter(p => p.adoptionStatus !== 'none')

  // ── 4. Health logs & vaccinations per pet ───────────────────────────────────
  const healthDocs = []
  const vaccineDocs = []
  for (const pet of pets) {
    let weight = pet.weight || (pet.species === 'Dog' ? randInt(5, 35) : randInt(3, 7))
    for (let i = 5; i >= 0; i--) {
      weight += (Math.random() - 0.4) * 0.3
      healthDocs.push({
        petId: pet._id, loggedBy: pet.ownerId,
        date: daysAgo(i * 60),
        weightKg: Math.round(weight * 10) / 10,
        notes: i === 0 ? 'Latest checkup — all good!' : '',
      })
    }
    for (let v = 0; v < randInt(1, 2); v++) {
      const dateGiven = daysAgo(randInt(30, 365))
      vaccineDocs.push({
        petId: pet._id, vaccineName: pick(VACCINE_NAMES),
        dateGiven, nextDueDate: daysFromNow(randInt(180, 365)),
        vetName: pick(VET_NAMES), notes: 'Routine vaccination',
      })
    }
  }
  await HealthLog.insertMany(healthDocs)
  await Vaccination.insertMany(vaccineDocs)
  console.log(`  ✓ ${healthDocs.length} health logs, ${vaccineDocs.length} vaccinations`)

  // ── 5. Posts (3–6 per owner) ─────────────────────────────────────────────────
  const postDocs = []
  for (const owner of allOwners) {
    const ownerPets = petsByOwner(owner._id)
    if (!ownerPets.length) continue
    const count = randInt(3, 6)
    for (let i = 0; i < count; i++) {
      const pet    = pick(ownerPets)
      const isDog  = pet.species === 'Dog'
      const imgFn  = isDog ? dogImg : catImg
      const isStory = Math.random() < 0.15
      postDocs.push({
        authorId: owner._id,
        petId:    pet._id,
        type:     isStory ? 'story' : 'pawpost',
        mediaUrl: imgFn(),
        caption:  pick(CAPTIONS),
        sentimentLabel: pick(['positive', 'positive', 'positive', 'neutral', 'negative']),
        sentimentScore: Math.round((0.6 + Math.random() * 0.4) * 100) / 100,
        likedBy:  [],
        likeCount: 0,
        createdAt: daysAgo(randInt(0, 60)),
        ...(isStory ? { expiresAt: daysFromNow(1) } : {}),
      })
    }
  }
  const posts = await Post.insertMany(postDocs)
  console.log(`  ✓ ${posts.length} posts`)

  // ── 5b. Comments (seed visible discussion on posts) ───────────────────────
  const commentDocs = []
  for (const post of pickN(posts, Math.min(18, posts.length))) {
    const commenters = pickN(
      allOwners.filter(owner => String(owner._id) !== String(post.authorId)),
      randInt(1, 3)
    )
    for (const commenter of commenters) {
      commentDocs.push({
        postId: post._id,
        authorId: commenter._id,
        content: pick(COMMENT_TEXTS),
        createdAt: daysAgo(randInt(0, 20)),
      })
    }
  }
  await Comment.insertMany(commentDocs)
  console.log(`  ✓ ${commentDocs.length} comments`)

  // ── 6. Likes — random owners like random posts ───────────────────────────────
  const likeOps = []
  for (const post of posts) {
    const likers = pickN(allOwners, randInt(0, Math.min(8, allOwners.length)))
      .filter(u => String(u._id) !== String(post.authorId))
    if (likers.length) {
      likeOps.push(Post.updateOne(
        { _id: post._id },
        { $set: { likedBy: likers.map(u => u._id), likeCount: likers.length } }
      ))
    }
  }
  await Promise.all(likeOps)
  console.log(`  ✓ likes distributed`)

  // ── 7. Follows — each owner follows 4–10 random others ──────────────────────
  const followDocs = []
  const followSet  = new Set()
  for (const follower of allOwners) {
    const targets = pickN(
      allOwners.filter(u => String(u._id) !== String(follower._id)),
      randInt(4, 10)
    )
    for (const target of targets) {
      const key = `${follower._id}-${target._id}`
      if (!followSet.has(key)) {
        followSet.add(key)
        followDocs.push({ followerId: follower._id, followingId: target._id })
      }
    }
  }
  await Follow.insertMany(followDocs)

  // Update follower/following counts accurately
  const followerCountMap  = {}
  const followingCountMap = {}
  for (const f of followDocs) {
    const frid = String(f.followerId)
    const fgid = String(f.followingId)
    followingCountMap[frid] = (followingCountMap[frid] || 0) + 1
    followerCountMap[fgid]  = (followerCountMap[fgid]  || 0) + 1
  }
  await Promise.all(
    allOwners.map(u => User.updateOne({ _id: u._id }, {
      $set: {
        followersCount: followerCountMap[String(u._id)]  || 0,
        followingCount: followingCountMap[String(u._id)] || 0,
      }
    }))
  )
  console.log(`  ✓ ${followDocs.length} follows`)

  // ── 8. Events (6) ────────────────────────────────────────────────────────────
  const eventDocs = []
  for (let i = 0; i < 6; i++) {
    const host = i < 2 ? shelter : pick(allOwners)
    const attendeeOwners = pickN(allOwners, randInt(2, 6))
    eventDocs.push({
      hostId:      host._id,
      title:       EVENT_TITLES[i],
      description: EVENT_DESCS[i],
      type:        pick(EVENT_TYPES),
      date:        daysFromNow(randInt(5, 90)),
      location:    pick(LOCATIONS),
      coverPhoto:  eventImg(),
      attendees:   attendeeOwners.map(u => ({
        userId: u._id,
        petId:  pick(petsByOwner(u._id) || [{}])._id,
      })).filter(a => a.petId),
    })
  }
  await Event.insertMany(eventDocs)
  console.log(`  ✓ ${eventDocs.length} events`)

  // ── 9. Adoption applications (predictable demo data) ─────────────────────
  const appDocs = []
  const usedPairs = new Set()
  const adoptionApplicants = [...allOwners]
  const applicationReasons = [
    'I have a calm home and plenty of time for daily care, walks, and training.',
    'My family has been preparing for adoption and we already have a pet-safe setup.',
    'I work from home, so I can provide company and regular attention throughout the day.',
    'I want to give a rescue pet a stable forever home and have experience with shy animals.',
    'Our current pet would love a gentle companion, and we can schedule gradual introductions.',
  ]

  function makeApplication(pet, applicant, status) {
    const pairKey = `${pet._id}-${applicant._id}`
    if (usedPairs.has(pairKey)) return null
    usedPairs.add(pairKey)
    return {
      petId: pet._id,
      applicantId: applicant._id,
      status,
      contactEmail: applicant.email.toUpperCase(),
      applicantInfo: {
        homeType: pick(['apartment', 'house', 'condo']),
        hasOtherPets: Math.random() > 0.5,
        reason: pick(applicationReasons),
      },
      staffNotes: status === 'approved'
        ? 'Strong fit. Ready for next steps.'
        : status === 'rejected'
          ? 'Not the best match right now.'
          : 'Awaiting review from shelter staff.',
      createdAt: daysAgo(randInt(0, 12)),
    }
  }

  const [petPending, petReviewing, petRejected, petApproved, petMulti, ...restShelterPets] = shelterPets
  const [applicantA, applicantB, applicantC, applicantD, applicantE, applicantF, applicantG] = adoptionApplicants

  const plannedApplications = [
    makeApplication(petPending, applicantA, 'pending'),
    makeApplication(petReviewing, applicantB, 'reviewing'),
    makeApplication(petRejected, applicantC, 'rejected'),
    makeApplication(petApproved, applicantD, 'approved'),
    makeApplication(petMulti, applicantE, 'pending'),
    makeApplication(petMulti, applicantF, 'reviewing'),
  ].filter(Boolean)

  for (const pet of restShelterPets.slice(0, 3)) {
    const applicant = pick(adoptionApplicants.filter(user => String(user._id) !== String(pet.ownerId)))
    const status = pick(['pending', 'reviewing', 'rejected'])
    const application = makeApplication(pet, applicant, status)
    if (application) plannedApplications.push(application)
  }

  await Application.insertMany(plannedApplications)

  const petStatusUpdates = [
    { pet: petPending, status: 'pending', adoptedBy: null },
    { pet: petReviewing, status: 'pending', adoptedBy: null },
    { pet: petRejected, status: 'available', adoptedBy: null },
    { pet: petApproved, status: 'adopted', adoptedBy: applicantD._id },
    { pet: petMulti, status: 'pending', adoptedBy: null },
  ]

  for (const pet of restShelterPets.slice(0, 3)) {
    const petApps = plannedApplications.filter(app => String(app.petId) === String(pet._id))
    const approved = petApps.find(app => app.status === 'approved')
    const hasOpenApps = petApps.some(app => ['pending', 'reviewing'].includes(app.status))
    petStatusUpdates.push({
      pet,
      status: approved ? 'adopted' : hasOpenApps ? 'pending' : 'available',
      adoptedBy: approved ? approved.applicantId : null,
    })
  }

  await Promise.all(
    petStatusUpdates.map(({ pet, status, adoptedBy }) =>
      MyPet.updateOne({ _id: pet._id }, { $set: { adoptionStatus: status, adoptedBy } })
    )
  )
  console.log(`  ✓ ${plannedApplications.length} applications`)
  console.log(`  ✓ ${petStatusUpdates.filter(item => item.status === 'adopted').length} pets marked adopted`)

  // ── Done ──────────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!')
  console.log('─────────────────────────────────────────')
  console.log('Demo accounts (all passwords: password123)')
  console.log('  owner:         alice@demo.com')
  console.log('  owner:         bob@demo.com')
  console.log('  owner:         user1@demo.com … user20@demo.com')
  console.log('  shelter_staff: shelter@demo.com')
  console.log('  admin:         admin@demo.com')
  console.log('─────────────────────────────────────────')
  console.log('Adoption listings: login as shelter@demo.com → My Pets → Manage Adoption')
  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
