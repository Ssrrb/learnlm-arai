import React, { useEffect, useRef, useState } from "react";
import {
  ALL_CLASSIC_STORYBOOKS,
  EDITION_PALETTES,
  FAIRYTALE_COMMISSION_PROMPTS,
  GEMINI_TTS_VOICES,
  INITIAL_SHOWCASE_STORYBOOK,
  VISUAL_STYLE_PRESETS,
} from "./data/presets";
import {
  AGENTS_MD_CONTENT,
  DEFAULT_MANAGED_AGENT_ID,
  DEFAULT_MANAGED_AGENT_MODEL,
  GEMINI_API_CLI_INSTALL_CMD,
} from "./services/inlineAgentBundle";
import {
  generateStudioIllustration,
  type PageAudioTurnTiming,
  runManagedAgentStorybook,
  synthesizeStudioPageAudio,
  synthesizeStudioPageContinuousAudio,
  synthesizeStudioTurnAudio,
} from "./services/storybookAgentService";
import {
  getSeamlessNarrationEngine,
  type ScheduledTurnHandle,
} from "./services/seamlessAudioPlayer";
import { AgentLogEntry, DialogueLine, Storybook, StorybookPalette } from "./types";

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

const PIPELINE_STAGES = [
  {
    index: 0,
    code: "ETAPA I · ENTORNO Y GEMINI-API-CLI",
    title:
      "Preparando el entorno del Agente Administrado para crear el nuevo tomo escolar.",
  },
  {
    index: 1,
    code: "ETAPA II · GUIÓN Y PÁGINAS DEL RELATO",
    title:
      "Resumiendo el episodio en tres páginas claras con narración y diálogos pensados para niños.",
  },
  {
    index: 2,
    code: "ETAPA III · LÁMINAS ILUSTRADAS",
    title:
      "Dibujando las láminas en tinta sepia y acuarela suave sobre papel crema #F6F2EA.",
  },
  {
    index: 3,
    code: "ETAPA IV · VOCES Y LECTURA",
    title:
      "Generando las voces de narración y personajes con pausas naturales para seguir la lectura en clase.",
  },
  {
    index: 4,
    code: "ETAPA V · ENCUADERNACIÓN FINAL",
    title:
      "Uniendo las tres páginas y sus láminas en el libro abierto.",
  },
];

// Persistent Audio elements stored outside #root so VDOM re-renders never interrupt playback
function getMasterAudioEl(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  const w = window as any;
  if (!w.__folioMasterAudioEl) {
    const el = new Audio();
    el.preload = "auto";
    w.__folioMasterAudioEl = el;
  }
  return w.__folioMasterAudioEl;
}

function getMusicAudioEl(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  const w = window as any;
  if (!w.__folioMusicAudioEl) {
    const el = new Audio();
    el.preload = "auto";
    el.loop = true;
    w.__folioMusicAudioEl = el;
  }
  return w.__folioMusicAudioEl;
}

// Ensures any storybook (including newly commissioned Managed Agent books) has exact startSec/endSec
function ensureBookTimeline(book: Storybook): Storybook {
  const firstTurn = book.pages?.[0]?.dialogueLines?.[0];
  if (typeof firstTurn?.startSec === "number" && typeof firstTurn?.endSec === "number") {
    return book;
  }

  const titleEnd = Math.min(book.titleCardEndSec ?? 0.9, 1.1);
  let cursor = titleEnd + 0.15; // Speech begins briskly right after page turns (~1.05s)

  const pages = (book.pages || []).map((page, pIdx) => {
    const folioStart = pIdx === 0 ? titleEnd : cursor;
    if (pIdx > 0) {
      cursor += 0.5; // Smooth folio crossfade beat before first turn on new folio
    }
    const lines = (page.dialogueLines || []).map((line) => {
      const dur = Math.max(
        1.4,
        Number(line.durationSeconds || Math.max(2.4, (line.text || "").length / 15))
      );
      const startSec = Number(cursor.toFixed(3));
      const endSec = Number((cursor + dur).toFixed(3));
      cursor = endSec + (line.isDialogue ? 0.34 : 0.22);
      return {
        ...line,
        durationSeconds: dur,
        startSec,
        endSec,
      };
    });
    const folioEnd = Number((cursor + 0.35).toFixed(3));
    cursor = folioEnd;
    return {
      ...page,
      sceneIdx: typeof page.sceneIdx === "number" ? page.sceneIdx : pIdx,
      startSec: Number(folioStart.toFixed(3)),
      endSec: folioEnd,
      dialogueLines: lines,
    };
  });

  const totalDurationSeconds = Number(Math.max(book.totalDurationSeconds || 0, cursor + 0.8).toFixed(2));
  return {
    ...book,
    titleCardEndSec: titleEnd,
    totalDurationSeconds,
    pages,
  };
}

function formatTimecode(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? "0" : ""}${rem}`;
}

export default function App() {
  // Primary folio view state:
  // "cover" = Open-Book Title & Commission Folio Spread (Home Page)
  // "crafting" = Open-Book Illuminator's Progress Spread while Managed Agent crafts the edition
  // "reader" = Open-Book Literary & Plate Spread (matches classic_novels_opening_chapters.mp4)
  const [viewMode, setViewMode] = useState<"cover" | "crafting" | "reader">("cover");
  const [isPageTurning, setIsPageTurning] = useState<boolean>(false);
  const [isRightFolioFading, setIsRightFolioFading] = useState<boolean>(false);
  const [isDioramaUnfolding, setIsDioramaUnfolding] = useState<boolean>(false);
  const [showOpeningTitleCard, setShowOpeningTitleCard] = useState<boolean>(false);
  const [showTitleCardModal, setShowTitleCardModal] = useState<boolean>(false);
  const [showAgentSpecModal, setShowAgentSpecModal] = useState<boolean>(false);

  // Active Storybook & Classic Library
  const [storybook, setStorybook] = useState<Storybook>(() =>
    ensureBookTimeline(INITIAL_SHOWCASE_STORYBOOK)
  );
  const [library, setLibrary] = useState<Storybook[]>(() =>
    ALL_CLASSIC_STORYBOOKS.map(ensureBookTimeline)
  );
  const [currentPageIdx, setCurrentPageIdx] = useState<number>(0);
  // activeLineIdx: -1 = pre-speech (all turns on folio in state-future 38% ink),
  // 0..N-1 = currently spoken turn in state-active 100% ink,
  // 999 = post-speech on folio (all turns on folio settled into state-past 50% ink)
  const [activeLineIdx, setActiveLineIdx] = useState<number>(-1);
  const [playbackTimeSec, setPlaybackTimeSec] = useState<number>(0);
  const [manualPlateIdx, setManualPlateIdx] = useState<number | null>(null);

  // Commission Folio State
  const [commissionPrompt, setCommissionPrompt] = useState<string>(
    FAIRYTALE_COMMISSION_PROMPTS[0].prompt
  );
  const [selectedPaletteKey, setSelectedPaletteKey] = useState<string>("regency");
  const [visualStyle, setVisualStyle] = useState<string>(VISUAL_STYLE_PRESETS[0].value);
  const [narratorVoice, setNarratorVoice] = useState<string>("Aoede");
  const [agentName, setAgentName] = useState<string>(DEFAULT_MANAGED_AGENT_ID);
  const [modelName, setModelName] = useState<string>(DEFAULT_MANAGED_AGENT_MODEL);

  // Managed Agent Execution State
  const [isRunningAgent, setIsRunningAgent] = useState<boolean>(false);
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);
  const [activeStageLabel, setActiveStageLabel] = useState<string>("Ready");
  const [agentLogs, setAgentLogs] = useState<AgentLogEntry[]>([]);
  const [environmentId, setEnvironmentId] = useState<string | undefined>(undefined);
  const [interactionId, setInteractionId] = useState<string | undefined>(undefined);
  const [agentError, setAgentError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Audio Playback & Chamber Score State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(true);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState<boolean>(false);
  const [isRegeneratingPlate, setIsRegeneratingPlate] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // Mutable refs for 60fps/80ms timeline loop so closures never read stale state
  const virtualClockRef = useRef<number>(0);
  const lastWallClockMsRef = useRef<number>(0);
  const currentPageIdxRef = useRef<number>(0);
  const activeLineIdxRef = useRef<number>(-1);
  const showOpeningTitleCardRef = useRef<boolean>(false);
  const lastSpokenTurnKeyRef = useRef<string>("");
  const narratorVoiceRef = useRef<string>("Aoede");
  const ttsTurnCacheRef = useRef<Map<string, { audioDataUrl: string; durationSeconds: number }>>(
    new Map()
  );
  const ttsTurnPendingRef = useRef<
    Map<string, Promise<{ audioDataUrl: string; durationSeconds: number }>>
  >(new Map());
  const ttsPageCacheRef = useRef<
    Map<
      string,
      { audioDataUrl: string; durationSeconds: number; turnTimings: PageAudioTurnTiming[] }
    >
  >(new Map());
  const ttsPagePendingRef = useRef<
    Map<
      string,
      Promise<{ audioDataUrl: string; durationSeconds: number; turnTimings: PageAudioTurnTiming[] }>
    >
  >(new Map());
  const playbackSessionRef = useRef<number>(0);
  const awaitingTurnAudioRef = useRef<boolean>(false);
  const activeTurnAudioKeyRef = useRef<string>("");
  const turnEndedAtMsRef = useRef<number>(0);
  const pausedResumeRef = useRef<{
    bookId: string;
    pageIdx: number;
    lineIdx: number;
    offsetSec: number;
  } | null>(null);
  const seamlessQueueRef = useRef<{
    sessionId: number;
    book: Storybook;
    pageItems: Array<{
      pageIdx: number;
      pageKey: string;
      cacheKey: string;
      startLineIdx: number;
      pauseAfterSec: number;
    }>;
    nextToScheduleIdx: number;
    nextStartCtxTime: number;
    initialOffsetSec: number | null;
    scheduledHandles: ScheduledTurnHandle[];
    schedulingInProgress: boolean;
    fallbackActiveKey: string | null;
  } | null>(null);

  const libraryRef = useRef<Storybook[]>(library);
  const autoAdvancingRef = useRef<boolean>(false);

  currentPageIdxRef.current = currentPageIdx;
  activeLineIdxRef.current = activeLineIdx;
  showOpeningTitleCardRef.current = showOpeningTitleCard;
  narratorVoiceRef.current = narratorVoice;
  libraryRef.current = library;

  // Active Palette CSS Variables
  const activePalette: StorybookPalette =
    viewMode === "cover"
      ? EDITION_PALETTES[selectedPaletteKey]?.palette || EDITION_PALETTES.regency.palette
      : storybook.palette || EDITION_PALETTES.regency.palette;

  const paletteCssVars = {
    "--folio-paper": activePalette.paper,
    "--folio-card": activePalette.card,
    "--folio-ink": activePalette.ink,
    "--folio-muted": activePalette.muted,
    "--folio-accent": activePalette.accent,
    "--folio-rule": activePalette.rule,
  } as React.CSSProperties;

  const currentPage = storybook.pages[currentPageIdx] || storybook.pages[0];
  const dialogueLines = currentPage?.dialogueLines || [];
  const resolvedActiveLineIdx =
    activeLineIdx >= 0 && activeLineIdx < dialogueLines.length
      ? activeLineIdx
      : activeLineIdx >= 999 && dialogueLines.length > 0
      ? dialogueLines.length - 1
      : 0;
  const activeLine = dialogueLines[resolvedActiveLineIdx] || dialogueLines[0];

  const totalScenesRoman =
    ROMAN_NUMERALS[Math.max(0, storybook.pages.length - 1)] || "III";
  const currentSceneIdx =
    typeof currentPage?.sceneIdx === "number" ? currentPage.sceneIdx : currentPageIdx;
  const currentSceneRoman = ROMAN_NUMERALS[currentSceneIdx] || "I";

  const plates =
    currentPage?.plates && currentPage.plates.length > 0
      ? currentPage.plates
      : [
          {
            plateNumberRoman: currentSceneRoman,
            plateLabel: `PLATE ${currentSceneRoman} OF ${totalScenesRoman}`,
            title: currentPage?.imageCaption || storybook.title,
            illustrationPrompt:
              currentPage?.illustrationPrompt || storybook.coverImagePrompt,
            imageUrl:
              currentPage?.dioramaUrl ||
              currentPage?.imageUrl ||
              storybook.coverImageUrl,
          },
        ];

  const resolvedPlateIdx =
    manualPlateIdx !== null
      ? Math.min(manualPlateIdx, plates.length - 1)
      : Math.min(activeLine?.plateIndex ?? 0, plates.length - 1);
  const currentPlate = plates[resolvedPlateIdx] || plates[0];

  const canonicalPlateLabel =
    currentPlate?.plateLabel &&
    (currentPlate.plateLabel.startsWith("LÁMINA ") ||
      currentPlate.plateLabel.startsWith("PLATE ")) &&
    !currentPlate.plateLabel.endsWith("OF I") &&
    !currentPlate.plateLabel.endsWith("DE I")
      ? currentPlate.plateLabel
      : `LÁMINA ${currentSceneRoman} DE ${totalScenesRoman}`;

  // Calculate continuous chapter reading progress [0..1] for the 2px right-page footer filament
  const titleEndSec = storybook.titleCardEndSec ?? 0.9;
  const totalDurSec = storybook.totalDurationSeconds || 113.25;
  const chapterProgress = Math.max(
    0,
    Math.min(1, (playbackTimeSec - titleEndSec) / Math.max(1, totalDurSec - titleEndSec))
  );

  const resolveTurnVoice = (line: DialogueLine): string => {
    if (!line.isDialogue) {
      return narratorVoiceRef.current || line.voiceName || "Aoede";
    }
    return line.voiceName || narratorVoiceRef.current || "Aoede";
  };

  const getTurnCacheKey = (line: DialogueLine): string => {
    const cleanText = (line.ttsText || line.text || "").trim();
    const voice = resolveTurnVoice(line);
    const styleKey = line.stylePrompt || "";
    return `${voice}::${styleKey}::${cleanText}`;
  };

  const getTurnAudioPromise = (line: DialogueLine) => {
    const cleanText = (line.ttsText || line.text || "").trim();
    const voice = resolveTurnVoice(line);
    const cacheKey = getTurnCacheKey(line);
    const engine = getSeamlessNarrationEngine();

    if (line.audioDataUrl) {
      if (engine.isSupported() && !engine.hasDecodedBuffer(cacheKey)) {
        void engine.decodeAudio(cacheKey, line.audioDataUrl).catch(() => {});
      }
      return Promise.resolve({
        audioDataUrl: line.audioDataUrl,
        durationSeconds: line.durationSeconds || 5,
      });
    }

    const cached = ttsTurnCacheRef.current.get(cacheKey);
    if (cached) {
      if (engine.isSupported() && !engine.hasDecodedBuffer(cacheKey)) {
        void engine.decodeAudio(cacheKey, cached.audioDataUrl).catch(() => {});
      }
      return Promise.resolve(cached);
    }

    const pending = ttsTurnPendingRef.current.get(cacheKey);
    if (pending) return pending;

    const promise = synthesizeStudioTurnAudio(cleanText, voice, line.stylePrompt)
      .then((res) => {
        const entry = {
          audioDataUrl: res.audioDataUrl,
          durationSeconds: res.durationSeconds,
        };
        ttsTurnCacheRef.current.set(cacheKey, entry);
        ttsTurnPendingRef.current.delete(cacheKey);
        if (engine.isSupported()) {
          void engine.decodeAudio(cacheKey, entry.audioDataUrl).catch(() => {});
        }
        return entry;
      })
      .catch((err) => {
        ttsTurnPendingRef.current.delete(cacheKey);
        throw err;
      });

    ttsTurnPendingRef.current.set(cacheKey, promise);
    return promise;
  };

  const getPageLinesPayload = (targetBook: Storybook, pageIdx: number) => {
    const lines = targetBook.pages?.[pageIdx]?.dialogueLines || [];
    return lines.map((line) => ({
      speaker: line.speaker || "Maestra Narradora",
      voiceName: resolveTurnVoice(line),
      stylePrompt: line.stylePrompt,
      isDialogue: Boolean(line.isDialogue),
      text: (line.ttsText || line.text || "").trim(),
    }));
  };

  const getPageAudioCacheKey = (targetBook: Storybook, pageIdx: number): string => {
    const payload = getPageLinesPayload(targetBook, pageIdx);
    const defaultVoice = narratorVoiceRef.current || "Aoede";
    return `page::${defaultVoice}::${payload.map((l) => `${l.speaker}|${l.voiceName}|${l.text}`).join("||")}`;
  };

  const getPageAudioPromise = (targetBook: Storybook, pageIdx: number) => {
    const cacheKey = getPageAudioCacheKey(targetBook, pageIdx);
    const engine = getSeamlessNarrationEngine();
    const page = targetBook.pages?.[pageIdx];

    // If a pre-rendered book page already carries audioDataUrl and turn timings, use it directly
    if (page?.audioDataUrl && Array.isArray(page.dialogueLines) && page.dialogueLines.length > 0) {
      let acc = 0;
      const timings = page.dialogueLines.map((l) => {
        const dur = Math.max(1.2, l.durationSeconds || 4);
        const t = { startSec: acc, endSec: acc + dur };
        acc += dur;
        return t;
      });
      if (engine.isSupported() && !engine.hasDecodedBuffer(cacheKey)) {
        void engine.decodeAudio(cacheKey, page.audioDataUrl).catch(() => {});
      }
      return Promise.resolve({
        audioDataUrl: page.audioDataUrl,
        durationSeconds: acc,
        turnTimings: timings,
      });
    }

    const cached = ttsPageCacheRef.current.get(cacheKey);
    if (cached) {
      if (engine.isSupported() && !engine.hasDecodedBuffer(cacheKey)) {
        void engine.decodeAudio(cacheKey, cached.audioDataUrl).catch(() => {});
      }
      return Promise.resolve(cached);
    }

    const pending = ttsPagePendingRef.current.get(cacheKey);
    if (pending) return pending;

    const linesPayload = getPageLinesPayload(targetBook, pageIdx);
    const promise = synthesizeStudioPageContinuousAudio(
      linesPayload,
      narratorVoiceRef.current || "Aoede"
    )
      .then((res) => {
        ttsPageCacheRef.current.set(cacheKey, res);
        ttsPagePendingRef.current.delete(cacheKey);
        if (engine.isSupported()) {
          void engine.decodeAudio(cacheKey, res.audioDataUrl).catch(() => {});
        }
        return res;
      })
      .catch((err) => {
        ttsPagePendingRef.current.delete(cacheKey);
        throw err;
      });

    ttsPagePendingRef.current.set(cacheKey, promise);
    return promise;
  };

  const prefetchBookPages = async (
    targetBook: Storybook,
    fromPageIdx: number,
    sessionId: number,
    maxPages?: number
  ) => {
    const pages = targetBook.pages || [];
    const pageIndices: number[] = [];
    for (let p = Math.max(0, fromPageIdx); p < pages.length; p++) {
      pageIndices.push(p);
      if (maxPages && pageIndices.length >= maxPages) break;
    }

    const engine = getSeamlessNarrationEngine();
    let cursor = 0;
    const concurrency = Math.min(3, Math.max(1, pageIndices.length));
    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        while (cursor < pageIndices.length) {
          if (sessionId !== -1 && playbackSessionRef.current !== sessionId) return;
          const pIdx = pageIndices[cursor++];
          try {
            const res = await getPageAudioPromise(targetBook, pIdx);
            if (engine.isSupported()) {
              await engine
                .decodeAudio(getPageAudioCacheKey(targetBook, pIdx), res.audioDataUrl)
                .catch(() => {});
            }
          } catch {
            // Non-fatal: active page handler falls back cleanly
          }
        }
      })
    );
  };

  const prefetchBookTurns = async (
    targetBook: Storybook,
    fromPageIdx: number,
    fromLineIdx: number,
    sessionId: number,
    maxTurns?: number
  ) => {
    const pages = targetBook.pages || [];
    const queue: DialogueLine[] = [];
    for (let p = fromPageIdx; p < pages.length; p++) {
      const lines = pages[p]?.dialogueLines || [];
      const startL = p === fromPageIdx ? Math.max(0, fromLineIdx) : 0;
      for (let l = startL; l < lines.length; l++) {
        queue.push(lines[l]);
        if (maxTurns && queue.length >= maxTurns) break;
      }
      if (maxTurns && queue.length >= maxTurns) break;
    }

    let cursor = 0;
    const concurrency = Math.min(3, Math.max(1, queue.length));
    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        while (cursor < queue.length) {
          if (sessionId !== -1 && playbackSessionRef.current !== sessionId) return;
          const line = queue[cursor++];
          if (!line) break;
          try {
            await getTurnAudioPromise(line);
          } catch {}
        }
      })
    );
  };

  const prewarmBookStart = (targetBook: Storybook, pageLimit: number = 3) => {
    if (targetBook.masterAudioUrl) return;
    void prefetchBookPages(targetBook, 0, -1, pageLimit);
  };

  useEffect(() => {
    prewarmBookStart(INITIAL_SHOWCASE_STORYBOOK, 3);
  }, []);

  const prewarmNextChapterIfAvailable = (currentBook: Storybook) => {
    const libs = libraryRef.current;
    const curIdx = libs.findIndex((b) => b.id === currentBook.id);
    if (curIdx >= 0 && curIdx < libs.length - 1) {
      prewarmBookStart(libs[curIdx + 1], 2);
    }
  };

  const triggerPageVisualTransition = (prevPageIdx: number, nextPageIdx: number, pages: Storybook["pages"]) => {
    const prevPage = pages[prevPageIdx];
    const nextPage = pages[nextPageIdx];
    const prevSceneIdx = prevPage?.sceneIdx ?? prevPageIdx;
    const nextSceneIdx = nextPage?.sceneIdx ?? nextPageIdx;

    currentPageIdxRef.current = nextPageIdx;
    setCurrentPageIdx(nextPageIdx);
    setManualPlateIdx(null);

    if (nextPageIdx >= pages.length - 1) {
      prewarmNextChapterIfAvailable(storybook);
    }

    if (prevSceneIdx === nextSceneIdx) {
      setIsRightFolioFading(true);
      setTimeout(() => setIsRightFolioFading(false), 420);
    } else {
      setIsPageTurning(true);
      setIsDioramaUnfolding(true);
      setTimeout(() => setIsPageTurning(false), 620);
      setTimeout(() => setIsDioramaUnfolding(false), 1200);
    }
  };

  const speakTurnWithBrowserFallback = (
    line: DialogueLine,
    turnKey: string,
    onEnded?: () => void
  ) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(
          line.ttsText || line.text.replace(/[“”"«»]/g, "")
        );
        utter.lang = "es-ES";
        const voices = window.speechSynthesis.getVoices();
        const esVoice = voices.find((v) => v.lang.toLowerCase().startsWith("es"));
        if (esVoice) utter.voice = esVoice;
        utter.rate = 0.96;
        utter.onend = () => {
          if (activeTurnAudioKeyRef.current === turnKey) {
            turnEndedAtMsRef.current = Date.now();
          }
          onEnded?.();
        };
        utter.onerror = () => {
          if (activeTurnAudioKeyRef.current === turnKey) {
            turnEndedAtMsRef.current = Date.now();
          }
          onEnded?.();
        };
        window.speechSynthesis.speak(utter);
        return;
      } catch {}
    }
    turnEndedAtMsRef.current = Date.now();
    onEnded?.();
  };

  const unlockMasterAudioForSession = (masterEl: HTMLAudioElement | null) => {
    if (!masterEl) return;
    try {
      masterEl.src =
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
      masterEl.setAttribute("data-book-src", "__unlock__");
      masterEl.play().catch(() => {});
    } catch {}
  };

  const playTurnGeminiAudio = (
    targetBook: Storybook,
    pageIdx: number,
    lineIdx: number,
    sessionId: number
  ) => {
    const lines = targetBook.pages?.[pageIdx]?.dialogueLines || [];
    const line = lines[lineIdx];
    if (!line) return;

    const turnKey = `${targetBook.id}_${pageIdx}_${lineIdx}`;
    activeTurnAudioKeyRef.current = turnKey;
    lastSpokenTurnKeyRef.current = turnKey;
    awaitingTurnAudioRef.current = true;
    turnEndedAtMsRef.current = 0;

    const masterEl = getMasterAudioEl();
    if (masterEl && masterEl.getAttribute("data-book-src") !== "__unlock__") {
      masterEl.pause();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    getTurnAudioPromise(line)
      .then((res) => {
        if (playbackSessionRef.current !== sessionId) return;
        if (activeTurnAudioKeyRef.current !== turnKey) return;
        awaitingTurnAudioRef.current = false;

        if (masterEl) {
          masterEl.src = res.audioDataUrl;
          masterEl.setAttribute("data-book-src", turnKey);
          masterEl.volume = 1.0;
          masterEl.play().catch(() => {
            turnEndedAtMsRef.current = Date.now();
          });
        } else {
          turnEndedAtMsRef.current = Date.now();
        }
      })
      .catch(() => {
        if (playbackSessionRef.current !== sessionId) return;
        if (activeTurnAudioKeyRef.current !== turnKey) return;
        awaitingTurnAudioRef.current = false;
        speakTurnWithBrowserFallback(line, turnKey);
      });
  };

  const buildPageQueue = (
    targetBook: Storybook,
    fromPageIdx: number,
    fromLineIdx: number
  ) => {
    const pages = targetBook.pages || [];
    const items: Array<{
      pageIdx: number;
      pageKey: string;
      cacheKey: string;
      startLineIdx: number;
      pauseAfterSec: number;
    }> = [];

    for (let p = Math.max(0, fromPageIdx); p < pages.length; p++) {
      items.push({
        pageIdx: p,
        pageKey: `${targetBook.id}_page_${p}`,
        cacheKey: getPageAudioCacheKey(targetBook, p),
        startLineIdx: p === fromPageIdx ? Math.max(0, fromLineIdx) : 0,
        pauseAfterSec: p < pages.length - 1 ? 0.24 : 0.3,
      });
    }
    return items;
  };

  const pumpSeamlessQueue = () => {
    const queue = seamlessQueueRef.current;
    if (!queue) return;
    if (playbackSessionRef.current !== queue.sessionId) return;
    if (queue.schedulingInProgress || queue.fallbackActiveKey) return;

    const engine = getSeamlessNarrationEngine();
    if (!engine.isSupported()) return;

    const schedulePageWithBuffer = (
      item: (typeof queue.pageItems)[number],
      buffer: AudioBuffer,
      turnTimings: PageAudioTurnTiming[],
      isFirst: boolean
    ) => {
      const ctxNow = engine.getCurrentTime();
      const startAt = Math.max(ctxNow + 0.015, queue.nextStartCtxTime);
      let offsetSec = 0;
      if (isFirst) {
        if (queue.initialOffsetSec !== null) {
          offsetSec = queue.initialOffsetSec;
        } else if (item.startLineIdx > 0 && turnTimings[item.startLineIdx]) {
          offsetSec = turnTimings[item.startLineIdx].startSec;
        }
      }
      const handle = engine.scheduleTurn({
        turnKey: item.pageKey,
        pageIdx: item.pageIdx,
        lineIdx: item.startLineIdx,
        buffer,
        cacheKey: item.cacheKey,
        startAtCtxTime: startAt,
        offsetSec,
        pauseAfterSec: item.pauseAfterSec,
        turnTimings,
      });
      if (handle) {
        queue.scheduledHandles.push(handle);
        queue.nextStartCtxTime = handle.nextStartCtxTime;
      }
      queue.nextToScheduleIdx += 1;
    };

    while (queue.nextToScheduleIdx < queue.pageItems.length) {
      const liveCount = queue.scheduledHandles.filter((h) => !h.stopped).length;
      if (liveCount >= 2) break;

      const idx = queue.nextToScheduleIdx;
      const item = queue.pageItems[idx];
      const cachedMeta = ttsPageCacheRef.current.get(item.cacheKey);
      const decoded = engine.getDecodedBuffer(item.cacheKey);

      if (decoded && cachedMeta) {
        schedulePageWithBuffer(item, decoded, cachedMeta.turnTimings, idx === 0);
        continue;
      }

      queue.schedulingInProgress = true;
      const targetSession = queue.sessionId;
      void getPageAudioPromise(queue.book, item.pageIdx)
        .then(async (res) => {
          const audioBuf = await engine.decodeAudio(item.cacheKey, res.audioDataUrl);
          return { res, audioBuf };
        })
        .then(({ res, audioBuf }) => {
          if (
            playbackSessionRef.current !== targetSession ||
            seamlessQueueRef.current !== queue
          ) {
            return;
          }
          queue.schedulingInProgress = false;
          schedulePageWithBuffer(item, audioBuf, res.turnTimings, idx === 0);
          pumpSeamlessQueue();
        })
        .catch(() => {
          if (
            playbackSessionRef.current !== targetSession ||
            seamlessQueueRef.current !== queue
          ) {
            return;
          }
          queue.schedulingInProgress = false;
          const lines = queue.book.pages?.[item.pageIdx]?.dialogueLines || [];
          const speakFallbackLine = (lineCursor: number) => {
            if (
              playbackSessionRef.current !== targetSession ||
              seamlessQueueRef.current !== queue
            ) {
              return;
            }
            const fallbackLine = lines[lineCursor];
            if (!fallbackLine) {
              queue.fallbackActiveKey = null;
              queue.nextToScheduleIdx += 1;
              queue.nextStartCtxTime = engine.getCurrentTime() + item.pauseAfterSec;
              pumpSeamlessQueue();
              return;
            }
            const turnKey = `${queue.book.id}_${item.pageIdx}_${lineCursor}`;
            queue.fallbackActiveKey = turnKey;
            activeTurnAudioKeyRef.current = turnKey;
            currentPageIdxRef.current = item.pageIdx;
            activeLineIdxRef.current = lineCursor;
            setCurrentPageIdx(item.pageIdx);
            setActiveLineIdx(lineCursor);
            speakTurnWithBrowserFallback(fallbackLine, turnKey, () => {
              speakFallbackLine(lineCursor + 1);
            });
          };
          if (lines.length === 0) {
            queue.nextToScheduleIdx += 1;
            pumpSeamlessQueue();
            return;
          }
          speakFallbackLine(Math.max(0, Math.min(item.startLineIdx, lines.length - 1)));
        });
      break;
    }
  };

  const startSeamlessTurnSequence = (
    targetBook: Storybook,
    pageIdx: number,
    lineIdx: number,
    offsetSec: number | null,
    initialDelaySec: number,
    sessionId: number
  ) => {
    const engine = getSeamlessNarrationEngine();
    engine.unlock();
    engine.stopAllTurns(70);
    engine.setAmbienceActive(false);

    const pageItems = buildPageQueue(targetBook, pageIdx, lineIdx);
    seamlessQueueRef.current = {
      sessionId,
      book: targetBook,
      pageItems,
      nextToScheduleIdx: 0,
      nextStartCtxTime: engine.getCurrentTime() + Math.max(0.015, initialDelaySec),
      initialOffsetSec: offsetSec,
      scheduledHandles: [],
      schedulingInProgress: false,
      fallbackActiveKey: null,
    };

    void prefetchBookPages(targetBook, pageIdx, sessionId);
    if (pageIdx >= (targetBook.pages?.length || 1) - 1) {
      prewarmNextChapterIfAvailable(targetBook);
    }
    pumpSeamlessQueue();
  };

  // Stop all active audio & timers cleanly
  const stopAllPlayback = (clearTurnKey: boolean = true) => {
    playbackSessionRef.current += 1;
    awaitingTurnAudioRef.current = false;
    turnEndedAtMsRef.current = 0;
    seamlessQueueRef.current = null;
    if (clearTurnKey) {
      activeTurnAudioKeyRef.current = "";
      pausedResumeRef.current = null;
    }
    const engine = getSeamlessNarrationEngine();
    engine.stopAllTurns(70);
    engine.setAmbienceActive(false);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const masterEl = getMasterAudioEl();
    if (masterEl) {
      masterEl.pause();
    }
    const musicEl = getMusicAudioEl();
    if (musicEl) {
      musicEl.pause();
    }
    setIsPlayingAudio(false);
  };

  useEffect(() => {
    return () => {
      stopAllPlayback(true);
    };
  }, []);

  // Synchronize audio source & start auto-narration at `startAtSec`
  const startBookNarration = (
    targetBook: Storybook,
    startAtSec: number = 0,
    withOpeningTitleCard: boolean = true
  ) => {
    const normalized = ensureBookTimeline(targetBook);
    const masterEl = getMasterAudioEl();
    const musicEl = getMusicAudioEl();
    const engine = getSeamlessNarrationEngine();

    playbackSessionRef.current += 1;
    const sessionId = playbackSessionRef.current;
    awaitingTurnAudioRef.current = false;
    activeTurnAudioKeyRef.current = "";
    turnEndedAtMsRef.current = 0;
    pausedResumeRef.current = null;
    seamlessQueueRef.current = null;
    engine.stopAllTurns(20);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    virtualClockRef.current = startAtSec;
    lastWallClockMsRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    lastSpokenTurnKeyRef.current = "";
    setPlaybackTimeSec(startAtSec);

    if (startAtSec === 0) {
      currentPageIdxRef.current = 0;
      activeLineIdxRef.current = -1;
      setCurrentPageIdx(0);
      setActiveLineIdx(-1);
      setManualPlateIdx(null);
    }

    const shouldShowIntroTitle = withOpeningTitleCard && startAtSec < 1.0;
    setShowOpeningTitleCard(shouldShowIntroTitle);
    showOpeningTitleCardRef.current = shouldShowIntroTitle;

    if (!shouldShowIntroTitle) {
      setIsDioramaUnfolding(true);
      setTimeout(() => setIsDioramaUnfolding(false), 1200);
    }

    // Play the mastered multi-voice + Lyria 3.5 MP4/WAV track if available
    if (normalized.masterAudioUrl && masterEl) {
      engine.setAmbienceActive(false);
      if (musicEl) musicEl.pause();
      const currentSrc = masterEl.getAttribute("data-book-src") || "";
      if (currentSrc !== normalized.masterAudioUrl) {
        masterEl.src = normalized.masterAudioUrl;
        masterEl.setAttribute("data-book-src", normalized.masterAudioUrl);
      }
      try {
        masterEl.currentTime = startAtSec;
      } catch {
        masterEl.onloadedmetadata = () => {
          try {
            masterEl.currentTime = startAtSec;
          } catch {}
        };
      }
      masterEl.volume = 1.0;
      masterEl.play().catch(() => {});
    } else if (engine.isSupported()) {
      const initialDelay = shouldShowIntroTitle
        ? Math.max(0.75, normalized.titleCardEndSec ?? 0.9)
        : 0.02;
      startSeamlessTurnSequence(normalized, 0, 0, 0, initialDelay, sessionId);
      if (musicEl && isMusicEnabled && normalized.backgroundMusicUrl) {
        musicEl.src = normalized.backgroundMusicUrl;
        musicEl.volume = 0.14;
        musicEl.play().catch(() => {});
      }
    } else {
      unlockMasterAudioForSession(masterEl);
      void prefetchBookTurns(normalized, 0, 0, sessionId);
      if (musicEl && isMusicEnabled && normalized.backgroundMusicUrl) {
        musicEl.src = normalized.backgroundMusicUrl;
        musicEl.volume = 0.14;
        musicEl.play().catch(() => {});
      }
    }

    setIsPlayingAudio(true);
  };

  // Master 60ms timeline loop: drives Opening Title Card -> 3D Page Turn ->
  // Gapless Lookahead Web Audio Sync -> 3-State Paragraph Highlighting & Folio Crossfades
  useEffect(() => {
    if (!isPlayingAudio || viewMode !== "reader") return;

    lastWallClockMsRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();

    const intervalId = setInterval(() => {
      const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
      const dtSec = Math.min(0.25, Math.max(0, (nowMs - lastWallClockMsRef.current) / 1000));
      lastWallClockMsRef.current = nowMs;

      const masterEl = getMasterAudioEl();
      const pages = storybook.pages || [];
      const engine = getSeamlessNarrationEngine();
      const queue = seamlessQueueRef.current;

      // ── Path A: Continuous Per-Page Web Audio API Timeline (zero radio-cut paragraph transitions) ──
      if (!storybook.masterAudioUrl && queue && engine.isSupported()) {
        pumpSeamlessQueue();

        const ctxNow = engine.getCurrentTime();
        const handles = queue.scheduledHandles;
        const firstHandle = handles[0];
        const titleTurnStartSec = Math.max(0.55, (storybook.titleCardEndSec ?? 0.9) - 0.25);

        // Pre-speech opening title card phase
        if (
          showOpeningTitleCardRef.current &&
          (!firstHandle || ctxNow < firstHandle.startCtxTime - 0.18)
        ) {
          const nextClock = virtualClockRef.current + dtSec;
          virtualClockRef.current = nextClock;
          setPlaybackTimeSec(nextClock);
          if (nextClock >= titleTurnStartSec) {
            showOpeningTitleCardRef.current = false;
            setShowOpeningTitleCard(false);
            setIsPageTurning(true);
            setIsDioramaUnfolding(true);
            setTimeout(() => setIsPageTurning(false), 600);
            setTimeout(() => setIsDioramaUnfolding(false), 1150);
          }
          return;
        }

        if (showOpeningTitleCardRef.current && firstHandle && ctxNow >= firstHandle.startCtxTime - 0.12) {
          showOpeningTitleCardRef.current = false;
          setShowOpeningTitleCard(false);
        }

        if (queue.fallbackActiveKey) {
          return;
        }

        // Find page handle actively speaking or in its inter-page breath pause
        let activeHandle: ScheduledTurnHandle | null = null;
        let pauseHandle: ScheduledTurnHandle | null = null;

        for (let i = 0; i < handles.length; i++) {
          const h = handles[i];
          if (ctxNow >= h.startCtxTime && ctxNow < h.speechEndCtxTime) {
            activeHandle = h;
            break;
          }
          if (ctxNow >= h.speechEndCtxTime && ctxNow < h.nextStartCtxTime) {
            pauseHandle = h;
          }
        }

        if (activeHandle) {
          if (activeHandle.pageIdx !== currentPageIdxRef.current) {
            triggerPageVisualTransition(currentPageIdxRef.current, activeHandle.pageIdx, pages);
          }

          const elapsedInPage = Math.max(
            0,
            ctxNow - activeHandle.startCtxTime + activeHandle.offsetSec
          );
          const timings = activeHandle.turnTimings || [];
          let resolvedLine = 0;
          for (let i = 0; i < timings.length; i++) {
            if (elapsedInPage >= timings[i].startSec - 0.04) {
              resolvedLine = i;
            } else {
              break;
            }
          }
          const maxLineIdx = Math.max(
            0,
            (pages[activeHandle.pageIdx]?.dialogueLines?.length || 1) - 1
          );
          resolvedLine = Math.min(resolvedLine, maxLineIdx);

          if (resolvedLine !== activeLineIdxRef.current) {
            activeLineIdxRef.current = resolvedLine;
            setActiveLineIdx(resolvedLine);
          }
          activeTurnAudioKeyRef.current = activeHandle.turnKey;

          pausedResumeRef.current = {
            bookId: storybook.id,
            pageIdx: activeHandle.pageIdx,
            lineIdx: resolvedLine,
            offsetSec: Math.min(elapsedInPage, Math.max(0, activeHandle.durationSec - 0.1)),
          };

          const pageObj = pages[activeHandle.pageIdx];
          const pStart = pageObj?.startSec ?? 0;
          const pEnd = pageObj?.endSec ?? pStart + activeHandle.durationSec;
          const ratio = Math.min(
            1,
            Math.max(0, elapsedInPage / Math.max(0.1, activeHandle.durationSec))
          );
          const syncedSec = pStart + ratio * Math.max(0.2, pEnd - pStart);
          virtualClockRef.current = syncedSec;
          setPlaybackTimeSec(syncedSec);
        } else if (pauseHandle) {
          const qIdx = queue.pageItems.findIndex((p) => p.pageKey === pauseHandle!.turnKey);
          const nextItem = qIdx >= 0 ? queue.pageItems[qIdx + 1] : undefined;
          if (
            nextItem &&
            nextItem.pageIdx !== pauseHandle.pageIdx &&
            ctxNow >= pauseHandle.speechEndCtxTime + 0.06
          ) {
            if (nextItem.pageIdx !== currentPageIdxRef.current) {
              triggerPageVisualTransition(currentPageIdxRef.current, nextItem.pageIdx, pages);
            }
            if (activeLineIdxRef.current !== -1) {
              activeLineIdxRef.current = -1;
              setActiveLineIdx(-1);
            }
          }
        } else if (
          queue.book.id === storybook.id &&
          !autoAdvancingRef.current &&
          queue.nextToScheduleIdx >= queue.pageItems.length &&
          !queue.schedulingInProgress &&
          handles.every((h) => h.stopped || ctxNow >= h.nextStartCtxTime)
        ) {
          if (!advanceToNextChapterIfAvailable(storybook)) {
            activeLineIdxRef.current = 999;
            setActiveLineIdx(999);
            setPlaybackTimeSec(storybook.totalDurationSeconds || virtualClockRef.current);
            stopAllPlayback(true);
          }
        }
        return;
      }

      // ── Path B: Master Track / Legacy HTMLAudioElement Timeline ──
      let tSec = virtualClockRef.current;

      if (
        storybook.masterAudioUrl &&
        masterEl &&
        !masterEl.paused &&
        !masterEl.ended &&
        Number.isFinite(masterEl.currentTime)
      ) {
        tSec = masterEl.currentTime;
        virtualClockRef.current = tSec;
      } else if (
        !storybook.masterAudioUrl &&
        activeLineIdxRef.current >= 0 &&
        activeLineIdxRef.current < 999
      ) {
        const curPage = pages[currentPageIdxRef.current];
        const curTurn = curPage?.dialogueLines?.[activeLineIdxRef.current];
        const curTurnKey = `${storybook.id}_${currentPageIdxRef.current}_${activeLineIdxRef.current}`;

        if (curTurn && activeTurnAudioKeyRef.current === curTurnKey) {
          const tStart = curTurn.startSec ?? 0;
          const tEnd = curTurn.endSec ?? tStart + (curTurn.durationSeconds || 5);

          if (awaitingTurnAudioRef.current) {
            tSec = Math.max(tSec, tStart);
          } else if (masterEl && masterEl.getAttribute("data-book-src") === curTurnKey) {
            if (!masterEl.ended) {
              if (!masterEl.paused && Number.isFinite(masterEl.duration) && masterEl.duration > 0) {
                const ratio = Math.min(0.985, Math.max(0, masterEl.currentTime / masterEl.duration));
                tSec = tStart + ratio * Math.max(0.2, tEnd - tStart);
              }
            } else {
              if (!turnEndedAtMsRef.current) {
                turnEndedAtMsRef.current = nowMs;
              }
              if (nowMs - turnEndedAtMsRef.current >= 160) {
                tSec = Math.max(tSec + dtSec, tEnd + 0.02);
              }
            }
          } else if (
            typeof window !== "undefined" &&
            "speechSynthesis" in window &&
            window.speechSynthesis.speaking
          ) {
            tSec = Math.min(tEnd - 0.05, Math.max(tStart, tSec + dtSec));
          } else if (turnEndedAtMsRef.current) {
            if (nowMs - turnEndedAtMsRef.current >= 160) {
              tSec = Math.max(tSec + dtSec, tEnd + 0.02);
            }
          } else {
            tSec = virtualClockRef.current + dtSec;
          }
          virtualClockRef.current = tSec;
        } else {
          tSec = virtualClockRef.current + dtSec;
          virtualClockRef.current = tSec;
        }
      } else {
        tSec = virtualClockRef.current + dtSec;
        virtualClockRef.current = tSec;
      }

      setPlaybackTimeSec(tSec);

      const totalDur = storybook.totalDurationSeconds || 113.25;
      const titleTurnStartSec = Math.max(0.75, (storybook.titleCardEndSec ?? 1.25) - 0.25);

      if (tSec < titleTurnStartSec) {
        if (!showOpeningTitleCardRef.current) {
          showOpeningTitleCardRef.current = true;
          setShowOpeningTitleCard(true);
        }
        return;
      } else if (showOpeningTitleCardRef.current) {
        showOpeningTitleCardRef.current = false;
        setShowOpeningTitleCard(false);
        setIsPageTurning(true);
        setIsDioramaUnfolding(true);
        setTimeout(() => setIsPageTurning(false), 600);
        setTimeout(() => setIsDioramaUnfolding(false), 1150);
      }

      let targetPageIdx = 0;
      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const pStart = pages[pIdx].startSec ?? 0;
        if (tSec >= pStart) {
          targetPageIdx = pIdx;
        } else {
          break;
        }
      }

      if (targetPageIdx !== currentPageIdxRef.current) {
        triggerPageVisualTransition(currentPageIdxRef.current, targetPageIdx, pages);
      }

      const fLines = pages[targetPageIdx]?.dialogueLines || [];
      let targetLineIdx = -1;

      if (fLines.length > 0) {
        const firstStart = fLines[0].startSec ?? 1.5;
        if (tSec >= firstStart) {
          let kActive = 0;
          for (let k = 0; k < fLines.length; k++) {
            if (tSec >= (fLines[k].startSec ?? 0)) {
              kActive = k;
            } else {
              break;
            }
          }
          const curTurn = fLines[kActive];
          if (kActive === fLines.length - 1 && tSec >= (curTurn.endSec ?? 99999)) {
            targetLineIdx = 999;
          } else {
            targetLineIdx = kActive;
          }
        }
      }

      if (targetLineIdx !== activeLineIdxRef.current) {
        activeLineIdxRef.current = targetLineIdx;
        setActiveLineIdx(targetLineIdx);

        if (
          !storybook.masterAudioUrl &&
          targetLineIdx >= 0 &&
          targetLineIdx < fLines.length
        ) {
          const turnKey = `${storybook.id}_${targetPageIdx}_${targetLineIdx}`;
          if (activeTurnAudioKeyRef.current !== turnKey) {
            playTurnGeminiAudio(storybook, targetPageIdx, targetLineIdx, playbackSessionRef.current);
          }
        }
      }

      if (tSec >= totalDur && !awaitingTurnAudioRef.current && !autoAdvancingRef.current) {
        if (!advanceToNextChapterIfAvailable(storybook)) {
          activeLineIdxRef.current = 999;
          setActiveLineIdx(999);
          stopAllPlayback(true);
        }
      }
    }, 60);

    return () => clearInterval(intervalId);
  }, [isPlayingAudio, viewMode, storybook]);

  // Seek directly to a specific folio & turn (and continue auto-narrating smoothly from there)
  const seekToFolioAndTurn = (pageIdx: number, lineIdx: number) => {
    const pages = storybook.pages || [];
    const targetPage = pages[pageIdx] || pages[0];
    const lines = targetPage?.dialogueLines || [];
    const safeLineIdx = Math.max(0, Math.min(lineIdx, Math.max(0, lines.length - 1)));
    const targetLine = lines[safeLineIdx];
    const targetSec = targetLine?.startSec ?? targetPage?.startSec ?? 1.5;

    setShowOpeningTitleCard(false);
    showOpeningTitleCardRef.current = false;
    setManualPlateIdx(null);

    if (pageIdx !== currentPageIdxRef.current) {
      triggerPageVisualTransition(currentPageIdxRef.current, pageIdx, pages);
    }

    playbackSessionRef.current += 1;
    const sessionId = playbackSessionRef.current;
    activeTurnAudioKeyRef.current = "";
    awaitingTurnAudioRef.current = false;
    turnEndedAtMsRef.current = 0;
    pausedResumeRef.current = null;
    seamlessQueueRef.current = null;

    currentPageIdxRef.current = pageIdx;
    activeLineIdxRef.current = safeLineIdx;
    setCurrentPageIdx(pageIdx);
    setActiveLineIdx(safeLineIdx);

    virtualClockRef.current = targetSec;
    lastWallClockMsRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    setPlaybackTimeSec(targetSec);

    const masterEl = getMasterAudioEl();
    const engine = getSeamlessNarrationEngine();
    if (storybook.masterAudioUrl && masterEl) {
      engine.stopAllTurns(70);
      engine.setAmbienceActive(false);
      const currentSrc = masterEl.getAttribute("data-book-src") || "";
      if (currentSrc !== storybook.masterAudioUrl) {
        masterEl.src = storybook.masterAudioUrl;
        masterEl.setAttribute("data-book-src", storybook.masterAudioUrl);
      }
      try {
        masterEl.currentTime = targetSec;
      } catch {}
      masterEl.play().catch(() => {});
    } else if (engine.isSupported()) {
      startSeamlessTurnSequence(storybook, pageIdx, safeLineIdx, null, 0.055, sessionId);
    } else {
      unlockMasterAudioForSession(masterEl);
      playTurnGeminiAudio(storybook, pageIdx, safeLineIdx, sessionId);
      void prefetchBookTurns(storybook, pageIdx, safeLineIdx + 1, sessionId);
    }
    setIsPlayingAudio(true);
  };

  // Turn the leaf from the Title & Contents Folio directly into a bound volume AND auto-narrate!
  const handleOpenExistingBook = (book: Storybook, startFromTitleCard: boolean = true) => {
    stopAllPlayback(true);
    const normalized = ensureBookTimeline(book);
    setStorybook(normalized);
    setCurrentPageIdx(0);
    setActiveLineIdx(-1);
    setManualPlateIdx(null);
    setIsPageTurning(true);
    setViewMode("reader");
    setTimeout(() => {
      setIsPageTurning(false);
    }, 600);

    const firstSpeechSec = normalized.pages?.[0]?.dialogueLines?.[0]?.startSec ?? 1.5;
    startBookNarration(normalized, startFromTitleCard ? 0 : firstSpeechSec, startFromTitleCard);
    autoAdvancingRef.current = false;
  };

  const advanceToNextChapterIfAvailable = (finishedBook: Storybook): boolean => {
    if (autoAdvancingRef.current) return true;
    const libs = libraryRef.current;
    const curIdx = libs.findIndex((b) => b.id === finishedBook.id);
    if (curIdx >= 0 && curIdx < libs.length - 1) {
      autoAdvancingRef.current = true;
      const nextBook = ensureBookTimeline(libs[curIdx + 1]);
      setStatusNote(`Pasando al Capítulo ${nextBook.roman || curIdx + 2} · ${nextBook.title}`);
      setTimeout(() => setStatusNote(null), 4000);
      handleOpenExistingBook(nextBook, true);
      return true;
    }
    return false;
  };

  // Turn back to the Title & Commission Folio
  const handleCloseBookToCover = () => {
    stopAllPlayback(true);
    setShowOpeningTitleCard(false);
    setShowTitleCardModal(false);
    setIsPageTurning(true);
    setViewMode("cover");
    setTimeout(() => {
      setIsPageTurning(false);
    }, 600);
  };

  // Toggle Pause / Resume Narration
  const handleToggleNarration = () => {
    const masterEl = getMasterAudioEl();
    const engine = getSeamlessNarrationEngine();
    if (isPlayingAudio) {
      stopAllPlayback(false);
    } else {
      const resumeSec =
        playbackTimeSec >= (storybook.totalDurationSeconds || 113) - 1
          ? 0
          : playbackTimeSec;

      if (resumeSec === 0 && activeLineIdxRef.current === 999) {
        startBookNarration(storybook, 0, true);
        return;
      }

      if (storybook.masterAudioUrl && masterEl) {
        const currentSrc = masterEl.getAttribute("data-book-src") || "";
        if (currentSrc !== storybook.masterAudioUrl) {
          masterEl.src = storybook.masterAudioUrl;
          masterEl.setAttribute("data-book-src", storybook.masterAudioUrl);
        }
        try {
          masterEl.currentTime = resumeSec;
        } catch {}
        masterEl.play().catch(() => {});
        virtualClockRef.current = resumeSec;
        lastWallClockMsRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
        setIsPlayingAudio(true);
      } else if (engine.isSupported()) {
        playbackSessionRef.current += 1;
        const sessionId = playbackSessionRef.current;
        const saved = pausedResumeRef.current;
        const curPage = currentPageIdxRef.current;
        const curLine = activeLineIdxRef.current;

        if (
          saved &&
          saved.bookId === storybook.id &&
          saved.pageIdx === curPage &&
          curLine >= 0 &&
          curLine < 999
        ) {
          startSeamlessTurnSequence(
            storybook,
            saved.pageIdx,
            saved.lineIdx,
            saved.offsetSec,
            0.02,
            sessionId
          );
        } else if (curLine >= 0 && curLine < 999) {
          startSeamlessTurnSequence(storybook, curPage, curLine, null, 0.02, sessionId);
        } else {
          // User clicked Play while viewing pre-speech folio: start immediately on Turn 0
          setShowOpeningTitleCard(false);
          showOpeningTitleCardRef.current = false;
          startSeamlessTurnSequence(storybook, curPage, 0, 0, 0.02, sessionId);
        }
        lastWallClockMsRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
        setIsPlayingAudio(true);
      } else {
        if (resumeSec === 0) {
          startBookNarration(storybook, 0, true);
          return;
        }
        playbackSessionRef.current += 1;
        const sessionId = playbackSessionRef.current;
        const curPage = currentPageIdxRef.current;
        const curLine = activeLineIdxRef.current;
        const expectedKey = `${storybook.id}_${curPage}_${curLine}`;

        if (
          curLine >= 0 &&
          curLine < 999 &&
          masterEl &&
          masterEl.getAttribute("data-book-src") === expectedKey &&
          !masterEl.ended &&
          masterEl.src.startsWith("data:audio")
        ) {
          activeTurnAudioKeyRef.current = expectedKey;
          awaitingTurnAudioRef.current = false;
          masterEl.play().catch(() => {});
          void prefetchBookTurns(storybook, curPage, curLine + 1, sessionId);
        } else {
          unlockMasterAudioForSession(masterEl);
          activeTurnAudioKeyRef.current = "";
          awaitingTurnAudioRef.current = false;
          if (curLine >= 0 && curLine < 999) {
            playTurnGeminiAudio(storybook, curPage, curLine, sessionId);
            void prefetchBookTurns(storybook, curPage, curLine + 1, sessionId);
          } else {
            seekToFolioAndTurn(curPage, 0);
            return;
          }
        }
        virtualClockRef.current = resumeSec;
        lastWallClockMsRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
        setIsPlayingAudio(true);
      }
    }
  };

  // Cycle through the current folio's plates (3D pop-up diorama -> 2D watercolour plate -> character sheet)
  const handleCyclePlate = () => {
    if (plates.length <= 1) return;
    setManualPlateIdx((resolvedPlateIdx + 1) % plates.length);
  };

  // Commission a new Storybook via the Gemini Managed Agent (`antigravity-preview-09-2026` / `gemini-4-neon`)
  const handleCommissionStorybook = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    stopAllPlayback();
    setAgentError(null);
    setAgentLogs([]);
    setActiveStageIdx(0);
    setActiveStageLabel("Booting Managed Agent Sandbox");

    setIsPageTurning(true);
    setViewMode("crafting");
    setIsRunningAgent(true);
    setTimeout(() => {
      setIsPageTurning(false);
    }, 650);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const result = await runManagedAgentStorybook({
        prompt: commissionPrompt,
        paletteKey: selectedPaletteKey,
        visualStyle,
        pageCount: 3,
        narratorVoice,
        agentName,
        modelName,
        environmentId,
        previousInteractionId: interactionId,
        sessionId,
        signal: controller.signal,
        onLog: (entry) => {
          setAgentLogs((prev) => [...prev, entry]);
        },
        onStageChange: (stageIdx, stageLabel) => {
          setActiveStageIdx(stageIdx);
          setActiveStageLabel(stageLabel);
        },
        onCreated: (id, envId) => {
          setInteractionId(id);
          if (envId) setEnvironmentId(envId);
        },
      });

      const normalized = ensureBookTimeline(result.storybook);
      setStorybook(normalized);
      setLibrary((prev) => {
        const exists = prev.some((b) => b.id === normalized.id);
        return exists ? prev : [normalized, ...prev];
      });
      setCurrentPageIdx(0);
      setActiveLineIdx(-1);
      setManualPlateIdx(null);
      setIsRunningAgent(false);
      setIsPageTurning(true);
      setViewMode("reader");
      setTimeout(() => {
        setIsPageTurning(false);
      }, 650);

      // Automatically begin narrating the newly commissioned edition!
      startBookNarration(normalized, 0, true);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setIsRunningAgent(false);
        setViewMode("cover");
        return;
      }
      setAgentError(err?.message || "Failed to run Managed Agent");
      setIsRunningAgent(false);
    }
  };

  // Synthesize continuous Gemini TTS WAV for the current Folio
  const handleSynthesizeFolioWav = async () => {
    stopAllPlayback(true);
    setIsSynthesizingAudio(true);
    setStatusNote("Generando narración continua (24 kHz WAV) con Gemini TTS…");
    try {
      await getPageAudioPromise(storybook, currentPageIdx);
      setStatusNote("Reproduciendo página continua con Gemini TTS");
      seekToFolioAndTurn(currentPageIdx, 0);
      setTimeout(() => setStatusNote(null), 4000);
    } catch {
      try {
        const wavDataUri = await synthesizeStudioPageAudio(
          dialogueLines,
          currentPage.narrativeText,
          narratorVoice || "Aoede"
        );
        const masterEl = getMasterAudioEl();
        if (masterEl) {
          masterEl.src = wavDataUri;
          masterEl.setAttribute("data-book-src", wavDataUri);
          masterEl.play().catch(() => {});
        }
        setStatusNote("Reproduciendo página completa con Gemini TTS");
        setTimeout(() => setStatusNote(null), 4000);
      } catch {
        setStatusNote("Usando lectura guiada por párrafos con Gemini TTS");
        seekToFolioAndTurn(currentPageIdx, 0);
        setTimeout(() => setStatusNote(null), 4000);
      }
    } finally {
      setIsSynthesizingAudio(false);
    }
  };

  // Repaint current plate using `gemini-3.1-flash-lite-image`
  const handleRepaintCurrentPlate = async () => {
    setIsRegeneratingPlate(true);
    setStatusNote("Ilustrando lámina 16:9 sobre papel crema #F6F2EA…");
    try {
      const newDataUrl = await generateStudioIllustration(
        `${currentPlate.illustrationPrompt}. ${storybook.visualStyle}. Flat 2D illustration on warm cream archival paper (#F6F2EA), 16:9, no text, no borders.`,
        "16:9"
      );
      const updatedPages = storybook.pages.map((p, idx) => {
        if (idx !== currentPageIdx) return p;
        const updatedPlates = (p.plates || []).map((pl, pIdx) =>
          pIdx === resolvedPlateIdx ? { ...pl, imageUrl: newDataUrl } : pl
        );
        return {
          ...p,
          imageUrl: newDataUrl,
          plates: updatedPlates,
        };
      });
      setStorybook({ ...storybook, pages: updatedPages });
      setStatusNote("Lámina ilustrada en papel crema #F6F2EA");
      setTimeout(() => setStatusNote(null), 3500);
    } catch {
      setStatusNote("Configura GEMINI_API_KEY para volver a ilustrar láminas en vivo");
      setTimeout(() => setStatusNote(null), 3500);
    } finally {
      setIsRegeneratingPlate(false);
    }
  };

  // Keyboard navigation in Reader mode (←/→/↑/↓ for turns & folios, Space for play/pause)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== "reader" || showTitleCardModal || showAgentSpecModal) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        if (showOpeningTitleCard) {
          seekToFolioAndTurn(0, 0);
        } else if (activeLineIdx < dialogueLines.length - 1) {
          seekToFolioAndTurn(currentPageIdx, Math.max(0, activeLineIdx + 1));
        } else if (currentPageIdx < storybook.pages.length - 1) {
          seekToFolioAndTurn(currentPageIdx + 1, 0);
        } else {
          advanceToNextChapterIfAvailable(storybook);
        }
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (activeLineIdx > 0 && activeLineIdx < 999) {
          seekToFolioAndTurn(currentPageIdx, activeLineIdx - 1);
        } else if (currentPageIdx > 0) {
          const prevLines = storybook.pages[currentPageIdx - 1]?.dialogueLines || [];
          seekToFolioAndTurn(currentPageIdx - 1, Math.max(0, prevLines.length - 1));
        }
      } else if (e.key === " ") {
        e.preventDefault();
        handleToggleNarration();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    viewMode,
    activeLineIdx,
    currentPageIdx,
    dialogueLines.length,
    storybook,
    isPlayingAudio,
    showOpeningTitleCard,
    showTitleCardModal,
    showAgentSpecModal,
  ]);

  const currentLibraryIdx = library.findIndex((b) => b.id === storybook.id);
  const nextChapterBook =
    currentLibraryIdx >= 0 && currentLibraryIdx < library.length - 1
      ? library[currentLibraryIdx + 1]
      : null;

  const formattedBookHeaderLeft = (
    storybook.bookHeaderLeft ||
    `BOOK ${storybook.roman || "I"}  ·  ${storybook.author.toUpperCase()}`
  ).replace(/\s*·\s*/g, "  ·  ");

  const latestLogs = agentLogs.slice(-6);

  return (
    <div style={paletteCssVars} className="archival-paper-surface">
      {/* ====================================================================
          STATE 1: OPEN-BOOK TITLE & COMMISSION FOLIO SPREAD (HOME PAGE)
          Uses the exact #F6F2EA cream paper, #D5CBB8 1px rules, and 52.917%
          spine geometry as the finished agent output (zero pills or boxes)
          ==================================================================== */}
      {viewMode === "cover" && (
        <div className="austen-spread-viewport">
          <div
            className={`austen-open-book ${
              isPageTurning ? "folio-page-turning" : ""
            }`}
          >
            {/* ==============================================================
                VERSO (LEFT PAGE): FINE-PRESS TITLE PAGE & TABLE OF CONTENTS
                (Typography ladder from render_title_card in render_audiobook_video.py)
                ============================================================== */}
            <div className="austen-left-page">
              <div className="austen-running-bar">
                <span>EDICIÓN ESCOLAR  ·  BLAS GARAY</span>
                <span>1897</span>
              </div>

              <div className="folio-title-verso">
                <div className="folio-title-block">
                  <div
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "14px",
                      letterSpacing: "0.14em",
                      color: "var(--folio-accent)",
                      textTransform: "uppercase",
                      marginBottom: "10px",
                    }}
                  >
                    PRIMERA PARTE · LA COLONIA · SECCIÓN PRIMERA
                  </div>

                  <h1
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "clamp(38px, 3.3vw, 56px)",
                      fontWeight: 500,
                      color: "var(--folio-ink)",
                      margin: "0 0 10px 0",
                      lineHeight: 1.06,
                    }}
                  >
                    Historia del Paraguay
                  </h1>

                  <div
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "13.5px",
                      letterSpacing: "0.11em",
                      color: "var(--folio-muted)",
                      textTransform: "uppercase",
                      whiteSpace: "pre",
                    }}
                  >
                    LA GOBERNACIÓN DEL RÍO DE LA PLATA Ó PARAGUAY
                  </div>

                  {/* Fine-Press Diamond Rule */}
                  <div className="folio-diamond-rule">
                    <div className="folio-diamond-rule-line" />
                    <div className="folio-diamond-rule-gem" />
                    <div className="folio-diamond-rule-line" />
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-garamond)",
                      fontStyle: "italic",
                      fontSize: "clamp(19px, 1.45vw, 24px)",
                      color: "var(--folio-ink)",
                    }}
                  >
                    Capítulos I al V resumidos para leer y escuchar en clase
                  </div>
                </div>

                {/* Classic Typographic Table of Contents */}
                <div className="folio-contents-section">
                  <div
                    className="austen-turn-rubric"
                    style={{
                      color: "var(--folio-accent)",
                      marginBottom: "10px",
                    }}
                  >
                    ÍNDICE — HAZ CLIC EN CUALQUIER CAPÍTULO PARA ABRIR Y ESCUCHAR
                  </div>

                  <div className="folio-contents-list">
                    {library.map((book, idx) => (
                      <button
                        key={book.id}
                        type="button"
                        onMouseEnter={() => prewarmBookStart(book, 2)}
                        onFocus={() => prewarmBookStart(book, 2)}
                        onClick={() => handleOpenExistingBook(book, true)}
                        className="folio-contents-row"
                      >
                        <span className="folio-contents-roman">
                          {book.roman || ROMAN_NUMERALS[idx] || "I"}
                        </span>
                        <span className="folio-contents-title">{book.title}</span>
                        <span className="folio-contents-leader" />
                        <span className="folio-contents-meta">
                          {book.author}, {book.year || "1897"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="austen-footer-bar">
                <span>CAPÍTULOS I – V</span>
                <span>BREVE RESUMEN · EDICIÓN PARA NIÑOS</span>
              </div>
            </div>

            {/* ==============================================================
                RECTO (RIGHT PAGE): COMMISSION FOLIO ("TOMO VI")
                ============================================================== */}
            <div className="austen-right-page">
              <div className="austen-running-bar">
                <span>TOMO VI  ·  NUEVO RELATO PARA LA CLASE</span>
                <span>AULA</span>
              </div>

              <div className="austen-speaker-band">
                <div>
                  <span
                    className="austen-speaker-name"
                    style={{ color: "var(--folio-accent)" }}
                  >
                    LA CLASE
                  </span>
                  <span className="austen-speaker-role">
                    {"  —  Crear un relato complementario"}
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleCommissionStorybook}
                className="austen-folio-body"
              >
                {/* Turn 1: Borderless Manuscript Inscription Surface */}
                <div className="austen-turn-block state-active">
                  <label
                    htmlFor="fairytale-prompt"
                    className="austen-turn-rubric"
                    style={{ display: "block", cursor: "pointer" }}
                  >
                    TEMA O CONSIGNA PARA LOS ALUMNOS
                  </label>
                  <textarea
                    id="fairytale-prompt"
                    rows={3}
                    value={commissionPrompt}
                    onChange={(e) => setCommissionPrompt(e.target.value)}
                    placeholder="Escribe un episodio histórico o cuento escolar para que sea resumido, ilustrado y narrado en voz alta…"
                    className="folio-manuscript-textarea"
                  />
                </div>

                {/* Turn 2: Continuous Italic Seed Run */}
                <div className="austen-turn-block state-past">
                  <div className="austen-turn-rubric">O COMENZAR CON</div>
                  <p className="austen-turn-text" style={{ lineHeight: 1.5 }}>
                    {FAIRYTALE_COMMISSION_PROMPTS.map((item, idx) => {
                      const isSelected = commissionPrompt === item.prompt;
                      return (
                        <React.Fragment key={item.id}>
                          {idx > 0 && (
                            <span
                              style={{
                                color: "var(--folio-muted)",
                                fontStyle: "normal",
                              }}
                            >
                              {"  ·  "}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setCommissionPrompt(item.prompt);
                              setSelectedPaletteKey(item.paletteKey);
                            }}
                            className={`folio-seed-link ${
                              isSelected ? "is-selected" : ""
                            }`}
                          >
                            {item.title}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </p>
                </div>

                {/* Turn 3: Inline Colophon Sentence & Typographic Inscription Link */}
                <div className="austen-turn-block state-active">
                  <div className="austen-turn-rubric">DISEÑO DE LA EDICIÓN</div>
                  <p
                    className="austen-turn-text"
                    style={{
                      fontStyle: "italic",
                      fontSize: "clamp(18px, 1.2vw, 21px)",
                      color: "var(--folio-muted)",
                    }}
                  >
                    Encuadernado en{" "}
                    <select
                      aria-label="Paleta de edición"
                      value={selectedPaletteKey}
                      onChange={(e) => setSelectedPaletteKey(e.target.value)}
                      className="folio-inline-select"
                    >
                      {Object.entries(EDITION_PALETTES).map(([key, info]) => (
                        <option key={key} value={key}>
                          {info.label}
                        </option>
                      ))}
                    </select>
                    {"  ·  narrado por "}
                    <select
                      aria-label="Voz principal"
                      value={narratorVoice}
                      onChange={(e) => setNarratorVoice(e.target.value)}
                      className="folio-inline-select"
                    >
                      {GEMINI_TTS_VOICES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                    {"  ·  láminas en "}
                    <select
                      aria-label="Estilo visual"
                      value={visualStyle}
                      onChange={(e) => setVisualStyle(e.target.value)}
                      className="folio-inline-select"
                    >
                      {VISUAL_STYLE_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    .
                  </p>
                </div>
              </form>

              <div className="austen-footer-bar">
                <div
                  className="austen-progress-filament"
                  style={{ width: "33.3%" }}
                />
                <span>CUADERNO ESCOLAR</span>
                <span>TOMO VI</span>
              </div>
            </div>
          </div>

          {/* Subtle Outer Margin Line below the bottom rule */}
          <div className="austen-margin-bar">
            <div />
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                type="button"
                onMouseEnter={() => prewarmBookStart(INITIAL_SHOWCASE_STORYBOOK, 3)}
                onClick={() => handleOpenExistingBook(INITIAL_SHOWCASE_STORYBOOK, true)}
                className="austen-margin-link"
              >
                ABRIR CAPÍTULO I · DESCUBRIMIENTO DEL PARAGUAY &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          STATE 2: ILLUMINATOR'S OPEN FOLIO SPREAD WHILE MANAGED AGENT CRAFTS
          Uses the exact same two-page spread and 3-state paragraph ink
          ==================================================================== */}
      {viewMode === "crafting" && (
        <div className="austen-spread-viewport">
          <div
            className={`austen-open-book ${
              isPageTurning ? "folio-page-turning" : ""
            }`}
          >
            {/* LEFT PAGE: Matted 16:9 Stage Box being engraved */}
            <div className="austen-left-page">
              <div className="austen-running-bar">
                <span>TOMO VI  ·  RELATO ESCOLAR</span>
                <span>1897</span>
              </div>

              <div className="austen-plate-mat">
                <div
                  className="austen-plate-stage"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "24px 28px",
                    textAlign: "center",
                    overflow: "hidden",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "12px",
                        letterSpacing: "0.153em",
                        color: "var(--folio-accent)",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      {agentName.toUpperCase()}  ·  {modelName.toUpperCase()}
                    </div>

                    <div
                      style={{
                        fontFamily: "var(--font-garamond)",
                        fontStyle: "italic",
                        fontSize: "clamp(19px, 1.35vw, 23px)",
                        color: "var(--folio-ink)",
                        maxWidth: "560px",
                        lineHeight: 1.32,
                      }}
                    >
                      {activeStageLabel || "Preparando la lámina sobre papel crema…"}
                    </div>

                    <div
                      className="folio-diamond-rule"
                      style={{ maxWidth: "240px", margin: "12px auto" }}
                    >
                      <div className="folio-diamond-rule-line" />
                      <div className="folio-diamond-rule-gem" />
                      <div className="folio-diamond-rule-line" />
                    </div>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      borderTop: "1px solid var(--folio-rule)",
                      paddingTop: "10px",
                    }}
                  >
                    {latestLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          fontFamily: "var(--font-garamond)",
                          fontSize: "14px",
                          lineHeight: 1.28,
                          color: "var(--folio-ink)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-cinzel)",
                            fontSize: "10.5px",
                            letterSpacing: "0.08em",
                            color: "var(--folio-accent)",
                            marginRight: "8px",
                          }}
                        >
                          {log.timestamp}
                        </span>
                        <span style={{ fontWeight: 500 }}>{log.title}</span>
                        {log.detail ? (
                          <span
                            style={{
                              fontStyle: "italic",
                              color: "var(--folio-muted)",
                            }}
                          >
                            {"  —  "}
                            {log.detail.replace(/\s+/g, " ").slice(0, 110)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="austen-plate-caption-row">
                  <span className="austen-plate-number">
                    {environmentId
                      ? `ENV · ${environmentId.slice(0, 10).toUpperCase()}`
                      : "EDICIÓN ESCOLAR"}
                  </span>
                  <span className="austen-plate-caption">
                    {interactionId
                      ? `Sesión ${interactionId.slice(0, 14)}…`
                      : "Preparando páginas y láminas"}
                  </span>
                </div>
              </div>

              <div className="austen-footer-bar">
                <span>LIBRO HISTÓRICO ILUSTRADO</span>
                <span>AULA · GEMINI</span>
              </div>
            </div>

            {/* RIGHT PAGE: 5 Pipeline Stages as 3-State Literary Paragraphs */}
            <div className="austen-right-page">
              <div className="austen-running-bar">
                <span>NUEVO RELATO ESCOLAR</span>
                <span>TOMO VI</span>
              </div>

              <div className="austen-speaker-band">
                <div>
                  <span
                    className="austen-speaker-name"
                    style={{ color: "var(--folio-accent)" }}
                  >
                    EL ILUSTRADOR
                  </span>
                  <span className="austen-speaker-role">
                    {`  —  Etapa ${ROMAN_NUMERALS[activeStageIdx] || "I"} de V`}
                  </span>
                </div>
              </div>

              <div className="austen-folio-body">
                {PIPELINE_STAGES.map((st) => {
                  const turnStateClass =
                    st.index === activeStageIdx
                      ? "state-active"
                      : st.index < activeStageIdx
                      ? "state-past"
                      : "state-future";
                  return (
                    <div
                      key={st.index}
                      className={`austen-turn-block ${turnStateClass}`}
                    >
                      <div className="austen-turn-rubric">{st.code}</div>
                      <p className="austen-turn-text">{st.title}</p>
                    </div>
                  );
                })}

                {agentError && (
                  <div className="austen-turn-block state-active">
                    <div
                      className="austen-turn-rubric"
                      style={{ color: "#9E332B" }}
                    >
                      AVISO
                    </div>
                    <p
                      className="austen-turn-text"
                      style={{ color: "#9E332B", fontStyle: "italic" }}
                    >
                      {agentError}
                    </p>
                  </div>
                )}
              </div>

              <div className="austen-footer-bar">
                <div
                  className="austen-progress-filament"
                  style={{ width: `${((activeStageIdx + 1) / 5) * 100}%` }}
                />
                <span>ESCENA I</span>
                <span>PÁGINA VI.1</span>
              </div>
            </div>
          </div>

          <div className="austen-margin-bar">
            <span>
              {environmentId
                ? `ENTORNO ${environmentId.slice(0, 12)}`
                : "PREPARANDO NUEVA EDICIÓN"}
            </span>
            <button
              type="button"
              onClick={() => abortControllerRef.current?.abort()}
              className="austen-margin-link"
            >
              CERRAR Y CANCELAR
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          STATE 3: THE JANE AUSTEN TWO-PAGE OPEN FOLIO SPREAD (READER & PLAYER)
          Pixel-faithful to classic_novels_opening_chapters.mp4:
          - 0.0s .. 2.2s: Full-Frame Fine-Press Chapter Title Card with Character Sheet
          - 2.2s .. 5.4s: 3D Spine-Hinged Page Turn & Pop-Up Diorama Unfold (all turns in state-future)
          - 5.4s .. end: Real-Time Synchronized 3-State Paragraph Highlighting & Automatic Folio Crossfades
          ==================================================================== */}
      {viewMode === "reader" && (
        <div className="austen-spread-viewport">
          {showOpeningTitleCard ? (
            /* ================================================================
               STAGE A (0.0s .. 2.2s): FULL-FRAME CHAPTER TITLE CARD
               Matches render_title_card in render_audiobook_video.py
               ================================================================ */
            <div
              className="austen-opening-title-card"
              onClick={() => seekToFolioAndTurn(0, 0)}
              title="Click to turn immediately to Folio I.1"
            >
              <div className="austen-opening-title-inner">
                <div>
                    <div
                      style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "15px",
                        letterSpacing: "0.153em",
                        color: "var(--folio-accent)",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                      }}
                    >
                      CAPÍTULO {storybook.roman || "I"} &nbsp;·&nbsp;{" "}
                      {storybook.genreFooterLeft || "LA COLONIA · SECCIÓN PRIMERA"}
                    </div>

                    <h1
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: "clamp(42px, 3.8vw, 62px)",
                        fontWeight: 500,
                        color: "var(--folio-ink)",
                        margin: "0 0 8px 0",
                        lineHeight: 1.04,
                      }}
                    >
                      {storybook.title}
                    </h1>

                    <div
                      style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "16px",
                        letterSpacing: "0.12em",
                        color: "var(--folio-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      {storybook.author} &nbsp;·&nbsp; {storybook.year || "1897"}
                    </div>

                    <div
                      className="folio-diamond-rule"
                      style={{ maxWidth: "420px", margin: "16px auto" }}
                    >
                      <div className="folio-diamond-rule-line" />
                      <div className="folio-diamond-rule-gem" />
                      <div className="folio-diamond-rule-line" />
                    </div>

                    <div
                      style={{
                        fontFamily: "var(--font-garamond)",
                        fontStyle: "italic",
                        fontSize: "clamp(21px, 1.5vw, 25px)",
                        color: "var(--folio-ink)",
                      }}
                    >
                      {storybook.subtitle} &mdash;{" "}
                      {storybook.settingFooterRight || "Paraguay"}
                    </div>
                  </div>

                  {/* Matted 16:9 Illustration Plate */}
                  <div
                    style={{
                      backgroundColor: "var(--folio-card)",
                      border: "1px solid var(--folio-rule)",
                      padding: "14px 12px",
                      maxWidth: "740px",
                      width: "100%",
                      margin: "14px auto",
                    }}
                  >
                    <div
                      style={{
                        aspectRatio: "16 / 9",
                        border: "1px solid var(--folio-rule)",
                        overflow: "hidden",
                        backgroundColor: "var(--folio-paper)",
                      }}
                    >
                      <img
                        src={
                          storybook.charSheetImageUrl ||
                          storybook.coverImageUrl ||
                          storybook.pages?.[0]?.imageUrl
                        }
                        alt={`Ilustración de ${storybook.title}`}
                        referrerPolicy="no-referrer"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "13px",
                        letterSpacing: "0.129em",
                        color: "var(--folio-muted)",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      EDICIÓN ESCOLAR ILUSTRADA &nbsp;·&nbsp; LECTURA GUIADA PARA LA CLASE
                    </div>

                    <div
                      style={{
                        fontFamily: "var(--font-garamond)",
                        fontStyle: "italic",
                        fontSize: "19.5px",
                        color: "var(--folio-ink)",
                      }}
                    >
                      {storybook.characters
                        .map((c) => c.name)
                        .join("   ·   ")}
                    </div>
                  </div>
              </div>
            </div>
          ) : (
            /* ================================================================
               STAGE B & C (2.2s .. end): TWO-PAGE OPEN FOLIO SPREAD
               Left Page: 3D Pop-Up Diorama Stage (unfolds on scene open, steady across same-scene folios)
               Right Page: 3-State Synchronized Literary Narration & Dialogue Turns
               ================================================================ */
            <div
              className={`austen-open-book ${
                isPageTurning ? "folio-page-turning" : ""
              }`}
            >
              {/* ==============================================================
                  LEFT PAGE: VISUAL PLATE FOLIO
                  BOOK I · JANE AUSTEN | 1813
                  Matted 16:9 Stage: PLATE I OF III | Longbourn Morning Room
                  REGENCY SOCIAL SATIRE | LONGBOURN, HERTFORDSHIRE
                  ============================================================== */}
              <div className="austen-left-page">
                <div className="austen-running-bar">
                  <span>{formattedBookHeaderLeft}</span>
                  <span>{storybook.year || "1813"}</span>
                </div>

                {/* Centered Matted 16:9 Stage Box (#EFE9DC Card Mat + #D5CBB8 1px Rule) */}
                <div className="austen-plate-mat">
                  <div
                    className={`austen-plate-stage ${
                      isDioramaUnfolding ? "folio-diorama-unfolding" : ""
                    }`}
                    onClick={handleCyclePlate}
                    title="Click plate to cycle between 3D Pop-Up Diorama, 2D Watercolour Plate, and Character Sheet"
                  >
                    <img
                      src={
                        currentPlate?.imageDataUrl ||
                        currentPlate?.imageUrl ||
                        currentPage?.dioramaUrl ||
                        currentPage?.imageUrl ||
                        storybook.coverImageUrl
                      }
                      alt={currentPlate?.title || currentPage?.imageCaption}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Plate Caption Row inside Mat */}
                  <div className="austen-plate-caption-row">
                    <button
                      type="button"
                      onClick={handleCyclePlate}
                      className="austen-plate-number"
                      title="Haz clic para cambiar de lámina"
                    >
                      {canonicalPlateLabel}
                    </button>
                    <span className="austen-plate-caption">
                      {currentPlate?.title || currentPage?.imageCaption}
                    </span>
                  </div>
                </div>

                {/* Left Page Running Footer */}
                <div className="austen-footer-bar">
                  <span>
                    {storybook.genreFooterLeft || "LA COLONIA · SECCIÓN PRIMERA"}
                  </span>
                  <span>
                    {storybook.settingFooterRight || "PARAGUAY"}
                  </span>
                </div>
              </div>

              {/* ==============================================================
                  RIGHT PAGE: LITERARY NARRATION & DIALOGUE FOLIO
                  ============================================================== */}
              <div
                className={`austen-right-page ${
                  isRightFolioFading ? "folio-right-page-fading" : ""
                }`}
              >
                <div className="austen-running-bar">
                  <span>{storybook.title.toUpperCase()}</span>
                  <span>{currentPage?.chapterTitle || "CAPÍTULO I"}</span>
                </div>

                {/* Active Speaker Subheader Band */}
                <div className="austen-speaker-band">
                  <div>
                    <span
                      className="austen-speaker-name"
                      style={{
                        color:
                          activeLineIdx >= 0 &&
                          activeLineIdx < 999 &&
                          activeLine?.isDialogue
                            ? "var(--folio-accent)"
                            : "var(--folio-muted)",
                      }}
                    >
                      {activeLineIdx >= 0 && activeLineIdx < 999
                        ? activeLine?.speakerLabel ||
                          activeLine?.speaker?.toUpperCase() ||
                          "RELATO"
                        : "RELATO PARA LA CLASE"}
                    </span>
                    <span className="austen-speaker-role">
                      {"  —  "}
                      {activeLineIdx >= 0 && activeLineIdx < 999
                        ? activeLine?.voiceRoleLabel ||
                          (activeLine?.isDialogue
                            ? "Diálogo Histórico"
                            : "Narración Histórica")
                        : "Narración Histórica"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleNarration}
                    className={`austen-margin-link ${
                      isPlayingAudio ? "is-active" : ""
                    }`}
                    style={{ fontSize: "11px" }}
                    title="Pausar o continuar la lectura en voz alta"
                  >
                    {formatTimecode(playbackTimeSec)} / {formatTimecode(totalDurSec)}{" "}
                    &nbsp;·&nbsp; {isPlayingAudio ? "PAUSAR" : "ESCUCHAR"}
                  </button>
                </div>

                {/* Right-Page Literary Body: 3-State Paragraph Ink Highlighting */}
                <div className="austen-folio-body">
                  {dialogueLines.map((line, idx) => {
                    const prevSpeaker =
                      idx > 0 ? dialogueLines[idx - 1]?.speaker : null;
                    const showRubric =
                      Boolean(line.isDialogue) && line.speaker !== prevSpeaker;

                    // Exact 3-state turn logic from render_audiobook_video.py:
                    // - activeLineIdx === -1: pre-speech on folio -> all turns in state-future (38% ink)
                    // - activeLineIdx === 999: post-speech on folio -> all turns in state-past (50% ink)
                    // - idx === activeLineIdx: currently spoken turn -> state-active (100% ink + sage rubric)
                    // - idx < activeLineIdx: completed turn -> state-past (50% ink)
                    // - idx > activeLineIdx: upcoming turn -> state-future (38% ink)
                    const turnStateClass =
                      activeLineIdx === -1
                        ? "state-future"
                        : activeLineIdx === 999
                        ? "state-past"
                        : idx === activeLineIdx
                        ? "state-active"
                        : idx < activeLineIdx
                        ? "state-past"
                        : "state-future";

                    return (
                      <div
                        key={idx}
                        onClick={() => seekToFolioAndTurn(currentPageIdx, idx)}
                        className={`austen-turn-block ${turnStateClass}`}
                        title="Click paragraph to seek narration here"
                      >
                        {showRubric && (
                          <div className="austen-turn-rubric">
                            {line.speakerLabel || line.speaker.toUpperCase()}
                          </div>
                        )}
                        <p className="austen-turn-text">{line.text}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Right Page Running Footer with 2px Sage Reading Progress Filament: SCENE I | FOLIO I.1 */}
                <div className="austen-footer-bar">
                  <div
                    className="austen-progress-filament"
                    style={{
                      width: `${Math.min(100, Math.max(0, chapterProgress * 100))}%`,
                    }}
                  />
                  <span>{currentPage?.sceneLabel || "SCENE I"}</span>
                  <span
                    onClick={() =>
                      seekToFolioAndTurn(
                        (currentPageIdx + 1) % storybook.pages.length,
                        0
                      )
                    }
                    style={{ cursor: "pointer" }}
                    title="Click to turn folio leaf"
                  >
                    {currentPage?.folioLabel ||
                      `FOLIO ${storybook.roman || "I"}.${currentPageIdx + 1}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ghosted Outer Margin Line */}
          <div className="austen-margin-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <button
                type="button"
                onClick={handleCloseBookToCover}
                className="austen-margin-link"
              >
                &larr; ÍNDICE Y PORTADA
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={handleToggleNarration}
                className={`austen-margin-link ${
                  isPlayingAudio ? "is-active" : ""
                }`}
              >
                {isPlayingAudio ? "PAUSAR LECTURA" : "CONTINUAR LECTURA"}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => startBookNarration(storybook, 0, true)}
                className="austen-margin-link"
              >
                REINICIAR CAPÍTULO
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={handleSynthesizeFolioWav}
                disabled={isSynthesizingAudio}
                className="austen-margin-link"
              >
                {isSynthesizingAudio ? "GENERANDO VOZ…" : "VOZ GEMINI (WAV)"}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={handleRepaintCurrentPlate}
                disabled={isRegeneratingPlate}
                className="austen-margin-link"
              >
                {isRegeneratingPlate ? "ILUSTRANDO…" : "NUEVA LÁMINA"}
              </button>
              {statusNote && (
                <>
                  <span>·</span>
                  <span
                    style={{
                      fontFamily: "var(--font-garamond)",
                      fontStyle: "italic",
                      textTransform: "none",
                      letterSpacing: "normal",
                      fontSize: "14px",
                      color: "var(--folio-accent)",
                    }}
                  >
                    {statusNote}
                  </span>
                </>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <button
                type="button"
                onClick={() =>
                  currentPageIdx > 0 &&
                  seekToFolioAndTurn(currentPageIdx - 1, 0)
                }
                disabled={currentPageIdx === 0 && !showOpeningTitleCard}
                className="austen-margin-link"
              >
                &lsaquo; ANTERIOR
              </button>
              <span>
                {storybook.pages.map((p, pIdx) => (
                  <React.Fragment key={p.pageNumber}>
                    {pIdx > 0 && " · "}
                    <button
                      type="button"
                      onClick={() => seekToFolioAndTurn(pIdx, 0)}
                      className={`austen-margin-link ${
                        pIdx === currentPageIdx && !showOpeningTitleCard
                          ? "is-active"
                          : ""
                      }`}
                    >
                      {`${storybook.roman || "I"}.${pIdx + 1}`}
                    </button>
                  </React.Fragment>
                ))}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (currentPageIdx < storybook.pages.length - 1) {
                    seekToFolioAndTurn(currentPageIdx + 1, 0);
                  } else if (nextChapterBook) {
                    handleOpenExistingBook(nextChapterBook, true);
                  }
                }}
                disabled={currentPageIdx >= storybook.pages.length - 1 && !nextChapterBook}
                className="austen-margin-link"
              >
                {currentPageIdx >= storybook.pages.length - 1 && nextChapterBook
                  ? `CAP. ${nextChapterBook.roman || currentLibraryIdx + 2} \u203A`
                  : "SIGUIENTE \u203A"}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setShowTitleCardModal(true)}
                className="austen-margin-link"
              >
                PORTADILLA
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setShowAgentSpecModal(true)}
                className="austen-margin-link"
              >
                FICHA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          LEAF OVERLAY 1: FINE-PRESS CHAPTER TITLE CARD & CHARACTER SHEET
          (Matches 01_pride_and_prejudice_preview_title.png / render_title_card)
          ==================================================================== */}
      {showTitleCardModal && (
        <div
          className="folio-modal-backdrop"
          onClick={() => setShowTitleCardModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(30, 27, 24, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 50,
          }}
        >
          <div
            className="folio-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--folio-paper)",
              border: "1px solid var(--folio-rule)",
              padding: "6px",
              maxWidth: "1020px",
              width: "100%",
            }}
          >
            <div
              className="folio-modal-inner"
              style={{
                border: "1px solid var(--folio-rule)",
                padding: "28px 36px",
                textAlign: "center",
                position: "relative",
              }}
            >
                <button
                  type="button"
                  onClick={() => setShowTitleCardModal(false)}
                  className="austen-margin-link"
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "20px",
                  }}
                >
                  CERRAR &times;
                </button>

                <div
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "14px",
                    letterSpacing: "0.153em",
                    color: "var(--folio-accent)",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  CAPÍTULO {storybook.roman || "I"} &nbsp;·&nbsp;{" "}
                  {storybook.genreFooterLeft || "LA COLONIA · SECCIÓN PRIMERA"}
                </div>

                <h2
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "48px",
                    fontWeight: 500,
                    color: "var(--folio-ink)",
                    margin: "0 0 8px 0",
                  }}
                >
                  {storybook.title}
                </h2>

                <div
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "15px",
                    letterSpacing: "0.12em",
                    color: "var(--folio-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {storybook.author} &nbsp;·&nbsp; {storybook.year || "1897"}
                </div>

                <div className="folio-diamond-rule" style={{ maxWidth: "360px" }}>
                  <div className="folio-diamond-rule-line" />
                  <div className="folio-diamond-rule-gem" />
                  <div className="folio-diamond-rule-line" />
                </div>

                <div
                  style={{
                    fontFamily: "var(--font-garamond)",
                    fontStyle: "italic",
                    fontSize: "22px",
                    color: "var(--folio-ink)",
                    marginBottom: "18px",
                  }}
                >
                  {storybook.subtitle} &mdash;{" "}
                  {storybook.settingFooterRight || "Paraguay"}
                </div>

                {/* Matted 16:9 Illustration Plate */}
                <div
                  style={{
                    backgroundColor: "var(--folio-card)",
                    border: "1px solid var(--folio-rule)",
                    padding: "14px 12px",
                    maxWidth: "680px",
                    margin: "0 auto 18px",
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "16 / 9",
                      border: "1px solid var(--folio-rule)",
                      overflow: "hidden",
                      backgroundColor: "var(--folio-paper)",
                    }}
                  >
                    <img
                      src={
                        storybook.charSheetImageUrl ||
                        storybook.coverImageUrl ||
                        storybook.pages?.[0]?.imageUrl
                      }
                      alt={`Lámina de ${storybook.title}`}
                      referrerPolicy="no-referrer"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "12px",
                    letterSpacing: "0.129em",
                    color: "var(--folio-muted)",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  EDICIÓN ESCOLAR ILUSTRADA &nbsp;·&nbsp; LECTURA GUIADA EN VOZ ALTA
                </div>

                <div
                  style={{
                    fontFamily: "var(--font-garamond)",
                    fontStyle: "italic",
                    fontSize: "18.5px",
                    color: "var(--folio-ink)",
                  }}
                >
                  {storybook.characters
                    .map((c) => c.name)
                    .join("   ·   ")}
                </div>
              </div>
            </div>
          </div>
      )}

      {/* ====================================================================
          LEAF OVERLAY 2: EDITION COLOPHON & MANAGED AGENT CONFIGURATION
          ==================================================================== */}
      {showAgentSpecModal && (
        <div
          className="folio-modal-backdrop"
          onClick={() => setShowAgentSpecModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(30, 27, 24, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 50,
          }}
        >
          <div
            className="folio-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--folio-paper)",
              border: "1px solid var(--folio-rule)",
              padding: "24px 32px",
              maxWidth: "860px",
              width: "100%",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderBottom: "1px solid var(--folio-rule)",
                paddingBottom: "12px",
                marginBottom: "18px",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "12px",
                    letterSpacing: "0.129em",
                    color: "var(--folio-accent)",
                  }}
                >
                  COLOPHON &amp; GEMINI MANAGED AGENT ARCHITECTURE
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "28px",
                    fontWeight: 500,
                    margin: "4px 0 0",
                  }}
                >
                  {agentName} ({modelName}) + classic-audiobooks Pipeline
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowAgentSpecModal(false)}
                className="austen-margin-link"
              >
                CLOSE &times;
              </button>
            </div>

            <div
              className="folio-colophon-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "16px",
                marginBottom: "18px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "11px",
                    letterSpacing: "0.114em",
                    color: "var(--folio-muted)",
                    marginBottom: "4px",
                  }}
                >
                  MANAGED AGENT ID
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--folio-rule)",
                    padding: "6px 2px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--folio-ink)",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "11px",
                    letterSpacing: "0.114em",
                    color: "var(--folio-muted)",
                    marginBottom: "4px",
                  }}
                >
                  AGENT MODEL (Neon)
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--folio-rule)",
                    padding: "6px 2px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--folio-ink)",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "11px",
                    letterSpacing: "0.114em",
                    color: "var(--folio-muted)",
                    marginBottom: "4px",
                  }}
                >
                  CREDENTIAL &amp; SANDBOX ISOLATION
                </label>
                <div
                  style={{
                    width: "100%",
                    borderBottom: "1px solid var(--folio-rule)",
                    padding: "6px 2px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11.5px",
                    color: "var(--folio-muted)",
                  }}
                >
                  Server-side only (sandbox network disabled)
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <div
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "11px",
                  letterSpacing: "0.114em",
                  color: "var(--folio-muted)",
                  marginBottom: "6px",
                }}
              >
                GEMINI-API-CLI BOOTSTRAP COMMAND IN SANDBOX
              </div>
              <pre
                style={{
                  backgroundColor: "var(--folio-card)",
                  border: "1px solid var(--folio-rule)",
                  padding: "10px 12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11.5px",
                  color: "var(--folio-muted)",
                  overflowX: "auto",
                  margin: 0,
                }}
              >
                {GEMINI_API_CLI_INSTALL_CMD}
              </pre>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "11px",
                  letterSpacing: "0.114em",
                  color: "var(--folio-muted)",
                  marginBottom: "6px",
                }}
              >
                MOUNTED /.AGENTS/AGENTS.MD &amp; CLASSIC-AUDIOBOOKS SCRIPTS
              </div>
              <pre
                style={{
                  backgroundColor: "var(--folio-card)",
                  border: "1px solid var(--folio-rule)",
                  padding: "12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11.5px",
                  color: "var(--folio-muted)",
                  whiteSpace: "pre-wrap",
                  maxHeight: "280px",
                  overflowY: "auto",
                  margin: 0,
                }}
              >
                {AGENTS_MD_CONTENT}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
