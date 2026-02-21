#!/usr/bin/env bash
# ─────────────────────────────────────────────
# AKS Start — bring the cluster back online
# Usage: ./aks-start.sh <resource-group> <cluster-name>
# ─────────────────────────────────────────────
set -euo pipefail

RESOURCE_GROUP="${1:?Usage: $0 <resource-group> <cluster-name>}"
CLUSTER_NAME="${2:?Usage: $0 <resource-group> <cluster-name>}"

echo "▶ Starting AKS cluster '$CLUSTER_NAME' in '$RESOURCE_GROUP'..."
az aks start \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CLUSTER_NAME"

echo "✅ Cluster started. Fetching credentials..."
az aks get-credentials \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CLUSTER_NAME" \
  --overwrite-existing

echo "✅ kubectl context updated. Cluster is ready."
