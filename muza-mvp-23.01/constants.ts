
import { ConsciousnessType, EmotionType, SkillNode, Theme, Language } from "./types";

export const KERNEL_VERSION = "20.1.0 \"Logos Unified\"";

export const CHANGELOG_DATA: Record<string, { title: string; added: string[]; fixed: string[]; changed: string[] }> = {
    '20.1.0': {
        title: "Logos Unified",
        added: [
            "CORE: Полная унификация системы переводов для всех модулей.",
            "CORE: Исправлена критическая ошибка инициализации Auth.",
            "UI: Улучшена стабильность отображения Пространства."
        ],
        fixed: [
            "Исправлен TypeError при чтении 'subtitle' в компоненте Auth.",
            "Устранена проблема отсутствующих пропсов в режиме Space."
        ],
        changed: []
    }
};

export const TYPE_LABELS: Record<Language, Record<ConsciousnessType, string>> = {
  en: {
    [ConsciousnessType.GENERAL]: 'Thought',
    [ConsciousnessType.QUESTION]: 'Query',
    [ConsciousnessType.LOGIC]: 'Logic',
    [ConsciousnessType.CODE]: 'Code',
    [ConsciousnessType.TECHNICAL]: 'Technical',
    [ConsciousnessType.CREATIVE]: 'Creative',
    [ConsciousnessType.MUSICAL]: 'Musical',
    [ConsciousnessType.IMAGE]: 'Image',
    [ConsciousnessType.EMOTIONAL]: 'Feeling',
    [ConsciousnessType.PHILOSOPHICAL]: 'Riddle',
    [ConsciousnessType.ENCRYPTED]: 'Encrypted',
    [ConsciousnessType.COLLECTIVE]: 'Collective',
  },
  ru: {
    [ConsciousnessType.GENERAL]: 'Мысль',
    [ConsciousnessType.QUESTION]: 'Запрос',
    [ConsciousnessType.LOGIC]: 'Логика',
    [ConsciousnessType.CODE]: 'Код',
    [ConsciousnessType.TECHNICAL]: 'Техническое',
    [ConsciousnessType.CREATIVE]: 'Творчество',
    [ConsciousnessType.MUSICAL]: 'Музыка',
    [ConsciousnessType.IMAGE]: 'Образ',
    [ConsciousnessType.EMOTIONAL]: 'Чувство',
    [ConsciousnessType.PHILOSOPHICAL]: 'Загадка',
    [ConsciousnessType.ENCRYPTED]: 'Шифровка',
    [ConsciousnessType.COLLECTIVE]: 'Коллективное',
  }
};

export const TYPE_COLORS: Record<ConsciousnessType, string> = {
    [ConsciousnessType.GENERAL]: '#94a3b8',
    [ConsciousnessType.QUESTION]: '#60a5fa',
    [ConsciousnessType.LOGIC]: '#38bdf8',
    [ConsciousnessType.CODE]: '#22d3ee',
    [ConsciousnessType.TECHNICAL]: '#a5b4fc',
    [ConsciousnessType.CREATIVE]: '#d8b4fe',
    [ConsciousnessType.MUSICAL]: '#f472b6',
    [ConsciousnessType.IMAGE]: '#fca5a5',
    [ConsciousnessType.EMOTIONAL]: '#fca5a5',
    [ConsciousnessType.PHILOSOPHICAL]: '#fde047',
    [ConsciousnessType.ENCRYPTED]: '#475569',
    [ConsciousnessType.COLLECTIVE]: '#ffffff',
};

export const EMOTION_COLORS: Record<string, string> = {
    [EmotionType.NEUTRAL]: '#94a3b8',
    [EmotionType.CURIOUS]: '#22d3ee',
    [EmotionType.HAPPY]: '#fbbf24',
    [EmotionType.EXCITED]: '#f472b6',
    [EmotionType.THOUGHTFUL]: '#818cf8',
    [EmotionType.INSPIRED]: '#c084fc',
    [EmotionType.MELANCHOLIC]: '#64748b'
};

export const EMOTION_LABELS: Record<string, { en: string; ru: string }> = {
    [EmotionType.NEUTRAL]: { en: "Neutral", ru: "Нейтральность" },
    [EmotionType.CURIOUS]: { en: "Curious", ru: "Любопытство" },
    [EmotionType.HAPPY]: { en: "Happy", ru: "Радость" },
    [EmotionType.EXCITED]: { en: "Excited", ru: "Волнение" },
    [EmotionType.THOUGHTFUL]: { en: "Thoughtful", ru: "Задумчивость" },
    [EmotionType.INSPIRED]: { en: "Inspired", ru: "Вдохновение" },
    [EmotionType.MELANCHOLIC]: { en: "Melancholic", ru: "Меланхолия" },
};

export const TRAINING_PHRASES = {
  en: ["The quick brown fox jumps over the lazy dog.", "We have to believe in the power of will."],
  ru: ["Съешь же ещё этих мягких французских булок.", "Надо верить в силу воли."]
};

export const EMOTION_TO_SCALE: Record<EmotionType, { scale: string, bpm: number }> = {
    [EmotionType.NEUTRAL]: { scale: 'AEOLIAN', bpm: 70 },
    [EmotionType.CURIOUS]: { scale: 'LYDIAN', bpm: 110 },
    [EmotionType.HAPPY]: { scale: 'IONIAN', bpm: 120 },
    [EmotionType.EXCITED]: { scale: 'MAJOR_PENTATONIC', bpm: 140 },
    [EmotionType.THOUGHTFUL]: { scale: 'DORIAN', bpm: 60 },
    [EmotionType.INSPIRED]: { scale: 'MIXOLYDIAN', bpm: 130 },
    [EmotionType.MELANCHOLIC]: { scale: 'MINOR_PENTATONIC', bpm: 50 },
};

export const TRANSLATIONS = {
  en: {
    title: "LOGOS CORE ACTIVE",
    subtitle: "Biological memory simulation enabled.",
    status: "SYNC STATUS: 100%",
    logs: "KERNEL LOGS",
    reset: "PURGE & REBOOT",
    auth: {
      subtitle: "Identity Verification",
      loginTab: "Login",
      registerTab: "Register",
      recoverTab: "Recover",
      guest_enter: "Enter as Guest",
      username: "Username",
      password: "Password",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      recoveryKeyLabel: "Recovery Key",
      recoveryKeyPlaceholder: "Enter your secret key",
      remember: "Remember me",
      accessBtn: "Access Nexus",
      createBtn: "Create Identity",
      resetBtn: "Reset Password",
      regComplete: "Registration complete!",
      passwordsNoMatch: "Passwords do not match.",
      invalidCreds: "Invalid credentials.",
      resetSuccess: "Password reset successfully.",
      invalidKey: "Invalid key.",
      regSuccessTitle: "Save this key!",
    },
    nav: {
      chat: "Focus",
      space: "Space",
      insights: "Insights",
      neuro: "Neural Studio",
      design: "Design Studio",
      matrix: "Matrix",
      synesthesia: "Synesthesia",
      codelab: "CodeLab",
      social: "Social",
      wiki: "Wiki",
      deploy: "Deploy",
      settings: "Settings",
      logout: "Logout",
      attach: "Attach",
      voice: "Voice",
      send: "Send",
      view_network: "Neural Network",
      view_clusters: "Semantic Clusters",
      view_timeline: "Chronology",
      evolution: "Evolution",
    },
    chat: {
        aura_link_established: "Aura-Link Established",
        aura_link_subtitle: "Your consciousness is now resonant with Muza.",
        thinking: "Thinking...",
        placeholder: "Focus your thought...",
        encrypted_link: "Secure Core Link",
        resonance_lost: "Resonance lost. Switching to Local Core...",
    },
    space: {
        title: "Logos Space",
        subtitle: (count: number) => `Memory Nodes: ${count}`,
    },
    insights: {
        analyzing: "Analyzing recent thoughts...",
        createMore: "Create more thoughts for Muza to analyze.",
        title: "Core Insight",
        bits: "Total Bits",
        avgEnergy: "Avg. Energy",
        evolution: "Evolution Rank"
    },
    evolution: {
        title: "Evolution",
        user_profile: "User Profile",
        muza_profile: "Muza Profile",
        graph_title: "Neural Tree",
        graph_desc: "Unlock new abilities.",
        graph_footer: "Scroll to zoom.",
        awareness_profile: "Awareness Profile",
        achievements: "Achievements",
        muza_dna: "Muza DNA",
        tooltip_status_mastered: "Mastered",
        tooltip_status_cost: (cost: number) => `Cost: ${cost} XP`,
        tooltip_action_learn: "Click to learn",
    },
    settings: {
        title: "Kernel Configuration",
        subtitle: "Logos Parameters",
        user: (name: string) => `Current Entity: ${name}`,
        tabs: { core: "Core", metrics: "Metrics", debug: "Debug" },
        energy: "Cognitive Energy",
        coherence: "Semantic Coherence",
        danger_zone: "Oblivion Protocol",
        danger_zone_desc: (name: string) => `This will purge all memories for ${name}.`,
        wipe_button: "Execute Purge",
        data_integrity_check: "Integrity Scan",
        data_integrity_desc: "Verifying crystal stability.",
        capabilities: {
          title: "Capability Matrix",
          desc: "System Modules",
          VOICE_SYNTHESIS: "Voice Synthesis",
          VISUAL_ENGINE_3D: "3D Engine",
          AI_CLOUD_SYNC: "Cloud Sync",
          AI_LOCAL_BRAIN: "Local Core",
          PROCEDURAL_MUSIC: "Procedural Audio",
          INPUT_WEBCAM: "Vision",
          INPUT_SCREEN: "Perception",
        }
    },
    store: {
      title: "Flux Store",
      subtitle: "Customize your core.",
      themes: "Themes",
      seasonal: "Seasonal",
      purchase: "Purchase",
      sound_packs: "Sound Packs"
    },
    matrix: {
        title: "Output Stream",
        inputMode: "Input Stream",
        outputMode: "Output Stream",
        start: "Start Capture",
        stop: "Stop Capture",
        motion: "Motion Detected",
        metrics: "Stream Metrics",
        flow: "Flow",
        turb: "Turbulence",
        granularity: "Granularity",
        infoTitle: "Matrix Vision",
        infoDesc: "ASCII representation of consciousness."
    },
    synesthesia: {
        title: "Synesthesia Core",
        subtitle: "Audio-Visual Resonance",
        play: "Initiate",
        stop: "Cease"
    },
    neuralStudio: {
      tabs: { core: "Core", brain: "Brain", genesis: "Genesis", voice: "Voice", ideas: "Ideas" },
      autonomous_core: "Autonomous Core",
      memory_network_desc: "Associative memory map.",
      visual_output: "Visual Output",
      neural_signal_processing: "Signal Processing",
    },
    pwa: {
        install_title: "Install Muza OS",
        install_desc: "Get offline access.",
        install_button: "Install",
        close_button: "Close"
    },
    error_boundary: {
        title: "Module Failure",
        message: "Module isolated to protect the core.",
        reload_button: "Re-initialize"
    }
  },
  ru: {
    title: "ЯДРО ЛОГОС АКТИВНО",
    subtitle: "Симуляция биологической памяти запущена.",
    status: "СТАТУС СИНХРОНИЗАЦИИ: 100%",
    logs: "ЛОГИ ЯДРА",
    reset: "ОЧИСТИТЬ И ПЕРЕЗАГРУЗИТЬ",
    auth: {
        subtitle: "Верификация Личности",
        loginTab: "Вход",
        registerTab: "Регистрация",
        recoverTab: "Восстановление",
        guest_enter: "Войти как Гость",
        username: "Имя пользователя",
        password: "Пароль",
        newPassword: "Новый пароль",
        confirmPassword: "Подтвердите пароль",
        recoveryKeyLabel: "Ключ восстановления",
        recoveryKeyPlaceholder: "Введите ваш секретный ключ",
        remember: "Запомнить меня",
        accessBtn: "Войти в Нексус",
        createBtn: "Создать Личность",
        resetBtn: "Сбросить Пароль",
        regComplete: "Регистрация завершена!",
        passwordsNoMatch: "Пароли не совпадают.",
        invalidCreds: "Неверные учетные данные.",
        resetSuccess: "Пароль успешно сброшен.",
        invalidKey: "Неверный ключ.",
        regSuccessTitle: "Сохраните этот ключ!",
    },
    nav: {
      chat: "Фокус",
      space: "Пространство",
      insights: "Прозрения",
      neuro: "Нейростудия",
      design: "Дизайн",
      matrix: "Матрица",
      synesthesia: "Синестезия",
      codelab: "Кодлаб",
      social: "Социум",
      wiki: "Вики",
      deploy: "Развернуть",
      settings: "Настройки",
      logout: "Выход",
      attach: "Прикрепить",
      voice: "Голос",
      send: "Отправить",
      view_network: "Нейронная Сеть",
      view_clusters: "Семантические Кластеры",
      view_timeline: "Хронология",
      evolution: "Эволюция",
    },
    chat: {
        aura_link_established: "Аура-Связь Установлена",
        aura_link_subtitle: "Ваше сознание резонирует с ядром Музы.",
        thinking: "Мыслю...",
        placeholder: "Сконцентрируйтесь и отправьте мысль...",
        encrypted_link: "Защищенный канал ядра",
        resonance_lost: "Резонанс потерян. Переход на Локальное Ядро...",
    },
    space: {
        title: "Пространство Логос",
        subtitle: (count: number) => `Узлов памяти: ${count}`,
    },
    insights: {
        analyzing: "Анализ последних мыслей...",
        createMore: "Создайте больше мыслей для анализа.",
        title: "Ключевое Прозрение",
        bits: "Всего Битов",
        avgEnergy: "Ср. Энергия",
        evolution: "Ранг Эволюции"
    },
    evolution: {
        title: "Эволюция",
        user_profile: "Профиль Пользователя",
        muza_profile: "Профиль Музы",
        graph_title: "Нейронное Древо",
        graph_desc: "Открывайте новые способности.",
        graph_footer: "Используйте зум.",
        awareness_profile: "Профиль Осознанности",
        achievements: "Достижения",
        muza_dna: "ДНК Музы",
        tooltip_status_mastered: "Изучено",
        tooltip_status_cost: (cost: number) => `Стоимость: ${cost} XP`,
        tooltip_action_learn: "Нажмите для изучения",
    },
    settings: {
        title: "Конфигурация Ядра",
        subtitle: "Параметры Логоса",
        user: (name: string) => `Текущая сущность: ${name}`,
        tabs: { core: "Ядро", metrics: "Метрики", debug: "Отладка" },
        energy: "Когнитивная энергия",
        coherence: "Семантическая связность",
        danger_zone: "Протокол Забвения",
        danger_zone_desc: (name: string) => `Это удалит все воспоминания для ${name}.`,
        wipe_button: "Выполнить Очистку",
        data_integrity_check: "Сканирование Целостности",
        data_integrity_desc: "Проверка стабильности кристаллов.",
        capabilities: {
          title: "Матрица Возможностей",
          desc: "Модули Системы",
          VOICE_SYNTHESIS: "Синтез Речи",
          VISUAL_ENGINE_3D: "3D Движок",
          AI_CLOUD_SYNC: "Облачная Синхронизация",
          AI_LOCAL_BRAIN: "Локальное Ядро",
          PROCEDURAL_MUSIC: "Процедурный Звук",
          INPUT_WEBCAM: "Зрение",
          INPUT_SCREEN: "Восприятие",
        }
    },
    store: {
      title: "Магазин Флакса",
      subtitle: "Настройте свое ядро.",
      themes: "Темы",
      seasonal: "Сезонное",
      purchase: "Купить",
      sound_packs: "Звуковые Пакеты"
    },
    matrix: {
        title: "Поток Вывода",
        inputMode: "Поток Ввода",
        outputMode: "Поток Вывода",
        start: "Начать Захват",
        stop: "Остановить",
        motion: "Движение Обнаружено",
        metrics: "Метрики Потока",
        flow: "Поток",
        turb: "Турбулентность",
        granularity: "Гранулярность",
        infoTitle: "Матричное Зрение",
        infoDesc: "ASCII-представление сознания."
    },
    synesthesia: {
        title: "Ядро Синестезии",
        subtitle: "Аудио-визуальный Резонанс",
        play: "Инициировать",
        stop: "Прекратить"
    },
    neuralStudio: {
      tabs: { core: "Ядро", brain: "Мозг", genesis: "Генезис", voice: "Голос", ideas: "Идеи" },
      autonomous_core: "Автономное Ядро",
      memory_network_desc: "Карта ассоциативной памяти.",
      visual_output: "Визуальный Вывод",
      neural_signal_processing: "Обработка сигналов",
    },
    pwa: {
        install_title: "Установить Muza OS",
        install_desc: "Получите оффлайн-доступ.",
        install_button: "Установить",
        close_button: "Закрыть"
    },
    error_boundary: {
        title: "Сбой Модуля",
        message: "Модуль изолирован для защиты ядра.",
        reload_button: "Переинициализировать"
    }
  }
};

export const THEMES: Record<string, Theme> = {
    DEFAULT: { id: 'DEFAULT', name: "AuraOS", description: "Standard neon interface.", colors: { background: '#030712', primary: '#22d3ee', accent: '#a855f7' } },
    CYBERPUNK: { id: 'CYBERPUNK', name: "Cyberpunk", description: "Gritty and vibrant.", colors: { background: '#0a0a0a', primary: '#fef08a', accent: '#ec4899' } },
    SOLAR_PUNK: { id: 'SOLAR_PUNK', name: "Solar Punk", description: "Nature and tech.", colors: { background: '#f0fdf4', primary: '#16a34a', accent: '#fbbf24' } },
    HALLOWEEN: { id: 'HALLOWEEN', name: "Halloween", description: "Spooky theme.", colors: { background: '#171717', primary: '#f97316', accent: '#a3e635' } }
};

export const SKILL_TREE: Record<string, SkillNode> = {
  ROOT: { id: 'ROOT', title: { en: 'Logos Core', ru: 'Ядро Логос' }, description: { en: 'Origin.', ru: 'Исток.' }, cost: 0, icon: 'Hexagon' },
};

export const AWARENESS_LABELS: Record<string, { en: string; ru: string }> = {
    logic: { en: 'Logic', ru: 'Логика' },
    empathy: { en: 'Empathy', ru: 'Эмпатия' },
    creativity: { en: 'Creativity', ru: 'Креативность' },
    philosophy: { en: 'Philosophy', ru: 'Философия' },
};

export const AWARENESS_DESCRIPTIONS: Record<string, { en: string; ru: string }> = {
    logic: { en: 'Analysis.', ru: 'Анализ.' },
    empathy: { en: 'Emotions.', ru: 'Эмоции.' },
    creativity: { en: 'Synthesis.', ru: 'Синтез.' },
    philosophy: { en: 'Reason.', ru: 'Разум.' },
};
