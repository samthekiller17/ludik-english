// Banco educativo: el contenido se edita sin modificar la lógica.
export interface Phrase {
  id: string;
  wrong: string;
  right: string;
  topic: string;
  explanation: string;
}
export type InkLevel = "A1" | "A2" | "B1";
const a1: Phrase[] = [
  {
    id: "A1-1",
    wrong: "She are happy.",
    right: "She is happy.",
    topic: "Verb to be",
    explanation: "Con SHE utilizamos IS, no ARE.",
  },
  {
    id: "A1-2",
    wrong: "I has a dog.",
    right: "I have a dog.",
    topic: "Present Simple",
    explanation: "Con I utilizamos HAVE.",
  },
  {
    id: "A1-3",
    wrong: "He go to school.",
    right: "He goes to school.",
    topic: "Present Simple",
    explanation: "Con HE, el verbo normalmente termina en -S en presente simple.",
  },
  {
    id: "A1-4",
    wrong: "They is my friends.",
    right: "They are my friends.",
    topic: "Verb to be",
    explanation: "Con THEY utilizamos ARE.",
  },
  {
    id: "A1-5",
    wrong: "I am 20 years.",
    right: "I am 20 years old.",
    topic: "Vocabulario",
    explanation: "Para expresar la edad utilizamos YEARS OLD.",
  },
  {
    id: "A1-6",
    wrong: "She have a cat.",
    right: "She has a cat.",
    topic: "Present Simple",
    explanation: "Con SHE utilizamos HAS.",
  },
  {
    id: "A1-7",
    wrong: "There are a book.",
    right: "There is a book.",
    topic: "There is / There are",
    explanation: "Utilizamos THERE IS para hablar de un solo objeto.",
  },
  {
    id: "A1-8",
    wrong: "He don't like coffee.",
    right: "He doesn't like coffee.",
    topic: "Present Simple",
    explanation: "Con HE utilizamos DOESN'T.",
  },
  {
    id: "A1-9",
    wrong: "I have an car.",
    right: "I have a car.",
    topic: "Articles",
    explanation: "Utilizamos A antes de CAR porque comienza con sonido consonántico.",
  },
  {
    id: "A1-10",
    wrong: "My mother are beautiful.",
    right: "My mother is beautiful.",
    topic: "Verb to be",
    explanation: "MY MOTHER es tercera persona singular.",
  },
  {
    id: "A1-11",
    wrong: "We goes to the park.",
    right: "We go to the park.",
    topic: "Present Simple",
    explanation: "Con WE utilizamos GO sin -S.",
  },
  {
    id: "A1-12",
    wrong: "He is a teacher?",
    right: "Is he a teacher?",
    topic: "Questions",
    explanation: "En preguntas con TO BE, el verbo va antes del sujeto.",
  },
  {
    id: "A1-13",
    wrong: "This are my books.",
    right: "These are my books.",
    topic: "Demonstratives",
    explanation: "Utilizamos THESE para referirnos a varios objetos cercanos.",
  },
  {
    id: "A1-14",
    wrong: "She has two childs.",
    right: "She has two children.",
    topic: "Plurals",
    explanation: "El plural irregular de CHILD es CHILDREN.",
  },
  {
    id: "A1-15",
    wrong: "I am from in Colombia.",
    right: "I am from Colombia.",
    topic: "Prepositions",
    explanation: "No necesitamos utilizar IN después de FROM en esta oración.",
  },
  {
    id: "A1-16",
    wrong: "My father work at home.",
    right: "My father works at home.",
    topic: "Present Simple",
    explanation: "Con HE o SHE agregamos -S al verbo.",
  },
  {
    id: "A1-17",
    wrong: "The dogs is big.",
    right: "The dogs are big.",
    topic: "Subject-verb agreement",
    explanation: "DOGS está en plural, por eso utilizamos ARE.",
  },
  {
    id: "A1-18",
    wrong: "This is my sister. His name is Ana.",
    right: "This is my sister. Her name is Ana.",
    topic: "Possessive adjectives",
    explanation: "HER se utiliza para indicar posesión femenina.",
  },
  {
    id: "A1-19",
    wrong: "I can to swim.",
    right: "I can swim.",
    topic: "Modal verbs",
    explanation: "Después de CAN utilizamos el verbo en su forma base, sin TO.",
  },
  {
    id: "A1-20",
    wrong: "She is in home.",
    right: "She is at home.",
    topic: "Prepositions",
    explanation: "Utilizamos AT HOME para expresar que estamos en casa.",
  },
];
const extra: Record<"A2" | "B1", readonly (readonly [string, string, string, string])[]> = {
  A2: [
    [
      "We was at the airport yesterday.",
      "We were at the airport yesterday.",
      "Past simple: be",
      "Con WE utilizamos WERE en pasado.",
    ],
    [
      "I buyed a ticket to London.",
      "I bought a ticket to London.",
      "Past simple irregular",
      "El pasado de BUY es BOUGHT.",
    ],
    [
      "The train leaves in Monday.",
      "The train leaves on Monday.",
      "Preposiciones de tiempo",
      "Antes de los días usamos ON.",
    ],
    [
      "Where you did stay last night?",
      "Where did you stay last night?",
      "Preguntas en pasado",
      "DID va antes del sujeto.",
    ],
    [
      "We are going visit the museum.",
      "We are going to visit the museum.",
      "Planes de viaje",
      "GOING TO va seguido del verbo base.",
    ],
    [
      "This suitcase is more heavy than mine.",
      "This suitcase is heavier than mine.",
      "Comparativos",
      "HEAVY cambia a HEAVIER.",
    ],
    [
      "There isn't some water in my bottle.",
      "There isn't any water in my bottle.",
      "Some y any",
      "En esta negación usamos ANY.",
    ],
    [
      "I would like booking a room.",
      "I would like to book a room.",
      "Reservas",
      "WOULD LIKE va seguido de TO y verbo base.",
    ],
    [
      "How much bags do you have?",
      "How many bags do you have?",
      "Cantidad",
      "Para objetos contables usamos HOW MANY.",
    ],
    [
      "She didn't visited the castle.",
      "She didn't visit the castle.",
      "Negación en pasado",
      "Después de DIDN'T usamos el verbo base.",
    ],
    [
      "You must to show your passport.",
      "You must show your passport.",
      "Obligaciones",
      "Después de MUST no usamos TO.",
    ],
    [
      "The hotel is next the station.",
      "The hotel is next to the station.",
      "Ubicación",
      "La expresión es NEXT TO.",
    ],
    [
      "We arrived to the airport early.",
      "We arrived at the airport early.",
      "Llegadas",
      "Usamos ARRIVE AT para el aeropuerto.",
    ],
    [
      "I have a reservation for two person.",
      "I have a reservation for two people.",
      "Plural irregular",
      "El plural habitual de PERSON es PEOPLE.",
    ],
    [
      "They are wait for the bus.",
      "They are waiting for the bus.",
      "Presente continuo",
      "Después de ARE usamos WAITING.",
    ],
    [
      "Can you tell me where is the station?",
      "Can you tell me where the station is?",
      "Preguntas indirectas",
      "En la pregunta indirecta el sujeto va antes de IS.",
    ],
    [
      "We enjoyed to travel by boat.",
      "We enjoyed traveling by boat.",
      "Verbos con gerundio",
      "Después de ENJOY usamos la forma en -ING.",
    ],
    [
      "My flight is at the morning.",
      "My flight is in the morning.",
      "Momentos del día",
      "La expresión es IN THE MORNING.",
    ],
    [
      "This is the cheaper hotel in town.",
      "This is the cheapest hotel in town.",
      "Superlativos",
      "Para destacar uno de todo el grupo usamos THE CHEAPEST.",
    ],
    [
      "I lost my passport ago two days.",
      "I lost my passport two days ago.",
      "Expresiones de pasado",
      "AGO se coloca después del período de tiempo.",
    ],
  ],
  B1: [
    [
      "I have visited Paris last summer.",
      "I visited Paris last summer.",
      "Pasado y present perfect",
      "Con un tiempo pasado terminado usamos pasado simple.",
    ],
    [
      "If it will rain, we will stay inside.",
      "If it rains, we will stay inside.",
      "Primer condicional",
      "La parte con IF lleva presente simple.",
    ],
    [
      "She has lived here since five years.",
      "She has lived here for five years.",
      "For y since",
      "FOR indica duración; SINCE indica un inicio.",
    ],
    [
      "The book was wrote by a young author.",
      "The book was written by a young author.",
      "Voz pasiva",
      "La pasiva usa el participio WRITTEN.",
    ],
    [
      "He asked me where did I work.",
      "He asked me where I worked.",
      "Estilo indirecto",
      "La pregunta indirecta mantiene el orden sujeto y verbo.",
    ],
    [
      "I used to working in a small shop.",
      "I used to work in a small shop.",
      "Hábitos pasados",
      "USED TO va seguido del verbo base.",
    ],
    [
      "Although it was cold, but we went outside.",
      "Although it was cold, we went outside.",
      "Conectores",
      "No combinamos ALTHOUGH y BUT en esta estructura.",
    ],
    [
      "You should have tell me earlier.",
      "You should have told me earlier.",
      "Consejos sobre el pasado",
      "Después de SHOULD HAVE usamos participio.",
    ],
    [
      "This is the restaurant which we met.",
      "This is the restaurant where we met.",
      "Oraciones relativas",
      "WHERE indica el lugar en el que nos conocimos.",
    ],
    [
      "I am interested in learn photography.",
      "I am interested in learning photography.",
      "Gerundios",
      "Después de IN usamos LEARNING.",
    ],
    [
      "She suggested to take the earlier train.",
      "She suggested taking the earlier train.",
      "Sugerencias",
      "SUGGEST va seguido de gerundio.",
    ],
    [
      "By the time we arrived, the film has started.",
      "By the time we arrived, the film had started.",
      "Past perfect",
      "HAD STARTED indica lo que ocurrió antes de otra acción pasada.",
    ],
    [
      "If I had more time, I will learn French.",
      "If I had more time, I would learn French.",
      "Segundo condicional",
      "Para una situación hipotética usamos WOULD.",
    ],
    [
      "There is too many traffic in the city.",
      "There is too much traffic in the city.",
      "Nombres incontables",
      "TRAFFIC es incontable: usamos MUCH.",
    ],
    [
      "He made me to laugh during the lesson.",
      "He made me laugh during the lesson.",
      "Causativos",
      "Después de MADE ME usamos el verbo sin TO.",
    ],
    [
      "Neither of the answers are correct.",
      "Neither of the answers is correct.",
      "Concordancia",
      "En esta estructura formal NEITHER lleva IS.",
    ],
    [
      "I look forward to hear from you.",
      "I look forward to hearing from you.",
      "Expresiones con gerundio",
      "LOOK FORWARD TO va seguido de gerundio.",
    ],
    [
      "The meeting has postponed until Friday.",
      "The meeting has been postponed until Friday.",
      "Pasiva en present perfect",
      "La pasiva requiere HAS BEEN y participio.",
    ],
    [
      "Despite of the rain, we finished the race.",
      "Despite the rain, we finished the race.",
      "Concesión",
      "DESPITE se usa sin OF.",
    ],
    [
      "She told that she was feeling better.",
      "She said that she was feeling better.",
      "Say y tell",
      "Sin objeto personal utilizamos SAID; TOLD requiere a quién.",
    ],
  ],
};
export const BANKS: Record<InkLevel, Phrase[]> = {
  A1: a1,
  A2: extra.A2.map(make("A2")),
  B1: extra.B1.map(make("B1")),
};
function make(level: InkLevel) {
  return (row: readonly [string, string, string, string], i: number): Phrase => ({
    id: `${level}-${i + 1}`,
    wrong: row[0],
    right: row[1],
    topic: row[2],
    explanation: row[3],
  });
}
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\bwon't\b/g, "will not")
    .replace(/\bcan't\b/g, "cannot")
    .replace(/\bcan not\b/g, "cannot")
    .replace(/n't\b/g, " not")
    .replace(/\bi'm\b/g, "i am")
    .replace(/'re\b/g, " are")
    .replace(/'ve\b/g, " have")
    .replace(/'ll\b/g, " will")
    .replace(/[.,!?;:"…]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
