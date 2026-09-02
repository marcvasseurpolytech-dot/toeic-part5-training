# TOEIC Part 5 — Training (10 tests)

## Fichiers
- `index.html` : application étudiante (accès public, lecture seule)
- `admin.html` : panneau d'administration (protégé par mot de passe)
- `data.json` : les 300 questions, réponses et explications
- `access.json` : état d'ouverture (modifié uniquement par `api/update-access.js`)
- `api/update-access.js` : fonction serverless Vercel qui écrit `access.json` sur GitHub

## Variables d'environnement à définir sur Vercel
Dans les paramètres du projet Vercel (Settings → Environment Variables), ajouter :

| Variable | Valeur |
|---|---|
| `GITHUB_TOKEN` | Un token GitHub personnel avec le scope `repo` (fine-grained : accès en écriture "Contents" sur ce repo uniquement) |
| `GITHUB_REPO` | `marcvasseurpolytech-dot/toeic-part5-training` |
| `ADMIN_PASSWORD_HASH` | Le hash SHA-256 du mot de passe admin (même valeur que celle intégrée dans `admin.html`) |

Après avoir ajouté ces variables, redéployer une fois pour qu'elles soient prises en compte par la fonction serverless.

## Fonctionnement du verrouillage
- `access.json.closed = true` : plus aucun test accessible, quel que soit le reste.
- Pour chaque test : `unlocked` (bool) + `unlock_date` (ISO 8601 ou `null`).
  Un test est visible par les étudiants si `unlocked = true` ET (`unlock_date` est vide OU déjà passée).
- Toute modification via `admin.html` déclenche un commit GitHub sur `access.json`, donc un redéploiement
  Vercel automatique. Comptez ~30-60 secondes de propagation.

## Sécurité
Le mot de passe n'est jamais stocké en clair côté serveur : `admin.html` fait une vérification rapide
côté client (hash SHA-256 comparé à une valeur codée en dur), mais la fonction serverless refait sa
propre vérification indépendante contre `ADMIN_PASSWORD_HASH` avant d'écrire quoi que ce soit — c'est
elle la véritable barrière de sécurité.
