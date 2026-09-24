# 🚀 @blackalphalabs/create-nest-app

Production-ready NestJS backend scaffolding by BlackAlphaLabs.

`@blackalphalabs/create-nest-app` is a custom CLI for generating NestJS backend applications using the reusable backend architecture developed by [BlackAlphaLabs](https://www.blackalphalabs.com)

Instead of repeatedly creating the same NestJS foundation, installing the same dependencies, configuring MongoDB, creating authentication modules, and preparing common backend modules, this CLI automates the process.

```bash

npx @blackalphalabs/create-nest-app my-project

```

The CLI first creates a standard NestJS project and then applies the BlackAlphaLabs backend template.

## ✨ Features

| Feature               | Description                                      |
| --------------------- | ------------------------------------------------ |
| 🏗️ NestJS Generation | Creates a new NestJS application automatically   |
| ⚡ Custom Architecture | Applies the BlackAlphaLabs backend structure     |
| 🍃 MongoDB            | MongoDB + Mongoose integration                   |
| 🔐 Authentication     | JWT / Passport authentication foundation         |
| 👥 User Management    | Reusable user module structure                   |
| 🛡️ Authorization     | Role and permission architecture                 |
| 👑 Admin              | Admin functionality foundation                   |
| 📋 Audit              | Audit logging module foundation                  |
| 📧 Email              | Reusable email service structure                 |
| 🔔 Notifications      | Notification module structure                    |
| 👤 Profile            | User profile functionality                       |
| ⚙️ Configuration      | Centralized environment configuration            |
| 🔧 Environment        | Automatically generated `.env.example`           |
| 📦 Dependencies       | Custom `package.json` with required dependencies |
| 🧩 Modular            | Feature-based NestJS module structure            |
| 🚀 Fast Setup         | Create a backend foundation with one command     |
| 🧪 Local Testing      | Test the npm package without publishing          |

## 🚀 Quick Start

Prerequisites

- Make sure you have:

- Node.js 20+
- npm
- Internet access for the initial NestJS project creation and dependency installation

Check your versions:

- node --version
- npm --version


## 📦 Create a New Project

Run:

```bash

npx @blackalphalabs/create-nest-app my-project

```

```bash
The CLI will ask:

√ Project name: ... my-project
√ MongoDB database name: ... my_database
√ Backend port: ... 3000
√ Install dependencies? ... yes

```

- The generated project will then be ready for development.


## 🧠 How It Works

The CLI does not simply copy a folder.

It follows a controlled generation process.

```text

                    👨‍💻 Developer
                         │
                         │
                         ▼
        npx @blackalphalabs/create-nest-app
                         │
                         ▼
              ┌─────────────────────┐
              │ BlackAlphaLabs CLI  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Create NestJS App   │
              │ using Nest CLI      │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Apply B​lackAlphaLabs│
              │ Backend Template    │
              └──────────┬──────────┘
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          📁 src/    📦 package   ⚙️ .env
                       .json
             │           │           │
             └───────────┼───────────┘
                         ▼
               🔄 Replace Variables
                         │
                         ▼
                  📥 npm install
                         │
                         ▼
                  ✅ Ready Project

```


## 🔄 Generation Process

The complete generation lifecycle is:

| Step | Operation                            |
| ---- | ------------------------------------ |
| 1️⃣  | Receive project configuration        |
| 2️⃣  | Validate project name                |
| 3️⃣  | Validate MongoDB database name       |
| 4️⃣  | Validate backend port                |
| 5️⃣  | Create standard NestJS project       |
| 6️⃣  | Apply BlackAlphaLabs `src/` template |
| 7️⃣  | Apply BlackAlphaLabs `package.json`  |
| 8️⃣  | Apply `.env.example`                 |
| 9️⃣  | Replace template variables           |
| 🔟   | Install dependencies                 |
| ✅    | Project ready                        |


## 🏗️ Generated Architecture

- A generated project follows the BlackAlphaLabs modular backend structure.


```

my-project/
│
├── 📁 src/
│   │
│   ├── 📁 admin/
│   │
│   ├── 📁 audit/
│   │
│   ├── 📁 auth/
│   │
│   ├── 📁 common/
│   │
│   ├── 📁 config/
│   │
│   ├── 📁 database/
│   │
│   ├── 📁 email/
│   │
│   ├── 📁 notifications/
│   │
│   ├── 📁 profile/
│   │
│   ├── 📁 role/
│   │
│   ├── 📁 user/
│   │
│   ├── 📄 app.controller.spec.ts
│   ├── 📄 app.controller.ts
│   ├── 📄 app.module.ts
│   ├── 📄 app.service.ts
│   └── 📄 main.ts
│
├── 📁 dbs/
│
├── 📄 .env.example
├── 📄 package.json
├── 📄 nest-cli.json
├── 📄 tsconfig.json
└── 📄 tsconfig.build.json

```

## 🧩 Core Modules

The template provides a reusable starting structure.

```text

                         ┌─────────────────┐
                         │   NestJS App    │
                         └────────┬────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
   🔐 Authentication        👥 User Management       🛡️ Authorization
        │                         │                         │
        │                         │                  ┌──────┴──────┐
        │                         │                  │             │
        │                         │                  ▼             ▼
        │                         │                Roles       Permissions
        │                         │
        └──────────────┬──────────┘
                       │
                       ▼
                🍃 MongoDB
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          Mongoose             Database

```

Additional reusable services include:

- 📋 Audit
- 📧 Email
- 🔔 Notifications
- 👤 Profile
- ⚙ ️ Configuration
- 🛠️ Common utilities
- 👑 Admin


## ⚙️ Generated Environment

The CLI generates a .env.example file using dynamic values.

Template

```env

MONGO_URI=mongodb://127.0.0.1:27017/{{DATABASE_NAME}}

PROJECT_NAME="{{PROJECT_NAME}}"

JWT_SECRET=your_secret_key

SESSION_SECRET=your_SESSION_SECRET

PORT={{PORT}}

BACKEND_SERVER=http://localhost:{{PORT}}

NODE_ENV=development

FRONTEND_URL=http://localhost:5173

EMAIL_USER=
EMAIL_PASSWORD=

OLLAMA_URL=
OLLAMA_MODEL=

```

## 🧭 Development Philosophy

The CLI follows several principles:

♻️ Reusability

Common backend functionality should not need to be manually recreated for every project.

🧩 Modularity

Features are organized into independent NestJS modules.

🔐 Security

Authentication, authorization, validation, security middleware, and auditing are treated as reusable backend concerns.

⚡ Productivity

The generator reduces repetitive project setup.

🛠️ Maintainability

The template is maintained independently from the CLI engine.

🚀 Extensibility

The architecture can evolve as new BlackAlphaLabs backend capabilities are developed.

## 📄 License

This project is licensed under the MIT License.

Copyright © [BlackAlphaLabs](https://www.blackalphalabs.com)

## 👨‍💻 Author

BlackAlphaLabs (Jehan Weerasuriya)

BlackAlphaLabs is a software development and research initiative focused on building reusable software engineering tools, developer infrastructure, open-source packages, and application architectures.

🌐 Website: https://www.blackalphalabs.com


## ⭐ Support

If this project is useful to you, consider giving the repository a ⭐ on GitHub.


```
╔══════════════════════════════════════════════╗
║                                              ║
║       🚀 BlackAlphaLabs NestJS CLI           ║
║                                              ║
║   Build once. Reuse across your projects.    ║
║                                              ║
╚══════════════════════════════════════════════╝

```

Built with ❤️ by [BlackAlphaLabs](https://www.blackalphalabs.com)