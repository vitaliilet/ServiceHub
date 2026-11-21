# ServiceHub — Service Booking Platform

ServiceHub is a full-stack web application that connects customers with local service professionals, allowing users to discover specialists, book appointments, and leave reviews.

The project demonstrates backend development with Java, Spring Boot, Spring Security, REST APIs, and PostgreSQL.

## Tech Stack

**Backend**
- Java 25
- Spring Boot 4
- Spring Security
- Spring Data JPA / Hibernate
- PostgreSQL
- Maven

**Frontend**
- React
- Vite
- JavaScript

**Testing**
- JUnit 5
- Mockito

## Features

### Customer
- User registration and login
- Search specialists by city and service
- Browse specialist profiles and ratings
- Book available appointment slots
- View and cancel personal bookings
- Leave reviews after completed appointments

### Professional
- Register as a service professional
- Create and update a professional profile
- Upload a profile photo
- Configure working hours and days off
- View bookings through a professional dashboard
- Mark completed appointments

### Security and Booking Validation
- Session-based authentication with Spring Security
- Role-based authorization (CLIENT and PROFESSIONAL)
- CSRF protection
- Password hashing with BCrypt
- Server-side appointment validation
- Prevention of double bookings using PostgreSQL constraints
- Validation of uploaded image files

## Architecture

The backend follows a layered architecture:

- **Controller** — REST API endpoints
- **Repository** — database access using Spring Data JPA
- **Entity** — persistence models
- **Security Configuration** — authentication and authorization

The React frontend communicates with the Spring Boot REST API.

## Running Locally

### Requirements
- Java 25
- PostgreSQL
- Node.js and npm

### Backend

1. Create a PostgreSQL database named `servicehub`.
2. Configure the database connection in `application.properties`.
3. Set the `DB_PASSWORD` environment variable.
4. Start the Spring Boot application using:

```bash
./mvnw spring-boot:run
```

The backend runs on `http://localhost:8080`.

### Frontend

From the frontend project directory:

```bash
npm install
npm run dev
```

The frontend typically runs on `http://localhost:5173`.

## Tests

The backend includes automated tests for booking validation and application startup.

Run the tests with:

```bash
./mvnw clean test
```

## Project Status

ServiceHub is an actively developed portfolio project.

Planned improvements include UI enhancements, deployment, and additional automated tests.

## Author

Developed by [vitaliilet](https://github.com/vitaliilet).