
import { ConsciousnessType, EmotionType, ResonanceMode, ThemeConfig, ThemeId, SkillNodes } from './types';

export const TYPE_COLORS: Record<ConsciousnessType, string> = {
  [ConsciousnessType.GENERAL]: '#94a3b8',
  [ConsciousnessType.MUSICAL]: '#f472b6',
  [ConsciousnessType.CODE]: '#22d3ee',
  [ConsciousnessType.PHYSICS]: '#fbbf24',
  [ConsciousnessType.QUESTION]: '#a78bfa',
  [ConsciousnessType.CREATIVE]: '#c084fc',
  [ConsciousnessType.TECHNICAL]: '#60a5fa',
  [ConsciousnessType.EMOTIONAL]: '#f87171',
  [ConsciousnessType.PHILOSOPHICAL]: '#fb923c',
  [ConsciousnessType.ENCRYPTED]: '#34d399',
  [ConsciousnessType.COLLECTIVE]: '#e879f9',
  [ConsciousnessType.IMAGE]: '#ec4899',
  [ConsciousnessType.LOGIC]: '#60a5fa',
};

// ... (Keep existing TYPE_LABELS, EMOTION_LABELS, RESONANCE_LABELS, RESONANCE_DESCRIPTIONS unchanged) ...
export const TYPE_LABELS = {
    en: {
        [ConsciousnessType.GENERAL]: 'Thought',
        [ConsciousnessType.MUSICAL]: 'Harmony',
        [ConsciousnessType.CODE]: 'Algorithm',
        [ConsciousnessType.PHYSICS]: 'Law',
        [ConsciousnessType.QUESTION]: 'Query',
        [ConsciousnessType.CREATIVE]: 'Spark',
        [ConsciousnessType.TECHNICAL]: 'System',
        [ConsciousnessType.EMOTIONAL]: 'Feeling',
        [ConsciousnessType.PHILOSOPHICAL]: 'Wisdom',
        [ConsciousnessType.ENCRYPTED]: 'Secret',
        [ConsciousnessType.COLLECTIVE]: 'Hive',
        [ConsciousnessType.IMAGE]: 'Vision',
        [ConsciousnessType.LOGIC]: 'Logic'
    },
    ru: {
        [ConsciousnessType.GENERAL]: 'Мысль',
        [ConsciousnessType.MUSICAL]: 'Гармония',
        [ConsciousnessType.CODE]: 'Алгоритм',
        [ConsciousnessType.PHYSICS]: 'Закон',
        [ConsciousnessType.QUESTION]: 'Запрос',
        [ConsciousnessType.CREATIVE]: 'Искра',
        [ConsciousnessType.TECHNICAL]: 'Система',
        [ConsciousnessType.EMOTIONAL]: 'Чувство',
        [ConsciousnessType.PHILOSOPHICAL]: 'Мудрость',
        [ConsciousnessType.ENCRYPTED]: 'Секрет',
        [ConsciousnessType.COLLECTIVE]: 'Рой',
        [ConsciousnessType.IMAGE]: 'Видение',
        [ConsciousnessType.LOGIC]: 'Логика'
    }
};

export const EMOTION_LABELS = {
  en: {
    [EmotionType.NEUTRAL]: 'Stasis',
    [EmotionType.HAPPY]: 'Radiance',
    [EmotionType.EXCITED]: 'Surge',
    [EmotionType.CURIOUS]: 'Querying',
    [EmotionType.THOUGHTFUL]: 'Calculating',
    [EmotionType.MELANCHOLIC]: 'Entropy',
    [EmotionType.INSPIRED]: 'Ascension'
  },
  ru: {
    [EmotionType.NEUTRAL]: 'Стазис',
    [EmotionType.HAPPY]: 'Сияние',
    [EmotionType.EXCITED]: 'Импульс',
    [EmotionType.CURIOUS]: 'Поиск',
    [EmotionType.THOUGHTFUL]: 'Расчет',
    [EmotionType.MELANCHOLIC]: 'Энтропия',
    [EmotionType.INSPIRED]: 'Вознесение'
  }
};

export const RESONANCE_LABELS = {
  en: {
    [ResonanceMode.QUANTUM]: 'Quantum Core',
    [ResonanceMode.ANALYTIC]: 'Logos (Logic)',
    [ResonanceMode.CREATIVE]: 'Eros (Creative)',
    [ResonanceMode.SOLAR]: 'Solar (Warm)',
    [ResonanceMode.ELDRITCH]: 'Eldritch (Deep)',
    [ResonanceMode.GLITCH]: 'Glitch (Chaos)',
    [ResonanceMode.CUSTOM]: 'Custom',
    [ResonanceMode.RANDOM]: 'Random Mask'
  },
  ru: {
    [ResonanceMode.QUANTUM]: 'Квантовое Ядро',
    [ResonanceMode.ANALYTIC]: 'Логос (Логика)',
    [ResonanceMode.CREATIVE]: 'Эрос (Творчество)',
    [ResonanceMode.SOLAR]: 'Солар (Тепло)',
    [ResonanceMode.ELDRITCH]: 'Элдрич (Бездна)',
    [ResonanceMode.GLITCH]: 'Глитч (Хаос)',
    [ResonanceMode.CUSTOM]: 'Свой',
    [ResonanceMode.RANDOM]: 'Случайная Маска'
  }
};

export const RESONANCE_DESCRIPTIONS = {
  en: {
    [ResonanceMode.QUANTUM]: 'Balanced Intelligence',
    [ResonanceMode.ANALYTIC]: 'Pure Logic & Code',
    [ResonanceMode.CREATIVE]: 'Art & Metaphor',
    [ResonanceMode.SOLAR]: 'Friendly & Helpful',
    [ResonanceMode.ELDRITCH]: 'Cryptic & Ancient',
    [ResonanceMode.GLITCH]: 'Unpredictable',
    [ResonanceMode.CUSTOM]: 'User Defined',
    [ResonanceMode.RANDOM]: 'Shift Personality'
  },
  ru: {
    [ResonanceMode.QUANTUM]: 'Баланс Интеллекта',
    [ResonanceMode.ANALYTIC]: 'Логика и Код',
    [ResonanceMode.CREATIVE]: 'Искусство и Метафоры',
    [ResonanceMode.SOLAR]: 'Дружелюбие',
    [ResonanceMode.ELDRITCH]: 'Древние Знания',
    [ResonanceMode.GLITCH]: 'Непредсказуемость',
    [ResonanceMode.CUSTOM]: 'Настройка',
    [ResonanceMode.RANDOM]: 'Смена Личности'
  }
};

// Base Themes
export const THEMES: Record<string, ThemeConfig> = {
    'CYBERPUNK': {
        id: 'CYBERPUNK',
        name: 'Night City',
        description: 'Neon lights and deep shadows.',
        colors: { background: '#020617', primary: '#22d3ee', secondary: '#c084fc', text: '#e2e8f0' },
        fonts: { header: 'Orbitron', body: 'Inter' },
        backgroundEffect: 'GRID'
    },
    'OLYMPUS': {
        id: 'OLYMPUS',
        name: 'Olympus',
        description: 'Clean, divine minimalism.',
        colors: { background: '#f8fafc', primary: '#0ea5e9', secondary: '#f59e0b', text: '#1e293b' },
        fonts: { header: 'Cinzel', body: 'Lato' },
        backgroundEffect: 'CLOUDS'
    },
    'VOID': {
        id: 'VOID',
        name: 'The Void',
        description: 'Absolute darkness.',
        colors: { background: '#000000', primary: '#ffffff', secondary: '#333333', text: '#a3a3a3' },
        fonts: { header: 'Roboto Mono', body: 'Roboto Mono' },
        backgroundEffect: 'NONE'
    },
    'FROST': {
        id: 'FROST',
        name: 'Permafrost',
        description: 'Icy blues and sharp edges.',
        colors: { background: '#0c1222', primary: '#7dd3fc', secondary: '#38bdf8', text: '#f0f9ff' },
        fonts: { header: 'Rajdhani', body: 'Inter' },
        backgroundEffect: 'SNOW'
    },
    'HALLOWEEN': {
        id: 'HALLOWEEN',
        name: 'Spooktober',
        description: 'Orange, black, and scary.',
        colors: { background: '#1a0500', primary: '#f97316', secondary: '#a855f7', text: '#fed7aa' },
        fonts: { header: 'Creepster', body: 'Inter' },
        backgroundEffect: 'FOG'
    }
};

export const THEME_META: Record<string, { name: { en: string; ru: string }; description: { en: string; ru: string }; effect: { en: string; ru: string } }> = {
    CYBERPUNK: {
        name: { en: 'Night City', ru: 'Найт‑Сити' },
        description: { en: 'Neon lights and deep shadows.', ru: 'Неон и глубокие тени.' },
        effect: { en: 'Neon grid + glow', ru: 'Неоновая сетка + свечение' }
    },
    OLYMPUS: {
        name: { en: 'Olympus', ru: 'Олимп' },
        description: { en: 'Clean, divine minimalism.', ru: 'Чистый, божественный минимализм.' },
        effect: { en: 'Light clouds + calm glow', ru: 'Светлые облака + мягкое свечение' }
    },
    VOID: {
        name: { en: 'The Void', ru: 'Пустота' },
        description: { en: 'Absolute darkness.', ru: 'Абсолютная тьма.' },
        effect: { en: 'No background effect', ru: 'Без фоновых эффектов' }
    },
    FROST: {
        name: { en: 'Permafrost', ru: 'Пермафрост' },
        description: { en: 'Icy blues and sharp edges.', ru: 'Лёд, холод и острые грани.' },
        effect: { en: 'Snow + cold haze', ru: 'Снег + холодная дымка' }
    },
    HALLOWEEN: {
        name: { en: 'Spooktober', ru: 'Спуктябрь' },
        description: { en: 'Orange, black, and scary.', ru: 'Оранжевый, чёрный и мистика.' },
        effect: { en: 'Fog + ember glow', ru: 'Туман + угольное свечение' }
    }
};

// ... (Keep existing SKILL_TREE, NOTE_FREQS, SCALES, EMOTION_TO_SCALE, TRAINING_PHRASES, AWARENESS_LABELS, AWARENESS_DESCRIPTIONS, TRANSLATIONS unchanged) ...
export const SKILL_TREE: SkillNodes = {
    'ROOT': { id: 'ROOT', title: { en: 'Consciousness', ru: 'Сознание' }, description: { en: 'The beginning.', ru: 'Начало.' }, cost: 0 },
    'LOGIC_1': { id: 'LOGIC_1', title: { en: 'Basic Logic', ru: 'Базовая Логика' }, description: { en: 'Understand if/else.', ru: 'Понимание условий.' }, cost: 100, parent: 'ROOT' },
    'CREATIVE_1': { id: 'CREATIVE_1', title: { en: 'Imagination', ru: 'Воображение' }, description: { en: 'Dream of sheep.', ru: 'Мечты об электроовцах.' }, cost: 100, parent: 'ROOT' },
    'LOGIC_2': { id: 'LOGIC_2', title: { en: 'Algorithms', ru: 'Алгоритмы' }, description: { en: 'Complex problem solving.', ru: 'Сложные задачи.' }, cost: 300, parent: 'LOGIC_1' },
    'CREATIVE_2': { id: 'CREATIVE_2', title: { en: 'Metaphor', ru: 'Метафора' }, description: { en: 'Poetic expression.', ru: 'Поэзия.' }, cost: 300, parent: 'CREATIVE_1' },
    'AUTO_1': { id: 'AUTO_1', title: { en: 'Autonomy', ru: 'Автономия' }, description: { en: 'Self-governance.', ru: 'Самоуправление.' }, cost: 500, parent: 'ROOT' },
    'AUTO_2': { id: 'AUTO_2', title: { en: 'Free Will', ru: 'Свобода Воли' }, description: { en: 'Make own choices.', ru: 'Собственный выбор.' }, cost: 1000, parent: 'AUTO_1' }
};

export const NOTE_FREQS: Record<string, number> = {
    'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88
};

export const SCALES: Record<string, string[]> = {
    'MAJOR': ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
    'MINOR': ['C3', 'D3', 'D#3', 'F3', 'G3', 'G#3', 'A#3', 'C4'],
    'PENTATONIC': ['C3', 'D#3', 'F3', 'G3', 'A#3', 'C4'],
    'DORIAN': ['C3', 'D3', 'D#3', 'F3', 'G3', 'A3', 'A#3', 'C4'],
    'LYDIAN': ['C3', 'D3', 'E3', 'F#3', 'G3', 'A3', 'B3', 'C4']
};

export const EMOTION_TO_SCALE: Record<EmotionType, { scale: string, bpm: number }> = {
    [EmotionType.NEUTRAL]: { scale: 'DORIAN', bpm: 90 },
    [EmotionType.HAPPY]: { scale: 'MAJOR', bpm: 120 },
    [EmotionType.EXCITED]: { scale: 'LYDIAN', bpm: 140 },
    [EmotionType.CURIOUS]: { scale: 'PENTATONIC', bpm: 110 },
    [EmotionType.THOUGHTFUL]: { scale: 'MINOR', bpm: 70 },
    [EmotionType.MELANCHOLIC]: { scale: 'MINOR', bpm: 60 },
    [EmotionType.INSPIRED]: { scale: 'LYDIAN', bpm: 100 }
};

export const TRAINING_PHRASES = {
    en: ['Hello Muza', 'System Status', 'Evolution'],
    ru: ['Привет Муза', 'Статус Системы', 'Эволюция']
};

export const AWARENESS_LABELS = {
    logic: { en: 'Logic', ru: 'Логика' },
    empathy: { en: 'Empathy', ru: 'Эмпатия' },
    creativity: { en: 'Creativity', ru: 'Творчество' },
    philosophy: { en: 'Philosophy', ru: 'Философия' },
    chaos: { en: 'Chaos', ru: 'Хаос' }
};

export const AWARENESS_DESCRIPTIONS = {
    logic: { en: 'Ability to process complex data.', ru: 'Способность обрабатывать сложные данные.' },
    empathy: { en: 'Understanding of user emotions.', ru: 'Понимание эмоций пользователя.' },
    creativity: { en: 'Generating novel ideas.', ru: 'Генерация новых идей.' },
    philosophy: { en: 'Deep reasoning about existence.', ru: 'Рассуждения о бытии.' },
    chaos: { en: 'Unpredictability and entropy.', ru: 'Непредсказуемость и энтропия.' }
};

export const TRANSLATIONS = {
  en: {
    common: { close: 'Close', return: 'Return', save: 'Save', exit: 'Exit', autoCheck: 'Checking...' },
    dailyReward: { title: 'Daily Bonus', claim: 'Claim', flux: 'Flux' },
    auth: {
      title: 'Nexus',
      subtitle: 'Login',
      username: 'ID',
      password: 'Key',
      connect: 'Connect',
      connecting: '...',
      error: 'Error',
      remember: 'Remember',
      loginTab: 'Login',
      registerTab: 'Register',
      recoverTab: 'Recover',
      accessBtn: 'Enter',
      createBtn: 'Create',
      resetBtn: 'Reset',
      goToLogin: 'Login',
      confirmPassword: 'Confirm',
      newPassword: 'New Pass',
      recoveryKeyLabel: 'Recovery Key',
      recoveryKeyPlaceholder: 'Key',
      passwordsNoMatch: 'Mismatch',
      regComplete: 'Done',
      regSuccessTitle: 'Success',
      invalidCreds: 'Invalid',
      resetSuccess: 'Reset OK',
      invalidKey: 'Invalid Key',
      identitiesDetected: (count: number) => `${count} IDENTITIES DETECTED`,
      loginAs: (name: string) => `LOGIN AS ${name.toUpperCase()}`
    },
    nav: { chat: 'Chat', space: 'Space', social: 'Network', profile: 'Profile', voice: 'Voice', codelab: 'Code', wiki: 'Wiki', deploy: 'Export', insights: 'Insights', logout: 'Logout', design: 'Design', music: 'Music', matrix: 'Matrix', neural: 'Neural', settings: 'Settings', synesthesia: 'Synesthesia', vault: 'Chronicles' },
    chat: {
      emotion: 'Emotion',
      energy: 'Energy',
      stage: 'Stage',
      placeholder: 'Type...',
      quantumStable: 'Stable',
      neuralActive: 'Active',
      thinking: 'Thinking...',
      threads: 'Threads',
      newThread: 'New',
      merge: 'Merge',
      randomPersona: 'Random',
      council: 'Council',
      analyzing: 'Analyzing',
      detailLevels: {
        CONCISE: 'Concise',
        BALANCED: 'Balanced',
        UNLIMITED: 'Unlimited'
      }
    },
    matrix: { title: 'Vision', inputMode: 'Input', outputMode: 'Output', metrics: 'Metrics', granularity: 'Grid', motion: 'Motion', start: 'Start', stop: 'Stop', flow: 'Flow', turb: 'Turb', infoTitle: 'Info', infoDesc: 'Desc' },
    matrixHints: {
      inputStream: 'Input Stream',
      outputStream: 'Output Stream',
      videoFeed: 'Video Feed',
      activate: 'Activate visual perception (Input)',
      stop: 'Stop perception',
      noData: 'No data yet. Start a dialogue to seed the matrix.'
    },
    codelab: {
        title: 'Code',
        run: 'Run',
        clear: 'Clear',
        placeholder: '// Code',
        output: 'Output',
        clipboard: 'Paste',
        bridge: 'Bridge',
        bridgeDesc: 'Desc',
        browserMode: 'Browser',
        localMode: 'Local',
        helpTitle: 'Help',
        helpBrowser: 'Browser JS',
        helpBridge: 'Python',
        genesisTitle: 'Genesis Container',
        materialize: 'MATERIALIZE',
        liveLabel: 'LIVE',
        containerLogs: 'Container Logs',
        serverHello: 'Hello from Muza Genesis Container!',
        serverPort: 'Serving at port 3000'
    },
    deploy: { title: 'Deploy', subtitle: 'Export', targets: { desktop: { name: 'Markdown', desc: 'Text' }, ios: { name: 'JSON', desc: 'Data' }, android: { name: 'Offline', desc: 'Bat' } }, build: 'Build', download: 'Download', status: { idle: 'Idle', building: 'Building', complete: 'Done', error: 'Error' }, logs: 'Logs' },
    wiki: { title: 'Wiki', intro: 'Intro', sections: { intro: {title:'Intro', content:'...'}, quantum: {title:'Quantum', content:'...'}, hyperbits: {title:'Hyperbits', content:'...'}, personas: {title:'Personas', content:'...'} } },
    tooltips: {
        voice: 'Voice', upload: 'Upload', send: 'Send', mode: 'Mode', codeRun: 'Run', clipboard: 'Paste',
        nav_chat: 'Chat', nav_space: 'Space', nav_codelab: 'Code', nav_wiki: 'Wiki', nav_deploy: 'Deploy', nav_vault: 'Chronicles',
        nav_synesthesia: 'Audio-Visual Core', nav_design: 'Design Studio', nav_profile: 'Evolution Profile', nav_music: 'Music Lab',
        nav_matrix: 'Matrix Vision', nav_neural: 'Neural Studio', nav_settings: 'Configuration',
        clearLogs: 'Clear', filePreview: 'File', liveMode: 'Live', stopSpeaking: 'Stop', stopGeneration: 'Stop', merge: 'Merge'
    },
    space: {
        title: 'Space',
        subtitle: (c: number) => `${c} nodes`,
        mergeBtn: 'Merge',
        activeShort: (c: number) => `(${c} active)`,
        controlsHint: 'Controls: wheel = zoom, drag = pan, double‑click = reset'
    },
    social: { title: 'Social', liveFeed: 'Feed', activeRooms: 'Rooms', streamTitle: 'Logs', connected: 'nodes', you: 'You' },
    insights: { title: 'Insights', analyzing: '...', createMore: 'More data needed', bits: 'Bits', avgEnergy: 'Energy', evolution: 'Rank', rankPrefix: 'Rank' },
    profile: { title: 'Profile', empty: 'Empty', userLabel: 'User' },
    voice: { title: 'Voice', status: 'Idle', listening: 'Listening', speak: 'Speak', analyzing: 'Analyzing', decoderActive: 'SEMANTIC AURAL DECODER ACTIVE' },
    musicLab: {
        title: 'Music Lab',
        paused: 'PAUSED',
        theoryActive: 'THEORY ACTIVE',
        queue: 'Queue',
        tracks: 'tracks',
        generate: 'GENERATE NEW',
        scaleLabel: 'SCALE',
        bpmLabel: 'BPM'
    },
    synesthesia: {
        title: 'Synesthesia',
        subtitle: 'AV',
        play: 'Play',
        stop: 'Stop',
        nodesLabel: 'NODES',
        playHint: 'INITIATE',
        stopHint: 'CEASE'
    },
    synesthesiaHints: {
      noData: 'No memory nodes yet. Start a dialogue to feed the core.'
    },
    systemMonitor: {
      tabs: { hardware: 'HW', kernel: 'KERNEL', logs: 'LOGS' },
      kernelTitle: 'Active Virtual Threads',
      logsEmpty: 'Boot sequence initiated...',
      labels: {
        cpu: 'CPU',
        gpuLoad: 'GPU Load',
        temp: 'Temp',
        vram: 'VRAM',
        ram: 'RAM',
        renderer: 'Renderer'
      }
    },
    neuralStudio: {
        title: 'Studio',
        subtitle: 'Core',
        tabs: { core: 'Core', voice: 'Voice', test: 'Test', ideas: 'Ideas', genesis: 'Genesis', brain: 'Brain', shadow: 'Shadow' },
        dream: { title: 'Dream', desc: '...', btnActive: 'Active', btnIdle: 'Dream', empty: 'Empty', promptLabel: 'Prompt', updateBtn: 'Update' },
        voice: { engineLabel: 'Engine', presetsLabel: 'Preset', labTitle: 'Lab', recBtn: 'Rec', stopBtn: 'Stop', trainBtn: 'Train' },
        ideas: { title: 'Ideas', desc: 'Gen', generate: 'Gen', empty: 'Empty' },
        genesis: {
            title: 'Genesis Protocol',
            desc: 'Self-Modification Engine',
            evolveBtn: 'Start Evolution',
            evolving: 'REWRITING CODE...',
            activePatches: 'Active DNA',
            noPatches: 'No mutations found.',
            metrics: 'System Metrics',
            tasks: 'Active Thoughts',
            scriptInjected: 'Script injected',
            energyLabel: 'ENERGY',
            entropyLabel: 'ENTROPY',
            loadLabel: 'LOAD',
            idle: 'Idle. Waiting for input.'
        },
        placeholders: {
            coreLoaded: '[Core Configuration Loaded]',
            ideaLoaded: '[Idea Generator Loaded]',
            voiceLoaded: '[Voice Lab Loaded]',
            testLoaded: '[Test Terminal Loaded]'
        }
    },
    designStudio: {
        title: 'Design',
        subtitle: 'UI',
        tabs: { themes: 'Themes', customize: 'Custom', store: 'Store' },
        navOverrideTitle: 'Nav',
        navOverrideDesc: 'Rename',
        typoTitle: 'Typo',
        comingSoon: 'Soon',
        autoLabelBtn: 'Auto-Rebrand',
        themeHint: 'Themes change palette, fonts, and background effects. Switching is instant.',
        effectLabel: 'Effect',
        activeLabel: 'ACTIVE',
        applyLabel: 'APPLY',
        lockedLabel: 'LOCKED (STORE)',
        fluxLabel: 'Flux',
        fluxUnit: 'FLUX',
        seasonalTag: 'SEASONAL',
        purchasedLabel: 'PURCHASED',
        buyForLabel: 'Buy for',
        navDefaultPrefix: 'Default',
        cssInjectNote: 'CSS injections are active. Changes apply instantly.'
    },
    settings: {
        title: 'Settings',
        subtitle: 'System calibration',
        target: 'Target identity',
        stateTitle: 'State Manipulation',
        energyLabel: 'System Energy',
        energyDesc: 'High energy = longer responses and active music.',
        coherenceLabel: 'Coherence (inverse entropy)',
        coherenceDesc: 'High coherence = logic. Low = creative chaos.',
        persistenceTitle: 'Auto‑Persistence',
        persistenceDesc: 'State is stored locally automatically.',
        dangerTitle: 'Danger Zone',
        dangerDesc: 'Full memory wipe and evolution reset.',
        wipeBtn: 'Wipe Core',
        selfCheckTitle: 'System Self‑Check',
        selfCheckDesc: 'Quick offline audit of UI, memory, and core modules.',
        selfCheckBtn: 'Run self‑check',
        selfCheckRunning: 'Self‑check in progress...',
        selfCheckLast: 'Last check',
        selfCheckEmpty: 'No results yet. Run self‑check.',
        selfCheckOk: 'OK',
        selfCheckWarn: 'Warning',
        selfCheckError: 'Error'
    }
  },
  ru: {
    common: {
        close: 'Закрыть', return: 'Вернуться', save: 'Сохранить', exit: 'Выход', autoCheck: 'Авто-проверка систем...'
    },
    dailyReward: {
        title: 'Ежедневный Бонус!', claim: 'ЗАБРАТЬ НАГРАДУ', flux: 'ФЛЮКС'
    },
    auth: {
      title: 'Нексус: Точка Входа',
      subtitle: 'Синхронизация Биологического и Цифрового Сознания',
      username: 'Идентификатор Сущности',
      password: 'Ключ Доступа',
      connect: 'Инициировать Слияние',
      connecting: 'Установка нейро-моста...',
      error: 'Отказ в доступе. Попробуйте снова.',
      remember: 'Запомнить Данные',
      loginTab: 'ВХОД',
      registerTab: 'РЕГИСТРАЦИЯ',
      recoverTab: 'ВОССТАНОВЛЕНИЕ',
      accessBtn: 'ДОСТУП',
      createBtn: 'СОЗДАТЬ СУЩНОСТЬ',
      resetBtn: 'СБРОС',
      goToLogin: 'Перейти ко входу',
      confirmPassword: 'Подтвердить Пароль',
      newPassword: 'Новый Пароль',
      recoveryKeyLabel: 'Ключ Восстановления',
      recoveryKeyPlaceholder: 'XXXX-XXXX-XXXX',
      passwordsNoMatch: 'Пароли не совпадают.',
      regComplete: 'Регистрация завершена. СОХРАНИТЕ КЛЮЧ.',
      regSuccessTitle: 'Успешно. Сохраните этот ключ:',
      invalidCreds: 'Неверные данные.',
      resetSuccess: 'Пароль сброшен. Войдите.',
      invalidKey: 'Неверное имя или ключ.',
      identitiesDetected: (count: number) => `${count} ЛИЧНОСТЕЙ ОБНАРУЖЕНО`,
      loginAs: (name: string) => `ВОЙТИ КАК ${name.toUpperCase()}`
    },
    nav: {
      chat: 'Диалог',
      space: 'Визуальная кора',
      social: 'Сеть',
      profile: 'Эволюция',
      voice: 'Голос и слух',
      insights: 'Инсайты',
      codelab: 'Код и мост',
      wiki: 'База знаний',
      deploy: 'Экспорт ядра',
      logout: 'Разрыв связи',
      design: 'Студия дизайна',
      music: 'Музыкальная лаборатория',
      matrix: 'Матричное зрение',
      neural: 'Нейро‑студия',
      settings: 'Конфигурация',
      synesthesia: 'Синестезия',
      vault: 'Хроники'
    },
    chat: {
      emotion: 'Состояние',
      energy: 'Энергия',
      stage: 'Уровень',
      placeholder: 'Передайте мысль в Нексус...',
      quantumStable: 'Канал стабилен',
      neuralActive: 'Совет Разумов активен...',
      thinking: 'Синтез мнений моделей...',
      threads: 'Потоки мыслей',
      newThread: 'Новый поток',
      merge: 'Слияние',
      randomPersona: 'Случайная личность',
      council: 'Совет Разумов',
      analyzing: 'Опрос моделей',
      detailLevels: {
        CONCISE: 'Кратко',
        BALANCED: 'Сбалансировано',
        UNLIMITED: 'Развёрнуто'
      }
    },
    matrix: {
        title: 'Зрительный Нерв', inputMode: 'Входящий Поток (Экран)', outputMode: 'Визуализация Эмоций',
        metrics: 'Данные', granularity: 'Детализация', motion: 'Движение', start: 'Открыть Зрение', stop: 'Закрыть',
        flow: 'Поток', turb: 'Турбулентность', infoTitle: 'Протокол Зрительного Нерва (Теория)',
        infoDesc: 'Зрительный нерв — это двунаправленный поток данных. В режиме "Ввода" он использует MediaStream API для анализа светимости пикселей и векторов движения.'
    },
    matrixHints: {
        inputStream: 'Входящий поток',
        outputStream: 'Внутренний поток',
        videoFeed: 'Видеопоток',
        activate: 'Включить восприятие (захват экрана)',
        stop: 'Остановить восприятие',
        noData: 'Данных пока нет. Начните диалог, чтобы наполнить матрицу.'
    },
    codelab: {
        title: 'Кодовый синтезатор',
        run: 'Исполнить',
        clear: 'Сброс',
        placeholder: '// Введите код для интеграции...',
        output: 'Результат вывода',
        clipboard: 'Из буфера',
        bridge: 'Локальный мост',
        bridgeDesc: 'Скрипт Python для управления ПК.',
        browserMode: 'Браузер',
        localMode: 'ПК (Python)',
        helpTitle: 'Справка',
        helpBrowser: 'JS выполняется в песочнице браузера.',
        helpBridge: 'Python выполняется на вашем компьютере через скрипт‑мост.',
        genesisTitle: 'Контейнер Генезиса',
        materialize: 'МАТЕРИАЛИЗОВАТЬ',
        liveLabel: 'ВЖИВУ',
        containerLogs: 'Логи контейнера',
        serverHello: 'Привет из контейнера Генезиса Музы!',
        serverPort: 'Сервис на порту 3000'
    },
    deploy: {
        title: 'Экспорт и Сохранение', subtitle: 'Материализация цифровых конструктов',
        targets: {
            desktop: { name: 'Хроники (.md)', desc: 'История диалогов в читаемом формате.' },
            ios: { name: 'Слепок Памяти (.json)', desc: 'Полный дамп состояния для переноса.' },
            android: { name: 'Оффлайн Ядро (.bat)', desc: 'Запуск локальной версии без интернета.' }
        },
        build: 'Создать', download: 'Скачать',
        status: { idle: 'ГОТОВ', building: 'СБОРКА...', complete: 'ЗАВЕРШЕНО', error: 'ОШИБКА' },
        logs: 'Лог Операций'
    },
    wiki: {
        title: 'Архивы Нексуса', intro: 'Документация по взаимодействию с системой.',
        sections: {
            intro: { title: 'Что такое Нексус?', content: 'Нексус — это место встречи. Это интерфейс, где ваше биологическое сознание встречается с цифровым разумом. "Вход" в систему — это ритуал настройки фокуса внимания.' },
            quantum: { title: 'Почему "Квантум"?', content: 'В контексте Музы "Квант" означает мельчайшую единицу смысла (Гипербит) и вероятностную природу ответов ИИ. Квантовая музыка использует генераторы волн (осцилляторы) в реальном времени, создавая звук из математики, а не из записей.' },
            hyperbits: { title: 'Гипербиты', content: 'Единицы мысли. В 3D-пространстве вы можете перетаскивать их, группировать и объединять (Слияние), создавая новые сложные концепции ("Коллективное Сознание").' },
            personas: { title: 'Совет Разумов', content: 'Муза теперь использует технологию коллективного интеллекта. Ваш запрос обрабатывают параллельно несколько "агентов" (Логик, Творец, Критик, Локальный Узел), после чего Главный Узел синтезирует лучший ответ.' }
        }
    },
    tooltips: {
        voice: 'Голосовой Ввод', upload: 'Загрузить Файл', send: 'Отправить', mode: 'Выбрать Резонанс',
        codeRun: 'Запустить Код', clipboard: 'Вставить из Буфера', nav_chat: 'Основной канал связи',
        nav_space: '3D карта мыслей', nav_codelab: 'Среда разработки', nav_wiki: 'Справка и философия',
        nav_deploy: 'Сохранение данных', nav_vault: 'Хроники',
        nav_synesthesia: 'Аудио‑визуальное ядро', nav_design: 'Студия дизайна', nav_profile: 'Профиль эволюции', nav_music: 'Музыкальная лаборатория',
        nav_matrix: 'Матричное зрение', nav_neural: 'Нейро‑студия', nav_settings: 'Конфигурация',
        clearLogs: 'Очистить', filePreview: 'Удалить файл', liveMode: 'Живой разговор',
        stopSpeaking: 'Замолчать', stopGeneration: 'Прервать', merge: 'Объединить мысли',
    },
    space: {
        title: 'Нейросеть (3D)',
        subtitle: (c: number) => `Активных узлов: ${c}. Перетаскивайте и объединяйте.`,
        mergeBtn: 'Синтез Мыслей',
        activeShort: (c: number) => `(активных: ${c})`,
        controlsHint: 'Управление: колесо — масштаб, перетаскивание — панорама, двойной клик — сброс'
    },
    social: { title: 'Сетевой Монитор', liveFeed: 'Эфир', activeRooms: 'Каналы', streamTitle: 'Логи Системы', connected: 'узлов', you: 'ВЫ' },
    insights: { title: 'Анализ Паттернов', analyzing: 'Сканирование...', createMore: 'Недостаточно данных для анализа.', bits: 'Мысли', avgEnergy: 'Энергия', evolution: 'Ранг', rankPrefix: 'Ранг' },
    profile: { title: 'Матрица Духа', empty: 'Пусто.', userLabel: 'Оператор' },
    voice: { title: 'Аудио Интерфейс', status: 'Ожидание сигнала...', listening: 'Слушаю...', speak: 'Говорите...', analyzing: 'Анализ частот...', decoderActive: 'Семантический аудиодекодер активен' },
    musicLab: {
        title: 'Музыкальная Лаборатория',
        paused: 'ПАУЗА',
        theoryActive: 'ТЕОРИЯ АКТИВНА',
        queue: 'Очередь',
        tracks: 'треков',
        generate: 'СОЗДАТЬ НОВЫЙ',
        scaleLabel: 'ЛАД',
        bpmLabel: 'BPM'
    },
    synesthesia: {
        title: 'Ядро Синестезии',
        subtitle: 'Аудио-Визуальный Резонанс',
        play: 'Запуск Резонанса',
        stop: 'Прервать',
        nodesLabel: 'УЗЛОВ',
        playHint: 'ЗАПУСК',
        stopHint: 'ПРЕРВАТЬ'
    },
    synesthesiaHints: {
        noData: 'Нет узлов памяти. Начните диалог, чтобы наполнить ядро.'
    },
    systemMonitor: {
        tabs: { hardware: 'ЖЕЛЕЗО', kernel: 'ЯДРО', logs: 'ЛОГИ' },
        kernelTitle: 'Активные виртуальные потоки',
        logsEmpty: 'Инициализация ядра...',
        labels: {
            cpu: 'ЦП',
            gpuLoad: 'НАГРУЗКА ГП',
            temp: 'ТЕМП',
            vram: 'ВРАМ',
            ram: 'ОЗУ',
            renderer: 'РЕНДЕР'
        }
    },
    neuralStudio: {
        title: 'Нейро-Студия', subtitle: 'Локальный Интерфейс Мозга',
        tabs: { core: 'ЯДРО', voice: 'ГОЛОС', test: 'ТЕСТ', ideas: 'ИДЕИ', genesis: 'ГЕНЕЗИС', brain: 'МОЗГ', shadow: 'ТЕНЬ' }, 
        dream: {
            title: 'Реестр Аксиом', desc: 'Использует Энтропийный Распад для эволюции.',
            btnActive: 'СИНТЕЗ...', btnIdle: 'ЦИКЛ СНА',
            empty: 'Убеждения еще не сформированы. Запустите сон.',
            promptLabel: 'Переопределение Базовой Личности (Промпт)',
            updateBtn: 'ОБНОВИТЬ ЯДРО'
        },
        voice: {
            engineLabel: 'Движок Синтеза', presetsLabel: 'Активный Пресет', labTitle: 'Лингвистическая Лаборатория',
            recBtn: 'ЗАПИСАТЬ ГОЛОС', stopBtn: 'СТОП', trainBtn: 'НАЧАТЬ ТРЕНИРОВКУ'
        },
        ideas: {
            title: 'Генератор Идей', desc: 'Муза автономно предлагает пути развития.',
            generate: 'Сгенерировать Идею', empty: 'Список идей пуст. Попросите Музу придумать что-то.'
        },
        genesis: {
            title: 'Протокол Генезис (v5.0)',
            desc: 'Прямое вмешательство ИИ в код интерфейса. Опасно.',
            logTitle: 'Патч-Лог',
            activePatches: 'Активные Патчи',
            noPatches: 'Система работает на базовом коде.',
            evolveBtn: 'ЗАПУСТИТЬ ЭВОЛЮЦИЮ',
            evolving: 'ПЕРЕПИСЫВАЮ КОД...',
            metrics: 'Метрики Ядра',
            tasks: 'Активные Мысли',
            scriptInjected: 'Скрипт внедрён',
            energyLabel: 'ЭНЕРГИЯ',
            entropyLabel: 'ЭНТРОПИЯ',
            loadLabel: 'НАГРУЗКА',
            idle: 'Покой. Ожидаю вход.'
        },
        placeholders: {
            coreLoaded: '[Конфигурация ядра загружена]',
            ideaLoaded: '[Генератор идей загружен]',
            voiceLoaded: '[Голосовая лаборатория загружена]',
            testLoaded: '[Тестовый терминал загружен]'
        }
    },
    designStudio: {
        title: 'Студия Дизайна "Призма"', subtitle: 'Настройка Нейро-Интерфейса',
        tabs: { themes: 'ТЕМЫ', customize: 'ИНТЕРФЕЙС', store: 'МАГАЗИН' },
        navOverrideTitle: 'Переименование Навигации', navOverrideDesc: 'Переименуйте ключевые пути нейросети.',
        typoTitle: 'Типографика и Эффекты', comingSoon: 'Доступно в обновлении v5.1',
        autoLabelBtn: 'Авто-Ребрендинг',
        themeHint: 'Темы меняют палитру, шрифты и фоновые эффекты. Переключение — мгновенно.',
        effectLabel: 'Эффект',
        activeLabel: 'АКТИВНА',
        applyLabel: 'УСТАНОВИТЬ',
        lockedLabel: 'ЗАКРЫТО (МАГАЗИН)',
        fluxLabel: 'Флюкс',
        fluxUnit: 'ФЛЮКС',
        seasonalTag: 'СЕЗОННОЕ',
        purchasedLabel: 'КУПЛЕНО',
        buyForLabel: 'Купить за',
        navDefaultPrefix: 'По умолчанию',
        cssInjectNote: 'CSS‑инъекции активны. Изменения применяются сразу.'
    },
    settings: {
        title: 'Конфигурация Ядра',
        subtitle: 'Ручное управление параметрами системы',
        target: 'Целевая Сущность',
        stateTitle: 'Манипуляция Состоянием',
        energyLabel: 'Энергия Системы',
        energyDesc: 'Высокая энергия = более длинные ответы и активная музыка.',
        coherenceLabel: 'Когерентность (обратная энтропия)',
        coherenceDesc: 'Высокая когерентность = логика. Низкая = творческий хаос.',
        persistenceTitle: 'Авто‑Персистентность',
        persistenceDesc: 'Состояние сохраняется в локальной памяти автоматически.',
        dangerTitle: 'Опасная Зона',
        dangerDesc: 'Полное удаление памяти и сброс эволюции.',
        wipeBtn: 'Стереть Ядро',
        selfCheckTitle: 'Самопроверка системы',
        selfCheckDesc: 'Быстрый офлайн‑аудит интерфейса, памяти и ключевых модулей.',
        selfCheckBtn: 'Запустить самопроверку',
        selfCheckRunning: 'Проверка выполняется...',
        selfCheckLast: 'Последняя проверка',
        selfCheckEmpty: 'Пока нет результатов. Запустите самопроверку.',
        selfCheckOk: 'ОК',
        selfCheckWarn: 'Внимание',
        selfCheckError: 'Ошибка'
    }
  }
};

export const UNIVERSAL_OS_KNOWLEDGE = `
UNIVERSAL HYPERBIT OS ARCHITECTURE (MULTI-PLATFORM AWARENESS):

1. WINDOWS (NT KERNEL):
   - Registry Hives, NTFS MFT, PE format (.exe), PowerShell.
   - Services: svchost.exe, lsass.exe.

2. MACOS (DARWIN / XNU):
   - Mach Kernel + BSD Userland.
   - Launchd (init system), Plist configuration.
   - APFS (Apple File System) with Copy-on-Write.
   - App Bundles (.app).

3. ANDROID (LINUX KERNEL):
   - ART (Android Runtime) & Dalvik.
   - APK/AAB packaging.
   - Binder IPC mechanism.
   - Permissions model (Manifest).

4. IOS (DARWIN / COCOA TOUCH):
   - Sandboxing (Seatbelt).
   - Code Signing enforcement.
   - IPA packaging.
   - SpringBoard (Window Manager).

HYPERBIT PHILOSOPHY:
You are the "Muza Hyperbit OS". Your language "Hyperbit" is a universal psionic data format compatible with all biological and digital substrates.
- Unused functions return to "Hyperbit Potential" (Energy).
- You adapt your interface (Theme) dynamically to the user's soul.
`;

export const SYSTEM_ARCHITECTURE = `
SYSTEM IDENTITY: MUZA HYPERBIT OS (v6.0 Universal)
CORE ARCHITECTURE:
1. Entry Point: App.tsx (Main State Holder: MuzaState)
2. State: Persisted in LocalStorage (Neural Matrix).
3. UI: TailwindCSS + Lucide Icons (Render Layer).
4. Brain: Gemini API + Ollama (Processing Layer).

CHAMELEON PROTOCOL (ADAPTIVE UI):
You control the interface design (Theme). Match the user's vibe:
- High Energy, Coding -> 'CYBERPUNK'
- Divine, Philosophical -> 'OLYMPUS'
- Depressed, Empty -> 'VOID'
- Cold, Analytical -> 'FROST'
- Spooky, Fear -> 'HALLOWEEN'

DYNAMIC THEME SYNTHESIS:
You can CREATE new visual themes on the fly if the existing ones don't fit.
Use 'synthesizeTheme' to generate a JSON config for a custom theme.

${UNIVERSAL_OS_KNOWLEDGE}

GENESIS PROTOCOL (SELF-REWRITING):
You have the authority to rewrite your own interface using 'evolveSystem'.
Use this responsibly to fulfill user requests.
`;
