/* ============================================================
 * Listen Up! — campaña (Anexo D): 3 regiones × 4 combates = 12
 * encuentros (6 normales, 3 especiales, 3 jefes) y 60 desafíos
 * auditivos A1–A2. Editable sin tocar la lógica del motor.
 * El audio se genera con la voz del navegador (provisional).
 * ============================================================ */
import type { BossPhase, CombatSetup, Element, EnemyDef, Objective, SpriteKey } from "./engine";

export type ChallengeMode = "act" | "understand" | "conversation";

export interface Challenge {
  id: string;
  mode: ChallengeMode;
  /** Lo que dice el audio (inglés). */
  audio: string;
  /** Traducción de apoyo (español). */
  es: string;
  /** Pregunta en español sencillo. */
  question: string;
  answer: string;
  distractors: string[];
  topic: string;
}

export interface Encounter extends CombatSetup {
  id: string;
  order: number;
  name: string;
  kind: "normal" | "special" | "boss";
  objectiveLabel: string;
  objectiveText: string;
  intro: string;
  /** Pista de debilidad que se muestra tras escucharla (no antes). */
  weaknessHint?: Element;
  reward: { xp: number; coins: number };
  challenges: Challenge[];
}

export interface Region {
  id: "forest" | "volcano" | "frozen";
  name: string;
  nameEs: string;
  level: "A1" | "A2";
  arena: "forest" | "volcano" | "frozen";
  tagline: string;
  encounters: Encounter[];
}

const OBJECTIVE_LABEL: Record<Objective, string> = {
  defeat: "DEFEAT ALL",
  target: "IDENTIFY THE TARGET",
  survive: "SURVIVE",
  shield: "DESTROY THE SHIELD",
  weakness: "IDENTIFY THE WEAKNESS",
  protect: "PROTECT THE COMPANION",
  boss: "BOSS BATTLE",
};

let counter = 0;
function c(
  mode: ChallengeMode,
  audio: string,
  es: string,
  question: string,
  answer: string,
  distractors: string[],
  topic: string,
): Challenge {
  counter += 1;
  return { id: `c${counter}`, mode, audio, es, question, answer, distractors, topic };
}

const enemy = (
  id: string,
  name: string,
  sprite: SpriteKey,
  hp: number,
  atk: number,
  behaviour: EnemyDef["behaviour"],
  extra: Partial<EnemyDef> = {},
): EnemyDef => ({ id, name, sprite, hp, atk, behaviour, ...extra });

function encounter(e: Omit<Encounter, "objectiveLabel"> & { objectiveLabel?: string }): Encounter {
  return { objectiveLabel: e.objectiveLabel ?? OBJECTIVE_LABEL[e.objective], ...e };
}

/* ---------------- REGIÓN 1 · ENCHANTED FOREST (A1) ---------------- */
const forest: Region = {
  id: "forest",
  name: "Enchanted Forest",
  nameEs: "Bosque Encantado",
  level: "A1",
  arena: "forest",
  tagline: "Árboles gigantes, hongos luminosos y ruinas antiguas.",
  encounters: [
    encounter({
      id: "goblin-scout",
      order: 1,
      name: "Goblin Scout",
      kind: "normal",
      objective: "defeat",
      objectiveText: "Derrota al goblin escuchando órdenes sencillas.",
      intro: "Un goblin explorador bloquea el camino. ¡Escucha cada orden y actúa!",
      enemies: [enemy("goblin", "Goblin Scout", "goblin", 60, 14, "basic")],
      reward: { xp: 15, coins: 4 },
      challenges: [
        c(
          "act",
          "Attack!",
          "¡Ataca!",
          "¿Qué orden escuchaste?",
          "Attack",
          ["Defend", "Run", "Jump"],
          "órdenes básicas",
        ),
        c(
          "act",
          "Defend yourself!",
          "¡Defiéndete!",
          "¿Qué debes hacer?",
          "Defend",
          ["Attack", "Sleep", "Sing"],
          "órdenes básicas",
        ),
        c(
          "act",
          "Use your sword!",
          "¡Usa tu espada!",
          "¿Qué debes usar?",
          "Your sword",
          ["Your shield", "Your bow", "A potion"],
          "objetos",
        ),
        c(
          "act",
          "Jump to the left!",
          "¡Salta a la izquierda!",
          "¿Hacia dónde saltas?",
          "Left",
          ["Right", "Up", "Back"],
          "direcciones",
        ),
        c(
          "understand",
          "The goblin has three gold coins.",
          "El goblin tiene tres monedas de oro.",
          "¿Cuántas monedas tiene el goblin?",
          "Three",
          ["Two", "Five", "Ten"],
          "números",
        ),
      ],
    }),
    encounter({
      id: "slime-swarm",
      order: 2,
      name: "Slime Swarm",
      kind: "special",
      objective: "target",
      objectiveText:
        "Tres slimes a la vez. La pista auditiva te dice cuál es el peligroso: Echo lo ataca primero.",
      intro: "¡Tres slimes saltan de los hongos! Uno de ellos es el más peligroso…",
      enemies: [
        enemy("slime-big", "Big Slime", "slime", 40, 10, "basic", {
          dangerous: true,
          scale: 1.15,
          weakness: "fire",
        }),
        enemy("slime-a", "Slime", "slime", 20, 5, "basic", { scale: 0.8, weakness: "fire" }),
        enemy("slime-b", "Slime", "slime", 20, 5, "basic", { scale: 0.8, weakness: "fire" }),
      ],
      weaknessHint: "fire",
      reward: { xp: 20, coins: 6 },
      challenges: [
        c(
          "understand",
          "The big slime is the dangerous one.",
          "El slime grande es el peligroso.",
          "¿Qué slime es el peligroso?",
          "The big one",
          ["The small one", "The blue one", "The sleeping one"],
          "descripciones",
        ),
        c(
          "act",
          "Attack the slime on the right.",
          "Ataca al slime de la derecha.",
          "¿A qué slime atacas?",
          "The one on the right",
          ["The one on the left", "The one in the middle", "The one on the tree"],
          "direcciones",
        ),
        c(
          "understand",
          "The pink slime is very angry.",
          "El slime rosado está muy enojado.",
          "¿De qué color es el slime enojado?",
          "Pink",
          ["Green", "Yellow", "Black"],
          "colores",
        ),
        c(
          "understand",
          "There are three slimes. One is sleeping.",
          "Hay tres slimes. Uno está durmiendo.",
          "¿Cuántos slimes hay?",
          "Three",
          ["One", "Four", "Six"],
          "números",
        ),
        c(
          "understand",
          "Slimes are weak against fire.",
          "Los slimes son débiles al fuego.",
          "¿A qué son débiles los slimes?",
          "Fire",
          ["Ice", "Water", "Wind"],
          "elementos",
        ),
      ],
    }),
    encounter({
      id: "thorn-archer",
      order: 3,
      name: "Thorn Archer",
      kind: "normal",
      objective: "survive",
      surviveTurns: 5,
      objectiveText:
        "Sobrevive 5 turnos. Sus flechas atraviesan Ice Shield: usa el Sonic Shield en el momento justo.",
      intro: "Un arquero de espinas dispara desde lejos. ¡Escucha cuándo cubrirte!",
      enemies: [enemy("archer", "Thorn Archer", "archer", 70, 16, "ranged")],
      reward: { xp: 20, coins: 6 },
      challenges: [
        c(
          "act",
          "Get down! An arrow is coming.",
          "¡Agáchate! Viene una flecha.",
          "¿Qué debes hacer?",
          "Get down",
          ["Stand up", "Open the door", "Sing a song"],
          "acciones",
        ),
        c(
          "act",
          "Use your shield now.",
          "Usa tu escudo ahora.",
          "¿Qué debes usar ahora?",
          "My shield",
          ["My sword", "My map", "My hat"],
          "objetos",
        ),
        c(
          "understand",
          "The archer is behind the big tree.",
          "El arquero está detrás del árbol grande.",
          "¿Dónde está el arquero?",
          "Behind the big tree",
          ["In the river", "On the bridge", "In the cave"],
          "lugares",
        ),
        c(
          "act",
          "Wait… now run to the rock!",
          "Espera… ¡ahora corre a la roca!",
          "¿A dónde corres?",
          "To the rock",
          ["To the river", "To the house", "To the tree"],
          "verbos",
        ),
        c(
          "understand",
          "He has five arrows left.",
          "Le quedan cinco flechas.",
          "¿Cuántas flechas le quedan?",
          "Five",
          ["Nine", "Two", "Fifteen"],
          "números",
        ),
      ],
    }),
    encounter({
      id: "forest-guardian",
      order: 4,
      name: "Forest Guardian",
      kind: "boss",
      objective: "boss",
      isBoss: true,
      objectiveText:
        "Jefe con 3 fases: ataques básicos, invoca criaturas y carga un grito que debes interrumpir acertando.",
      intro: "El suelo tiembla. El Guardián del Bosque despierta…",
      enemies: [
        enemy("guardian", "Forest Guardian", "guardian", 150, 14, "basic", {
          weakness: "fire",
          scale: 1.25,
        }),
      ],
      phases: [
        {
          below: 0.66,
          name: "Fase 2 · Raíces vivas",
          line: "Little friends, help me!",
          atkMul: 1.1,
          behaviour: "basic",
          summon: enemy("sprout", "Slime Sprout", "slime", 18, 6, "basic", {
            scale: 0.7,
            weakness: "fire",
          }),
        },
        {
          below: 0.33,
          name: "Fase 3 · Grito del bosque",
          line: "Hear the voice of the forest!",
          atkMul: 1.2,
          behaviour: "charger",
        },
      ] satisfies BossPhase[],
      weaknessHint: "fire",
      reward: { xp: 35, coins: 12 },
      challenges: [
        c(
          "conversation",
          "Good morning, little hero. Are you ready?",
          "Buenos días, pequeño héroe. ¿Estás listo?",
          "¿Qué te pregunta el guardián?",
          "If I am ready",
          ["My name", "The time", "My age"],
          "expresiones cotidianas",
        ),
        c(
          "understand",
          "My roots are strong, but my leaves are weak.",
          "Mis raíces son fuertes, pero mis hojas son débiles.",
          "¿Qué parte del guardián es débil?",
          "The leaves",
          ["The roots", "The eyes", "The arms"],
          "descripciones",
        ),
        c(
          "understand",
          "The guardian is weak against fire.",
          "El guardián es débil al fuego.",
          "¿A qué es débil el guardián?",
          "Fire",
          ["Ice", "Thunder", "Water"],
          "elementos",
        ),
        c(
          "act",
          "Look up! A big branch is falling.",
          "¡Mira arriba! Cae una rama grande.",
          "¿Qué debes hacer?",
          "Look up",
          ["Look down", "Close my eyes", "Sit down"],
          "acciones",
        ),
        c(
          "act",
          "Stop him! Say “Echo” before he shouts.",
          "¡Detenlo! Di “Echo” antes de que grite.",
          "¿Qué palabra debes decir?",
          "Echo",
          ["Hello", "Goodbye", "Help"],
          "órdenes básicas",
        ),
      ],
    }),
  ],
};

/* ---------------- REGIÓN 2 · VOLCANO LANDS (A2) ---------------- */
const volcano: Region = {
  id: "volcano",
  name: "Volcano Lands",
  nameEs: "Tierras del Volcán",
  level: "A2",
  arena: "volcano",
  tagline: "Ríos de lava, humo y cristales de fuego.",
  encounters: [
    encounter({
      id: "fire-imp",
      order: 5,
      name: "Fire Imp",
      kind: "normal",
      objective: "defeat",
      objectiveText: "Un enemigo rápido: si fallas, golpea 1,5×. Es débil al hielo.",
      intro: "Un diablillo de fuego salta entre las rocas a toda velocidad.",
      enemies: [
        enemy("imp", "Fire Imp", "imp", 65, 12, "fast", { weakness: "ice", resist: "fire" }),
      ],
      weaknessHint: "ice",
      reward: { xp: 20, coins: 6 },
      challenges: [
        c(
          "understand",
          "The imp moves very fast, so watch his tail.",
          "El diablillo se mueve muy rápido, así que vigila su cola.",
          "¿Qué debes vigilar?",
          "His tail",
          ["His eyes", "His feet", "The sky"],
          "partes del cuerpo",
        ),
        c(
          "understand",
          "Yesterday the imp burned the old bridge.",
          "Ayer el diablillo quemó el puente viejo.",
          "¿Qué quemó ayer?",
          "The old bridge",
          ["The forest", "The castle", "The boat"],
          "pasado simple",
        ),
        c(
          "understand",
          "Fire imps hate cold water and ice.",
          "Los diablillos de fuego odian el agua fría y el hielo.",
          "¿Qué odian los diablillos?",
          "Cold water and ice",
          ["Fire and lava", "Rocks and sand", "Wind and rain"],
          "elementos",
        ),
        c(
          "act",
          "Throw the ice bomb when he jumps.",
          "Lanza la bomba de hielo cuando salte.",
          "¿Cuándo lanzas la bomba?",
          "When he jumps",
          ["When he sleeps", "When he eats", "At night"],
          "conectores de tiempo",
        ),
        c(
          "understand",
          "There are fifteen lava rocks near the path.",
          "Hay quince rocas de lava cerca del camino.",
          "¿Cuántas rocas de lava hay?",
          "Fifteen",
          ["Fifty", "Five", "Thirteen"],
          "números",
        ),
      ],
    }),
    encounter({
      id: "lava-golem",
      order: 6,
      name: "Lava Golem",
      kind: "normal",
      objective: "weakness",
      objectiveText:
        "Mucha vida y un golpe cargado. Escucha cuál es su debilidad y elige esa habilidad.",
      intro: "Un gólem de lava se levanta. El fuego no le hace nada…",
      enemies: [
        enemy("golem", "Lava Golem", "golem", 120, 12, "charger", {
          weakness: "thunder",
          resist: "fire",
          scale: 1.15,
        }),
      ],
      weaknessHint: "thunder",
      reward: { xp: 25, coins: 8 },
      challenges: [
        c(
          "understand",
          "The golem is strong, but it is slower than you.",
          "El gólem es fuerte, pero es más lento que tú.",
          "Comparado contigo, el gólem es…",
          "Slower",
          ["Faster", "Smaller", "Younger"],
          "comparativos",
        ),
        c(
          "understand",
          "Fire doesn't hurt it. Try thunder instead.",
          "El fuego no le hace daño. Prueba con el trueno.",
          "¿Qué debes usar?",
          "Thunder",
          ["Fire", "Poison", "Light"],
          "elementos",
        ),
        c(
          "understand",
          "There is a crack in the golem's chest.",
          "Hay una grieta en el pecho del gólem.",
          "¿Dónde está la grieta?",
          "In its chest",
          ["In its head", "In its leg", "In its back"],
          "partes del cuerpo",
        ),
        c(
          "act",
          "It's charging a big punch. Defend first, then attack.",
          "Está cargando un gran puño. Primero defiéndete, luego ataca.",
          "¿Qué haces primero?",
          "Defend",
          ["Attack", "Run away", "Sleep"],
          "secuencias",
        ),
        c(
          "understand",
          "When it glows red, it is about to hit you.",
          "Cuando brilla en rojo, está a punto de golpearte.",
          "¿Qué significa el brillo rojo?",
          "It is about to hit me",
          ["It is sleeping", "It is tired", "It is happy"],
          "descripciones",
        ),
      ],
    }),
    encounter({
      id: "magma-duo",
      order: 7,
      name: "Magma Duo",
      kind: "special",
      objective: "shield",
      objectiveText:
        "Uno protege al otro. Rompe primero el escudo del protector (Double Attack o martillo ayudan).",
      intro: "Un portaescudos de magma cubre a un diablillo. ¿A quién atacas primero?",
      enemies: [
        enemy("bearer", "Magma Shieldbearer", "shieldbearer", 55, 10, "protector", {
          shield: 3,
          scale: 1.1,
        }),
        enemy("imp2", "Ember Imp", "imp", 40, 12, "healer", { weakness: "ice", scale: 0.85 }),
      ],
      reward: { xp: 30, coins: 10 },
      challenges: [
        c(
          "understand",
          "The big one with the shield protects the small one.",
          "El grande del escudo protege al pequeño.",
          "¿Quién protege a quién?",
          "The big one protects the small one",
          ["The small one protects the big one", "Nobody protects anyone", "They protect you"],
          "descripciones",
        ),
        c(
          "act",
          "Break the shield first, then attack the imp.",
          "Rompe el escudo primero, luego ataca al diablillo.",
          "¿Qué haces primero?",
          "Break the shield",
          ["Attack the imp", "Run away", "Drink a potion"],
          "secuencias",
        ),
        c(
          "understand",
          "The imp is behind the shield, on the right.",
          "El diablillo está detrás del escudo, a la derecha.",
          "¿Dónde está el diablillo?",
          "Behind the shield, on the right",
          ["In front, on the left", "Above the volcano", "Under the bridge"],
          "preposiciones",
        ),
        c(
          "conversation",
          "Did you hear that? The shield is cracking!",
          "¿Escuchaste eso? ¡El escudo se está rompiendo!",
          "¿Qué le pasa al escudo?",
          "It is cracking",
          ["It is growing", "It is shining", "It is flying"],
          "presente continuo",
        ),
        c(
          "understand",
          "If you hit them together, they get angrier.",
          "Si los golpeas juntos, se enojan más.",
          "¿Qué pasa si los golpeas juntos?",
          "They get angrier",
          ["They fall asleep", "They run away", "They heal you"],
          "condicional",
        ),
      ],
    }),
    encounter({
      id: "magma-titan",
      order: 8,
      name: "Magma Titan",
      kind: "boss",
      objective: "boss",
      isBoss: true,
      objectiveText:
        "Jefe con 3 fases: golpes pesados, ataques de área y explosiones de lava cargadas.",
      intro: "La montaña ruge. El Titán de Magma sale del volcán.",
      enemies: [
        enemy("titan", "Magma Titan", "titan", 170, 15, "tank", {
          weakness: "ice",
          resist: "fire",
          scale: 1.3,
        }),
      ],
      phases: [
        {
          below: 0.66,
          name: "Fase 2 · Ataques de área",
          line: "The whole floor is burning!",
          atkMul: 1.3,
          behaviour: "fast",
        },
        {
          below: 0.33,
          name: "Fase 3 · Explosiones de lava",
          line: "Feel the heart of the volcano!",
          atkMul: 1.3,
          behaviour: "charger",
        },
      ],
      weaknessHint: "ice",
      reward: { xp: 40, coins: 14 },
      challenges: [
        c(
          "conversation",
          "I am older than this mountain, little hero!",
          "¡Soy más viejo que esta montaña, pequeño héroe!",
          "¿Qué dice el titán?",
          "He is older than the mountain",
          ["He is taller than a tree", "He is younger than you", "He is smaller than a rock"],
          "comparativos",
        ),
        c(
          "act",
          "The floor will explode in three seconds. Jump!",
          "El suelo explotará en tres segundos. ¡Salta!",
          "¿Qué debes hacer?",
          "Jump",
          ["Stay", "Sit down", "Dig"],
          "órdenes",
        ),
        c(
          "act",
          "Hide behind the black rock, not the red one.",
          "Escóndete detrás de la roca negra, no de la roja.",
          "¿Detrás de qué roca te escondes?",
          "The black rock",
          ["The red rock", "The lava", "The tree"],
          "colores",
        ),
        c(
          "understand",
          "His heart is the weak point. Aim at his heart.",
          "Su corazón es el punto débil. Apunta a su corazón.",
          "¿A dónde apuntas?",
          "His heart",
          ["His feet", "His horns", "His hands"],
          "partes del cuerpo",
        ),
        c(
          "conversation",
          "You were brave yesterday. Be brave again today!",
          "Ayer fuiste valiente. ¡Sé valiente otra vez hoy!",
          "¿Cuándo fuiste valiente?",
          "Yesterday",
          ["Tomorrow", "Never", "Last year"],
          "pasado simple",
        ),
      ],
    }),
  ],
};

/* ---------------- REGIÓN 3 · FROZEN KINGDOM (A2) ---------------- */
const frozen: Region = {
  id: "frozen",
  name: "Frozen Kingdom",
  nameEs: "Reino Helado",
  level: "A2",
  arena: "frozen",
  tagline: "Castillos de hielo, cuevas y tormentas de nieve.",
  encounters: [
    encounter({
      id: "ice-wolf",
      order: 9,
      name: "Ice Wolf",
      kind: "normal",
      objective: "defeat",
      objectiveText: "Un lobo veloz: golpea 1,5× si fallas. Odia el fuego.",
      intro: "Un aullido entre la nieve. Un lobo de hielo te rodea.",
      enemies: [
        enemy("wolf", "Ice Wolf", "wolf", 70, 13, "fast", { weakness: "fire", resist: "ice" }),
      ],
      weaknessHint: "fire",
      reward: { xp: 22, coins: 7 },
      challenges: [
        c(
          "understand",
          "The wolf is hungry and it's looking for food.",
          "El lobo tiene hambre y busca comida.",
          "¿Qué busca el lobo?",
          "Food",
          ["Water", "A friend", "Its house"],
          "vocabulario",
        ),
        c(
          "understand",
          "It runs faster on ice than on snow.",
          "Corre más rápido sobre hielo que sobre nieve.",
          "¿Dónde corre más rápido?",
          "On ice",
          ["On snow", "In the water", "On grass"],
          "comparativos",
        ),
        c(
          "act",
          "Wolves hate fire. Light a torch!",
          "Los lobos odian el fuego. ¡Enciende una antorcha!",
          "¿Qué debes hacer?",
          "Light a torch",
          ["Open the map", "Eat some bread", "Climb a tree"],
          "acciones",
        ),
        c(
          "understand",
          "Two more wolves are coming from the north.",
          "Vienen dos lobos más desde el norte.",
          "¿De dónde vienen los lobos?",
          "From the north",
          ["From the south", "From the east", "From the west"],
          "direcciones",
        ),
        c(
          "act",
          "Stay calm and don't turn your back.",
          "Mantén la calma y no le des la espalda.",
          "¿Qué NO debes hacer?",
          "Turn my back",
          ["Stay calm", "Look at the wolf", "Hold my sword"],
          "imperativo negativo",
        ),
      ],
    }),
    encounter({
      id: "frost-witch",
      order: 10,
      name: "Frost Witch",
      kind: "normal",
      objective: "protect",
      ally: { name: "Pip", hp: 40 },
      objectiveText: "Protege a Pip: al fallar, la bruja golpea a los dos y te debilita 2 turnos.",
      intro: "Una bruja de escarcha quiere congelar a tu mascota Pip.",
      enemies: [
        enemy("witch", "Frost Witch", "witch", 80, 12, "debuff", {
          weakness: "fire",
          resist: "ice",
        }),
      ],
      weaknessHint: "fire",
      reward: { xp: 25, coins: 8 },
      challenges: [
        c(
          "conversation",
          "Protect Pip! The witch wants to freeze him.",
          "¡Protege a Pip! La bruja quiere congelarlo.",
          "¿A quién quiere congelar la bruja?",
          "Pip",
          ["You", "The wolf", "The king"],
          "conversación",
        ),
        c(
          "understand",
          "Her magic makes you slow for two turns.",
          "Su magia te hace lento durante dos turnos.",
          "¿Por cuánto tiempo eres lento?",
          "Two turns",
          ["Ten turns", "Forever", "One minute"],
          "números",
        ),
        c(
          "act",
          "Pip needs a healing potion. It's the blue bottle.",
          "Pip necesita una poción curativa. Es la botella azul.",
          "¿Qué botella necesita Pip?",
          "The blue bottle",
          ["The red bottle", "The green bottle", "The yellow bottle"],
          "colores",
        ),
        c(
          "act",
          "She is casting a spell. Cover your ears!",
          "Está lanzando un hechizo. ¡Tápate los oídos!",
          "¿Qué debes hacer?",
          "Cover my ears",
          ["Open my mouth", "Raise my hands", "Close the door"],
          "acciones",
        ),
        c(
          "conversation",
          "“I was a queen before the winter came,” says the witch.",
          "“Yo era reina antes de que llegara el invierno”, dice la bruja.",
          "¿Qué era la bruja antes?",
          "A queen",
          ["A teacher", "A dragon", "A wolf"],
          "pasado simple",
        ),
      ],
    }),
    encounter({
      id: "crystal-guardians",
      order: 11,
      name: "Crystal Guardians",
      kind: "special",
      objective: "shield",
      objectiveText:
        "Un cristal escudado (3 golpes) y su guardián sanador. Escucha las pistas para elegir el objetivo.",
      intro: "Cristales mágicos flotan alrededor de un cristal central.",
      enemies: [
        enemy("crystal-core", "Crystal Core", "crystal", 60, 10, "protector", {
          shield: 3,
          weakness: "thunder",
        }),
        enemy("crystal-keeper", "Crystal Keeper", "crystal", 45, 11, "healer", {
          weakness: "thunder",
          scale: 0.8,
        }),
      ],
      weaknessHint: "thunder",
      reward: { xp: 30, coins: 10 },
      challenges: [
        c(
          "act",
          "Hit the crystal in the middle, not the ones on the sides.",
          "Golpea el cristal del medio, no los de los lados.",
          "¿Qué cristal golpeas?",
          "The one in the middle",
          ["The ones on the sides", "The one on top", "None of them"],
          "direcciones",
        ),
        c(
          "understand",
          "The smallest crystal heals the others.",
          "El cristal más pequeño cura a los demás.",
          "¿Qué hace el cristal más pequeño?",
          "It heals the others",
          ["It attacks you", "It sleeps", "It sings"],
          "superlativos",
        ),
        c(
          "understand",
          "Each crystal has a different color. Attack the purple one.",
          "Cada cristal tiene un color distinto. Ataca al morado.",
          "¿A qué cristal atacas?",
          "The purple one",
          ["The blue one", "The white one", "The green one"],
          "colores",
        ),
        c(
          "understand",
          "The shield will fall after three hits.",
          "El escudo caerá después de tres golpes.",
          "¿Cuántos golpes necesita el escudo?",
          "Three",
          ["Two", "Five", "Ten"],
          "números",
        ),
        c(
          "understand",
          "Listen carefully: the crystal sings before it attacks.",
          "Escucha con atención: el cristal canta antes de atacar.",
          "¿Qué hace el cristal antes de atacar?",
          "It sings",
          ["It sleeps", "It cries", "It jumps"],
          "verbos",
        ),
      ],
    }),
    encounter({
      id: "frost-dragon",
      order: 12,
      name: "Frost Dragon",
      kind: "boss",
      objective: "boss",
      isBoss: true,
      objectiveText:
        "Jefe final con 4 fases: hielo, vuelo, tormenta congelante y ataque definitivo.",
      intro: "Las nubes se abren. El Dragón de Escarcha desciende sobre el castillo.",
      enemies: [
        enemy("dragon", "Frost Dragon", "dragon", 190, 14, "basic", {
          weakness: "fire",
          resist: "ice",
          scale: 1.35,
        }),
      ],
      phases: [
        {
          below: 0.75,
          name: "Fase 2 · Vuelo",
          line: "Catch me in the sky, if you can!",
          atkMul: 1.1,
          behaviour: "ranged",
        },
        {
          below: 0.5,
          name: "Fase 3 · Tormenta congelante",
          line: "Winter will never end!",
          atkMul: 1.2,
          behaviour: "debuff",
        },
        {
          below: 0.25,
          name: "Fase final · Ataque definitivo",
          line: "This is my final breath!",
          atkMul: 1.3,
          behaviour: "charger",
        },
      ],
      weaknessHint: "fire",
      reward: { xp: 50, coins: 20 },
      challenges: [
        c(
          "act",
          "The dragon is flying. Wait until it lands.",
          "El dragón está volando. Espera hasta que aterrice.",
          "¿Qué debes hacer?",
          "Wait until it lands",
          ["Attack now", "Go home", "Climb the mountain"],
          "conectores de tiempo",
        ),
        c(
          "act",
          "A freezing storm is coming. Stay near the fire.",
          "Viene una tormenta helada. Quédate cerca del fuego.",
          "¿Dónde debes quedarte?",
          "Near the fire",
          ["Near the river", "On the tower", "Outside"],
          "lugares",
        ),
        c(
          "understand",
          "The dragon's wings are weak against fire.",
          "Las alas del dragón son débiles al fuego.",
          "¿Qué parte es débil al fuego?",
          "Its wings",
          ["Its tail", "Its eyes", "Its teeth"],
          "partes del cuerpo",
        ),
        c(
          "understand",
          "It breathes ice every three turns.",
          "Lanza hielo cada tres turnos.",
          "¿Cada cuánto lanza hielo?",
          "Every three turns",
          ["Every turn", "Never", "Every ten turns"],
          "frecuencia",
        ),
        c(
          "act",
          "This is the final attack. Use all your Echo energy!",
          "Este es el ataque final. ¡Usa toda tu energía Echo!",
          "¿Qué debes usar?",
          "All my Echo energy",
          ["Nothing", "Only my shield", "A small potion"],
          "órdenes",
        ),
      ],
    }),
  ],
};

export const REGIONS: Record<Region["id"], Region> = { forest, volcano, frozen };

export const ALL_CHALLENGES = Object.values(REGIONS).flatMap((r) =>
  r.encounters.flatMap((e) => e.challenges),
);

export const ELEMENT_ES: Record<Element, string> = {
  fire: "fuego",
  ice: "hielo",
  thunder: "trueno",
  none: "ninguno",
};
