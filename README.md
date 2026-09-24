# 🚀 @blackalphalabs/create-nest-app

Production-ready NestJS backend scaffolding by BlackAlphaLabs.

`@blackalphalabs/create-nest-app` is a custom CLI for generating NestJS backend applications using the reusable backend architecture developed by (BlackAlphaLabs)[https://www.blackalphalabs.com].

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