        // 196 PAYS AVEC NOMS ALTERNATIFS
        const allCountries = window.allCountries || [];
        const DIACRITICS_REGEX_JS = new RegExp('[\\u0300-\\u036f]', 'g');

        // GESTION SESSION
        let authToken = localStorage.getItem("flagGameToken");
        let playerPseudo = localStorage.getItem("flagGamePseudo");
        const isNewVisitor = !playerPseudo;
        if (!playerPseudo) {
            playerPseudo = generateGuestPseudo();
            localStorage.setItem("flagGamePseudo", playerPseudo);
        }
        document.getElementById("display-pseudo").textContent = "Connecté en tant que : " + playerPseudo;

        function generateGuestPseudo() {
            return "Joueur_" + Math.floor(Math.random() * 1000000);
        }

        // GESTION DES COMPTES (connexion / inscription / profils)
        let authMode = 'login';
        let authModalFirstLaunch = false;
        let authModalPrefill = '';
        let currentUserRole = null;

        // Déclaré ici (avant la navigation par URL) car utilisé par pushHistory()
        // dès l'ouverture éventuelle de la modale d'inscription au chargement de la page.
        let currentMode = null;

        function escapeHtml(str) {
            return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }

        // Modales de confirmation/alerte "maison", à la place des confirm()/alert() natifs du navigateur
        function showConfirmModal({ title = 'Confirmer', message, confirmLabel = 'Confirmer', danger = false, onConfirm }) {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay confirm-modal-overlay';
            overlay.style.display = 'flex';
            overlay.innerHTML = `
                <div class="modal-box confirm-modal-box">
                    <h2>${escapeHtml(title)}</h2>
                    <p class="confirm-modal-message">${message}</p>
                    <div class="confirm-modal-actions">
                        <button class="btn-default" type="button">Annuler</button>
                        <button class="${danger ? 'btn-danger' : 'btn-primary'}" type="button">${escapeHtml(confirmLabel)}</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            const close = () => overlay.remove();
            overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
            const [cancelBtn, confirmBtn] = overlay.querySelectorAll('.confirm-modal-actions button');
            cancelBtn.onclick = close;
            confirmBtn.onclick = () => { close(); onConfirm(); };
            confirmBtn.focus();
        }

        function showAlertModal(message, title = '', onClose) {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay confirm-modal-overlay';
            overlay.style.display = 'flex';
            overlay.innerHTML = `
                <div class="modal-box confirm-modal-box">
                    ${title ? `<h2>${escapeHtml(title)}</h2>` : ''}
                    <p class="confirm-modal-message">${message}</p>
                    <div class="confirm-modal-actions">
                        <button class="btn-primary" type="button">OK</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            const close = () => { overlay.remove(); if (onClose) onClose(); };
            overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
            const okBtn = overlay.querySelector('.confirm-modal-actions button');
            okBtn.onclick = close;
            okBtn.focus();
        }

        function formatDuration(seconds) {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${m}:${String(s).padStart(2, '0')}`;
        }

        function formatLastSeen(timestamp) {
            if (!timestamp) return 'Jamais connecté';
            const date = new Date(timestamp);
            return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Petite pastille avatar utilisée dans les classements (photo si disponible, sinon initiale)
        function miniAvatarHtml(pseudo, avatarPath) {
            return avatarPath
                ? `<img class="player-avatar-mini" src="${escapeHtml(avatarPath)}" alt="">`
                : `<span class="player-avatar-mini player-avatar-mini-fallback">${escapeHtml(pseudo.charAt(0).toUpperCase())}</span>`;
        }

        const REGION_LABELS = { monde: "Monde", europe: "Europe", afrique: "Afrique", asie: "Asie", amerique: "Amérique", oceanie: "Océanie", revision: "Révision ciblée", duel: "Duel" };

        function formatModeLabel(mode) {
            const parts = mode.split('_');
            const region = REGION_LABELS[parts[0]] || (parts[0].charAt(0).toUpperCase() + parts[0].slice(1));
            const duration = parts[1] === '999999' ? 'Infini' : `${parts[1]} min`;
            return `${region} (${duration})`;
        }

        // --- THÈME CLAIR / SOMBRE ---
        function currentTheme() {
            const explicit = document.documentElement.getAttribute('data-theme');
            if (explicit) return explicit;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        function themeToggleButtonHtml() {
            const isDark = currentTheme() === 'dark';
            return `<button class="btn-small theme-toggle-btn" onclick="toggleTheme()" title="${isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}" aria-label="Changer de thème">${isDark ? '☀' : '☾'}</button>`;
        }

        function toggleTheme() {
            const next = currentTheme() === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem('flagGameTheme', next); } catch (e) {}
            renderAccountArea();
        }

        function renderAccountArea() {
            const area = document.getElementById('account-area');
            let html = themeToggleButtonHtml();
            if (currentUserRole === 'admin') {
                html += `<button class="btn-small btn-admin" onclick="openAdminPanel()">Panneau admin</button>`;
            }
            if (authToken) {
                html += `
                    <button class="btn-small" onclick="openProfile(playerPseudo)">Mon profil</button>
                    <button class="btn-small" onclick="logout()">Déconnexion</button>
                `;
            } else {
                html += `<button class="btn-small" onclick="openAuthModal('login')">Connexion / Inscription</button>`;
            }
            area.innerHTML = html;
        }

        function logout() {
            fetch('/api/logout', { method: 'POST', headers: { 'Authorization': 'Bearer ' + authToken } })
                .catch(() => {})
                .finally(() => {
                    localStorage.removeItem('flagGameToken');
                    // On redevient un invité avec une nouvelle identité, pour ne pas rester bloqué
                    // sur un pseudo de compte qui exigerait désormais une connexion
                    localStorage.setItem('flagGamePseudo', generateGuestPseudo());
                    localStorage.removeItem('flagGameAuthPromptDismissed');
                    location.reload();
                });
        }

        function closeModal(id) {
            if (history.state && history.state.modal) {
                history.back();
            } else {
                document.getElementById(id).style.display = 'none';
            }
        }

        function dismissAuthPrompt() {
            localStorage.setItem('flagGameAuthPromptDismissed', '1');
            closeModal('auth-modal');
        }

        function openAuthModal(mode, prefillUsername, isFirstLaunch) {
            authMode = mode || 'login';
            authModalFirstLaunch = !!isFirstLaunch;
            authModalPrefill = prefillUsername || '';
            document.getElementById('auth-username').value = authModalPrefill;
            document.getElementById('auth-password').value = '';
            document.getElementById('auth-modal-error').style.display = 'none';

            const cancelBtn = document.getElementById('auth-cancel-btn');
            if (authModalFirstLaunch) {
                cancelBtn.textContent = "Continuer sans compte";
                cancelBtn.onclick = dismissAuthPrompt;
            } else {
                cancelBtn.textContent = "Annuler";
                cancelBtn.onclick = () => closeModal('auth-modal');
            }

            updateAuthModalUI();
            document.getElementById('auth-modal').style.display = 'flex';
            pushHistory({ modal: 'auth', modalAuthMode: authMode });
        }

        function setAuthMode(mode) {
            authMode = mode;
            document.getElementById('auth-modal-error').style.display = 'none';
            updateAuthModalUI();
        }

        function toggleAuthMode() {
            setAuthMode((authMode === 'login') ? 'register' : 'login');
        }

        function updateAuthModalUI() {
            const isForgot = authMode === 'forgot';
            const isLogin = authMode === 'login';

            document.getElementById('auth-modal-title').textContent = isForgot ? 'Mot de passe oublié' : (isLogin ? 'Connexion' : 'Inscription');
            document.getElementById('auth-password').style.display = isForgot ? 'none' : '';
            document.getElementById('auth-forgot-wrap').style.display = isLogin ? 'block' : 'none';
            document.getElementById('auth-toggle-wrap').style.display = isForgot ? 'none' : 'block';
            document.getElementById('auth-back-wrap').style.display = isForgot ? 'block' : 'none';
            document.getElementById('auth-submit-btn').textContent = isForgot ? 'Envoyer la demande' : (isLogin ? 'Se connecter' : "S'inscrire");
            document.getElementById('auth-toggle-link').textContent = isLogin ? "Pas de compte ? Inscrivez-vous" : "Déjà inscrit ? Connectez-vous";

            const intro = document.getElementById('auth-modal-intro');
            if (isForgot) {
                intro.style.display = 'block';
                intro.textContent = "Indiquez votre nom d'utilisateur. Un administrateur validera votre demande et vous communiquera un nouveau mot de passe.";
            } else if (!isLogin && authModalFirstLaunch) {
                intro.style.display = 'block';
                intro.textContent = authModalPrefill
                    ? `Sécurisez votre profil "${authModalPrefill}" en définissant un mot de passe : vos statistiques seront conservées.`
                    : `Choisissez un nom d'utilisateur et un mot de passe pour créer votre profil.`;
            } else {
                intro.style.display = 'none';
            }
        }

        function submitAuth() {
            const username = document.getElementById('auth-username').value.trim();
            const password = document.getElementById('auth-password').value;
            const errorBox = document.getElementById('auth-modal-error');
            errorBox.style.display = 'none';

            if (authMode === 'forgot') {
                fetch('/api/password-reset-request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                })
                .then(res => res.json().then(data => ({ ok: res.ok, data })))
                .then(({ ok, data }) => {
                    if (!ok) {
                        errorBox.textContent = data.error || "Une erreur est survenue.";
                        errorBox.style.display = 'block';
                        return;
                    }
                    const intro = document.getElementById('auth-modal-intro');
                    intro.style.display = 'block';
                    intro.textContent = "Votre demande a été envoyée. Un administrateur vous communiquera un nouveau mot de passe.";
                })
                .catch(() => {
                    errorBox.textContent = "Impossible de contacter le serveur.";
                    errorBox.style.display = 'block';
                });
                return;
            }

            const url = authMode === 'login' ? '/api/login' : '/api/register';

            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) {
                    errorBox.textContent = data.error || "Une erreur est survenue.";
                    errorBox.style.display = 'block';
                    return;
                }
                localStorage.setItem('flagGameToken', data.token);
                localStorage.setItem('flagGamePseudo', data.username);
                localStorage.removeItem('flagGameAuthPromptDismissed');
                location.reload();
            })
            .catch(() => {
                errorBox.textContent = "Impossible de contacter le serveur.";
                errorBox.style.display = 'block';
            });
        }

        function openProfile(username) {
            const content = document.getElementById('profile-modal-content');
            content.innerHTML = '<div class="spinner-wrap"><span class="spinner"></span> Chargement…</div>';
            document.getElementById('profile-modal').style.display = 'flex';
            pushHistory({ modal: 'profile', modalUser: username });

            Promise.all([
                fetch('/api/profile/' + encodeURIComponent(username)).then(res => res.json()),
                fetch('/api/profile/' + encodeURIComponent(username) + '/history').then(res => res.ok ? res.json() : [])
            ])
                .then(([profile, history]) => renderProfile(profile, history))
                .catch(() => { content.innerHTML = "Impossible de charger ce profil."; });
        }

        function renderProfile(data, history) {
            const content = document.getElementById('profile-modal-content');
            const isMe = !!(authToken && data.username === playerPseudo);

            const avatarHtml = data.avatar_path
                ? `<img class="profile-avatar" src="${escapeHtml(data.avatar_path)}" alt="Avatar">`
                : `<div class="profile-avatar">${escapeHtml(data.username.charAt(0).toUpperCase())}</div>`;

            let statsHtml;
            if (data.stats && data.stats.length > 0) {
                let rows = '';
                data.stats.forEach(s => {
                    rows += `
                        <tr>
                            <td>${formatModeLabel(s.mode)}</td>
                            <td class="num">${s.score}</td>
                            <td class="num">${s.best_score}</td>
                            <td class="num">${s.best_time_seconds != null ? formatDuration(s.best_time_seconds) : '–'}</td>
                        </tr>`;
                });
                statsHtml = `
                    <table class="mini-table">
                        <thead><tr><th>Mode</th><th class="num">Score</th><th class="num">Record</th><th class="num">Temps record</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>`;
            } else {
                statsHtml = '<p class="admin-empty">Aucune partie jouée pour le moment.</p>';
            }

            let historySectionHtml = '';
            if (history && history.length > 0) {
                let rows = '';
                history.forEach(h => {
                    const date = new Date(h.played_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                    rows += `
                        <tr>
                            <td>${date}</td>
                            <td>${formatModeLabel(h.mode)}</td>
                            <td class="num history-score">${h.score} pts</td>
                            <td class="num">${formatDuration(h.duration_seconds)}</td>
                        </tr>`;
                });
                historySectionHtml = `
                    <div class="panel-section">
                        <h3 class="panel-section-title">📈 Historique récent</h3>
                        <table class="mini-table">
                            <thead><tr><th>Date</th><th>Mode</th><th class="num">Score</th><th class="num">Durée</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>`;
            }

            let html = `
                <div class="panel-section profile-header-card">
                    ${avatarHtml}
                    <div>
                        <h2 class="profile-name">${escapeHtml(data.username)}</h2>
                        ${data.description ? `<div class="profile-description">${escapeHtml(data.description)}</div>` : ''}
                        ${data.hasAccount ? `<div class="profile-last-seen">Dernière connexion : ${formatLastSeen(data.last_login)}</div>` : ''}
                    </div>
                </div>
                <div class="panel-section">
                    <h3 class="panel-section-title">🏆 Statistiques par mode</h3>
                    ${statsHtml}
                </div>
                ${historySectionHtml}
            `;

            if (isMe) {
                html += `
                    <div class="panel-section">
                        <h3 class="panel-section-title">✏️ Modifier mon profil</h3>
                        <div class="field-group">
                            <label class="field-label" for="profile-description-input">Description</label>
                            <textarea id="profile-description-input" placeholder="Décrivez-vous en quelques mots...">${escapeHtml(data.description || '')}</textarea>
                            <div class="form-actions"><button class="btn-primary" onclick="saveDescription()">Enregistrer la description</button></div>
                        </div>
                        <div class="field-group">
                            <label class="field-label" for="profile-avatar-input">Photo de profil</label>
                            <div class="file-input-row">
                                <input type="file" id="profile-avatar-input" accept="image/png,image/jpeg,image/webp,image/gif">
                                <button class="btn-primary" onclick="uploadAvatar()">Changer la photo</button>
                            </div>
                        </div>
                    </div>
                    <div class="panel-section">
                        <h3 class="panel-section-title">🔒 Changer mon mot de passe</h3>
                        <div class="field-group">
                            <label class="field-label" for="profile-current-password">Mot de passe actuel</label>
                            <input type="password" id="profile-current-password" placeholder="Mot de passe actuel" autocomplete="current-password">
                        </div>
                        <div class="field-group">
                            <label class="field-label" for="profile-new-password">Nouveau mot de passe</label>
                            <input type="password" id="profile-new-password" placeholder="6 caractères minimum" autocomplete="new-password">
                        </div>
                        <div id="profile-password-error" class="modal-error"></div>
                        <div id="profile-password-success" class="modal-success"></div>
                        <div class="form-actions"><button class="btn-primary" onclick="changePassword()">Mettre à jour le mot de passe</button></div>
                    </div>
                `;
            }

            content.innerHTML = html;
        }

        function saveDescription() {
            const description = document.getElementById('profile-description-input').value;
            fetch('/api/profile/description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
                body: JSON.stringify({ description })
            })
            .then(res => res.json())
            .then(() => {
                suppressHistoryPush = true;
                openProfile(playerPseudo);
                suppressHistoryPush = false;
            });
        }

        function uploadAvatar() {
            const input = document.getElementById('profile-avatar-input');
            if (!input.files || !input.files[0]) return;

            const formData = new FormData();
            formData.append('avatar', input.files[0]);

            fetch('/api/profile/avatar', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + authToken },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) { showAlertModal(escapeHtml(data.error)); return; }
                suppressHistoryPush = true;
                openProfile(playerPseudo);
                suppressHistoryPush = false;
            });
        }

        function changePassword() {
            const currentPassword = document.getElementById('profile-current-password').value;
            const newPassword = document.getElementById('profile-new-password').value;
            const errorBox = document.getElementById('profile-password-error');
            const successBox = document.getElementById('profile-password-success');
            errorBox.style.display = 'none';
            successBox.style.display = 'none';

            fetch('/api/profile/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
                body: JSON.stringify({ currentPassword, newPassword })
            })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) {
                    errorBox.textContent = data.error || "Une erreur est survenue.";
                    errorBox.style.display = 'block';
                    return;
                }
                document.getElementById('profile-current-password').value = '';
                document.getElementById('profile-new-password').value = '';
                successBox.textContent = "Mot de passe mis à jour avec succès.";
                successBox.style.display = 'block';
            })
            .catch(() => {
                errorBox.textContent = "Impossible de contacter le serveur.";
                errorBox.style.display = 'block';
            });
        }

        // --- PANNEAU D'ADMINISTRATION ---

        function adminApiFetch(url, options = {}) {
            options.headers = Object.assign({ 'Authorization': 'Bearer ' + authToken }, options.headers || {});
            return fetch(url, options).then(res => res.json().then(data => ({ ok: res.ok, data })));
        }

        function openAdminPanel() {
            document.getElementById('admin-modal').style.display = 'flex';
            pushHistory({ modal: 'admin' });
            loadAdminPanel();
        }

        function loadAdminPanel() {
            const content = document.getElementById('admin-modal-content');
            content.innerHTML = '<div class="spinner-wrap"><span class="spinner"></span> Chargement…</div>';

            Promise.all([
                adminApiFetch('/api/admin/password-reset-requests'),
                adminApiFetch('/api/admin/users'),
                adminApiFetch('/api/admin/players')
            ]).then(([resets, users, players]) => {
                if (!resets.ok || !users.ok || !players.ok) {
                    content.innerHTML = "Impossible de charger le panneau d'administration.";
                    return;
                }
                renderAdminPanel(resets.data, users.data, players.data);
            }).catch(() => { content.innerHTML = "Impossible de contacter le serveur."; });
        }

        function renderAdminPanel(resetRequests, users, players) {
            let html = '<h2 class="profile-section-title">🛠️ Panneau d\'administration</h2>';

            // Demandes de réinitialisation de mot de passe
            html += '<div class="panel-section"><h3 class="panel-section-title">🔑 Demandes de réinitialisation de mot de passe</h3>';
            if (resetRequests.length === 0) {
                html += '<p class="admin-empty">Aucune demande en attente.</p>';
            } else {
                resetRequests.forEach(r => {
                    const date = new Date(r.requested_at).toLocaleString('fr-FR');
                    html += `
                        <div class="admin-row">
                            <div class="admin-row-info">
                                <strong>${escapeHtml(r.username)}</strong>
                                <span class="admin-meta">demandé le ${date}</span>
                            </div>
                            <div class="admin-row-actions">
                                <input type="text" id="reset-pw-${escapeHtml(r.username)}" placeholder="Nouveau mot de passe" class="admin-input-md">
                                <button class="btn-primary" data-username="${escapeHtml(r.username)}" onclick="adminResolveReset(this.dataset.username)">Valider</button>
                                <button class="btn-default" data-username="${escapeHtml(r.username)}" onclick="adminRejectReset(this.dataset.username)">Rejeter</button>
                            </div>
                        </div>`;
                });
            }
            html += '</div>';

            // Comptes utilisateurs
            html += '<div class="panel-section"><h3 class="panel-section-title">👥 Comptes utilisateurs</h3>';
            if (users.length === 0) {
                html += '<p class="admin-empty">Aucun compte enregistré.</p>';
            } else {
                users.forEach(u => {
                    const isAdmin = u.role === 'admin';
                    const roleBadge = isAdmin ? '<span class="role-badge admin">Admin</span>' : '<span class="role-badge">Utilisateur</span>';
                    const created = u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '-';
                    const nextRole = isAdmin ? 'user' : 'admin';
                    const roleActionLabel = isAdmin ? 'Rétrograder' : 'Promouvoir admin';
                    html += `
                        <div class="admin-row">
                            <div class="admin-row-info">
                                ${miniAvatarHtml(u.username, u.avatar_path)}
                                <span class="profile-link" data-pseudo="${escapeHtml(u.username)}" onclick="openProfile(this.dataset.pseudo)">${escapeHtml(u.username)}</span>
                                ${roleBadge}
                                <span class="admin-meta">inscrit le ${created} · vu le ${formatLastSeen(u.last_login)}</span>
                            </div>
                            <div class="admin-row-actions">
                                <input type="text" id="rename-${escapeHtml(u.username)}" value="${escapeHtml(u.username)}" class="admin-input-sm">
                                <button class="btn-default" data-username="${escapeHtml(u.username)}" onclick="adminRenameUser(this.dataset.username)">Renommer</button>
                                <button class="btn-default" data-username="${escapeHtml(u.username)}" data-role="${nextRole}" onclick="adminSetRole(this.dataset.username, this.dataset.role)">${roleActionLabel}</button>
                            </div>
                        </div>`;
                });
            }
            html += '</div>';

            // Sessions de jeu
            html += '<div class="panel-section"><h3 class="panel-section-title">🎮 Sessions de jeu</h3>';
            if (players.length === 0) {
                html += '<p class="admin-empty">Aucune session enregistrée.</p>';
            } else {
                const now = Date.now();
                html += `<div class="admin-table-wrap"><table class="admin-table">
                    <thead><tr><th>Pseudo</th><th>Mode</th><th>Score</th><th>Statut</th><th>Actions</th></tr></thead>
                    <tbody>`;
                players.forEach(p => {
                    const isInfini = p.mode.includes("999999");
                    const isActive = isInfini ? p.end_time > 0 : p.end_time > now;
                    const statusHtml = isActive ? '<span class="status-pill active">En cours</span>' : '<span class="status-pill ended">Terminé/Attente</span>';
                    html += `
                        <tr>
                            <td><strong>${escapeHtml(p.pseudo)}</strong></td>
                            <td>${formatModeLabel(p.mode)}</td>
                            <td><strong>${p.score}</strong></td>
                            <td>${statusHtml}</td>
                            <td>
                                <button class="btn-default" data-pseudo="${escapeHtml(p.pseudo)}" data-mode="${escapeHtml(p.mode)}" onclick="adminResetSession(this.dataset.pseudo, this.dataset.mode)">Mettre à 0</button>
                                <button class="btn-danger" data-pseudo="${escapeHtml(p.pseudo)}" data-mode="${escapeHtml(p.mode)}" onclick="adminDeleteSession(this.dataset.pseudo, this.dataset.mode)">Supprimer</button>
                            </td>
                        </tr>`;
                });
                html += '</tbody></table></div>';
            }
            html += '</div>';

            // Zone dangereuse
            html += `
                <div class="panel-section admin-danger-zone">
                    <h3 class="panel-section-title admin-danger-title">⚠️ Zone dangereuse</h3>
                    <p class="admin-empty">Efface définitivement tous les scores et statistiques de tous les joueurs (les comptes utilisateurs sont conservés).</p>
                    <button class="btn-danger" onclick="adminNukeDB()">Tout effacer</button>
                </div>`;

            document.getElementById('admin-modal-content').innerHTML = html;
        }

        function adminResolveReset(username) {
            const input = document.getElementById('reset-pw-' + username);
            const newPassword = input.value;
            if (!newPassword || newPassword.length < 6) {
                showAlertModal("Le nouveau mot de passe doit contenir au moins 6 caractères.");
                return;
            }
            adminApiFetch(`/api/admin/password-reset-requests/${encodeURIComponent(username)}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            }).then(({ ok, data }) => {
                if (!ok) { showAlertModal(escapeHtml(data.error || "Erreur.")); return; }
                showAlertModal(`Nouveau mot de passe défini pour <strong>${escapeHtml(username)}</strong>. Communiquez-le-lui : <strong>${escapeHtml(newPassword)}</strong>`, "Mot de passe réinitialisé");
                loadAdminPanel();
            });
        }

        function adminRejectReset(username) {
            showConfirmModal({
                title: 'Rejeter la demande',
                message: `Rejeter la demande de réinitialisation de "${escapeHtml(username)}" ?`,
                confirmLabel: 'Rejeter',
                danger: true,
                onConfirm: () => {
                    adminApiFetch(`/api/admin/password-reset-requests/${encodeURIComponent(username)}`, { method: 'DELETE' })
                        .then(() => loadAdminPanel());
                }
            });
        }

        function adminRenameUser(oldUsername) {
            const newUsername = document.getElementById('rename-' + oldUsername).value.trim();
            if (newUsername === oldUsername) return;
            showConfirmModal({
                title: 'Renommer le compte',
                message: `Renommer "${escapeHtml(oldUsername)}" en "${escapeHtml(newUsername)}" ? Ses scores et son profil seront conservés.`,
                confirmLabel: 'Renommer',
                onConfirm: () => {
                    adminApiFetch('/api/admin/rename-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ oldUsername, newUsername })
                    }).then(({ ok, data }) => {
                        if (!ok) { showAlertModal(escapeHtml(data.error || "Erreur.")); return; }
                        loadAdminPanel();
                    });
                }
            });
        }

        function adminSetRole(username, role) {
            const action = role === 'admin' ? 'promouvoir administrateur' : 'rétrograder en utilisateur standard';
            showConfirmModal({
                title: 'Confirmer le changement de rôle',
                message: `Confirmer : ${action} le compte "${escapeHtml(username)}" ?`,
                confirmLabel: 'Confirmer',
                onConfirm: () => {
                    adminApiFetch('/api/admin/set-role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, role })
                    }).then(({ ok, data }) => {
                        if (!ok) { showAlertModal(escapeHtml(data.error || "Erreur.")); return; }
                        loadAdminPanel();
                    });
                }
            });
        }

        function adminResetSession(pseudo, mode) {
            showConfirmModal({
                title: 'Remettre le score à zéro',
                message: `Remettre le score de "${escapeHtml(pseudo)}" à zéro sur ce mode ?`,
                confirmLabel: 'Remettre à zéro',
                danger: true,
                onConfirm: () => {
                    adminApiFetch(`/api/admin/reset/${encodeURIComponent(pseudo)}/${encodeURIComponent(mode)}`, { method: 'POST' })
                        .then(() => loadAdminPanel());
                }
            });
        }

        function adminDeleteSession(pseudo, mode) {
            showConfirmModal({
                title: 'Supprimer la session',
                message: `Supprimer la session de "${escapeHtml(pseudo)}" sur ce mode ?`,
                confirmLabel: 'Supprimer',
                danger: true,
                onConfirm: () => {
                    adminApiFetch(`/api/admin/player/${encodeURIComponent(pseudo)}/${encodeURIComponent(mode)}`, { method: 'DELETE' })
                        .then(() => loadAdminPanel());
                }
            });
        }

        function adminNukeDB() {
            showConfirmModal({
                title: 'Tout effacer',
                message: "ATTENTION ! Effacer tous les scores et statistiques de TOUS les joueurs ? Cette action est irréversible.",
                confirmLabel: 'Tout effacer définitivement',
                danger: true,
                onConfirm: () => {
                    adminApiFetch('/api/admin/nuke', { method: 'POST' })
                        .then(() => loadAdminPanel());
                }
            });
        }

        // === NAVIGATION PAR URL (boutons précédent/suivant du navigateur) ===
        let suppressHistoryPush = false;
        const initialHash = location.hash;

        function modeToContinentLabel(modeId) {
            const region = modeId.split('_')[0];
            return REGION_LABELS[region] || (region.charAt(0).toUpperCase() + region.slice(1));
        }

        function modeToDuration(modeId) {
            return parseInt(modeId.split('_')[1], 10) || 0;
        }

        function currentScreenState() {
            if (currentMode !== null && document.getElementById('game-screen').style.display !== 'none') {
                return { screen: 'game', mode: currentMode };
            }
            return { screen: 'menu' };
        }

        function stateToHash(state) {
            const p = new URLSearchParams();
            if (state.screen === 'game' && state.mode) p.set('mode', state.mode);
            if (state.modal === 'profile') { p.set('modal', 'profile'); p.set('user', state.modalUser || ''); }
            else if (state.modal === 'admin') p.set('modal', 'admin');
            else if (state.modal === 'auth') { p.set('modal', 'auth'); if (state.modalAuthMode) p.set('authMode', state.modalAuthMode); }
            const s = p.toString();
            return s ? ('#' + s) : location.pathname;
        }

        function pushHistory(extra) {
            if (suppressHistoryPush) return;
            const state = Object.assign(currentScreenState(), extra || {});
            history.pushState(state, '', stateToHash(state));
        }

        history.replaceState({ screen: 'menu' }, '', location.pathname);

        window.addEventListener('popstate', (e) => {
            suppressHistoryPush = true;
            const state = e.state || { screen: 'menu' };

            document.getElementById('auth-modal').style.display = 'none';
            document.getElementById('profile-modal').style.display = 'none';
            document.getElementById('admin-modal').style.display = 'none';

            const onGameScreen = currentMode !== null && document.getElementById('game-screen').style.display !== 'none';
            if (state.screen === 'game' && state.mode) {
                if (!onGameScreen || currentMode !== state.mode) {
                    openLobby(state.mode, modeToContinentLabel(state.mode), modeToDuration(state.mode));
                }
            } else if (onGameScreen) {
                goToMenu();
            }

            if (state.modal === 'profile') openProfile(state.modalUser);
            else if (state.modal === 'admin') openAdminPanel();
            else if (state.modal === 'auth') openAuthModal(state.modalAuthMode || 'login', '', false);

            suppressHistoryPush = false;
        });

        renderAccountArea();
        if (authToken) {
            fetch('/api/me', { headers: { 'Authorization': 'Bearer ' + authToken } })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        currentUserRole = data.role || 'user';
                        renderAccountArea();
                    }
                })
                .catch(() => {});
        }
        if (!authToken && !localStorage.getItem('flagGameAuthPromptDismissed')) {
            openAuthModal('register', isNewVisitor ? '' : playerPseudo, true);
        }

        const socket = io();

        let currentDuration = 0;
        let overrideCountryIds = null; // pays imposés (mode révision / duel) au lieu du filtre par continent
        let activeCountries = [];
        let guessedCountries = new Set();
        let selectedCountryId = null;
        let myEndTime = 0;
        let timerInterval = null;
        let isGameActive = false;
        let isGameFinished = false;
        let gameFinishReported = false;

        function generateModesMenu() {
            const container = document.getElementById("modes-container");
            const regions = ["Monde", "Europe", "Afrique", "Asie", "Amérique", "Océanie"];
            const durations = [3, 10, 20, 999999];

            let html = `<div class="category-container region-revision">
                            <div class="category-title">Révision ciblée</div>
                            <div class="revision-hint" id="revision-hint-text">Rejouez uniquement les drapeaux sur lesquels vous vous trompez le plus.</div>
                            <div class="duration-buttons">
                                <button class="btn-mode" id="btn-revision" onclick="openRevisionMode()" disabled>Réviser mes drapeaux faibles</button>
                            </div>
                        </div>`;

            regions.forEach(region => {
                const slug = region.toLowerCase().normalize("NFD").replace(DIACRITICS_REGEX_JS, "");
                html += `<div class="category-container region-${slug}">
                                <div class="category-title">Zone : ${region}</div>
                                <div class="duration-buttons">`;
                durations.forEach(min => {
                    const modeId = `${slug}_${min}`;
                    const label = min === 999999 ? "Infini (Practice)" : `${min} minutes`;
                    html += `<button class="btn-mode" onclick="openLobby('${modeId}', '${region}', ${min})">${label}</button>`;
                });
                html += `</div></div>`;
            });
            container.innerHTML = html;
        }

        // Grise le mode révision tant qu'il n'y a pas assez de statistiques personnelles pour le proposer
        function refreshRevisionAvailability() {
            const btn = document.getElementById('btn-revision');
            const hint = document.getElementById('revision-hint-text');
            if (!btn) return;
            fetch(`/api/profile/${encodeURIComponent(playerPseudo)}/weak-flags`)
                .then(res => res.json())
                .then(data => {
                    const available = !!(data.countryIds && data.countryIds.length >= 3);
                    btn.disabled = !available;
                    if (hint) {
                        hint.textContent = available
                            ? "Rejouez uniquement les drapeaux sur lesquels vous vous trompez le plus."
                            : "Débloqué après quelques parties jouées (pour identifier vos drapeaux faibles).";
                    }
                })
                .catch(() => {});
        }

        generateModesMenu();
        refreshRevisionAvailability();
        socket.emit('login', { pseudo: playerPseudo, token: authToken });
        
        // Affichage initial de la sidebar (Menu)
        document.getElementById('menu-screen').style.display = 'block';
        document.getElementById('sidebar-menu').style.display = 'block';

        // Restauration d'un lien direct vers un mode (#mode=...)
        if (initialHash.startsWith('#mode=')) {
            const params = new URLSearchParams(initialHash.slice(1));
            const deepLinkMode = params.get('mode');
            if (deepLinkMode) {
                suppressHistoryPush = true;
                openLobby(deepLinkMode, modeToContinentLabel(deepLinkMode), modeToDuration(deepLinkMode));
                suppressHistoryPush = false;
                history.replaceState({ screen: 'game', mode: deepLinkMode }, '', stateToHash({ screen: 'game', mode: deepLinkMode }));
            }
        }

        function normalizeString(str) {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().trim();
        }

        function goToMenu() {
            document.getElementById('game-screen').style.display = 'none';
            document.getElementById('sidebar-game').style.display = 'none';
            document.getElementById('menu-screen').style.display = 'block';
            document.getElementById('sidebar-menu').style.display = 'block';
            clearInterval(timerInterval);
            socket.emit('login', { pseudo: playerPseudo, token: authToken });
            refreshRevisionAvailability();
            pushHistory();
        }

        // MAJ DU CLASSEMENT GLOBAL (Affiché dans la Sidebar Menu)
        socket.on('global_leaderboards', (data) => {
            const now = Date.now();
            
            // 1. SESSIONS EN COURS DU JOUEUR (Toujours dans l'écran menu central)
            const activeSessions = data.filter(r => r.pseudo === playerPseudo && r.end_time > now);
            const activeContainer = document.getElementById('active-sessions-container');
            const activeList = document.getElementById('active-sessions-list');

            if (activeSessions.length > 0 && document.getElementById('menu-screen').style.display !== 'none') {
                activeContainer.style.display = 'block';
                let activeHtml = '';
                activeSessions.forEach(session => {
                    const parts = session.mode.split('_');
                    const regionName = REGION_LABELS[parts[0]] || (parts[0].charAt(0).toUpperCase() + parts[0].slice(1));
                    const durationStr = parts[1] === "999999" ? "Infini" : `${parts[1]} min`;
                    const minLeft = parts[1] === "999999" ? "∞" : (Math.floor((session.end_time - now) / 60000) + 1) + " min";
                    const resumeCall = parts[0] === 'revision' ? 'openRevisionMode()' : `openLobby('${session.mode}', '${regionName}', ${parts[1]})`;

                    activeHtml += `
                        <div class="active-session-card" onclick="${resumeCall}">
                            <div>
                                <div class="active-session-header">
                                    <h3><span class="pulse-indicator"></span> ${regionName} (${durationStr})</h3>
                                </div>
                                <p class="active-session-line">Score : <strong class="score-value">${session.score} pts</strong></p>
                                <p class="active-session-line">Temps restant : ${minLeft}</p>
                            </div>
                            <button class="btn-primary active-session-resume">Reprendre</button>
                        </div>
                    `;
                });
                activeList.innerHTML = activeHtml;
            } else {
                activeContainer.style.display = 'none';
            }

            // 2. CLASSEMENT GLOBAL TOTAL (Affiché dans la Sidebar gauche)
            const playerTotals = {};
            data.forEach(row => {
                if (!playerTotals[row.pseudo]) {
                    // Si on a l'info 'online' venant du serveur, on l'utilise
                    playerTotals[row.pseudo] = { score: 0, online: row.online || false, avatar_path: row.avatar_path || null };
                }
                playerTotals[row.pseudo].score += row.score;
                if(row.online) playerTotals[row.pseudo].online = true;
            });

            const sortedPlayers = Object.entries(playerTotals)
                .map(([pseudo, stats]) => ({ pseudo, ...stats }))
                .sort((a, b) => b.score - a.score);

            let html = '<ul class="leaderboard-list">';
            sortedPlayers.slice(0, 15).forEach((p, i) => {
                const isMe = p.pseudo === playerPseudo;
                const dotClass = p.online ? 'status-dot online' : 'status-dot';
                const rankMarker = i === 0
                    ? '<span class="stamp-badge" title="1er au classement général">1er</span>'
                    : `<span class="rank-index">#${i + 1}</span>`;
                html += `
                    <li class="${isMe ? 'li-me' : ''}">
                        <span class="player-info">
                            ${rankMarker}
                            <span class="${dotClass}"></span>
                            ${miniAvatarHtml(p.pseudo, p.avatar_path)}
                            <span class="profile-link" data-pseudo="${escapeHtml(p.pseudo)}" onclick="openProfile(this.dataset.pseudo)">${escapeHtml(p.pseudo)}</span>
                            ${challengeButtonHtml(p)}
                        </span>
                        <span class="score-value">${p.score}</span>
                    </li>`;
            });
            html += '</ul>';
            document.getElementById('global-leaderboard-side').innerHTML = html || "Aucune donnée.";
        });

        // OUVERTURE D'UNE SESSION DE JEU
        // Mode révision : rejoue uniquement les drapeaux où le taux personnel de réussite est le plus faible
        function openRevisionMode() {
            fetch(`/api/profile/${encodeURIComponent(playerPseudo)}/weak-flags`)
                .then(res => res.json())
                .then(data => {
                    if (!data.countryIds || data.countryIds.length < 3) {
                        showAlertModal("Pas encore assez de statistiques pour un mode révision : jouez quelques parties d'abord !");
                        return;
                    }
                    overrideCountryIds = data.countryIds;
                    openLobby('revision_999999', 'Révision ciblée', 999999);
                })
                .catch(() => showAlertModal("Impossible de charger vos statistiques de révision."));
        }

        function openLobby(modeId, filterContinent, durationMin) {
            currentMode = modeId;
            currentDuration = durationMin;
            isGameFinished = false;
            gameFinishReported = false;
            document.getElementById('results-container').style.display = 'none';

            // Gestion de l'affichage
            document.getElementById('menu-screen').style.display = 'none';
            document.getElementById('sidebar-menu').style.display = 'none';
            document.getElementById('game-screen').style.display = 'block';
            document.getElementById('sidebar-game').style.display = 'block';
            
            const durationLabel = durationMin === 999999 ? "Infini" : `${durationMin} min`;
            document.getElementById('current-mode-title').textContent = `Module : ${filterContinent} (${durationLabel})`;

            if (overrideCountryIds) {
                const ids = overrideCountryIds;
                overrideCountryIds = null;
                activeCountries = ids.map(id => allCountries.find(c => c.id === id)).filter(Boolean);
            } else if (filterContinent === 'Monde' || filterContinent.toLowerCase() === 'monde') {
                activeCountries = [...allCountries];
            } else {
                const filtered = allCountries.filter(c => c.continent.toLowerCase() === filterContinent.toLowerCase());
                activeCountries = filtered.length > 0 ? filtered : [...allCountries];
            }
            activeCountries.sort(() => Math.random() - 0.5);

            socket.emit('get_flag_stats', { mode: modeId, pseudo: playerPseudo, countryIds: activeCountries.map(c => c.id) });

            socket.emit('join_lobby', { pseudo: playerPseudo, mode: modeId });
            guessedCountries = new Set();
            myEndTime = 0;
            setGameActive(false); 
            otherPlayers = [{ pseudo: playerPseudo, score: 0, end_time: 0, online: true }];
            updateLeaderboardUI();
            pushHistory();
        }

        socket.on('sync_state', (state) => {
            guessedCountries = new Set(state.found_countries);
            myEndTime = state.end_time;
            
            if (myEndTime > Date.now()) {
                setGameActive(true);
            } else {
                setGameActive(false);
            }
        });

        function startRun() {
            socket.emit('start_run', { pseudo: playerPseudo, mode: currentMode, durationMinutes: currentDuration });
            myEndTime = Date.now() + currentDuration * 60000;
            isGameFinished = false;
            gameFinishReported = false;
            document.getElementById('results-container').style.display = 'none';
            guessedCountries.clear();
            otherPlayers = [{ pseudo: playerPseudo, score: 0, end_time: myEndTime, online: true }];
            updateLeaderboardUI();
            setGameActive(true);
        }

        socket.on('run_started', (data) => {
            myEndTime = data.end_time;
            isGameFinished = false;
            gameFinishReported = false;
            document.getElementById('results-container').style.display = 'none';
            guessedCountries.clear();
            setGameActive(true);
        });

        function resetRun() {
            showConfirmModal({
                title: 'Arrêter la session',
                message: "Confirmer l'arrêt de la session en cours ? Votre score actuel sera enregistré et vos résultats finaux vont s'afficher.",
                confirmLabel: 'Arrêter la session',
                danger: true,
                onConfirm: () => {
                    socket.emit('reset_run', { pseudo: playerPseudo, mode: currentMode });
                    myEndTime = Date.now();
                    isGameFinished = true;
                    setGameActive(false);
                    otherPlayers = [{ pseudo: playerPseudo, score: guessedCountries.size, end_time: Date.now(), online: true }];
                    updateLeaderboardUI();
                }
            });
        }

        socket.on('run_reset', () => {
            myEndTime = 0;
            isGameFinished = true; 
            setGameActive(false);
        });

        function setGameActive(active) {
            isGameActive = active;
            const overlay = document.getElementById("lock-overlay");
            const flagsGrid = document.getElementById("flags-grid");
            const btnStart = document.getElementById("btn-start");
            const btnReset = document.getElementById("btn-reset");
            
            if (active) {
                if (overlay) overlay.style.display = "none";
                flagsGrid.style.display = "grid";
                btnStart.style.display = "none";
                btnReset.style.display = "inline-block";
                startLocalTimer();
            } else {
                clearInterval(timerInterval);
                disableInput();
                
                if (isGameFinished) {
                    if (overlay) overlay.style.display = "none";
                    flagsGrid.style.display = "grid";
                    document.getElementById('guess-input').placeholder = "Session terminée. Voici les réponses !";
                    btnStart.style.display = "inline-block";
                    btnStart.textContent = "Recommencer";
                    btnReset.style.display = "none";
                    reportGameFinished();
                } else {
                    if (overlay) overlay.style.display = "none";
                    flagsGrid.style.display = "none";
                    btnStart.style.display = "inline-block";
                    btnStart.textContent = "Démarrer la session";
                    btnReset.style.display = "none";
                }
                document.getElementById('main-timer').textContent = "00:00";
            }
            
            renderGrid();
        }

        // Envoie au serveur les résultats de la partie pour mettre à jour les statistiques de validation
        function reportGameFinished() {
            if (gameFinishReported) return;
            gameFinishReported = true;
            socket.emit('game_finished', {
                pseudo: playerPseudo,
                mode: currentMode,
                countryIds: activeCountries.map(c => c.id),
                foundIds: Array.from(guessedCountries)
            });
        }

        // Affichage du tableau récapitulatif des taux de validation (global et personnel) par drapeau
        socket.on('flag_stats_result', (data) => {
            if (data.mode !== currentMode) return;
            renderResultsTable(data.stats);
        });

        function renderResultsTable(stats) {
            const sorted = [...stats].sort((a, b) => b.globalPercent - a.globalPercent);
            let html = '';

            sorted.forEach(stat => {
                const country = allCountries.find(c => c.id === stat.country_id);
                if (!country) return;

                let flagSrc = `https://flagcdn.com/${country.id}.svg`;
                if (country.id === 'af') {
                    flagSrc = "https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_the_Taliban.svg";
                }

                html += `
                    <div class="result-row">
                        <div class="result-flag"><img src="${flagSrc}" alt="${country.name}"></div>
                        <div class="result-name">${country.name}</div>
                        <div class="result-stat global">
                            <span class="result-percent">${stat.globalPercent}%</span>
                            <div class="result-bar-bg"><div class="result-bar global" style="width:${stat.globalPercent}%"></div></div>
                        </div>
                        <div class="result-stat personal">
                            <span class="result-percent">${stat.personalPercent}%</span>
                            <div class="result-bar-bg"><div class="result-bar personal" style="width:${stat.personalPercent}%"></div></div>
                        </div>
                    </div>
                `;
            });

            document.getElementById('results-table').innerHTML = html;
            document.getElementById('results-container').style.display = 'block';
        }

        function renderGrid() {
            const grid = document.getElementById("flags-grid");
            grid.innerHTML = "";
            selectedCountryId = null;

            activeCountries.forEach(country => {
                const isGuessed = guessedCountries.has(country.id);
                
                let cardClass = "";
                if (isGuessed) {
                    cardClass = "guessed";
                } else if (isGameFinished) {
                    cardClass = "missed";
                }
                
                const card = document.createElement("div");
                card.className = `card ${cardClass}`;
                card.id = `card-${country.id}`;

                let flagSrc = `https://flagcdn.com/${country.id}.svg`;
                if (country.id === 'af') {
                    flagSrc = "https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_the_Taliban.svg";
                }

                card.innerHTML = `
                    <div class="flag-wrapper"><img src="${flagSrc}" class="flag" alt="Drapeau"></div>
                    <div class="country-input-box">${(isGuessed || isGameFinished) ? country.name : ""}</div>
                `;
                
                if (!isGuessed && isGameActive && !isGameFinished) {
                    card.onclick = () => selectCard(country.id);
                }
                
                grid.appendChild(card);
            });

            document.getElementById("score-display").textContent = `${guessedCountries.size} / ${activeCountries.length}`;

            if (isGameActive && !isGameFinished) {
                selectNextCard();
            } else {
                disableInput();
            }
        }

        function selectNextCard() {
            let startIndex = 0;
            if (selectedCountryId) {
                const currentIndex = activeCountries.findIndex(c => c.id === selectedCountryId);
                if (currentIndex !== -1) {
                    startIndex = currentIndex + 1;
                }
            }

            let nextIndex = -1;
            for (let i = startIndex; i < activeCountries.length; i++) {
                if (!guessedCountries.has(activeCountries[i].id)) {
                    nextIndex = i;
                    break;
                }
            }
            if (nextIndex === -1) {
                for (let i = 0; i < Math.min(startIndex, activeCountries.length); i++) {
                    if (!guessedCountries.has(activeCountries[i].id)) {
                        nextIndex = i;
                        break;
                    }
                }
            }

            if (nextIndex !== -1) {
                const nextCountry = activeCountries[nextIndex];
                selectCard(nextCountry.id);
                setTimeout(() => {
                    const card = document.getElementById(`card-${nextCountry.id}`);
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 50);
            } else {
                selectedCountryId = null;
                disableInput();
                document.getElementById('guess-input').placeholder = "Félicitations, vous avez tout trouvé !";
            }
        }

        function selectCard(id) {
            if (!isGameActive) return;
            document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
            selectedCountryId = id;
            document.getElementById(`card-${id}`).classList.add('selected');
            
            const input = document.getElementById("guess-input");
            input.disabled = false;
            input.placeholder = "Saisissez le nom du pays encadré...";
            input.value = "";
            input.focus();
        }

        function disableInput() {
            const input = document.getElementById("guess-input");
            input.disabled = true;
            if (isGameFinished) {
                input.placeholder = "Session terminée. Voici les réponses !";
            } else {
                input.placeholder = isGameActive ? "Sélectionnez un drapeau dans la grille..." : "En attente d'initialisation...";
            }
            input.value = "";
        }

        document.getElementById("guess-input").addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                if (isGameActive && !isGameFinished) {
                    selectNextCard();
                }
            }
        });

        document.getElementById("guess-input").addEventListener("input", (e) => {
            if (!selectedCountryId || !isGameActive) return;

            const guess = normalizeString(e.target.value);
            const targetCountry = activeCountries.find(c => c.id === selectedCountryId);
            
            let isCorrect = (guess === normalizeString(targetCountry.name));
            
            if (!isCorrect && targetCountry.alt) {
                isCorrect = targetCountry.alt.some(altName => guess === normalizeString(altName));
            }

            if (isCorrect) {
                guessedCountries.add(selectedCountryId);
                socket.emit('country_found', { pseudo: playerPseudo, mode: currentMode, countryId: selectedCountryId, guess: e.target.value });
                otherPlayers[0].score = guessedCountries.size;
                updateLeaderboardUI();
                
                const card = document.getElementById(`card-${selectedCountryId}`);
                card.className = "card guessed";
                card.querySelector('.country-input-box').textContent = targetCountry.name;
                card.onclick = null;
                document.getElementById("score-display").textContent = `${guessedCountries.size} / ${activeCountries.length}`;

                if (guessedCountries.size === activeCountries.length) {
                    isGameFinished = true;
                    myEndTime = Date.now();
                    otherPlayers[0].end_time = myEndTime;
                    setGameActive(false);
                } else {
                    selectNextCard();
                }
            }
        });

        // MAJ DU CLASSEMENT DU MODE ACTIF (Affiché dans la Sidebar Jeu)
        let otherPlayers = [];
        socket.on('leaderboard_update', (players) => {
            otherPlayers = players;
            updateLeaderboardUI();
        });

        function updateLeaderboardUI() {
            const list = document.getElementById('live-leaderboard');
            list.innerHTML = '';
            const now = Date.now();

            otherPlayers.forEach((p, index) => {
                const isMe = p.pseudo === playerPseudo;
                const dotClass = p.online ? 'status-dot online' : 'status-dot';
                
                let timerText = "Clôturé";
                let timerClass = "player-timer";
                if (p.end_time > now) {
                    if (p.end_time > now + 50000000000) { 
                        timerText = "∞";
                        timerClass = "player-timer active";
                    } else {
                        const secLeft = Math.floor((p.end_time - now) / 1000);
                        const m = String(Math.floor(secLeft / 60)).padStart(2, '0');
                        const s = String(secLeft % 60).padStart(2, '0');
                        timerText = `${m}:${s}`;
                        timerClass = "player-timer active";
                    }
                } else if (p.end_time === 0) {
                    timerText = "En attente";
                }

                const rankMarker = index === 0
                    ? '<span class="stamp-badge" title="1er sur ce module">1er</span>'
                    : `<span class="rank-index">#${index + 1}</span>`;

                list.innerHTML += `
                    <li class="${isMe ? 'li-me' : ''}">
                        <span class="player-info">
                            ${rankMarker}
                            <span class="${dotClass}"></span>
                            ${miniAvatarHtml(p.pseudo, p.avatar_path)}
                            <span class="profile-link" data-pseudo="${escapeHtml(p.pseudo)}" onclick="openProfile(this.dataset.pseudo)">${escapeHtml(p.pseudo)}</span>
                            ${challengeButtonHtml(p)}
                        </span>
                        <span class="player-score-block">
                            <div class="score-value">${p.score} pts</div>
                            <div class="player-best-score">Record : ${p.best_score || 0} pts${p.best_time_seconds != null ? ' en ' + formatDuration(p.best_time_seconds) : ''}</div>
                            <div class="${timerClass}">${timerText}</div>
                        </span>
                    </li>
                `;
            });
        }

        function startLocalTimer() {
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                const now = Date.now();
                const mainTimer = document.getElementById('main-timer');
                
                if (myEndTime > now) {
                    if (myEndTime > now + 50000000000) {
                        mainTimer.textContent = "∞";
                        mainTimer.classList.remove('timer-low');
                    } else {
                        const secLeft = Math.floor((myEndTime - now) / 1000);
                        const m = String(Math.floor(secLeft / 60)).padStart(2, '0');
                        const s = String(secLeft % 60).padStart(2, '0');
                        mainTimer.textContent = `${m}:${s}`;
                        mainTimer.classList.toggle('timer-low', secLeft <= 10);
                    }
                } else {
                    mainTimer.textContent = "Temps imparti écoulé";
                    mainTimer.classList.remove('timer-low');
                    isGameFinished = true;
                    setGameActive(false);
                }
                updateLeaderboardUI();
            }, 1000);
        }

        socket.on('time_up', () => {
            isGameFinished = true;
            setGameActive(false);
        });

        // Le serveur refuse d'écrire dans les stats d'un pseudo associé à un compte si on n'est pas connecté à ce compte
        socket.on('auth_required', ({ pseudo }) => {
            if (authToken) {
                // La session a expiré ou est invalide : il faut se reconnecter pour sauvegarder la partie
                localStorage.removeItem('flagGameToken');
                showAlertModal("Votre session a expiré. Veuillez vous reconnecter pour sauvegarder votre progression.", '', () => location.reload());
            } else if (pseudo === playerPseudo) {
                // Ce pseudo correspond à un compte existant : on en choisit un autre, libre
                localStorage.setItem('flagGamePseudo', generateGuestPseudo());
                showAlertModal("Ce pseudo est associé à un compte existant. Un nouveau pseudo invité vous a été attribué.", '', () => location.reload());
            }
        });

        // --- DÉFI / DUEL ENTRE JOUEURS EN LIGNE ---

        function challengeButtonHtml(p) {
            if (!p.online || p.pseudo === playerPseudo) return '';
            return `<button class="challenge-btn" title="Défier ${escapeHtml(p.pseudo)} en duel" data-pseudo="${escapeHtml(p.pseudo)}" onclick="event.stopPropagation(); challengePlayer(this.dataset.pseudo)">⚔️</button>`;
        }

        function challengePlayer(pseudo) {
            socket.emit('challenge_invite', { toPseudo: pseudo });
            showChallengeToast(`Défi envoyé à ${pseudo}. En attente de sa réponse…`, []);
        }

        function showChallengeToast(message, actions) {
            document.querySelectorAll('.challenge-toast').forEach(t => t.remove());
            const toast = document.createElement('div');
            toast.className = 'challenge-toast';
            toast.innerHTML = `<span>⚔️ ${message}</span>`;
            actions.forEach(({ label, cls, onClick }) => {
                const btn = document.createElement('button');
                btn.className = cls;
                btn.textContent = label;
                btn.onclick = () => { onClick(); toast.remove(); };
                toast.appendChild(btn);
            });
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 20000);
        }

        socket.on('challenge_received', ({ fromPseudo }) => {
            showChallengeToast(`<strong>${escapeHtml(fromPseudo)}</strong> vous défie en duel (3 min) !`, [
                { label: 'Accepter', cls: 'btn-primary', onClick: () => socket.emit('challenge_respond', { toPseudo: fromPseudo, accepted: true }) },
                { label: 'Refuser', cls: 'btn-default', onClick: () => socket.emit('challenge_respond', { toPseudo: fromPseudo, accepted: false }) }
            ]);
        });

        socket.on('challenge_failed', ({ reason }) => {
            showChallengeToast(reason || "Impossible d'envoyer le défi.", []);
        });

        socket.on('challenge_declined', ({ fromPseudo }) => {
            showChallengeToast(`${escapeHtml(fromPseudo)} a refusé votre défi.`, []);
        });

        socket.on('duel_start', ({ mode, countryIds, durationMinutes, opponent }) => {
            document.querySelectorAll('.challenge-toast').forEach(t => t.remove());
            overrideCountryIds = countryIds;
            openLobby(mode, 'Duel', durationMinutes);
            setTimeout(() => startRun(), 250);
            showChallengeToast(`Duel contre <strong>${escapeHtml(opponent)}</strong> — c'est parti !`, []);
        });

