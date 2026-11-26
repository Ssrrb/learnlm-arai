import ch1Img from "../assets/images/paraguay_ch1_discovery_1795635013905.jpg";
import ch1P2Img from "../assets/images/paraguay_ch1_p2_alejo_1795636873196.jpg";
import ch1P3Img from "../assets/images/paraguay_ch1_p3_gaboto_1795636873373.jpg";
import ch2P1Img from "../assets/images/paraguay_ch2_p1_mendoza_1795636874630.jpg";
import ch2P2Img from "../assets/images/paraguay_ch2_p2_salazar_1795636874898.jpg";
import ch2Img from "../assets/images/paraguay_ch2_asuncion_1795635014394.jpg";
import ch3P1Img from "../assets/images/paraguay_ch3_p1_irala_1795636875953.jpg";
import ch3Img from "../assets/images/paraguay_ch3_conquest_1795635014652.jpg";
import ch3P3Img from "../assets/images/paraguay_ch3_p3_mestizaje_1795636929492.jpg";
import ch4P1Img from "../assets/images/paraguay_ch4_p1_guaira_1795636930086.jpg";
import ch4Img from "../assets/images/paraguay_ch4_madre_ciudades_1795635016017.jpg";
import ch4P3Img from "../assets/images/paraguay_ch4_p3_hernandarias_1795636930396.jpg";
import ch5P1Img from "../assets/images/paraguay_ch5_p1_reduccion_1795636931857.jpg";
import ch5Img from "../assets/images/paraguay_ch5_misiones_1795635015993.jpg";
import ch5P3Img from "../assets/images/paraguay_ch5_p3_legado_1795636930824.jpg";
import { ClassicPreset, Storybook, StorybookPalette } from "../types";

export const EDITION_PALETTES: Record<string, { label: string; palette: StorybookPalette }> = {
  regency: {
    label: "Verde Lapacho y Pergamino",
    palette: {
      paper: "#F6F2EA",
      card: "#EFE9DC",
      ink: "#1E1B18",
      muted: "#7A7267",
      accent: "#4A6B53",
      rule: "#D5CBB8",
      coverCloth: "#3D5845",
      coverSpine: "#2B3F31",
    },
  },
  victorian: {
    label: "Ámbar del Río Paraguay",
    palette: {
      paper: "#F4EFE4",
      card: "#EAE2D3",
      ink: "#181A1B",
      muted: "#6E6A63",
      accent: "#9E6B2E",
      rule: "#CFC6B4",
      coverCloth: "#5A3E28",
      coverSpine: "#3E2A1B",
    },
  },
  wonderland: {
    label: "Carmesí de los Lapachos",
    palette: {
      paper: "#F8F5EE",
      card: "#F0EBE0",
      ink: "#1C2026",
      muted: "#72767D",
      accent: "#9E332B",
      rule: "#D8D0C1",
      coverCloth: "#6E2B26",
      coverSpine: "#4C1D19",
    },
  },
  chronos: {
    label: "Azul de los Ríos",
    palette: {
      paper: "#F2F4F5",
      card: "#E6EAEF",
      ink: "#18222C",
      muted: "#64707D",
      accent: "#3B5F7A",
      rule: "#C8D0D8",
      coverCloth: "#2E3D4F",
      coverSpine: "#1F2936",
    },
  },
  americana: {
    label: "Terracota Misionera",
    palette: {
      paper: "#F6EFE4",
      card: "#EDE3D3",
      ink: "#261E19",
      muted: "#7A6D61",
      accent: "#B85733",
      rule: "#D6C8B4",
      coverCloth: "#6B3B28",
      coverSpine: "#4A281B",
    },
  },
};

export const VISUAL_STYLE_PRESETS = [
  {
    id: "editorial-acuarela",
    label: "Tinta sepia y acuarela clásica sobre papel crema",
    value:
      "Fine 19th-century sepia pen-and-ink line drawing with delicate muted watercolour wash (sage green, warm ochre, terracotta, river blue) on warm cream archival paper (#F6F2EA)",
  },
  {
    id: "libro-escolar",
    label: "Lámina ilustrada escolar de historia",
    value:
      "Warm children's fine-press history book illustration with gentle pen-and-ink outlines and soft watercolour wash on warm cream archival paper (#F6F2EA)",
  },
  {
    id: "grabado-colonial",
    label: "Grabado colonial y aguada cálida",
    value:
      "Classic South American historical engraving with warm amber-ochre and charcoal watercolour wash on archival rag paper",
  },
];

export const GEMINI_TTS_VOICES = [
  { id: "Aoede", label: "Aoede — Voz dulce y cálida de mujer (predeterminada)" },
  { id: "Kore", label: "Kore — Voz femenina clara y serena" },
  { id: "Leda", label: "Leda — Voz femenina juvenil y expresiva" },
  { id: "Charon", label: "Charon — Voz serena de cronista" },
  { id: "Orus", label: "Orus — Voz firme de explorador" },
  { id: "Fenrir", label: "Fenrir — Relator pausado de historia" },
  { id: "Puck", label: "Puck — Voz ágil y entusiasta" },
];

export const FAIRYTALE_COMMISSION_PROMPTS = [
  {
    id: "poblacion-precolonial",
    title: "La Población Precolonial (Introducción)",
    subtitle: "Cómo vivían los guaraníes antes de 1516",
    paletteKey: "regency",
    prompt:
      "Resume de forma breve y clara para niños de primaria la Introducción de Blas Garay sobre la población precolonial del Paraguay: cómo vivían los pueblos guaraníes en armonía con los ríos, los bosques y los cultivos de maíz y mandioca.",
  },
  {
    id: "leyenda-rey-blanco",
    title: "La Leyenda de la Sierra de la Plata",
    subtitle: "El viaje de Alejo García por tierra",
    paletteKey: "victorian",
    prompt:
      "Crea un relato escolar breve y educativo para niños sobre la expedición terrestre de Alejo García en 1524 cruzando el territorio paraguayo junto a sus guías guaraníes en busca de la legendaria Sierra de la Plata.",
  },
  {
    id: "asuncion-madre-ciudades",
    title: "Asunción, Madre de Ciudades",
    subtitle: "Las expediciones que partieron del puerto",
    paletteKey: "chronos",
    prompt:
      "Escribe una historia breve para alumnos de primaria explicando por qué a Asunción se la llama Madre de Ciudades y cómo salieron desde su puerto las expediciones que fundaron Santa Fe, Buenos Aires y otras ciudades.",
  },
  {
    id: "musicos-misiones",
    title: "Los Jóvenes Músicos de las Misiones",
    subtitle: "Arte y talleres en las reducciones guaraníes",
    paletteKey: "americana",
    prompt:
      "Cuenta una historia breve y amena para niños sobre un taller de música en una reducción guaraní del siglo XVII, donde los jóvenes aprendían a construir violines y arpas con madera de la selva.",
  },
];

const DEFAULT_MODELS_USED = {
  orchestrator: "antigravity-preview-09-2026 (gemini-4-neon)",
  cli: "gemini-api-cli (github.com/google-gemini/gemini-api-cli)",
  writer: "gemini-4-neon / books_spec.py",
  illustrator: "gemini-3.1-flash-lite-image",
  narrator: "gemini-3.8-flash-tts",
  composer: "lyria-3.5",
};

/**
 * Capítulos I al V de la Primera Parte ("La Colonia — Sección Primera: La gobernación del Río de la Plata ó Paraguay")
 * de la obra "Breve resumen de la historia del Paraguay" de Blas Garay (Madrid, 1897),
 * resumidos con rigor histórico y lenguaje claro para alumnos de primaria.
 */

export const PARAGUAY_CAP_1_STORYBOOK: Storybook = {
  id: "paraguay_cap_01_descubrimiento",
  roman: "I",
  bookHeaderLeft: "CAPÍTULO I  ·  BLAS GARAY",
  year: "1897",
  genreFooterLeft: "LA COLONIA · SECCIÓN PRIMERA",
  settingFooterRight: "RÍO DE LA PLATA Y PARAGUAY",
  title: "Descubrimiento del Paraguay",
  subtitle: "Capítulo I · La gobernación del Río de la Plata ó Paraguay",
  author: "Blas Garay",
  palette: EDITION_PALETTES.regency.palette,
  sourceType: "classic-adaptation",
  visualStyle: VISUAL_STYLE_PRESETS[0].value,
  mood: "Aventura fluvial, descubrimiento geográfico y relato escolar claro",
  musicPrompt: "Suave guitarra acústica y arpa paraguaya tranquila de fondo escolar.",
  charSheetPrompt:
    "16th-century Spanish explorers and Guarani river guides looking at a river horizon on warm cream paper",
  charSheetImageUrl: ch1Img,
  coverImagePrompt: "Exploradores remontando los ríos Paraná y Paraguay en el siglo XVI",
  coverImageUrl: ch1Img,
  titleCardEndSec: 0.9,
  modelsUsed: DEFAULT_MODELS_USED,
  characters: [
    {
      id: "narradora",
      name: "Maestra Narradora",
      role: "Relato Histórico",
      description: "Voz docente clara y entusiasta para la clase",
      voiceName: "Aoede",
      voiceStyle: "cálida, clara y didáctica para niños",
    },
    {
      id: "alejo_garcia",
      name: "Alejo García",
      role: "Explorador",
      description: "Primer europeo en cruzar el Paraguay por tierra (1524)",
      voiceName: "Charon",
      voiceStyle: "asombrado y respetuoso",
    },
    {
      id: "sebastian_gaboto",
      name: "Sebastián Gaboto",
      role: "Navegante",
      description: "Primer europeo en navegar el río Paraguay (1527–1528)",
      voiceName: "Orus",
      voiceStyle: "entusiasta y observador",
    },
  ],
  pages: [
    {
      pageNumber: 1,
      sceneIdx: 0,
      sceneLabel: "ESCENA I · CAPÍTULO I",
      folioLabel: "PÁGINA I.1",
      chapterTitle: "CAPÍTULO I · DESCUBRIMIENTO DEL PARAGUAY",
      narrativeText:
        "Hace muchos siglos, antes de la llegada de los europeos, el Paraguay ya estaba habitado por pueblos indígenas, especialmente la gran nación guaraní, que vivía junto a sus ríos y bosques. En 1516, el navegante español Juan Díaz de Solís llegó al inmenso estuario al que llamó Mar Dulce, hoy conocido como Río de la Plata, abriendo el camino hacia el corazón de América del Sur.",
      illustrationPrompt: "Caravela y canoas navegando los ríos Paraná y Paraguay en 1516",
      imageCaption: "Los grandes ríos del Sur (1516)",
      imageUrl: ch1Img,
      dioramaUrl: ch1Img,
      plates: [
        {
          plateNumberRoman: "I",
          plateLabel: "LÁMINA I DE III",
          title: "Los grandes ríos hacia el Paraguay (1516)",
          illustrationPrompt: "Caravela y canoas navegando entre palmeras y lapachos",
          imageUrl: ch1Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Hace más de quinientos años, antes de que llegaran los barcos desde Europa, estas tierras verdes y fértiles ya eran el hogar de la nación guaraní.",
          durationSeconds: 7.5,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "En 1516, el navegante Juan Díaz de Solís descubrió el ancho estuario al que llamó «Mar Dulce», hoy conocido como Río de la Plata, señalando la puerta de entrada al interior del continente.",
          durationSeconds: 9.2,
          plateIndex: 0,
        },
      ],
    },
    {
      pageNumber: 2,
      sceneIdx: 1,
      sceneLabel: "ESCENA II · CAPÍTULO I",
      folioLabel: "PÁGINA I.2",
      chapterTitle: "CAPÍTULO I · DESCUBRIMIENTO DEL PARAGUAY",
      narrativeText:
        "De aquella expedición de Solís quedó náufrago en la costa del Brasil un valiente portugués al servicio de España llamado Alejo García. Tras escuchar historias sobre una lejana «Sierra de la Plata», emprendió entre 1524 y 1525 una caminata histórica acompañado por guías guaraníes y atravesó el Paraguay por tierra, convirtiéndose en el primer europeo en pisar nuestro territorio.",
      illustrationPrompt: "Alejo García cruzando por tierra el Paraguay junto a guías guaraníes",
      imageCaption: "Alejo García cruza por tierra (1524)",
      imageUrl: ch1P2Img,
      dioramaUrl: ch1P2Img,
      plates: [
        {
          plateNumberRoman: "II",
          plateLabel: "LÁMINA II DE III",
          title: "Alejo García y el camino por tierra (1524)",
          illustrationPrompt: "Exploradores guiados por indígenas guaraníes",
          imageUrl: ch1P2Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Un sobreviviente de la expedición de Solís, llamado Alejo García, escuchó hablar de unas montañas ricas en plata hacia el oeste.",
          durationSeconds: 6.8,
          plateIndex: 0,
        },
        {
          speaker: "Alejo García",
          speakerLabel: "ALEJO GARCÍA (1524)",
          voiceRoleLabel: "Crónica Histórica",
          isDialogue: true,
          voiceName: "Charon",
          text: "“Con la ayuda de nuestros amigos guaraníes hemos cruzado ríos y selvas inmensas: ¡somos los primeros viajeros europeos en recorrer la tierra del Paraguay!”",
          durationSeconds: 7.8,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Así relata Blas Garay que Alejo García descubrió el Paraguay por tierra hacia 1524, antes de morir en el viaje de regreso.",
          durationSeconds: 6.5,
          plateIndex: 0,
        },
      ],
    },
    {
      pageNumber: 3,
      sceneIdx: 2,
      sceneLabel: "ESCENA III · CAPÍTULO I",
      folioLabel: "PÁGINA I.3",
      chapterTitle: "CAPÍTULO I · DESCUBRIMIENTO DEL PARAGUAY",
      narrativeText:
        "Poco después, entre 1527 y 1528, el navegante Sebastián Gaboto desvió su viaje rumbo a Asia para explorar estos ríos. Remontó el Paraná y navegó por primera vez las aguas del río Paraguay. Al ver los adornos de plata que traían los pobladores —llegados desde el Imperio Inca por las rutas indígenas—, la región comenzó a llamarse Río de la Plata.",
      illustrationPrompt: "Sebastián Gaboto remontando el río Paraguay en caravela",
      imageCaption: "Sebastián Gaboto navega el río Paraguay (1528)",
      imageUrl: ch1P3Img,
      dioramaUrl: ch1P3Img,
      plates: [
        {
          plateNumberRoman: "III",
          plateLabel: "LÁMINA III DE III",
          title: "Navegación de Sebastián Gaboto (1527–1528)",
          illustrationPrompt: "Barco de Gaboto subiendo por el río Paraguay",
          imageUrl: ch1P3Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Tres años después, el marino Sebastián Gaboto decidió remontar los grandes ríos en barco en busca de aquel camino interior.",
          durationSeconds: 6.8,
          plateIndex: 0,
        },
        {
          speaker: "Sebastián Gaboto",
          speakerLabel: "SEBASTIÁN GABOTO (1528)",
          voiceRoleLabel: "Crónica Histórica",
          isDialogue: true,
          voiceName: "Orus",
          text: "“Hemos subido por el río Paraná y entrado en el ancho río Paraguay. Llamaremos a estas aguas el Río de la Plata por los tesoros que nos muestran sus habitantes.”",
          durationSeconds: 8.2,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "De este modo quedó unido en los mapas el descubrimiento del Paraguay: Alejo García lo halló por tierra, y Sebastián Gaboto lo exploró por agua.",
          durationSeconds: 7.4,
          plateIndex: 0,
        },
      ],
    },
  ],
};

export const PARAGUAY_CAP_2_STORYBOOK: Storybook = {
  id: "paraguay_cap_02_asuncion",
  roman: "II",
  bookHeaderLeft: "CAPÍTULO II  ·  BLAS GARAY",
  year: "1897",
  genreFooterLeft: "LA COLONIA · SECCIÓN PRIMERA",
  settingFooterRight: "ORILLAS DEL RÍO PARAGUAY",
  title: "Fundación de la Asunción",
  subtitle: "Capítulo II · La gobernación del Río de la Plata ó Paraguay",
  author: "Blas Garay",
  palette: EDITION_PALETTES.victorian.palette,
  sourceType: "classic-adaptation",
  visualStyle: VISUAL_STYLE_PRESETS[0].value,
  mood: "Fundación histórica, encuentro entre culturas y nacimiento de Asunción",
  musicPrompt: "Melodía acústica serena de guitarra criolla.",
  charSheetPrompt: "16th-century wooden fort by a river bay with explorers and Guarani neighbours",
  charSheetImageUrl: ch2Img,
  coverImagePrompt: "Casa Fuerte de Nuestra Señora de la Asunción el 15 de agosto de 1537",
  coverImageUrl: ch2Img,
  titleCardEndSec: 0.9,
  modelsUsed: DEFAULT_MODELS_USED,
  characters: [
    {
      id: "narradora",
      name: "Maestra Narradora",
      role: "Relato Histórico",
      description: "Voz docente clara y amena",
      voiceName: "Aoede",
      voiceStyle: "cálida y didáctica",
    },
    {
      id: "juan_de_salazar",
      name: "Juan de Salazar",
      role: "Fundador",
      description: "Capitán español fundador de Asunción el 15 de agosto de 1537",
      voiceName: "Orus",
      voiceStyle: "decidido y sereno",
    },
  ],
  pages: [
    {
      pageNumber: 1,
      sceneIdx: 0,
      sceneLabel: "ESCENA I · CAPÍTULO II",
      folioLabel: "PÁGINA II.1",
      chapterTitle: "CAPÍTULO II · FUNDACIÓN DE LA ASUNCIÓN",
      narrativeText:
        "Para proteger estas tierras y abrir una ruta hacia la plata, el rey de España envió en 1535 una gran expedición al mando del primer adelantado, don Pedro de Mendoza. En 1536 fundó un primer poblado llamado Buenos Aires, pero el hambre, las enfermedades y la falta de alimentos obligaron a buscar ayuda río arriba.",
      illustrationPrompt: "Expedición de Pedro de Mendoza remontando el río hacia tierras guaraníes",
      imageCaption: "La expedición de Pedro de Mendoza (1535–1536)",
      imageUrl: ch2P1Img,
      dioramaUrl: ch2P1Img,
      plates: [
        {
          plateNumberRoman: "I",
          plateLabel: "LÁMINA I DE III",
          title: "La expedición de Pedro de Mendoza (1535–1536)",
          illustrationPrompt: "Navegantes buscando abrigo río arriba",
          imageUrl: ch2P1Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "En 1535 zarpó de España una gran flota dirigida por el primer adelantado del Río de la Plata, don Pedro de Mendoza.",
          durationSeconds: 6.6,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "En 1536 levantó un primer puerto en Buenos Aires, pero las provisiones escasearon y la vida allí fue muy difícil. Por eso decidió enviar barcos hacia el norte en busca de alimentos y de una ruta segura.",
          durationSeconds: 9.8,
          plateIndex: 0,
        },
      ],
    },
    {
      pageNumber: 2,
      sceneIdx: 1,
      sceneLabel: "ESCENA II · CAPÍTULO II",
      folioLabel: "PÁGINA II.2",
      chapterTitle: "CAPÍTULO II · FUNDACIÓN DE LA ASUNCIÓN",
      narrativeText:
        "El capitán Juan de Ayolas remontó el río Paraguay hasta fundar el fuerte de Candelaria y se internó por el Chaco rumbo al Perú, pero nunca regresó. Mientras tanto, Pedro de Mendoza, muy enfermo, emprendió el regreso a España y murió en alta mar. Entonces enviaron al capitán Juan de Salazar y Espinosa en busca de Ayolas.",
      illustrationPrompt: "Juan de Salazar navegando por el río Paraguay en 1537",
      imageCaption: "En busca de Juan de Ayolas (1537)",
      imageUrl: ch2P2Img,
      dioramaUrl: ch2P2Img,
      plates: [
        {
          plateNumberRoman: "II",
          plateLabel: "LÁMINA II DE III",
          title: "Viaje de Juan de Salazar y Espinosa (1537)",
          illustrationPrompt: "Barcos españoles en la bahía del río Paraguay",
          imageUrl: ch2P2Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "El valiente Juan de Ayolas subió por el río Paraguay y se adentró hacia las tierras del oeste, dejando encargado a su compañero Domingo Martínez de Irala.",
          durationSeconds: 7.9,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Como no llegaban noticias de Ayolas y don Pedro de Mendoza había fallecido en el mar, el capitán Juan de Salazar y Espinosa remontó el río para buscarlo.",
          durationSeconds: 8.1,
          plateIndex: 0,
        },
      ],
    },
    {
      pageNumber: 3,
      sceneIdx: 2,
      sceneLabel: "ESCENA III · CAPÍTULO II",
      folioLabel: "PÁGINA II.3",
      chapterTitle: "CAPÍTULO II · FUNDACIÓN DE LA ASUNCIÓN",
      narrativeText:
        "Al bajar por el río Paraguay, Juan de Salazar llegó a una hermosa bahía habitada por los carios, un pueblo guaraní agricultor que ofreció amistad y alimentos. Allí, el 15 de agosto de 1537, Salazar levantó una casa fuerte de madera a la que llamó Nuestra Señora Santa María de la Asunción, fecha gloriosa en que nació la capital del Paraguay.",
      illustrationPrompt: "Casa Fuerte de Asunción el 15 de agosto de 1537",
      imageCaption: "Fundación de Asunción — 15 de agosto de 1537",
      imageUrl: ch2Img,
      dioramaUrl: ch2Img,
      plates: [
        {
          plateNumberRoman: "III",
          plateLabel: "LÁMINA III DE III",
          title: "Casa Fuerte de Nuestra Señora de la Asunción (1537)",
          illustrationPrompt: "Fuerte de madera junto a la bahía y encuentro con los carios",
          imageUrl: ch2Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Juan de Salazar",
          speakerLabel: "JUAN DE SALAZAR (15 DE AGOSTO DE 1537)",
          voiceRoleLabel: "Crónica Histórica",
          isDialogue: true,
          voiceName: "Orus",
          text: "“Esta bahía tranquila y la amistad de los carios nos brindan abrigo y alimento. Hoy, 15 de agosto de 1537, fundamos la Casa Fuerte de Nuestra Señora de la Asunción.”",
          durationSeconds: 9.0,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Así nació Asunción: no solo como un fuerte, sino como un hogar fértil donde la ayuda de los guaraníes salvó a los viajeros y dio inicio a nuestra ciudad capital.",
          durationSeconds: 8.2,
          plateIndex: 0,
        },
      ],
    },
  ],
};

export const PARAGUAY_CAP_3_STORYBOOK: Storybook = {
  id: "paraguay_cap_03_conquista",
  roman: "III",
  bookHeaderLeft: "CAPÍTULO III  ·  BLAS GARAY",
  year: "1897",
  genreFooterLeft: "LA COLONIA · SECCIÓN PRIMERA",
  settingFooterRight: "ASUNCIÓN Y EL INTERIOR",
  title: "Conquista del Paraguay",
  subtitle: "Capítulo III · La gobernación del Río de la Plata ó Paraguay",
  author: "Blas Garay",
  palette: EDITION_PALETTES.chronos.palette,
  sourceType: "classic-adaptation",
  visualStyle: VISUAL_STYLE_PRESETS[0].value,
  mood: "Organización de la ciudad, travesía de Cabeza de Vaca y gobierno de Irala",
  musicPrompt: "Música de cámara tranquila y narrativa.",
  charSheetPrompt: "16th-century explorers emerging from forest past waterfalls toward colonial Asuncion",
  charSheetImageUrl: ch3Img,
  coverImagePrompt: "Cabeza de Vaca llegando por tierra a Asunción en 1542",
  coverImageUrl: ch3Img,
  titleCardEndSec: 0.9,
  modelsUsed: DEFAULT_MODELS_USED,
  characters: [
    {
      id: "narradora",
      name: "Maestra Narradora",
      role: "Relato Histórico",
      description: "Voz docente clara",
      voiceName: "Aoede",
      voiceStyle: "cálida y clara",
    },
    {
      id: "irala",
      name: "Domingo Martínez de Irala",
      role: "Gobernador",
      description: "Organizador de Asunción como centro de la conquista",
      voiceName: "Charon",
      voiceStyle: "firme y reflexivo",
    },
    {
      id: "cabeza_de_vaca",
      name: "Cabeza de Vaca",
      role: "Segundo Adelantado",
      description: "Explorador que caminó desde Santa Catalina hasta Asunción",
      voiceName: "Fenrir",
      voiceStyle: "viajero experimentado",
    },
  ],
  pages: [
    {
      pageNumber: 1,
      sceneIdx: 0,
      sceneLabel: "ESCENA I · CAPÍTULO III",
      folioLabel: "PÁGINA III.1",
      chapterTitle: "CAPÍTULO III · CONQUISTA DEL PARAGUAY",
      narrativeText:
        "Al confirmarse que Juan de Ayolas había fallecido, los conquistadores eligieron como gobernador a Domingo Martínez de Irala. En 1541, Irala tomó una decisión muy importante: despoblar la lejana Buenos Aires para reunir a todos los habitantes en Asunción, creando el Cabildo para organizar las leyes y convertirla en el corazón de la conquista.",
      illustrationPrompt: "Asunción organizada con su Cabildo y casas de adobe en 1541",
      imageCaption: "Irala concentra la colonia en Asunción (1541)",
      imageUrl: ch3P1Img,
      dioramaUrl: ch3P1Img,
      plates: [
        {
          plateNumberRoman: "I",
          plateLabel: "LÁMINA I DE III",
          title: "Asunción se convierte en el centro de la provincia (1541)",
          illustrationPrompt: "Aldea temprana de Asunción junto al río",
          imageUrl: ch3P1Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Tras confirmarse la muerte de Ayolas, el capitán Domingo Martínez de Irala fue elegido para guiar la gobernación.",
          durationSeconds: 6.4,
          plateIndex: 0,
        },
        {
          speaker: "Domingo Martínez de Irala",
          speakerLabel: "DOMINGO MARTÍNEZ DE IRALA (1541)",
          voiceRoleLabel: "Crónica Histórica",
          isDialogue: true,
          voiceName: "Charon",
          text: "“En Asunción tenemos tierras fértiles, buena madera y la alianza con los guaraníes. Reuniremos aquí a toda la gente y crearemos nuestro Cabildo.”",
          durationSeconds: 8.1,
          plateIndex: 0,
        },
      ],
    },
    {
      pageNumber: 2,
      sceneIdx: 1,
      sceneLabel: "ESCENA II · CAPÍTULO III",
      folioLabel: "PÁGINA III.2",
      chapterTitle: "CAPÍTULO III · CONQUISTA DEL PARAGUAY",
      narrativeText:
        "En 1542 llegó desde España el segundo adelantado, Álvar Núñez Cabeza de Vaca. En lugar de navegar todo el camino, desembarcó en la isla de Santa Catalina y realizó una asombrosa caminata de varios meses por selvas y ríos, contemplando las imponentes cataratas del Iguazú hasta entrar en Asunción.",
      illustrationPrompt: "Cabeza de Vaca caminando por la selva junto a las cataratas del Iguazú",
      imageCaption: "La gran caminata de Cabeza de Vaca (1542)",
      imageUrl: ch3Img,
      dioramaUrl: ch3Img,
      plates: [
        {
          plateNumberRoman: "II",
          plateLabel: "LÁMINA II DE III",
          title: "La travesía de Álvar Núñez Cabeza de Vaca (1542)",
          illustrationPrompt: "Exploradores pasando frente a las cataratas rumbo a Asunción",
          imageUrl: ch3Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "En 1542 llegó el segundo adelantado, Álvar Núñez Cabeza de Vaca, famoso por su increíble viaje a pie desde las costas del Atlántico.",
          durationSeconds: 7.1,
          plateIndex: 0,
        },
        {
          speaker: "Cabeza de Vaca",
          speakerLabel: "CABEZA DE VACA (1542)",
          voiceRoleLabel: "Crónica Histórica",
          isDialogue: true,
          voiceName: "Fenrir",
          text: "“Atravesamos bosques espesos y vimos saltar las aguas gigantes del Iguazú sin perder un solo compañero, hasta divisar los techos de Asunción.”",
          durationSeconds: 7.9,
          plateIndex: 0,
        },
      ],
    },
    {
      pageNumber: 3,
      sceneIdx: 2,
      sceneLabel: "ESCENA III · CAPÍTULO III",
      folioLabel: "PÁGINA III.3",
      chapterTitle: "CAPÍTULO III · CONQUISTA DEL PARAGUAY",
      narrativeText:
        "Sin embargo, pronto surgieron desacuerdos entre Cabeza de Vaca y los colonos acostumbrados a las normas de Asunción. En 1544 fue destituido y enviado de vuelta a España, e Irala volvió al gobierno. En esos años se consolidó la unión familiar entre españoles y guaraníes, dando nacimiento al pueblo mestizo paraguayo.",
      illustrationPrompt: "Pueblo de Asunción creciendo en paz y mestizaje",
      imageCaption: "El gobierno de Irala y el origen del mestizaje (1544)",
      imageUrl: ch3P3Img,
      dioramaUrl: ch3P3Img,
      plates: [
        {
          plateNumberRoman: "III",
          plateLabel: "LÁMINA III DE III",
          title: "Unión hispano-guaraní en la temprana Asunción (1544)",
          illustrationPrompt: "Casas blancas de Asunción junto al río",
          imageUrl: ch3P3Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Las diferencias sobre cómo gobernar llevaron en 1544 a la destitución de Cabeza de Vaca y al regreso de Domingo Martínez de Irala al mando.",
          durationSeconds: 7.4,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Como explica Blas Garay, en estos años las familias españolas y guaraníes se unieron mediante alianzas y matrimonios, formando el mestizaje que dio identidad y lengua propia al Paraguay.",
          durationSeconds: 9.2,
          plateIndex: 0,
        },
      ],
    },
  ],
};

export const PARAGUAY_CAP_4_STORYBOOK: Storybook = {
  id: "paraguay_cap_04_madre_ciudades",
  roman: "IV",
  bookHeaderLeft: "CAPÍTULO IV  ·  BLAS GARAY",
  year: "1897",
  genreFooterLeft: "LA COLONIA · SECCIÓN PRIMERA",
  settingFooterRight: "ASUNCIÓN, MADRE DE CIUDADES",
  title: "Conquista del Paraguay (continuación)",
  subtitle: "Capítulo IV · La gobernación del Río de la Plata ó Paraguay",
  author: "Blas Garay",
  palette: EDITION_PALETTES.wonderland.palette,
  sourceType: "classic-adaptation",
  visualStyle: VISUAL_STYLE_PRESETS[0].value,
  mood: "Expansión territorial, fundación de ciudades y gobierno de Hernandarias",
  musicPrompt: "Tema acústico alegre de viaje fluvial.",
  charSheetPrompt: "Riverboats departing colonial Asuncion port along silver rivers",
  charSheetImageUrl: ch4Img,
  coverImagePrompt: "Puerto de Asunción enviando expediciones fundadoras — Madre de Ciudades",
  coverImageUrl: ch4Img,
  titleCardEndSec: 0.9,
  modelsUsed: DEFAULT_MODELS_USED,
  characters: [
    {
      id: "narradora",
      name: "Maestra Narradora",
      role: "Relato Histórico",
      description: "Voz docente clara",
      voiceName: "Aoede",
      voiceStyle: "cálida y clara",
    },
    {
      id: "hernandarias",
      name: "Hernandarias",
      role: "Gobernador Criollo",
      description: "Primer gobernador nacido en Asunción",
      voiceName: "Charon",
      voiceStyle: "noble y prudente",
    },
  ],
  pages: [
    {
      pageNumber: 1,
      sceneIdx: 0,
      sceneLabel: "ESCENA I · CAPÍTULO IV",
      folioLabel: "PÁGINA IV.1",
      chapterTitle: "CAPÍTULO IV · CONQUISTA DEL PARAGUAY (CONTINUACIÓN)",
      narrativeText:
        "En los últimos años de su gobierno, Irala organizó el trabajo de la tierra y envió capitanes a fundar nuevas poblaciones para resguardar la provincia: nacieron así Ontiveros y Ciudad Real en la región del Guairá, mientras el capitán Ñuflo de Chaves marchaba hacia el noroeste y fundaba Santa Cruz de la Sierra.",
      illustrationPrompt: "Barcos saliendo de Asunción hacia nuevas tierras del Guairá y el norte",
      imageCaption: "Nuevas fundaciones en el Guairá y el Norte",
      imageUrl: ch4P1Img,
      dioramaUrl: ch4P1Img,
      plates: [
        {
          plateNumberRoman: "I",
          plateLabel: "LÁMINA I DE III",
          title: "Nuevas fundaciones en el Guairá y Santa Cruz de la Sierra",
          illustrationPrompt: "Expediciones hacia el Guairá y el norte",
          imageUrl: ch4P1Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Antes de morir en 1556, Domingo Martínez de Irala impulsó la creación de nuevos pueblos hacia el este, en el Guairá, como Ontiveros y Ciudad Real.",
          durationSeconds: 7.6,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Al mismo tiempo, el capitán Ñuflo de Chaves partió hacia el norte y fundó Santa Cruz de la Sierra, llevando el nombre y la gente de Asunción muy lejos.",
          durationSeconds: 7.8,
          plateIndex: 0,
        },
      ],
    },
    {
      pageNumber: 2,
      sceneIdx: 1,
      sceneLabel: "ESCENA II · CAPÍTULO IV",
      folioLabel: "PÁGINA IV.2",
      chapterTitle: "CAPÍTULO IV · CONQUISTA DEL PARAGUAY (CONTINUACIÓN)",
      narrativeText:
        "Después de Irala, aunque hubo luchas políticas entre sus sucesores, Asunción siguió enviando expediciones formadas en su mayoría por jóvenes nacidos en la tierra, llamados «mancebos de la tierra». Con ellos, Juan de Garay fundó Santa Fe en 1573 y refundó Buenos Aires en 1580, ganando Asunción el hermoso título de «Madre de Ciudades».",
      illustrationPrompt: "Veleros partiendo de Asunción hacia Santa Fe y Buenos Aires",
      imageCaption: "Asunción, «Madre de Ciudades» (1573–1580)",
      imageUrl: ch4Img,
      dioramaUrl: ch4Img,
      plates: [
        {
          plateNumberRoman: "II",
          plateLabel: "LÁMINA II DE III",
          title: "Asunción, Madre de Ciudades (Santa Fe 1573 · Buenos Aires 1580)",
          illustrationPrompt: "Embarcaciones coloniales partiendo por el río",
          imageUrl: ch4Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "De Asunción salieron también los «mancebos de la tierra», hijos de españoles y madres guaraníes, que conocían los ríos mejor que nadie.",
          durationSeconds: 7.0,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Junto al capitán Juan de Garay fundaron Santa Fe en 1573 y volvieron a fundar Buenos Aires en 1580, además de Villa Rica y Concepción del Bermejo. Por eso Asunción es llamada «Madre de Ciudades».",
          durationSeconds: 9.8,
          plateIndex: 0,
        },
      ],
    },
    {
      pageNumber: 3,
      sceneIdx: 2,
      sceneLabel: "ESCENA III · CAPÍTULO IV",
      folioLabel: "PÁGINA IV.3",
      chapterTitle: "CAPÍTULO IV · CONQUISTA DEL PARAGUAY (CONTINUACIÓN)",
      narrativeText:
        "Hacia fines del siglo XVI sobresalió Hernando Arias de Saavedra, conocido como Hernandarias, el primer gobernador criollo nacido en Asunción. Gobernó con honradez y defendió la provincia hasta que en 1617 el rey dividió el inmenso territorio en dos gobernaciones separadas: la del Paraguay (o Guairá) y la de Buenos Aires.",
      illustrationPrompt: "El gobernador criollo Hernandarias y la división de 1617",
      imageCaption: "Hernandarias y la división de 1617",
      imageUrl: ch4P3Img,
      dioramaUrl: ch4P3Img,
      plates: [
        {
          plateNumberRoman: "III",
          plateLabel: "LÁMINA III DE III",
          title: "Hernandarias y la división territorial de 1617",
          illustrationPrompt: "Hernandarias observando el mapa del Paraguay y Río de la Plata",
          imageUrl: ch4P3Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Hernandarias",
          speakerLabel: "HERNANDARIAS (GOBERNADOR CRIOLLO)",
          voiceRoleLabel: "Crónica Histórica",
          isDialogue: true,
          voiceName: "Charon",
          text: "“Como hijo nacido en Asunción, mi deber es cuidar a los pueblos indígenas, impulsar las escuelas y proteger nuestras fronteras.”",
          durationSeconds: 7.4,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "En 1617 la corona española dividió aquella enorme región en dos gobernaciones: Buenos Aires al sur y la Gobernación del Paraguay al norte, dejando al Paraguay sin salida directa al mar.",
          durationSeconds: 9.4,
          plateIndex: 0,
        },
      ],
    },
  ],
};

export const PARAGUAY_CAP_5_STORYBOOK: Storybook = {
  id: "paraguay_cap_05_misiones",
  roman: "V",
  bookHeaderLeft: "CAPÍTULO V  ·  BLAS GARAY",
  year: "1897",
  genreFooterLeft: "LA COLONIA · SECCIÓN PRIMERA",
  settingFooterRight: "REDUCCIONES DEL PARANÁ Y URUGUAY",
  title: "Las Misiones Jesuíticas",
  subtitle: "Capítulo V · La gobernación del Río de la Plata ó Paraguay",
  author: "Blas Garay",
  palette: EDITION_PALETTES.americana.palette,
  sourceType: "classic-adaptation",
  visualStyle: VISUAL_STYLE_PRESETS[0].value,
  mood: "Armonía arquitectónica, música, trabajo comunitario y legado misionero",
  musicPrompt: "Violín y arpa barroca suave al estilo de las misiones guaraníes.",
  charSheetPrompt: "Guarani Jesuit mission plaza with red sandstone arches and young musicians",
  charSheetImageUrl: ch5Img,
  coverImagePrompt: "Reducción jesuítica guaraní con arcos de piedra roja, naranjos y músicos",
  coverImageUrl: ch5Img,
  titleCardEndSec: 0.9,
  modelsUsed: DEFAULT_MODELS_USED,
  characters: [
    {
      id: "narradora",
      name: "Maestra Narradora",
      role: "Relato Histórico",
      description: "Voz docente clara",
      voiceName: "Aoede",
      voiceStyle: "cálida y clara",
    },
    {
      id: "musico_guarani",
      name: "Joven Músico Guaraní",
      role: "Testigo de la Misión",
      description: "Aprendiz de violín y arpa en las reducciones",
      voiceName: "Leda",
      voiceStyle: "alegre y curiosa",
    },
  ],
  pages: [
    {
      pageNumber: 1,
      sceneIdx: 0,
      sceneLabel: "ESCENA I · CAPÍTULO V",
      folioLabel: "PÁGINA V.1",
      chapterTitle: "CAPÍTULO V · LAS MISIONES JESUÍTICAS",
      narrativeText:
        "A comienzos del siglo XVII, a pedido del gobernador Hernandarias, llegaron los sacerdotes de la Compañía de Jesús para enseñar y reunir a los pueblos guaraníes en pueblos especiales llamados «reducciones» o misiones, ubicados principalmente junto a los grandes ríos Paraná y Uruguay.",
      illustrationPrompt: "Plaza central de una misión jesuítica con iglesia de piedra roja",
      imageCaption: "El nacimiento de las reducciones guaraníes (siglo XVII)",
      imageUrl: ch5P1Img,
      dioramaUrl: ch5P1Img,
      plates: [
        {
          plateNumberRoman: "I",
          plateLabel: "LÁMINA I DE III",
          title: "Los pueblos de las Misiones Jesuíticas",
          illustrationPrompt: "Arcos de piedra roja, plaza amplia e iglesia misionera",
          imageUrl: ch5P1Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "A principios del siglo XVII llegaron al Paraguay los padres jesuitas, invitados por Hernandarias para fundar pueblos protegidos donde vivirían los guaraníes.",
          durationSeconds: 7.6,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Estos pueblos se llamaron «reducciones» o misiones. En ellas los indígenas no eran entregados al trabajo forzado, conservaban su idioma guaraní y aprendían oficios nuevos.",
          durationSeconds: 8.6,
          plateIndex: 0,
        },
      ],
    },
    {
      pageNumber: 2,
      sceneIdx: 1,
      sceneLabel: "ESCENA II · CAPÍTULO V",
      folioLabel: "PÁGINA V.2",
      chapterTitle: "CAPÍTULO V · LAS MISIONES JESUÍTICAS",
      narrativeText:
        "Cada misión tenía una gran plaza, una hermosa iglesia de piedra tallada, talleres de carpintería, escultura, imprenta y música. Las familias cultivaban sus propias tierras (Tavambaé) y también tierras comunitarias (Tupambaé) para ayudar a los ancianos y enfermos. Además, supieron defender sus pueblos de los ataques bandeirantes, como en la recordada batalla de Mbororé en 1641.",
      illustrationPrompt: "Niños guaraníes tocando violines y arpa en la plaza de la misión",
      imageCaption: "Arte, música y trabajo comunitario en las misiones",
      imageUrl: ch5Img,
      dioramaUrl: ch5Img,
      plates: [
        {
          plateNumberRoman: "II",
          plateLabel: "LÁMINA II DE III",
          title: "Música, talleres y vida comunitaria guaraní",
          illustrationPrompt: "Jóvenes músicos tocando violines y arpa bajo los naranjos",
          imageUrl: ch5Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Joven Músico Guaraní",
          speakerLabel: "APRENDIZ EN LA MISIÓN",
          voiceRoleLabel: "Escena Escolar",
          isDialogue: true,
          voiceName: "Leda",
          text: "“Por la mañana cultivamos yerba mate y maíz en las tierras comunes, y por la tarde ensayamos con violines y arpas tallados con nuestras propias manos.”",
          durationSeconds: 8.1,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Como relata Blas Garay, la disciplina y el trabajo organizado hicieron florecer la música, la arquitectura en piedra roja y hasta la primera imprenta del Río de la Plata.",
          durationSeconds: 8.4,
          plateIndex: 0,
        },
      ],
    },
    {
      pageNumber: 3,
      sceneIdx: 2,
      sceneLabel: "ESCENA III · CAPÍTULO V",
      folioLabel: "PÁGINA V.3",
      chapterTitle: "CAPÍTULO V · LAS MISIONES JESUÍTICAS",
      narrativeText:
        "Blas Garay explica que, con el paso del tiempo, las misiones crecieron tanto en comercio y autonomía que despertaron desconfianzas con la provincia del Paraguay y sufrieron conflictos de fronteras tras el Tratado de Madrid de 1750. Finalmente, en 1767, el rey Carlos III ordenó expulsar a los jesuitas de América, dejando como recuerdo eterno las majestuosas ruinas de piedra que hoy admiramos.",
      illustrationPrompt: "Iglesia y arcos de piedra roja de las misiones jesuíticas del Paraguay",
      imageCaption: "La expulsión de 1767 y el legado histórico",
      imageUrl: ch5P3Img,
      dioramaUrl: ch5P3Img,
      plates: [
        {
          plateNumberRoman: "III",
          plateLabel: "LÁMINA III DE III",
          title: "El fin de las misiones en 1767 y su legado",
          illustrationPrompt: "Plaza serena de la misión jesuítica al atardecer",
          imageUrl: ch5P3Img,
        },
      ],
      dialogueLines: [
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "Con los años surgieron fuertes discusiones sobre las fronteras y el comercio de la yerba mate, y tras el Tratado de Madrid de 1750 los pueblos misioneros debieron defender sus hogares.",
          durationSeconds: 9.0,
          plateIndex: 0,
        },
        {
          speaker: "Maestra Narradora",
          speakerLabel: "RELATO PARA LA CLASE",
          voiceRoleLabel: "Narración Histórica",
          isDialogue: false,
          voiceName: "Aoede",
          text: "En 1767 el rey Carlos III ordenó la expulsión de los jesuitas. Así concluye la Sección Primera de la obra de Blas Garay, dejándonos monumentos de piedra e historia que siguen vivos en el Paraguay.",
          durationSeconds: 9.8,
          plateIndex: 0,
        },
      ],
    },
  ],
};

export const CLASSIC_LITERATURE_PRESETS: ClassicPreset[] = [
  {
    id: PARAGUAY_CAP_1_STORYBOOK.id,
    title: PARAGUAY_CAP_1_STORYBOOK.title,
    author: "Blas Garay",
    year: "1897",
    gutenbergId: 0,
    tagline: "Capítulo I · Descubrimiento del Paraguay",
    defaultPrompt:
      "Resume de manera breve para niños de primaria el Capítulo I (Descubrimiento del Paraguay: Solís, Alejo García y Sebastián Gaboto) de la obra Breve resumen de la historia del Paraguay de Blas Garay (1897).",
    visualStyle: VISUAL_STYLE_PRESETS[0].value,
    narratorVoice: "Aoede",
    accentColor: "#4A6B53",
    palette: EDITION_PALETTES.regency.palette,
  },
];

export const INITIAL_SHOWCASE_STORYBOOK: Storybook = PARAGUAY_CAP_1_STORYBOOK;

export const ALL_CLASSIC_STORYBOOKS: Storybook[] = [
  PARAGUAY_CAP_1_STORYBOOK,
  PARAGUAY_CAP_2_STORYBOOK,
  PARAGUAY_CAP_3_STORYBOOK,
  PARAGUAY_CAP_4_STORYBOOK,
  PARAGUAY_CAP_5_STORYBOOK,
];

/**
 * Generates fine-press pen-and-ink & watercolour SVG plates
 * on warm archival paper (#F6F2EA) when creating a new classroom story
 * without an external image API key.
 */
function createFairytalePlateSvgDataUri(
  variant: "char-sheet" | "scene-1" | "scene-2" | "scene-3",
  palette: StorybookPalette,
  _caption: string
): string {
  const { paper, card, ink, accent, rule } = palette;
  let artwork = "";

  if (variant === "char-sheet") {
    artwork = `
      <ellipse cx="448" cy="430" rx="280" ry="22" fill="${card}" opacity="0.85"/>
      <g transform="translate(275, 110)">
        <ellipse cx="45" cy="315" rx="46" ry="8" fill="${rule}" opacity="0.55"/>
        <path d="M22,92 L68,92 L82,235 L14,235 Z" fill="${accent}" fill-opacity="0.28" stroke="${ink}" stroke-width="1.6"/>
        <path d="M32,92 L58,92 L62,175 L28,175 Z" fill="${card}" stroke="${ink}" stroke-width="1.3"/>
        <path d="M32,235 L30,305 M58,235 L62,305" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="46" cy="56" r="22" fill="${paper}" stroke="${ink}" stroke-width="1.6"/>
        <circle cx="54" cy="53" r="1.8" fill="${ink}"/>
      </g>
      <g transform="translate(525, 118)">
        <ellipse cx="45" cy="307" rx="52" ry="9" fill="${rule}" opacity="0.55"/>
        <path d="M24,88 L66,88 L94,298 L-4,298 Z" fill="${accent}" fill-opacity="0.18" stroke="${ink}" stroke-width="1.6"/>
        <circle cx="44" cy="52" r="21" fill="${paper}" stroke="${ink}" stroke-width="1.6"/>
        <circle cx="36" cy="50" r="1.8" fill="${ink}"/>
      </g>
    `;
  } else {
    artwork = `
      <rect x="0" y="0" width="896" height="350" fill="${paper}"/>
      <rect x="0" y="350" width="896" height="154" fill="${card}" opacity="0.65"/>
      <line x1="0" y1="350" x2="896" y2="350" stroke="${rule}" stroke-width="1.5"/>
      <path d="M90,348 Q260,295 448,320 T806,338" fill="none" stroke="${accent}" stroke-width="2" opacity="0.7"/>
      <circle cx="448" cy="145" r="78" fill="#FDFBF5" stroke="${rule}" stroke-width="1.2"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 896 504" width="896" height="504">
    <rect width="896" height="504" fill="${paper}"/>
    <line x1="448" y1="0" x2="448" y2="504" stroke="${rule}" stroke-width="1.5" opacity="0.65"/>
    ${artwork}
    <rect x="0.5" y="0.5" width="895" height="503" fill="none" stroke="${rule}" stroke-width="1"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Dynamically creates a complete 3-Folio classroom edition
 * for any user prompt when running without live Gemini sandbox output.
 */
export function createBespokeFairytaleStorybook(
  userPrompt: string,
  visualStyle: string,
  narratorVoice: string,
  paletteKey: string = "regency"
): Storybook {
  const cleanPrompt = userPrompt.trim() || FAIRYTALE_COMMISSION_PROMPTS[0].prompt;
  const matchedStarter = FAIRYTALE_COMMISSION_PROMPTS.find(
    (p) => cleanPrompt.toLowerCase().includes(p.title.toLowerCase().slice(0, 12)) || cleanPrompt === p.prompt
  );

  const pal = EDITION_PALETTES[paletteKey]?.palette || EDITION_PALETTES.regency.palette;
  const words = cleanPrompt.replace(/[^\w\s'-]/g, " ").split(/\s+/).filter(Boolean);
  const title = matchedStarter
    ? matchedStarter.title
    : words.length <= 7
    ? cleanPrompt
    : `Relato Escolar: ${words.slice(0, 4).join(" ")}`;

  const charSheetUri = createFairytalePlateSvgDataUri("char-sheet", pal, "Lámina de Personajes");
  const scene1Uri = createFairytalePlateSvgDataUri("scene-1", pal, "Escena I");
  const scene2Uri = createFairytalePlateSvgDataUri("scene-2", pal, "Escena II");
  const scene3Uri = createFairytalePlateSvgDataUri("scene-3", pal, "Escena III");

  return {
    id: `custom_${Date.now()}`,
    roman: "VI",
    bookHeaderLeft: "TOMO VI  ·  EDICIÓN PARA LA CLASE",
    year: "1897",
    genreFooterLeft: "HISTORIA DEL PARAGUAY · LECTURA ESCOLAR",
    settingFooterRight: "CUADERNO DE AULA",
    title,
    subtitle: "Relato resumido para niños",
    author: "Edición Escolar",
    palette: pal,
    sourceType: "original-story",
    visualStyle,
    mood: "Relato escolar claro e ilustrado en acuarela y tinta sepia",
    musicPrompt: "Suave guitarra acústica de aula.",
    charSheetPrompt: "Ilustración escolar sobre papel crema #F6F2EA",
    charSheetImageUrl: charSheetUri,
    coverImagePrompt: cleanPrompt,
    coverImageUrl: scene1Uri,
    totalDurationSeconds: 56,
    modelsUsed: DEFAULT_MODELS_USED,
    characters: [
      {
        id: "narradora",
        name: "Maestra Narradora",
        role: "Relato Histórico",
        description: "Narradora clara para la clase",
        voiceName: narratorVoice || "Aoede",
        voiceStyle: "cálida y didáctica",
      },
    ],
    pages: [
      {
        pageNumber: 1,
        sceneLabel: "ESCENA I",
        folioLabel: "PÁGINA VI.1",
        chapterTitle: "PRIMERA PARTE",
        narrativeText: cleanPrompt,
        illustrationPrompt: `Escena I: ${cleanPrompt}`,
        imageCaption: "Inicio del relato",
        imageUrl: scene1Uri,
        dioramaUrl: scene1Uri,
        plates: [
          {
            plateNumberRoman: "I",
            plateLabel: "LÁMINA I DE III",
            title: "Inicio del relato",
            illustrationPrompt: "Escena I",
            imageUrl: scene1Uri,
          },
        ],
        dialogueLines: [
          {
            speaker: "Maestra Narradora",
            speakerLabel: "RELATO PARA LA CLASE",
            voiceRoleLabel: "Narración Histórica",
            isDialogue: false,
            voiceName: narratorVoice || "Aoede",
            text: `Hoy leeremos juntos esta historia para nuestra clase: ${cleanPrompt}`,
            durationSeconds: 10,
          },
        ],
      },
      {
        pageNumber: 2,
        sceneLabel: "ESCENA II",
        folioLabel: "PÁGINA VI.2",
        chapterTitle: "DESARROLLO",
        narrativeText:
          "En los ríos y bosques de esta tierra se encontraron costumbres, idiomas y esfuerzos que formaron nuestra historia.",
        illustrationPrompt: `Escena II: ${cleanPrompt}`,
        imageCaption: "Desarrollo de la historia",
        imageUrl: scene2Uri,
        dioramaUrl: scene2Uri,
        plates: [
          {
            plateNumberRoman: "II",
            plateLabel: "LÁMINA II DE III",
            title: "Desarrollo de la historia",
            illustrationPrompt: "Escena II",
            imageUrl: scene2Uri,
          },
        ],
        dialogueLines: [
          {
            speaker: "Maestra Narradora",
            speakerLabel: "RELATO PARA LA CLASE",
            voiceRoleLabel: "Narración Histórica",
            isDialogue: false,
            voiceName: narratorVoice || "Aoede",
            text: "Paso a paso, los protagonistas superaron largas travesías y aprendieron a convivir junto a los grandes ríos.",
            durationSeconds: 8,
          },
        ],
      },
      {
        pageNumber: 3,
        sceneLabel: "ESCENA III",
        folioLabel: "PÁGINA VI.3",
        chapterTitle: "CIERRE",
        narrativeText:
          "Así recordamos este episodio de la historia del Paraguay para compartirlo y conversarlo en clase.",
        illustrationPrompt: `Escena III: ${cleanPrompt}`,
        imageCaption: "Reflexión final",
        imageUrl: scene3Uri,
        dioramaUrl: scene3Uri,
        plates: [
          {
            plateNumberRoman: "III",
            plateLabel: "LÁMINA III DE III",
            title: "Reflexión final",
            illustrationPrompt: "Escena III",
            imageUrl: scene3Uri,
          },
        ],
        dialogueLines: [
          {
            speaker: "Maestra Narradora",
            speakerLabel: "RELATO PARA LA CLASE",
            voiceRoleLabel: "Narración Histórica",
            isDialogue: false,
            voiceName: narratorVoice || "Aoede",
            text: "Y así queda guardada esta página en nuestro libro escolar, lista para comentarla entre todos en el aula.",
            durationSeconds: 8,
          },
        ],
      },
    ],
  };
}
