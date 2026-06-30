const ULTRAGAMER_CARDS = [
    { id: 'cascos-gaming', src: './assets/img/card_icons/CascosGaming.png' },
    { id: 'intel-core-logo', src: './assets/img/card_icons/IntelCoreLogo.png' },
    { id: 'mango-xbox-gaming', src: './assets/img/card_icons/MangoXboxGaming.png' },
    { id: 'mesa-gaming', src: './assets/img/card_icons/MesaGaming.png' },
    { id: 'microfono-gaming', src: './assets/img/card_icons/MicrofonoGaming.png' },
    { id: 'mochila-gaming', src: './assets/img/card_icons/MochilaGaming.png' },
    { id: 'monitor-gaming', src: './assets/img/card_icons/MonitorGaming.png' },
    { id: 'omen-portatil', src: './assets/img/card_icons/OmenPortatil.png' },
    { id: 'raton-gaming', src: './assets/img/card_icons/RatonGaming.png' },
    { id: 'silla-gaming', src: './assets/img/card_icons/SillasGaming.png' }
];

const DEFAULT_LEVELS = [
    { level: 1, pairs: 3, grid: 'grid-3x2', time: 10 },
    { level: 2, pairs: 4, grid: 'grid-4x2', time: 25 },
    { level: 3, pairs: 6, grid: 'grid-4x3', time: 40 },
    { level: 4, pairs: 8, grid: 'grid-4x4', time: 50 },
    { level: 5, pairs: 10, grid: 'grid-5x4', time: 60 }
];

class SoundManager {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    play(type) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const now = this.ctx.currentTime;

        if (type === 'match') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start();
            osc.stop(now + 0.2);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(130.81, now);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
            osc.start();
            osc.stop(now + 0.26);
        } else if (type === 'levelup') {
            osc.type = 'square';
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            });
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start();
            osc.stop(now + 0.42);
        } else if (type === 'alert') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start();
            osc.stop(now + 0.09);
        } else if (type === 'lose') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(261.63, now);
            osc.frequency.linearRampToValueAtTime(50, now + 0.8);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
            osc.start();
            osc.stop(now + 0.82);
        } else if (type === 'tick') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            gain.gain.setValueAtTime(0.02, now);
            osc.start();
            osc.stop(now + 0.03);
        }
    }
}

class CanvasParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.w = 0;
        this.h = 0;
        this.activeColor = '#3abff0';

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.loop();
    }

    resize() {
        this.w = this.canvas.width = window.innerWidth;
        this.h = this.canvas.height = window.innerHeight;
    }

    init(count = 50) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push(this.makeAmbientParticle());
        }
    }

    setColor(color) {
        this.activeColor = color;
    }

    burst(x, y, color, count = 30) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this.makeExplosionParticle(x, y, color));
        }
    }

    makeAmbientParticle() {
        return {
            x: Math.random() * this.w,
            y: Math.random() * this.h,
            size: Math.random() * 2 + 0.5,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -(Math.random() * 0.6 + 0.1),
            life: Math.random(),
            decay: 0.002,
            explosion: false,
            color: null
        };
    }

    makeExplosionParticle(x, y, color) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        return {
            x, y,
            size: Math.random() * 2.5 + 0.8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay: Math.random() * 0.03 + 0.015,
            explosion: true,
            color
        };
    }

    update() {
        this.particles = this.particles.filter(p => !p.explosion || p.life > 0);

        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.explosion) {
                p.life -= p.decay;
            } else {
                if (p.y < 0 || p.x < 0 || p.x > this.w) {
                    p.y = this.h;
                    p.x = Math.random() * this.w;
                    p.life = 0;
                }
                p.life = Math.min(p.life + p.decay * 0.5, 0.6);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.w, this.h);
        for (const p of this.particles) {
            const col = p.color || this.activeColor;
            const alpha = p.explosion ? p.life : Math.min(p.life, 0.4);

            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = col;
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = col;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

class MemoryChallenge {
    constructor() {
        this.lang = this.getInitialLang();
        this.currentLevelIndex = 0;
        this.score = 0;
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.timeLeft = 0;
        this.timerInterval = null;
        this.lastTickTime = 0;

        this.levels = this.loadLevels();
        this.sounds = new SoundManager();

        this.els = {
            canvas: document.getElementById('particleCanvas'),
            board: document.getElementById('game-board'),
            levelEl: document.getElementById('level-val'),
            scoreEl: document.getElementById('score-val'),
            timerBar: document.getElementById('timer-bar'),
            timerText: document.getElementById('timer-text'),
            feedbackText: document.getElementById('feedback-text'),
            initialScreen: document.getElementById('initial-screen'),
            mainModal: document.getElementById('main-modal'),
            loadingUI: document.getElementById('loading-ui'),
            startUI: document.getElementById('start-ui'),
            loadingBar: document.getElementById('loading-bar'),
            loadingText: document.getElementById('loading-text')
        };

        this.particles = new CanvasParticleSystem(this.els.canvas);
        this.particles.init(60);

        this.setupEvents();
        this.applyLang();
        this.preload();
    }

    getInitialLang() {
        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get('lang');
        if (urlLang === 'en') return 'en';
        return 'es';
    }

    _t(key, subs = {}) {
        let str = (STRINGS[this.lang] || STRINGS.es)[key] || key;
        for (const [k, v] of Object.entries(subs)) {
            str = str.replaceAll(`{${k}}`, v);
        }
        return str;
    }

    applyLang() {
        document.documentElement.lang = this.lang;
        document.getElementById('lbl-hud-level').textContent = this._t('level');
        document.getElementById('lbl-hud-score').textContent = this._t('score');
        document.getElementById('lbl-loading-title').textContent = this._t('loadingTitle');
        document.getElementById('lbl-game-title').innerHTML = this._t('gameTitle');
        document.getElementById('lbl-game-desc').textContent = this._t('gameDesc');
        document.getElementById('start-btn').textContent = this._t('btnStart');
        document.getElementById('lbl-score-label').textContent = this._t('scoreLabel');
        document.getElementById('restart-btn').textContent = this._t('btnRestart');
        document.getElementById('lbl-settings-title').textContent = this._t('settingsTitle');
        document.getElementById('save-settings-btn').textContent = this._t('lblSave');
        document.getElementById('reset-settings-btn').textContent = this._t('lblReset');
        document.getElementById('close-settings-btn').textContent = this._t('lblClose');
    }

    loadLevels() {
        const saved = localStorage.getItem('ultragamer_memory_levels');
        if (saved) return JSON.parse(saved);
        return JSON.parse(JSON.stringify(DEFAULT_LEVELS));
    }

    async preload() {
        const assets = [
            './assets/img/logos/main_logo.svg',
            './assets/img/logos/logo_ingame.svg',
            './assets/img/logos/logo_cards.svg',
            './assets/img/bg/background.png',
            ...ULTRAGAMER_CARDS.map(c => c.src)
        ];

        let loaded = 0;
        const total = assets.length;

        const loadAsset = (url) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = img.onerror = () => {
                    loaded++;
                    const pct = Math.floor((loaded / total) * 100);
                    if (this.els.loadingBar) this.els.loadingBar.style.width = `${pct}%`;
                    if (this.els.loadingText) this.els.loadingText.textContent = `${pct}%`;
                    resolve();
                };
                img.src = url;
            });
        };

        await Promise.all(assets.map(loadAsset));

        this.els.loadingUI.style.opacity = '0';
        await new Promise(r => setTimeout(r, 400));
        this.els.loadingUI.classList.add('hidden');

        this.els.mainModal.classList.remove('state-loading');
        this.els.mainModal.classList.add('state-start');

        await new Promise(r => setTimeout(r, 500));

        this.els.startUI.classList.remove('hidden');
        void this.els.startUI.offsetWidth;
        this.els.startUI.classList.add('active');
    }

    setupEvents() {
        document.getElementById('start-btn').onclick = () => {
            this.sounds.init();
            this.startLevel();
        };
        document.getElementById('restart-btn').onclick = () => {
            this.score = this.scoreBeforeLevel || 0;
            this.startLevel();
        };
        document.querySelector('.logo-area').onclick = (e) => {
            if (e.detail === 3 && this.isPlaying) this.openSettings();
        };
    }

    startLevel() {
        let config = this.levels[this.currentLevelIndex];
        if (!config) {
            const lastConfig = this.levels[this.levels.length - 1];
            config = {
                ...lastConfig,
                level: this.currentLevelIndex + 1
            };
        }
        this.scoreBeforeLevel = this.score;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.timeLeft = config.time;
        this.isPlaying = true;
        this.isPaused = false;

        document.body.classList.add('game-active');
        this.els.initialScreen.classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');

        this.els.levelEl.textContent = config.level;
        this.els.scoreEl.textContent = this.score;
        this.els.board.className = config.grid;
        this.els.board.innerHTML = '';

        this.els.timerBar.style.transition = 'width 0.1s linear';
        this.els.timerBar.classList.add('no-transition');
        this.els.timerBar.style.width = '100%';
        void this.els.timerBar.offsetWidth;
        this.els.timerBar.classList.remove('no-transition');

        document.documentElement.style.setProperty('--theme-color', 'var(--col-light-blue)');
        document.documentElement.style.setProperty('--theme-glow', 'rgba(58, 191, 240, 0.4)');
        document.documentElement.style.setProperty('--timer-border', 'var(--col-light-green)');
        this.particles.setColor('#3abff0');

        this.lastTickTime = performance.now();
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.tick(), 30);

        const levelPool = ULTRAGAMER_CARDS.slice(0, Math.min(ULTRAGAMER_CARDS.length, config.pairs));
        let cardPool = [...levelPool, ...levelPool];
        while (cardPool.length < config.pairs * 2) {
            const extra = ULTRAGAMER_CARDS[Math.floor(Math.random() * ULTRAGAMER_CARDS.length)];
            cardPool.push(extra, extra);
        }
        cardPool = cardPool.sort(() => Math.random() - 0.5);

        cardPool.forEach(data => {
            const card = this.createCard(data);
            this.els.board.appendChild(card);
        });
    }

    createCard(data) {
        const wrapper = document.createElement('div');
        wrapper.className = 'card-wrapper';
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = data.id;
        card.innerHTML = `
            <div class="card-face card-back">
                <img src="./assets/img/logos/logo_cards.svg" alt="Ultragamer Card Back" class="back-logo">
            </div>
            <div class="card-face card-front">
                <img src="${data.src}" alt="${data.id}" class="card-icon-img">
            </div>
        `;
        wrapper.appendChild(card);

        wrapper.onmousemove = (e) => {
            const rect = wrapper.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
            const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
            wrapper.style.transform = `perspective(1000px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg) scale(1.05)`;
        };
        wrapper.onmouseleave = () => {
            wrapper.style.transform = '';
        };

        wrapper.onclick = () => this.flipCard(card);
        return wrapper;
    }

    flipCard(card) {
        if (!this.isPlaying || card.classList.contains('flipped') || this.flippedCards.length === 2 || this.isPaused) return;

        this.sounds.play('tick');
        card.classList.add('flipped');
        this.flippedCards.push(card);
        if (this.flippedCards.length === 2) this.checkMatch();
    }

    checkMatch() {
        const [c1, c2] = this.flippedCards;
        if (c1.dataset.id === c2.dataset.id) {
            const speedBonus = Math.floor(this.timeLeft * 6);
            this.score += 150 + speedBonus;
            this.els.scoreEl.textContent = this.score;
            this.matchedPairs++;

            c1.classList.add('matched');
            c2.classList.add('matched');

            const r1 = c1.getBoundingClientRect();
            const r2 = c2.getBoundingClientRect();
            this.particles.burst(r1.left + r1.width / 2, r1.top + r1.height / 2, '#78bf89', 20);
            this.particles.burst(r2.left + r2.width / 2, r2.top + r2.height / 2, '#78bf89', 20);

            this.flippedCards = [];
            this.sounds.play('match');

            const config = this.levels[this.currentLevelIndex] || this.levels[this.levels.length - 1];
            if (this.matchedPairs === config.pairs) {
                this.isPlaying = false;
                clearInterval(this.timerInterval);
                setTimeout(() => this.nextLevel(), 450);
            }
        } else {
            this.sounds.play('error');

            c1.style.animation = 'shake 0.3s ease';
            c2.style.animation = 'shake 0.3s ease';
            setTimeout(() => {
                c1.style.animation = '';
                c2.style.animation = '';
            }, 300);

            const r1 = c1.getBoundingClientRect();
            this.particles.burst(r1.left + r1.width / 2, r1.top + r1.height / 2, '#ff3b30', 10);

            setTimeout(() => {
                c1.classList.remove('flipped');
                c2.classList.remove('flipped');
                this.flippedCards = [];
            }, 650);
        }
    }

    nextLevel() {
        const nextLevelNum = this.currentLevelIndex + 2;
        this.showFeedback(this._t('feedbackLvl', { lvl: nextLevelNum }));
        this.sounds.play('levelup');
        this.els.timerBar.style.transition = 'width 0.8s ease-out';
        this.els.timerBar.style.width = '100%';

        setTimeout(() => {
            this.currentLevelIndex++;
            this.startLevel();
        }, 800);
    }

    showFeedback(text) {
        this.els.feedbackText.textContent = text;
        this.els.feedbackText.classList.remove('show-feedback');
        void this.els.feedbackText.offsetWidth;
        this.els.feedbackText.classList.add('show-feedback');
    }

    tick() {
        if (this.isPaused) {
            this.lastTickTime = performance.now();
            return;
        }

        const now = performance.now();
        const delta = (now - this.lastTickTime) / 1000;
        this.lastTickTime = now;

        const oldSec = Math.ceil(this.timeLeft);
        this.timeLeft -= delta;
        const newSec = Math.ceil(this.timeLeft);

        if (this.timeLeft > 0 && this.timeLeft <= 5 && oldSec !== newSec) {
            this.sounds.play('alert');
        }

        this.updateTimerUI();

        if (this.timeLeft <= 0) {
            this.gameOver(this._t('resultTitleLose'));
        }
    }

    updateTimerUI() {
        const config = this.levels[this.currentLevelIndex] || this.levels[this.levels.length - 1];
        const pct = (this.timeLeft / config.time) * 100;
        this.els.timerBar.style.width = `${Math.max(0, pct)}%`;

        const secs = Math.floor(Math.max(0, this.timeLeft));
        const cents = Math.floor((Math.max(0, this.timeLeft) % 1) * 100);
        this.els.timerText.textContent = `${secs.toString().padStart(2, '0')}:${cents.toString().padStart(2, '0')}`;
    }

    gameOver(title) {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        this.sounds.play('lose');

        document.getElementById('result-title').textContent = title;
        document.getElementById('final-score').textContent = this.score;

        if (title === this._t('resultTitleWin')) {
            document.documentElement.style.setProperty('--theme-color', 'var(--col-light-green)');
            document.documentElement.style.setProperty('--theme-glow', 'var(--neon-green-glow)');
            this.particles.setColor('#78bf89');
        } else {
            document.documentElement.style.setProperty('--theme-color', 'var(--col-light-blue)');
            document.documentElement.style.setProperty('--theme-glow', 'rgba(58, 191, 240, 0.4)');
            this.particles.setColor('#3abff0');
        }

        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    openSettings() {
        this.isPaused = true;
        const modal = document.querySelector('#settings-screen .modal');

        modal.innerHTML = `
            <h2 class="settings-title">${this._t('settingsTitle')}</h2>
            <div id="settings-fields"></div>
            <div class="settings-buttons">
                <button id="save-settings-btn" class="btn">${this._t('lblSave')}</button>
                <button id="reset-settings-btn" class="btn btn-secondary">${this._t('lblReset')}</button>
                <button id="close-settings-btn" class="btn btn-dark">${this._t('lblClose')}</button>
            </div>
        `;

        document.getElementById('save-settings-btn').onclick = () => this.saveSettings();
        document.getElementById('reset-settings-btn').onclick = () => this.resetSettings();
        document.getElementById('close-settings-btn').onclick = () => {
            document.getElementById('settings-screen').classList.add('hidden');
            this.isPaused = false;
        };

        const container = document.getElementById('settings-fields');
        this.levels.forEach((lvl, i) => {
            const div = document.createElement('div');
            div.className = 'settings-row';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-weight: 700;">Nivel ${lvl.level === 5 ? '5+' : lvl.level}:</label>
                    <span id="val-display-${i}" style="font-weight: 900; color: var(--col-light-green); font-size: 1.15rem;">${lvl.time}s</span>
                </div>
                <input type="range" min="5" max="90" step="1" value="${lvl.time}" data-index="${i}" 
                    style="width: 100%; cursor: pointer;"
                    oninput="document.getElementById('val-display-${i}').textContent = this.value + 's'">
            `;
            container.appendChild(div);
        });

        document.getElementById('settings-screen').classList.remove('hidden');
    }

    saveSettings() {
        const inputs = document.querySelectorAll('#settings-fields input');
        inputs.forEach(input => {
            const index = parseInt(input.dataset.index);
            this.levels[index].time = parseInt(input.value) || 5;
        });
        localStorage.setItem('ultragamer_memory_levels', JSON.stringify(this.levels));

        const modal = document.querySelector('#settings-screen .modal');
        modal.innerHTML = `
            <div class="loader-container" style="display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; padding: 40px 10px;">
                <div class="brand-signature" style="font-size: 1.3rem; color: var(--col-light-blue);">${this._t('saving')}</div>
                <div class="loading-bar-wrapper" style="border-color: var(--col-light-blue); height: 14px; max-width: 320px;">
                    <div style="width: 0%; height: 100%; background: var(--col-light-blue); box-shadow: 0 0 10px var(--col-light-blue); animation: fillBar 1.2s forwards cubic-bezier(0.4, 0, 0.2, 1);"></div>
                </div>
                <div style="font-weight: 700; color: rgba(255,255,255,0.4); font-size: 0.95rem;">${this._t('wait')}</div>
            </div>
        `;

        this.showFeedback(this._t('feedbackSave'));
        setTimeout(() => location.reload(), 1200);
    }

    resetSettings() {
        const modal = document.querySelector('#settings-screen .modal');
        modal.innerHTML = `
            <h2 class="settings-title">${this._t('confirmTitle')}</h2>
            <p style="margin-bottom: 30px; text-align: center; color: rgba(255,255,255,0.5);">${this._t('confirmDesc')}</p>
            <div class="settings-buttons">
                <button id="confirm-reset-btn" class="btn btn-danger">${this._t('confirmYes')}</button>
                <button id="cancel-reset-btn" class="btn btn-secondary">${this._t('confirmNo')}</button>
            </div>
        `;

        document.getElementById('cancel-reset-btn').onclick = () => {
            this.openSettings();
        };

        document.getElementById('confirm-reset-btn').onclick = () => {
            localStorage.removeItem('ultragamer_memory_levels');
            modal.innerHTML = `
                <div class="loader-container" style="display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; padding: 40px 10px;">
                    <div class="brand-signature" style="font-size: 1.3rem; color: #ff3b30;">${this._t('resetting')}</div>
                    <div class="loading-bar-wrapper" style="height: 14px; max-width: 320px; border-color: #ff3b30;">
                        <div style="width: 0%; height: 100%; background: #ff3b30; box-shadow: 0 0 10px #ff3b30; animation: fillBar 1.2s forwards cubic-bezier(0.4, 0, 0.2, 1);"></div>
                    </div>
                </div>
            `;
            setTimeout(() => location.reload(), 1200);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new MemoryChallenge();
});
