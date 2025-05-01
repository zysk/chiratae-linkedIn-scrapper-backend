# Requirement and System Documentation: linkedin-scraper (LinkedIn Scraper)

**Version:** 1.0
**Date:** 2024-07-26

**Table of Contents:**

1.  **Application Overview - The Big Picture**
    *   1.1. Inferred Purpose & Domain
    *   1.2. High-Level Architecture & Code Structure
    *   1.3. Application Entry Points & Initialization
    *   1.4. Routing Mechanism
    *   1.5. Middleware Strategy
    *   1.6. Data Persistence & Models
    *   1.7. Key External Dependencies
    *   1.8. Configuration Management
    *   1.9. Overall Error Handling Strategy
    *   1.10. Testing Strategy (if applicable)
2.  **Detailed Feature Analysis - Module by Module**
    *   2.1. Feature: User Management & Authentication
    *   2.2. Feature: LinkedIn Account Management
    *   2.3. Feature: Proxy Management
    *   2.4. Feature: Campaign Management
    *   2.5. Feature: Automated LinkedIn Search (Scraping - Core Functionality)
    *   2.6. Feature: Automated LinkedIn Profile Scraping (Scraping - Core Functionality)
    *   2.7. Feature: Lead Management
    *   2.8. Feature: Lead Status Management
    *   2.9. Feature: Lead Logging & Comments
    *   2.10. Feature: Email Configuration & Sending

---

## 1. Application Overview - The Big Picture

### 1.1. Inferred Purpose & Domain

*   **Inferred Purpose:** Based on the codebase analysis (dependencies like `selenium-webdriver`, `mongoose`, specific function names like `searchLinkedInFn`, `linkedInProfileScrapping`, and model names like `Campaign`, `Lead`, `LinkedInAccounts`, `Proxies`), this application serves as an automated **LinkedIn Lead Generation and Scraping Tool**. It allows users (likely sales or marketing teams) to define search campaigns, manages LinkedIn credentials and proxies, automatically performs searches on LinkedIn using Selenium WebDriver, scrapes profile data of potential leads found, and stores this information for further processing or export.
*   **Domain:** Business-to-Business (B2B) Lead Generation, Sales Automation, Marketing Automation, Web Scraping.
*   **Users:** Likely internal users (sales representatives, marketing operations) or potentially clients of a service built around this tool. There appear to be distinctions between standard 'Users' and 'Admin' roles (`rolesObj` constant likely defines these).
*   **Importance:** Understanding this core purpose is crucial because it contextualizes all other features. User management revolves around accessing the scraping capabilities, campaigns define the scraping targets, leads are the output of scraping, and proxies/LinkedIn accounts are essential resources for the scraping process itself.

### 1.2. High-Level Architecture & Code Structure

*   **Architecture:** Primarily a **Monolithic Application** with a **Layered** structure tendency, built using the **Express.js** framework on Node.js.
    *   **Presentation/API Layer:** Defined in `routes/` and handled by Express routing. Serves a RESTful API and potentially a static frontend (`public/`).
    *   **Business Logic Layer:** Encapsulated within `controllers/` files, containing the core logic for each feature and orchestrating interactions with data and external services (Selenium).
    *   **Data Access Layer:** Managed through `mongoose` models defined in `models/` for interaction with MongoDB.
    *   **Supporting Layers:** Utility functions in `helpers/`, middleware in `middlewares/`, and custom aggregation pipelines/data shaping in `Builders/`.
*   **Code Structure:**
    *   `bin/www.js`: Entry point, sets up the HTTP server.
    *   `app.js`: Core Express application setup, middleware registration, database/Redis connections, route mounting, Selenium WebDriver initialization, and cron job scheduling.
    *   `routes/`: Defines API endpoints and maps them to controller functions.
    *   `controllers/`: Contains request handling logic, interacts with models and helpers. Core scraping logic is initiated here (`linkedInProfileScrapping`, `searchLinkedInFn` are invoked, often from cron or specific API calls).
    *   `models/`: Defines Mongoose schemas for MongoDB collections (Users, Campaigns, Leads, LinkedInAccounts, Proxies, etc.).
    *   `helpers/`: Contains utility functions (e.g., password hashing (`Bcrypt.js`), JWT generation (`Jwt.js`), validation (`Validators.js`), error handling (`ErrorHandler.js`, `seleniumErrorHandler.js`), core scraping logic (`SearchLinkedInFn.js`), constants (`Constants.js`), configuration loading (`Config.js`)).
    *   `middlewares/`: Likely contains authentication middleware (not explicitly read, but inferred from JWT usage) and potentially other request processing logic.
    *   `public/`: Contains static assets, likely a Single Page Application (SPA) frontend, as indicated by the catch-all route serving `index.html`.
    *   `config/` (Not present, but `.env` files and `helpers/Config.js` serve this purpose): Environment-specific configuration.
    *   `test/`: Contains test files (structure and content not analyzed in detail).
*   **Interaction Flow (API Request):** Request -> Express -> Global Middleware (`cors`, `json`, `urlencoded`, `cookieParser`) -> Router -> Route-Specific Middleware (e.g., Auth - inferred) -> Controller Function -> Model Interaction (MongoDB via Mongoose) / Helper Functions / Selenium Interaction -> Response Generation -> Error Handling Middleware (`ErrorHandler.js`) -> Response Sent.
*   **Interaction Flow (Cron Job):** `node-schedule` triggers `cronFunc` (in `app.js`) -> Checks Redis lock (`isFree`) -> Calls `searchLinkedInFn` or `linkedInProfileScrapping` (in `helpers/` or `controllers/`) -> Uses Selenium WebDriver (`driver` from `app.js`) -> Interacts with LinkedIn website -> Scrapes data -> Updates Models (MongoDB via Mongoose) -> Updates Redis lock.
*   **Asynchronous Patterns:** Primarily uses `async/await` with Promises for handling asynchronous operations (database calls, Selenium interactions, file system operations). Error handling relies on `try...catch` blocks passing errors to Express's `next()` function.

### 1.3. Application Entry Points & Initialization

*   **Primary Entry Point:** Execution starts via `node ./bin/www.js` (using `babel-node` for ES6+ transpilation as defined in `package.json` scripts).
*   **Initialization Sequence (`bin/www.js` -> `app.js`):**
    1.  `bin/www.js` imports `app` from `app.js`.
    2.  `bin/www.js` normalizes the port (env `PORT` or `3000`).
    3.  `bin/www.js` creates an HTTP server instance using the `app` object.
    4.  `bin/www.js` starts listening on the specified port.
    5.  **Inside `app.js` (during import/initialization):**
        *   Imports necessary modules (Express, Mongoose, Redis, CORS, middleware, routes, helpers, Selenium, etc.).
        *   Creates the Express `app` instance.
        *   Connects to MongoDB using Mongoose (`CONFIG.MONGOURI`).
        *   Connects to Redis, sets initial `isFree` key.
        *   Registers global middleware (`cors`, `express.json`, `express.urlencoded`, `cookieParser`, `express.static`).
        *   Mounts API routers from `routes/` under specific path prefixes (e.g., `/users`, `/campaign`).
        *   Sets up the catch-all route for serving the frontend (`public/index.html`).
        *   Registers the custom `errorHandler`.
        *   Initializes and configures the Selenium WebDriver (`driver`) instance for Chrome, handling proxy settings and headless mode based on environment.
        *   Schedules the `cronFunc` using `node-schedule` to run at midnight.
        *   Exports the `app` object (used by `bin/www.js`) and the `driver` instance (used by scraping functions).

### 1.4. Routing Mechanism

*   **Library:** Express Router (`express.Router()`).
*   **Structure:** Each feature module (e.g., Users, Campaigns, Leads) has its own routing file in the `routes/` directory (e.g., `users.routes.js`, `Campaign.routes.js`).
*   **Mounting:** These modular routers are mounted onto the main `app` instance in `app.js` with specific base paths (e.g., `app.use('/users', usersRouter)`).
*   **Definition Example (`routes/users.routes.js`):**
    ```javascript
    import express from "express";
    import { deleteUser, /* ... other handlers ... */ login, registerUser, updateUser } from "../controllers/users.controller";
    let router = express.Router();

    // Defines POST /users/register endpoint, handled by registerUser controller
    router.post("/register", registerUser);
    // Defines POST /users/login endpoint, handled by login controller
    router.post("/login", login);
    // Defines PATCH /users/updateById/:id endpoint, handled by updateUser controller
    router.patch("/updateById/:id", updateUser);
    // Defines GET /users/getById/:id endpoint, handled by getUserById controller
    router.get("/getById/:id", getUserById);
     // Defines DELETE /users/deleteById/:id endpoint, handled by deleteUser controller
    router.delete("/deleteById/:id", deleteUser);
    // ... other user routes

    export default router;
    ```
*   A catch-all GET route (`app.get("*", ...)`) exists in `app.js` to serve the `index.html` file, likely for a frontend SPA router.

### 1.5. Middleware Strategy

*   **Global Middleware (applied in `app.js`):**
    *   `cors()`: Allows cross-origin requests from any origin (`*`).
    *   `express.json()`: Parses incoming JSON request bodies (limit 100mb).
    *   `express.urlencoded()`: Parses incoming URL-encoded form data (limit 100mb).
    *   `cookieParser()`: Parses `Cookie` header and populates `req.cookies`.
    *   `express.static('public')`: Serves static files from the `public` directory.
    *   `errorHandler` (Custom, defined in `helpers/ErrorHandler.js`): Centralized error handler, catches errors passed via `next(err)` and sends a JSON response with appropriate status code (err.status or 500) and message.
*   **Route-Specific Middleware:** While not explicitly shown in the provided snippets for *all* routes, the use of JWT (`jsonwebtoken` dependency, `generateAccessJwt` helper) strongly implies the existence of authentication/authorization middleware applied to protected routes, likely defined in `middlewares/` and used within specific router files. This middleware would verify the JWT token from the request (e.g., `Authorization` header) and attach user information to the `req` object.
*   **Implicit Middleware:** `morgan` (HTTP request logger) is included as a dependency and imported in `app.js` but appears commented out (`// app.use(logger("dev"));`). `multer` is a dependency, suggesting middleware for handling file uploads exists somewhere, likely applied to specific routes needing file processing.

### 1.6. Data Persistence & Models

*   **Primary Database:** MongoDB. Connection handled via `mongoose` ODM in `app.js`, using connection string from `CONFIG.MONGOURI`.
*   **ODM:** Mongoose is used extensively. Models are defined in the `models/` directory.
*   **Key Models:**
    *   `User` (`models/user.model.js`): Stores user information (name, email, phone, password (hashed), role, isActive status, potentially scraping-related stats/rating). Referenced in `Lead`.
    *   `Campaign` (`models/Campaign.model.js`): Defines scraping jobs (name, LinkedIn search query, target company/school/past company filters, associated LinkedIn account/password/proxy, status (`CREATED`, potentially `PROCESSING`, `COMPLETED`), `isSearched` flag, `processing` flag, total results found, array of found lead IDs (`resultsArr`), run count).
    *   `Lead` (`models/leads.model.js`): Represents a scraped lead profile. Links to `User` (the profile itself, `clientId`), `Campaign` (source campaign), `User` (assigned user, `leadAssignedToId`). Includes status (`CREATED`, etc.) and inferred rating (`LOW`, etc.), `isSearched` flag.
    *   `LinkedInAccounts` (`models/LinkedInAccounts.model.js`): Stores credentials (name/email, password) for LinkedIn accounts used for scraping.
    *   `Proxies` (`models/Proxies.model.js`): Stores proxy server addresses (`value`) used for Selenium sessions.
    *   `LeadComment` (`models/LeadComment.model.js` - inferred from routes): Likely stores notes or comments related to specific leads.
    *   `LeadLogs` (`models/LeadLogs.model.js` - inferred from routes): Probably logs actions or events related to leads or the scraping process.
    *   `LeadStatus` (`models/LeadStatus.model.js` - inferred from routes): Potentially defines custom statuses available for leads.
    *   `EmailSettings` (`models/EmailSettings.model.js` - inferred from routes): Likely stores configuration for Nodemailer (SMTP server, credentials, etc.).
    *   `PreviousLeads` (`models/previousLeads.model.js` - seen in `SearchLinkedInFn.js` import): Used to check if a lead profile has already been scraped/processed to avoid duplicates.
    *   `UserLogs` (`models/userLogs.model.js` - seen in `SearchLinkedInFn.js` import): Potentially logs user actions or system events related to users.
*   **Data Interaction:** Primarily through Mongoose methods (`.find()`, `.findById()`, `.findOne()`, `.findByIdAndUpdate()`, `.findByIdAndRemove()`, `.save()`, `.aggregate()`) within controller functions and helper functions. Some aggregation pipelines are defined in `Builders/` (e.g., `UserListWithCampaigns`).

### 1.7. Key External Dependencies

*   **Web Framework:** `express`
*   **Database:** `mongoose` (MongoDB ODM)
*   **Web Scraping/Automation:** `selenium-webdriver`, `chromedriver`, `chromium`
*   **Authentication:** `jsonwebtoken` (JWT handling), `bcryptjs` (password hashing)
*   **Networking/API:** `cors` (Cross-Origin Resource Sharing)
*   **Utilities:** `dotenv` (environment variables), `morgan` (logging - inactive), `cookie-parser`, `nanoid` (unique ID generation), `path` (Node.js built-in)
*   **File Handling:** `multer` (file uploads), `exceljs` (Excel file operations), `fs` (Node.js built-in)
*   **Scheduling:** `node-schedule`, `node-cron` (dependency listed, but `node-schedule` seems actively used in `app.js`)
*   **Caching/State:** `redis` (Redis client)
*   **Email:** `nodemailer`
*   **QR Codes:** `qrcode`, `qr-image`
*   **Error Handling:** `http-errors` (dependency listed, but custom error handling seems prevalent)
*   **Development:** `nodemon` (auto-reload), `@babel/core`, `@babel/node`, `@babel/cli`, `@babel/preset-env` (ES6+ support), `eslint`, `prettier` (linting/formatting)
*   **External Service Interactions:** Primarily **LinkedIn.com** via Selenium WebDriver. Potentially email services via Nodemailer. No other third-party API interactions are immediately obvious from the analyzed code.

### 1.8. Configuration Management

*   **Method:** Environment variables loaded from `.env` files using the `dotenv` package.
*   **Loading:** Likely initialized early, possibly via `helpers/Config.js` (which is imported in `app.js`). `app.js` uses `CONFIG.MONGOURI`. Other configurations like `process.env.PORT`, `process.env.ENABLE_CRON`, `process.env.NODE_ENV`, `process.env.TZ` are used directly.
*   **Files:** `.env` (for development/default), `.env.prod` (suggests a production environment configuration).
*   **Key Configurable Parameters (Inferred/Observed):**
    *   `PORT`: Server listening port.
    *   `MONGOURI`: MongoDB connection string.
    *   `JWT_SECRET` / `ACCESS_TOKEN_SECRET` (Inferred): Secret key for signing JWT tokens (likely used in `helpers/Jwt.js`).
    *   `ENABLE_CRON`: Boolean ('true'/'false') to enable/disable the scheduled scraping task.
    *   `NODE_ENV`: Environment identifier ('development', 'production', etc.). Used to conditionally enable headless mode for Selenium.
    *   `TZ`: Timezone setting for cron job logging.
    *   Redis connection details (Host, Port - possibly defaults or via env vars).
    *   Nodemailer configuration (SMTP host, port, auth - likely in `.env` or `EmailSettings` model).

### 1.9. Overall Error Handling Strategy

*   **Approach:** Combination of local `try...catch` blocks and a centralized error handling middleware.
*   **Local Handling:** Controller and helper functions use `try...catch`. Caught errors are typically passed to the `next()` function (e.g., `next(error)`). For expected errors (e.g., validation, not found), custom error objects with a `status` property are sometimes thrown (e.g., `throw { status: 401, message: "Invalid Password" };`).
*   **Centralized Handler (`helpers/ErrorHandler.js`):**
    *   This middleware is registered last in `app.js` (`app.use(errorHandler)`).
    *   It receives errors passed via `next(err)`.
    *   Logs the error to the console (`console.error(err)`).
    *   Checks if the error object has a `status` property. If yes, it sends a JSON response with that status code and `err.message`.
    *   If no `status` property exists, it defaults to a `500 Internal Server Error` status code and sends `err.message`.
*   **Selenium Errors:** A specific helper `helpers/seleniumErrorHandler.js` exists (content not read), suggesting specialized handling for errors originating from Selenium interactions, possibly involving logging specific details or attempting recovery. This is called within `catch` blocks in `SearchLinkedInFn.js`.

### 1.10. Testing Strategy (if applicable)

*   **Presence:** A `test/` directory exists, and development dependencies include testing-related tools (`@babel/preset-env` can be used for tests). `package.json` doesn't show explicit test scripts (`npm test`), but they might exist within Makefiles or other build tools not visible here.
*   **Inferred Strategy:** The presence of the directory suggests some level of testing (likely unit or integration tests) is intended or implemented. However, without analyzing the contents of `test/`, the exact strategy, libraries used (e.g., Jest, Mocha, Chai), coverage, and types of tests (unit, integration, e2e) cannot be determined. Given the reliance on external systems (LinkedIn via Selenium, DB, Redis), robust integration and potentially end-to-end testing would be valuable but complex to implement reliably.

---

## 2. Detailed Feature Analysis - Module by Module

### 2.1. Feature: User Management & Authentication

*   **2.1.1. Description:** Handles user registration, login, profile updates, retrieval, and deletion. Distinguishes between standard users and administrators, providing separate login/registration endpoints for admins. Implements JWT-based authentication.
*   **2.1.2. Interaction Points / API Endpoints:** (Base Path: `/users`)
    *   `POST /register`: Creates a new standard user.
        *   Request Body: `{ "name": "...", "email": "...", "phone": "...", "password": "..." }` (other fields from `user.model` might be accepted).
        *   Response (Success 200): `{ "message": "User Created", "success": true }`
    *   `POST /login`: Authenticates a standard user.
        *   Request Body: `{ "email": "...", "password": "..." }`
        *   Response (Success 200): `{ "message": "LogIn Successfull", "token": "JWT_ACCESS_TOKEN", "success": true }`
        *   Response (Failure 401): `{ "message": "Invalid Password" }` or `{ "message": "user Not Found" }` or `{ "message": "You are marked as inactive..." }`
    *   `GET /getUsers`: Retrieves a list of users (potentially filterable by role via query param `?role=...`).
        *   Response (Success 200): `{ "message": "Users", "data": [UserObject1, UserObject2, ...], "success": true }`
    *   `GET /getById/:id`: Retrieves a specific user by their MongoDB ObjectId.
        *   Response (Success 201 - *Note: Should likely be 200*): `{ "message": "found User", "data": UserObject, "success": true }`
        *   Response (Failure 4xx/500): `{ "message": "User Not found" }`
    *   `PATCH /updateById/:id`: Updates a specific user's details.
        *   Request Body: `{ "name": "...", "email": "...", ... }` (Password can be updated; if empty/missing, it's ignored).
        *   Response (Success 201 - *Note: Should likely be 200*): `{ "message": "Updated Successfully", "success": true }`
        *   Response (Failure 4xx/500): `{ "message": "User Not found" }`
    *   `DELETE /deleteById/:id`: Deletes a specific user.
        *   Response (Success 200): `{ "message": "user deleted successfully", "success": true }`
        *   Response (Failure 400): `{ "message": "user not found or deleted already" }`
    *   `POST /registerAdmin`: Creates a new admin user. (Logic seems similar to `/register` but potentially sets a different role).
        *   Request Body: `{ "email": "...", "password": "...", ... }`
        *   Response (Success 200): `{ "message": "admin Created", "success": true }`
    *   `POST /loginAdmin`: Authenticates an admin user. (Logic similar to `/login` but potentially checks for admin role).
        *   Request Body: `{ "email": "...", "password": "..." }`
        *   Response (Success 200): `{ "message": "LogIn Successfull", "token": "JWT_ACCESS_TOKEN", "success": true }` (Token payload includes role and user details).
        *   Response (Failure 401): `{ "message": "Invalid Password" }` or `{ "message": "User Not Found" }`
    *   `GET /getUserDetailsWithCampaignsData/:id`: Retrieves user details along with aggregated data about their associated campaigns (Uses `UserListWithCampaigns` builder).
        *   Response (Success 200): `{ "message": "user deleted successfully", "data": AggregatedUserObject, "success": true }` (*Note: Message seems incorrect*)
    *   `GET /setUserRating`: Triggers a calculation (`CalculateRating` helper) and updates the `rating` field for all users with role 'CLIENT' and their associated leads. (Internal/Admin endpoint).
        *   Response (Success 200): `{ "message": "as", "success": true }` (*Note: Message is uninformative*)
*   **2.1.3. Core Logic & Workflow:**
    *   **Registration:** Checks for existing email/phone, validates email format, encrypts password using `bcryptjs` (`helpers/Bcrypt.js`), saves new user document to MongoDB via Mongoose (`models/user.model`).
    *   **Login:** Finds user by email, compares provided password with stored hash using `bcryptjs`. If valid and user is active, generates a JWT access token (`helpers/Jwt.js`) containing user ID, role, and basic info.
    *   **Updates:** Finds user by ID, encrypts new password if provided, updates document using `findByIdAndUpdate`.
    *   **Retrieval:** Uses Mongoose `find` or `findById` methods.
    *   **Deletion:** Uses Mongoose `findByIdAndRemove`.
    *   **Rating:** Iterates through users, calls a complex `CalculateRating` helper (logic not shown), updates user and associated lead ratings.
*   **2.1.4. Data Interaction:** Primarily interacts with the `Users` collection in MongoDB. The `setUserRating` function also interacts with the `Leads` collection. Uses `UserListWithCampaigns` aggregation pipeline (defined in `Builders/`) for `/getUserDetailsWithCampaignsData`.
*   **2.1.5. Detailed Scenarios:**
    *   **a) Happy Paths:** Successful registration, login, fetching users, updating profile, deleting user. Successful admin login/registration. Successful rating calculation trigger.
    *   **b) Edge Cases:** Updating user without changing password. Fetching an empty list of users. Registering with optional fields missing. Logging in as an inactive user.
    *   **c) Error Scenarios & Handling:**
        *   Registration: Email/phone already exists (`ErrorMessages.EMAIL_EXISTS`/`PHONE_EXISTS`), invalid email format (`ErrorMessages.INVALID_EMAIL`), missing password. (Returns 500 via `errorHandler`).
        *   Login: User not found (401), invalid password (401), inactive user (500 via `errorHandler` with specific message).
        *   Get/Update/Delete by ID: User not found (500 via `errorHandler` or specific 400 for delete).
        *   Admin Login: User not found (401), invalid password (401).
        *   General: Database errors, unexpected exceptions caught by `try...catch` and passed to `errorHandler` (results in 500).
    *   **d) Security Considerations:**
        *   Password hashing implemented using `bcryptjs`.
        *   Authentication uses JWT, presumably passed in `Authorization: Bearer <token>` header and verified by middleware (inferred).
        *   Input validation exists for email format (`ValidateEmail`). Basic check for password presence during registration. Further input sanitization (e.g., against NoSQL injection) is not explicitly shown but might be partially handled by Mongoose depending on usage.
        *   Potential vulnerability: Email check uses regex (`new RegExp(^\`${req.body.email}$\`)`). While anchored (`^`, `$`), complex emails might still pose a risk if not carefully handled (ReDoS). Using a dedicated validation library is often safer.
        *   Authorization (role checks) appears to be implemented based on the JWT payload (e.g., distinguishing admin/user actions), likely within middleware or controller logic (e.g., separate admin login).

### 2.2. Feature: LinkedIn Account Management

*   **2.2.1. Description:** Manages the LinkedIn account credentials (email/username, password) used by the system for automated scraping. Allows adding, retrieving, updating, and deleting these accounts.
*   **2.2.2. Interaction Points / API Endpoints:** (Base Path: `/linkedInAccount`) - *Methods inferred from typical CRUD*
    *   `POST /`: Adds a new LinkedIn account credential.
        *   Request Body: `{ "name": "linkedin_email@example.com", "password": "linkedin_password" }`
    *   `GET /`: Retrieves a list of stored LinkedIn accounts.
    *   `GET /:id`: Retrieves a specific LinkedIn account by ID.
    *   `PATCH /:id`: Updates a specific LinkedIn account's details.
    *   `DELETE /:id`: Deletes a specific LinkedIn account.
*   **2.2.3. Core Logic & Workflow:** Standard CRUD operations handled by corresponding controller functions (likely in `controllers/LinkedInAccounts.controller.js` - not explicitly read) interacting with the Mongoose model. Passwords stored might be plain text or encrypted (model doesn't specify encryption, but `Campaign.model` also has `password`, suggesting it might be stored directly; this is a **SECURITY RISK** if plain text).
*   **2.2.4. Data Interaction:** Interacts with the `LinkedInAccounts` collection in MongoDB via `models/LinkedInAccounts.model.js`.
*   **2.2.5. Detailed Scenarios:**
    *   **a) Happy Paths:** Successfully adding, listing, updating, retrieving, deleting LinkedIn account credentials.
    *   **b) Edge Cases:** Updating only name or password. Listing when no accounts exist.
    *   **c) Error Scenarios & Handling:** Account not found for GET/PATCH/DELETE operations. Database errors during CRUD operations. Validation errors (e.g., missing name/password) during creation.
    *   **d) Security Considerations:** **MAJOR CONCERN:** If passwords in `LinkedInAccounts` collection are stored in plain text (as the simple `String` type in the model suggests), this is a significant security vulnerability. They should be encrypted at rest. Access to these endpoints should be strictly limited to authorized administrators.

### 2.3. Feature: Proxy Management

*   **2.3.1. Description:** Manages proxy server addresses used during Selenium-driven web scraping to potentially avoid IP blocking by LinkedIn and rotate source IPs. Allows adding, retrieving, updating, and deleting proxy details.
*   **2.3.2. Interaction Points / API Endpoints:** (Base Path: `/proxies`) - *Methods inferred from typical CRUD*
    *   `POST /`: Adds a new proxy address.
        *   Request Body: `{ "value": "http://user:pass@host:port" }` or `{ "value": "host:port" }`
    *   `GET /`: Retrieves a list of stored proxies.
    *   `GET /:id`: Retrieves a specific proxy by ID.
    *   `PATCH /:id`: Updates a specific proxy's address.
    *   `DELETE /:id`: Deletes a specific proxy.
*   **2.3.3. Core Logic & Workflow:** Standard CRUD operations handled by corresponding controller functions (likely in `controllers/Proxies.controller.js` - not explicitly read) interacting with the Mongoose model.
*   **2.3.4. Data Interaction:** Interacts with the `Proxies` collection in MongoDB via `models/Proxies.model.js`. Proxies are retrieved by ID in `controllers/Campaign.controller.js` (`linkedInLogin` function) to configure the Selenium WebDriver instance.
*   **2.3.5. Detailed Scenarios:**
    *   **a) Happy Paths:** Successfully adding, listing, updating, retrieving, deleting proxy addresses. Selenium successfully using a configured proxy.
    *   **b) Edge Cases:** Listing when no proxies exist. Adding proxies with different formats (with/without auth).
    *   **c) Error Scenarios & Handling:** Proxy not found for GET/PATCH/DELETE. Database errors. Validation errors (e.g., missing value) during creation. Selenium failing to connect *through* the proxy (network error, invalid proxy).
    *   **d) Security Considerations:** Access to these endpoints should likely be restricted to administrators. If proxies require authentication, credentials are stored as part of the `value` string, potentially exposing them if database access is compromised.

### 2.4. Feature: Campaign Management

*   **2.4.1. Description:** Allows users to define, manage, and monitor LinkedIn search campaigns. A campaign specifies the search criteria (query, filters), the LinkedIn account and proxy to use, and tracks its status and results. Campaigns are the primary input for the automated scraping process.
*   **2.4.2. Interaction Points / API Endpoints:** (Base Path: `/campaign`)
    *   `POST /addCampaign`: Creates a new scraping campaign.
        *   Request Body: `{ "name": "...", "searchQuery": "...", "linkedInAccountId": "...", "password": "...", "proxyId": "...", "school": "...", "company": "...", "pastCompany": "..." }` (Password seems redundant if `linkedInAccountId` is used, potentially legacy or fallback).
    *   `GET /getCampaigns`: Retrieves a list of campaigns (likely with filtering options, e.g., by status).
    *   `GET /getById/:id`: Retrieves a specific campaign by ID.
    *   `PATCH /updateById/:id`: Updates a specific campaign's details.
    *   `DELETE /deleteById/:id`: Deletes a specific campaign.
    *   `POST /addCampaignToQueue`: (From `Campaign.controller.js`) - Seems to potentially manually trigger or requeue a campaign (likely sets status back to `CREATED`).
    *   `POST /addScheduledCampaign`: (From `Campaign.controller.js`) - Schedules a campaign to run at a specific time (logic involves `helpers/ScheduledCampaigns.js` - not read).
    *   `GET /getPastCampaign`: (From `Campaign.controller.js`) - Retrieves historical or completed campaigns.
    *   `GET /getPastCampaignById/:id`: (From `Campaign.controller.js`) - Retrieves details of a specific past campaign.
    *   `POST /sendCampaignToSevanta`: (From `Campaign.controller.js`) - Sends campaign data via email using `sendCustomMailToSavanta` helper (purpose unclear, perhaps reporting or integration).
*   **2.4.3. Core Logic & Workflow:**
    *   **Creation/Update:** Standard CRUD operations saving/updating campaign details in the `Campaign` collection. Status defaults to `CREATED`, `isSearched` to `false`.
    *   **Scheduling:** Uses `node-schedule` or similar mechanism managed by `helpers/ScheduledCampaigns.js`.
    *   **Queueing/Execution:** Campaigns with `status: CREATED`, `isSearched: false`, `processing: false` are picked up by the `cronFunc` (in `app.js`) or potentially triggered manually. The `processing` flag likely acts as a short-term lock during active scraping for that campaign. `isSearched` flag is set to `true` after the initial search phase completes.
*   **2.4.4. Data Interaction:** Interacts primarily with the `Campaign` collection. Retrieves `LinkedInAccounts` and `Proxies` based on IDs stored in the campaign. Updates campaign status (`status`, `processing`, `isSearched`), `totalResults`, and `resultsArr` (array of lead IDs) during scraping.
*   **2.5.5. Detailed Scenarios:**
    *   **a) Happy Paths:** Creating a campaign, campaign being picked up by cron, search executing, leads being found, campaign status updating. Scheduling a campaign successfully. Retrieving campaign details.
    *   **b) Edge Cases:** Campaign with no filters. Campaign targeting a very large number of results. Campaign using an account that gets locked during the run. Running multiple campaigns concurrently (handled by `processing` flag and potentially Redis lock). Campaign completing with zero results found.
    *   **c) Error Scenarios & Handling:** Invalid `linkedInAccountId` or `proxyId`. Missing required fields (`searchQuery`). Database errors. Errors during the scraping process associated with this campaign (logged, campaign might be marked as failed or retried). Errors sending email in `sendCampaignToSevanta`.
    *   **d) Security Considerations:** Storing LinkedIn password directly in the `Campaign` model (if `password` field is used instead of relying solely on `linkedInAccountId`) is a **SECURITY RISK**. Access control for creating/managing campaigns is needed. Input validation on `searchQuery` and filter fields is important to prevent potential issues if these are reflected insecurely elsewhere.

### 2.5. Feature: Automated LinkedIn Search (Scraping - Core Functionality)

*   **2.5.1. Description:** This is a core automated process, typically triggered by the cron job (`cronFunc` in `app.js`) or potentially manual triggers. It takes pending campaigns, uses Selenium WebDriver to log into LinkedIn (using credentials and proxies specified in the campaign), performs the search based on the campaign's query and filters, iterates through results pages, and extracts basic lead information (like profile URLs) to store or queue for further processing.
*   **2.5.2. Interaction Points / API Endpoints:** Primarily an internal process triggered by `cronFunc` which calls `helpers/SearchLinkedInFn.js`. Some related manual triggers might exist:
    *   `POST /searchLinkedin`: (From `Campaign.controller.js`) - Likely a manual trigger to initiate the search process (perhaps for a specific campaign or all pending).
    *   `POST /linkedInLogin`: (From `Campaign.controller.js`) - Handles the Selenium login process, including CAPTCHA and OTP verification steps, often called before starting a search. Requires user interaction via API calls if CAPTCHA/OTP occurs.
    *   `GET /checkLinkedInLogin`: (From `Campaign.controller.js`) - Checks if the Selenium browser instance is currently logged into LinkedIn.
    *   `POST /getLinkedInCaptcha`: (From `Campaign.controller.js`) - If CAPTCHA is detected during login, this endpoint might return the CAPTCHA image URL/data.
    *   `POST /sendLinkedInCaptchaInput`: (From `Campaign.controller.js`) - Submits the user-provided CAPTCHA solution.
    *   `POST /verifyOtp`: (From `Campaign.controller.js`) - Submits a user-provided OTP (One-Time Password) if requested by LinkedIn during login.
    *   `POST /resendPhoneCheck`: (From `Campaign.controller.js`) - Potentially related to phone verification steps during login.
*   **2.5.3. Core Logic & Workflow (`helpers/SearchLinkedInFn.js`):**
    1.  Acquires Redis lock (`isFree` = `false`).
    2.  Checks if Selenium WebDriver is logged into LinkedIn (`checkLinkedInLoginFunc`). If not, attempts login (details below) or sends an email alert and releases lock.
    3.  Fetches pending campaigns (`status: CREATED`, `isSearched: false`, `processing: false`) from MongoDB. If none, releases lock and returns.
    4.  Iterates through fetched campaigns:
        *   Marks campaign as `processing: true` (implicit lock for this campaign).
        *   Navigates Selenium driver to LinkedIn search.
        *   Inputs `campaignObj.searchQuery`.
        *   Applies 'People' filter.
        *   Applies advanced filters (Current Company, Past Company, School) based on `campaignObj` fields using complex Selenium interactions (finding filter inputs, sending keys, selecting results).
        *   Clicks 'Show results'.
        *   Waits for results to load, scrolls down page.
        *   Extracts the total number of results found and updates `campaignObj.totalResults`.
        *   Iterates through pagination ('Next' button):
            *   Scrolls page down.
            *   Waits for result elements (`ul/li` containing profile links) to load.
            *   Extracts profile links (`href` from `a` tags within results).
            *   For each profile link:
                *   Checks if the lead already exists in `PreviousLeads` collection using the profile ID extracted from the URL.
                *   If not a duplicate:
                    *   Creates a new `Lead` document (`models/leads.model.js`) linking it to the `campaignId` and storing the profile ID (`clientId` seems to store the LinkedIn profile ID/URL here).
                    *   Adds the new Lead's ID to the `campaignObj.resultsArr`.
                    *   Adds the profile ID to the `PreviousLeads` collection to prevent future duplicates.
            *   Handles potential errors during result extraction/saving.
            *   Clicks the 'Next' button until it's disabled or an error occurs.
        *   Marks campaign as `isSearched: true` and `processing: false`.
        *   Handles errors during the campaign loop using `seleniumErrorHandler` and continues to the next campaign.
    5.  Releases Redis lock (`isFree` = `true`).
*   **LinkedIn Login Logic (`controllers/Campaign.controller.js` - `linkedInLogin`):**
    1.  Configures Selenium options (headless, proxy).
    2.  Navigates to LinkedIn login page.
    3.  Enters username/password from request body (password decoded from Base64).
    4.  Clicks submit.
    5.  Waits and checks the URL/page content to detect:
        *   Successful login (redirect to feed).
        *   CAPTCHA challenge: Extracts CAPTCHA image URL, returns response indicating CAPTCHA needed. Requires follow-up call to `/sendLinkedInCaptchaInput`.
        *   OTP/Phone verification challenge: Returns response indicating OTP needed. Requires follow-up call to `/verifyOtp`.
        *   Other errors (invalid credentials).
*   **2.5.4. Data Interaction:** Reads `Campaign`, `LinkedInAccounts`, `Proxies`. Reads/Writes `PreviousLeads`. Creates `Lead` documents. Updates `Campaign` (status, flags, results). Uses Redis for global locking (`isFree`).
*   **2.5.5. Detailed Scenarios:**
    *   **a) Happy Paths:** Cron triggers, finds pending campaigns, successfully logs in, applies filters, pages through results, extracts unique profile URLs, creates Lead entries, updates campaign status, releases lock. Manual login via API succeeds.
    *   **b) Edge Cases:** No pending campaigns found. LinkedIn UI changes breaking Selenium selectors. Search yields zero results. All found leads are duplicates. Login requires CAPTCHA/OTP. Running with/without proxy. Campaign uses filters that yield no results after initial search. Network interruptions during scraping.
    *   **c) Error Scenarios & Handling:**
        *   Login Failure: Invalid credentials, account locked, unexpected page structure. Handled in `linkedInLogin`, may require user intervention via API for CAPTCHA/OTP.
        *   Selenium Errors: Element not found (due to UI changes, load times), timeout exceptions, WebDriver crashes. Handled by `try...catch` blocks calling `seleniumErrorHandler` and potentially logging errors in `LeadLogs` or `UserLogs`. May cause a campaign to fail or skip results.
        *   Database Errors: Failing to save Leads or update Campaigns. Handled by `try...catch` -> `next(err)`.
        *   Duplicate Handling: Successfully identifies and skips previously processed leads via `PreviousLeads` check.
        *   Rate Limiting/Blocking: LinkedIn detecting automation and blocking the account or IP (mitigated by proxies, random delays (`driver.sleep(randomIntFromInterval(...))`), but still possible). Outcome depends on how LinkedIn responds (e.g., CAPTCHA, temporary block).
        *   Redis Errors: Failing to get/set the `isFree` lock.
    *   **d) Security Considerations:** Handling of LinkedIn credentials (see 2.2). Base64 decoding of password in `linkedInLogin` offers no real security (easily reversible). Potential for IP blocking if proxies aren't used or rotated effectively. Robust error handling is crucial to prevent infinite loops or resource exhaustion if LinkedIn's site structure changes unexpectedly. The use of `randomIntFromInterval` for delays suggests an attempt to mimic human behavior and avoid detection.

### 2.6. Feature: Automated LinkedIn Profile Scraping (Scraping - Core Functionality)

*   **2.6.1. Description:** This automated process, likely following the search phase (potentially triggered by `cronFunc` after `searchLinkedInFn` or manually), takes the leads generated (specifically their LinkedIn profile URLs/IDs stored in `Lead` documents, likely those with `isSearched: false` on the *Lead* model), visits each profile page using Selenium, and extracts detailed information (e.g., name, title, company, education, experience, contact info if available).
*   **2.6.2. Interaction Points / API Endpoints:** Primarily an internal process called by `cronFunc` (`linkedInProfileScrapping` in `Campaign.controller.js`) or potentially manual triggers:
    *   `POST /linkedInProfileScrappingReq`: (From `Campaign.controller.js`) - Likely a manual trigger to start scraping profiles for specific leads or campaigns.
*   **2.6.3. Core Logic & Workflow (`controllers/Campaign.controller.js` - `linkedInProfileScrapping` function):**
    1.  (Assumes Redis lock is potentially held or re-acquired if run separately from search).
    2.  Fetches `Lead` documents that need scraping (e.g., `isSearched: false` on the Lead model, or linked to campaigns marked as `isSearched: true` but not yet fully scraped). The exact query needs confirmation by reading the function body fully.
    3.  Iterates through the list of leads to scrape:
        *   Retrieves the LinkedIn profile URL/ID from the `Lead` document (`lead.clientId`).
        *   Navigates the Selenium driver to the profile page (`https://www.linkedin.com/in/${profileId}/`).
        *   Waits for the profile page elements to load.
        *   Uses numerous specific Selenium `findElement(By.xpath(...))` calls to locate and extract text/data for various profile sections:
            *   Name
            *   Headline/Title
            *   Location
            *   About section
            *   Experience (loops through multiple positions) - Company, Title, Duration, Description
            *   Education (loops through multiple entries) - School, Degree, Dates
            *   Skills
            *   Contact Info (if accessible - often requires connection)
            *   Profile picture URL
        *   Handles cases where sections might be missing using `try...catch` or checking element presence.
        *   Updates the corresponding `User` document (identified by `lead.clientId` - **this seems potentially incorrect, maybe it should update a separate Profile collection or enrich the Lead object? Reading the full function is needed for clarity.** The `User` model doesn't seem designed to hold detailed scraped profile data directly). It might be updating the `User` record *if* the scraped profile corresponds to an existing user in the system identified by their profile ID, or perhaps it *creates* a User record of type 'CLIENT' from the scraped data. The call `CalculateRating(usersArr[j])` in `users.controller` suggests `User` objects *do* hold scraped data like experience/education needed for rating.
        *   Updates the `Lead` document status (e.g., sets `isSearched: true` on the lead).
        *   Includes random delays (`driver.sleep(randomIntFromInterval(...))`) between actions.
    4.  Handles errors during scraping of individual profiles (logs, skips profile).
    5.  (Releases Redis lock if applicable).
*   **2.6.4. Data Interaction:** Reads `Lead` documents. Reads/Writes `User` documents (to store scraped profile details). Updates `Lead` status flags. Uses Selenium `driver`.
*   **2.6.5. Detailed Scenarios:**
    *   **a) Happy Paths:** Successfully fetches leads, navigates to profiles, extracts all expected data points, updates User/Lead records, moves to the next profile.
    *   **b) Edge Cases:** Profile page variations (different layouts for premium vs. free, different languages). Missing profile sections (no 'About', no 'Experience'). Private profiles (limited data visible). Encountering profiles requiring connection request to see details. Scraping very large profiles (many jobs/schools).
    *   **c) Error Scenarios & Handling:**
        *   Selenium Errors: Element not found (UI changes), timeouts, navigation errors. Handled by local `try...catch`, logs error, likely skips the profile.
        *   Data Extraction Errors: Failing to parse specific data points correctly.
        *   Database Errors: Failing to update User/Lead records.
        *   Rate Limiting/Blocking: LinkedIn detecting profile scraping activity. More likely during intensive profile visits than during search.
    *   **d) Security Considerations:** Same as LinkedIn Search (handling credentials, avoiding detection). Parsing scraped HTML/data needs to be robust against unexpected content or structure changes. Storing potentially large amounts of scraped data requires adequate database capacity. Privacy implications of storing detailed personal data scraped from LinkedIn need consideration (compliance with LinkedIn ToS, data privacy regulations like GDPR/CCPA). The purpose of storing scraped data directly in the `User` model needs clarification - if these represent actual *users* of the application vs. *scraped leads*, mixing them could be problematic.

### 2.7. Feature: Lead Management

*   **2.7.1. Description:** Provides functionalities to view, manage, and potentially assign leads generated by the scraping process.
*   **2.7.2. Interaction Points / API Endpoints:** (Base Path: `/lead`) - *Methods inferred*
    *   `GET /`: Retrieves a list of leads (likely filterable by campaign, status, assigned user, etc.).
    *   `GET /:id`: Retrieves details of a specific lead.
    *   `PATCH /:id`: Updates a lead (e.g., assigning to a user (`leadAssignedToId`), changing status).
    *   `DELETE /:id`: Deletes a lead.
    *   (Potential) `POST /assign`: Endpoint to assign leads to users.
*   **2.7.3. Core Logic & Workflow:** Standard CRUD operations on the `Lead` collection, potentially involving lookups to `User` (for assignment) and `Campaign` (for context). Controllers likely reside in `controllers/Lead.controller.js`.
*   **2.7.4. Data Interaction:** Primarily interacts with the `Lead` collection. May read `User` and `Campaign` collections for filtering or displaying related information.
*   **2.7.5. Detailed Scenarios:**
    *   **a) Happy Paths:** Listing leads, filtering leads, viewing lead details, assigning a lead, changing lead status, deleting a lead.
    *   **b) Edge Cases:** Listing leads when none exist. Filtering resulting in an empty set. Updating a lead that was recently deleted.
    *   **c) Error Scenarios & Handling:** Lead not found for GET/PATCH/DELETE. Invalid user ID provided for assignment. Database errors. Invalid status update.
    *   **d) Security Considerations:** Proper authorization required to access/modify leads, potentially based on user roles or lead assignment.

### 2.8. Feature: Lead Status Management

*   **2.8.1. Description:** Manages the custom statuses that can be assigned to leads (e.g., "New", "Contacted", "Qualified", "Rejected"). Allows defining and managing these statuses.
*   **2.8.2. Interaction Points / API Endpoints:** (Base Path: `/leadStatus`) - *Methods inferred*
    *   `POST /`: Creates a new lead status definition.
    *   `GET /`: Retrieves the list of defined lead statuses.
    *   `PATCH /:id`: Updates a lead status definition.
    *   `DELETE /:id`: Deletes a lead status definition.
*   **2.8.3. Core Logic & Workflow:** Standard CRUD operations, likely interacting with a `LeadStatus` collection/model (inferred from route name).
*   **2.8.4. Data Interaction:** Interacts with the `LeadStatus` collection (inferred). The `Lead` model uses a `String` for status, suggesting these defined statuses are used as the valid values.
*   **2.8.5. Detailed Scenarios:**
    *   **a) Happy Paths:** Creating, listing, updating, deleting lead statuses. Leads being successfully updated to use one of these statuses.
    *   **b) Edge Cases:** Deleting a status currently in use by leads (should likely be prevented or handled gracefully).
    *   **c) Error Scenarios & Handling:** Status not found. Database errors. Validation errors (e.g., duplicate status name).
    *   **d) Security Considerations:** Access should likely be restricted to administrators.

### 2.9. Feature: Lead Logging & Comments

*   **2.9.1. Description:** Allows users to add comments or notes to specific leads and provides a log of activities or events related to leads (potentially automated logs from scraping or manual entries).
*   **2.9.2. Interaction Points / API Endpoints:**
    *   Base Path: `/leadComments` - *Methods inferred*
        *   `POST /`: Adds a comment to a lead. (Requires `leadId` in body).
        *   `GET /?leadId=:id`: Retrieves comments for a specific lead.
        *   `PATCH /:id`: Updates a comment.
        *   `DELETE /:id`: Deletes a comment.
    *   Base Path: `/leadlogs` - *Methods inferred*
        *   `GET /?leadId=:id`: Retrieves logs for a specific lead.
        *   (Internal logging likely happens automatically during scraping/processing).
*   **2.9.3. Core Logic & Workflow:** CRUD operations for comments. Logging likely involves creating new log entries in the corresponding controller/helper functions during relevant events (e.g., lead creation, status change, scraping error related to the lead).
*   **2.9.4. Data Interaction:** Interacts with `LeadComment` and `LeadLogs` collections (inferred models). Requires linking comments/logs to specific `Lead` documents.
*   **2.9.5. Detailed Scenarios:**
    *   **a) Happy Paths:** Adding/viewing/editing/deleting comments. Viewing activity logs for a lead. Automated logs being generated correctly.
    *   **b) Edge Cases:** Viewing comments/logs for a lead with none. Adding very long comments. High volume of automated logs.
    *   **c) Error Scenarios & Handling:** Lead not found when adding/viewing comments/logs. Database errors. Comment not found for update/delete.
    *   **d) Security Considerations:** Authorization needed to ensure users can only comment/view logs according to their permissions (e.g., only on assigned leads or based on role). Sanitization of comment input to prevent XSS if comments are displayed directly in the frontend.

### 2.10. Feature: Email Configuration & Sending

*   **2.10.1. Description:** Manages settings for sending emails (likely SMTP server details) and provides functionality to send emails (e.g., alerts about login issues, sending campaign data, potentially custom emails to leads).
*   **2.10.2. Interaction Points / API Endpoints:**
    *   Base Path: `/emailSettings` - *Methods inferred*
        *   `POST /` or `PATCH /`: Creates or updates email configuration (SMTP host, port, user, pass). Likely only one global setting stored.
        *   `GET /`: Retrieves current email configuration (should mask password).
    *   Base Path: `/customemail` - *Methods inferred*
        *   `POST /`: Sends a custom email. Request body likely includes recipient(s), subject, body.
*   **2.10.3. Core Logic & Workflow:**
    *   **Settings:** CRUD operations for `EmailSettings` model (inferred).
    *   **Sending:** Uses `nodemailer` library. Helpers like `sendMail` and `sendCustomMailToSavanta` (seen in `Campaign.controller.js`) encapsulate email sending logic, likely pulling configuration from `EmailSettings` or environment variables. Emails are sent for specific events like LinkedIn login failures (`searchLinkedInFn` calls `sendMail`) or manually triggered actions (`sendCampaignToSevanta`).
*   **2.10.4. Data Interaction:** Reads/Writes `EmailSettings` collection (inferred).
*   **2.10.5. Detailed Scenarios:**
    *   **a) Happy Paths:** Configuring email settings successfully. Sending test/custom emails successfully. Automated alert emails being sent correctly upon LinkedIn login failure.
    *   **b) Edge Cases:** Sending emails to multiple recipients. Handling email templates (if any).
    *   **c) Error Scenarios & Handling:** Invalid email configuration (wrong host, port, credentials). Nodemailer failing to connect or send (network issues, authentication failure, recipient address invalid, spam filters). Database errors for settings.
    *   **d) Security Considerations:** Email credentials stored in `EmailSettings` must be secured (encrypted at rest). Access to configure settings should be admin-only. Be cautious about what data is included in emails. Rate limiting on custom email sending might be needed to prevent abuse.

---