# Requirement and System Documentation: linkedin-scraper (LinkedIn Scraper)

**Version:** 1.2 (Refined Requirements)
**Date:** 2024-07-27

**Table of Contents:**

1.  **Application Overview - The Big Picture**
    - 1.1. Inferred Purpose & Domain
    - 1.2. High-Level Architecture & Code Structure
    - 1.3. Application Entry Points & Initialization
    - 1.4. Routing Mechanism
    - 1.5. Middleware Strategy
    - 1.6. Data Persistence & Models
    - 1.7. Key External Dependencies
    - 1.8. Configuration Management
    - 1.9. Overall Error Handling Strategy
    - 1.10. Testing Strategy (if applicable)
2.  **Detailed Feature Analysis - Module by Module**
    - 2.1. Feature: User Management & Authentication
    - 2.2. Feature: LinkedIn Account Management
    - 2.3. Feature: Proxy Management
    - 2.4. Feature: Campaign Management
    - 2.5. Feature: Automated LinkedIn Search (Scraping - Core Functionality)
    - 2.6. Feature: Automated LinkedIn Profile Scraping (Scraping - Core Functionality)
    - 2.7. Feature: Lead Management
    - 2.8. Feature: Lead Status Management
    - 2.9. Feature: Lead Logging & Comments
    - 2.10. Feature: Email Configuration & Sending
    - 2.11. Feature: Selenium WebDriver Management

---

## 1. Application Overview - The Big Picture

### 1.1. Inferred Purpose & Domain

- **Inferred Purpose:** The application is an automated **LinkedIn Lead Generation and Scraping Tool**. Its primary function is to allow users (likely internal sales or marketing teams) to define targeted search campaigns on LinkedIn, manage the necessary resources (LinkedIn accounts, proxies), execute these searches using browser automation (Selenium WebDriver), scrape profile data of identified leads, and store this lead information in a database (MongoDB) for management and potential export.
- **Domain:** Business-to-Business (B2B) Lead Generation, Sales Automation, Marketing Automation, Web Scraping.
- **Users:** Primarily internal users, likely categorized into 'Admin' and standard 'User' roles (implied by `rolesObj` constant and separate admin endpoints). The application manages data for 'CLIENT' user types, which appear to represent the scraped lead profiles themselves rather than application users.
- **Importance:** Understanding this core purpose is crucial for contextualizing all features. User roles dictate access to campaign management and potentially lead data. Campaigns define the scraping targets. Leads (`User` model with role 'CLIENT') are the primary output. LinkedIn accounts and proxies are consumable resources for the scraping engine. The Redis instance acts as a state manager (job lock) for the scraping process.

### 1.2. High-Level Architecture & Code Structure

- **Architecture:** Monolithic Node.js **Backend API** built with the **Express.js** framework. It exhibits a layered structure:
    - **Presentation/API Layer:** Express routing (`routes/`) defines RESTful endpoints. **Note:** This backend serves only the API; the user interface (UI) is expected to be a separate project consuming this API. Static file serving (`public/`) might exist for minimal assets or testing but is not intended for the primary application UI.
    - **Business Logic Layer:** Controller functions (`controllers/`) handle request processing, orchestrate data interactions, and initiate scraping tasks. Core scraping logic resides in controllers (`Campaign.controller.js`) and helpers (`SearchLinkedInFn.js`).
    - **Data Access Layer:** `mongoose` ODM is used for MongoDB interactions, with schemas defined in `models/`.
    - **Supporting Layers:** Helper functions (`helpers/`) provide utilities (auth, validation, error handling, config, scraping logic). Middleware (`middlewares/`, custom error handler in `helpers/`) handle cross-cutting concerns. `Builders/` contain aggregation pipelines.
- **Code Structure:**
    - `bin/www.js`: Application entry point; sets up and starts the HTTP server.
    - `app.js`: Main Express application configuration: middleware registration (`cors`, `express.json`, `express.urlencoded`, `cookieParser`, `express.static`), database (MongoDB) and cache (Redis) connections, route mounting, Selenium WebDriver initialization, cron job setup (`node-schedule`), and export of `app` and `driver` instances.
    - `routes/`: Contains `express.Router` instances defining API endpoints for each feature (e.g., `users.routes.js`, `Campaign.routes.js`).
    - `controllers/`: Houses the primary logic for handling requests, interacting with models, calling helpers, and managing Selenium tasks (e.g., `users.controller.js`, `Campaign.controller.js`).
    - `models/`: Defines Mongoose schemas for MongoDB collections (e.g., `user.model.js`, `Campaign.model.js`, `leads.model.js`, `LinkedInAccounts.model.js`, `Proxies.model.js`, `previousLeads.model.js`).
    - `helpers/`: Contains reusable utility functions: `Config.js` (env loading), `Constants.js` (status codes, roles), `ErrorHandler.js`, `seleniumErrorHandler.js` (error handling), `Jwt.js`, `Bcrypt.js` (auth), `Validators.js`, `SearchLinkedInFn.js` (core search scraping), `nodeMailer.js` (email), `utils.js` (general utilities like random delays).
    - `middlewares/`: Directory exists, likely containing authentication middleware (inferred from JWT usage).
    - `public/`: Serves static assets (minimal, UI is separate).
    - `Builders/`: Contains Mongoose aggregation pipeline definitions (e.g., `UserListWithCampaigns.js`).
    - `test/`: Directory for tests exists, but specific strategy is unclear.
    - `chromedriver` / `chromedriver.exe`: Platform-specific Selenium WebDriver executables (Linux/Windows).
- **Interaction Flow (API Request):** Request -> Express -> Global Middleware (`cors`, `json`, `urlencoded`, `cookieParser`) -> Router (`routes/`) -> Route-Specific Middleware (Auth inferred) -> Controller Function (`controllers/`) -> Model Interaction (`models/`) / Helper Call (`helpers/`) / Selenium Interaction (`driver`) -> Response Generation -> Error Handling Middleware (`ErrorHandler.js`) -> Response.
- **Interaction Flow (Cron Job - `cronFunc` in `app.js`):** `node-schedule` triggers -> Check `ENABLE_CRON` env -> Check Redis lock (`isFree`) -> Call `searchLinkedInFn` -> (If search completes and returns `true`) Call `linkedInProfileScrapping` -> Release Redis lock.
- **Asynchronous Patterns:** Predominantly `async/await` with Promises. Error handling uses `try...catch` blocks, often passing errors to Express's `next()` for the centralized handler.

### 1.3. Application Entry Points & Initialization

- **Primary Entry Point:** `node ./bin/www.js` (transpiled via `@babel/node`).
- **Initialization Sequence (`bin/www.js` & `app.js`):**
    1.  `bin/www.js`: Imports `app` from `app.js`.
    2.  `bin/www.js`: Gets port from `process.env.PORT` or defaults to `3000`.
    3.  `bin/www.js`: Creates HTTP server (`http.createServer(app)`).
    4.  `bin/www.js`: Listens on the determined port, logging success or error.
    5.  **`app.js` (during import/execution):**
        - Imports dependencies.
        - Creates Express `app` instance.
        - Sets up CORS (`app.use("*",cors())`).
        - Connects to MongoDB (`mongoose.connect(CONFIG.MONGOURI)`), logging success or error. **Note:** Mongoose handles connection pooling internally by default.
        - Creates Redis client (`redis.createClient()`), connects, logs status, and initializes `isFree` key to `"true"` upon connection.
        - Registers global middleware: `express.json`, `express.urlencoded`, `cookieParser`, `express.static`.
        - Mounts routers from `routes/` with base paths (e.g., `app.use("/users", usersRouter)`).
        - Defines catch-all `app.get("*", ...)` route (likely vestigial if UI is separate, or for minimal static content).
        - Registers the final `errorHandler` middleware.
        - Configures Selenium WebDriver `options` (no-sandbox, headless in prod, page load strategy, disable GPU, remote origins, window size).
        - Sets up Selenium `ServiceBuilder` using the platform-appropriate `chromedriver` path (determined relative to `process.cwd()`).
        - Initializes the shared Selenium `driver` instance as a Promise (`new Builder()...build()`).
        - Schedules `cronFunc` using `node-schedule` (`"0 0 * * *"` - midnight) conditional on `process.env.ENABLE_CRON`.
        - Exports `app` and `driver`.

### 1.4. Routing Mechanism

- **Library:** Standard Express Router (`express.Router()`).
- **Structure:** Modular routing files located in `routes/` directory, one for each primary resource/feature (e.g., `users.routes.js`, `Campaign.routes.js`, `Lead.routes.js`, etc.).
- **Mounting:** Routers are imported and mounted onto the main `app` instance in `app.js` using `app.use()` with specific path prefixes:
    ```javascript
    // Example from app.js
    app.use('/users', usersRouter)
    app.use('/campaign', campaignRouter)
    app.use('/lead', leadRouter)
    // ... and so on for other routers
    ```
- **Definition Example (`routes/users.routes.js`):** Defines HTTP methods and paths, mapping them to specific controller functions imported from `controllers/users.controller.js`.

    ```javascript
    import express from 'express'
    import { registerUser, login, updateUser, getUserById, deleteUser /* ... other handlers */ } from '../controllers/users.controller'
    let router = express.Router()

    router.post('/register', registerUser) // POST /users/register
    router.post('/login', login) // POST /users/login
    router.patch('/updateById/:id', updateUser) // PATCH /users/updateById/:id
    router.get('/getById/:id', getUserById) // GET /users/getById/:id
    router.delete('/deleteById/:id', deleteUser) // DELETE /users/deleteById/:id
    // ... other user-specific routes (e.g., /registerAdmin, /loginAdmin)

    export default router
    ```

- **Catch-all Route:** `app.get("*", ...)` in `app.js` serves `public/index.html`, supporting client-side routing for a potential SPA frontend.

### 1.5. Middleware Strategy

- **Global Middleware (registered in `app.js` before routes):**
    - `cors()`: Enabled for all origins (`app.use("*",cors())`).
    - `express.json({ limit: "100mb" })`: Parses JSON request bodies.
    - `express.urlencoded({ extended: false, limit: "100mb", parameterLimit: 10000000 })`: Parses URL-encoded request bodies.
    - `cookieParser()`: Parses cookies.
    - `express.static(path.join(__dirname, "public"))`: Serves static files.
    - `logger("dev")` (from `morgan`): Imported but commented out; likely used for HTTP request logging during development.
- **Route-Specific Middleware:** Although not explicitly shown being applied in the provided `routes/users.routes.js` snippet, the use of JWT (`jsonwebtoken`, `helpers/Jwt.js`) strongly implies the existence of authentication middleware (likely defined in `middlewares/Auth.js` or similar) applied selectively to routes requiring user authentication. This middleware would typically verify the `Authorization: Bearer <token>` header and attach the decoded user payload (`req.user`) to the request object for use in controllers. File upload middleware using `multer` is also inferred from dependencies, applied to specific routes handling file uploads (endpoints not identified in current analysis).
- **Error Handling Middleware (registered last in `app.js`):**
    - `errorHandler` (from `helpers/ErrorHandler.js`): Custom middleware that catches errors passed via `next(err)`. It logs the error and sends a JSON response with `err.status` (or 500) and `err.message`.

### 1.6. Data Persistence & Models

- **Primary Database:** MongoDB. Connected via `mongoose` in `app.js` using `CONFIG.MONGOURI`. Mongoose debug logging is commented out (`// mongoose.set("debug", true)`).
- **Caching/Locking:** Redis. Connected via `redis` client in `app.js`. Primarily used for a distributed lock (`isFree` key) to ensure only one instance of the core scraping cron job runs at a time.
- **ODM:** Mongoose used for all MongoDB interactions.
- **Key Models (`models/`):**
    - `User` (`user.model.js`): Represents _both_ application users (Admin/User roles) and scraped lead profiles (Client role). Fields: `name`, `email`, `phone`, `password` (hashed for app users), `role`, `isActive`, `searchCompleted` (flag for scraped profiles), `link` (LinkedIn profile URL for scraped profiles), `campaignId` (source campaign for scraped profiles), `currentPosition`, `location`, `contactInfoArr`, `educationArr`, `experienceArr` (scraped data fields), `rating`.
    - `Campaign` (`Campaign.model.js`): Defines a scraping job. Fields: `name`, `searchQuery`, `linkedInAccountId`, `password` (**Security Risk:** likely stores LI password directly), `proxyId`, `school`, `company`, `pastCompany` (filters), `status` (e.g., `CREATED`, `COMPLETED`), `isSearched` (boolean, search phase done?), `processing` (boolean, actively running?), `totalResults`, `resultsArr` (array of `Lead` ObjectIds), `timesRun`.
    - `Lead` (`leads.model.js`): Represents an intermediate link between a campaign and a scraped profile. Fields: `campaignId` (ref to `Campaign`), `clientId` (ref to `User` model representing the scraped profile), `leadAssignedToId` (ref to `User` model representing the app user assigned), `status`, `rating`, `isSearched`. _Seems somewhat redundant given scraped data is stored directly on the `User` (role: CLIENT) model._
    - `LinkedInAccounts` (`LinkedInAccounts.model.js`): Stores LinkedIn credentials. Fields: `name` (email/username), `password` (**Security Risk:** Stored as plain String).
    - `Proxies` (`Proxies.model.js`): Stores proxy server addresses. Field: `value` (String, format like `host:port` or `http://user:pass@host:port`).
    - `PreviousLeads` (`previousLeads.model.js`): Tracks already processed LinkedIn profile IDs to avoid duplicates during search. Field: `value` (profile ID string).
    - `LeadComment` (`LeadComment.model.js` - inferred): Stores comments linked to a `Lead`.
    - `LeadLogs` (`LeadLogs.model.js` - inferred): Logs events related to `Lead` processing.
    - `LeadStatus` (`LeadStatus.model.js` - inferred): Defines custom statuses applicable to `Lead` objects.
    - `EmailSettings` (`EmailSettings.model.js` - inferred): Stores Nodemailer SMTP configuration.
    - `UserLogs` (`userLogs.model.js` - inferred): Logs user actions or system events.
- **Data Interaction:** Mongoose methods (`.find`, `.findById`, `.findOne`, `.create`, `.findByIdAndUpdate`, `.findByIdAndRemove`, `.aggregate`, `.lean`) used within controllers and helpers. Aggregation pipelines defined in `Builders/`.

### 1.7. Key External Dependencies

- **Web Framework:** `express`
- **Database/Cache:** `mongoose`, `redis`
- **Web Automation:** `selenium-webdriver`, `chromedriver`, `chromium` (implicitly required by chromedriver)
- **Authentication:** `jsonwebtoken`, `bcryptjs`
- **Networking/API:** `cors`, `cookie-parser`
- **Utilities:** `dotenv`, `morgan` (inactive), `nanoid`, `path` (built-in)
- **File Handling:** `multer`, `exceljs`, `fs` (built-in)
- **Scheduling:** `node-schedule` (actively used), `node-cron` (listed but unused)
- **Email:** `nodemailer`
- **QR Codes:** `qrcode`, `qr-image` (purpose unclear from analyzed code)
- **Error Handling:** `http-errors` (listed but custom `ErrorHandler.js` used)
- **Development:** `nodemon`, `@babel/core`, `@babel/node`, `@babel/cli`, `@babel/preset-env`, `eslint`, `prettier`
- **External Service Interactions:** **LinkedIn.com** (via Selenium), Email Provider (via Nodemailer), Redis Server, MongoDB Server.

### 1.8. Configuration Management

- **Method:** Environment variables managed via `.env` files, loaded using `dotenv`. Configuration values accessed via `process.env` or centralized in `helpers/Config.js` (which likely loads `dotenv`).
- **Files:** `.env` (defaults/development), `.env.prod` (inferred for production).
- **Key Configurable Parameters:**
    - `PORT`: Server port (default 3000).
    - `MONGOURI`: MongoDB connection string.
    - `ACCESS_TOKEN_SECRET`: Secret for JWT signing (used in `helpers/Jwt.js`).
    - `ENABLE_CRON`: Controls whether the scheduled scraping job runs (`"true"` or `"false"`). Checked in `app.js` schedule setup.
    - `NODE_ENV`: Environment name ('development', 'prod', etc.). Used in `app.js` to conditionally set Selenium headless mode.
    - `TZ`: Timezone for cron job logging (e.g., `Asia/Kolkata`).
    - Redis connection details (likely defaults assumed by `redis` client or possibly env vars).
    - Nodemailer SMTP config (host, port, auth - likely stored in `EmailSettings` model or `.env`).

### 1.9. Overall Error Handling Strategy

- **Approach:** Mixed strategy combining local `try...catch` with a central Express error handler.
- **Local Handling:**
    - Controllers and helpers wrap potentially failing operations (DB calls, Selenium actions, etc.) in `try...catch`.
    - Generic/unexpected errors are passed to `next(error)`.
    - Specific, expected errors (e.g., invalid login, resource not found) sometimes result in direct `res.json(...)` responses with appropriate status codes (e.g., 401, 404) or custom error objects being thrown (`throw { status: 400, message: "..." }`) which are then caught by the central handler.
- **Centralized Handler (`helpers/ErrorHandler.js`):**
    - Registered as the last middleware in `app.js`.
    - Catches errors passed via `next()`.
    - Logs the error stack (`console.error(err)`).
    - Sends a JSON response: `res.status(err.status || 500).json({ message: err.message })`.
- **Selenium Errors (`helpers/seleniumErrorHandler.js`):**
    - A dedicated function (likely just logging or performing no-op currently based on limited view) called within `catch` blocks specifically for Selenium operations in `SearchLinkedInFn.js` and `Campaign.controller.js`. This allows potentially specialized logging or recovery logic for browser automation failures, though its current implementation details are minimal.

### 1.10. Testing Strategy (if applicable)

- **Evidence:** A `test/` directory exists. Development dependencies (`@babel/preset-env`) support testing.
- **Inference:** Unit or integration tests are likely intended. However, no test execution scripts are visible in `package.json`, and test file contents were not analyzed.
- **Challenges:** Given the heavy reliance on external systems (live LinkedIn site via Selenium, MongoDB, Redis), reliable and comprehensive automated testing (especially integration and end-to-end) would be complex to implement and maintain. Mocking these dependencies would be essential for effective unit tests. The actual testing strategy remains unclear.

---

## 2. Detailed Feature Analysis - Module by Module

_(Updates based on deeper code reading)_

### 2.1. Feature: User Management & Authentication

- **2.1.1. Description:** Manages application users (Admin/User roles) including registration, login (JWT-based), profile updates, retrieval, and deletion. Also handles the creation and storage of scraped LinkedIn profiles as 'Client' role users.
- **2.1.2. Interaction Points / API Endpoints:** (Base Path: `/users`)
    - `POST /register`: Creates standard user (role: `USER`).
        - Request Body: `{ "name": "...", "email": "...", "phone": "...", "password": "..." }`
        - Response (Success 200): `{ "message": "User Created", "success": true }`
        - Response (Error 500): via `errorHandler` if email/phone exists or validation fails.
    - `POST /login`: Authenticates standard user.
        - Request Body: `{ "email": "...", "password": "..." }`
        - Response (Success 200): `{ "message": "LogIn Successfull", "token": "JWT_ACCESS_TOKEN", "success": true }`
        - Response (Error 401): `{ "message": "user Not Found" }` or `{ "message": "Invalid Password" }` (Direct response).
        - Response (Error 500): via `errorHandler` if user is inactive (`{ "message": "You are marked as inactive..." }`).
    - `GET /getUsers`: Retrieves users, filterable by query `?role=...`.
        - Response (Success 200): `{ "message": "Users", "data": [UserObject...], "success": true }`
    - `GET /getById/:id`: Retrieves user by ObjectId.
        - Response (Success 201 - _Incorrect status_): `{ "message": "found User", "data": UserObject, "success": true }`
        - Response (Error 500): via `errorHandler` if not found (`{ "message": "User Not found" }`).
    - `PATCH /updateById/:id`: Updates user details (name, email, phone, password).
        - Request Body: `{ "name": "...", "email": "...", "phone": "...", "password": "..." }` (Password optional, hashed if provided).
        - Response (Success 201 - _Incorrect status_): `{ "message": "Updated Successfully", "success": true }`
        - Response (Error 500): via `errorHandler` if not found (`{ "message": "User Not found" }`).
    - `DELETE /deleteById/:id`: Deletes user by ObjectId.
        - Response (Success 200): `{ "message": "user deleted successfully", "success": true }`
        - Response (Error 400): `{ "message": "user not found or deleted already" }` (Direct response).
    - `POST /registerAdmin`: Creates admin user (role: `ADMIN`). Logic mirrors `/register`.
        - Response (Success 200): `{ "message": "admin Created", "success": true }`
    - `POST /loginAdmin`: Authenticates admin user. Logic mirrors `/login`, checks for `ADMIN` role.
        - Response (Success 200): `{ "message": "LogIn Successfull", "token": "JWT_ACCESS_TOKEN", "success": true }`
        - Response (Error 401): `User Not Found` or `Invalid Password`.
    - `GET /getUserDetailsWithCampaignsData/:id`: Retrieves user details aggregated with campaign data using `UserListWithCampaigns` builder.
        - Response (Success 200): `{ "message": "user deleted successfully" /* Incorrect message */, "data": AggregatedUserObject, "success": true }`
    - `GET /setUserRating`: _Internal Endpoint_. Calculates and updates ratings for all 'CLIENT' users based on scraped data (`CalculateRating` helper).
        - Response (Success 200): `{ "message": "as" /* Uninformative */, "success": true }`
- **2.1.3. Core Logic & Workflow:**
    - **Registration:** `users.controller.js -> registerUser / registerAdmin`: Checks `email` and `phone` existence using `User.findOne`. Validates email (`helpers/Validators.js -> ValidateEmail`). Hashes password (`helpers/Bcrypt.js -> hashPassword`). Creates new `User` document (`User.save()`).
    - **Login:** `users.controller.js -> login / loginAdmin`: Finds user by `email` (`User.findOne`). Compares password hash (`helpers/Bcrypt.js -> comparePassword`). Checks `isActive` status. Checks role for admin login. Generates JWT (`helpers/Jwt.js -> generateAccessJwt`) containing `_id`, `name`, `email`, `role`, `isActive`.
    - **Update:** `users.controller.js -> updateUser`: Finds by ID (`User.findById`). Hashes new password if provided. Updates using `User.findByIdAndUpdate()`.
    - **Rating Calculation:** `users.controller.js -> setUserRating`: Fetches all 'CLIENT' users. Iterates and calls `CalculateRating(user)` (helper logic not shown, presumably complex analysis of `user.experienceArr`, `user.educationArr`, etc.). Updates `user.rating` and potentially related `Lead` ratings.
- **2.1.4. Data Interaction:** `User` model (CRUD). `Lead` model (read/update during rating calculation). `Builders/UserListWithCampaigns.js` (aggregation).
- **2.1.5. Detailed Scenarios:**
    - **a) Happy Paths:** As previously described. JWT contains expected payload upon successful login.
    - **b) Edge Cases:** Updating user with same password. Admin logging into standard user login endpoint (would fail role check if implemented correctly, but might succeed if only email/pass checked). Triggering rating calculation when no 'CLIENT' users exist.
    - **c) Error Scenarios & Handling:**
        - Registration: Email/Phone exists -> `next(error)` -> 500 response with `ErrorMessages.EMAIL_EXISTS` / `PHONE_EXISTS`. Invalid Email -> `next(error)` -> 500 with `ErrorMessages.INVALID_EMAIL`. DB Error -> `next(error)` -> 500.
        - Login: User not found -> 401 `{ message: "user Not Found" }`. Invalid Password -> 401 `{ message: "Invalid Password" }`. Inactive User -> `next({ status: 500, message: "You are marked as inactive..." })` -> 500. Admin role mismatch -> 401 (if checked correctly). DB Error -> `next(error)` -> 500.
        - Get/Update/Delete by ID: User not found -> `next({ status: 500, message: "User Not found" })` for Get/Update; 400 `{ message: "user not found or deleted already" }` for Delete. DB Error -> `next(error)` -> 500.
    - **d) Security Considerations:**
        - Passwords hashed using `bcryptjs`.
        - JWT used for session management; requires proper verification via middleware on protected routes (middleware implementation not directly confirmed).
        - Email validation uses regex (`/\\S+@\\S+\\.\\S+/`) - reasonably standard but less robust than dedicated libraries. Phone validation is not explicitly shown.
        - No obvious input sanitization against NoSQL injection beyond what Mongoose might provide by default.
        - Rate limiting is not apparent on login/register endpoints.
        - Admin endpoints (`/registerAdmin`, `/loginAdmin`) rely on obscurity; ideally, they should be protected by separate authorization middleware checking the caller's role.

### 2.2. Feature: LinkedIn Account Management

- **2.2.1. Description:** Manages LinkedIn account credentials (`email`, `password`) used for Selenium scraping.
- **2.2.2. Interaction Points / API Endpoints:** (Base Path: `/linkedInAccount`) - Confirmed via `routes/LinkedInAccounts.routes.js` and `controllers/LinkedInAccounts.controller.js` (assuming standard CRUD naming)
    - `POST /addAccount`: Creates a new LinkedIn account entry.
        - Request Body: `{ "name": "...", "password": "..." }`
        - Response (Success 201): `{ message: '...', data: newAccount }`
    - `GET /getAccount`: Retrieves all stored LinkedIn accounts.
        - Response (Success 200): `{ message: '...', data: [account...] }`
    - `GET /getById/:id`: Retrieves a specific account.
        - Response (Success 200): `{ message: '...', data: account }`
    - `PATCH /updateById/:id`: Updates an account.
        - Request Body: `{ "name": "...", "password": "..." }` (Optional fields)
        - Response (Success 201 - _Incorrect status_): `{ message: 'Updated Successfully' }`
    - `DELETE /deleteById/:id`: Deletes an account.
        - Response (Success 200): `{ message: 'user deleted successfully' }` (Likely copy-paste message error)
- **2.2.3. Core Logic & Workflow:** Standard CRUD operations implemented in `controllers/LinkedInAccounts.controller.js` using Mongoose methods (`.create`, `.find`, `.findById`, `.findByIdAndUpdate`, `.findByIdAndRemove`) on the `LinkedInAccounts` model.
- **2.2.4. Data Interaction:** `LinkedInAccounts` model (CRUD).
- **2.2.5. Detailed Scenarios:**
    - **c) Error Scenarios & Handling:** Standard Mongoose errors (validation, not found) are passed to `next(error)` -> `errorHandler` (500 response). `deleteById` returns 400 directly if account not found.
    - **d) Security Considerations:** **Critical:** The `password` field in `models/LinkedInAccounts.model.js` is defined as `type: String, required: true`. There is **no indication of hashing or encryption**. Passwords are stored in **plain text**, which is a major security vulnerability. Access to these endpoints must be strictly controlled (Admin only).

### 2.3. Feature: Proxy Management

- **2.3.1. Description:** Manages proxy server addresses (`host:port` or `http://user:pass@host:port`) used by Selenium.
- **2.3.2. Interaction Points / API Endpoints:** (Base Path: `/proxies`) - Confirmed via `routes/Proxies.routes.js` and controller logic (assuming standard CRUD naming).
    - `POST /addProxies`: Adds a new proxy.
        - Request Body: `{ "value": "..." }`
    - `GET /getProxies`: Retrieves all proxies.
    - `GET /getById/:id`: Retrieves a specific proxy.
    - `PATCH /updateById/:id`: Updates a proxy.
    - `DELETE /deleteById/:id`: Deletes a proxy.
- **2.3.3. Core Logic & Workflow:** Standard Mongoose CRUD operations in the corresponding controller on the `Proxies` model.
- **2.3.4. Data Interaction:** `Proxies` model (CRUD). Proxy `value` is retrieved by ID in `controllers/Campaign.controller.js -> linkedInLogin` and used to configure Selenium options (`options.setProxy(...)`).
- **2.3.5. Detailed Scenarios:**
    - **c) Error Scenarios & Handling:** Standard Mongoose errors passed to `next(error)` -> `errorHandler`. Delete returns 400 if not found. Selenium might fail to use an invalid/unreachable proxy (handled by Selenium error handling).
    - **d) Security Considerations:** If proxies use authentication (`user:pass`), these credentials are stored plain text within the `value` string. Access control (Admin only) is necessary.

### 2.4. Feature: Campaign Management

- **2.4.1. Description:** Defines, manages, and tracks LinkedIn scraping campaigns. Specifies search criteria, resources (LI account, proxy), and stores results.
- **2.4.2. Interaction Points / API Endpoints:** (Base Path: `/campaign`) - Verified via `routes/Campaign.routes.js` and `controllers/Campaign.controller.js`.
    - `POST /addCampaign`: Creates a new campaign.
        - Request Body: `{ "name", "searchQuery", "linkedInAccountId", "password" /* Redundant/Risk */, "proxyId", "school", "company", "pastCompany" }`
    - `GET /getCampaigns`: Retrieves campaigns (potentially filterable).
    - `GET /getById/:id`: Retrieves a specific campaign.
    - `PATCH /updateById/:id`: Updates a campaign.
    - `DELETE /deleteById/:id`: Deletes a campaign.
    - `POST /addCampaignToQueue`: Sets campaign status to `CREATED` to re-queue it.
    - `POST /addScheduledCampaign`: Schedules a campaign (uses `helpers/ScheduledCampaigns.js` - logic not fully analyzed).
    - `GET /getPastCampaign`: Retrieves completed/historical campaigns.
    - `GET /getPastCampaignById/:id`: Retrieves details of a specific past campaign.
    - `POST /sendCampaignToSevanta`: Sends campaign data via email using `sendCustomMailToSavanta` helper.
    - `POST /linkedInLogin`, `GET /checkLinkedInLogin`, `POST /getLinkedInCaptcha`, `POST /sendLinkedInCaptchaInput`, `POST /verifyOtp`, `POST /resendPhoneCheck`: Endpoints related to manually handling the Selenium LinkedIn login process (CAPTCHA/OTP). (See 2.5)
    - `POST /searchLinkedin`: Manually triggers the search process (`searchLinkedInFn`).
    - `POST /linkedInProfileScrappingReq`: Manually triggers the profile scraping process (`linkedInProfileScrapping`).
- **2.4.3. Core Logic & Workflow:**
    - **CRUD:** Standard Mongoose operations in `controllers/Campaign.controller.js`. New campaigns default to `status: CREATED`, `isSearched: false`, `processing: false`.
    - **Execution:** Campaigns matching criteria (`status: CREATED`, `isSearched: false`, `processing: false`) are selected by `helpers/SearchLinkedInFn.js` (called by cron or manual trigger). The `processing` flag acts as a per-campaign lock during execution. `isSearched` is set `true` after search phase. `status` likely updated upon completion/failure.
    - **Manual Login:** Endpoints allow interactive handling of CAPTCHA/OTP during Selenium login initiated via `POST /linkedInLogin`.
- **2.4.4. Data Interaction:** `Campaign` model (CRUD). Reads `LinkedInAccounts`, `Proxies` based on IDs. Updates `Campaign` status, flags, `totalResults`, `resultsArr`. `resultsArr` stores `Lead` ObjectIds.
- **2.4.5. Detailed Scenarios:**
    - **c) Error Scenarios & Handling:** Invalid `linkedInAccountId`/`proxyId` leads to failure during login/proxy setup. Missing `searchQuery` likely causes validation error. DB errors -> `next(error)`. Selenium errors during associated scraping handled by `seleniumErrorHandler` (may update campaign status or log). Email sending errors in `sendCampaignToSevanta`. Errors during manual login handling (e.g., incorrect CAPTCHA/OTP input).
    - **d) Security Considerations:** **Critical:** `password` field in `Campaign` model likely stores LinkedIn password in plain text if used. Redundant and insecure if `linkedInAccountId` is already linked. Input validation for `searchQuery` and filter fields is important. Access control needed for campaign management and trigger endpoints.

### 2.5. Feature: Automated LinkedIn Search (Scraping - Core Functionality)

- **2.5.1. Description:** Core automated process (usually via cron) that logs into LinkedIn using campaign credentials/proxy, performs searches with filters, paginates results, extracts profile URLs, checks for duplicates, and creates initial `Lead` entries.
- **2.5.2. Interaction Points / API Endpoints:**
    - Internal Trigger: `cronFunc` (in `app.js`) calls `helpers/SearchLinkedInFn.js`.
    - Manual Triggers:
        - `POST /campaign/searchLinkedin`: Calls `helpers/SearchLinkedInFn.js`.
        - `POST /campaign/linkedInLogin`: Initiates Selenium login attempt. Needs request body: `{ "name": "li_email", "password": "base64_encoded_li_password", "proxyId": "proxy_object_id" }`. Returns status (success, captcha, otp).
        - `GET /campaign/checkLinkedInLogin`: Checks login status via `checkLinkedInLoginFunc`.
        - `POST /campaign/getLinkedInCaptcha`: Returns CAPTCHA image URL if detected by `linkedInLogin`.
        - `POST /campaign/sendLinkedInCaptchaInput`: Submits user's CAPTCHA answer (image number). Request Body: `{ "imageNumber": number }`.
        - `POST /campaign/verifyOtp`: Submits user's OTP. Request Body: `{ "otp": "..." }`.
        - `POST /campaign/resendPhoneCheck`: Related to phone verification steps.
- **2.5.3. Core Logic & Workflow (`helpers/SearchLinkedInFn.js`):**
    1.  Acquire Redis lock (`redisClientParam.set("isFree", "false")`).
    2.  Check login status (`checkLinkedInLoginFunc`). If not logged in, attempt email alert (`sendMail`) and return `false` (stops process).
    3.  Fetch pending campaigns (`Campaign.find({ status: CREATED, isSearched: false, processing: false })`). If none, return `true` (search phase done).
    4.  Loop through campaigns (`for (let i = 0; i < campaignArr.length; i++)`):
        - (Implicitly locked campaign via memory - **potential issue in clustered env**). Navigate to LinkedIn search.
        - Input `campaignObj.searchQuery` into search bar (`//input[@placeholder="Search"]`).
        - Click 'People' filter button (`//button[text()='People']`).
        - Click 'All filters' button (`// div[@class="relative mr2"]//button[text() = "All filters"]`).
        - Apply filters (Current Company, Past Company, School) if present in `campaignObj` using complex XPath selectors to find filter inputs, type text, press Arrow Down, press Enter. Filters are applied iteratively for comma-separated values.
        - Click 'Show results' (`//button[@data-test-reusables-filters-modal-show-results-button="true"]`).
        - Scroll down (`window.scrollTo(0, 4500)`).
        - Extract total results text (`//div[@class="search-results-container"]/div/h2/div`) and update `campaign.totalResults`.
        - Pagination Loop (`while (nextbuttonText)`):
            - Check if 'Next' button (`//button[@aria-label="Next"]`) is enabled.
            - Scroll down (`window.scrollTo(0, 4500)`).
            - Wait/Sleep (`randomIntFromInterval(1000, 2000)`).
            - Extract profile links (`href` from `//ul[contains(@class, "list-style-none")]/li//a[contains(@href, "/in/")]`).
            - For each link:
                - Extract profile ID (e.g., `john-doe-123`) from URL.
                - Check `PreviousLeads.findOne({ value: profileId })`.
                - If not found:
                    - Create `Lead` entry (`Lead.create({ campaignId: campaignObj._id, clientId: profileId, status: CREATED })`). **Note:** `clientId` here stores the LinkedIn profile ID/slug, _not_ a `User` ObjectId directly.
                    - Add Lead's `_id` to `campaignObj.resultsArr`.
                    - Create `PreviousLeads` entry (`PreviousLeads.create({ value: profileId })`).
            - Click 'Next' button.
        - Update campaign: `Campaign.findByIdAndUpdate(campaignObj._id, { isSearched: true, processing: false, resultsArr: campaignObj.resultsArr })`.
        - `catch` block for campaign loop calls `seleniumErrorHandler()` and continues.
    5.  Release Redis lock (`redisClientParam.set("isFree", "true")`). Return `false` (indicates search ran, profile scraping might be next).
- **LinkedIn Login Logic (`controllers/Campaign.controller.js -> linkedInLogin`):**
    1.  Retrieves Proxy (`Proxies.findById`). Sets Selenium options (headless, proxy via `options.setProxy(proxyObj.value)`).
    2.  Navigates to login page. Enters username (`req.body.name`) and Base64 decoded password (`Buffer.from(req.body.password, 'base64').toString()`). Clicks submit.
    3.  Waits and checks URL/source for:
        - Success: `url.includes("feed")` -> returns `{ message: "Login Success", success: true }`.
        - CAPTCHA: `url.includes("checkpoint")` and finds `// div[@id="game_challengeItem"]//img` -> extracts image `src`, returns `{ message: "Captcha required", captcha: true, imgUrl: ... }`.
        - OTP: `url.includes("checkpoint")` and finds `//form[@id="email-pin-challenge"]` -> extracts message, returns `{ message: "OTP required", otpRequired: true, otpMessage: ... }`.
        - Invalid Password: `url.includes("login-challenge-submit")` and finds error message (`//div[@id="error-for-password"]`) -> returns `{ error: ... }`.
- **2.5.4. Data Interaction:** Reads `Campaign`, `LinkedInAccounts`, `Proxies`. Reads/Writes `PreviousLeads`. Creates `Lead`. Updates `Campaign`. Uses Redis `isFree`.
- **2.5.5. Detailed Scenarios:**
    - **c) Error Scenarios & Handling:**
        - Login Failure: Handled by `linkedInLogin` returning specific states (captcha, otp, error message) or throwing -> `next(error)`. Base64 password decoding failure is possible.
        - Selenium Errors (ElementNotFound, Timeout): Handled by `try...catch` -> `seleniumErrorHandler()` within loops. May skip profiles or fail a campaign section. The handler itself seems basic.
        - DB Errors: Passed to `next(error)`.
        - Duplicate Handling: Relies on `PreviousLeads` collection check.
        - Rate Limiting/Blocking: Mitigated by random sleeps (`driver.sleep(randomIntFromInterval(...))`) between actions. May result in CAPTCHA/OTP or account blocks.
        - Redis Errors: Can prevent job from starting or releasing lock.
    - **d) Security Considerations:** Base64 for password in `/linkedInLogin` is trivial to reverse, effectively plain text over API. Potential for abuse if manual trigger endpoints (`/searchLinkedin`) are not secured. Robustness depends heavily on fragile XPath selectors; LinkedIn UI changes will break scraping.

### 2.6. Feature: Automated LinkedIn Profile Scraping (Scraping - Core Functionality)

- **2.6.1. Description:** Automated process (follows search, usually via cron) that visits LinkedIn profiles identified in the search phase (`Lead` documents) and scrapes detailed information (position, location, contact, education, experience) directly into corresponding `User` documents (where `role` is 'CLIENT').
- **2.6.2. Interaction Points / API Endpoints:**
    - Internal Trigger: `cronFunc` (in `app.js`) calls `controllers/Campaign.controller.js -> linkedInProfileScrapping`.
    - Manual Trigger: `POST /campaign/linkedInProfileScrappingReq`: Calls `linkedInProfileScrapping`.
- **2.6.3. Core Logic & Workflow (`controllers/Campaign.controller.js -> linkedInProfileScrapping`):**
    1.  Acquire Redis lock (`redisClientParam.set("isFree", "false")`).
    2.  Check login status (`checkLinkedInLoginFunc`). If not logged in, send email alert, release lock, return `false`.
    3.  Fetch users needing scraping: `User.find({ role: rolesObj?.CLIENT, searchCompleted: false }).limit(50).lean()`. If none, return `true` (profile scraping done).
    4.  Loop through fetched users (`for (let j = 0; j < userArr.length; j++)`):
        - Get target profile URL from `userArr[j].link`.
        - Navigate Selenium driver (`driver.get(userArr[j].link)`).
        - Wait/Sleep (`randomIntFromInterval(1000, 15000)`), random scroll.
        - **Extract Data using specific XPaths & store in `userArr[j]` object:**
            - Current Position: `//div[@class="text-body-medium break-words"]` -> `userArr[j].currentPosition`.
            - Location: `//span[@class="text-body-small inline t-black--light break-words"]` -> `userArr[j].location`.
            - Contact Info: Navigate to `profileUrl/overlay/contact-info/`. Find sections (`//div[@class='pv-profile-section__section-info section-info']/section`). Loop through sections, extract heading (`//h3[contains(@class, 'pv-contact-info__header')]`) and data (links `//a` or list items `//ul/li/span`). Store as array `[{ heading: "...", dataArr: ["..."] }]` in `userArr[j].contactInfoArr`.
            - Education: Navigate to `profileUrl/details/education/`. Find list items (`//div[@class="scaffold-finite-scroll__content"]/ul/li`). Loop, extract school name, details, year using specific XPaths. Store as array `[{ schoolName: "...", schoolDetail: "...", year: "..." }]` in `userArr[j].educationArr`.
            - Experience: Navigate to `profileUrl/details/experience/`. Similar loop structure for list items, extracting company, title, duration, location, description. Store as array in `userArr[j].experienceArr`.
        - **Update Database:** `User.findByIdAndUpdate(userArr[j]._id, { ...scrapedData, searchCompleted: true })`.
        - `catch` block for user loop calls `seleniumErrorHandler()` and continues.
    5.  Release Redis lock (`redisClientParam.set("isFree", "true")`). Return `false` (indicates scraping ran).
- **2.6.4. Data Interaction:** Reads `User` (role CLIENT, `searchCompleted: false`). Reads `Campaign` (briefly, unused?). Updates `User` with scraped details and sets `searchCompleted: true`. Uses Selenium `driver`. Uses Redis `isFree`.
- **2.6.5. Detailed Scenarios:**
    - **a) Happy Paths:** Fetches 'CLIENT' users needing scraping, navigates profiles, extracts data via XPaths, updates `User` record successfully.
    - **b) Edge Cases:** Profile variations (Premium, different languages), missing sections (handled by local `try...catch` around extractions), private profiles, connection required for contact info.
    - **c) Error Scenarios & Handling:**
        - Selenium Errors (ElementNotFound, Timeout): Caught by local `try...catch` -> `seleniumErrorHandler()`. Profile likely skipped or partially scraped.
        - Data Extraction Errors: Incorrect data format due to UI changes.
        - DB Errors: Failing to update `User` -> `next(error)`.
        - Rate Limiting/Blocking: High risk due to multiple page loads per profile (main, contact, edu, exp). Random delays used for mitigation.
    - **d) Security Considerations:** Data privacy implications of storing detailed scraped personal data in the `User` collection. Compliance with LinkedIn ToS and data regulations (GDPR/CCPA). Robustness depends entirely on fragile XPath selectors.

### 2.7. Feature: Lead Management

- **2.7.1. Description:** Manages the `Lead` documents, which act as links between a `Campaign` and a scraped `User` profile ('CLIENT' role), and track assignment to application users.
- **2.7.2. Interaction Points / API Endpoints:** (Base Path: `/lead`) - Verified via `routes/Lead.routes.js` and controller.
    - `GET /getLeads`: Retrieves leads, supports pagination (`limit`, `skip`), filtering (`campaignId`, `status`, `leadAssignedToId`), and sorting (`sort`). Populates related `campaignId`, `clientId`, `leadAssignedToId` data.
    - `GET /getById/:id`: Retrieves a specific lead by ID, populating related data.
    - `PATCH /updateById/:id`: Updates lead fields (e.g., `status`, `rating`, `leadAssignedToId`).
    - `DELETE /deleteById/:id`: Deletes a lead.
    - `POST /exportLeadsToExcel`: Exports leads matching filters to an Excel file using `exceljs`.
- **2.7.3. Core Logic & Workflow:** CRUD operations in `controllers/Lead.controller.js`. `getLeads` uses complex query building based on `req.query`. `exportLeadsToExcel` fetches filtered leads and uses `exceljs` to create and send a downloadable file.
- **2.7.4. Data Interaction:** `Lead` model (CRUD). Reads `User` and `Campaign` via Mongoose `populate()` during retrieval.
- **2.7.5. Detailed Scenarios:**
    - **c) Error Scenarios & Handling:** Mongoose errors -> `next(error)`. `deleteById` returns 400 if not found. Errors during Excel generation (`exportLeadsToExcel`) -> `next(error)`.
    - **d) Security Considerations:** Authorization needed based on roles or lead assignment (not explicitly shown how access is restricted in controller). Filtering logic relies on `req.query`, ensure no injection vulnerabilities if query parameters are used insecurely in DB queries (Mongoose helps mitigate this).

### 2.8. Feature: Lead Status Management

- **2.8.1. Description:** Manages the definitions of custom statuses assignable to `Lead` objects.
- **2.8.2. Interaction Points / API Endpoints:** (Base Path: `/leadStatus`) - Verified via `routes/LeadStatus.routes.js`. Standard CRUD endpoints assumed (`addLeadStatus`, `getLeadStatus`, `getById`, `updateById`, `deleteById`).
- **2.8.3. Core Logic & Workflow:** Standard Mongoose CRUD in the corresponding controller on the `LeadStatus` model.
- **2.8.4. Data Interaction:** `LeadStatus` model (CRUD).
- **2.8.5. Detailed Scenarios:**
    - **c) Error Scenarios & Handling:** Standard Mongoose errors -> `next(error)`. Delete likely prevents deletion if status is in use (needs verification).
    - **d) Security Considerations:** Admin-only access required.

### 2.9. Feature: Lead Logging & Comments

- **2.9.1. Description:** Manages comments and activity logs associated with `Lead` documents.
- **2.9.2. Interaction Points / API Endpoints:**
    - Base Path: `/leadComments` - Verified via `routes/LeadComment.routes.js`. Standard CRUD (`addLeadComment`, `getLeadComment` (filtered by `leadId`), `updateById`, `deleteById`).
    - Base Path: `/leadlogs` - Verified via `routes/LeadLogs.routes.js`. Likely `getLeadLogs` (filtered by `leadId`). Automatic logging assumed during scraping/status changes.
- **2.9.3. Core Logic & Workflow:** Standard CRUD for comments in `LeadComment.controller.js`. Logging likely involves `LeadLogs.create()` calls within other controllers/helpers at relevant points (e.g., scraping errors, status updates).
- **2.9.4. Data Interaction:** `LeadComment` model (CRUD). `LeadLogs` model (Create, Read). Links to `Lead` model via `leadId`.
- **2.9.5. Detailed Scenarios:**
    - **c) Error Scenarios & Handling:** Standard Mongoose errors -> `next(error)`. Not found errors for GET/PATCH/DELETE.
    - **d) Security Considerations:** Authorization for comments/logs. Input sanitization for comments if displayed in HTML.

### 2.10. Feature: Email Configuration & Sending

- **2.10.1. Description:** Manages SMTP settings and sends emails for alerts and specific actions.
- **2.10.2. Interaction Points / API Endpoints:**
    - Base Path: `/emailSettings` - Verified via `routes/EmailSettings.routes.js`. Likely `addEmailSettings`, `getEmailSettings`, `updateById`.
    - Base Path: `/customemail` - Verified via `routes/customemail.router.js`. `POST /sendCustomMail` endpoint.
- **2.10.3. Core Logic & Workflow:**
    - **Settings:** CRUD for `EmailSettings` model in its controller.
    - **Sending:** `controllers/customemail.controller.js -> sendCustomMail` handles the API endpoint. Uses `helpers/nodeMailer.js -> sendMail` which configures `nodemailer` transport (likely using `EmailSettings` data or env vars) and sends email. `sendMail` is also called internally (e.g., from `searchLinkedInFn` on login failure). `sendCustomMailToSavanta` (in `Campaign.controller.js`) is another specific email helper.
- **2.10.4. Data Interaction:** `EmailSettings` model (CRUD).
- **2.10.5. Detailed Scenarios:**
    - **c) Error Scenarios & Handling:** Nodemailer errors (connection, auth, invalid recipient) caught and passed via `next(error)`. DB errors for settings -> `next(error)`.
    - **d) Security Considerations:** SMTP credentials in `EmailSettings` must be secured. Admin-only access for settings. Rate limiting on `/sendCustomMail` endpoint recommended.

### 2.11. Feature: Selenium WebDriver Management

- **2.11.1. Description:** Handles the lifecycle and configuration of the shared Selenium WebDriver instance used for all browser automation tasks. Detects and uses the appropriate platform-specific `chromedriver` executable.
- **2.11.2. Interaction Points / API Endpoints:**
    - Internal: WebDriver instance (`driver`) initialized in `app.js` and exported for use in controllers/helpers.
    - Manual Control: `POST /campaign/forceCloseDriver`: Endpoint to attempt quitting the shared driver instance.
- **2.11.3. Core Logic & Workflow:**
    - **Initialization (`app.js`):** Configures Chrome options (headless, proxy support, etc.), identifies the platform-specific `chromedriver` path (`path.join(process.cwd(), "chromedriver")` - implicitly handles `.exe` on Windows if present), sets up the service builder, and creates a single shared `driver` promise resolved with the WebDriver instance.
    - **Usage:** The resolved `driver` instance is imported and used throughout `controllers/Campaign.controller.js` and `helpers/SearchLinkedInFn.js` for navigation, element interaction, and data extraction.
    - **Termination (`controllers/Campaign.controller.js -> forceCloseDriver`):** Attempts to call `driver.quit()`.
- **2.11.4. Data Interaction:** N/A (Manages browser state).
- **2.11.5. Detailed Scenarios:**
    - **a) Happy Paths:** Driver initializes successfully, scraping functions use the shared instance correctly.
    - **b) Edge Cases:** Multiple functions attempting to use the driver concurrently (potentially problematic if not carefully managed, although Redis lock helps serialize major tasks). Driver crashing or becoming unresponsive.
    - **c) Error Scenarios & Handling:** Initialization failure (chromedriver path incorrect, port conflict). `driver.quit()` failure. Errors during Selenium commands handled locally where used. The shared nature means a driver crash affects all subsequent operations until restart.
    - **d) Security Considerations:** Running browser automation has inherent risks. Ensuring `chromedriver` is up-to-date is important. The `--no-sandbox` argument is often necessary in containerized environments but reduces browser security.

---
