# DÉPLOIEMENT — LC Cocody Digital Hub

Ce document prépare le déploiement (Phase 21) : configuration et étapes, **sans exécuter de
déploiement réel** — aucun compte cloud (Vercel/Render/Railway/MongoDB Atlas/Cloudinary/S3/R2)
n'est disponible dans cet environnement de développement, et le déploiement est une action externe
irréversible qui doit être effectuée par le responsable du projet avec ses propres comptes.

Statut : **TO_CONFIRM** pour tout choix marqué comme tel — rien n'a été inventé au-delà de ce que
demande `instruction.md`.

---

## 1. Vue d'ensemble

```text
Frontend  → Vercel
Backend   → Render / Railway / VPS         (TO_CONFIRM — lequel des trois)
Database  → MongoDB Atlas
Fichiers  → Cloudinary / S3 / Cloudflare R2 (TO_CONFIRM — lequel des trois)
```

Le code est déjà prêt pour ces cibles :
- Le backend ne stocke aucun fichier binaire en base (Phase 6) — bascule vers un vrai fournisseur
  cloud en implémentant `StorageDriver` (`backend/src/services/storage/storage.types.ts`), sans
  toucher au reste du code.
- Prisma + MongoDB fonctionne nativement avec un replica set géré (MongoDB Atlas en fournit un par
  défaut, y compris sur le tier gratuit).
- CORS, Helmet, rate limiting et variables d'environnement sont déjà configurés (Phases 1, 19).

---

## 2. Base de données — MongoDB Atlas

1. Créer un cluster (le tier gratuit M0 convient pour démarrer).
2. Créer un utilisateur applicatif dédié (pas le compte admin du cluster).
3. Autoriser l'accès réseau depuis l'IP du backend (ou `0.0.0.0/0` temporairement si l'hébergeur
   backend a des IP dynamiques — à restreindre ensuite si l'hébergeur le permet).
4. Récupérer la chaîne de connexion (Atlas fournit déjà un replica set, `?retryWrites=true&w=majority`
   inclus) et la placer dans `MONGODB_URI` du backend en production.
5. Exécuter `npx prisma db push` une fois depuis un environnement ayant accès au cluster pour créer
   les collections/index (pas de migration à proprement parler, `db push` suffit avec ce schéma).

**Ne jamais** réutiliser les données de démo (`prisma:seed`) en production — ce script crée des
comptes fictifs avec un mot de passe de démonstration connu.

---

## 3. Backend — Render / Railway / VPS (TO_CONFIRM)

Le backend est un service Node.js standard (Express), sans dépendance à une plateforme précise.

**Build :** `npm install && npm run build` (compile `src/` vers `dist/`)
**Start :** `npm start` (lance `dist/server.js`)
**Port :** lit `PORT` depuis l'environnement (déjà géré par `src/config/env.ts`)

### Variables d'environnement à configurer

Voir `backend/.env.example` pour la liste complète. En production :

| Variable | Valeur en production |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | fourni par l'hébergeur (Render/Railway l'injectent automatiquement) |
| `MONGODB_URI` | chaîne de connexion Atlas (§2) |
| `JWT_SECRET` | secret fort et unique, généré pour la prod — **jamais** le secret de dev/`.env.example` |
| `JWT_EXPIRES_IN` | ex. `1d` (déjà la valeur par défaut) |
| `CORS_ORIGIN` | l'URL exacte du frontend déployé (ex. `https://lc-cocody-digital-hub.vercel.app`) |

**HTTPS** : géré nativement par Render/Railway (certificat TLS automatique) ; sur un VPS, prévoir un
reverse proxy (nginx/Caddy) + Let's Encrypt — non couvert ici (dépend du choix d'hébergeur).

---

## 4. Frontend — Vercel

**Build :** `npm run build` (déjà configuré, `frontend/package.json`)
**Output :** `frontend/dist`
**Variable d'environnement à définir dans Vercel :**

| Variable | Valeur |
|---|---|
| `VITE_API_URL` | URL publique du backend déployé + `/api` (ex. `https://api.lccocody.example/api`) |

Vercel détecte automatiquement Vite. Aucune configuration serveur supplémentaire nécessaire (site
statique servi par le CDN de Vercel).

---

## 5. Stockage de fichiers — Cloudinary / S3 / Cloudflare R2 (TO_CONFIRM)

Le driver actuel (`LocalDiskStorage`, Phase 6) écrit sur le disque du serveur backend — **non
adapté à la production** sur une plateforme sans disque persistant (Render/Railway redémarrent les
conteneurs et perdent le système de fichiers local). Avant le déploiement réel, il faut :

1. Choisir un fournisseur (TO_CONFIRM avec le responsable du LC).
2. Implémenter un nouveau driver conforme à `StorageDriver` (`upload`/`read`/`delete`) dans
   `backend/src/services/storage/`.
3. Remplacer l'export de `storageDriver` dans `backend/src/services/storage/index.ts`.
4. Ajouter les identifiants du fournisseur (clé API, bucket, etc.) aux variables d'environnement —
   jamais en dur dans le code.

Aucun de ces identifiants n'existe dans cet environnement : cette étape reste à faire par le
responsable du projet avant une mise en production réelle.

---

## 6. Monitoring, logs, sauvegardes

- **Logs applicatifs** : le backend écrit déjà sur stdout/stderr (`morgan` en dev, `logger` pour les
  erreurs) — la plupart des hébergeurs (Render/Railway) capturent stdout nativement, aucune
  configuration supplémentaire nécessaire pour un logging basique.
- **Monitoring** : non configuré (TO_CONFIRM — dépend du choix d'outil : Sentry, UptimeRobot,
  monitoring natif de l'hébergeur, etc.). Le endpoint `GET /api/health` existe déjà et peut servir
  de cible à un moniteur de disponibilité externe.
- **Sauvegardes base de données** : MongoDB Atlas propose des sauvegardes automatiques (continuous
  backup) sur les tiers payants — à activer selon le tier choisi (TO_CONFIRM, le tier gratuit M0 n'en
  inclut pas).

---

## 7. Checklist avant mise en production réelle

- [ ] Choisir l'hébergeur backend (Render/Railway/VPS)
- [ ] Choisir le fournisseur de stockage fichiers et implémenter le driver correspondant
- [ ] Créer le cluster MongoDB Atlas et configurer l'accès réseau
- [ ] Générer un `JWT_SECRET` de production (fort, unique, jamais réutilisé du dev)
- [ ] Configurer `CORS_ORIGIN` avec l'URL exacte du frontend déployé
- [ ] Vérifier qu'aucune donnée de démo (`prisma:seed`) n'est exécutée en production
- [ ] Mettre en place un monitoring de `GET /api/health`
- [ ] Confirmer la politique de sauvegarde MongoDB Atlas
- [ ] Exécuter `npm run build` (backend + frontend) et `npm test` une dernière fois avant le déploiement
