# 🐳 AutoSprint: AI-Powered Agile Task Orchestrator
<p>
  AutoSprint is a intelligent project management tool that bridges the gap between raw task ideation and structured execution. By leveraging LLM, it automatically analyzes task titles 
  and descriptions to assign priorities, estimate effort, and categorize technical debt, allowing developers to focus on coding rather than project overhead.
</p>

## 🚀 Features
+ AI Task Analysis: Automatically calculates priority (1-5) and estimated hours using LLMs.

+ Dynamic Execution Plan: Visualizes remaining effort and prioritizes "Critical Path" items.

+ Smart Categorization: Segregates tasks into Backend, Frontend, Security, DevOps, and Docs.

## 🛠️ Prerequisites
+ Docker & Docker Compose installed.

+ Ollama installed (if running outside the container) or enough RAM (8GB+) to run it inside.

+ Minimum 10GB free disk space for Docker images and LLM weights.

## 🚀 Quick Start

### 1. Configure Environment Variables

Create environment configuration files using the provided .env.example structure. These variables allow the backend, database, and frontend to communicate correctly during development.
You must create two .env files:

Create a file named ```.env``` in the root directory and add the following variables:
```
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=autosprint
DATABASE_URL=postgresql://admin:your_secure_password_here@db:5432/autosprint
SECRET_KEY=your_long_random_secret_here
ADMIN_PASSWORD=your_secure_admin_password_here
CORS_ORIGIN=http://localhost:3009
```

Create a ```.env``` file inside the frontend directory and include:
```
VITE_API_URL=http://localhost:8009
```

### 2. Launch Services
Run the following command to build and start all containers:

```
docker-compose up --build
```

### 3. Initialize the AI Model
Once the containers are running, you need to "pull" the model into the Ollama container:

```
docker exec -it as-ollama ollama pull llama3
```
