# Professional Creative Collaboration Network — Local Development

Creative Pro is a web platform for creative professionals: profiles and portfolios, posts, following, collaboration opportunities, events, parental approval for under-18 members, and admin moderation.

- **Frontend:** React 19 + TypeScript + Vite 8 (`frontend/`)
- **Backend:** Java + Spring Boot 4.1, Spring Security, JWT, Spring Data JPA (`collaboration/`)
- **Database:** MySQL 8
- **Media storage:** MEGA, through the MEGAcmd command-line tool
- **Performance tests:** Grafana k6 (`performance_tests/`)

Video walkthrough: _add link here_

---

## Repository layout

```
professional-creative-collaboration-network/
├── collaboration/        Spring Boot backend (REST API on port 8080)
│   ├── src/main/java/com/creative/collaboration/
│   ├── src/main/resources/application.properties
│   ├── Dockerfile        Used for the Render deployment
│   └── mvnw, mvnw.cmd    Maven wrapper (no Maven install needed)
├── frontend/             React + Vite website
└── performance_tests/    k6 load and stress test scripts and results
```

---

## 1. Prerequisites

| Software | Version | Check with |
|---|---|---|
| Java JDK | 21 recommended (19 or later required) | `java -version` |
| Node.js | 20.19+ or 22.12+ (required by Vite 8) | `node -v` |
| MySQL | 8.x | `mysql --version` |
| MEGAcmd | Latest, logged in to the project's MEGA account | `mega-whoami` |
| Git | Any recent version | `git --version` |

Maven is not needed. Use the wrapper (`./mvnw` or `mvnw.cmd`) inside `collaboration/`.

---

## 2. Get the code

```bash
git clone https://github.com/Meenakshi305/professional-creative-collaboration-network.git
cd professional-creative-collaboration-network
git checkout Test_Deploy
```

---

## 3. Create the database

Start MySQL and create an empty database and user:

```sql
CREATE DATABASE creative CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'creative_app'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON creative.* TO 'creative_app'@'localhost';
FLUSH PRIVILEGES;
```

You don't need to run any schema script. The backend creates and updates the tables automatically on start-up (`spring.jpa.hibernate.ddl-auto=update`).

---

## 4. Set up MEGA (media storage)

Images and videos are stored in MEGA, and the backend calls the MEGAcmd tools (`mega-put`, `mega-get`, `mega-rm`, `mega-whoami`).

1. Install MEGAcmd from https://mega.io/cmd
2. Log in once with the project's MEGA account:
   ```bash
   mega-login <email> <password>
   mega-whoami        # should print the account email
   ```
3. Note where MEGAcmd is installed. You will set this as `MEGA_COMMAND_PATH`:
   - **Windows:** usually `C:\Users\<you>\AppData\Local\MEGAcmd` (the backend calls the `.bat` versions automatically)
   - **macOS:** usually `/Applications/MEGAcmd.app/Contents/MacOS`
   - **Linux:** usually `/usr/bin`

Without MEGA, the app still runs, but media upload and viewing will fail.

---

## 5. Configure environment variables

The backend reads all settings from environment variables. No secrets are stored in the code.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `SPRING_DATASOURCE_URL` | Yes | — | e.g. `jdbc:mysql://localhost:3306/creative` |
| `SPRING_DATASOURCE_USERNAME` | Yes | — | Database user |
| `SPRING_DATASOURCE_PASSWORD` | Yes | — | Database password |
| `JWT_SECRET` | Yes | — | Long random secret for signing login tokens (at least 32 characters) |
| `JWT_EXPIRATION` | No | `3600000` | Login session length in ms (1 hour) |
| `MEGA_COMMAND_PATH` | No | `/usr/bin` | Folder containing the MEGAcmd programs |
| `MEGA_REMOTE_ROOT` | No | `/creative-collaboration/posts` | MEGA folder for uploads |
| `DEMO_PAYMENTS_ENABLED` | No | `true` | Turns the demonstration payment flow on or off |
| `PORT` | No | `8080` | Port the API listens on |

Generate a JWT secret:

```bash
openssl rand -base64 48
```

**macOS / Linux (bash or zsh):**

```bash
export SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/creative"
export SPRING_DATASOURCE_USERNAME="creative_app"
export SPRING_DATASOURCE_PASSWORD="choose-a-strong-password"
export JWT_SECRET="paste-your-generated-secret"
export MEGA_COMMAND_PATH="/usr/bin"
```

**Windows (PowerShell):**

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/creative"
$env:SPRING_DATASOURCE_USERNAME="creative_app"
$env:SPRING_DATASOURCE_PASSWORD="choose-a-strong-password"
$env:JWT_SECRET="paste-your-generated-secret"
$env:MEGA_COMMAND_PATH="C:\Users\<you>\AppData\Local\MEGAcmd"
```

In IntelliJ IDEA you can instead add these under **Run → Edit Configurations → Environment variables**.

> Never commit real passwords or secrets to Git.

---

## 6. Run the backend

```bash
cd collaboration
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run
```

The API starts on **http://localhost:8080**. On first start it creates the tables and loads the prohibited-words list (`badwords.txt`) used for automatic comment moderation.

Build a jar instead:

```bash
./mvnw clean package
java -jar target/*.jar
```

---

## 7. Run the frontend

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open the address Vite prints (usually **http://localhost:5173**).

The frontend calls `http://localhost:8080` by default. To point it at a different backend, create `frontend/.env.local`:

```
VITE_API_ORIGIN=http://localhost:8080
```

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | TypeScript check and production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

---

## 8. Create the first super administrator

New accounts always start as `USER`, and there is no built-in admin. Sign up through the website, then promote your account once in MySQL:

```sql
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'you@example.com';
```

Log out and back in. You can then create other administrators from the **Admin Panel → Manage Administrators** page.

| Role | Access |
|---|---|
| `USER` | Member features, plus parental controls for linked child accounts |
| `ADMIN` | Reports, flagged comments, moderation, activity |
| `SUPER_ADMIN` | Everything above, plus admin accounts, roles and module settings |

---

## 9. Quick check

1. Sign up and log in.
2. Create a post with an image (this checks MEGA).
3. Create a collaboration opportunity and apply to it from a second account.
4. Create and register for an event.
5. Sign up a member under 18 using a parent's email, then log in as the parent and approve the request under **Parental Controls**.
6. Restart the backend and confirm everything is still there.

---

## 10. Tests

**Unit tests (JUnit):** 106 service and controller tests for the opportunity and user modules are on the `merge-colab` branch.

```bash
git checkout merge-colab
cd collaboration
./mvnw test
```

**Performance tests (k6):** install k6 from https://grafana.com/docs/k6/latest/, start the backend locally, then:

```bash
cd performance_tests
k6 run load-test.js                 # public endpoints, 100 virtual users
k6 run stress-test.js               # public endpoints, up to 400 virtual users
k6 run authenticated-load-test.js   # login, feed and profile, up to 100 users
```

The authenticated test needs test accounts. Create them first with `register-test-users.js`. Keep the generated `test-accounts.json` out of Git.

---

## 11. Troubleshooting

| Problem | Fix |
|---|---|
| Backend fails with "Could not resolve placeholder" | A required environment variable (Section 5) is not set in the terminal or IDE that runs the backend. |
| `Communications link failure` | MySQL is not running, or the URL, port, user or password is wrong. |
| Browser shows a CORS error | The frontend must run on `localhost` or `127.0.0.1`. Other addresses must be added in `collaboration/src/main/java/com/creative/collaboration/security/SecurityConfig.java`. |
| `npm run dev` fails with a Node version error | Upgrade Node.js to 20.19+ or 22.12+. |
| Image upload fails | Check `mega-whoami` works and `MEGA_COMMAND_PATH` points to the MEGAcmd folder. |
| Logged out unexpectedly | Login tokens expire after one hour (`JWT_EXPIRATION`). Log in again. |
| Port 8080 already in use | Stop the other program, or set `PORT=8081` and `VITE_API_ORIGIN=http://localhost:8081`. |

---

## 12. Notes for developers

- The frontend never talks to MySQL. All access goes through the REST API under `/api/...`.
- Signup and login are public. Everything else under `/api/**` needs a JWT. `/api/admin/**` needs `ADMIN` or `SUPER_ADMIN`, and `/api/superadmin/**` needs `SUPER_ADMIN`.
- `/api/test/mega` is a developer test endpoint. Remove it before production.
- Before production, replace `ddl-auto=update` with versioned migrations, and back up MySQL and the MEGA folder together.
