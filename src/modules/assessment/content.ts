/* ============================================================
 * Evaluaciones por plan (sección 10): evaluación semanal (Plus),
 * simulacro oficial y entrenamiento avanzado (Super).
 * Corrección por reglas; explicaciones = "corrección en tiempo real"
 * simulada (feedbackService.explainError) — sin IA externa.
 * ============================================================ */

export type Section = "Listening" | "Reading" | "Use of English" | "Vocabulary" | "Writing";

interface Base {
  id: string;
  section: Section;
  prompt: string;
  /** Texto de lectura o de audio (inglés). */
  passage?: string;
  /** Si es true, `passage` se escucha con la voz del navegador (transcripción opcional). */
  audio?: boolean;
  explanation: string;
  topic: string;
}
export interface ChoiceQ extends Base {
  kind: "choice";
  options: string[];
  answer: string;
}
export interface TextQ extends Base {
  kind: "text";
  /** Respuestas aceptadas (se comparan normalizadas). */
  accepted: string[];
  placeholder?: string;
}
export type ExamQuestion = ChoiceQ | TextQ;

export interface Exam {
  id: "weekly-exam" | "official-mock" | "advanced-training";
  title: string;
  level: string;
  intro: string;
  suggestedMinutes: number;
  xp: number;
  questions: ExamQuestion[];
}

const ch = (q: Omit<ChoiceQ, "kind">): ChoiceQ => ({ kind: "choice", ...q });
const tx = (q: Omit<TextQ, "kind">): TextQ => ({ kind: "text", ...q });

export const EXAMS: Record<Exam["id"], Exam> = {
  "weekly-exam": {
    id: "weekly-exam",
    title: "Evaluación semanal",
    level: "B1",
    intro: "10 preguntas para medir tu semana: escucha, lectura, gramática y vocabulario.",
    suggestedMinutes: 15,
    xp: 150,
    questions: [
      ch({
        id: "w1",
        section: "Listening",
        audio: true,
        passage:
          "Hi, it's Laura. The meeting is not at ten anymore. It's at eleven thirty, in room four.",
        prompt: "¿A qué hora es la reunión ahora?",
        options: ["11:30", "10:00", "10:30", "4:00"],
        answer: "11:30",
        explanation: "Laura dice “It's at eleven thirty”: once y media.",
        topic: "listening: horas",
      }),
      ch({
        id: "w2",
        section: "Listening",
        audio: true,
        passage: "I'd like to return these headphones. They stopped working after two days.",
        prompt: "¿Qué quiere hacer la persona?",
        options: [
          "Devolver unos audífonos",
          "Comprar audífonos nuevos",
          "Arreglar su teléfono",
          "Pedir un descuento",
        ],
        answer: "Devolver unos audífonos",
        explanation: "“Return” significa devolver: los audífonos dejaron de funcionar.",
        topic: "listening: compras",
      }),
      ch({
        id: "w3",
        section: "Listening",
        audio: true,
        passage:
          "Take the second street on the right, then walk past the bakery. The gym is opposite the bank.",
        prompt: "¿Dónde está el gimnasio?",
        options: [
          "Frente al banco",
          "Al lado de la panadería",
          "Detrás del banco",
          "En la primera calle",
        ],
        answer: "Frente al banco",
        explanation: "“Opposite” = enfrente de.",
        topic: "listening: direcciones",
      }),
      ch({
        id: "w4",
        section: "Reading",
        passage:
          "Tomás has worked as a nurse for six years. He enjoys helping people, but he finds the night shifts tiring. Next year he wants to study to become a paramedic.",
        prompt: "What does Tomás find difficult?",
        options: ["Night shifts", "Helping people", "Studying", "His colleagues"],
        answer: "Night shifts",
        explanation: "El texto dice “he finds the night shifts tiring”.",
        topic: "reading: detalle",
      }),
      ch({
        id: "w5",
        section: "Reading",
        passage:
          "The library will close early on Friday because of a staff training day. Online services, however, will be available as usual.",
        prompt: "On Friday…",
        options: [
          "you can still use online services",
          "the library is closed all day",
          "online services stop",
          "there is a free class",
        ],
        answer: "you can still use online services",
        explanation: "“However … available as usual”: los servicios en línea siguen.",
        topic: "reading: conectores",
      }),
      ch({
        id: "w6",
        section: "Reading",
        passage:
          "Many teenagers say they check their phones more than fifty times a day. Experts suggest turning off notifications to concentrate better.",
        prompt: "What do experts recommend?",
        options: [
          "Turning off notifications",
          "Buying a new phone",
          "Checking the phone more",
          "Using more apps",
        ],
        answer: "Turning off notifications",
        explanation: "“Experts suggest turning off notifications”.",
        topic: "reading: idea principal",
      }),
      ch({
        id: "w7",
        section: "Use of English",
        prompt: "I ___ never been to Cartagena.",
        options: ["have", "has", "am", "did"],
        answer: "have",
        explanation: "Present perfect con I: “I have never been…”.",
        topic: "present perfect",
      }),
      ch({
        id: "w8",
        section: "Use of English",
        prompt: "If it rains tomorrow, we ___ at home.",
        options: ["will stay", "would stay", "stayed", "stay to"],
        answer: "will stay",
        explanation: "Primer condicional: if + presente, will + verbo.",
        topic: "primer condicional",
      }),
      ch({
        id: "w9",
        section: "Vocabulary",
        prompt: "Can you ___ me a favour?",
        options: ["do", "make", "give", "take"],
        answer: "do",
        explanation: "La colocación correcta es “do someone a favour”.",
        topic: "colocaciones do/make",
      }),
      ch({
        id: "w10",
        section: "Vocabulary",
        prompt: "The opposite of “expensive” is…",
        options: ["cheap", "rich", "cold", "short"],
        answer: "cheap",
        explanation: "Expensive (caro) ↔ cheap (barato).",
        topic: "vocabulario: opuestos",
      }),
    ],
  },
  "official-mock": {
    id: "official-mock",
    title: "Simulacro oficial",
    level: "B2–C1",
    intro:
      "Formato tipo examen oficial (Cambridge/IELTS): escucha, lectura y Use of English con transformaciones.",
    suggestedMinutes: 25,
    xp: 200,
    questions: [
      ch({
        id: "m1",
        section: "Listening",
        audio: true,
        passage:
          "Although the results were promising, the team decided to postpone the launch until further tests had been carried out.",
        prompt: "What did the team decide?",
        options: [
          "To delay the launch",
          "To launch immediately",
          "To cancel the project",
          "To change the team",
        ],
        answer: "To delay the launch",
        explanation: "“Postpone” = aplazar, retrasar.",
        topic: "listening: inferencia",
      }),
      ch({
        id: "m2",
        section: "Listening",
        audio: true,
        passage:
          "Frankly, I'd rather we invested in training our own staff than kept hiring external consultants.",
        prompt: "What is the speaker's opinion?",
        options: [
          "Train current staff",
          "Hire more consultants",
          "Reduce training",
          "Keep things as they are",
        ],
        answer: "Train current staff",
        explanation: "“I'd rather we invested in training our own staff”.",
        topic: "listening: actitud del hablante",
      }),
      ch({
        id: "m3",
        section: "Listening",
        audio: true,
        passage:
          "Not only did the new policy cut costs, but it also improved employee satisfaction.",
        prompt: "The policy…",
        options: [
          "had two positive effects",
          "only cut costs",
          "reduced satisfaction",
          "was rejected",
        ],
        answer: "had two positive effects",
        explanation: "“Not only … but also” suma dos efectos positivos.",
        topic: "inversión: not only",
      }),
      ch({
        id: "m4",
        section: "Reading",
        passage:
          "Remote work was once seen as a perk; today it is increasingly regarded as a standard expectation. Yet critics argue that spontaneous collaboration, which often sparks innovation, is hard to replicate online.",
        prompt: "What concern do critics raise?",
        options: [
          "Spontaneous collaboration is harder online",
          "Remote work is too expensive",
          "Employees dislike working from home",
          "Innovation is no longer necessary",
        ],
        answer: "Spontaneous collaboration is harder online",
        explanation: "“Spontaneous collaboration … is hard to replicate online”.",
        topic: "reading: argumento",
      }),
      ch({
        id: "m5",
        section: "Reading",
        passage:
          "The author's tone throughout the article is cautiously optimistic: while acknowledging the risks of artificial intelligence, she highlights its potential to transform healthcare.",
        prompt: "The author's tone is…",
        options: ["hopeful but careful", "completely negative", "neutral and indifferent", "angry"],
        answer: "hopeful but careful",
        explanation: "“Cautiously optimistic” = optimista con cautela.",
        topic: "reading: tono",
      }),
      ch({
        id: "m6",
        section: "Reading",
        passage:
          "Had the city invested in public transport a decade ago, traffic would not be so severe today.",
        prompt: "What does the sentence mean?",
        options: [
          "The city did not invest, so traffic is bad now",
          "The city invested and traffic is fine",
          "The city will invest next year",
          "Traffic was never a problem",
        ],
        answer: "The city did not invest, so traffic is bad now",
        explanation: "Condicional mixto con inversión: pasado irreal → presente.",
        topic: "condicional mixto",
      }),
      tx({
        id: "m7",
        section: "Use of English",
        prompt:
          "Reescribe usando la palabra RATHER: “I prefer to stay home tonight.” → I'd ___ home tonight.",
        accepted: ["rather stay", "i'd rather stay home tonight", "rather stay home tonight"],
        placeholder: "rather …",
        explanation: "Would rather + infinitivo sin “to”: I'd rather stay.",
        topic: "would rather",
      }),
      tx({
        id: "m8",
        section: "Use of English",
        prompt: "Pasiva: “They will announce the results tomorrow.” → The results ___ tomorrow.",
        accepted: ["will be announced", "the results will be announced tomorrow"],
        placeholder: "will be …",
        explanation: "Futuro pasivo: will be + participio.",
        topic: "voz pasiva",
      }),
      tx({
        id: "m9",
        section: "Use of English",
        prompt: "Estilo indirecto: “I am tired,” she said. → She said that she ___ tired.",
        accepted: ["was", "she said that she was tired"],
        explanation: "En estilo indirecto el presente pasa a pasado: am → was.",
        topic: "reported speech",
      }),
      tx({
        id: "m10",
        section: "Use of English",
        prompt:
          "Inversión: “I have rarely seen such a beautiful view.” → Rarely ___ such a beautiful view.",
        accepted: ["have i seen", "rarely have i seen such a beautiful view"],
        explanation: "Tras “Rarely” al inicio, se invierte: have I seen.",
        topic: "inversión",
      }),
      ch({
        id: "m11",
        section: "Vocabulary",
        prompt: "We need to ___ a decision before Friday.",
        options: ["make", "do", "take on", "get"],
        answer: "make",
        explanation: "Colocación: make a decision.",
        topic: "colocaciones",
      }),
      ch({
        id: "m12",
        section: "Vocabulary",
        prompt: "The meeting was ___ off because the manager was ill.",
        options: ["called", "put", "taken", "set"],
        answer: "called",
        explanation: "Call off = cancelar.",
        topic: "phrasal verbs",
      }),
    ],
  },
  "advanced-training": {
    id: "advanced-training",
    title: "Entrenamiento avanzado de escritura",
    level: "B2",
    intro:
      "8 retos de escritura con corrección inmediata: conectores, tiempos verbales y vocabulario avanzado.",
    suggestedMinutes: 15,
    xp: 150,
    questions: [
      tx({
        id: "t1",
        section: "Writing",
        prompt: "Une las ideas con “although”: It was raining. We went for a walk.",
        accepted: [
          "although it was raining we went for a walk",
          "we went for a walk although it was raining",
        ],
        explanation: "Although + oración completa expresa contraste.",
        topic: "conectores de contraste",
      }),
      tx({
        id: "t2",
        section: "Writing",
        prompt: "Escribe en inglés: “He vivido en Bogotá desde 2020.”",
        accepted: [
          "i have lived in bogota since 2020",
          "i've lived in bogota since 2020",
          "i have been living in bogota since 2020",
        ],
        explanation: "Present perfect + since para una acción que continúa.",
        topic: "present perfect + since",
      }),
      tx({
        id: "t3",
        section: "Writing",
        prompt: "Completa con la forma correcta: By the time we arrived, the film ___ (start).",
        accepted: ["had started", "had already started"],
        explanation: "Pasado perfecto: una acción anterior a otra en el pasado.",
        topic: "past perfect",
      }),
      tx({
        id: "t4",
        section: "Writing",
        prompt: "Escribe un sinónimo formal de “get” en: “Did you get my email?” (una palabra)",
        accepted: ["receive"],
        explanation: "En registro formal, “get” → “receive”.",
        topic: "registro formal",
      }),
      tx({
        id: "t5",
        section: "Writing",
        prompt: "Corrige el error: “She suggested me to apply for the job.”",
        accepted: [
          "she suggested that i apply for the job",
          "she suggested that i should apply for the job",
          "she suggested i apply for the job",
          "she suggested applying for the job",
        ],
        explanation:
          "Suggest no lleva objeto + to: suggest that I (should) apply / suggest applying.",
        topic: "suggest + subjuntivo",
      }),
      tx({
        id: "t6",
        section: "Writing",
        prompt: "Une con “which”: I read a book. The book changed my life.",
        accepted: ["i read a book which changed my life"],
        explanation: "Relative clause: which reemplaza a “the book”.",
        topic: "relative clauses",
      }),
      tx({
        id: "t7",
        section: "Writing",
        prompt: "Escribe el condicional (tercer tipo): If I ___ (know), I would have helped you.",
        accepted: ["had known"],
        explanation: "Tercer condicional: If + had + participio.",
        topic: "tercer condicional",
      }),
      tx({
        id: "t8",
        section: "Writing",
        prompt: "Escribe en inglés: “Sin embargo, el proyecto fue un éxito.”",
        accepted: [
          "however the project was a success",
          "however the project was successful",
          "nevertheless the project was a success",
        ],
        explanation: "However / Nevertheless al inicio, seguido de coma.",
        topic: "conectores formales",
      }),
    ],
  },
};

/** Normaliza una respuesta escrita: minúsculas, sin tildes ni puntuación, espacios simples. */
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isTextCorrect(q: TextQ, value: string): boolean {
  const v = normalizeAnswer(value);
  return q.accepted.some((a) => normalizeAnswer(a) === v);
}
