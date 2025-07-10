# Online Event Management Platform – Backend

This is the backend of the **Online Event Management Platform**, built using **Node.js**, **Express**, and **MongoDB**.

## 🚀 Features

- 📦 RESTful API for events, users, tickets, analytics
- 🔐 JWT-based authentication (with cookie support)
- 📧 Email notifications for confirmations and password resets
- 🧾 Ticket generation & QR code support
- 💳 Secure payment integration (Stripe or Razorpay)
- 📊 Admin analytics for events and revenue
- 🛠️ Support ticket system for attendees and organizers
- 🖼️ Image upload support for profiles and events
- 🧪 Swagger docs at `/api-docs`

## 🔧 Tech Stack

- **Node.js**, **Express**
- **MongoDB** with **Mongoose**
- **JWT** + **express-session** (if needed)
- **Multer** + **Sharp** for image handling
- **Swagger** for API docs
- **nodemailer** for emails
- **dotenv** for config management

## 📁 Folder Structure

backend/
├── controllers/
├── models/
├── routes/
├── middleware/
├── utils/
├── uploads/
└── server.js


## 🧪 API Documentation

- Swagger: [`/api-docs`](https://online-event-manage.onrender.com/api-docs/#/)

## ⚙️ Environment Variables

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your-mongo-uri
JWT_SECRET=your-secret
FRONTEND_URL=https://your-frontend.netlify.app
BACKEND_URL=https://your-backend.onrender.com
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password
✅ Run Locally


cd backend
npm install
npm run dev
🌍 Deployment
Deploy on Render

Add the same .env variables in Render dashboard

Ensure correct CORS setup:


app.use(cors({
  origin: [process.env.FRONTEND_URL],
  credentials: true,
}));
📦 API Routes Overview
POST /auth/register – Register user

POST /auth/login – Login and set cookie

GET /auth/profile – Get logged-in user

POST /events – Create new event (organizer)

GET /events – List/search events

POST /tickets/purchase – Purchase ticket

GET /analytics/admin – View analytics (admin)
