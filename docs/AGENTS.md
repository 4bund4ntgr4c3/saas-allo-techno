<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history -- force pushing, or rebasing/amending/squashing commits
> that are already pushed -- as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Workflow obligatoire

À chaque commit, **avant de pousser**, mettre à jour :

1. **`CHANGELOG.md`** — ajouter une entrée dans la section `[version]` (format `YYYY.MM.DD`). Lister les `Added`, `Changed`, `Fixed`, `Removed` pertinents. Ne jamais réécrire l'historique existant.

2. **`README.md`** — vérifier que la section "Fonctionnalités", le tableau "Stack technique" et les compteurs reflètent l'état actuel. Mettre à jour le numéro de version en haut du fichier.

3. **`package.json`** — si un dependency est ajoutée/supprimée, refléter dans les sections `dependencies`/`devDependencies`.

4. **Ne jamais supprimer de fonctionnalité existante** sans explication explicite dans le CHANGELOG (`Removed`).

5. **Ne jamais dégrader une fonctionnalité** (ex: passer de Recharts à un graphique basique). Toute régression doit être documentée.

6. **Vérifier les doublons** avant d'implémenter une feature : consulter le CHANGELOG et README pour voir si elle existe déjà.

7. **Lockfile sync** : si un package est ajouté/supprimé dans `package.json`, toujours exécuter `npx bun install` pour régénérer `bun.lock` AVANT de commiter. Le build Cloudflare échoue silencieusement si `bun.lock` est désynchronisé (`bun install --frozen-lockfile`). Vérifier avec `npx bun install --dry-run` que le lockfile est à jour.

## Règles de qualité

- Toujours exécuter `npx tsc --noEmit` après modification de fichiers `.ts`/`.tsx`.
- Toujours exécuter `npx vitest run` pour vérifier que les tests passent.
- Toujours exécuter `npm run build` pour vérifier que le build réussit.
- Appliquer `npx prettier --write` sur les fichiers modifiés avant de commiter.
- Suivre le code style existant (pas de commentaires inutiles, noms explicites, imports structurés).

## Structure de commit

Format : `type(scope): description`

Types autorisés :
- `feat` — nouvelle fonctionnalité
- `fix` — correction de bug
- `refactor` — refactorisation sans changement de comportement
- `perf` — amélioration de performance
- `test` — ajout/modification de tests
- `docs` — documentation
- `chore` — maintenance, dépendances, config

Exemples :
```
feat(payments): add refund flow with audit log
fix(auth): redirect to login on session expiry
refactor(admin): extract 14 tab components from monolith
docs: update CHANGELOG and README for batch 18
```

## Vérification pré-commit

Avant chaque commit, s'assurer que :
- [ ] `npx tsc --noEmit` passe (0 erreurs)
- [ ] `npx vitest run` passe (92+ tests)
- [ ] `npm run build` réussit
- [ ] CHANGELOG.md est à jour
- [ ] README.md reflète l'état actuel
- [ ] Aucune fonctionnalité existante n'est dégradée
