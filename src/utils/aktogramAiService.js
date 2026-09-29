// Intelligent Contextual & AI Comment Generation Engine for Aktogram

export const VIRTUAL_PLAYERS = [
  { id: "usr_ghost52", name: "Ghost52", handle: "@ghost52", avatarColor: "#00ff66" },
  { id: "usr_genesis", name: "Genesis_Gr", handle: "@genesis_gr", avatarColor: "#b026ff" },
  { id: "usr_nightrider", name: "NightRider", handle: "@night_rider", avatarColor: "#38bdf8" },
  { id: "usr_cyberphantom", name: "CyberPhantom", handle: "@cyber_phantom", avatarColor: "#ffb700" },
  { id: "usr_apexhunter", name: "ApexHunter", handle: "@apex_hunter", avatarColor: "#ef4444" },
  { id: "usr_vortex99", name: "Vortex99", handle: "@vortex_99", avatarColor: "#10b981" },
  { id: "usr_starlight", name: "Starlight_X", handle: "@starlight_x", avatarColor: "#ec4899" },
  { id: "usr_shadowalker", name: "ShadowWalker", handle: "@shadow_walker", avatarColor: "#6366f1" },
  { id: "usr_kitsune", name: "Kitsune_7", handle: "@kitsune7", avatarColor: "#f59e0b" },
  { id: "usr_zerocool", name: "ZeroCool", handle: "@zero_cool", avatarColor: "#a855f7" },
  { id: "usr_pixelwolf", name: "PixelWolf", handle: "@pixel_wolf", avatarColor: "#06b6d4" },
  { id: "usr_darknova", name: "DarkNova", handle: "@dark_nova", avatarColor: "#f43f5e" },
  { id: "usr_glitchcat", name: "GlitchCat", handle: "@glitch_cat", avatarColor: "#84cc16" },
  { id: "usr_echobyte", name: "EchoByte", handle: "@echo_byte", avatarColor: "#14b8a6" },
  { id: "usr_ironclad", name: "IronClad", handle: "@iron_clad", avatarColor: "#94a3b8" }
];

// Contextual reaction pools tailored to specific player events
const THEME_COMMENTS = {
  boss_fight: [
    "Ого, поздравляю! На этого босса реально куча нервов уходит ⚡",
    "С какого трая закрыл? У него во второй фазе тайминги атак просто безумные.",
    "Жестко! Я на нем завис часа на три, пока мувсет наизусть не выучил 😂",
    "Чистая победа! Главное не жадничать на ударах в этом бою.",
    "Красава! Один из самых потных боссов за всю игру 🔥",
    "Уважение за выдержку. А с каким оружием/билдом шел?"
  ],
  loot_drop: [
    "Вот это лакерство! Какой шанс дропа, 1%? 💎",
    "Поздравляю с дропом! Мне уже неделю одни дубликаты сыпет...",
    "Огонь! Статы топовые или ролл средний получился?",
    "Завидую белой завистью, теперь билд заиграет на максимум!",
    "Наконец-то гринд окупился! Сохрани обязательно 🔥",
    "Кайф! Долго фармил или чисто с рандомного захода упало?"
  ],
  visual_screenshot: [
    "Кадр просто космос! Сразу на рабочий стол просится 📸",
    "Свет и композиция топовые. Это на ультрах или с модами?",
    "Атмосфера 10 из 10. В динамике так же сочно выглядит?",
    "Шикарный ракурс поймал! В фоторежиме залипал?",
    "Чистый киберпанк / эстетика! Очень сочные цвета 💎",
    "Ради таких видов и хочется запускать эту игру 🔥"
  ],
  game_bugs: [
    "Хахаха, классика физических движков! Это не баг, это фича 😂",
    "Текстуры передают привет! Надеюсь, перезагрузка помогла?",
    "В мемориз однозначно 💀 Рэгдолл в этой игре умеет удивлять.",
    "О, у меня ровно такой же глитч был на прошлой неделе!",
    "Инди-разработка во всей красе, зато весело 😂",
    "Киберпанк, который мы заслужили)"
  ],
  story_lore: [
    "Ох, этот сюжетный поворот... Я сам сидел в шоке в финале.",
    "Без спойлеров, но дальше сюжет еще сильнее закрутится!",
    "Сколько часов уже наиграл? История затягивает нереально.",
    "Диалоги и постановка в этом моменте прямо до мурашек.",
    "Один из лучших сюжетных квестов за последнее время ⚡",
    "Концовка стоит каждого потраченного часа, поверь."
  ],
  game_build: [
    "Интересный сетап! Как по урону на боссах ощущается?",
    "Одобряю билд! Сам с похожей прокачкой бегал, комфортно разносит.",
    "А стамины/маны хватает на полную ротацию скиллов?",
    "Выглядит метово. Какие ключевые перки брал?",
    "Надо будет протестировать такую связку, выглядит мощно ⚡"
  ],
  new_game: [
    "Отличный выбор тайтла! Завидую, что проходишь в первый раз.",
    "Совет на старте: пылесось все сайд-квесты, там лучший лут.",
    "Приятного прохождения! Игра раскрывается на максимум через пару часов 🔥",
    "Осторожнее с прокачкой в начале, лучше качай универсальные скиллы.",
    "Добро пожаловать в комьюнити! Держи в курсе, как впечатления."
  ],
  dev_code: [
    "Коммит в прод без упавших тестов — день прожит не зря ⚡",
    "Красивый рефакторинг, архитектура стала намного чище.",
    "YAGNI и простота в действии. Меньше кода — меньше багов!",
    "Главное, чтобы завтра не пришлось хотфикс накатывать 😅",
    "Цветовая схема в IDE огонь, скинь название пресета!"
  ],
  general: [
    "Выглядит очень бодро, продолжай делиться! 🔥",
    "Чёткий пост, лайк однозначно ⚡",
    "Атмосферно получилось, подписался на обновления!",
    "Залип на пару минут, отличный контент в ленту 💎",
    "Ждём продолжения истории!"
  ]
};

// Detect event theme from post text and tags
export function detectPostTheme(text = "", tags = []) {
  const combined = `${text} ${tags.join(" ")}`.toLowerCase();

  if (/босс|boss|победил|убил|закрыл|траев|трая|мувсет|парирован|хардкор|сложно|difficulty|died/.test(combined)) {
    return "boss_fight";
  }
  if (/выбил|лут|loot|дроп|drop|легендар|сундук|нафармил|ролл|рандом|rare|крафт/.test(combined)) {
    return "loot_drop";
  }
  if (/баг|bug|глитч|glitch|застрял|текстур|провалился|краш|вылет|лаг|лаги|фпс|fps|физик/.test(combined)) {
    return "game_bugs";
  }
  if (/скрин|скриншот|фото|вид|пейзаж|графон|график|свет|шейдер|атмосфер|красив|обои|rtx/.test(combined)) {
    return "visual_screenshot";
  }
  if (/билд|build|прокачк|стат|скилл|перк|оружи|пушк|артефакт|ветк|комбо/.test(combined)) {
    return "game_build";
  }
  if (/сюжет|story|финал|концовк|концовка|прошел|лор|lore|квест|спойлер|истори/.test(combined)) {
    return "story_lore";
  }
  if (/купил|начал|купить|впервые|скачал|установил|новичок|первый раз|start/.test(combined)) {
    return "new_game";
  }
  if (/код|code|dev|коммит|рефактор|багфикс|тест|git|rust|react|js|ts/.test(combined)) {
    return "dev_code";
  }
  return "general";
}

// Generate smart offline contextual comments based on real post semantics
export function generateSmartComments(text, tags = [], count = 2) {
  const theme = detectPostTheme(text, tags);
  const primaryPool = THEME_COMMENTS[theme] || THEME_COMMENTS.general;
  const generalPool = THEME_COMMENTS.general;

  // Shuffle players
  const availablePlayers = [...VIRTUAL_PLAYERS].sort(() => 0.5 - Math.random());
  const selectedPlayers = availablePlayers.slice(0, Math.min(count, availablePlayers.length));

  // Pick unique comments
  const shuffledComments = [...primaryPool].sort(() => 0.5 - Math.random());
  
  return selectedPlayers.map((player, idx) => {
    const commentText = shuffledComments[idx] || generalPool[idx % generalPool.length];
    return {
      id: `bot_cmt_${Date.now()}_${idx}`,
      bot: player,
      text: commentText,
      createdAt: new Date(Date.now() + (idx + 1) * 3500).toISOString()
    };
  });
}

// Optional Neural AI Generation (Groq or Ollama) with fallback to smart comments
export async function generateAiComments(text, tags = [], aiConfig = {}) {
  // If AI mode is disabled or no key, return smart contextual comments immediately
  if (!aiConfig || aiConfig.mode === "offline" || !aiConfig.mode) {
    return generateSmartComments(text, tags, 2);
  }

  const prompt = `Ты реальные игроки в локальной кибер-соцсети Актограмм.
Игрок опубликовал новый пост:
"${text}" (Теги: ${tags.join(", ")})

Напиши ровно 2 коротких комментария (каждый 1-2 предложения) от лица обычных увлеченных игроков (например Ghost52, Genesis_Gr).
Комментарии должны быть СТРОГО по теме события в посте (похвалить победу над боссом, обсудить лут, посмеяться над багом, спросить про билд и т.п.). Используй естественный геймерский сленг.
Ответь ТОЛЬКО валидным JSON массивом из 2 объектов вида:
[
  { "authorName": "Ghost52", "handle": "@ghost52", "avatarColor": "#00ff66", "text": "Текст комментария" },
  { "authorName": "Genesis_Gr", "handle": "@genesis_gr", "avatarColor": "#b026ff", "text": "Текст комментария" }
]`;

  try {
    if (aiConfig.mode === "groq" && aiConfig.apiKey) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${aiConfig.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: aiConfig.model || "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a helpful JSON generator." },
            { role: "user", content: prompt }
          ],
          temperature: 0.8,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        let parsed = JSON.parse(content);
        if (parsed && !Array.isArray(parsed) && parsed.comments) {
          parsed = parsed.comments;
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            id: `ai_cmt_${Date.now()}_${idx}`,
            bot: {
              id: `usr_${item.handle?.replace('@', '') || idx}`,
              name: item.authorName || (idx === 0 ? "Ghost52" : "Genesis_Gr"),
              handle: item.handle || (idx === 0 ? "@ghost52" : "@genesis_gr"),
              avatarColor: item.avatarColor || (idx === 0 ? "#00ff66" : "#b026ff")
            },
            text: item.text,
            createdAt: new Date().toISOString()
          }));
        }
      }
    } else if (aiConfig.mode === "ollama") {
      const endpoint = aiConfig.ollamaUrl || "http://localhost:11434";
      const model = aiConfig.ollamaModel || "llama3.2:latest";
      const response = await fetch(`${endpoint}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: `${prompt}\nRespond only with the raw JSON array.`,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.response;
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            id: `ai_cmt_${Date.now()}_${idx}`,
            bot: {
              id: `usr_${item.handle?.replace('@', '') || idx}`,
              name: item.authorName || "Ghost52",
              handle: item.handle || "@ghost52",
              avatarColor: item.avatarColor || "#00ff66"
            },
            text: item.text,
            createdAt: new Date().toISOString()
          }));
        }
      }
    }
  } catch (err) {
    console.warn("AI generation fallback to smart engine:", err);
  }

  // Graceful fallback to smart engine
  return generateSmartComments(text, tags, 2);
}
