// مفتاح Gemini API الافتراضي
let API_KEY = localStorage.getItem('user_gemini_api_key') || "AQ.Ab8RN6IJn-eSjyKPAHc-rcIIwZP4SIgRyMRsIeFnlXgj1HL-fw";

const storyBox = document.getElementById('story-box');
const choicesContainer = document.getElementById('choices-container');
const customActionInput = document.getElementById('custom-action');
const sendActionBtn = document.getElementById('send-action-btn');
const sceneImage = document.getElementById('scene-image');
const imageLoader = document.getElementById('image-loader');

// عناصر الإعدادات وقسم عن اللعبة
const toggleSettingsBtn = document.getElementById('toggle-settings-btn');
const toggleAboutBtn = document.getElementById('toggle-about-btn');
const settingsPanel = document.getElementById('settings-panel');
const aboutPanel = document.getElementById('about-panel');
const gamePanel = document.getElementById('game-panel');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const closeAboutBtn = document.getElementById('close-about-btn');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiBtn = document.getElementById('save-api-btn');

const themeDarkBtn = document.getElementById('theme-dark-btn');
const themeLightBtn = document.getElementById('theme-light-btn');
const fontSmallBtn = document.getElementById('font-small-btn');
const fontMediumBtn = document.getElementById('font-medium-btn');
const fontLargeBtn = document.getElementById('font-large-btn');

let chatHistory = [];

const systemPrompt = `أنت محرك ذكاء اصطناعي تفاعلي يقود لعبة مغامرة خيال علمي لا تنتهي مصممة ومبرمجة بواسطة (معاذ محمد عبد النبي).
المهمة:
1. إبقاء القصة مشوقة جداً، غامضة، وحافلة بالمغامرة في الفضاء وسفن النجوم.
2. سرد الأحداث بلغة عربية فصحى أدبية وبأسلوب ممتع.
3. اللعبة لا تنتهي أبداً وتستمر بتوليد أحداث وتحديات جديدة بناءً على قرارات اللاعب.
4. في نهاية كل رد، قم بإضافة سطر يحتوي على وصف باللغة الإنجليزية للمشهد الحالي لتوليد صورة له، ثم 3 خيارات للمستخدم بصيغة واضحة كالتالي:
القصة: [وصف الأحداث الممتعة]
المشهد: [وصف قصير ومحدد باللغة الإنجليزية للمشهد البصري لاستخدامه في إنشاء الصورة]
الخيار 1: [الخيار الأول]
الخيار 2: [الخيار الثاني]
الخيار 3: [الخيار الثالث]`;

// تهيئة مفتاح API في واجهة الإعدادات
if (API_KEY) {
    apiKeyInput.value = API_KEY;
}

saveApiBtn.addEventListener('click', () => {
    const val = apiKeyInput.value.trim();
    if (val) {
        API_KEY = val;
        localStorage.setItem('user_gemini_api_key', val);
        alert('تم حفظ مفتاح API الجديد بنجاح!');
        startAdventure();
    }
});

// إدارة التنقل والإعدادات
toggleSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
    aboutPanel.classList.add('hidden');
    gamePanel.classList.toggle('hidden');
});

toggleAboutBtn.addEventListener('click', () => {
    aboutPanel.classList.toggle('hidden');
    settingsPanel.classList.add('hidden');
    gamePanel.classList.toggle('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
    gamePanel.classList.remove('hidden');
});

closeAboutBtn.addEventListener('click', () => {
    aboutPanel.classList.add('hidden');
    gamePanel.classList.remove('hidden');
});

// التبديل بين الوضع الداكن والفاتح
themeDarkBtn.addEventListener('click', () => {
    document.body.classList.remove('light-mode');
    themeDarkBtn.classList.add('active');
    themeLightBtn.classList.remove('active');
});

themeLightBtn.addEventListener('click', () => {
    document.body.classList.add('light-mode');
    themeLightBtn.classList.add('active');
    themeDarkBtn.classList.remove('active');
});

// التحكم بحجم الخط
fontSmallBtn.addEventListener('click', () => setFontSize('0.9rem', fontSmallBtn));
fontMediumBtn.addEventListener('click', () => setFontSize('1.05rem', fontMediumBtn));
fontLargeBtn.addEventListener('click', () => setFontSize('1.2rem', fontLargeBtn));

function setFontSize(size, activeBtn) {
    document.documentElement.style.setProperty('--font-size', size);
    [fontSmallBtn, fontMediumBtn, fontLargeBtn].forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
}

// زر الإجراء الحر
sendActionBtn.addEventListener('click', () => {
    const action = customActionInput.value.trim();
    if (action) {
        customActionInput.value = '';
        progressStory(action);
    }
});

customActionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendActionBtn.click();
    }
});

// دالة لتوليد وعرض صورة المشهد بالذكاء الاصطناعي بناءً على وصف الحدث
function updateSceneImage(imagePrompt) {
    imageLoader.classList.remove('hidden');
    sceneImage.classList.add('hidden');
    imageLoader.innerText = "جاري رسم المشهد الفضائي بالذكاء الاصطناعي... 🎨";

    const cleanPrompt = encodeURIComponent("sci-fi futuristic space adventure, " + imagePrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=800&height=400&seed=${Math.floor(Math.random() * 1000000)}&nologo=true`;

    sceneImage.src = imageUrl;
    sceneImage.onload = () => {
        imageLoader.classList.add('hidden');
        sceneImage.classList.remove('hidden');
    };
    sceneImage.onerror = () => {
        imageLoader.innerText = "🌌 مشهد الفضاء التفاعلي";
    };
}

// الاتصال بـ Gemini API مع تجربة الإصدارات المختلفة التلقائية لضمان العمل
async function callGeminiAPI(promptText) {
    // استخدام نموذج gemini-1.5-flash بطلب موحد
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    chatHistory.push({ role: "user", parts: [{ text: promptText }] });

    const payload = {
        system_instruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: chatHistory
    };

    try {
        storyBox.innerHTML += `<p class="story-paragraph loading-text">جاري معالجة أحداث الفضاء بالذكاء الاصطناعي...</p>`;
        storyBox.scrollTop = storyBox.scrollHeight;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        const loadingEls = storyBox.querySelectorAll('.loading-text');
        loadingEls.forEach(el => el.remove());

        if (response.ok && data.candidates && data.candidates[0].content) {
            const replyText = data.candidates[0].content.parts[0].text;
            chatHistory.push({ role: "model", parts: [{ text: replyText }] });
            return replyText;
        } else {
            let errDetail = (data.error && data.error.message) ? data.error.message : 'يرجى التحقق من مفتاح الـ API في قسم الإعدادات.';
            throw new Error(errDetail);
        }
    } catch (error) {
        console.error(error);
        const loadingEls = storyBox.querySelectorAll('.loading-text');
        loadingEls.forEach(el => el.remove());
        appendStoryText(`❌ لم يتم الاتصال بالذكاء الاصطناعي: (${error.message}). يمكنك تحديث أو تغيير مفتاح الـ API من قسم الإعدادات بالأعلى.`, 'error-msg');
        return null;
    }
}

async function startAdventure() {
    storyBox.innerHTML = '';
    const initialPrompt = "ابدأ القصة: استيقظ البطل فجأة داخل كبسولة الأمان بمحطة فضائية مهجورة تدور حول كوكب مجهول، والإنذار الأحمر يضيء والممر الرئيسي مظلم تماماً.";
    const response = await callGeminiAPI(initialPrompt);
    if (response) {
        parseAndDisplayResponse(response);
    }
}

async function progressStory(actionText) {
    appendStoryText(`إجراءك الحالي: ${actionText}`, 'user-action');
    const response = await callGeminiAPI(`إجراء اللاعب: ${actionText}. واصل سرد المغامرة وأعطني أحداث جديدة، ووصف للمشهد بالإنجليزية، و3 خيارات.`);
    if (response) {
        parseAndDisplayResponse(response);
    }
}

function appendStoryText(text, className = 'story-paragraph') {
    const p = document.createElement('p');
    p.className = className;
    p.innerText = text;
    storyBox.appendChild(p);
    storyBox.scrollTop = storyBox.scrollHeight;
}

function parseAndDisplayResponse(text) {
    let choices = [];
    let imagePrompt = "glowing futuristic space station control room dark ambiance red neon warning lights";
    const lines = text.split('\n');
    let storyLines = [];
    
    for (let line of lines) {
        if (line.includes('المشهد:') || line.includes('المشهد')) {
            imagePrompt = line.replace(/.*المشهد:?/, '').trim();
        } else if (line.includes('الخيار 1:') || line.includes('الخيار 1') || line.startsWith('1.')) {
            choices.push(line.replace(/.*الخيار \d+:?/, '').trim());
        } else if (line.includes('الخيار 2:') || line.includes('الخيار 2') || line.startsWith('2.')) {
            choices.push(line.replace(/.*الخيار \d+:?/, '').trim());
        } else if (line.includes('الخيار 3:') || line.includes('الخيار 3') || line.startsWith('3.')) {
            choices.push(line.replace(/.*الخيار \d+:?/, '').trim());
        } else {
            storyLines.push(line);
        }
    }

    const cleanStory = storyLines.join('\n').trim();
    appendStoryText(cleanStory);

    // تحديث وتوليد صورة المشهد البصري للحدث
    updateSceneImage(imagePrompt);

    if (choices.length === 0) {
        choices = [
            "استكشاف لوحة التظليل الإلكترونية بجانب الباب.",
            "البحث في صناديق الإمدادات عن مصباح أو أداة.",
            "التقدم بحذر نحو الممر واستكشاف مصدر الصوت."
        ];
    }

    displayChoices(choices);
}

function displayChoices(choices) {
    choicesContainer.innerHTML = '';
    choices.forEach((choice, index) => {
        if (choice) {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = `الخيار ${index + 1}: ${choice}`;
            btn.addEventListener('click', () => {
                progressStory(choice);
            });
            choicesContainer.appendChild(btn);
        }
    });
}

// بدء اللعبة فوراً عند الفتح
window.addEventListener('DOMContentLoaded', () => {
    startAdventure();
});
