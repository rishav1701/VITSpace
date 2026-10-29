# VITSpace --- Smart Classroom and Laboratory Availability Management System

VITSpace is a full-stack web application for finding and managing
classroom and laboratory availability in the PRP (Pearl Research Park) academic
block at VIT Vellore. Students can search for rooms, review room details
and weekly schedules, and view their profile. Administrators can manage
rooms, timetable entries, and student records through a role-restricted
dashboard.

The application uses a React + TypeScript frontend, a Python FastAPI
REST API, and an Oracle relational database. The backend queries Oracle
for room, schedule, student, dashboard, and availability data.

> **Scope note:** This README describes the implementation found in this
> repository. The SQL file `docs/schema.sql` creates the `AUTH` table;
> the `ROOM`, `ROOM_SCHEDULE`, and `STUDENTS` tables are treated as
> existing database tables. Set up those tables in your Oracle schema
> before running the application.

------------------------------------------------------------------------

## Contents

-   [Project at a glance](#project-at-a-glance)
-   [Features](#features)
-   [Technology stack](#technology-stack)
-   [Architecture and request flow](#architecture-and-request-flow)
-   [Prerequisites](#prerequisites)
-   [Database design](#database-design)
-   [Configuration](#configuration)
-   [Installation and local setup](#installation-and-local-setup)
-   [Running the application](#running-the-application)
-   [Frontend pages](#frontend-pages)
-   [REST API reference](#rest-api-reference)
-   [Availability and timetable
    rules](#availability-and-timetable-rules)
-   [Authentication and
    authorization](#authentication-and-authorization)
-   [Validation and error handling](#validation-and-error-handling)
-   [Testing and verification](#testing-and-verification)
-   [Troubleshooting](#troubleshooting)
------------------------------------------------------------------------

## Project at a glance

  -----------------------------------------------------------------------
  Item                                Details
  ----------------------------------- -----------------------------------
  Project name                        VITSpace

  Purpose                             Classroom and laboratory discovery
                                      and timetable management

  Intended location                   PRP / Periyar academic block, VIT
                                      Vellore

  Frontend                            React, TypeScript, Vite, Tailwind
                                      CSS

  Backend                             Python, FastAPI, Pydantic

  Database                            Oracle Database

  Database driver                     `python-oracledb` in Thin mode

  Authentication                      JWT access token in an HttpOnly
                                      cookie; Bearer token extraction is
                                      also supported by the backend

  API documentation                   FastAPI Swagger UI at `/docs` when
                                      the backend is running
  -----------------------------------------------------------------------

## Features

### Student experience

-   **Room search:** Search rooms with optional filters such as block,
    floor, room type, room number, and minimum capacity.
-   **Availability search:** Check whether rooms are scheduled for a
    selected day and slot.
-   **Find rooms now:** The room-finding interface can help users locate
    rooms for a selected/current time context. Availability is
    calculated from the stored timetable entries.
-   **Room directory:** Browse room records and room details.
-   **Weekly timetable:** View a room's scheduled periods in a weekly
    timetable modal.
-   **Student dashboard:** View room and laboratory summary information
    and student-specific dashboard details.
-   **Profile:** View the authenticated student's academic profile.

### Administrator experience

-   **Dashboard analytics:** View room counts, classroom/lab counts,
    floor summaries, total schedules, and student totals.
-   **Room management:** Create, view, update, filter, and delete room
    records.
-   **Schedule management:** Create, view, update, filter, and delete
    timetable entries.
-   **Schedule conflict checks:** Creating a schedule checks whether the
    same room already has an entry for the same day and slot. The
    database also has a unique constraint documented for this
    combination.
-   **Student management:** Search, list, add, update, and delete
    student records.
-   **Department list:** Retrieve the distinct departments recorded in
    the student table.
-   **Role-restricted pages:** The frontend and backend enforce
    administrator-only access for management operations.

### Shared application capabilities

-   REST API separation between frontend and backend.
-   Pydantic request/response schemas for structured API data.
-   Oracle SQL queries executed through a repository layer.
-   JWT-based session authentication.
-   Bcrypt password hashing and verification.
-   CORS configuration for the frontend origin.
-   Rate-limit exception handling using SlowAPI.
-   Toast notifications for frontend feedback.
-   Pagination support on room, schedule, and student list APIs.

------------------------------------------------------------------------

## Technology stack

### Frontend

  Technology       Role
  ---------------- -------------------------------------------------
  React 19         UI components and application rendering
  TypeScript       Typed frontend code
  Vite             Development server and production build tooling
  Tailwind CSS 4   Utility-first styling
  React Router     Client-side page routing
  Axios            HTTP requests to the backend
  Lucide React     Interface icons

### Backend

  Technology                      Role
  ------------------------------- -----------------------------------------------
  Python 3.10+                    Backend runtime
  FastAPI                         REST API framework
  Uvicorn                         ASGI development/application server
  Pydantic / pydantic-settings    Data validation and settings
  `python-oracledb`               Oracle database connectivity in Thin mode
  `python-jose`                   JWT creation and decoding
  `bcrypt` / Passlib dependency   Password hashing support
  `python-dotenv`                 Environment file loading
  SlowAPI                         Rate-limit integration and exception handling

### Database

Oracle stores room information, room schedules, student records, and
authentication records. The application uses SQL queries and relational
joins rather than an ORM.

------------------------------------------------------------------------

## Architecture and request flow

``` mermaid
flowchart LR
    Student[Student / Administrator] --> UI[React + TypeScript UI]
    UI -->|HTTP requests /api| API[FastAPI REST API]
    API --> Auth[JWT authentication and role checks]
    API --> Schemas[Pydantic schemas]
    API --> Repositories[Repository layer]
    Repositories -->|SQL queries| DB[(Oracle Database)]
    DB --> Repositories
    Repositories --> API
    API --> UI
```

### Main backend layers

1.  **API routers** receive HTTP requests and apply
    authentication/authorization dependencies.
2.  **Pydantic schemas** define and validate the structure of request
    and response data.
3.  **Security module** verifies passwords, creates/decodes JWTs, and
    checks user roles.
4.  **Repository modules** execute parameterized SQL against Oracle.
5.  **Database connection module** creates connections and manages
    commit, rollback, and cleanup.
6.  **Oracle database** stores the persistent application data.

### Frontend flow

1.  React Router chooses the page based on the URL.
2.  The authentication provider checks the current session through the
    API.
3.  Protected routes redirect unauthenticated users to the login page
    and restrict administrator pages by role.
4.  API service functions send requests to `/api` using Axios with
    credentials enabled.
5.  The Vite development server proxies `/api` requests to
    `http://localhost:8000`.

------------------------------------------------------------------------


## Prerequisites

Install the following before setup:

-   **Python 3.10 or newer**
-   **Node.js and npm** compatible with the Vite version in
    `frontend/package.json` (Node.js 20.19+ or 22.12+ is recommended for
    current Vite releases)
-   **Oracle Database** accessible from the development machine
-   Oracle schema access with permission to read/write the application
    tables and create the `AUTH` table, sequence, and trigger
-   Git, if cloning the repository

The database connection in the current code uses `python-oracledb` Thin
mode; Oracle Instant Client is not normally required.

------------------------------------------------------------------------

## Database design

VITSpace uses four principal tables.

  ------------------------------------------------------------------------
  Table                   Purpose                  Key columns /
                                                   relationships
  ----------------------- ------------------------ -----------------------
  `ROOM`                  Stores classroom and lab `RoomID` primary key;
                          details                  room number, block,
                                                   floor, room type,
                                                   capacity

  `ROOM_SCHEDULE`         Stores room              `ScheduleID` primary
                          reservations/timetable   key; `RoomID`
                          allocations              references `ROOM`; day,
                                                   slot, start time, end
                                                   time

  `STUDENTS`              Stores student           `RegNo` primary key;
                          academic/profile data    name, email (`Mail`),
                                                   department (`Dept`)

  `AUTH`                  Stores login identity    `UserID` primary key;
                          and password hash        unique username,
                                                   password hash, role,
                                                   optional `RegNo`
                                                   reference to `STUDENTS`
  ------------------------------------------------------------------------

### Relationships

-   One room can have multiple schedule entries.
-   Each schedule entry belongs to one room through
    `ROOM_SCHEDULE.RoomID`.
-   A student may have an authentication record linked through
    `AUTH.RegNo`.
-   `AUTH.Role` is constrained to `student` or `admin`.
-   The documented timetable integrity rule is one schedule per room,
    day, and slot.

### Important schema setup detail

`docs/schema.sql` contains full reference DDL for `ROOM`,
`ROOM_SCHEDULE`, and `STUDENTS` inside a comment block for
documentation. That commented reference DDL is **not executed** when the
script is run. The active DDL creates `AUTH`, `AUTH_SEQ`, and `AUTH_BI`.
The setup script `backend/setup_admin.py` can create the `AUTH` table,
sequence, and trigger when missing.

Therefore, before running setup, make sure `ROOM`, `ROOM_SCHEDULE`, and
`STUDENTS` already exist in the Oracle schema and match the column names
used by the application. The `AUTH.RegNo` foreign key references
`STUDENTS(RegNo)`.

### Schema constraints documented in the repository

-   `ROOM.Floor`: between 1 and 7.
-   `ROOM.RoomType`: `Classroom` or `Lab`.
-   `ROOM.Capacity`: greater than zero.
-   `ROOM_SCHEDULE.DayOfWeek`: `MON`, `TUE`, `WED`, `THU`, `FRI`, or
    `SAT`.
-   `ROOM_SCHEDULE`: unique combination of `RoomID`, `DayOfWeek`, and
    `SlotNumber`.
-   `AUTH.Username`: unique and required.
-   `AUTH.Role`: `student` or `admin`.

> Existing Oracle tables may differ from the reference DDL. Check your
> actual schema before running setup or applying changes.

------------------------------------------------------------------------

## Configuration

### 1. Create the environment file

From the repository root:

``` bash
cd backend
```

Copy the example file to `.env`.

**Windows PowerShell:**

``` powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

``` bash
cp .env.example .env
```

Edit `backend/.env` with values for your own Oracle database and local
environment.

### 2. Environment variables

  ---------------------------------------------------------------------------------
  Variable                        Purpose                 Example / default
  ------------------------------- ----------------------- -------------------------
  `ORACLE_USER`                   Oracle database         Set to your database user
                                  username                

  `ORACLE_PASSWORD`               Oracle database         Set privately; do not
                                  password                commit

  `ORACLE_DSN`                    Oracle connection       `localhost:1521/XEPDB1`
                                  descriptor              

  `AUTH_SECRET`                   Secret used to sign     Generate a long random
                                  JWTs                    secret

  `AUTH_ALGORITHM`                JWT signing algorithm   `HS256`

  `ACCESS_TOKEN_EXPIRE_MINUTES`   JWT lifetime in minutes `480` (8 hours)

  `FRONTEND_ORIGIN`               Allowed frontend origin `http://localhost:5173`
                                  for CORS                

  `ADMIN_USERNAME`                Username created by the `admin`
                                  setup script            

  `ADMIN_PASSWORD`                Initial admin password  Set a strong private
                                  used by setup           password
  ---------------------------------------------------------------------------------

The configuration class provides fallback defaults, but you should set
real values in `.env`, especially the Oracle password, JWT secret, and
admin password.

Example template (replace every placeholder before use):

``` dotenv
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_DSN=localhost:1521/XEPDB1

AUTH_SECRET=replace_with_a_long_random_secret
AUTH_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

FRONTEND_ORIGIN=http://localhost:5173

ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace_with_a_strong_password
```

Do not use the example values as production credentials. Do not commit
`.env` or share it publicly.

------------------------------------------------------------------------

## Installation and local setup

### Step 1 --- Get the code

``` bash
git clone https://github.com/rishav1701/VITSpace.git
cd VITSpace
```

If you already have the repository locally, open a terminal at its root
directory instead.

### Step 2 --- Prepare the Oracle schema

1.  Confirm that the `ROOM`, `ROOM_SCHEDULE`, and `STUDENTS` tables
    exist in the Oracle schema you configured.
2.  Verify that their column names and types are compatible with the
    repository SQL.
3.  Review `docs/schema.sql`. Its reference DDL for the three existing
    tables is commented out; do not assume the file creates those
    tables.
4.  Create the authentication table using the setup script in the next
    step, or run the active `AUTH` DDL in an appropriate Oracle SQL
    client.
5.  Ensure the configured database user has the required privileges.

### Step 3 --- Install backend dependencies

From the repository root:

``` bash
cd backend
```

Create and activate a virtual environment.

**Windows PowerShell:**

``` powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use a permitted activation method for
your system or run the virtual environment's Python executable directly.

**macOS / Linux:**

``` bash
python3 -m venv .venv
source .venv/bin/activate
```

Install packages:

``` bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Configure `backend/.env` before running the database setup script.

### Step 4 --- Initialize authentication and create the administrator

Run from the `backend/` directory:

``` bash
python setup_admin.py
```

The script checks Oracle connectivity, reports the expected table
status, creates the `AUTH` table and supporting sequence/trigger when
needed, and seeds an administrator using `ADMIN_USERNAME` and
`ADMIN_PASSWORD` from the environment.

To create authentication records for all existing students, run:

``` bash
python setup_admin.py --register-students
```

**Important:** The optional command assigns each student's registration
number as their initial password. Use it only in a controlled
demo/development environment, and arrange for those passwords to be
changed before real use. The script does not automatically create
student records in `STUDENTS`; those records must already exist.

### Step 5 --- Install frontend dependencies

Open a second terminal at the repository root:

``` bash
cd frontend
npm install
```

### Step 6 --- Start the backend

From `backend/`, with the virtual environment active and `.env`
configured:

``` bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend should be available at:

-   API root: `http://127.0.0.1:8000/`
-   Swagger UI: `http://127.0.0.1:8000/docs`
-   ReDoc: `http://127.0.0.1:8000/redoc`
-   Health endpoint: `http://127.0.0.1:8000/api/health`

Keep this terminal running.

### Step 7 --- Start the frontend

In the second terminal, from `frontend/`:

``` bash
npm run dev
```

Open the URL printed by Vite, normally:

-   Frontend: `http://localhost:5173`

The Vite configuration proxies requests beginning with `/api` to
`http://localhost:8000`.

### Step 8 --- Sign in

Use the administrator username and password you configured in
`backend/.env` and initialized with `python setup_admin.py`.

For student access, a corresponding row must exist in `STUDENTS` and a
linked `AUTH` record must be created. The optional `--register-students`
setup mode creates those records using the registration number as the
initial password.

The repository's current code does not guarantee that any particular
demo student exists in every Oracle database. Use credentials that are
actually present in your configured `AUTH` table.

------------------------------------------------------------------------

## Running the application

For normal development, keep two terminals open.

**Terminal 1 --- Backend**

``` bash
cd backend
# Activate .venv first, then:
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 --- Frontend**

``` bash
cd frontend
npm run dev
```

### Production frontend build

From `frontend/`:

``` bash
npm run build
```

This runs the TypeScript compiler and creates a production build using
Vite. To preview the generated build locally:

``` bash
npm run preview
```

The preview server is intended for local review; production hosting and
reverse-proxy configuration are not defined by this repository.

------------------------------------------------------------------------

## Frontend pages

The route configuration in `frontend/src/App.tsx` defines these pages:

  -----------------------------------------------------------------------
  Route                   Page                    Access
  ----------------------- ----------------------- -----------------------
  `/login`                Login                   Public

  `/dashboard`            Student dashboard       Authenticated student
                                                  flow

  `/find-rooms`           Room availability       Authenticated
                          search                  

  `/rooms`                Room directory          Authenticated

  `/profile`              Student profile         Authenticated; profile
                                                  API requires student
                                                  role

  `/admin/dashboard`      Administrator dashboard Admin

  `/admin/rooms`          Room management         Admin

  `/admin/schedules`      Schedule management     Admin

  `/admin/students`       Student management      Admin

  `*` within the          Not-found page          Authenticated layout
  protected layout                                
  -----------------------------------------------------------------------

The root route redirects users based on their current session:
unauthenticated users are sent to `/login`; administrators are directed
to `/admin/dashboard`; other authenticated users are directed to
`/dashboard`.

------------------------------------------------------------------------

## REST API reference

The API prefix is `/api`. Endpoints below reflect the FastAPI routers in
`backend/app/api/`.

**Access labels**

-   **Public:** no authenticated session is required.
-   **Authenticated:** a valid JWT is required.
-   **Student:** a valid student session is required.
-   **Admin:** a valid administrator session is required.

### Health and root

  -----------------------------------------------------------------------
  Method            Endpoint          Access            Purpose
  ----------------- ----------------- ----------------- -----------------
  `GET`             `/`               Public            Returns API name,
                                                        version, and
                                                        documentation
                                                        path

  `GET`             `/api/health`     Public            Checks database
                                                        connectivity and
                                                        reports expected
                                                        table status
  -----------------------------------------------------------------------

### Authentication

  ----------------------------------------------------------------------------
  Method            Endpoint             Access            Purpose
  ----------------- -------------------- ----------------- -------------------
  `POST`            `/api/auth/login`    Public            Validates
                                                           username/password
                                                           and sets an
                                                           authentication
                                                           cookie

  `POST`            `/api/auth/logout`   Public route;     Deletes the
                                         clears cookie     authentication
                                                           cookie

  `GET`             `/api/auth/me`       Authenticated     Returns current
                                                           user and, for a
                                                           linked student,
                                                           profile details
  ----------------------------------------------------------------------------

Example login request:

``` json
{
  "username": "your_username",
  "password": "your_password"
}
```

A successful login returns user information and sets an `access_token`
cookie. The frontend Axios client uses `withCredentials: true`.

### Dashboard

  --------------------------------------------------------------------------------
  Method            Endpoint                   Access            Purpose
  ----------------- -------------------------- ----------------- -----------------
  `GET`             `/api/dashboard/admin`     Admin             Room counts,
                                                                 floor summaries,
                                                                 schedule count,
                                                                 and student count

  `GET`             `/api/dashboard/student`   Student           Student
                                                                 name/department
                                                                 and room summary
                                                                 statistics

  `GET`             `/api/dashboard/floors`    Authenticated     Floor-by-floor
                                                                 room summary
  --------------------------------------------------------------------------------

### Rooms

  ------------------------------------------------------------------------------
  Method            Endpoint                 Access            Purpose
  ----------------- ------------------------ ----------------- -----------------
  `GET`             `/api/rooms`             Authenticated     List rooms with
                                                               optional filters
                                                               and pagination

  `GET`             `/api/rooms/{room_id}`   Authenticated     Get one room by
                                                               ID

  `POST`            `/api/rooms`             Admin             Create a room

  `PUT`             `/api/rooms/{room_id}`   Admin             Update a room

  `DELETE`          `/api/rooms/{room_id}`   Admin             Delete a room if
                                                               no schedules
                                                               reference it
  ------------------------------------------------------------------------------

Supported `GET /api/rooms` query parameters:

-   `block`
-   `floor`
-   `room_type`
-   `search` (matches room number)
-   `min_capacity`
-   `limit` (1--500; default 100)
-   `offset` (default 0)

Example create-room body:

``` json
{
  "room_number": "PRP-101",
  "block": "PRP",
  "floor": 1,
  "room_type": "Classroom",
  "capacity": 60
}
```

Allowed `room_type` values are `Classroom` and `Lab`; floor must be
between 1 and 7 and capacity must be positive.

### Schedules

  --------------------------------------------------------------------------------------
  Method            Endpoint                         Access            Purpose
  ----------------- -------------------------------- ----------------- -----------------
  `GET`             `/api/schedules`                 Authenticated     List schedule
                                                                       entries with
                                                                       filters and
                                                                       pagination

  `GET`             `/api/schedules/slots`           Authenticated     Return the
                                                                       configured
                                                                       slot-to-time
                                                                       mapping

  `GET`             `/api/schedules/{schedule_id}`   Authenticated     Get a schedule
                                                                       entry

  `POST`            `/api/schedules`                 Admin             Create a schedule
                                                                       entry

  `PUT`             `/api/schedules/{schedule_id}`   Admin             Update a schedule
                                                                       entry

  `DELETE`          `/api/schedules/{schedule_id}`   Admin             Delete a schedule
                                                                       entry
  --------------------------------------------------------------------------------------

Supported `GET /api/schedules` query parameters:

-   `room_id`
-   `floor`
-   `day_of_week`
-   `slot_number`
-   `limit` (1--500; default 100)
-   `offset` (default 0)

Example create-schedule body:

``` json
{
  "room_id": 1,
  "day_of_week": "MON",
  "slot_number": 1,
  "start_time": "08:00",
  "end_time": "08:50"
}
```

The create endpoint replaces submitted start/end times with the standard
configured times when the submitted values do not match the mapping for
slots 1--8. The schema allows slot numbers 1--9, but the standard time
map in the API defines only slots 1--8.

### Availability

  ---------------------------------------------------------------------------
  Method            Endpoint              Access            Purpose
  ----------------- --------------------- ----------------- -----------------
  `GET`             `/api/availability`   Authenticated     Returns rooms and
                                                            availability
                                                            status when a day
                                                            and slot are
                                                            provided

  ---------------------------------------------------------------------------

Supported query parameters:

-   `block` (default `PRP`)
-   `floor` (1--7)
-   `room_type`
-   `day_of_week`
-   `slot_number` (API validation accepts 1--9)
-   `min_capacity` (positive integer)

Example:

``` text
GET /api/availability?block=PRP&day_of_week=MON&slot_number=1&floor=1
```

If both `day_of_week` and `slot_number` are provided, the API compares
rooms with `ROOM_SCHEDULE` entries for that day and slot. If either is
omitted, the response lists matching rooms but does not have a
time-specific availability determination.

### Students

  -----------------------------------------------------------------------------------
  Method            Endpoint                      Access            Purpose
  ----------------- ----------------------------- ----------------- -----------------
  `GET`             `/api/students/me`            Student           Get the current
                                                                    student's profile

  `GET`             `/api/students/departments`   Admin             List distinct
                                                                    departments

  `GET`             `/api/students`               Admin             Search/list
                                                                    students with
                                                                    pagination

  `GET`             `/api/students/{reg_no}`      Admin             Get a student by
                                                                    registration
                                                                    number

  `POST`            `/api/students`               Admin             Create a student
                                                                    record

  `PUT`             `/api/students/{reg_no}`      Admin             Update a
                                                                    student's name,
                                                                    mail, or
                                                                    department

  `DELETE`          `/api/students/{reg_no}`      Admin             Delete a student
                                                                    and any linked
                                                                    auth row handled
                                                                    by the repository
  -----------------------------------------------------------------------------------

Supported `GET /api/students` query parameters:

-   `search` (registration number, name, or email)
-   `dept`
-   `limit` (1--500; default 100)
-   `offset` (default 0)

Example create-student body:

``` json
{
  "reg_no": "21BCE0001",
  "name": "Example Student",
  "mail": "student@example.com",
  "dept": "CSE"
}
```

Creating a student record through this endpoint does not automatically
create an `AUTH` login record. The login record must be provisioned
separately.

### API documentation

With the backend running, use Swagger UI at `http://127.0.0.1:8000/docs`
to inspect endpoint schemas and try requests. Use valid credentials and
a database containing the required tables.

------------------------------------------------------------------------

## Availability and timetable rules

The availability repository considers a room available for a particular
slot when no matching row exists in `ROOM_SCHEDULE` for that room, day,
and slot.

The backend's standard slot mapping is:

    Slot Start   End
  ------ ------- -------
       1 08:00   08:50
       2 09:00   09:50
       3 10:00   10:50
       4 11:00   11:50
       5 12:00   12:50
       6 14:00   14:50
       7 15:00   15:50
       8 16:00   16:50

The documented working days are Monday through Saturday, represented in
the database/API as `MON`, `TUE`, `WED`, `THU`, `FRI`, and `SAT`.

The SQL schema documentation also mentions lab sessions spanning two
consecutive classroom periods, but the active schedule API uses the same
slot mapping for all room types. Treat the lab-slot note as reference
documentation rather than a separate enforced scheduling algorithm.

------------------------------------------------------------------------

## Authentication and authorization

-   User credentials are checked against the `AUTH` table.
-   Passwords are stored as hashes, not plain text, using bcrypt
    hashing/verification functions.
-   A successful login creates a signed JWT containing the username,
    role, user ID, and registration number when applicable.
-   The token is set in an `access_token` cookie with `HttpOnly` and
    `SameSite=Lax`.
-   The configured expiry is controlled by `ACCESS_TOKEN_EXPIRE_MINUTES`
    (default: 480 minutes).
-   The backend also accepts a Bearer token in the `Authorization`
    header.
-   `get_current_user` validates the token; `require_admin` and
    `require_student` enforce role requirements.
-   The frontend protects routes based on the session and user role.

The logout endpoint clears the cookie in the response. The application
does not maintain a server-side token revocation list.

------------------------------------------------------------------------

## Validation and error handling

Pydantic schemas validate many request fields before repository
operations. Examples include:

-   Room number length, floor range, allowed room type, and positive
    capacity.
-   Schedule day values and slot number range.
-   Student field lengths and required fields.
-   Pagination bounds for list endpoints.
-   Duplicate room/schedule checks and room-schedule dependency checks
    for deletes.

Common HTTP responses include:

    Status Typical meaning
  -------- --------------------------------------------------------
     `200` Request completed successfully
     `201` Resource created
     `400` Invalid update or request data in specific operations
     `401` Missing, invalid, or expired authentication
     `403` Authenticated user does not have the required role
     `404` Requested record not found
     `409` Duplicate room/schedule or a protected delete conflict
     `422` Request does not satisfy schema validation
     `500` Unexpected backend/database operation failure

Exact responses depend on the endpoint and the underlying Oracle error.

------------------------------------------------------------------------

## Testing and verification

The repository contains application code and a status document, but no
dedicated automated test suite is included in the supplied project
files. The following checks can be performed after configuration.

### 1. Verify backend health

Open:

``` text
http://127.0.0.1:8000/api/health
```

The response reports API status and Oracle connectivity/table checks. A
connected result does not necessarily guarantee that every application
query will work; the expected tables and columns must match the code.

### 2. Inspect API routes

Open:

``` text
http://127.0.0.1:8000/docs
```

Confirm that authentication, room, schedule, availability, dashboard,
and student endpoints appear.

### 3. Verify the frontend build

From `frontend/`:

``` bash
npm run build
```

A successful build checks TypeScript and bundles the frontend.

### 4. Suggested manual test cases

  -----------------------------------------------------------------------
  Test                                Expected behavior
  ----------------------------------- -----------------------------------
  Open the app without a session      Redirect to login

  Submit invalid login credentials    Login fails with an authentication
                                      error

  Log in with a configured            Administrator dashboard and
  administrator                       management routes are available

  Call an admin-only endpoint as a    Backend returns `403 Forbidden`
  student                             

  Search rooms with valid filters     Matching room records are returned

  Query availability for a day and    Each matching room includes its
  slot                                calculated availability flag

  Create a duplicate room number      Request is rejected as a conflict
                                      when Oracle reports a uniqueness
                                      violation

  Create a duplicate room/day/slot    Request is rejected as a conflict
  schedule                            

  Delete a room with linked schedules Delete is rejected until linked
                                      schedules are removed

  Submit invalid room fields          Validation rejects values outside
                                      the defined schema constraints

  Stop Oracle or use invalid          Health check reports a database
  connection details                  connection error

  Run `npm run build`                 TypeScript/Vite production build
                                      completes if dependencies and code
                                      are valid
  -----------------------------------------------------------------------

Record actual results during testing; do not treat this suggested
checklist as proof that each test has already been executed.

------------------------------------------------------------------------

## Troubleshooting

### Oracle connection fails

-   Check that the Oracle database is running and reachable.
-   Verify `ORACLE_USER`, `ORACLE_PASSWORD`, and `ORACLE_DSN` in
    `backend/.env`.
-   Confirm the DSN format matches your Oracle service, for example
    `host:port/service_name`.
-   Verify the database user has privileges to read and modify the
    required tables.
-   Review the details returned by `/api/health` and the backend
    terminal.

### Required tables are missing

The application requires `ROOM`, `ROOM_SCHEDULE`, and `STUDENTS`. The
repository's `docs/schema.sql` does not create these three tables
because their reference DDL is commented out. Create or adapt them in
Oracle before using the application.

### `AUTH` setup fails

-   Confirm the `STUDENTS` table exists, because `AUTH.RegNo` references
    `STUDENTS(RegNo)`.
-   Check whether the Oracle account has permission to create tables,
    sequences, and triggers.
-   Run `python setup_admin.py` from the `backend/` directory with the
    virtual environment activated.
-   Ensure the `.env` file is in `backend/`, which is the expected
    working directory for the settings configuration.

### Frontend cannot reach the backend

-   Start the backend on port `8000`.
-   Start Vite on port `5173`.
-   Check `frontend/vite.config.ts`; its `/api` proxy target is
    `http://localhost:8000`.
-   Ensure `FRONTEND_ORIGIN` matches the frontend origin.
-   Inspect browser developer tools and the backend terminal for errors.

### Login succeeds but student details are missing

Check that the `AUTH.RegNo` value matches an existing `STUDENTS.RegNo`
exactly and that the student record contains the expected profile data.

### Student cannot log in

A row in `STUDENTS` alone is not enough. The student also needs an
`AUTH` record. The optional setup mode
`python setup_admin.py --register-students` creates linked records and
uses the registration number as the initial password.

### Frontend dependency or build errors

-   Confirm the installed Node.js version is compatible with the Vite
    version in `package.json`.
-   Run `npm install` inside `frontend/`.
-   Run `npm run build` and inspect the first TypeScript/build error
    shown.

------------------------------------------------------------------------






