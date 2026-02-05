# 📚 Rentopia

A RESTful API built with **Express**, **TypeScript**, and **MongoDB (Mongoose)** to work as the backend server for a local rental hub where users can lease own or rent various things. This API follows proper validation, business logics, and modern development practices which makes lease/renting easier.

---

## Features

- ✅ **Take on Rent** (Users can take items on rent by placing an order and paying the total price based on days count.)
- ✅ **Give on Rent** (Users can give his/her own items on rent. He/She has to list and make the item available for rent.)
- ✅ **Secure payment by SSLCommerz** (Renter has to complete the payment for the order placed within 30 minutes.)
- ✅ **Auto-cancel orders by cron-job** (Cron-job function will automatically delete the 'Unpaid' orders after 30 minutes.)
- ✅ **Auto-update Item status by cron-job** (A Cron-job function will run everyday on 12:01 AM to update necessary item status.)
- ✅ **Invoice PDF** (After successful payment Renter will receive and can view or download the invoice.)

---

## Tech Stack

- **Node.js**
- **Express**
- **TypeScript**
- **MongoDB** (via Mongoose)
- **Node-Cron**
- **Cloudinary**

---

## Project Structure

```plaintext
src/
├── app/
│   ├── config/     
│   ├── errorHelpers/     
│   ├── interfaces/      
│   ├── middlewares/          
│   ├── modules/          
│   ├── ├── auth/          
│   ├── ├── item/         
│   ├── ├── user/          
│   ├── ├── order/          
│   ├── ├── payment/          
│   ├── ├── sslCommerz/          
│   ├── routes/          
│   ├── utils/          
│   ├── constants.ts          
├── app.ts               # Express app setup
└── server.ts            # Application entry point
```

---

## Project Setup in Local System

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Abrar9410/Backend-Rentopia.git
cd backend-rentopia
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Create a .env File
Create a .env file in the root with the following values:

```env
DB_URL=your_database_connection_uri
NODE_ENV=development or production

# bcrypt
SALT=#

# JWT
JWT_SECRET=secret-string
JWT_EXPIRESIN=example->(2d)
REFRESH_JWT_SECRET=another-secret-string
REFRESH_JWT_EXPIRESIN=example->(20d)

GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=example_callback_url

# Express Session
EXPRESS_SESSION_SECRET=example_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# sslCommerz
SSL_STORE_ID=example_store_id
SSL_STORE_PASS=example_store_pass
SSL_PAYMENT_API=https://sandbox.sslcommerz.com/gwprocess/v3/api.php
SSL_VALIDATION_API=https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php
SSL_IPN_URL=http://localhost:5000/api/v1/payment/validate-payment

# SSL Commerz BACKEND URLs
SSL_SUCCESS_BACKEND_URL=http://localhost:5000/api/v1/payment/success
SSL_FAIL_BACKEND_URL=http://localhost:5000/api/v1/payment/fail
SSL_CANCEL_BACKEND_URL=http://localhost:5000/api/v1/payment/cancel

# SSL Commerz FRONTEND URLs
SSL_SUCCESS_FRONTEND_URL=http://localhost:5173/payment/success
SSL_FAIL_FRONTEND_URL=http://localhost:5173/payment/fail
SSL_CANCEL_FRONTEND_URL=http://localhost:5173/payment/cancel

# Cloudinary
CLOUDINARY_CLOUD_NAME=example_cloud_name
CLOUDINARY_API_SECRET=example_secret
CLOUDINARY_API_KEY=example_api_key

# NodeMailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465 (or 587)
SMTP_USER=example@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=example@gmail.com
```

### 4️⃣ Build the Project

```bash
npm run build
```

### 5️⃣ Start the Server
In development (with hot reload):

```bash
npm run dev
```

In production:

```bash
npm start
```

--- 

## API Endpoints

### User Endpoints

- **POST** `/api/users/register` – Create a new user  
- **GET** `/api/users/all-users` – Get all users (with optional filtering, sorting, and limiting)  
- **GET** `/api/users/me` – Get own profile
- **GET** `/api/users/:id` – Get a user by ID (Admin Route) 
- **PATCH** `/api/users/update-user/:id` – Update a user (User himself or Admin)  
- **DELETE** `/api/users/delete-user/:id` – Delete a user (Admin)  


### Auth Endpoints

- **POST** `/api/auth/login` – Login with an existing account  
- **POST** `/api/auth/logout` – Log Out from App  
- **PATCH** `/api/auth/change-password` – Any user can change his/her password through this route  
- **PATCH** `/api/auth/forgot-password` – When hit, this route will send an email to the user with a temporary link to reset password  
- **PATCH** `/api/auth/reset-password` – For the users who forgot his/her password


### Item Endpoints

- **POST** `/api/items/add-item` – Create a new user  
- **GET** `/api/items/` – Get all items that are listed for rent (with optional filtering, sorting, and limiting) (Public)  
- **GET** `/api/items/all-items` – Get all items, listed or not (with optional filtering, sorting, and limiting) (Admin)  
- **GET** `/api/items/rentopia-items` – Get all items added by admins (with optional filtering, sorting, and limiting) (Admin)  
- **GET** `/api/items/my-items` – Get all items added by a user himself (with optional filtering, sorting, and limiting) (User)  
- **GET** `/api/items/:id` – Get a single item available for rent (Public)  
- **GET** `/api/items/all-items/:id` – Get a single item listed or not (User & Admin)
- **PATCH** `/api/items/edit-rentopia-item/:id` – Edit an Item (Admin)  
- **PATCH** `/api/items/edit-item/:id` – Edit an Item (User himself)  
- **PATCH** `/api/items/update-status/:id` – Update Item status (User himself or Admin)  
- **PATCH** `/api/items/update-availability/:id` – List or Withdraw an Item for rent (User himself)  
- **DELETE** `/api/items/remove-item/:id` – Delete an item (User himself)


### Order Endpoints

- **POST** `/api/orders/` – Place an order (User only) 
- **GET** `/api/orders/` – Get all orders (with optional filtering, sorting, and limiting) (Admin)  
- **GET** `/api/orders/my-orders` – Get all orders placed by an user (User himself)
- **GET** `/api/orders/customer-orders` – Get all orders made by the customers for items of a User (User himself) 
- **GET** `/api/orders/:orderId` – Get single order (User himself or Admin) 
- **PATCH** `/api/orders/:orderId/status` – Update status of an order (User himself or Admin)


---

## Scripts

| Script         | Description                           |
|----------------|---------------------------------------|
| `npm run dev`  | Run development server with Nodemon   |
| `npm run build`| Compile TypeScript to JavaScript      |
| `npm start`    | Start the production server           |

---


[Live Link](https://backend-rentopia.onrender.com)
