#!/usr/bin/env bash
# Build local de l'image (le serveur n'a que 1,9 Go de RAM), envoi et
# redémarrage du frontend sur le serveur interne.
# Usage : ./deploy.sh   (le mot de passe SSH est demandé pour scp puis ssh)
set -euo pipefail

IMAGE="artf-sirh-frontend:latest"
ARCHIVE="sirh-frontend.tar.gz"
REMOTE="sysadmin@172.20.16.35"
REMOTE_DIR="Applications/artf-sirh"

cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Erreur : Docker ne répond pas. Lancez Docker Desktop puis réessayez." >&2
  exit 1
fi

echo "==> Build de l'image $IMAGE (linux/amd64)"
docker buildx build --platform linux/amd64 --provenance=false -t "$IMAGE" --load .

echo "==> Export de l'image dans $ARCHIVE"
docker save "$IMAGE" | gzip > "$ARCHIVE"

echo "==> Envoi de l'archive vers $REMOTE:$REMOTE_DIR/"
scp "$ARCHIVE" "$REMOTE:$REMOTE_DIR/"

echo "==> Mise à jour et redémarrage sur le serveur"
ssh "$REMOTE" "set -e
  cd $REMOTE_DIR
  git pull
  gunzip -c $ARCHIVE | docker load
  docker compose up -d
  docker image prune -f"

echo "==> Nettoyage de l'archive locale"
rm -f "$ARCHIVE"

echo "Déploiement terminé : http://172.20.16.35:3000"
