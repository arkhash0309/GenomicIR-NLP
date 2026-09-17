# GenomicIR-NLP — developer tasks
# Run `make` or `make help` to list targets.
# Windows users: run these under WSL/Git Bash, or use the underlying commands directly.

BACKEND := app/backend
FRONTEND := app/frontend

.DEFAULT_GOAL := help
.PHONY: help install install-backend install-frontend backend frontend \
        up down logs build test lint lint-backend lint-frontend \
        format format-backend format-frontend sample clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: install-backend install-frontend ## Install backend + frontend dependencies

install-backend: ## Install Python dependencies
	cd $(BACKEND) && pip install -r requirements.txt

install-frontend: ## Install Node dependencies
	cd $(FRONTEND) && npm install

backend: ## Run the FastAPI backend (http://localhost:8000)
	cd $(BACKEND) && python main.py

frontend: ## Run the Vite dev server (http://localhost:5173)
	cd $(FRONTEND) && npm run dev

up: ## Start the full stack with Docker Compose
	docker compose up --build

down: ## Stop and remove Docker Compose services
	docker compose down

logs: ## Tail Docker Compose logs
	docker compose logs -f

build: ## Build the production frontend bundle
	cd $(FRONTEND) && npm run build

test: ## Run the backend test suite
	cd $(BACKEND) && pytest

lint: lint-backend lint-frontend ## Lint backend + frontend

lint-backend: ## Lint Python with ruff
	cd $(BACKEND) && ruff check .

lint-frontend: ## Lint TypeScript/React with ESLint
	cd $(FRONTEND) && npm run lint

format: format-backend format-frontend ## Auto-format backend + frontend

format-backend: ## Format Python with ruff
	cd $(BACKEND) && ruff format .

format-frontend: ## Format frontend with Prettier
	cd $(FRONTEND) && npm run format

sample: ## Build a small sample corpus (data/sample) for fast local runs
	python scripts/build_sample_dataset.py --n 50 --out data/sample

clean: ## Remove caches, build artifacts, and generated data
	rm -rf $(FRONTEND)/dist $(FRONTEND)/node_modules/.vite
	rm -rf $(BACKEND)/.pytest_cache $(BACKEND)/.ruff_cache
	find . -type d -name __pycache__ -prune -exec rm -rf {} + 2>/dev/null || true
