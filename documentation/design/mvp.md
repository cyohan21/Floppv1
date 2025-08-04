**Flopp.app: MVP**

### 

### **Introduction**

This document will go over all the design aspects of the flopp.app mvp, designed by Yohan, in the following format:

**Application Overview**: A brief summary of the application and its core component(s).

**System Overview**: A general description of the application’s logic.

**Architectural Strategies:** Strategies that will be used which affect the system.

**System Architecture:** High-level overview of functionality and responsibilities of the subsystems and system components.

**Policies and Tactics:** Set of guidelines and strategies that will be used for performance, scalability, and overall best-practice.

### 

### **Application Overview**

### flopp.app is a playful, AI-powered mobile spending tracker designed to help users effortlessly manage their finances. Inspired by apps like oops.app and Duolingo’s engagement model, it aims to make personal finance fun, social, and habit-forming.

#### **Goals**

* Build a fully functional MVP that tracks spending and provides financial insights.

* Launch with a swipe-based UI (like Tinder) for transaction categorization.

* Collect enough data to improve features with AI (receipt scanning, spending summaries).

### **Core Functionality Flow**

#### **Account creation & setup** 

* Users sign up with email/password or Google.  
* Onboarding flow helps set currency, language, user preferences, and goes through a demo.

#### **Adding transactions**

* Users can:  
- **Attach up to 3 bank accounts (premium).** The app will automatically fetch transactions for the previous and current month, keeping them updated in real time.  
- **Add transactions manually**, specifying amount, date, and an optional description.

#### **Daily swipe-based categorization** 

* All transactions load into a card stack, similar to Tinder.  
- Swipe left: marks the transaction as a “flopp” (unnecessary or regrettable spend).  
- Swipe right: categorize it. Users can configure swipe-right to default to a favorite category or pick from options shown at the bottom.

* Alternatively, users have the option to batch-categorize, where users will click on the card stack, which will open a list of all transactions. Users can then select multiple transactions at once, and put them all in one category.  
* Users can also tap a category button below the card to classify the expense to other categories. Categories will be set automatically, however, users can rename and create up to 20 categories.

#### **Income vs expenses summary** 

* The home screen features a **prominent snapshot** of:  
- **Money in (green):** total income for the month & year.  
- **Money out (red):** total spending for the month & year.  
- Users can also tap either section to see a full overview of all transactions calculated for both money in and money out.

### **Architectural Strategies**

### 

#### **Scalability**

* **Database choice:** Use PostgreSQL for core transactional data to ensure ACID compliance and easy scaling via read replicas. MongoDB is isolated to lightweight user settings, minimizing load on relational data.  
* **Horizontal scaling:** Design the backend as stateless Node.js services, deployable in containers (Docker on GCP/AWS), enabling scale-out with Kubernetes or a managed container service.  
* **Partitioning data loads:** Structure transaction queries to always filter by `user_id` and time range to avoid large table scans.  
* **Prepare for analytics growth:** Start storing categorized transaction events with clear timestamps and categories to enable later rollups or warehouse sync.

#### **Efficiency**

* **Efficient batch categorization:** Process batch updates in a single transaction rather than iterating individual DB writes.  
* **Indexing:** Maintain indices on user\_id, transaction\_date, and category for quick dashboard loads and summary calculations.  
* **Lazy loading transactions:** Only load a window (e.g., the most recent 50\) transactions into the card stack; load more as the user swipes through.

#### **Reliability**

* **Consistent backups:** Automate daily backups for PostgreSQL and MongoDB. Store encrypted backups offsite (GCS/AWS S3 with versioning).  
* **Retry & circuit breakers:** For external services like Flinks/Plaid or AWS S3, implement retry strategies and fallback states (e.g., queue transaction pulls on temporary aggregator failures).  
* **Input validation:** Strong validation on transaction creation and category updates to avoid data corruption.

#### **Maintainability**

* **Modular architecture:** Keep clear separation between core modules:  
- auth, transactions, categorization, analytics, user\_settings  
* **Typed code:** Use TypeScript across backend to ensure type safety and easier long-term maintenance.  
* **Environment config:** Use .env files and a config manager (like dotenv or convict) to cleanly separate staging/production settings.  
* **Observability:** Integrate lightweight logging (Winston / Pino) and error monitoring (Sentry) from MVP to catch bugs early.

#### **Availability**

* **Deploy redundant containers:** Use multiple app instances across zones to handle node failures.  
* **Managed DB:** Rely on managed Postgres (e.g., GCP Cloud SQL / AWS RDS) with automatic failover and replication.  
* **Stateless services:** Enables rolling updates with zero downtime.  
* **Simple health checks:** Implement /health and /ready endpoints for orchestration platforms to remove failing containers.

### **System Architecture**

#### **📱 Frontend (Mobile)**

* Built with **React Native**, sharing one codebase for iOS & Android.  
* Communicates with backend via HTTPS REST APIs.  
* Manages:

  * Swipe-based transaction UI (like Tinder)  
  * Batch categorization flows  
  * Income vs expenses dashboards  
    Points, streaks, and user settings

### 

####  **🚀 Backend (API)**

* Built using **Node.js \+ Express \+ TypeScript**.  
  Completely stateless microservice-style API  
* Exposes REST endpoints for:

  * Auth & user sessions (managed by BetterAuth)  
  * CRUD operations on transactions & categories  
    Points, streaks, and analytics summaries  
    Managing user preferences (dark mode, language)

  ### 

#### **🔐 Authentication (BetterAuth)**

* Handles:

  * Email/password registration & secure login  
  * Google OAuth login flow  
  * JWT issuance and secure session rotation (tokens stored in httpOnly cookies)  
  * Centralized permission checks for future role expansions

* Offloads cryptographic best practices and advanced session handling, reducing custom engineering effort and risk.

  ### **🗄️ Databases**

* **Cloud SQL (PostgreSQL) on GCP**

  * Stores all structured data: users, transactions, categories, points, streak history.

* **MongoDB Atlas**

  * Stores lightweight, flexible user settings like UI preferences (dark mode, language).  
  * Keeps core financial data separate and strongly typed in Postgres.

  ### **🗃️ File Storage**

* **Google Cloud Storage (GCS)** buckets:

  * For uploaded receipt images and files needed for future AI insights.  
  * Lifecycle rules to manage older receipts and reduce storage costs.

#### 

#### **🏦 Third-party integrations**

* **Plaid or Flinks** for secure bank account syncing (available only to premium/paid users), pulling transactions automatically into the system.

* **Sentry** for error tracking and alerting.

#### **☁️ GCP Infrastructure**

* **Compute:**

  * Dockerized containers deployed on **Cloud Run** or **Google Kubernetes Engine (GKE)** for automatic scaling and multi-zone redundancy.

* **Database:**

  * Managed **Cloud SQL (Postgres)** with automated backups, point-in-time recovery, and high availability failover.

* **Storage:**

  * **GCS buckets** with encrypted, multi-region redundancy.

* **Secrets & config:**

  * **GCP Secret Manager** for managing API keys, DB credentials, and JWT secrets.

* **Monitoring & Logging:**

  * **Cloud Logging (Stackdriver)** for structured logs.

  * **Cloud Monitoring** with custom dashboards and uptime checks.

#### **⚡ Data flow (typical user flow)**

1. User signs up or logs in via BetterAuth (email/password or Google OAuth). JWT is issued and stored securely.

2. Onboarding flow sets currency, language, and optionally monthly goals.

3. Paid users can connect a bank account via Plaid/Flinks. Transaction data flows directly into the backend, normalized and stored in PostgreSQL.

4. When opening the app:

   * Backend sends recent transactions (uncategorized first into swipe deck).

   * Sends income vs expense summaries and historical categorized spending.

5. User swipes left to mark a “flopp” or right to categorize (or batch categorizes via the list view).

6. Backend updates the transaction, and recalculates summaries.

7. Updates sent back to the frontend for immediate display.

#### 

#### **🔒 Security & reliability considerations**

* All secrets (DB creds, Plaid/Flinks tokens, JWT keys) stored in **GCP Secret Manager** — never in environment files on disk.

* Passwords hashed with bcrypt via BetterAuth. JWTs short-lived with refresh tokens securely rotated.

* HTTPS enforced end-to-end via GCP load balancer SSL.

* Daily automated backups for Cloud SQL and versioned object storage for receipts in GCS.

### **Policies**

#### **Data Retention/Deletion Policy**

*Retention*

 *“Flopp.app reserves the right to retain user transactions indefinitely to provide long-term spending insights. This may be revised in future to comply with evolving privacy regulations or user preferences.”*

*Deletion*

 *“Upon account deletion, all user data including transactions, preferences, and bank connections are hard deleted within 30 days from Postgres, MongoDB, and GCS. Audit logs or aggregated analytics will not retain any user-identifiable details. Within this 30 day period, users will be able to recover their account if they so choose.”*  
