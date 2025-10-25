# Classroom - Full-Stack Learning Management System 📚

[![My Skills](https://skillicons.dev/icons?i=nextjs,react,nodejs,express,mongodb,js,ts,html,css,materialui,git,github)](https://skillicons.dev)

A full-stack web application designed to simulate a classroom environment, enabling teachers to manage courses and assignments, and students to enroll and submit work. [cite_start]Built with Next.js, Node.js/Express, and MongoDB Atlas[cite: 25].

**Live Demo:**
* **Frontend (Vercel):** [https://classroom-806avodc7-somanshs-projects-2206d97b.vercel.app/](https://classroom-806avodc7-somanshs-projects-2206d97b.vercel.app/)
* **Backend (Render):** [https://somansh-backend.onrender.com/health](https://somansh-backend.onrender.com/health) (Health Check)

---

## Overview

[cite_start]This project provides distinct interfaces and functionalities for teachers and students[cite: 25]:

* [cite_start]**Teachers:** Can create courses, set pricing, publish courses, post learning materials (including text and PDF uploads), create assignments (with optional file attachments), view submissions, and provide grades and feedback[cite: 26].
* [cite_start]**Students:** Can browse available courses, enroll in paid courses via Razorpay, view course materials and assignments, submit their work (text or file uploads), and get AI-powered hints for assignments[cite: 26].

[cite_start]The application features a responsive UI built with Material-UI[cite: 27].

---

## Features

**Teacher Portal:**
* 🔐 Secure Authentication (JWT)
* 📚 Course Creation & Management (Title, Description, Price)
* ✅ Course Publishing Control
* 📄 Material Posting (Text content & PDF uploads via Cloudinary)
* 📝 Assignment Creation (Instructions, Due Dates, File Attachments via Cloudinary)
* 📊 Submission Viewing per Assignment (View student submissions)
* 💯 Grading System (Assign scores and provide feedback)
* 🏛️ Organized Course Management Hub

**Student Portal:**
* 🔐 Secure Authentication (JWT)
* 🛒 Course Browsing & Discovery
* 💳 Paid Course Enrollment via Razorpay (Test Mode)
* 📖 View Enrolled Courses, Materials, and Assignments
* 📤 Assignment Submission (Text content or File uploads via Cloudinary)
* 💡 AI-Powered Hints for assignments via OpenRouter
* 📜 View Submission History & Grades/Feedback

---

## Tech Stack

* [cite_start]**Frontend:** Next.js (React), Material-UI, CSS Modules [cite: 27]
* **Backend:** Node.js, Express.js
* [cite_start]**Database:** MongoDB Atlas [cite: 25]
* **Authentication:** JWT (JSON Web Tokens), bcryptjs
* **File Storage:** Cloudinary API
* **Payment Gateway:** Razorpay API (Test Mode)
* **AI Integration:** OpenRouter API
* **Email Notifications:** Resend API (Limited Functionality - see notes)
* **Deployment:** Vercel (Frontend), Render (Backend)
* [cite_start]**Other:** Git, GitHub [cite: 9]

---

## Getting Started (Local Setup)

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (v18 or later recommended)
* npm or yarn
* Git
* MongoDB Atlas Account (Free tier is sufficient)
* Cloudinary Account (Free tier)
* Razorpay Account (Test Mode Keys)
* OpenRouter Account (Free tier)
* Resend Account (Free tier)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/SOMANSH-arch/Classroom.git](https://github.com/SOMANSH-arch/Classroom.git)
    cd Classroom
    ```

2.  **Setup Backend (`server`):**
    * Navigate to the server directory: `cd server`
    * Install dependencies: `npm install`
    * Create a `.env` file in the `server` directory. Copy the contents from `.env.example` (if available) or create it manually with the following variables:
        ```dotenv
        # Server Port
        PORT=4000

        # Frontend URL (for CORS)
        CLIENT_ORIGIN=http://localhost:3000

        # MongoDB Connection String (Get from Atlas)
        MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

        # JWT Secret (A long, random, secret string)
        JWT_SECRET=your_super_secret_jwt_string
        JWT_EXPIRES_IN=7d # Optional: Token expiry time

        # Razorpay API Keys (Test Mode)
        RAZORPAY_KEY_ID=YOUR_RAZORPAY_TEST_KEY_ID
        RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_TEST_SECRET

        # Resend API Key
        RESEND_API_KEY=YOUR_RESEND_API_KEY

        # OpenRouter API Key
        OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
        # Optional OpenRouter settings for API calls
        # OPENROUTER_SITE_URL=http://localhost:3000
        # OPENROUTER_APP_NAME="Classroom (Local)"

        # Cloudinary Credentials
        CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
        CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
        CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

        # Node Environment
        NODE_ENV=development
        ```
    * Run the development server: `npm run dev` (It should connect to MongoDB and listen on port 4000)

3.  **Setup Frontend (`web`):**
    * Open a *new terminal* and navigate to the web directory: `cd ../web`
    * Install dependencies: `npm install`
    * Create a `.env.local` file in the `web` directory with the following variable (pointing to your local backend):
        ```dotenv
        NEXT_PUBLIC_API_BASE=http://localhost:4000
        ```
    * Run the development server: `npm run dev`

4.  **Access the Application:** Open your browser and go to `http://localhost:3000`.

---

## Important Notes & Limitations

* **Email Notifications:** This feature uses the Resend API.
    * To send emails to *any* student address, you **must verify a domain** with Resend (this typically requires purchasing a domain name).
    * Currently, the deployed version uses Resend's test mode and will **only send notifications to the pre-verified email address** used during setup (`somanshrajkashyap@gmail.com`). Other students will not receive emails.
* **Payment Gateway:** Razorpay is integrated in **Test Mode**.
    * Real payments will not be processed.
    * Use the following **dummy Mastercard details** for testing enrollment:
        * **Card Number:** `2305 3242 5784 8228`
        * **Expiry Date:** Any future date (e.g., 12/29)
        * **CVV:** Any random 3 digits (e.g., 123)
* **File Storage:** Course materials and student submissions are uploaded to Cloudinary. Ensure your Cloudinary credentials are correctly set in the backend `.env` file.
* **Deployment:** The live version is deployed separately on Vercel (frontend) and Render (backend). Ensure environment variables (`CLIENT_ORIGIN` on Render, `NEXT_PUBLIC_API_BASE` on Vercel) point to the correct live URLs.

---



## Contact

[cite_start]Somansh Raj Kashyap - somanshrajkashyap@gmail.com [cite: 12]

Project Link: [https://github.com/SOMANSH-arch/Classroom](https://github.com/SOMANSH-arch/Classroom)
