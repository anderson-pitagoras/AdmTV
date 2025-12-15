#!/bin/bash

# Seu usuário DockerHub
DOCKERHUB_USER="seu-usuario"
VERSION="1.0.0"

echo "Building backend..."
docker build -t ${DOCKERHUB_USER}/admtv-backend:${VERSION} ./backend
docker tag ${DOCKERHUB_USER}/admtv-backend:${VERSION} ${DOCKERHUB_USER}/admtv-backend:latest

echo "Building frontend..."
docker build -t ${DOCKERHUB_USER}/admtv-frontend:${VERSION} ./frontend
docker tag ${DOCKERHUB_USER}/admtv-frontend:${VERSION} ${DOCKERHUB_USER}/admtv-frontend:latest

echo "Push to DockerHub:"
echo "docker push ${DOCKERHUB_USER}/admtv-backend:${VERSION}"
echo "docker push ${DOCKERHUB_USER}/admtv-backend:latest"
echo "docker push ${DOCKERHUB_USER}/admtv-frontend:${VERSION}"
echo "docker push ${DOCKERHUB_USER}/admtv-frontend:latest"