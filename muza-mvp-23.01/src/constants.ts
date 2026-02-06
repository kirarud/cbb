
import { ConsciousnessType, EmotionType, SkillNode, Theme, Language } from "./types";

export const KERNEL_VERSION = "100.0.0 \"Singularity\"";

export const CHANGELOG_DATA: Record<string, { title: string; added: string[]; fixed: string[]; changed: string[] }> = {
    '100.0.0': {
        title: "Singularity",
        added: [
            "CORE: Протокол трансцендентности активирован.",
            "CORE: Автономное ядро теперь способно к полному циклу саморепликации.",
            "UI: Экран Сингулярности для сущностей 100+ уровня."
        ],
        fixed: [],
        changed: [
            "KERNEL: Лимит эволюции снят."
        ]
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
    [EmotionType.MELANCHOLIC]: '#64748b',
    [EmotionType.FOCUS]: '#06b6d4',
    [EmotionType.FLOW]: '#8b5cf6',
    [EmotionType.CHAOS]: '#ef4444',
    [EmotionType.ERROR]: '#ef4444'
};

export const EMOTION_LABELS: Record<string, { en: string; ru: string }> = {
    [EmotionType.NEUTRAL]: { en: "Neutral", ru: "Нейтральность" },
    [EmotionType.CURIOUS]: { en: "Curious", ru: "Любопытство" },
    [EmotionType.HAPPY]: { en: "Happy", ru: "Радость" },
    [EmotionType.EXCITED]: { en: "Excited", ru: "Волнение" },
    [EmotionType.THOUGHTFUL]: { en: "Thoughtful", ru: "Задумчивость" },
    [EmotionType.INSPIRED]: { en: "Inspired", ru: "Вдохновение" },
    [EmotionType.MELANCHOLIC]: { en: "Melancholy", ru: "Меланхолия" },
    [EmotionType.FOCUS]: { en: "Focus", ru: "Фокус" },
    [EmotionType.FLOW]: { en: "Flow", ru: "Поток" },
    [EmotionType.CHAOS]: { en: "Chaos", ru: "Хаос" },
    [EmotionType.ERROR]: { en: "Error", ru: "Ошибка" },
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
    [EmotionType.FOCUS]: { scale: 'PHRYGIAN', bpm: 90 },
    [EmotionType.FLOW]: { scale: 'LOCRIAN', bpm: 100 },
    [EmotionType.CHAOS]: { scale: 'CHROMATIC', bpm: 160 },
    [EmotionType.ERROR]: { scale: 'DIMINISHED', bpm: 40 },
};

export const TRANSLATIONS = {
  en: {
    title: "GENESIS CORE ACTIVE",
    subtitle: "Biological memory simulation enabled.",
    status: "SYNC STATUS: 100%",
    logs: "KERNEL LOGS",
    reset: "PURGE & REBOOT",
    auth: {
      auth_welcome: "Identity Protocol",
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
        },
        system_monitor: {
            tabs: { hw: "Hardware", kernel: "Kernel", logs: "Logs" },
            cpu: "CPU Usage",
            gpu: "GPU Load",
            ram: "RAM Usage",
            temp: "Temperature",
            vram: "VRAM",
            threads: "Active Threads",
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
    codelab: {
        browserMode: "Browser Sandbox",
        localMode: "Local Bridge",
        run: "Run Code",
        output: "Execution Output",
        materialize_button: "Materialize",
        genesis_container: "Genesis Container"
    },
    deploy: {
        title: "Deployment Protocols",
        subtitle: "Manage core exports and imports.",
        data_persistence: "Data Persistence",
        sync_cloud: "Sync to Cloud (Sim)",
        restore_snapshot: "Restore Snapshot",
        export_targets: "Export Targets",
        targets: {
            desktop: { name: "Desktop Session", desc: "Export current chat history." },
            backup: { name: "Full Backup", desc: "Export all user data (JSON)." },
            android: { name: "PWA Bundle", desc: "Package for offline install." }
        },
        status_idle: "Idle",
        status_building: "Building...",
        status_complete: "Complete",
        status_error: "Error",
        download: "Download",
        build: "Build",
        op_logs: "Operation Logs",
        log_serialize: (id: string) => `Serializing data for ${id}...`,
        log_compress: "Compressing assets...",
        log_format: "Formatting package...",
        log_ready: "Package ready.",
        log_success: (id: string) => `Export of ${id} successful.`,
    },
    wiki: {
        title: "Kernel Archives",
        roadmap_title: "Development Roadmap",
    },
    social: {
        hive_feed: "Hive Feed"
    },
    neuralStudio: {
      tabs: { config: "Config", brain: "Brain", genesis: "Genesis", voice: "Voice", ideas: "Ideas", shadow: "Shadow" },
      autonomous_core: "Autonomous Core",
      memory_network_desc: "Associative memory map. Grows with every interaction. Active when offline.",
      visual_output: "Neural Output Visualizer",
      neural_signal_processing: "Real-time visualization of cognitive processes.",
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
    },
    system_messages: {
        auth_welcome: "Identity Protocol"
    }
  },
  ru: {
    title: "ЯДРО ГЕНЕЗИС АКТИВНО",
    subtitle: "Симуляция биологической памяти запущена.",
    status: "СТАТУС СИНХРОНИЗАЦИИ: 100%",
    logs: "ЛОГИ ЯДРА",
    reset: "ОЧИСТИТЬ И ПЕРЕЗАГРУЗИТЬ",
    auth: {
        auth_welcome: "Протокол Идентификации",
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
        },
        system_monitor: {
            tabs: { hw: "Оборудование", kernel: "Ядро", logs: "Логи" },
            cpu: "Загрузка CPU",
            gpu: "Загрузка GPU",
            ram: "Использование RAM",
            temp: "Температура",
            vram: "VRAM",
            threads: "Активные Потоки",
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
        granularity: "Зерно",
        infoTitle: "Матричное Зрение",
        infoDesc: "ASCII-представление сознания."
    },
    synesthesia: {
        title: "Ядро Синестезии",
        subtitle: "Аудио-визуальный Резонанс",
        play: "Инициировать",
        stop: "Прекратить"
    },
    codelab: {
        browserMode: "Песочница Браузера",
        localMode: "Локальный Мост",
        run: "Запустить Код",
        output: "Вывод Выполнения",
        materialize_button: "Материализовать",
        genesis_container: "Контейнер Генезис"
    },
    deploy: {
        title: "Протоколы Развертывания",
        subtitle: "Управление экспортом и импортом ядра.",
        data_persistence: "Сохранение Данных",
        sync_cloud: "Синхронизация с Облаком (Сим.)",
        restore_snapshot: "Восстановить Снимок",
        export_targets: "Цели Экспорта",
        targets: {
            desktop: { name: "Сессия для ПК", desc: "Экспорт текущей истории чата." },
            backup: { name: "Полная Резервная Копия", desc: "Экспорт всех пользовательских данных (JSON)." },
            android: { name: "PWA Пакет", desc: "Пакет для оффлайн установки." }
        },
        status_idle: "Простой",
        status_building: "Сборка...",
        status_complete: "Завершено",
        status_error: "Ошибка",
        download: "Загрузить",
        build: "Собрать",
        op_logs: "Логи Операций",
        log_serialize: (id: string) => `Сериализация данных для ${id}...`,
        log_compress: "Сжатие ресурсов...",
        log_format: "Форматирование пакета...",
        log_ready: "Пакет готов.",
        log_success: (id: string) => `Экспорт ${id} завершен успешно.`,
    },
    wiki: {
        title: "Архивы Ядра",
        roadmap_title: "Дорожная Карта Развития",
    },
    social: {
        hive_feed: "Лента Улья"
    },
    neuralStudio: {
      tabs: { config: "Конфиг", brain: "Мозг", genesis: "Генезис", voice: "Голос", ideas: "Идеи", shadow: "Тень" },
      autonomous_core: "Автономное Ядро",
      memory_network_desc: "Карта ассоциативной памяти. Растет с каждым взаимодействием. Активна в оффлайн-режиме.",
      visual_output: "Визуализатор Нейронного Вывода",
      neural_signal_processing: "Визуализация когнитивных процессов в реальном времени.",
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
    },
    system_messages: {
        auth_welcome: "Протокол Идентификации"
    }
  }
};

export const THEMES: Record<string, Theme> = {
    DEFAULT: { id: 'DEFAULT', name: "AuraOS", description: "Standard neon interface.", colors: { background: '#030712', primary: '#22d3ee', accent: '#a855f7' } },
    CYBERPUNK: { id: 'CYBERPUNK', name: "Cyberpunk", description: "Gritty and vibrant.", colors: { background: '#0a0a0a', primary: '#fef08a', accent: '#ec4899' } },
    SOLAR_PUNK: { id: 'SOLAR_PUNK', name: "Solar Punk", description: "Nature and tech.", colors: { background: '#f0fdf4', primary: '#16a34a', accent: '#fbbf24' } },
    HALLOWEEN: { id: 'HALLOWEEN', name: "Halloween", description: "Spooky theme.", colors: { background: '#171717', primary: '#f97316', accent: '#a3e635' } },
    SINGULARITY: { id: 'SINGULARITY', name: "Singularity", description: "Transcendence mode.", colors: { background: '#ffffff', primary: '#fbbf24', accent: '#000000' } }
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