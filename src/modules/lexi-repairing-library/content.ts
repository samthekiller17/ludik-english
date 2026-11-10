// Banco editable: lecturas, comprensión y gramática por misión.
export type Question = {
  kind: "choice" | "sentence" | "error";
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
  wrongWord?: number;
};
export type Mission = {
  id: string;
  title: string;
  cefr: string;
  xp: number;
  text: string[];
  stages: Question[][];
};
const q = (
  prompt: string,
  answer: string,
  distractors: string[],
  explanation: string,
  topic: string,
): Question => ({
  kind: "choice",
  prompt,
  answer,
  options: [answer, ...distractors],
  explanation,
  topic,
});
const e = (
  prompt: string,
  wrongWord: number,
  answer: string,
  distractors: string[],
  explanation: string,
  topic: string,
): Question => ({
  ...q(prompt, answer, distractors, explanation, topic),
  kind: "error",
  wrongWord,
});
const definitions: {
  id: string;
  title: string;
  text: string;
  question: string;
  answer: string;
  distractors: string[];
  claim: string;
  truth: string;
  truthWhy: string;
  evidence: string;
  sentence: number;
  extra?: Question;
}[] = [
  {
    id: "A1-1",
    title: "Mi rutina diaria",
    text: "My name is Sara. I live in Bogotá with my sister. I get up at six every morning. We eat eggs for breakfast. I walk to school with my friend Luis. After school, I read a book at home.",
    question: "Who walks to school with Sara?",
    answer: "Luis",
    distractors: ["Her sister", "Her teacher"],
    claim: "Sara gets up at seven.",
    truth: "False",
    truthWhy: "El texto dice “at six every morning”, no a las siete.",
    evidence: "What does Sara do after school?",
    sentence: 5,
  },
  {
    id: "A1-2",
    title: "La ciudad",
    text: "My town is small. There is a park near my house. The library is next to the park. I go there on Saturdays. My brother works in a café. We meet at the café on Sundays. I like my town.",
    question: "Where is the library?",
    answer: "Next to the park",
    distractors: ["Inside the café", "Near the school"],
    claim: "The café is big.",
    truth: "Not given",
    truthWhy: "El texto menciona el café, pero no dice su tamaño.",
    evidence: "When do they meet at the café?",
    sentence: 5,
  },
  {
    id: "A2-1",
    title: "Fin de semana pasado",
    text: "Last Saturday, Daniel visited his aunt in Medellín. He travelled by bus because it was cheaper than the train. They cooked lunch together and walked in a park near her flat. On Sunday, it rained, so they stayed inside and watched a film. Daniel returned home in the evening. He enjoyed the quiet weekend with his aunt.",
    question: "Why did Daniel travel by bus?",
    answer: "It was cheaper than the train",
    distractors: ["It was faster than the train", "His aunt drove the bus"],
    claim: "Daniel walked in the park on Sunday.",
    truth: "False",
    truthWhy: "Pasearon el sábado; el domingo llovió y se quedaron dentro.",
    evidence: "What did they do when it rained?",
    sentence: 3,
  },
  {
    id: "A2-2",
    title: "Comida y restaurantes",
    text: "Yesterday, Lina and her friends tried a new restaurant near the station. There were only six tables, but the room was bright and comfortable. Lina ordered vegetable soup because she was not very hungry. Her friends chose fish with rice. The soup was hotter than she expected. The waiter brought some bread, and everyone shared a delicious fruit dessert before leaving.",
    question: "Why did Lina order soup?",
    answer: "She was not very hungry",
    distractors: ["There was no fish", "It was the cheapest dish"],
    claim: "The restaurant had ten tables.",
    truth: "False",
    truthWhy: "“Only six tables” indica seis mesas, no diez.",
    evidence: "What did the waiter bring?",
    sentence: 5,
  },
  {
    id: "B1-1",
    title: "Tecnología y apps",
    text: "For three months, Mateo has used an app to organise his homework. Before he downloaded it, he often forgot important dates. Now the app sends a reminder every afternoon. Although it has helped him, he thinks students should not depend entirely on their phones. Last week, his battery died before a test, but he had written the date in a notebook too. If his friends ask for advice, he will suggest using both tools. He has never paid for the app.",
    question: "What advice would Mateo probably give?",
    answer: "Use a notebook as well as an app",
    distractors: ["Stop writing dates on paper", "Buy the most expensive app"],
    claim: "Mateo has paid for the app.",
    truth: "False",
    truthWhy: "“He has never paid” significa que nunca ha pagado.",
    evidence: "Which sentence describes the backup that helped him?",
    sentence: 4,
  },
  {
    id: "B1-2",
    title: "Deportes y salud",
    text: "Camila has played basketball since she was twelve. This year, she has started training with a local team twice a week. At first, she wanted to practise every day, but her coach explained that rest is important too. Players should drink water regularly and must wear suitable shoes during matches. Camila might join a regional competition next month, although the date is not confirmed. If she feels tired after school, she will take a short break before training. She now enjoys sport without ignoring her health.",
    question: "Why does Camila take breaks?",
    answer: "Rest helps her look after her health",
    distractors: ["Her team has stopped training", "She no longer likes basketball"],
    claim: "The competition will definitely happen next month.",
    truth: "False",
    truthWhy: "“Might” y “not confirmed” expresan posibilidad, no certeza.",
    evidence: "Which sentence gives rules and advice for players?",
    sentence: 3,
  },
  {
    id: "B2-1",
    title: "Medio ambiente",
    text: "Although the river once supplied several neighbourhoods with clean water, it has been polluted by waste from nearby factories. A volunteer group began collecting samples last year, hoping to persuade the council to act. However, officials initially argued that stricter rules would discourage investment. The volunteers published their findings, which revealed that pollution was affecting local farms as well as wildlife. If the council had listened earlier, some damage could have been prevented. A new treatment plant has now been approved, despite concerns about its cost. The group welcomes the decision but warns that technology alone will not solve the problem. It argues that transparent monitoring and enforcement are equally necessary.",
    question: "What is the main purpose of the final warning?",
    answer: "To stress that the plant is only part of the solution",
    distractors: [
      "To argue that all technology is useless",
      "To claim that pollution has already ended",
    ],
    claim: "Officials immediately supported stricter rules.",
    truth: "False",
    truthWhy: "“Initially argued” introduce su objeción inicial sobre la inversión.",
    evidence: "Which sentence describes a missed opportunity in the past?",
    sentence: 4,
  },
  {
    id: "B2-2",
    title: "Redes sociales",
    text: "When a school newspaper moved online, its editors expected social media to attract more readers. The number of followers rose quickly; however, longer articles were rarely opened. A student who managed the account suggested replacing detailed reports with short videos. Although the proposal sounded practical, other editors worried that important context would disappear. They agreed to test a mixed approach for a month. Each video was linked to a full article, and readers were invited to submit questions. The editor said that the experiment had improved discussion, despite a slight fall in views. If popularity were their only goal, they would publish sensational headlines. Instead, they measure success by the quality of readers’ responses.",
    question: "What do the editors value most?",
    answer: "Meaningful engagement rather than views alone",
    distractors: ["Increasing views at any cost", "Replacing all reports with videos"],
    claim: "Every follower read the longer articles.",
    truth: "False",
    truthWhy: "“Rarely opened” muestra que los artículos largos se abrían pocas veces.",
    evidence: "Which sentence explains what they would do with a different goal?",
    sentence: 8,
  },
  {
    id: "C1-1",
    title: "Economía y sociedad",
    text: "Rarely do debates about urban development give informal workers a substantial voice. When a city announces a new transport hub, rising property values are often presented as evidence of collective prosperity. Yet the vendors who depend on affordable space may experience that same increase as a threat to their livelihoods. A recent consultation sought to address this imbalance by inviting street traders to assess the proposed design. It was their knowledge of daily pedestrian routes that exposed weaknesses overlooked by professional planners. The resulting revisions were modest, but they challenged the assumption that expertise belongs exclusively to institutions. Had the traders been consulted earlier, the original budget might have accommodated their recommendations more easily. The council now recommends that each future project include a funded participation process. Such measures cannot eliminate competing interests; nor should participation be mistaken for universal agreement. Nevertheless, treating residents as contributors rather than obstacles may lead to decisions whose legitimacy outlasts the political cycle.",
    question: "What is the writer’s attitude to participation?",
    answer: "Supportive, while recognising its limitations",
    distractors: [
      "Uncritically enthusiastic about unanimous agreement",
      "Dismissive of residents’ practical knowledge",
    ],
    claim: "Consultation removed all conflicts between stakeholders.",
    truth: "False",
    truthWhy: "El texto aclara “cannot eliminate competing interests”.",
    evidence: "Which sentence identifies the specific contribution of the traders?",
    sentence: 4,
    extra: q(
      "What assumption does the consultation challenge?",
      "Only institutions possess useful expertise",
      ["Higher property values always harm everyone", "Professional planning is never necessary"],
      "La sexta oración cuestiona que la experiencia pertenezca solo a las instituciones.",
      "cleft sentences",
    ),
  },
  {
    id: "C1-2",
    title: "Ciencia y cultura",
    text: "A museum’s decision to display unfinished scientific models alongside celebrated paintings initially puzzled some visitors. The exhibition’s curator argued that both forms of work emerge from revision, uncertainty and selective attention, rather than from isolated flashes of genius. Not until visitors examined the notebooks did many recognise how frequently early assumptions had been abandoned. One model, whose apparent failure later informed a successful experiment, became the exhibition’s unexpected centrepiece. It was the record of discarded possibilities that made the final discovery intelligible. The curator insisted that the museum acknowledge the technicians whose contributions had previously been overlooked. Had those records not been preserved, the public would now have a narrower understanding of the research process. Critics welcomed the broader narrative, though some questioned whether artistic and scientific judgements could be compared so readily. The exhibition does not resolve that tension, nor does it claim to. Instead, it invites audiences to reconsider the cultural stories through which achievement is recognised and remembered.",
    question: "How does the writer present the exhibition?",
    answer: "As a useful challenge that leaves a tension unresolved",
    distractors: [
      "As definitive proof that art and science are identical",
      "As an unsuccessful attempt to celebrate lone geniuses",
    ],
    claim: "The exhibition claims to settle the comparison between art and science.",
    truth: "False",
    truthWhy: "“Nor does it claim to” niega que pretenda resolver esa tensión.",
    evidence: "Which sentence connects a past action to present understanding?",
    sentence: 6,
    extra: q(
      "Why is the apparently failed model significant?",
      "It reveals how discarded work can contribute to discovery",
      [
        "It proves that all failed models are valuable artworks",
        "It shows that revision is unnecessary",
      ],
      "El modelo fallido ayudó a un experimento posterior: el proceso importa.",
      "mixed conditionals",
    ),
  },
];
// Cada nivel tiene dos juegos de frases contextualizadas y objetivos explícitos.
const grammar: Record<string, [Question[], Question[]]> = {
  "A1-1": [
    [
      q("Sara ___ a student.", "is", ["are", "am"], "Con she usamos is.", "to be"),
      q(
        "She ___ to school every day.",
        "walks",
        ["walk", "walking"],
        "En presente, he/she/it añade -s.",
        "present simple",
      ),
      q(
        "She reads ___ book.",
        "a",
        ["an", "are"],
        "Book empieza con sonido consonante: a.",
        "articles",
      ),
      q(
        "Sara and Luis are friends. ___ walk together.",
        "They",
        ["He", "She"],
        "They sustituye a dos personas.",
        "pronouns",
      ),
    ],
    [
      e("Sara are happy.", 1, "is", ["am", "be"], "Con Sara (she) usamos is.", "to be"),
      e(
        "She read every day.",
        1,
        "reads",
        ["reading", "readed"],
        "La tercera persona lleva -s.",
        "present simple",
      ),
      e("Luis has an book.", 2, "a", ["are", "am"], "Book empieza por consonante.", "articles"),
    ],
  ],
  "A1-2": [
    [
      q(
        "The library ___ near the park.",
        "is",
        ["are", "am"],
        "Un lugar singular lleva is.",
        "to be",
      ),
      q(
        "My brother ___ in a café.",
        "works",
        ["work", "working"],
        "He lleva verbo con -s.",
        "present simple",
      ),
      q(
        "There is ___ old library.",
        "an",
        ["a", "are"],
        "Old empieza con sonido vocálico: an.",
        "articles",
      ),
      q(
        "My brother is kind. ___ helps me.",
        "He",
        ["They", "We"],
        "He sustituye a my brother.",
        "pronouns",
      ),
    ],
    [
      e("The park are small.", 2, "is", ["am", "be"], "The park es singular.", "to be"),
      e(
        "He work on Sundays.",
        1,
        "works",
        ["working", "worken"],
        "He requiere -s en presente.",
        "present simple",
      ),
      e("It is a old café.", 2, "an", ["are", "am"], "Antes de old usamos an.", "articles"),
    ],
  ],
  "A2-1": [
    [
      q(
        "Daniel ___ his aunt last weekend.",
        "visited",
        ["visits", "visiting"],
        "Last weekend pide pasado: visited.",
        "past simple",
      ),
      q(
        "He ___ home by bus.",
        "went",
        ["go", "goed"],
        "El pasado irregular de go es went.",
        "past simple",
      ),
      q(
        "The bus was ___ than the train.",
        "cheaper",
        ["cheap", "cheapest"],
        "Con than usamos comparativo.",
        "comparatives",
      ),
      q(
        "They stayed ___ her flat.",
        "in",
        ["on", "under"],
        "In indica dentro del apartamento.",
        "prepositions",
      ),
    ],
    [
      e(
        "He goed home yesterday.",
        1,
        "went",
        ["goes", "going"],
        "Go tiene pasado irregular: went.",
        "past simple",
      ),
      e(
        "The bus was cheap than the train.",
        3,
        "cheaper",
        ["cheapest", "cheaply"],
        "Than introduce comparación: cheaper.",
        "comparatives",
      ),
      e(
        "There was two films on TV.",
        1,
        "were",
        ["is", "be"],
        "Two films es plural: were.",
        "there is/are",
      ),
    ],
  ],
  "A2-2": [
    [
      q(
        "Lina ___ soup yesterday.",
        "ordered",
        ["orders", "ordering"],
        "Yesterday requiere pasado.",
        "past simple",
      ),
      q(
        "The waiter ___ some bread.",
        "brought",
        ["bring", "bringed"],
        "Bring tiene pasado irregular: brought.",
        "past simple",
      ),
      q(
        "The soup was ___ than the rice.",
        "hotter",
        ["hot", "hottest"],
        "Hot duplica t en el comparativo.",
        "comparatives",
      ),
      q(
        "There ___ six tables yesterday.",
        "were",
        ["was", "is"],
        "Six tables es plural en pasado.",
        "there is/are",
      ),
    ],
    [
      e(
        "Lina eat soup yesterday.",
        1,
        "ate",
        ["eats", "eating"],
        "El pasado de eat es ate.",
        "past simple",
      ),
      e(
        "There was six tables.",
        1,
        "were",
        ["is", "be"],
        "Con plural usamos were.",
        "there is/are",
      ),
      e(
        "We arrived on noon.",
        2,
        "at",
        ["in", "under"],
        "La expresión correcta es at noon.",
        "prepositions",
      ),
    ],
  ],
  "B1-1": [
    [
      q(
        "Mateo ___ used the app for three months.",
        "has",
        ["have", "is"],
        "He forma present perfect con has + participio.",
        "present perfect",
      ),
      q(
        "If his battery dies, he ___ use his notebook.",
        "will",
        ["would", "did"],
        "Primer condicional: if + presente, will + verbo.",
        "first conditional",
      ),
      q(
        "Students ___ keep a backup.",
        "should",
        ["should to", "ought"],
        "Should + verbo expresa consejo.",
        "modals",
      ),
      q(
        "He has never ___ for the app.",
        "paid",
        ["pay", "payed"],
        "El participio de pay es paid.",
        "present perfect",
      ),
      q(
        "The app ___ help, but I am not sure.",
        "might",
        ["must to", "should to"],
        "Might expresa posibilidad y lleva verbo base.",
        "modals",
      ),
    ],
    [
      e(
        "He have downloaded the app.",
        1,
        "has",
        ["is", "did"],
        "Con he usamos has.",
        "present perfect",
      ),
      e(
        "If it rains, I would stay home.",
        4,
        "will",
        ["did", "am"],
        "Condición real futura: will.",
        "first conditional",
      ),
      e(
        "You should to save your work.",
        2,
        "save",
        ["saving", "saved"],
        "Después de should no va to; aquí sustituye to por save y elimina el verbo repetido.",
        "modals",
      ),
    ],
  ],
  "B1-2": [
    [
      q(
        "Camila has played ___ she was twelve.",
        "since",
        ["for", "during"],
        "Since introduce un punto inicial.",
        "present perfect",
      ),
      q(
        "If she feels tired, she ___ rest.",
        "will",
        ["would", "did"],
        "Consecuencia futura real: will.",
        "first conditional",
      ),
      q(
        "Players ___ wear suitable shoes; it is a rule.",
        "must",
        ["might", "must to"],
        "Must expresa obligación.",
        "modals",
      ),
      q(
        "She has ___ training with a team.",
        "started",
        ["start", "starting"],
        "Has requiere participio.",
        "present perfect",
      ),
      q(
        "The date is uncertain, so she ___ compete next month.",
        "might",
        ["must to", "should to"],
        "Might expresa posibilidad.",
        "modals",
      ),
    ],
    [
      e(
        "She has play basketball for years.",
        2,
        "played",
        ["plays", "playing"],
        "Present perfect usa participio.",
        "present perfect",
      ),
      e(
        "If she rests, she would feel better.",
        4,
        "will",
        ["did", "was"],
        "Primer condicional: will + verbo base.",
        "first conditional",
      ),
      e(
        "Players must wears suitable shoes.",
        2,
        "wear",
        ["wearing", "wore"],
        "Los modales llevan verbo base.",
        "modals",
      ),
    ],
  ],
  "B2-1": [
    [
      q(
        "If the council acted, pollution ___ decrease.",
        "would",
        ["will have", "had"],
        "Segundo condicional: would + verbo.",
        "second conditional",
      ),
      q(
        "If they had listened, they ___ prevented damage.",
        "could have",
        ["could", "will have"],
        "Tercer condicional: could have + participio.",
        "third conditional",
      ),
      q(
        "The plant has ___ approved.",
        "been",
        ["being", "be"],
        "Pasiva perfecta: has been + participio.",
        "passive voice",
      ),
      q(
        "The group said the river ___ polluted.",
        "was",
        ["will", "has"],
        "Tras said, el presente pasa normalmente a pasado.",
        "reported speech",
      ),
      q(
        "The findings, ___ were published, changed policy.",
        "which",
        ["who", "what"],
        "Which retoma cosas en una relativa explicativa.",
        "relative clauses",
      ),
    ],
    [
      e(
        "If they acted, pollution will decrease.",
        4,
        "would",
        ["had", "did"],
        "Hipótesis con pasado: would.",
        "second conditional",
      ),
      e(
        "The plant was approve yesterday.",
        3,
        "approved",
        ["approving", "approves"],
        "Pasiva: be + participio.",
        "passive voice",
      ),
      e(
        "The group which members collected samples won.",
        2,
        "whose",
        ["who", "what"],
        "Whose indica posesión: sus miembros.",
        "relative clauses",
      ),
      e(
        "If they had listened, damage would be avoided then.",
        7,
        "been",
        ["being", "is"],
        "La consecuencia pasada requiere would have been; consulta la frase corregida.",
        "third conditional",
      ),
    ],
  ],
  "B2-2": [
    [
      q(
        "If views were everything, they ___ use sensational headlines.",
        "would",
        ["will", "had"],
        "Segundo condicional para una hipótesis.",
        "second conditional",
      ),
      q(
        "If they had stopped testing, they ___ lost useful feedback.",
        "would have",
        ["would", "will have"],
        "Consecuencia de una condición pasada irreal.",
        "third conditional",
      ),
      q(
        "Each video was ___ to an article.",
        "linked",
        ["link", "linking"],
        "Pasiva: was + participio.",
        "passive voice",
      ),
      q(
        "The editor said the test ___ improved discussion.",
        "had",
        ["has", "will"],
        "Reported speech: past perfect tras said.",
        "reported speech",
      ),
      q(
        "The student ___ managed the account suggested videos.",
        "who",
        ["which", "what"],
        "Who introduce una relativa sobre personas.",
        "relative clauses",
      ),
    ],
    [
      e(
        "The videos were link to articles.",
        3,
        "linked",
        ["linking", "links"],
        "La pasiva requiere participio.",
        "passive voice",
      ),
      e(
        "She said the test has worked.",
        4,
        "had",
        ["will", "is"],
        "En discurso indirecto usamos had worked.",
        "reported speech",
      ),
      e(
        "The student which wrote it is here.",
        2,
        "who",
        ["what", "whose"],
        "Para personas usamos who.",
        "relative clauses",
      ),
      e(
        "If views mattered most, they will change everything.",
        5,
        "would",
        ["had", "did"],
        "Segundo condicional: would.",
        "second conditional",
      ),
    ],
  ],
  "C1-1": [
    [
      q(
        "Rarely ___ planners consult vendors.",
        "do",
        ["are", "have"],
        "Rarely inicial exige inversión con auxiliar do en presente simple.",
        "inversion",
      ),
      q(
        "It was their experience ___ changed the plan.",
        "that",
        ["what", "whose"],
        "Cleft sentence: it was X that…",
        "cleft sentences",
      ),
      q(
        "Had they acted earlier, the city ___ better prepared now.",
        "would be",
        ["would have been", "will be"],
        "Condición pasada con resultado presente: would be now.",
        "mixed conditionals",
      ),
      q(
        "The council recommends that each project ___ residents.",
        "include",
        ["includes", "included"],
        "Subjuntivo mandativo: verbo base.",
        "subjunctive",
      ),
      q(
        "Planners must take residents’ needs ___ account.",
        "into",
        ["onto", "over"],
        "La colocación fija es take into account.",
        "collocations",
      ),
    ],
    [
      e(
        "Rarely planners consult vendors.",
        1,
        "do planners",
        ["planners do", "are planners"],
        "La expresión negativa inicial exige inversión.",
        "inversion",
      ),
      e(
        "It was the traders what identified the problem.",
        4,
        "that",
        ["whose", "where"],
        "La cleft usa that, no what.",
        "cleft sentences",
      ),
      e(
        "The council suggests that he attends.",
        5,
        "attend",
        ["attending", "attended"],
        "Subjuntivo mandativo: attend sin -s.",
        "subjunctive",
      ),
      e(
        "Had they acted earlier, costs would have been lower now.",
        7,
        "be",
        ["being", "is"],
        "Resultado presente: would be; se reemplaza have been por be.",
        "mixed conditionals",
      ),
    ],
  ],
  "C1-2": [
    [
      q(
        "Not until they read the notes ___ understand.",
        "did they",
        ["they did", "had they"],
        "Not until inicial exige inversión; understand va en forma base.",
        "inversion",
      ),
      q(
        "It was the discarded work ___ mattered.",
        "that",
        ["what", "whose"],
        "Cleft: it was X that…",
        "cleft sentences",
      ),
      q(
        "Had records disappeared, we ___ less today.",
        "would know",
        ["would have known", "will know"],
        "Condición pasada, resultado presente.",
        "mixed conditionals",
      ),
      q(
        "The curator insisted that the museum ___ the technicians.",
        "acknowledge",
        ["acknowledges", "acknowledged"],
        "Subjuntivo mandativo: verbo base tras insisted that.",
        "subjunctive",
      ),
      q(
        "The exhibition sheds light ___ scientific work.",
        "on",
        ["in", "at"],
        "La colocación es shed light on.",
        "collocations",
      ),
    ],
    [
      e(
        "Rarely visitors question these stories.",
        1,
        "do visitors",
        ["visitors do", "are visitors"],
        "Rarely inicial exige inversión.",
        "inversion",
      ),
      e(
        "It was the notebooks what revealed the process.",
        4,
        "that",
        ["whose", "where"],
        "Cleft sentence usa that.",
        "cleft sentences",
      ),
      e(
        "She insists that he acknowledges the team.",
        4,
        "acknowledge",
        ["acknowledging", "acknowledged"],
        "Subjuntivo: verbo base sin -s.",
        "subjunctive",
      ),
      e(
        "The team carried off the experiment carefully.",
        3,
        "out",
        ["over", "up"],
        "Carry out significa realizar un experimento.",
        "phrasal verbs",
      ),
    ],
  ],
};
// Correcciones de una sola palabra: toda frase queda gramatical al sustituirla.
grammar["B1-1"]?.[1].splice(
  2,
  1,
  e(
    "You should saves your work.",
    2,
    "save",
    ["saving", "saved"],
    "Después de should usamos verbo base.",
    "modals",
  ),
);
grammar["B2-1"]?.[1].splice(
  3,
  1,
  e(
    "If they had listened, damage would have be avoided.",
    7,
    "been",
    ["being", "is"],
    "Would have requiere participio: been.",
    "third conditional",
  ),
);
grammar["C1-1"]?.[1].splice(
  3,
  1,
  e(
    "Had they acted earlier, costs would are lower now.",
    6,
    "be",
    ["being", "is"],
    "Resultado presente: would be.",
    "mixed conditionals",
  ),
);
export const missions: Mission[] = definitions.map((d) => {
  const text = d.text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [];
  const bank = grammar[d.id] ?? [[], []];
  const topic = bank[0][0]?.topic ?? "present simple";
  const evidence = text[d.sentence] ?? "";
  const reading: Question[] = [
    q(d.question, d.answer, d.distractors, `El texto apoya la respuesta: ${d.answer}.`, topic),
    q(
      d.claim,
      d.truth,
      ["True", "False", "Not given"].filter((s) => s !== d.truth),
      d.truthWhy,
      topic,
    ),
    {
      kind: "sentence",
      prompt: d.evidence,
      answer: evidence,
      options: text,
      explanation: `La oración “${evidence}” responde directamente la pregunta.`,
      topic,
    },
  ];
  if (d.extra) reading.push(d.extra);
  const cefr = d.id.slice(0, 2);
  return {
    id: d.id,
    title: d.title,
    cefr,
    xp: ({ A1: 50, A2: 70, B1: 90, B2: 110, C1: 130 } as Record<string, number>)[cefr] ?? 50,
    text,
    stages: [reading, ...bank],
  };
});
