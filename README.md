# Ludik — Una forma divertida de aprender idiomas

Plataforma de aprendizaje de inglés con cuatro guías (Echo · Listening, Lexi · Reading, Tinta · Writing, Fono · Speaking) y minijuegos por habilidad.

## Estructura
- `src/routes/` — páginas (hub, ejercicio, progreso, logros, planes, nosotros, ajustes, acceso).
- `src/features/` — header, hub, mapa de aprendizaje, selector de personajes, `ModuleShell`.
- `src/modules/<id>/` — cada minijuego (`index.tsx` + contenido editable).
- `src/data/` — personajes, caminos por habilidad, insignias, planes, registro de módulos.
- `src/services/` — reglas de desbloqueo, servicios y adaptador de persistencia.
- `src/store/` — estado global y datos semilla.

## Cómo agregar…
- **Un módulo:** crea `src/modules/mi-modulo/index.tsx` que reciba `ModuleProps` y llame a `onComplete(result)`; añade una entrada en `src/data/modules.registry.ts`.
- **Un nivel:** añade un nodo en `src/data/paths.ts` con `moduleId` y `levelId`. Los nodos sin módulo muestran "Próximamente". Al cambiar el nivel MCER se crea una nueva unidad en el mapa.
- **Un personaje:** añade su ficha en `src/data/characters.ts`, su imagen en `src/assets/` y su camino en `paths.ts`.
- **Un plan:** edita `src/data/plans.ts` (funciones por plan) y marca nodos con `requiresPlan`.
- **Un idioma de estudio:** duplica los archivos de contenido de cada módulo con el nuevo idioma; el motor es el mismo.

## Persistencia
Todo pasa por `PersistenceAdapter` (`src/services/persistence.ts`). Para un backend, sustituye el adaptador; el resto de la app no cambia.

## Pruebas
`bunx vitest run` — reglas de desbloqueo, puntuación de módulos y rutas.
