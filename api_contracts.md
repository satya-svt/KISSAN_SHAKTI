# KissanShakthi API Contracts & Database Schema Specifications

This document outlines the REST API contracts, JSON payload structures, error conditions, and relational database entities expected by the frontend application.

## Table of Contents
1. [Environment Configuration](#environment-configuration)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Crop Management Endpoints](#crop-management-endpoints)
4. [Laborer & Jobs Endpoints](#laborer--jobs-endpoints)
5. [Equipment Management Endpoints](#equipment-management-endpoints)
6. [Marketplace & Buyer Endpoints](#marketplace--buyer-endpoints)
7. [Admin & Moderation Endpoints](#admin--moderation-endpoints)
8. [Database Schema Entities](#database-schema-entities)

---

## Environment Configuration

The frontend looks up the backend base URL via:
```ini
VITE_API_URL=http://localhost:5000/api
```
All endpoints below are relative to this base URL path.

---

## Authentication Endpoints

### 1. User Login
* **Method & Route**: `POST /api/auth/login`
* **Request Header**: `Content-Type: application/json`
* **Request Payload**:
```json
{
  "role": "farmer", 
  "identifier": "9855667788", 
  "password": "password123"
}
```
* **Success Response (200 OK)**:
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "e3cb89cf-4a3b-4861-84bb-7313a0c5c3fb",
    "name": "Vikas Patil",
    "phone": "+91 98556 67788",
    "role": "farmer",
    "region": "Maharashtra",
    "isVerified": true,
    "verificationStep": "completed",
    "isBlacklisted": false
  }
}
```
* **Error Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Invalid login credentials."
}
```

### 2. User Registration
* **Method & Route**: `POST /api/auth/register`
* **Request Header**: `Content-Type: application/json`
* **Request Payload**:
```json
{
  "name": "Suresh Pawar",
  "phone": "9988776655",
  "password": "password123",
  "role": "laborer",
  "region": "Maharashtra",
  "skills": ["Harvesting", "Sowing"],
  "daily_rate": 450
}
```
* **Success Response (201 Created)**:
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "w1-9b55-6b586bbd7cfa",
    "name": "Suresh Pawar",
    "phone": "+91 99887 76655",
    "role": "laborer",
    "region": "Maharashtra",
    "isVerified": false,
    "verificationStep": "onboarding",
    "isBlacklisted": false
  }
}
```

---

## Crop Management Endpoints

### 1. Get Farmer's Crop Listings
* **Method & Route**: `GET /api/crops`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "7b9d313c-6cb2-4a0d-9b55-6b586bbd7cfa",
      "farmer_id": "e3cb89cf-4a3b-4861-84bb-7313a0c5c3fb",
      "name": "Basmati Rice",
      "category": "grain",
      "quantity_kg": 1200,
      "price_per_kg": 85,
      "status": "available",
      "harvest_date": "2026-05-15"
    }
  ]
}
```

### 2. Post Harvest Crop
* **Method & Route**: `POST /api/crops`
* **Request Header**: `Content-Type: application/json`
* **Request Payload**:
```json
{
  "name": "Red Onions",
  "category": "vegetable",
  "quantity": 2500,
  "price": 32,
  "harvestDate": "2026-05-20"
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "f3c39df5-60b8-444f-a9cb-652f1e679a83",
    "name": "Red Onions",
    "category": "vegetable",
    "quantity_kg": 2500,
    "price_per_kg": 32,
    "status": "available",
    "harvest_date": "2026-05-20"
  }
}
```

### 3. Remove Crop Listing
* **Method & Route**: `DELETE /api/crops/:id`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Crop listing removed successfully."
}
```

---

## Laborer & Jobs Endpoints

### 1. Get Workers Registry
* **Method & Route**: `GET /api/workers`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "w1-9b55-6b586bbd7cfa",
      "name": "Suresh Patil",
      "phone": "+91 91234 56789",
      "state": "Maharashtra",
      "skills": ["Harvesting", "Sowing"],
      "daily_rate": 450,
      "status": "active"
    }
  ]
}
```

### 2. Get Farming Jobs/Tasks Board
* **Method & Route**: `GET /api/jobs`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "j1-7cfa-4a0d-9b55-6b586bbd7cfa",
      "worker_id": "w2-a9cb-652f1e679a83",
      "title": "Tractor Soil Tilling",
      "description": "Tilling of 4.5 acres of land in Nashik using modern tractor equipment.",
      "location": "Pimplad Village",
      "payment": 1800,
      "required_skill": "Soil Tilling",
      "status": "assigned",
      "applicants": []
    }
  ]
}
```

### 3. Post Agricultural Task
* **Method & Route**: `POST /api/jobs`
* **Request Payload**:
```json
{
  "title": "Wheat Crop Harvesting",
  "desc": "Manual harvesting and gathering of high-grade wheat crop over 2 acres.",
  "location": "Sinnar Region",
  "payment": 1200,
  "requiredSkill": "Harvesting",
  "assignedWorkerId": ""
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "j2-8cfa-4a0d-9b55-6b586bbd7cfb",
    "worker_id": null,
    "title": "Wheat Crop Harvesting",
    "description": "Manual harvesting and gathering of high-grade wheat crop over 2 acres.",
    "location": "Sinnar Region",
    "payment": 1200,
    "required_skill": "Harvesting",
    "status": "open",
    "applicants": []
  }
}
```

### 4. Delete Farm Task
* **Method & Route**: `DELETE /api/jobs/:id`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Task listing deleted."
}
```

### 5. Apply for Farm Task (Labourer UI action)
* **Method & Route**: `POST /api/jobs/:jobId/apply`
* **Request Payload**:
```json
{
  "workerId": "w1-9b55-6b586bbd7cfa"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Farming job application received."
}
```

### 6. Accept Applicant / Assign Worker (Farmer UI action)
* **Method & Route**: `POST /api/jobs/:jobId/assign`
* **Request Payload**:
```json
{
  "workerId": "w1-9b55-6b586bbd7cfa"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Worker hired and assigned to task."
}
```

### 7. Resign / Release Worker (Farmer/Labourer action)
* **Method & Route**: `POST /api/jobs/:jobId/unassign`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Labour contract unassigned/released."
}
```

---

## Equipment Management Endpoints

### 1. Get Machinery Listings
* **Method & Route**: `GET /api/equipment`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "e1-7cfa-4a0d-9b55-6b586bbd7cfa",
      "name": "Maschio Gaspardo Rotavator",
      "owner": "Vikas Patil",
      "phone": "+91 98556 67788",
      "location": "Sinnar Region",
      "rate": 1200
    }
  ]
}
```

### 2. List Machinery for Rent
* **Method & Route**: `POST /api/equipment`
* **Request Payload**:
```json
{
  "name": "Preet 982 Paddy Harvester",
  "owner": "Gurpreet Singh",
  "phone": "+91 98765 43210",
  "location": "Sinnar Region",
  "rate": 5000
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "e2-8cfa-4a0d-9b55-6b586bbd7cfb",
    "name": "Preet 982 Paddy Harvester",
    "owner": "Gurpreet Singh",
    "phone": "+91 98765 43210",
    "location": "Sinnar Region",
    "rate": 5000
  }
}
```

### 3. Remove Machinery Listing
* **Method & Route**: `DELETE /api/equipment/:id`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Equipment listing removed."
}
```

### 4. Get Rental Requests
* **Method & Route**: `GET /api/equipment/requests`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "req-1",
      "title": "Tractor Soil Tilling Request",
      "owner": "Vikas Patil",
      "location": "Pimplad Village",
      "rate": 1500,
      "status": "Pending Approval"
    }
  ]
}
```

---

## Marketplace & Buyer Endpoints

### 1. Get Marketplace Crops List (Buyer Marketplace view)
* **Method & Route**: `GET /api/marketplace/crops`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "m1-7cfa-4a0d-9b55-6b586bbd7cfa",
      "name": "Basmati Rice",
      "price": 85,
      "quantity_unit": "kg",
      "quantity": "1200",
      "quality": "Grade A",
      "farmer_name": "Vikas Patil",
      "location": "Sinnar Region",
      "image": ""
    }
  ]
}
```

---

## Admin & Moderation Endpoints

### 1. Get Identity Onboarding Verification Queue
* **Method & Route**: `GET /api/admin/verification-queue`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 202,
      "name": "Harpreet Singh",
      "role": "farmer",
      "phone": "+91 98765 12345",
      "region": "Punjab (Amritsar)",
      "documentName": "Land_Record_Verification.jpg",
      "blacklistStatus": "pending",
      "submittedAt": "2026-06-14 12:15"
    }
  ]
}
```

### 2. Approve Profile Onboarding
* **Method & Route**: `POST /api/admin/approve/:userId`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "User identity profile approved."
}
```

### 3. Reject Onboarding Profile
* **Method & Route**: `POST /api/admin/reject/:userId`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "User onboarding profile declined."
}
```

### 4. Trigger ID Scan (Automated Blacklist scanning check)
* **Method & Route**: `POST /api/admin/scan/:userId`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "blacklistStatus": "passed"
  }
}
```

---

## Database Schema Entities

The backend should store the following core business tables/collections.

### 1. `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | User unique ID |
| `name` | VARCHAR(100) | Not Null | User display name |
| `phone` | VARCHAR(20) | Unique, Not Null | Cleaned mobile index |
| `password` | VARCHAR(255) | Not Null | Hashed password |
| `role` | VARCHAR(20) | Check (`farmer`, `laborer`, `buyer`, `admin`) | Routing category |
| `region` | VARCHAR(100) | Default: `Maharashtra` | Operating location |
| `is_verified`| BOOLEAN | Default: false | Onboarding validation flag |
| `verification_step` | VARCHAR(30) | Default: `onboarding` | Current stage |
| `is_blacklisted` | BOOLEAN | Default: false | Blacklist block flag |

### 2. `crops`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Crop ID |
| `farmer_id` | UUID | Foreign Key -> `users(id)` | Posting farmer |
| `name` | VARCHAR(100) | Not Null | Crop name |
| `category` | VARCHAR(30) | Not Null | Categories (`vegetable`, `grain`, etc.) |
| `quantity_kg`| NUMERIC(10,2)| Not Null | Mass in kg |
| `price_per_kg`| NUMERIC(10,2)| Not Null | Price in ₹ |
| `status` | VARCHAR(20) | Default: `available` | listing status |
| `harvest_date`| DATE | Not Null | Date of harvest |

### 3. `workers` (Optional, or extend `users`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, FK -> `users(id)` | Worker reference |
| `skills` | TEXT[] | Default: `{}` | Array of options specialties |
| `daily_rate` | NUMERIC(10,2)| Not Null | Minimum daily payout expectations |
| `status` | VARCHAR(20) | Default: `active` | Activity status |

### 4. `jobs` (Farm Tasks)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Job ID |
| `farmer_id` | UUID | Foreign Key -> `users(id)` | Employer reference |
| `worker_id` | UUID | Nullable, FK -> `users(id)` | Hired worker |
| `title` | VARCHAR(100) | Not Null | Job title |
| `description`| TEXT | Not Null | Detailed requirements |
| `location` | VARCHAR(100) | Not Null | Job location site |
| `payment` | NUMERIC(10,2)| Not Null | Payout pool |
| `required_skill`| VARCHAR(50)| Not Null | Mandatory worker specialty |
| `status` | VARCHAR(20) | Check (`open`, `assigned`) | Job state |

### 5. `equipment` (Rentals)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Machine ID |
| `owner_id` | UUID | Foreign Key -> `users(id)` | Renting user |
| `name` | VARCHAR(100) | Not Null | Machine model name |
| `rate` | NUMERIC(10,2)| Not Null | Daily rate (₹/day) |
| `location` | VARCHAR(100) | Not Null | Site location |
| `status` | VARCHAR(20) | Default: `available` | Availability |
