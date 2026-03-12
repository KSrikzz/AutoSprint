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
### 1. Configure Environment
Create a .env file in the root directory:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=autosprint
DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/autosprint
```

### 2. Launch Services
Run the following command to build and start all containers:

```
docker-compose up --build
```

### 3. Initialize the AI Model
Once the containers are running, you need to "pull" the model into the Ollama container:

```
docker exec -it autosprint_ai ollama pull llama3
```
