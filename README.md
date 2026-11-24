
# ServiceHub — Service Booking Platform

ServiceHub is a full-stack web application that connects customers with service professionals and allows them to book appointments online.

The project demonstrates backend development with Java and Spring Boot, REST API design, authentication, database management, and frontend integration.

## Live Demo

**Website:** https://service-hub-gamma-nine.vercel.app/

**GitHub:** https://github.com/vitalilet/ServiceHub

## Tech Stack

### Backend
- Java
- Spring Boot
- Spring Security
- Spring Data JPA / Hibernate
- PostgreSQL
- Maven
- REST API

### Frontend
- React
- JavaScript
- Vite
- CSS

### Deployment
- Vercel — frontend
- Render — backend
- Docker

## Features

### Customers
- Account registration and login
- Browse professionals by service and location
- View professional profiles
- Check available appointment times
- Book appointments
- View and cancel bookings
- Manage personal profiles

### Professionals
- Role-based access
- Professional profiles
- Appointment management

### Administration
- Role-based access control
- Administrative functionality

## Security

- Password hashing with BCrypt
- Session-based authentication
- Role-based authorization
- CSRF protection
- Account status validation
- Booking ownership checks

## Booking System

ServiceHub provides appointment scheduling with:

- Working-hour validation
- Availability checks
- Prevention of double bookings
- Booking cancellation
- Booking status tracking

## Testing

The backend includes integration tests covering:

- Authentication requirements
- Successful booking creation
- Double-booking prevention
- Working-hour validation
- Booking cancellation permissions
- Session security after role changes

## Project Structure

```text
servicehub/
├── src/
│   ├── main/
│   │   ├── java/
│   │   └── resources/
│   └── test/
├── frontend/
│   ├── src/
│   └── public/
├── Dockerfile
├── compose.yaml
├── pom.xml
└── README.md
```

## Local Development

### Requirements

- Java 21 or newer
- PostgreSQL
- Node.js and npm
- Maven

### Backend

Configure the database connection using environment variables, including `DB_PASSWORD`.

Run the Spring Boot application from your IDE or with Maven.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Purpose

ServiceHub was developed as a portfolio project to demonstrate practical full-stack development skills, with a focus on Java backend engineering, database integration, security, and automated testing.
