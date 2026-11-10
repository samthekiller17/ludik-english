/* ============================================================
 * Fono · Eco de Voz — banco de contenido (editable sin tocar la lógica)
 * Niveles A1, A2 y B1 × 2 misiones. Cada misión: 3 etapas.
 * ============================================================ */

export interface RepeatItem {
  kind: "repeat" | "read";
  text: string;
  es: string;
}
export interface AnswerItem {
  kind: "answer";
  question: string;
  es: string;
  /** Grupos de palabras clave: basta una de cada grupo. */
  keywords: string[][];
  sample: string;
}
export type SpeakItem = RepeatItem | AnswerItem;

export interface FonoMission {
  id: string;
  cefr: "A1" | "A2" | "B1";
  title: string;
  xp: number;
  stages: [RepeatItem[], RepeatItem[], AnswerItem[]];
}

const r = (text: string, es: string): RepeatItem => ({ kind: "repeat", text, es });
const rd = (text: string, es: string): RepeatItem => ({ kind: "read", text, es });
const a = (question: string, es: string, keywords: string[][], sample: string): AnswerItem => ({
  kind: "answer",
  question,
  es,
  keywords,
  sample,
});

export const MISSIONS: FonoMission[] = [
  {
    id: "A1-1",
    cefr: "A1",
    title: "Hola, ¿cómo estás?",
    xp: 50,
    stages: [
      [
        r("Hello, my name is Ana.", "Hola, me llamo Ana."),
        r("How are you today?", "¿Cómo estás hoy?"),
        r("I am fine, thank you.", "Estoy bien, gracias."),
      ],
      [rd("Nice to meet you.", "Mucho gusto."), rd("I am from Colombia.", "Soy de Colombia.")],
      [
        a(
          "What is your name?",
          "¿Cómo te llamas?",
          [["my name", "i am", "name"]],
          "My name is Carlos.",
        ),
        a("Where are you from?", "¿De dónde eres?", [["from", "live"]], "I am from Medellín."),
      ],
    ],
  },
  {
    id: "A1-2",
    cefr: "A1",
    title: "Mi familia",
    xp: 50,
    stages: [
      [
        r("This is my mother.", "Esta es mi mamá."),
        r("I have two brothers.", "Tengo dos hermanos."),
        r("My father is a teacher.", "Mi papá es profesor."),
      ],
      [
        rd("We live in a small house.", "Vivimos en una casa pequeña."),
        rd("My sister has a cat.", "Mi hermana tiene un gato."),
      ],
      [
        a(
          "Do you have brothers or sisters?",
          "¿Tienes hermanos o hermanas?",
          [["yes", "no", "have", "brother", "sister"]],
          "Yes, I have one sister.",
        ),
        a(
          "Who do you live with?",
          "¿Con quién vives?",
          [["live", "with", "mother", "father", "family", "alone"]],
          "I live with my family.",
        ),
      ],
    ],
  },
  {
    id: "A2-1",
    cefr: "A2",
    title: "De compras",
    xp: 70,
    stages: [
      [
        r("How much is this shirt?", "¿Cuánto cuesta esta camisa?"),
        r("Can I try it on, please?", "¿Me la puedo probar, por favor?"),
        r("I would like a bigger size.", "Quisiera una talla más grande."),
      ],
      [
        rd("These shoes are cheaper than those.", "Estos zapatos son más baratos que esos."),
        rd("I bought a new jacket yesterday.", "Ayer compré una chaqueta nueva."),
      ],
      [
        a(
          "What did you buy last weekend?",
          "¿Qué compraste el fin de semana pasado?",
          [["bought", "buy", "nothing", "didn't"]],
          "I bought some fruit and a book.",
        ),
        a(
          "Do you prefer shopping online or in a store?",
          "¿Prefieres comprar por internet o en una tienda?",
          [
            ["online", "store", "shop", "internet"],
            ["prefer", "like", "because"],
          ],
          "I prefer online because it is faster.",
        ),
      ],
    ],
  },
  {
    id: "A2-2",
    cefr: "A2",
    title: "Pidiendo direcciones",
    xp: 70,
    stages: [
      [
        r("Excuse me, where is the bus station?", "Disculpe, ¿dónde está la estación de bus?"),
        r("Go straight and turn left.", "Siga derecho y gire a la izquierda."),
        r("It is next to the bank.", "Está al lado del banco."),
      ],
      [
        rd("The museum is three blocks from here.", "El museo está a tres cuadras de aquí."),
        rd("Is there a pharmacy near here?", "¿Hay una farmacia cerca de aquí?"),
      ],
      [
        a(
          "How do you go to school or work?",
          "¿Cómo vas al colegio o al trabajo?",
          [["bus", "walk", "car", "bike", "metro", "taxi", "go"]],
          "I go by bus.",
        ),
        a(
          "What is near your house?",
          "¿Qué hay cerca de tu casa?",
          [["near", "next", "there is", "there are", "park", "store", "school"]],
          "There is a park near my house.",
        ),
      ],
    ],
  },
  {
    id: "B1-1",
    cefr: "B1",
    title: "Una entrevista",
    xp: 90,
    stages: [
      [
        r("I have worked here for three years.", "He trabajado aquí durante tres años."),
        r(
          "I think I would be a good fit for this team.",
          "Creo que encajaría bien en este equipo.",
        ),
        r("My biggest strength is solving problems.", "Mi mayor fortaleza es resolver problemas."),
      ],
      [
        rd(
          "If I get this job, I will learn as much as I can.",
          "Si consigo este trabajo, aprenderé todo lo que pueda.",
        ),
        rd("I should improve my time management.", "Debería mejorar mi manejo del tiempo."),
      ],
      [
        a(
          "Why do you want this job?",
          "¿Por qué quieres este trabajo?",
          [
            ["because", "want", "would like"],
            ["learn", "grow", "experience", "team", "company", "skills"],
          ],
          "Because I want to learn and grow with this team.",
        ),
        a(
          "What have you learned recently?",
          "¿Qué has aprendido recientemente?",
          [["have learned", "learned", "learnt", "i've"]],
          "I have learned how to use a new program.",
        ),
      ],
    ],
  },
  {
    id: "B1-2",
    cefr: "B1",
    title: "Contando una historia",
    xp: 90,
    stages: [
      [
        r("Last summer, we travelled to the coast.", "El verano pasado viajamos a la costa."),
        r("While we were walking, it started to rain.", "Mientras caminábamos, empezó a llover."),
        r("In the end, everything was fine.", "Al final, todo salió bien."),
      ],
      [
        rd(
          "I had never seen the ocean before that trip.",
          "Nunca había visto el océano antes de ese viaje.",
        ),
        rd(
          "Although it was cold, we enjoyed the weekend.",
          "Aunque hacía frío, disfrutamos el fin de semana.",
        ),
      ],
      [
        a(
          "Tell me about a trip you remember.",
          "Cuéntame de un viaje que recuerdes.",
          [["went", "travelled", "traveled", "visited", "was"]],
          "Two years ago I went to Cartagena with my friends.",
        ),
        a(
          "What happened on your best day this year?",
          "¿Qué pasó en tu mejor día de este año?",
          [["was", "had", "went", "got", "won", "met"]],
          "I got my first job and I celebrated with my family.",
        ),
      ],
    ],
  },
];

export const STAGE_LABELS = [
  "Escucha y repite",
  "Lee en voz alta",
  "Responde en voz alta",
] as const;
