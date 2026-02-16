# Migrating from Firebase to Node.js Express + Mongoose

This guide outlines how to move from **Firebase** (Firestore, Cloud Functions, Firebase Auth) to a **Node.js Express** API with **Mongoose** and **MongoDB**.

---

## 1. What Changes

| Firebase | Express + Mongoose |
|----------|--------------------|
| **Firestore** (NoSQL, collections/documents) | **MongoDB** (NoSQL) via **Mongoose** (ODM) |
| **Cloud Functions** (serverless HTTP + triggers) | **Express** routes (HTTP) + **cron/schedulers** or **Bull/Agenda** (background jobs) |
| **Firebase Auth** (ID tokens, custom tokens) | **JWT** (e.g. `jsonwebtoken`) or **Passport** + session/JWT |
| **Firebase Storage** | **AWS S3**, **Cloudinary**, or **local/minio** |
| **Firestore security rules** | **Middleware** (auth, ownership checks) in Express |

---

## 2. New Stack Setup

### 2.1 Project structure

```text
your-app/
├── src/
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── models/            # Mongoose schemas (replaces Firestore collections)
│   │   ├── User.js
│   │   ├── Event.js
│   │   └── Transaction.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── events.js
│   │   └── stripe.js
│   ├── middleware/
│   │   └── auth.js        # JWT verification (replaces verifyFirebaseToken)
│   ├── services/          # Business logic (unchanged pattern)
│   └── app.js
├── server.js
├── package.json
└── .env
```

### 2.2 Dependencies

```bash
npm init -y
npm install express mongoose dotenv cors jsonwebtoken
npm install -D nodemon
```

### 2.3 Environment variables

```env
# .env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/yourdb
# or MongoDB Atlas: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/yourdb
JWT_SECRET=your-secret-key
# Stripe, Twilio, etc. (same as before)
STRIPE_SECRET_KEY=sk_...
TWILIO_ACCOUNT_SID=...
```

---

## 3. Database: Firestore → Mongoose

### 3.1 Connect MongoDB

```javascript
// src/config/db.js
const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = { connectDB };
```

### 3.2 Map Firestore collections to Mongoose models

**Before (Firestore):**  
`db.collection('users').doc(uid).get()` → document with arbitrary fields.

**After (Mongoose):** Define a schema and use the model.

```javascript
// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },  // keep for migration or use _id
  email: String,
  fullName: String,
  profileSlug: String,
  accountType: { type: String, enum: ['parent', 'child'] },
  parentIds: [String],
  childIds: [String],
  stripeAccountId: String,
  expoPushToken: String,
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

```javascript
// src/models/Event.js
const eventSchema = new mongoose.Schema({
  creatorId: { type: String, required: true },
  eventName: String,
  eventType: String,
  date: String,
  time: String,
  address1: String,
  address2: String,
  guests: [{
    phone: String,
    name: String,
    blessing: String,
    amount: Number,
    status: String,
  }],
  invitedGuests: [String],
  stripeAccountId: String,
  posterUrl: String,
  posterPrompt: String,
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
```

Use the same idea for **transactions**, **stripeAccounts**, **childAccounts**, etc.: one Firestore collection → one Mongoose model.

---

## 4. Auth: Firebase Auth → JWT

### 4.1 Login / sign-up (issue JWT)

You’ll need a login route that validates credentials and returns a JWT (or use OAuth and then issue a JWT).

```javascript
// src/routes/auth.js (example)
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // Validate with your User model / password hash (e.g. bcrypt)
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { uid: user.uid || user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { uid: user.uid, email: user.email } });
});
```

### 4.2 Middleware (replace `verifyFirebaseToken`)

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = auth.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // { uid, email, ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { verifyToken };
```

Use `verifyToken` wherever you used `verifyFirebaseToken` in Express.

---

## 5. HTTP API: Cloud Functions → Express routes

### 5.1 One Cloud Function → one Express app

Your current **single HTTP Cloud Function** (e.g. `exports.api = functions.https.onRequest(app)`) becomes a normal Express app.

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/db');
const routes = require('./src/routes');  // or mount routes manually

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api', routes);  // or app.use(routes)

connectDB().then(() => {
  app.listen(process.env.PORT || 4000, () => {
    console.log('Server running on port', process.env.PORT);
  });
});
```

### 5.2 Replace Firestore calls with Mongoose

| Firestore | Mongoose |
|-----------|----------|
| `db.collection('users').doc(uid).get()` | `User.findOne({ uid })` or `User.findById(id)` |
| `db.collection('users').doc(uid).update({ ... })` | `User.findOneAndUpdate({ uid }, { ... })` |
| `db.collection('events').get()` | `Event.find()` |
| `db.collection('events').where('creatorId', '==', uid).get()` | `Event.find({ creatorId: uid })` |
| `db.collection('events').add({ ... })` | `Event.create({ ... })` |

Keep your **controllers** and **services**; only the **repository** (or direct DB) layer switches from Firestore to Mongoose models.

---

## 6. Triggers & scheduled jobs

Firebase has:

- **Firestore triggers** (e.g. `onDocumentCreated`)
- **Scheduled functions** (e.g. `onSchedule` for daily SMS)

In Express you don’t have these built-in; you need another mechanism.

### 6.1 Option A: Call internal endpoints from a cron

- Expose a **protected** HTTP endpoint (e.g. with a secret header or cron secret) that does “on new transaction” or “daily SMS” logic.
- Use **cron** (system cron, or a service like **Vercel Cron**, **GitHub Actions**, or **Render cron**) to hit that endpoint when needed.

### 6.2 Option B: Job queue (Bull + Redis, Agenda, etc.)

- When something important happens (e.g. “transaction created”), push a job into a queue.
- A worker process runs the same logic you had in `onTransactionCreated`.
- Use a **scheduled job** (e.g. Bull repeatable job, or Agenda `every('0 9 * * *')`) for daily SMS.

### 6.3 Option C: Keep only HTTP in Express; use serverless for triggers

- Run **Express** for all HTTP API (replacing Cloud Functions HTTP).
- Use **MongoDB Change Streams** or **Triggers** (MongoDB Atlas) to call a webhook or another small serverless function for “on create” logic, or keep a single small Cloud Function that runs on schedule and calls your Express API.

---

## 7. File storage

If you were using **Firebase Storage** (e.g. for poster images):

- Switch to **S3**, **Cloudinary**, or **MinIO** and use their SDKs inside your Express routes/services.
- Store only the resulting **URL** (and maybe key) in MongoDB (e.g. `Event.posterUrl`).

---

## 8. Migration steps (summary)

1. **Set up** Node + Express + Mongoose + MongoDB (local or Atlas).
2. **Define Mongoose models** for each Firestore collection you use.
3. **Export Firestore data** (e.g. collection-by-collection to JSON/CSV), then **import** into MongoDB (e.g. with a script using your Mongoose models or `mongoimport`). Adjust `uid` / `id` fields if you keep Firebase UIDs.
4. **Replace** `verifyFirebaseToken` with a **JWT middleware** and add **login/signup** (or OAuth) that issues JWTs.
5. **Move** each Cloud Function HTTP handler into **Express routes**; replace Firestore calls with **Mongoose** calls.
6. **Implement** “on document created” and “daily job” logic via **cron + HTTP**, **job queue**, or **MongoDB triggers**.
7. **Point** the client app to the new Express base URL and use the new **auth token** (JWT instead of Firebase ID token).
8. **Deploy** Express (e.g. Railway, Render, Fly.io, or a VPS) and configure env vars (MongoDB, JWT secret, Stripe, Twilio, etc.).

---

## 9. Quick reference: this project’s Firebase usage → Express/Mongoose

| Current (Firebase) | After (Express + Mongoose) |
|--------------------|----------------------------|
| `functions/index.js` (Express + Firestore) | Same Express app; swap Firestore for Mongoose in repos/services. |
| `db.collection('events').doc(id).get()` | `Event.findById(id)` or `Event.findOne({ _id: id })`. |
| `db.collection('users').doc(uid).get()` | `User.findOne({ uid })`. |
| `stripeAccounts`, `transactions`, `childAccounts` | One Mongoose model per collection. |
| `verifyFirebaseToken` | JWT middleware (e.g. `verifyToken` above). |
| `onEventCreated` / `onTransactionCreated` | HTTP endpoint called by cron or job queue; or MongoDB Change Streams. |
| `sendEventReminderSMS` (scheduled) | Cron hitting an Express route, or Bull/Agenda repeatable job. |
| Firebase Storage (posters) | S3/Cloudinary + store URL in `Event.posterUrl`. |

Using this map and the sections above, you can switch from Firebase to Node.js Express with Mongoose step by step while keeping your existing controller/service structure.
