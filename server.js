const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const allCountries = require('./public/countries.js');

// Le pseudo qui devient automatiquement administrateur doit être fourni explicitement :
// pas de valeur par défaut, pour ne pas coder en dur un compte admin dans un projet open source.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
if (!ADMIN_USERNAME) {
    console.error(
        "ERREUR : la variable d'environnement ADMIN_USERNAME est requise (nom du compte qui " +
        "sera automatiquement administrateur). Définissez-la (ex: ADMIN_USERNAME=votre_pseudo) " +
        "puis relancez le serveur."
    );
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
// Le client se connecte toujours en same-origin (io() sans URL) : pas besoin d'ouvrir le CORS.
const io = new Server(server);

const countriesById = new Map(allCountries.map(c => [c.id, c]));

const DIACRITICS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g');

function normalizeString(str) {
    return String(str).normalize("NFD").replace(DIACRITICS_REGEX, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().trim();
}

// Vérifie que la réponse envoyée par le client correspond réellement au pays annoncé
function isGuessCorrect(countryId, guess) {
    const country = countriesById.get(countryId);
    if (!country) return false;
    const normalizedGuess = normalizeString(guess);
    if (normalizedGuess === normalizeString(country.name)) return true;
    if (country.alt) return country.alt.some(alt => normalizedGuess === normalizeString(alt));
    return false;
}

// Filet de sécurité : si un upload d'avatar est interrompu (connexion coupée pendant l'envoi),
// busboy émet une erreur "Unexpected end of form" sur un flux que multer n'arrive pas toujours
// à intercepter, ce qui fait planter tout le process Node. On l'ignore spécifiquement pour
// éviter une coupure du jeu pour tous les joueurs ; toute autre erreur reste fatale.
process.on('uncaughtException', (err) => {
    if (err && err.message === 'Unexpected end of form') {
        console.error('Upload de fichier interrompu, ignoré :', err.message);
        return;
    }
    throw err;
});

// Derrière le reverse proxy du réseau "web" : nécessaire pour que req.ip reflète le vrai
// client (via X-Forwarded-For) et non l'IP du proxy, sinon le rate limiting ci-dessous
// s'appliquerait à tout le monde en même temps.
app.set('trust proxy', 1);

app.use(express.static('public'));
app.use(express.json());

// La création de ces dossiers peut échouer si les droits du volume monté ne le permettent pas
// (ex: cap_drop: ALL sur le conteneur). On ne doit pas pour autant empêcher le jeu de démarrer :
// seules les fonctionnalités liées aux avatars seront indisponibles dans ce cas.
try {
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
} catch (err) {
    console.error("Impossible de créer le dossier ./data :", err.message);
}
try {
    if (!fs.existsSync('./data/avatars')) fs.mkdirSync('./data/avatars');
} catch (err) {
    console.error("Impossible de créer le dossier ./data/avatars (les avatars seront indisponibles) :", err.message);
}
app.use('/avatars', express.static('./data/avatars'));

const db = new sqlite3.Database('./data/database.sqlite');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS game_states (
        pseudo TEXT,
        mode TEXT,
        score INTEGER DEFAULT 0,
        found_countries TEXT DEFAULT '[]',
        end_time INTEGER DEFAULT 0,
        best_score INTEGER DEFAULT 0,
        start_time INTEGER DEFAULT 0,
        last_duration_seconds INTEGER DEFAULT 0,
        best_time_seconds INTEGER DEFAULT NULL,
        PRIMARY KEY(pseudo, mode)
    )`);

    // Migration : ajout des colonnes sur les bases existantes
    db.all("PRAGMA table_info(game_states)", (err, columns) => {
        if (err) return console.error(err);
        const columnNames = columns.map(c => c.name);

        if (!columnNames.includes('best_score')) {
            db.run("ALTER TABLE game_states ADD COLUMN best_score INTEGER DEFAULT 0", () => {
                // On initialise le record avec le score actuel pour ne pas perdre l'historique existant
                db.run("UPDATE game_states SET best_score = score");
            });
        }
        if (!columnNames.includes('start_time')) {
            db.run("ALTER TABLE game_states ADD COLUMN start_time INTEGER DEFAULT 0");
        }
        if (!columnNames.includes('last_duration_seconds')) {
            db.run("ALTER TABLE game_states ADD COLUMN last_duration_seconds INTEGER DEFAULT 0");
        }
        if (!columnNames.includes('best_time_seconds')) {
            db.run("ALTER TABLE game_states ADD COLUMN best_time_seconds INTEGER DEFAULT NULL");
        }
    });

    // Statistiques de validation par drapeau (taux global et par joueur)
    db.run(`CREATE TABLE IF NOT EXISTS flag_stats (
        mode TEXT,
        country_id TEXT,
        pseudo TEXT,
        attempts INTEGER DEFAULT 0,
        found INTEGER DEFAULT 0,
        PRIMARY KEY(mode, country_id, pseudo)
    )`);

    // Comptes utilisateurs (optionnels) : mot de passe haché, description, photo de profil, rôle
    db.run(`CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        description TEXT DEFAULT '',
        avatar_path TEXT DEFAULT NULL,
        session_token TEXT DEFAULT NULL,
        created_at INTEGER DEFAULT 0,
        role TEXT DEFAULT 'user',
        last_login INTEGER DEFAULT NULL
    )`);

    // Migration : ajout du rôle et de la dernière connexion sur les bases existantes
    db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) return console.error(err);
        const columnNames = columns.map(c => c.name);
        if (!columnNames.includes('role')) {
            db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", () => {
                // Le compte ADMIN_USERNAME est toujours administrateur
                db.run("UPDATE users SET role = 'admin' WHERE username = ?", [ADMIN_USERNAME]);
            });
        } else {
            db.run("UPDATE users SET role = 'admin' WHERE username = ? AND role != 'admin'", [ADMIN_USERNAME]);
        }
        if (!columnNames.includes('last_login')) {
            db.run("ALTER TABLE users ADD COLUMN last_login INTEGER DEFAULT NULL");
        }
    });

    // Demandes de réinitialisation de mot de passe (en attente de validation par un admin)
    db.run(`CREATE TABLE IF NOT EXISTS password_reset_requests (
        username TEXT PRIMARY KEY,
        requested_at INTEGER DEFAULT 0
    )`);

    // Historique des parties terminées, pour afficher une progression dans le temps
    db.run(`CREATE TABLE IF NOT EXISTS score_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pseudo TEXT,
        mode TEXT,
        score INTEGER,
        duration_seconds INTEGER,
        played_at INTEGER
    )`);
});

const onlineUsers = new Map();
const socketsByPseudo = new Map();

function broadcastModeLeaderboard(mode) {
    db.all(`SELECT gs.pseudo, gs.score, gs.best_score, gs.best_time_seconds, gs.last_duration_seconds, gs.end_time,
                    u.avatar_path, u.last_login
            FROM game_states gs LEFT JOIN users u ON u.username = gs.pseudo
            WHERE gs.mode = ?
            ORDER BY gs.score DESC,
                     CASE WHEN gs.last_duration_seconds > 0 THEN gs.last_duration_seconds ELSE 999999999 END ASC
            LIMIT 30`, [mode], (err, rows) => {
        if (err) return console.error(err);
        const onlinePseudos = Array.from(onlineUsers.values());

        const leaderboard = rows.map(r => ({
            pseudo: r.pseudo,
            score: r.score,
            best_score: r.best_score,
            best_time_seconds: r.best_time_seconds,
            end_time: r.end_time,
            avatar_path: r.avatar_path,
            last_login: r.last_login,
            online: onlinePseudos.includes(r.pseudo)
        }));

        io.to(mode).emit('leaderboard_update', leaderboard);
    });
}

function broadcastGlobalLeaderboards() {
    // On ajoute "end_time" dans la requête SQL pour que le menu sache qui joue actuellement
    db.all(`SELECT gs.pseudo, gs.mode, gs.score, gs.end_time, u.avatar_path, u.last_login
            FROM game_states gs LEFT JOIN users u ON u.username = gs.pseudo
            ORDER BY gs.score DESC`, (err, rows) => {
        if (err) return console.error(err);

        // On récupère qui est en ligne pour afficher le point vert dans le menu global
        const onlinePseudos = Array.from(onlineUsers.values());
        const data = rows.map(r => ({
            ...r,
            online: onlinePseudos.includes(r.pseudo)
        }));

        io.emit('global_leaderboards', data);
    });
}

// Calcule et envoie le taux de validation (global et personnel) de chaque drapeau pour un mode donné
function sendFlagStats(socket, mode, pseudo, countryIds) {
    db.all("SELECT country_id, SUM(attempts) AS totalAttempts, SUM(found) AS totalFound FROM flag_stats WHERE mode = ? GROUP BY country_id", [mode], (err, globalRows) => {
        if (err) return console.error(err);

        db.all("SELECT country_id, attempts, found FROM flag_stats WHERE mode = ? AND pseudo = ?", [mode, pseudo], (err2, personalRows) => {
            if (err2) return console.error(err2);

            const globalMap = {};
            globalRows.forEach(r => { globalMap[r.country_id] = r; });
            const personalMap = {};
            personalRows.forEach(r => { personalMap[r.country_id] = r; });

            const stats = countryIds.map(id => {
                const g = globalMap[id];
                const p = personalMap[id];
                return {
                    country_id: id,
                    globalPercent: (g && g.totalAttempts > 0) ? Math.round((g.totalFound / g.totalAttempts) * 100) : 0,
                    personalPercent: (p && p.attempts > 0) ? Math.round((p.found / p.attempts) * 100) : 0
                };
            });

            socket.emit('flag_stats_result', { mode, stats });
        });
    });
}

// Empêche d'écrire dans les statistiques d'un pseudo associé à un compte sans être connecté à ce compte
function ensurePseudoAuthorized(socket, pseudo, callback) {
    db.get("SELECT username FROM users WHERE username = ?", [pseudo], (err, row) => {
        if (err) return callback(false);
        if (!row) return callback(true);
        callback(socket.data.authedUsername === pseudo);
    });
}

io.on('connection', (socket) => {
    socket.data.authedUsername = null;

    socket.on('login', (data) => {
        const pseudo = (data && typeof data === 'object') ? data.pseudo : data;
        const token = (data && typeof data === 'object') ? data.token : null;
        if (!pseudo) return;
        onlineUsers.set(socket.id, pseudo);
        socketsByPseudo.set(pseudo, socket.id);

        if (!token) {
            socket.data.authedUsername = null;
            return broadcastGlobalLeaderboards();
        }
        db.get("SELECT username FROM users WHERE session_token = ? AND username = ?", [token, pseudo], (err, row) => {
            socket.data.authedUsername = (row && row.username) || null;
            if (socket.data.authedUsername) {
                // Marque la dernière connexion à chaque session validée (login initial ou reprise via token stocké)
                db.run("UPDATE users SET last_login = ? WHERE username = ?", [Date.now(), socket.data.authedUsername]);
            }
            broadcastGlobalLeaderboards();
        });
    });

    socket.on('join_lobby', (data) => {
        const { pseudo, mode } = data;

        ensurePseudoAuthorized(socket, pseudo, (ok) => {
            if (!ok) return socket.emit('auth_required', { pseudo });

            socket.rooms.forEach(room => { if(room !== socket.id) socket.leave(room); });
            socket.join(mode);

            db.get("SELECT score, found_countries, end_time FROM game_states WHERE pseudo = ? AND mode = ?", [pseudo, mode], (err, row) => {
                if (row) {
                    socket.emit('sync_state', { score: row.score, found_countries: JSON.parse(row.found_countries), end_time: row.end_time });
                } else {
                    socket.emit('sync_state', { score: 0, found_countries: [], end_time: 0 });
                }
                broadcastModeLeaderboard(mode);
            });
        });
    });

    socket.on('start_run', (data) => {
        const { pseudo, mode, durationMinutes } = data;

        ensurePseudoAuthorized(socket, pseudo, (ok) => {
            if (!ok) return socket.emit('auth_required', { pseudo });

            const startTime = Date.now();
            const endTime = startTime + (durationMinutes * 60 * 1000);

            db.get("SELECT * FROM game_states WHERE pseudo = ? AND mode = ?", [pseudo, mode], (err, row) => {
                if (!row) {
                    db.run("INSERT INTO game_states (pseudo, mode, end_time, start_time) VALUES (?, ?, ?, ?)", [pseudo, mode, endTime, startTime], () => {
                        socket.emit('run_started', { end_time: endTime });
                        broadcastModeLeaderboard(mode);
                        broadcastGlobalLeaderboards();
                    });
                } else {
                    db.run("UPDATE game_states SET score = 0, found_countries = '[]', end_time = ?, start_time = ? WHERE pseudo = ? AND mode = ?", [endTime, startTime, pseudo, mode], () => {
                        socket.emit('run_started', { end_time: endTime });
                        broadcastModeLeaderboard(mode);
                        broadcastGlobalLeaderboards();
                    });
                }
            });
        });
    });

    // Consultation des statistiques de validation d'un mode sans lancer de partie
    socket.on('get_flag_stats', (data) => {
        const { mode, pseudo, countryIds } = data;
        if (!mode || !Array.isArray(countryIds) || countryIds.length === 0) return;
        sendFlagStats(socket, mode, pseudo, countryIds);
    });

    socket.on('reset_run', (data) => {
        const { pseudo, mode } = data;

        ensurePseudoAuthorized(socket, pseudo, (ok) => {
            if (!ok) return socket.emit('auth_required', { pseudo });

            // Arrêt manuel : on clôture la session sans perdre le score ni les drapeaux trouvés
            db.run("UPDATE game_states SET end_time = ? WHERE pseudo = ? AND mode = ?", [Date.now(), pseudo, mode], () => {
                socket.emit('run_reset');
                broadcastModeLeaderboard(mode);
                broadcastGlobalLeaderboards();
            });
        });
    });

    socket.on('country_found', (data) => {
        const { pseudo, mode, countryId, guess } = data;

        // La réponse doit réellement correspondre au pays annoncé : on ne fait plus confiance
        // au seul countryId envoyé par le client (qui pourrait sinon être forgé sans être deviné).
        if (typeof guess !== 'string' || !isGuessCorrect(countryId, guess)) return;

        ensurePseudoAuthorized(socket, pseudo, (ok) => {
            if (!ok) return socket.emit('auth_required', { pseudo });

            db.get("SELECT found_countries, end_time FROM game_states WHERE pseudo = ? AND mode = ?", [pseudo, mode], (err, row) => {
                if (!row || row.end_time === 0) return;

                if (Date.now() > row.end_time + 2000) {
                    return socket.emit('time_up');
                }

                let found = JSON.parse(row.found_countries);
                if (!found.includes(countryId)) {
                    found.push(countryId);
                    const newScore = found.length;

                    db.run("UPDATE game_states SET score = ?, found_countries = ?, best_score = MAX(best_score, ?) WHERE pseudo = ? AND mode = ?",
                    [newScore, JSON.stringify(found), newScore, pseudo, mode], () => {
                        broadcastModeLeaderboard(mode);
                        broadcastGlobalLeaderboards();
                    });
                }
            });
        });
    });

    // Fin de partie : enregistre le taux de validation de chaque drapeau (global + par joueur)
    socket.on('game_finished', (data) => {
        const { pseudo, mode, countryIds, foundIds } = data;
        if (!pseudo || !mode || !Array.isArray(countryIds) || countryIds.length === 0) return;

        ensurePseudoAuthorized(socket, pseudo, (ok) => {
            if (!ok) return socket.emit('auth_required', { pseudo });

            const foundSet = new Set(foundIds || []);

            const stmt = db.prepare(`INSERT INTO flag_stats (mode, country_id, pseudo, attempts, found) VALUES (?, ?, ?, 1, ?)
                ON CONFLICT(mode, country_id, pseudo) DO UPDATE SET attempts = attempts + 1, found = found + excluded.found`);

            countryIds.forEach(countryId => {
                stmt.run(mode, countryId, pseudo, foundSet.has(countryId) ? 1 : 0);
            });

            stmt.finalize((err) => {
                if (err) return console.error(err);
                sendFlagStats(socket, mode, pseudo, countryIds);
            });

            // Clôture du run : on calcule la durée et on met à jour les records (score + temps associé)
            db.get("SELECT score, start_time, end_time, best_score, best_time_seconds FROM game_states WHERE pseudo = ? AND mode = ?", [pseudo, mode], (err2, row) => {
                if (err2 || !row || !row.start_time) return;

                const now = Date.now();
                const closedEndTime = Math.min(row.end_time, now);
                const duration = Math.max(0, Math.round((closedEndTime - row.start_time) / 1000));

                const newBestScore = Math.max(row.best_score, row.score);
                let newBestTime = row.best_time_seconds;
                if (row.score > row.best_score) {
                    newBestTime = duration;
                } else if (row.score === row.best_score && (row.best_time_seconds == null || duration < row.best_time_seconds)) {
                    newBestTime = duration;
                }

                db.run("UPDATE game_states SET end_time = ?, last_duration_seconds = ?, best_score = ?, best_time_seconds = ? WHERE pseudo = ? AND mode = ?",
                    [closedEndTime, duration, newBestScore, newBestTime, pseudo, mode], () => {
                        broadcastModeLeaderboard(mode);
                        broadcastGlobalLeaderboards();
                    });

                db.run("INSERT INTO score_history (pseudo, mode, score, duration_seconds, played_at) VALUES (?, ?, ?, ?, ?)",
                    [pseudo, mode, row.score, duration, now]);
            });
        });
    });

    socket.on('disconnect', () => {
        const pseudo = onlineUsers.get(socket.id);
        if (pseudo && socketsByPseudo.get(pseudo) === socket.id) socketsByPseudo.delete(pseudo);
        onlineUsers.delete(socket.id);
        socket.rooms.forEach(room => broadcastModeLeaderboard(room));
    });

    // --- DÉFI / DUEL ENTRE JOUEURS EN LIGNE ---

    socket.on('challenge_invite', (data) => {
        const fromPseudo = onlineUsers.get(socket.id);
        const toPseudo = data && data.toPseudo;
        if (!fromPseudo || !toPseudo || toPseudo === fromPseudo) return;

        const targetSocketId = socketsByPseudo.get(toPseudo);
        if (!targetSocketId) {
            return socket.emit('challenge_failed', { toPseudo, reason: "Ce joueur n'est plus en ligne." });
        }
        io.to(targetSocketId).emit('challenge_received', { fromPseudo });
    });

    socket.on('challenge_respond', (data) => {
        const respondingPseudo = onlineUsers.get(socket.id);
        const fromPseudo = data && data.toPseudo; // pseudo de celui qui a lancé le défi
        const accepted = !!(data && data.accepted);
        if (!respondingPseudo || !fromPseudo) return;

        const challengerSocketId = socketsByPseudo.get(fromPseudo);
        if (!challengerSocketId) return;

        if (!accepted) {
            return io.to(challengerSocketId).emit('challenge_declined', { fromPseudo: respondingPseudo });
        }

        const duelId = crypto.randomBytes(4).toString('hex');
        const durationMinutes = 3;
        const mode = `duel_${durationMinutes}_${duelId}`;
        const shuffled = [...allCountries].sort(() => Math.random() - 0.5);
        const countryIds = shuffled.slice(0, 25).map(c => c.id);

        const payload = { mode, countryIds, durationMinutes };
        const responderSocketId = socket.id;
        io.to(challengerSocketId).emit('duel_start', { ...payload, opponent: respondingPseudo });
        io.to(responderSocketId).emit('duel_start', { ...payload, opponent: fromPseudo });
    });
});

// --- ZONE COMPTES UTILISATEURS ---
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

// Rate limiting basique en mémoire (par IP) pour freiner le brute force sur login/register.
// Suffisant pour un process unique ; pas fait pour tenir face à un déploiement multi-instance.
function rateLimit({ windowMs, max }) {
    const hits = new Map(); // ip -> [timestamps]

    setInterval(() => {
        const cutoff = Date.now() - windowMs;
        hits.forEach((timestamps, ip) => {
            const kept = timestamps.filter(t => t > cutoff);
            if (kept.length === 0) hits.delete(ip);
            else hits.set(ip, kept);
        });
    }, windowMs).unref();

    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        const cutoff = now - windowMs;
        const timestamps = (hits.get(ip) || []).filter(t => t > cutoff);

        if (timestamps.length >= max) {
            return res.status(429).json({ error: "Trop de tentatives, réessayez plus tard." });
        }

        timestamps.push(now);
        hits.set(ip, timestamps);
        next();
    };
}

const authRateLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 10 });

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function checkAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Non authentifié." });

    db.get("SELECT username, role FROM users WHERE session_token = ?", [token], (err, row) => {
        if (err || !row) return res.status(401).json({ error: "Session invalide." });
        req.username = row.username;
        req.userRole = row.role || 'user';
        next();
    });
}

// Accès réservé aux comptes ayant le rôle "admin" (panneau d'administration)
function checkAdmin(req, res, next) {
    checkAuth(req, res, () => {
        if (req.userRole !== 'admin') return res.status(403).json({ error: "Accès administrateur requis." });
        next();
    });
}

// Inscription : crée un compte (réclame le pseudo si des stats existent déjà pour ce nom)
app.post('/api/register', authRateLimit, (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || !USERNAME_REGEX.test(username)) {
        return res.status(400).json({ error: "Nom d'utilisateur invalide (3 à 20 caractères : lettres, chiffres, - ou _)." });
    }
    if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    db.get("SELECT username FROM users WHERE username = ?", [username], (err, row) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        if (row) return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris." });

        const passwordHash = bcrypt.hashSync(password, 10);
        const token = generateToken();
        // Le pseudo ADMIN_USERNAME est automatiquement administrateur
        const role = (username === ADMIN_USERNAME) ? 'admin' : 'user';

        db.run("INSERT INTO users (username, password_hash, description, avatar_path, session_token, created_at, role) VALUES (?, ?, '', NULL, ?, ?, ?)",
            [username, passwordHash, token, Date.now(), role], (err2) => {
                if (err2) return res.status(500).json({ error: "Erreur serveur." });
                res.json({ token, username, role });
            });
    });
});

// Connexion
app.post('/api/login', authRateLimit, (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: "Identifiants manquants." });
    }

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err || !row || !bcrypt.compareSync(password, row.password_hash)) {
            return res.status(401).json({ error: "Identifiants invalides." });
        }

        const token = generateToken();
        // Le pseudo ADMIN_USERNAME est toujours administrateur, même sur un compte créé avant cette règle
        let role = row.role || 'user';
        if (username === ADMIN_USERNAME && role !== 'admin') role = 'admin';

        db.run("UPDATE users SET session_token = ?, role = ? WHERE username = ?", [token, role, username], () => {
            res.json({ token, username, role, description: row.description, avatar_path: row.avatar_path });
        });
    });
});

// Déconnexion
app.post('/api/logout', checkAuth, (req, res) => {
    db.run("UPDATE users SET session_token = NULL WHERE username = ?", [req.username], () => {
        res.json({ success: true });
    });
});

// Informations sur le compte connecté (rôle, etc.) — utilisé pour afficher le bouton "Panneau admin"
app.get('/api/me', checkAuth, (req, res) => {
    db.get("SELECT username, role, description, avatar_path FROM users WHERE username = ?", [req.username], (err, row) => {
        if (err || !row) return res.status(401).json({ error: "Session invalide." });
        res.json(row);
    });
});

// Profil public : consultable par tous, même sans compte (affiche alors uniquement les stats de jeu)
app.get('/api/profile/:username', (req, res) => {
    const { username } = req.params;

    db.get("SELECT description, avatar_path, created_at, last_login FROM users WHERE username = ?", [username], (err, userRow) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });

        db.all("SELECT mode, score, best_score, best_time_seconds, last_duration_seconds FROM game_states WHERE pseudo = ? ORDER BY best_score DESC", [username], (err2, stats) => {
            if (err2) return res.status(500).json({ error: "Erreur serveur." });

            res.json({
                username,
                hasAccount: !!userRow,
                description: userRow ? userRow.description : '',
                avatar_path: userRow ? userRow.avatar_path : null,
                created_at: userRow ? userRow.created_at : null,
                last_login: userRow ? userRow.last_login : null,
                stats: stats || []
            });
        });
    });
});

// Drapeaux les plus faibles d'un joueur (utilisé par le mode révision), tous modes confondus
app.get('/api/profile/:username/weak-flags', (req, res) => {
    const { username } = req.params;
    const MIN_ATTEMPTS = 2;
    const MAX_RESULTS = 15;

    db.all(`SELECT country_id, SUM(attempts) AS totalAttempts, SUM(found) AS totalFound
            FROM flag_stats WHERE pseudo = ? GROUP BY country_id`, [username], (err, rows) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });

        const countryIds = rows
            .filter(r => r.totalAttempts >= MIN_ATTEMPTS)
            .map(r => ({ country_id: r.country_id, percent: r.totalFound / r.totalAttempts }))
            .sort((a, b) => a.percent - b.percent)
            .slice(0, MAX_RESULTS)
            .map(r => r.country_id);

        res.json({ countryIds });
    });
});

// Historique des dernières parties terminées d'un joueur (progression dans le temps)
app.get('/api/profile/:username/history', (req, res) => {
    const { username } = req.params;
    db.all("SELECT mode, score, duration_seconds, played_at FROM score_history WHERE pseudo = ? ORDER BY played_at DESC LIMIT 15",
        [username], (err, rows) => {
            if (err) return res.status(500).json({ error: "Erreur serveur." });
            res.json(rows || []);
        });
});

// Mise à jour de la description du profil (utilisateur connecté uniquement)
app.post('/api/profile/description', checkAuth, (req, res) => {
    const { description } = req.body || {};
    if (typeof description !== 'string' || description.length > 280) {
        return res.status(400).json({ error: "Description invalide (280 caractères maximum)." });
    }

    db.run("UPDATE users SET description = ? WHERE username = ?", [description, req.username], () => {
        res.json({ success: true });
    });
});

// Upload de la photo de profil (utilisateur connecté uniquement)
const avatarUpload = multer({
    storage: multer.diskStorage({
        destination: './data/avatars',
        filename: (req, file, cb) => {
            const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' }[file.mimetype];
            cb(null, `${req.username}${ext}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
        cb(null, allowed.includes(file.mimetype));
    },
    limits: { fileSize: 2 * 1024 * 1024 }
});

app.post('/api/profile/avatar', checkAuth, (req, res) => {
    avatarUpload.single('avatar')(req, res, (err) => {
        if (err || !req.file) {
            return res.status(400).json({ error: "Image invalide (PNG, JPEG, WEBP ou GIF, 2 Mo maximum)." });
        }

        const newPath = `/avatars/${req.file.filename}`;

        db.get("SELECT avatar_path FROM users WHERE username = ?", [req.username], (err2, row) => {
            // On supprime l'ancien fichier si son extension diffère du nouveau
            if (row && row.avatar_path && row.avatar_path !== newPath) {
                fs.unlink(path.join('./data/avatars', path.basename(row.avatar_path)), () => {});
            }

            db.run("UPDATE users SET avatar_path = ? WHERE username = ?", [newPath, req.username], () => {
                res.json({ success: true, avatar_path: newPath });
            });
        });
    });
});

// Changement de mot de passe (utilisateur connecté, en saisissant l'ancien mot de passe)
app.post('/api/profile/password', checkAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
    }

    db.get("SELECT password_hash FROM users WHERE username = ?", [req.username], (err, row) => {
        if (err || !row) return res.status(500).json({ error: "Erreur serveur." });
        if (typeof currentPassword !== 'string' || !bcrypt.compareSync(currentPassword, row.password_hash)) {
            return res.status(401).json({ error: "Mot de passe actuel incorrect." });
        }

        const newHash = bcrypt.hashSync(newPassword, 10);
        db.run("UPDATE users SET password_hash = ? WHERE username = ?", [newHash, req.username], () => {
            res.json({ success: true });
        });
    });
});

// Demande de réinitialisation de mot de passe (mot de passe oublié) : un admin devra la valider
app.post('/api/password-reset-request', (req, res) => {
    const { username } = req.body || {};
    if (typeof username !== 'string' || !username) {
        return res.status(400).json({ error: "Nom d'utilisateur requis." });
    }

    db.get("SELECT username FROM users WHERE username = ?", [username], (err, row) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        if (!row) return res.status(404).json({ error: "Aucun compte ne correspond à ce nom d'utilisateur." });

        db.run(`INSERT INTO password_reset_requests (username, requested_at) VALUES (?, ?)
                ON CONFLICT(username) DO UPDATE SET requested_at = excluded.requested_at`,
            [username, Date.now()], (err2) => {
                if (err2) return res.status(500).json({ error: "Erreur serveur." });
                res.json({ success: true });
            });
    });
});

// --- ZONE ADMINISTRATION ---

// Récupérer toutes les sessions de jeu
app.get('/api/admin/players', checkAdmin, (req, res) => {
    db.all("SELECT pseudo, mode, score, end_time FROM game_states ORDER BY pseudo ASC, mode ASC", (err, rows) => {
        res.json(rows || []);
    });
});

// Remettre le score d'un joueur à zéro POUR UN MODE PRÉCIS
app.post('/api/admin/reset/:pseudo/:mode', checkAdmin, (req, res) => {
    const pseudo = req.params.pseudo;
    const mode = req.params.mode;
    db.run("UPDATE game_states SET score = 0, found_countries = '[]' WHERE pseudo = ? AND mode = ?", [pseudo, mode], () => {
        broadcastModeLeaderboard(mode);
        broadcastGlobalLeaderboards();
        res.json({ success: true });
    });
});

// Supprimer la session d'un joueur POUR UN MODE PRÉCIS
app.delete('/api/admin/player/:pseudo/:mode', checkAdmin, (req, res) => {
    const pseudo = req.params.pseudo;
    const mode = req.params.mode;
    db.run("DELETE FROM game_states WHERE pseudo = ? AND mode = ?", [pseudo, mode], () => {
        broadcastModeLeaderboard(mode);
        broadcastGlobalLeaderboards();
        res.json({ success: true });
    });
});

// Vider TOUTE la base de données (Nuke)
app.post('/api/admin/nuke', checkAdmin, (req, res) => {
    db.run("DELETE FROM game_states", () => {
        db.run("DELETE FROM flag_stats", () => {
            broadcastGlobalLeaderboards();
            // On prévient tous les modes que le classement a changé
            io.sockets.adapter.rooms.forEach((_, room) => {
                broadcastModeLeaderboard(room);
            });
            res.json({ success: true });
        });
    });
});

// Liste des comptes utilisateurs (gestion des rôles, renommage)
app.get('/api/admin/users', checkAdmin, (req, res) => {
    db.all("SELECT username, role, avatar_path, created_at, last_login FROM users ORDER BY created_at ASC", (err, rows) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        res.json(rows.map(r => ({ ...r, role: r.role || 'user' })));
    });
});

// Renommer un compte utilisateur (met aussi à jour ses scores et son avatar)
app.post('/api/admin/rename-user', checkAdmin, (req, res) => {
    const { oldUsername, newUsername } = req.body || {};
    if (typeof oldUsername !== 'string' || !oldUsername) {
        return res.status(400).json({ error: "Ancien nom d'utilisateur manquant." });
    }
    if (typeof newUsername !== 'string' || !USERNAME_REGEX.test(newUsername)) {
        return res.status(400).json({ error: "Nouveau nom d'utilisateur invalide (3 à 20 caractères : lettres, chiffres, - ou _)." });
    }
    if (oldUsername === newUsername) return res.json({ success: true, username: newUsername });

    db.get("SELECT username FROM users WHERE username = ?", [newUsername], (err, existing) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        if (existing) return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris." });

        db.get("SELECT avatar_path FROM users WHERE username = ?", [oldUsername], (err2, userRow) => {
            if (err2 || !userRow) return res.status(404).json({ error: "Utilisateur introuvable." });

            // On force une reconnexion avec la nouvelle identité (le token précédent ne correspond plus à rien)
            db.run("UPDATE users SET username = ?, session_token = NULL WHERE username = ?", [newUsername, oldUsername], (err3) => {
                if (err3) return res.status(500).json({ error: "Erreur lors du renommage." });

                db.run("UPDATE game_states SET pseudo = ? WHERE pseudo = ?", [newUsername, oldUsername], (errStats) => {
                    if (errStats) console.error("Erreur renommage game_states :", errStats.message);
                });
                db.run("UPDATE flag_stats SET pseudo = ? WHERE pseudo = ?", [newUsername, oldUsername], (errFlags) => {
                    if (errFlags) console.error("Erreur renommage flag_stats :", errFlags.message);
                });
                db.run("DELETE FROM password_reset_requests WHERE username = ?", [oldUsername]);

                // Renomme aussi le fichier avatar si besoin
                if (userRow.avatar_path) {
                    const ext = path.extname(userRow.avatar_path);
                    const oldFile = path.join('./data/avatars', path.basename(userRow.avatar_path));
                    const newFile = path.join('./data/avatars', `${newUsername}${ext}`);
                    const newAvatarPath = `/avatars/${newUsername}${ext}`;
                    fs.rename(oldFile, newFile, (renameErr) => {
                        if (!renameErr) db.run("UPDATE users SET avatar_path = ? WHERE username = ?", [newAvatarPath, newUsername]);
                    });
                }

                broadcastGlobalLeaderboards();
                res.json({ success: true, username: newUsername });
            });
        });
    });
});

// Attribuer ou retirer le rôle administrateur
app.post('/api/admin/set-role', checkAdmin, (req, res) => {
    const { username, role } = req.body || {};
    if (typeof username !== 'string' || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Requête invalide." });
    }
    if (username === ADMIN_USERNAME && role !== 'admin') {
        return res.status(400).json({ error: `Le compte "${ADMIN_USERNAME}" doit toujours rester administrateur.` });
    }
    if (username === req.username && role !== 'admin') {
        return res.status(400).json({ error: "Vous ne pouvez pas retirer vos propres droits administrateur." });
    }

    db.run("UPDATE users SET role = ? WHERE username = ?", [role, username], function (err) {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        if (this.changes === 0) return res.status(404).json({ error: "Utilisateur introuvable." });
        res.json({ success: true });
    });
});

// Liste des demandes de réinitialisation de mot de passe en attente
app.get('/api/admin/password-reset-requests', checkAdmin, (req, res) => {
    db.all("SELECT username, requested_at FROM password_reset_requests ORDER BY requested_at ASC", (err, rows) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        res.json(rows || []);
    });
});

// Valider une demande : l'admin fixe un nouveau mot de passe temporaire à communiquer à l'utilisateur
app.post('/api/admin/password-reset-requests/:username/resolve', checkAdmin, (req, res) => {
    const { username } = req.params;
    const { newPassword } = req.body || {};
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.run("UPDATE users SET password_hash = ?, session_token = NULL WHERE username = ?", [newHash, username], function (err) {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        if (this.changes === 0) return res.status(404).json({ error: "Utilisateur introuvable." });

        db.run("DELETE FROM password_reset_requests WHERE username = ?", [username], () => {
            res.json({ success: true });
        });
    });
});

// Rejeter une demande de réinitialisation sans y donner suite
app.delete('/api/admin/password-reset-requests/:username', checkAdmin, (req, res) => {
    db.run("DELETE FROM password_reset_requests WHERE username = ?", [req.params.username], () => {
        res.json({ success: true });
    });
});
// ---------------------------

server.listen(PORT, () => console.log(`Serveur demarre sur le port ${PORT}`));
