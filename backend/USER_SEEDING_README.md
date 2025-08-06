# User Seeding Guide

## Overview
This guide explains how to create demo users for testing the SARAL Bhoomi application with different roles (admin, officer, agent).

## Quick Start

1. **Seed Users:**
   ```bash
   npm run seed
   ```

2. **Login Credentials:**
   - **Admin:** `admin@saral.gov.in` / `admin123`
   - **Officer:** `officer@saral.gov.in` / `officer123`  
   - **Agent:** `agent@saral.gov.in` / `agent123`

## Created Users

### Admin User
- **Email:** admin@saral.gov.in
- **Password:** admin123
- **Role:** admin
- **Department:** Administration
- **Phone:** 9876543210

### Officer User
- **Email:** officer@saral.gov.in
- **Password:** officer123
- **Role:** officer
- **Department:** Land Acquisition
- **Phone:** 9876543211

### Agent Users
- **Primary Agent:** agent@saral.gov.in / agent123
- **Additional Agents (all use password: agent123):**
  - rajesh.patil@saral.gov.in - राजेश पाटील
  - sunil.kambale@saral.gov.in - सुनील कांबळे
  - mahesh.deshmukh@saral.gov.in - महेश देशमुख
  - vithal.jadhav@saral.gov.in - विठ्ठल जाधव
  - ramrao.pawar@saral.gov.in - रामराव पवार

## Testing Login

### Using API Endpoints

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Login API:**
   ```bash
   POST http://localhost:5000/api/auth/login
   Content-Type: application/json
   
   {
     "email": "admin@saral.gov.in",
     "password": "admin123"
   }
   ```

3. **Expected Response:**
   ```json
   {
     "success": true,
     "token": "jwt-token-here",
     "user": {
       "id": "user-id",
       "name": "Admin User",
       "email": "admin@saral.gov.in",
       "role": "admin",
       "department": "Administration",
       "language": "marathi"
     }
   }
   ```

## Role-Based Access

### Admin Role
- Full system access
- Can manage users, projects, and all operations
- Access to all administrative functions

### Officer Role  
- Land acquisition operations
- Project management
- Report generation
- Village management

### Agent Role
- Field operations
- Data collection
- Limited access to assigned projects
- Mobile app usage

## Features

- **Password Hashing:** All passwords are automatically hashed using bcrypt
- **JWT Tokens:** Login generates JWT tokens for authentication
- **Role-based Authorization:** Different access levels based on user roles
- **Multi-language Support:** Supports Marathi, English, and Hindi
- **Active Status:** All users are active by default

## Troubleshooting

1. **"Demo users already exist" message:**
   - Users have already been seeded
   - Use the existing login credentials
   - Or manually delete users from database to re-seed

2. **MongoDB Connection Error:**
   - Check MONGODB_URI in config.env
   - Ensure MongoDB service is running
   - Verify network connectivity

3. **Login Failed:**
   - Verify email and password are correct
   - Check if user is active in database
   - Ensure JWT_SECRET is set in config.env

## Additional Commands

- **Check existing users:** Use MongoDB Compass or database queries
- **Update user roles:** Use the users API endpoints
- **Reset passwords:** Use the password reset functionality

## Security Notes

- Default passwords are for development/testing only
- Change passwords in production environment
- Use strong passwords for production users
- Regularly rotate JWT secrets