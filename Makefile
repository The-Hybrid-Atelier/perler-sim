# ── Azure resource names ───────────────────────────────────────────────────────
RESOURCE_GROUP  := beadle-rg
LOCATION        := eastus
ACR_NAME        := beadleacr
APP_ENV         := beadle-env
APP_NAME        := beadle
IMAGE           := $(ACR_NAME).azurecr.io/beadle
TAG             := $(shell git rev-parse --short HEAD)

.PHONY: setup client-dev server-dev dev \
        docker-build docker-run \
        provision deploy

# ── Local ─────────────────────────────────────────────────────────────────────

setup:
	npm install
	@[ -f .env ] || cp .env.example .env && echo "Created .env from .env.example — fill in secrets before running."

client-dev:
	npm run client

server-dev:
	npm run server

dev:
	npm start

# ── Docker (local) ────────────────────────────────────────────────────────────

docker-build:
	docker build -t $(IMAGE):$(TAG) -t $(IMAGE):latest .

docker-run:
	docker run --rm -p 3001:3001 --env-file .env $(IMAGE):latest

# ── Azure: one-time provisioning ──────────────────────────────────────────────
# Run once: az login  (opens browser)
# Then: make provision  (idempotent — safe to re-run)

provision:
	az group create --name $(RESOURCE_GROUP) --location $(LOCATION) --output table
	az acr create --name $(ACR_NAME) --resource-group $(RESOURCE_GROUP) --sku Basic --admin-enabled true --output table
	az containerapp env create --name $(APP_ENV) --resource-group $(RESOURCE_GROUP) --location $(LOCATION)
	$(MAKE) --no-print-directory _push
	az containerapp create --name $(APP_NAME) --resource-group $(RESOURCE_GROUP) --environment $(APP_ENV) --image $(IMAGE):$(TAG) --registry-server $(ACR_NAME).azurecr.io --registry-username $(ACR_NAME) --registry-password "$$(az acr credential show --name $(ACR_NAME) --query 'passwords[0].value' -o tsv)" --target-port 3001 --ingress external
	@echo "" && echo "App URL:" && az containerapp show --name $(APP_NAME) --resource-group $(RESOURCE_GROUP) --query properties.configuration.ingress.fqdn -o tsv | sed 's/^/  https:\/\//'

# ── Azure: deploy update ───────────────────────────────────────────────────────

deploy:
	$(MAKE) --no-print-directory _push
	az containerapp update --name $(APP_NAME) --resource-group $(RESOURCE_GROUP) --image $(IMAGE):$(TAG)
	@echo "Deployed $(TAG)"

# ── Internal: build + push to ACR ─────────────────────────────────────────────

_push:
	az acr login --name $(ACR_NAME)
	docker build -t $(IMAGE):$(TAG) -t $(IMAGE):latest .
	docker push $(IMAGE):$(TAG)
	docker push $(IMAGE):latest
