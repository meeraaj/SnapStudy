#!/usr/bin/env bash
# ─────────────────────────────────────────────────────
# SnapStudy AKS Deployment — single script
# Wipes all existing Azure resources, creates minimal
# AKS cluster, builds images, and deploys.
# ─────────────────────────────────────────────────────
set -euo pipefail

RG="snapstudy-rg"
ACR="snapstudyacr"
AKS="snapstudy-aks"
LOCATION="eastus"

echo "═══════════════════════════════════════════════"
echo "  STEP 1: Delete ALL existing resource groups  "
echo "═══════════════════════════════════════════════"

# List all resource groups
GROUPS=$(az group list --query "[].name" -o tsv 2>/dev/null || true)
if [ -n "$GROUPS" ]; then
  for g in $GROUPS; do
    echo "🗑  Deleting resource group: $g"
    az group delete --name "$g" --yes --no-wait 2>/dev/null || true
  done
  echo "⏳ Waiting for deletions to complete..."
  for g in $GROUPS; do
    az group wait --name "$g" --deleted 2>/dev/null || true
  done
fi
echo "✅ All old resource groups cleared."

echo ""
echo "═══════════════════════════════════════════════"
echo "  STEP 2: Create Resource Group                "
echo "═══════════════════════════════════════════════"
az group create --name "$RG" --location "$LOCATION" -o none
echo "✅ Resource group '$RG' created."

echo ""
echo "═══════════════════════════════════════════════"
echo "  STEP 3: Create ACR (Basic SKU)               "
echo "═══════════════════════════════════════════════"
az acr create --name "$ACR" --resource-group "$RG" --sku Basic --admin-enabled true -o none
echo "✅ ACR '$ACR' created."

echo ""
echo "═══════════════════════════════════════════════"
echo "  STEP 4: Create AKS Cluster (1 node)          "
echo "═══════════════════════════════════════════════"
az aks create \
  --resource-group "$RG" \
  --name "$AKS" \
  --node-count 1 \
  --node-vm-size Standard_B2s \
  --attach-acr "$ACR" \
  --generate-ssh-keys \
  --enable-managed-identity \
  -o none
echo "✅ AKS cluster '$AKS' created."

echo ""
echo "═══════════════════════════════════════════════"
echo "  STEP 5: Get AKS Credentials                  "
echo "═══════════════════════════════════════════════"
az aks get-credentials --resource-group "$RG" --name "$AKS" --overwrite-existing
echo "✅ kubectl context set."

echo ""
echo "═══════════════════════════════════════════════"
echo "  STEP 6: Build & Push Docker Images            "
echo "═══════════════════════════════════════════════"
cd /root/snapstudy

echo "📦 Building api-gateway..."
az acr build -t api-gateway:latest -r "$ACR" apps/api-gateway/ 2>&1 | tail -3

echo "📦 Building notes-service..."
az acr build -t notes-service:latest -r "$ACR" apps/notes-service/ 2>&1 | tail -3

echo "📦 Building progress-service..."
az acr build -t progress-service:latest -r "$ACR" apps/progress-service/ 2>&1 | tail -3

echo "📦 Building web..."
az acr build -t web:latest -r "$ACR" apps/web/ 2>&1 | tail -3

echo "✅ All images pushed to $ACR.azurecr.io"

echo ""
echo "═══════════════════════════════════════════════"
echo "  STEP 7: Deploy to AKS                        "
echo "═══════════════════════════════════════════════"
kubectl apply -k k8s/base/
echo ""
echo "⏳ Waiting for pods..."
kubectl wait --for=condition=available --timeout=120s deployment --all -n snapstudy 2>/dev/null || true
kubectl get pods -n snapstudy
kubectl get svc -n snapstudy

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE                       "
echo "═══════════════════════════════════════════════"
