FROM node:18-alpine

# Création du dossier de l'app
WORKDIR /app

# Copie des fichiers de configuration NPM
COPY package*.json ./

# SQLite a besoin de quelques outils pour se compiler sur Alpine
RUN apk add --no-cache python3 make g++ \
    && npm install \
    && apk del python3 make g++

# On copie tout le reste du code (server.js, dossier public...)
COPY . .

# On expose le port 3000 (en interne pour le reverse proxy)
EXPOSE 3000

# Démarrage du serveur
CMD ["npm", "start"]
