class GameEngine {
    constructor() {
        this.hp = 100;
        this.score = 0;
        this.level = 1;
        this.apiKey = "YOUR_GEMINI_API_KEY_HERE";
        this.modelName = "gemini-1.5-flash";
        
        this.initUI();
    }

    initUI() {
        document.getElementById('settings-btn').addEventListener('click', () => this.toggleModal(true));
        document.getElementById('close-settings').addEventListener('click', () => this.toggleModal(false));
        document.getElementById('save-settings').addEventListener('click', () => {
            this.toggleModal(false);
            this.showNotification("تم حفظ الإعدادات بنجاح");
        });

        const savedTheme = localStorage.getItem('game_theme') || 'dark';
        document.getElementById('theme-select').value = savedTheme;
        this.applyTheme(savedTheme);

        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.applyTheme(e.target.value);
            localStorage.setItem('game_theme', e.target.value);
        });
    }

    toggleModal(show) {
        const modal = document.getElementById('settings-modal');
        if (show) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }

    applyTheme(theme) {
        const root = document.documentElement;
        if (theme === 'cyber') {
            root.style.setProperty('--bg-color', '#050505');
            root.style.setProperty('--card-bg', '#121212');
            root.style.setProperty('--primary-color', '#00ffcc');
            root.style.setProperty('--primary-hover', '#00bfa5');
            root.style.setProperty('--accent-color', '#ff007f');
            root.style.setProperty('--border-color', '#222');
        } else if (theme === 'fantasy') {
            root.style.setProperty('--bg-color', '#1a1005');
            root.style.setProperty('--card-bg', '#2d1b08');
            root.style.setProperty('--primary-color', '#d97706');
            root.style.setProperty('--primary-hover', '#b45309');
            root.style.setProperty('--accent-color', '#fbbf24');
            root.style.setProperty('--border-color', '#451a03');
        } else {
            root.style.setProperty('--bg-color', '#0f172a');
            root.style.setProperty('--card-bg', '#1e293b');
            root.style.setProperty('--primary-color', '#6366f1');
            root.style.setProperty('--primary-hover', '#4f46e5');
            root.style.setProperty('--accent-color', '#ec4899');
            root.style.setProperty('--border-color', '#334155');
        }
    }

    updateStats() {
        document.getElementById('player-hp').innerText = this.hp;
        document.getElementById('player-score').innerText = this.score;
        document.getElementById('game-level').innerText = `المستوى ${this.level}`;
    }

    async callGemini(promptText) {
        const loading = document.getElementById('story-loading');
        loading.classList.remove('hidden');
        
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: promptText
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            loading.classList.add('hidden');
            
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                return data.candidates[0].content.parts[0].text;
            } else {
                return "حدث خطأ أثناء معالجة القصة. يرجى المحاولة مرة أخرى.";
            }
        } catch (error) {
            loading.classList.add('hidden');
            console.error("Gemini API Error:", error);
            return "تعذر الاتصال بالخادم السحابي مباشرة. يبدو أنك في وضع غير متصل بالإنترنت، لكن مغامرتك مستمرة! اختر خطوتك القادمة بحكمة.";
        }
    }

    async startAdventure() {
        this.hp = 100;
        this.score = 10;
        this.level = 1;
        this.updateStats();

        const initialPrompt = "أنت محرك سرد ألعاب مغامرات تفاعلية باللغة العربية. ابدأ مغامرة جديدة خيالية ومثيرة للاعب في غابة مظلمة وغامضة. اكتب فقرة قصيرة مشوقة (حوالي 3-4 أسطر) تصف الموقف الحالي، ثم اعرض خيارين رئيسيين لللاعب.";
        
        const story = await this.callGemini(initialPrompt);
        this.displayStoryAndChoices(story, [
            { text: "التقدم نحو الكهف المظلم المخيف", action: () => this.makeChoice("cave") },
            { text: "البحث عن مسار آمن بجانب النهر", action: () => this.makeChoice("river") }
        ]);
    }

    async makeChoice(choiceType) {
        this.score += 20;
        this.level += 1;
        this.updateStats();

        let prompt = "";
        if (choiceType === "cave") {
            prompt = "اللاعب اختار دخول الكهف المظلم. اكتب مغامرة قصيرة عما وجده داخل الكهف، ثم أعطِ خيارين جديدين للتعامل مع الموقف.";
        } else {
            prompt = "اللاعب اختار السير بجانب النهر. اكتب مغامرة قصيرة عما واجهه بجانب النهر، ثم أعطِ خيارين جديدين.";
        }

        const story = await this.callGemini(prompt);
        this.displayStoryAndChoices(story, [
            { text: "مواجهة التحدي بشجاعة", action: () => this.makeChoice("challenge1") },
            { text: "الاستكشاف بحذر وتجنب الخطر", action: () => this.makeChoice("challenge2") },
        ]);
    }

    displayStoryAndChoices(storyText, choices) {
        document.getElementById('story-text').innerText = storyText;
        const container = document.getElementById('choices-container');
        container.innerHTML = '';

        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerHTML = `${choice.text} <i class="fa-solid fa-chevron-left"></i>`;
            btn.onclick = choice.action;
            container.appendChild(btn);
        });
    }

    showNotification(msg) {
        const btn = document.getElementById('save-settings');
        const originalText = btn.innerText;
        btn.innerText = msg;
        setTimeout(() => {
            btn.innerText = originalText;
        }, 2000);
    }
}

const game = new GameEngine();
