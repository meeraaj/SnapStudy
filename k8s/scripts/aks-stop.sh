#!/usr/bin/env bash
# ─────────────────────────────────────────────
# AKS Stop — deallocate the cluster to save $$
# Usage: ./aks-stop.sh <resource-group> <cluster-name>
# ─────────────────────────────────────────────
set -euo pipefail

RESOURCE_GROUP="${1:?Usage: $0 <resource-group> <cluster-name>}"
CLUSTER_NAME="${2:?Usage: $0 <resource-group> <cluster-name>}"

echo "⏹ Stopping AKS cluster '$CLUSTER_NAME' in '$RESOURCE_GROUP'..."
az aks stop \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CLUSTER_NAME"

echo "✅ Cluster stopped. No compute charges will accrue."
