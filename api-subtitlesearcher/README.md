# User Authentication App
Node.js + Express + MongoDB + JWT

## Project Structure
```
auth-app/
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   └── authMiddleware.js  # JWT protection middleware
├── models/
│   └── User.js            # User schema (password auto-hashed)
├── routes/
│   └── authRoutes.js      # Signup, Login, Profile routes
├── .env                   # Environment variables
├── server.js              # Entry point
└── package.json
```

## Setup & Run

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Make sure MongoDB is running locally**
   ```bash
   # Mac (with Homebrew)
   brew services start mongodb-community

   # Or use MongoDB Atlas (cloud) — update MONGO_URI in .env
   ```

3. **Update `.env`**
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/authapp
   JWT_SECRET=your_super_secret_key_change_this
   ```

4. **Start the server**
   ```bash
   npm run dev    # with auto-reload (nodemon)
   npm start      # without auto-reload
   ```

---

## API Endpoints

### POST /api/auth/signup
Register a new user.
```json
// Request body
{
  "username": "john",
  "email": "john@example.com",
  "password": "secret123"
}
```

### POST /api/auth/login
Login and receive a JWT token.
```json
// Request body
{
  "email": "john@example.com",
  "password": "secret123"
}
```

### GET /api/auth/profile
Get your profile. **Requires token.**
```
Authorization: Bearer <your_token_here>
```

### GET /api/auth/users
Get all users. **Requires token.**
```
Authorization: Bearer <your_token_here>
```

---

## How It Works

1. **Signup** → password is hashed with bcrypt → user saved to MongoDB
2. **Login** → password compared with bcrypt → JWT token returned
3. **Protected routes** → token verified by middleware → user data attached to `req.user`
