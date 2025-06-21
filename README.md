# Online Event Management Platform – Frontend

This is the frontend of the **Online Event Management Platform** built with **React.js** and **TailwindCSS**.

## 🌐 Features

- 🧾 Event Listings with filter, search, and media display
- 🎟️ Ticket purchasing system with secure checkout
- 🧍 Attendee registration and management
- 📅 Event schedule view
- 📈 Dashboard for users and organizers
- 🛡️ Authentication and profile management
- 🛠️ Admin panel for user/event control
- 📬 Email confirmations
- 💳 Payment integration (Stripe)

## 🔧 Tech Stack

- **React.js** with Vite
- **TailwindCSS** for UI styling
- **Axios** for API requests
- **React Router v6**
- **JWT Authentication (via Cookies)**
- **Chart.js** or **Recharts** for analytics

## 📁 Folder Structure

frontend/
├── src/
│ ├── components/
│ ├── pages/
│ ├── context/
│ ├── services/
│ └── App.jsx
├── public/
└── vite.config.js

bash
Copy
Edit

## ⚙️ Environment Setup

Create a `.env` file:

```env
VITE_API_URL=https://your-backend-api.onrender.com
🚀 Running the Frontend
bash
Copy
Edit
cd frontend
npm install
npm run dev
🌍 Deployment
Deploy using Netlify

Ensure VITE_API_URL points to the live backend

Add _redirects file to public/:

bash
Copy
Edit
/*  /index.html  200
