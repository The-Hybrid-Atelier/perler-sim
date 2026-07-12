IMAGE   := fuseblocksacr.azurecr.io/fuseblocks-app
TAG     := $(shell git rev-parse --short HEAD)

.PHONY: setup client-dev server-dev dev docker-build docker-run docker-push

# ── Local ─────────────────────────────────────────────────────────────────────

setup:
	npm install
	@[ -f .env ] || cp .env.example .env && echo "Created .env from .env.example — fill in secrets before running with auth/db enabled."

client-dev:
	npm run client

server-dev:
	npm run server

dev:
	npm start

# ── Docker ────────────────────────────────────────────────────────────────────

docker-build:
	docker build -t $(IMAGE):$(TAG) -t $(IMAGE):latest .

docker-run:
	docker run --rm -p 3001:3001 --env-file .env $(IMAGE):latest

docker-push:
	docker push $(IMAGE):$(TAG)
	docker push $(IMAGE):latest
