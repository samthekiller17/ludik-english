<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- App state (user, progress, plan, results) lives in the client store and is saved through the `PersistenceAdapter` in `src/services/persistence.ts`; swap the adapter (e.g. to a backend one) rather than calling storage directly, so the rest of the app stays unchanged.
- Code must pass the strict typecheck (indexed access may be undefined, `override` on class members); guard array/record lookups instead of using non-null assertions.
- Large images are hosted as Lovable asset pointers (`src/assets/*.asset.json`) and read via `.url`, keeping binaries out of the repo.
- Game activity clocks reset on explicit start; microphone requests and speech are disposed at practice-card boundaries to prevent idle-time inflation and orphan media.
- English Ink phrases occupy independent adaptive grid rows; position animations must never share the same text area.
