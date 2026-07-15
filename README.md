# Jeu de drapeaux

Jeu multijoueur en temps réel de reconnaissance de drapeaux (Node.js/Express + Socket.io + SQLite), avec comptes utilisateurs, classements en direct, profils et panneau d'administration.

## Lancer le projet

```bash
git clone https://github.com/LK59/flag-game.git
cd flag-game
cp docker-compose.example.yml docker-compose.yml
# éditer docker-compose.yml : renseigner ADMIN_USERNAME (voir ci-dessous)
docker compose up -d --build
```

Le jeu écoute en interne sur le port `3000` (configurable via `PORT`). Le `docker-compose.example.yml` fourni suppose un reverse proxy externe relié au réseau Docker `web` (`networks: web: external: true`) — créez ce réseau au préalable (`docker network create web`) ou adaptez le fichier à votre infrastructure si vous n'en utilisez pas.

### Contenu de `docker-compose.example.yml`

Fourni ici en clair pour un déploiement rapide (copier-coller direct dans un `docker-compose.yml`, sans avoir à aller chercher le fichier) :

```yaml
services:
  flags-game:
    build: .
    container_name: flags-game
    volumes:
      - ./data:/app/data
    environment:
      - TZ=Europe/Paris
      # Pseudo qui devient automatiquement administrateur (obligatoire, pas de valeur par défaut).
      # Si absente, le conteneur refuse de démarrer et l'explique dans ses logs.
      - ADMIN_USERNAME=your_admin_username
      # - PORT=3000
    networks:
      - web
    restart: unless-stopped
    cap_drop:
      - ALL

networks:
  web:
    external: true
```

## Variables d'environnement

| Variable         | Requise | Défaut | Description |
|------------------|---------|--------|--------------|
| `ADMIN_USERNAME` | Oui     | —      | Pseudo qui devient automatiquement administrateur (accès au panneau `/admin.html`). **Le conteneur refuse de démarrer si elle n'est pas définie** — un message clair l'explique dans les logs. |
| `PORT`           | Non     | `3000` | Port d'écoute interne du serveur. |
| `TZ`             | Non     | —      | Fuseau horaire du conteneur (ex: `Europe/Paris`). |

## Persistance des données

Le dossier `./data` (monté en volume) contient la base SQLite (`database.sqlite`) et les avatars uploadés (`avatars/`). Il est créé automatiquement au premier lancement et n'est **jamais versionné** (voir `.gitignore`) : il contient des données personnelles réelles (comptes, hash de mots de passe, photos de profil).

## Développement local sans Docker

```bash
npm install
ADMIN_USERNAME=votre_pseudo npm start
```
