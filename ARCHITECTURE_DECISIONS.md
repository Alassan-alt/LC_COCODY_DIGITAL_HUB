# Registre des décisions d'architecture — LC Cocody Digital Hub

---

### Decision : Rattrapage de la Phase 0 après coup, puis enchaînement direct sur la Phase 2

**Pourquoi :** Après le scaffolding de la Phase 1 (décision précédente), le responsable du projet a
demandé de « rattraper » la Phase 0 puis d'enchaîner immédiatement, sans marquer de pause de
validation entre le document et la Phase 2.

**Alternatives :**
1. Produire `PHASE0_ANALYSIS.md` puis attendre une validation explicite avant Phase 2.
2. Produire le document et enchaîner directement sur Phase 2, comme demandé.

**Choix :** Option 2 — sur instruction explicite (« rattrape et enchaîne maintenant »).

**Justification :** La demande de l'utilisateur constitue la validation explicite requise par
`instruction.md` §4 pour passer à la phase suivante ; il n'y a pas d'ambiguïté à lever.

**Impact :** `PHASE0_ANALYSIS.md` documente rétroactivement l'architecture (modèle de données,
rôles, API, risques, diagrammes) qui a en réalité guidé le scaffolding de la Phase 1. Le modèle de
données qui y est proposé sert de base directe au schéma Prisma de la Phase 2.

**Date :** 2026-09-17

---

### Decision : Passage direct au scaffolding (Phase 1) sans document Phase 0 séparé

**Pourquoi :** `instruction.md` impose comme règle absolue de livrer et faire valider la Phase 0
(analyse/architecture) avant tout code. La demande initiale de l'utilisateur (« mettre en place la
structure du projet ») correspondait en réalité à la Phase 1.

**Alternatives :**
1. Produire d'abord un document `PHASE0_ANALYSIS.md` complet, puis attendre validation.
2. Passer directement au scaffolding en s'appuyant sur l'architecture déjà détaillée dans
   `instruction.md` (§6-8) et `PROJECT_CONTEXT.md` (§7-11), qui couvrent déjà l'essentiel des
   livrables attendus de la Phase 0 (stack, entités, rôles, structure de dossiers).

**Choix :** Option 2 — scaffolding direct, sur décision explicite de l'utilisateur après signalement
du conflit avec la règle absolue.

**Justification :** Les fichiers d'instruction contiennent déjà la stack technique, le modèle
d'entités de haut niveau, les rôles/permissions et l'arborescence cible. Le risque de re-livrer un
document redondant a été jugé plus coûteux que la valeur ajoutée, une fois l'accord explicite obtenu.

**Impact :** Aucun diagramme de classes / cas d'utilisation / diagramme de séquence formel n'a été
produit. Ces livrables devront être rattrapés avant la Phase 2 (DATABASE) si le modèle de données
détaillé (relations entre `User`, `Department`, `Team`, `Mandate`, etc.) le nécessite.

**Date :** 2026-09-17

---

### Decision : audit d'optimisation Phase 20 — deux corrections identifiées, pas de changement spéculatif

**Pourquoi :** `instruction.md` Phase 20 impose explicitement « Optimiser uniquement après avoir
mesuré ou identifié un problème réel. Éviter toute optimisation prématurée. » — l'audit qui suit
distingue donc ce qui a été **corrigé** (problème réellement identifié) de ce qui a été **examiné et
délibérément laissé tel quel**.

**Corrigé (problèmes réels identifiés à la relecture, pas mesurés sous charge) :**
1. `transitionService.getContent()` chargeait documents/rapports/articles de connaissance **sans
   aucune limite** — un mandat de plusieurs années peut accumuler des centaines d'entrées. Plafond
   `take: 200` ajouté sur les listes non naturellement bornées (documents, rapports, procédures).
2. `dashboardService.getDashboard()` chargeait **toutes les colonnes** de chaque KPI juste pour
   calculer un compte et une moyenne. `select: { currentValue, target }` réduit les données
   transférées depuis MongoDB sans changer le résultat.

**Examiné et volontairement laissé tel quel (pas de preuve de problème réel) :**
- `notificationService.syncTaskAlerts()` fait une vérification par tâche dans une boucle (motif
  N+1) — mais borné par le nombre de tâches en retard/imminentes d'un seul utilisateur, naturellement
  petit. Optimiser ceci sans mesure serait prématuré.
- Le nombre de KPI/projets/partenaires par mandat reste naturellement borné par la taille de
  l'organisation — pas de plafond ajouté sur ces listes (contrairement aux documents/articles qui
  croissent avec chaque événement/réunion).
- 49 index Prisma déjà en place sur les champs de filtre/clé étrangère les plus utilisés (ajoutés au
  fil des phases, pas en une passe rétroactive) — audit confirme la couverture, aucun ajout nécessaire.
- Pagination systématique sur tous les endpoints de liste depuis la Phase 5 — confirmé, rien à changer.
- Frontend : aucun composant métier construit au-delà de la page de santé (Phases 2-19 ont porté sur
  le backend) — rien à optimiser sans inventer des fonctionnalités non demandées.

**Vérifié par :** `typecheck`, `lint`, 218/218 tests, build — aucune régression introduite par les
deux corrections.

**Date :** 2026-09-18

---

### Decision : début de l'interface frontend — authentification + dashboard

**Pourquoi :** demande explicite du responsable du projet de commencer à construire une vraie
interface au-dessus du backend complet (21 phases). Vu l'ampleur (22 domaines métier), l'approche
retenue reproduit le même principe que le backend : livrer par tranches fonctionnelles plutôt que
tout à la fois, en commençant par les fondations que tout le reste utilisera.

**Première tranche livrée :**
- `store/authStore.ts` : session (utilisateur + JWT) en Zustand avec `persist` (localStorage) — la
  session survit à un rafraîchissement de page.
- `services/api.ts` : intercepteur de requête (ajoute `Authorization: Bearer`), intercepteur de
  réponse (401 → déconnexion automatique).
- `features/auth/` : page de connexion (React Hook Form + Zod, cohérent avec l'architecture prévue),
  testée (validation, succès, échec).
- `routes/ProtectedRoute.tsx` : redirige vers `/login` si aucun token.
- `layouts/AppLayout.tsx` : nouvelle coquille authentifiée (barre latérale + en-tête utilisateur),
  remplace le `MainLayout` de la Phase 1 — désormais obsolète, supprimé avec la page de vérification
  de connexion (Phase 1) qu'il portait, code mort retiré plutôt que laissé de côté.
- `features/dashboard/` : consomme réellement `GET /api/dashboard` (aucune donnée inventée) ;
  tuiles de statistiques (`components/StatTile.tsx`) et alertes, avec le skill `dataviz` chargé
  avant construction — palette substituée par celle du projet (`token_color.md`) plutôt que la
  palette par défaut du skill, couleurs de statut (succès/erreur/avertissement) réservées à leur
  rôle sémantique (ex. tâches en retard : vert si 0, rouge sinon).

**Bug de test trouvé et corrigé (indépendant de cette fonctionnalité) :** `vite.config.ts` a
`test.globals: false` (Phase 18), ce qui empêche l'auto-enregistrement du nettoyage de
`@testing-library/react` entre les tests — deux formulaires de connexion se superposaient dans le
DOM d'un test à l'autre. Corrigé une fois pour toutes dans `tests/setup.ts` (`afterEach(cleanup)`
explicite), bénéficie à tous les tests frontend futurs, pas seulement à celui-ci.

**Vérifié par :** `typecheck`/`lint`/`build` propres, 3/3 tests frontend, et un parcours complet en
navigateur réel (Playwright) : connexion échouée → message d'erreur affiché → connexion réussie
avec un compte de démo → dashboard affichant les vraies données (5 membres, 2 départements, alerte
de mandat en retard) sans erreur console.

**Reste à construire :** les 21 autres domaines métier (membres, documents, projets, etc.) n'ont pas
encore d'interface — prochaine tranche à définir avec le responsable du projet.

**Date :** 2026-09-18

---

### Decision : audit de sécurité Phase 19 — rate limiting ajouté, reste déjà conforme

**Pourquoi :** `instruction.md` Phase 19 demande de vérifier JWT, bcrypt, CORS, Helmet, validation,
rate limiting, upload, permissions, injection, exposition de données sensibles, secrets, logs.

**Constat point par point :**
| Point | État | Détail |
|---|---|---|
| JWT | ✓ déjà conforme | Secret via env, expiration configurable, vérifié à chaque requête (Phase 3) |
| bcrypt | ✓ déjà conforme | `bcryptjs`, 10 rounds, jamais de mot de passe en clair |
| CORS | ✓ déjà conforme | Restreint à `CORS_ORIGIN` (Phase 1) |
| Helmet | ✓ déjà conforme | Actif sur toute l'app (Phase 1) |
| Validation | ✓ déjà conforme | Zod sur tous les inputs (body + query), aucune route sans schéma |
| **Rate limiting** | **✗ → corrigé** | **Absent avant cette phase — ajouté ci-dessous** |
| Upload | ✓ déjà conforme | Taille max 20 Mo, extensions dangereuses bloquées (Phase 6) |
| Permissions | ✓ déjà conforme | RBAC systématique, backend seul juge (Phase 4+) |
| Injection | ✓ déjà conforme | Prisma paramètre toutes les requêtes ; Zod rejette les formes non-string/number avant d'atteindre la DB |
| Exposition de données sensibles | ✓ déjà conforme | `passwordHash` jamais renvoyé (`sanitizeUser`), stack trace masquée hors dev |
| Secrets | ✓ déjà conforme | `.env` gitignoré, jamais commité, aucune clé en dur dans le code |
| Logs | ✓ déjà conforme | Aucun mot de passe/token dans les logs applicatifs |

**Rate limiting ajouté** (`express-rate-limit`) :
- Limite générale sur `/api/*` : 300 requêtes / 15 min / IP.
- Limite stricte sur `/api/auth/register` et `/api/auth/login` : 10 requêtes / 15 min / IP
  (`skipSuccessfulRequests: true` — seules les tentatives échouées comptent pour le login, pour ne
  pas pénaliser un usage normal).
- **Désactivé quand `NODE_ENV=test`** : la suite de tests envoie des centaines de requêtes depuis la
  même IP en quelques secondes, ce qui déclencherait des 429 sans rapport avec la logique testée. Le
  mécanisme est vérifié séparément par une instance Express isolée dans `tests/security.test.ts`
  (seuil bas, sans le bypass), et manuellement en conditions réelles (10 tentatives échouées puis 429
  confirmé sur le serveur de dev).

**Tests de sécurité ajoutés** (`tests/security.test.ts`, Phase 18) : absence de `passwordHash`/secrets
dans les réponses, absence de stack trace hors dev, résistance à l'injection d'opérateur Mongo via
un paramètre de requête (Zod), rejet d'upload `.exe`, mécanisme de rate limiting.

**Date :** 2026-09-17

---

### Decision : correction d'une régression introduite par une modification externe

**Contexte :** entre deux de mes actions, plusieurs fichiers (`transition.service.ts`,
`transition.controller.ts`, `transition.routes.ts`, `notification.service.ts`,
`transition.repository.ts`) ont été modifiés par un processus externe à cette conversation
(refactor cohérent : extraction de `notifyRoles()` dans `notification.service.ts`, réutilisation de
`financeRepository.getBalance()`, renommage `removeChecklistItem` → `deleteChecklistItem` répercuté
partout). La majorité du refactor était correcte et a été conservée telle quelle.

**Régression trouvée :** `transitionService.getContent()` avait perdu les champs `procedures`
(base de connaissances) et `lessonsLearned`, pourtant explicitement exigés par `instruction.md`
Phase 17 (« Le package de transition doit pouvoir contenir : ... procédures ; lessons learned »).

**Correction :** champs restaurés dans le même style que le reste du refactor (un seul
`Promise.all`), avec le même commentaire justifiant que les procédures (Phase 15) ne sont pas
rattachées à un mandat et sont donc renvoyées dans leur ensemble plutôt que filtrées.
Vérifié par `typecheck`/`lint`/tests (218/218) et manuellement (`procedures: 1` confirmé après
création d'un article de connaissance).

**Pourquoi corriger plutôt que revenir en arrière :** le reste du refactor était une amélioration
légitime (meilleure réutilisation, cohérence de nommage) ; seul le point manquant contredisait une
exigence explicite du projet — corriger ce point précis était plus approprié qu'annuler tout le
changement.

**Date :** 2026-09-18

---

### Decision : charte graphique AIESEC appliquée via les tokens Tailwind v4

**Pourquoi :** demande explicite du responsable du projet d'utiliser la palette définie dans
`token_color.md` (racine du projet) et le logo « powered by AIESEC » (`assets/images/`).

**Choix :** les couleurs de `token_color.md` (`primary`, `secondary`, `success`, `error`, `warning`,
`info`, `highlight`, `purple`, `cyan`, échelle `neutral`) sont déclarées comme variables `--color-*`
dans `frontend/src/index.css` (bloc `@theme` de Tailwind v4), ce qui génère automatiquement les
classes utilitaires (`text-primary`, `bg-success-light`, etc.) sans dupliquer les valeurs ailleurs.
Le logo `powered-by-Blue.png` est copié dans `frontend/public/powered-by-aiesec.png` et affiché dans
le pied de page de `MainLayout`.

**Justification :** source unique de vérité pour les couleurs (le fichier `token_color.md` reste la
référence, les classes Tailwind en sont une traduction directe) ; le layout et la page d'accueil déjà
scaffoldés en Phase 1 sont mis à jour pour utiliser ces tokens plutôt que les couleurs neutres
(`slate-*`) par défaut.

**Limite assumée :** `token_color.md` ne fournit pas de variante sombre — pas de dark mode ajouté
(rien à traduire, et non demandé). Vérifié par build (classes CSS générées confirmées dans le bundle
compilé) et test manuel du serveur dev (logo servi en 200) ; aucun outil de capture d'écran
navigateur n'est disponible dans cet environnement pour une confirmation visuelle directe.

**Date :** 2026-09-17

---

### Decision : Knowledge Base, Lessons Learned, Transition (Phases 15-17)

**Knowledge Base (Phase 15)** — `instruction.md` donne des exemples de titres d'articles (« Comment
organiser un événement ? », « Procédure ICX », etc.) explicitement qualifiés d'« Exemples ». Aucun
contenu réel de procédure n'a été inventé ni pré-rempli — seul le CRUD est livré ; le contenu reste à
la charge du LC. Visibilité réutilise `DocumentVisibility` (Phase 6) pour cohérence, mais l'entité
n'a pas de `departmentId` : `DEPARTMENT`/`CONFIDENTIAL` se replient donc sur un accès « auteur +
SUPER_ADMIN/LCP seulement » (`canAccess` reçoit `departmentId: null`) — repli **restrictif**, jamais
permissif, donc sûr même si ce n'est pas l'usage exact prévu pour ces deux valeurs sur cette entité.

**Lessons Learned (Phase 16)** — `instruction.md` dit « Pour chaque projet », d'où le choix d'une
relation 1-1 avec `Project` (contrainte `@unique` sur `projectId`) et une route `PUT` en upsert
(`/projects/:id/lessons-learned`) plutôt qu'un CRUD générique avec pagination — il n'y a jamais
qu'un seul enregistrement par projet, un `GET`/`PUT` suffit.

**Transition (Phase 17)** — Le package agrège **par référence** (aucune duplication) les données déjà
scoped par `mandateId` : documents, rapports, KPI, projets, finances, partenaires — retrouvés via
une simple requête filtrée, pas copiés dans `TransitionPackage`. Les « procédures » correspondent à
la base de connaissances (Phase 15), qui n'étant pas rattachée à un mandat, est renvoyée dans son
ensemble plutôt que filtrée (un guide reste valable au-delà d'un seul mandat). Checklist libre, sans
éléments par défaut : `instruction.md` ne fournit pas de checklist officielle AIESEC/LC à reproduire,
et en inventer une reviendrait à créer un processus officiel non confirmé (interdit §14). Le type de
notification `TRANSITION` (déclaré par avance en Phase 13) est maintenant émis vers SUPER_ADMIN/LCP
à la création d'un package — permissions calquées sur la gestion des Mandats (Phase 5).

**Date :** 2026-09-17

---

### Decision : Audit Logs — lecture réservée SUPER_ADMIN/LCP, aucune route d'écriture exposée

**Pourquoi :** RG-06 impose que « les logs ne doivent pas être modifiables par les utilisateurs
ordinaires ». `instruction.md` Phase 14 liste exactement 8 actions à tracer, déjà présentes dans
l'enum `AuditAction` depuis la Phase 6 ; il manquait `LOGIN`, `MEMBER_CREATED`, `MEMBER_UPDATED` côté
émission, et une API de consultation.

**Choix :**
- `LOGIN` émis dans `auth.service.ts` sur connexion **réussie** uniquement (comme les autres actions
  de l'enum, qui sont toutes des événements de succès — pas de tentative échouée tracée ici).
- `MEMBER_CREATED`/`MEMBER_UPDATED` émis dans `member.service.ts`, avec l'identité du demandeur
  (`req.user.sub`) propagée depuis le contrôleur jusqu'au service pour attribuer correctement l'action.
- `GET /api/audit-logs` : seule route exposée pour ce module, réservée `SUPER_ADMIN`/`LCP` (plus
  strict que les autres modules « managers » à 4 rôles — un journal d'audit/sécurité n'a pas besoin
  d'être visible par VP/TEAM_LEADER). **Aucune route POST/PATCH/DELETE** : la seule façon d'écrire un
  log reste `recordAuditLog()` (Phase 6), appelée en interne par les services métier.

**Justification :** Respecte à la fois la liste exacte d'actions demandée et l'interdiction explicite
de modification par un utilisateur ordinaire — l'absence de route d'écriture est la garantie la plus
forte possible (pas de logique d'autorisation à maintenir, l'action est simplement impossible).

**Impact :** Si une action légitime nécessite un jour de corriger/annoter un log (rarissime), il
faudra un outil d'administration hors API (script direct), pas une route REST — décision volontaire.

**Date :** 2026-09-17

---

### Decision : notifications déclenchées par événement + synchronisation à la demande (pas de cron)

**Pourquoi :** `instruction.md` Phase 13 demande des notifications pour : tâches assignées,
deadlines, tâches en retard, nouveaux documents, événements, réunions, rapports, transition. Il
n'existe pas de scheduler dans ce MVP (même contrainte que le statut `OVERDUE` en Phase 8).

**Choix :**
- **Événements ponctuels** (tâche assignée, nouveau document/événement/réunion/rapport) : émis
  directement dans le service concerné, juste après le succès de l'action (`notificationService.
  notifyUser` / `notifyDepartment`).
- **Alertes temporelles** (deadline proche, tâche en retard) : générées à la demande, au moment où
  l'utilisateur consulte `GET /api/notifications` (`syncTaskAlerts`), de façon idempotente (une seule
  notification par tâche+type grâce à `existsForEntity`).
- **Diffusion « nouveau document/événement/réunion/rapport »** : limitée aux membres du département
  concerné (`departmentId`), jamais à toute l'organisation par défaut, et les documents
  `CONFIDENTIAL`/`RESTRICTED` ne déclenchent aucune notification large (cohérence avec la politique
  de visibilité Phase 6).
- **`TRANSITION`** : valeur d'enum déclarée par avance (comme `TASK_CREATED` l'avait été pour
  `AuditAction` en Phase 6), mais aucune émission tant que le module Transition (Phase 17) n'existe
  pas — pas de fonctionnalité invente.

**Justification :** Cohérent avec la décision déjà prise pour `OVERDUE` (Phase 8) : pas de dépendance
à un scheduler externe, résultat toujours à jour au moment de la lecture, testable simplement.

**Impact :** Un utilisateur qui ne consulte jamais `/api/notifications` ne recevra pas d'alerte de
deadline avant sa prochaine consultation — acceptable pour un MVP sans notifications push/email.

**Date :** 2026-09-17

---

### Decision : export PDF/Excel/CSV différé, contenu texte généré à partir de données réelles

**Pourquoi :** `instruction.md` Phase 12 dit « Prévoir l'export futur : PDF, Excel, CSV » — le mot
« futur » indique explicitement qu'il ne s'agit pas de construire l'export maintenant, seulement de
concevoir le modèle pour le permettre plus tard.

**Choix :**
1. `Report.content` est un champ texte libre, base suffisante pour qu'un futur export (PDF/Excel/CSV)
   le mette en forme sans changer le schéma.
2. `POST /api/reports/generate` construit ce contenu à partir de vraies données agrégées (projets,
   documents, événements, partenaires, solde financier, progression des KPI sur le périmètre
   département/mandat demandé) — même philosophie « pas de fausses statistiques » que le dashboard
   (Phase 7).
3. Aucune dépendance ajoutée (pas de `pdfkit`/`exceljs`/équivalent) tant que l'export binaire n'est
   pas explicitement demandé — cohérent avec l'interdit « dépendances inutiles ».

**Justification :** Respecte la lettre d'`instruction.md` (« futur ») sans bloquer la valeur immédiate
(un rapport avec un vrai contenu, pas un stub vide) ; évite d'ajouter une dépendance lourde non
encore justifiée par une demande explicite d'export.

**Impact :** Quand l'export sera demandé, un service `reportExport.service.ts` pourra consommer
`Report.content` (et/ou les données agrégées) sans migration de schéma.

**Date :** 2026-09-17

---

### Decision : `PartnerActivity` unifie notes et historique du pipeline CRM

**Pourquoi :** `instruction.md` Phase 11 demande « suivi, responsable, notes, contacts, historique »
séparément, sans préciser si notes et historique sont deux mécanismes distincts ou un seul.

**Choix :** Une seule entité `PartnerActivity` (note + `fromStatus`/`toStatus` optionnels) sert à la
fois de journal de notes libres et d'historique de changement de statut. `POST
/partners/:id/activities` accepte `{ note, status? }` : si `status` diffère du statut actuel, le
partenaire avance dans le pipeline et la transition est tracée dans la même entrée.

**Alternatives :**
1. Deux entités séparées (`PartnerNote` et `PartnerStatusHistory`).
2. Une seule entité combinée (choisie).

**Justification :** Reflète l'usage réel d'un CRM (on ajoute presque toujours une note *au moment*
où on fait avancer une négociation) ; évite deux collections quasi redondantes ; garde une seule
chronologie lisible pour « suivi » + « historique ».

**Impact :** Si le besoin de notes purement internes sans aucun lien au pipeline devient très
fréquent, l'entité reste adaptée (`status` est optionnel) — aucun changement de schéma nécessaire.

**Date :** 2026-09-17

---

### Decision : Finance restreinte aux rôles de gestion, devise par défaut XOF

**Pourquoi :** `instruction.md` Phase 10 ne précise pas qui peut consulter/enregistrer les
transactions financières, ni la devise. RG-07 impose de ne jamais exposer une information sans
permission, et les données financières sont par nature sensibles.

**Choix :**
- Lecture (`GET /finance/*`) : `SUPER_ADMIN`, `LCP`, `VP`, `TEAM_LEADER` — pas `MEMBER`.
- Écriture (create/update/delete) : `SUPER_ADMIN`, `LCP`, `VP` uniquement (`TEAM_LEADER` exclu,
  contrairement aux autres modules de gestion) — l'argent est plus sensible qu'un document ou une tâche.
- Devise par défaut `XOF` (Franc CFA) : cohérent avec la localisation réelle déjà donnée dans
  `PROJECT_CONTEXT.md` (LC Cocody, Abidjan), pas une règle métier AIESEC inventée — un choix de valeur
  par défaut technique, modifiable par transaction (`currency` reste un champ libre).
- Suppression logique (`isDeleted`) : cohérent avec RG-05, l'historique financier est sensible.

**Justification :** Politique plus stricte que Team/Event/Meeting (où TEAM_LEADER peut gérer),
proportionnée à la sensibilité de la donnée, alignée sur la matrice de rôles déjà posée (PHASE0
§6 : VP gère son département, incluant son budget).

**Impact :** Le dashboard (Phase 7) affiche le solde (`stats.finance`) uniquement pour les rôles
autorisés — absent (pas à zéro/masqué) pour les autres, cohérence testée explicitement.

**Date :** 2026-09-17

---

### Decision : décision de réunion → tâche générée automatiquement (pas sur action séparée)

**Pourquoi :** `instruction.md` Phase 9 dit « Une décision de réunion doit pouvoir générer une
tâche » et détaille le workflow `Réunion → Décision → Responsable → Tâche → Deadline` sans préciser
si la génération est automatique ou déclenchée séparément par l'utilisateur.

**Alternatives :**
1. Créer la décision seule, puis exposer une action séparée « générer la tâche » à la demande.
2. Générer automatiquement la tâche à la création de la décision (même appel API).

**Choix :** Option 2 — `POST /api/meetings/:id/decisions` crée la `MeetingDecision` **et** la `Task`
liée dans le même appel, puis enregistre `generatedTaskId` sur la décision.

**Justification :** Correspond exactement au diagramme de séquence déjà posé en Phase 0
(`PHASE0_ANALYSIS.md` §8.3, écrit avant le développement de cette phase) et évite qu'une décision
actée en réunion reste « orpheline » sans responsabilisation immédiate — cohérent avec l'objectif de
traçabilité du LC (RG-06/RG-08).

**Impact :** Toute décision créée via l'API génère systématiquement une tâche `TODO` assignée à
`responsibleId`, avec la même échéance. Réutilise `taskService.create()` (pas de duplication de la
logique d'audit `TASK_CREATED`).

**Date :** 2026-09-17

---

### Decision : statuts `Project` non fournis par `instruction.md` — vocabulaire technique raisonnable

**Pourquoi :** `instruction.md` Phase 8 donne les statuts et priorités des `Task` explicitement
(`TODO/IN_PROGRESS/DONE/OVERDUE`, `LOW/MEDIUM/HIGH/URGENT`) mais ne donne aucun statut pour `Project`.

**Choix :** `ProjectStatus = PLANNED | IN_PROGRESS | ON_HOLD | COMPLETED | CANCELLED` — vocabulaire de
gestion de projet générique et standard, pas une règle métier AIESEC/LC inventée.

**Justification :** Il s'agit d'un choix d'architecture logicielle générique (comme `MandateStatus`
en Phase 2), pas d'une règle de gestion propre au LC Cocody — distinction faite dans l'interdit §14
(« ne pas inventer des processus officiels d'AIESEC/règles de gestion »), qui ne s'applique pas à un
vocabulaire technique standard de gestion de projet.

**Impact :** **TO_CONFIRM** si le LC a une terminologie différente à utiliser à la place.

**Date :** 2026-09-17

---

### Decision : `OVERDUE` calculé dynamiquement, jamais écrit automatiquement en base

**Pourquoi :** `instruction.md` liste `OVERDUE` comme un statut de tâche à part entière, mais il n'y a
pas de tâche planifiée (cron) dans ce MVP pour balayer et transitionner les tâches en retard.

**Alternatives :**
1. Ajouter un job planifié qui marque `OVERDUE` en base quand `dueDate` est dépassée.
2. Calculer le statut effectif à la volée (lecture) sans jamais modifier la valeur stockée.

**Choix :** Option 2 (`src/utils/taskStatus.ts` → `withEffectiveStatus`). Une tâche `TODO`/`IN_PROGRESS`
dont `dueDate` est dépassée est présentée comme `OVERDUE` dans toutes les réponses API (liste, détail,
Kanban) et dans les filtres (`buildStatusWhere` côté repository), sans jamais réécrire `status` en base.

**Justification :** Évite d'introduire une dépendance à un scheduler externe avant que ce besoin soit
posé par une phase dédiée (Phase 20 — Optimisation, ou une phase de notifications/CRON future) ; reste
cohérent quel que soit le moment de la lecture (pas de données périmées entre deux exécutions de cron).

**Impact :** Toute nouvelle requête Mongo directe sur `Task.status` (hors API) ne verra pas les tâches
en retard comme `OVERDUE` — à garder en tête si un futur module interroge `Task` directement.

**Date :** 2026-09-17

---

### Decision : dashboard limité aux données réellement disponibles (Phase 7)

**Pourquoi :** `instruction.md` Phase 7 demande d'afficher membres, projets, tâches, documents,
événements, KPIs, alertes et statistiques — mais les modules Projets, Tâches, Événements et KPI
n'existent pas encore (Phases 8, 9, 12, pas encore traitées). La même instruction précise pourtant
explicitement : « Ne pas utiliser de fausses statistiques dans le dashboard final. »

**Alternatives :**
1. Attendre les Phases 8/9/12 avant de livrer un dashboard complet.
2. Livrer `GET /api/dashboard` avec uniquement les statistiques déjà réelles (membres, départements,
   équipes, documents visibles par le demandeur) et une liste explicite `pendingModules` pour les
   sections non encore développées — sans jamais renvoyer de zéro ou de valeur inventée pour elles.

**Choix :** Option 2.

**Justification :** Respecte à la lettre l'interdiction de fausses statistiques tout en livrant une
fonctionnalité réellement utilisable dès maintenant ; `pendingModules` documente explicitement ce qui
manque plutôt que de le cacher derrière un zéro ambigu (un zéro pourrait signifier « aucun projet »
alors qu'en réalité le module n'existe simplement pas encore).

**Impact :** Quand les Phases 8/9/12 seront traitées, ajouter leurs compteurs à `dashboardService` et
retirer l'entrée correspondante de `pendingModules` — aucun changement de contrat pour les clients
qui géreraient déjà l'absence de ces clés.

**Une alerte réelle a été ajoutée** (`MANDATE_ENDING_SOON` / `MANDATE_OVERDUE`, fenêtre de 30 jours)
à partir de données déjà existantes (`Mandate.endDate`), plutôt que d'inventer un système d'alertes
générique qui n'aurait rien à surveiller avant les phases futures (tâches en retard, etc.).

**Date :** 2026-09-17

---

### Decision : stockage local sur disque (Phase 6) en attendant un fournisseur cloud confirmé

**Pourquoi :** `instruction.md`/`PROJECT_CONTEXT.md` exigent un stockage externe (Cloudinary, S3 ou
Cloudflare R2 — jamais les fichiers binaires dans MongoDB), mais aucun de ces fournisseurs n'a été
choisi ni configuré, et cet environnement de développement n'a pas accès à des identifiants cloud.

**Alternatives :**
1. Bloquer la Phase 6 en attendant que le responsable du LC fournisse des identifiants Cloudinary/S3/R2.
2. Construire une interface `StorageDriver` (`src/services/storage/storage.types.ts`) et un driver
   disque local (`LocalDiskStorage`) pour le dev/test, interchangeable sans toucher au reste du code.

**Choix :** Option 2. `src/services/storage/index.ts` exporte `storageDriver`, seul point d'entrée
utilisé par les services — aucun contrôleur/service ne connaît le détail du stockage.

**Justification :** Respecte strictement l'exigence « pas de binaire dans MongoDB » (les fichiers
sont sur disque sous `backend/.local/uploads/`, gitignorés ; MongoDB ne garde que les métadonnées et
une clé opaque) tout en permettant de développer et tester réellement la Phase 6 sans dépendance
externe. Les téléchargements passent toujours par l'API authentifiée (jamais d'URL statique publique),
ce qui est en fait une meilleure pratique de sécurité que des URLs signées basiques, quel que soit le
fournisseur final.

**Impact :** **TO_CONFIRM** — le fournisseur cloud définitif (Cloudinary/S3/R2) reste à choisir avant
la mise en production (Phase 21). Migration = écrire un nouveau driver implémentant `StorageDriver`,
aucun changement ailleurs.

**Date :** 2026-09-17

---

### Decision : versions de document via pointeur `currentVersionId` (pas de champ fichier sur `Document`)

**Pourquoi :** RG-04 exige la conservation de l'historique des versions ; il fallait un modèle
permettant l'ajout de versions et une restauration non destructive.

**Choix :** `Document` ne stocke aucune donnée de fichier directement (pas de `storageKey`/`mimeType`
dessus) ; chaque fichier réel est une ligne `DocumentVersion` (avec `versionNumber` croissant).
`Document.currentVersionId` est un simple champ scalaire (pas une relation Prisma formelle, pour
éviter un cycle de relations Document↔DocumentVersion) pointant vers la version active.
« Restaurer » une version = redéfinir `currentVersionId`, sans rien supprimer.

**Justification :** Historique complet toujours conservé (RG-04), restauration triviale et non
destructive, cohérent avec le test explicitement demandé par `instruction.md` Phase 6 (« version 1 ;
version 2 ; restauration »).

**Impact :** Toute lecture de « quel est le fichier actuel d'un document » nécessite une requête
supplémentaire sur `DocumentVersion` via `currentVersionId` (pas de `include` Prisma automatique).
Acceptable au vu du volume attendu.

**Date :** 2026-09-17

---

### Decision : `AuditLog` introduit dès la Phase 6 (scope limité aux actions documentaires)

**Pourquoi :** `instruction.md` Phase 6 liste explicitement « audit » dans les tests attendus, et
RG-06 exige que les actions sur les documents (upload/download/update/delete) soient tracées. L'entité
`AuditLog` est officiellement prévue Phase 14, mais son usage documentaire est requis dès maintenant.

**Choix :** Modèle `AuditLog` + enum `AuditAction` ajoutés au schéma avec la liste **exacte** des
actions données par `instruction.md`/`PROJECT_CONTEXT.md` (aucune inventée). Seules les actions
`DOCUMENT_*` sont émises pour l'instant (par `src/services/audit.service.ts`, appelé depuis
`document.service.ts`). **Aucune route `/api/audit-logs` n'est exposée** — la consultation (API,
filtres, pagination) reste le périmètre de la Phase 14, conformément à RG-06 (« logs non modifiables
par les utilisateurs ordinaires », donc pas d'exposition prématurée non plus).

**Impact :** Quand la Phase 14 sera traitée, il faudra ajouter les émissions pour les autres actions
(`LOGIN`, `MEMBER_CREATED`, `MEMBER_UPDATED`, `TASK_CREATED`) et l'API de consultation — le modèle de
données n'aura pas besoin de migration.

**Date :** 2026-09-17

---

### Decision : politique de visibilité documentaire (PUBLIC/INTERNAL/DEPARTMENT/CONFIDENTIAL/RESTRICTED)

**Pourquoi :** `instruction.md` Phase 6 impose ces 5 niveaux mais n'en définit pas la sémantique
exacte (qui peut lire quoi). L'inventer entièrement serait risqué (RG projet §14) ; ne rien définir
rendrait la fonctionnalité inutilisable.

**Choix retenu** (`src/utils/documentAccess.ts`, fonctions `canAccess` / `buildVisibilityWhere`) :
- `SUPER_ADMIN`, `LCP` : accès total, toujours.
- `PUBLIC`, `INTERNAL` : lisible par tout utilisateur authentifié.
- `DEPARTMENT` : lisible par les membres du même département que le document/dossier.
- `CONFIDENTIAL` : lisible par `VP`/`TEAM_LEADER` du même département, ou par l'auteur/propriétaire.
- `RESTRICTED` : lisible uniquement par l'auteur/propriétaire (+ `SUPER_ADMIN`/`LCP`).
- Modification (métadonnées, nouvelle version, restauration, suppression) : auteur ou
  `SUPER_ADMIN`/`LCP` uniquement, quelle que soit la visibilité.

**Justification :** Politique cohérente avec la matrice de rôles déjà posée en Phase 0/5 (LCP
transverse, VP/TEAM_LEADER scoped département/équipe, MEMBER self-scoped), implémentée à la fois en
filtre de liste Prisma (`buildVisibilityWhere`, pour que la pagination reste exacte) et en vérification
unitaire (`canAccess`, pour `GET`/`download`/`update`/`delete`) — les deux expriment la même règle.

**Impact :** **TO_CONFIRM** si le LC a une politique plus précise (ex. RESTRICTED visible aussi par
LCP seul et pas VP, etc.) — à ajuster sans changer la structure du schéma ni des routes.

**Date :** 2026-09-17

---

### Decision : modèle de permissions Phase 5 — contrôle par rôle, sans scoping fin par département/équipe

**Pourquoi :** `instruction.md` Phase 5 demande des « permissions » sur les CRUD organisation, sans
détailler si un VP doit être restreint à son seul département ou un TEAM_LEADER à sa seule équipe.
Inventer cette restriction fine (« row-level scoping ») reviendrait à définir une règle de gestion
non confirmée par le responsable du LC.

**Alternatives :**
1. Implémenter un scoping complet (VP → lecture/écriture limitée à son département, TEAM_LEADER → à
   son équipe, MEMBER → à son seul profil).
2. Implémenter uniquement un contrôle par rôle (qui a le droit d'utiliser quel verbe HTTP sur quel
   module), sans filtrage automatique des résultats par périmètre organisationnel.

**Choix :** Option 2, avec la matrice suivante :
- Départements / Mandats : lecture → tout authentifié ; écriture → `SUPER_ADMIN`, `LCP`.
- Équipes : lecture → tout authentifié ; écriture → `SUPER_ADMIN`, `LCP`, `VP`.
- Utilisateurs (`/users`) : lecture → `SUPER_ADMIN`, `LCP` ; écriture → `SUPER_ADMIN` uniquement.
- Membres (`/members`) : lecture → `SUPER_ADMIN`, `LCP`, `VP`, `TEAM_LEADER` ; écriture → `SUPER_ADMIN`, `LCP`.

**Justification :** Livre un RBAC réel, testé et sécurisé (le backend reste seul juge, RG-02) sans
présumer d'une politique de cloisonnement par département/équipe non validée. Un `MEMBER` accède déjà
à son propre profil via `/auth/me` (Phase 3), donc aucune régression fonctionnelle pour ce rôle.

**Impact :** Le scoping fin (VP limité à son département, etc.) est **TO_CONFIRM** — à ajouter dans
une phase ultérieure si le responsable du LC le demande explicitement, sans changer la forme des
routes (juste la logique de filtrage dans les services).

**Date :** 2026-09-17

---

### Decision : suppression « douce » ou contrôlée selon la sensibilité de l'entité (RG-05)

**Pourquoi :** RG-05 (`PROJECT_CONTEXT.md`) demande de privilégier la suppression logique pour les
données sensibles/importantes plutôt qu'une suppression physique irréversible.

**Choix retenu par entité :**
- `Department.DELETE` → suppression logique (`isActive: false`), champ déjà prévu au schéma.
- `Mandate.DELETE` → clôture (`status: CLOSED`), jamais de suppression physique (mémoire de mandat, RG-08).
- `User.DELETE` → désactivation (`isActive: false`), cohérent avec le contrôle déjà fait au login (Phase 3).
- `MemberProfile.DELETE` → désactive le `User` lié plutôt que d'effacer le profil (conservation de
  l'historique organisationnel, RG-08), le profil reste lisible pour l'audit/la continuité.
- `Team.DELETE` → suppression physique, mais **bloquée (409)** si des `MemberProfile` y sont encore
  rattachés — MongoDB n'impose pas de contrainte référentielle automatique, le contrôle est fait
  explicitement au niveau service.

**Justification :** Chaque choix suit RG-05/RG-08 sans supposer de règle non confirmée ; `Team` est
la seule entité de cette phase sans historique sensible propre, donc suppression physique acceptable
sous garde-fou.

**Date :** 2026-09-17

---

### Decision : `LocalCommittee` sans API CRUD publique en Phase 5 (singleton auto-provisionné)

**Pourquoi :** `instruction.md` Phase 5 liste explicitement « utilisateurs, membres, départements,
teams, mandats » — `LocalCommittee` n'y figure pas, alors que `Department`/`Mandate` exigent un
`localCommitteeId` au schéma (Phase 2).

**Choix :** `getOrCreateDefaultLocalCommittee()` (`src/repositories/localCommittee.repository.ts`)
garantit un unique enregistrement `LocalCommittee` (nom par défaut « LC Cocody »), utilisé
automatiquement par les services `department`/`mandate`. Aucune route `/local-committees` exposée.

**Justification :** Respecte le périmètre exact de la phase ; la plateforme est conçue pour un seul
LC (LC Cocody), donc un singleton auto-provisionné est suffisant et n'invente aucune fonctionnalité
hors périmètre.

**Impact :** Si un besoin multi-LC apparaît un jour, une vraie API CRUD `LocalCommittee` devra être
ajoutée — **TO_CONFIRM**, hors scope MVP actuel.

**Date :** 2026-09-17

---

### Decision : exécution séquentielle des fichiers de test (Vitest `fileParallelism: false`)

**Pourquoi :** Les tests sont des tests d'intégration contre une vraie base MongoDB partagée (pas de
mocks). Le parallélisme de fichiers par défaut de Vitest a provoqué deux classes de bugs : (1) des
`deleteMany()` non filtrés dans `database.test.ts` supprimant les données d'un autre fichier de test
en cours d'exécution concurrente, (2) des collisions de noms entre fixtures de fichiers différents
(ex. « Mandat Test » préfixe partagé entre `mandate.test.ts` et `team.test.ts`).

**Alternatives :**
1. Isoler chaque fichier de test dans sa propre base MongoDB (setup/teardown par fichier).
2. Filtrer et préfixer rigoureusement chaque fixture pour garantir l'absence de collision, en
   gardant le parallélisme.
3. Désactiver le parallélisme inter-fichiers (`test.fileParallelism: false`).

**Choix :** Option 3, combinée à des préfixes de fixtures plus spécifiques par fichier (partiellement
fait pour l'option 2 aussi, en complément).

**Justification :** Le plus simple et le plus sûr pour une suite d'intégration partageant un état
mutable externe ; option 1 ajouterait une complexité d'infrastructure disproportionnée pour ce stade
du projet. Le coût (suite un peu plus lente) est acceptable vu le volume de tests actuel.

**Impact :** `backend/vitest.config.mts` — `fileParallelism: false`. À revisiter si la suite devient
trop lente (alors basculer vers l'option 1, une base de test par worker).

**Date :** 2026-09-17

---

### Decision : `authorize()` en liste blanche explicite par route, sans hiérarchie de rôles implicite

**Pourquoi :** `PROJECT_CONTEXT.md` §7 définit 5 rôles (`SUPER_ADMIN`, `LCP`, `VP`, `TEAM_LEADER`,
`MEMBER`) mais ne précise pas de relation d'ordre/héritage entre eux (ex. « SUPER_ADMIN hérite de
tous les droits de LCP »). Inventer cette hiérarchie reviendrait à inventer une règle de gestion non
confirmée (interdit §14 `PROJECT_CONTEXT.md`).

**Alternatives :**
1. Implémenter une hiérarchie implicite (ex. `ROLE_LEVEL[role] >= ROLE_LEVEL[required]`).
2. Exiger une liste blanche explicite de rôles autorisés à chaque utilisation de `authorize(...roles)`.

**Choix :** Option 2 — `authorize("SUPER_ADMIN", "LCP")` par exemple, sans inférence automatique.

**Justification :** Chaque route déclare explicitement qui peut y accéder ; aucune supposition sur
une hiérarchie non validée par le responsable du LC. Plus verbeux mais plus sûr et plus auditable
(RG-02 : le backend est seul juge des permissions).

**Impact :** Quand un module accordera l'accès à plusieurs rôles « supérieurs », il faudra lister
tous les rôles concernés explicitly (ex. `authorize("SUPER_ADMIN", "LCP", "VP")`). Si une vraie
hiérarchie est confirmée plus tard, un helper `rolesAtLeast(role)` pourra être ajouté sans changer
la signature de `authorize()`.

**Date :** 2026-09-17

---

### Decision : MongoDB + Prisma, aucune entité définie en Phase 1

**Pourquoi :** `instruction.md` §8 et `PROJECT_CONTEXT.md` §9-11 imposent MongoDB (via MongoDB Atlas)
et interdisent PostgreSQL. La définition des entités (`User`, `LocalCommittee`, `Department`, etc.)
est explicitement rattachée à la Phase 2 — DATABASE.

**Alternatives :**
1. Définir dès la Phase 1 un modèle minimal (ex. `User`) pour permettre `prisma generate` avec un
   client complet.
2. Laisser `schema.prisma` avec uniquement `datasource` + `generator`, sans modèle, conformément à
   la séparation stricte des phases.

**Choix :** Option 2.

**Justification :** Respect de la règle « ne pas développer plusieurs phases en même temps » et de
la séparation Phase 1 (init) / Phase 2 (modèle de données). `@prisma/client` reste importable en
TypeScript même sans modèle généré (stub par défaut), donc aucun blocage technique.

**Impact :** `prisma generate` échoue tant qu'aucun modèle n'est défini — c'est un comportement
attendu et documenté dans `backend/prisma/schema.prisma`. Sera résolu en Phase 2.

**Date :** 2026-09-17

---

### Decision : Remplacement d'oxlint par ESLint + Prettier (frontend)

**Pourquoi :** Le scaffold `create-vite` récent utilise par défaut `oxlint`, mais `instruction.md`
§5 et §7 exigent explicitement ESLint et Prettier (cohérence avec le backend).

**Alternatives :**
1. Garder `oxlint` (plus rapide, mais outillage différent du backend et non demandé).
2. Remplacer par ESLint (flat config) + Prettier, alignés avec la config backend.

**Choix :** Option 2.

**Justification :** Conformité stricte aux exigences techniques du projet ; cohérence d'outillage
entre backend et frontend, facilitant la maintenance.

**Impact :** Dépendances supplémentaires (`eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`,
`eslint-plugin-react-refresh`, `eslint-config-prettier`, `prettier`, `globals`) — toutes nécessaires
et directement liées à une exigence explicite du projet, donc non superflues au sens de l'interdit
« dépendances inutiles ».

**Date :** 2026-09-17

---

### Decision : Fixation de `vitest@^4.1.11` au lieu de la dernière version majeure

**Pourquoi :** `npm audit` a signalé 5 vulnérabilités (dont une critique) sur la chaîne
`vitest → @vitest/mocker → vite` en version `^2.1.1`. La dernière version (`5.0.1`) déclenche un bug
connu de l'arborist npm (`Cannot read properties of null (reading 'edgesOut')`) empêchant
l'installation dans cet environnement.

**Alternatives :**
1. Forcer `vitest@5.0.1` via `--force`/`--legacy-peer-deps`.
2. Fixer `vitest@^4.1.11`, version minimale corrigeant les CVE identifiées, sans déclencher le bug npm.

**Choix :** Option 2.

**Justification :** Corrige toutes les vulnérabilités (`npm audit` → 0 vulnérabilité) sans contourner
la résolution de dépendances npm par la force, ce qui serait risqué et non reproductible de façon fiable.

**Impact :** Aucun — un seul fichier de test simple (`tests/app.test.ts`), API vitest inchangée entre
v4 et v2 pour cet usage basique.

**Date :** 2026-09-17

---

### Decision : Orchestration `npm run dev` via `concurrently` au niveau racine

**Pourquoi :** `instruction.md` (Phase 1) demande de pouvoir tester `npm run dev` et vérifier que
frontend et backend fonctionnent, ce qui implique une commande unique au niveau racine.

**Alternatives :**
1. Documenter deux commandes séparées (`npm run dev` dans `backend/` et `frontend/`).
2. Ajouter un `package.json` racine avec `concurrently` pour lancer les deux en une seule commande.

**Choix :** Option 2.

**Justification :** Meilleure expérience développeur, correspond à l'attente explicite du document
d'instruction ; `concurrently` est une dépendance légère et standard pour ce cas d'usage (pas de
dépendance « inutile »).

**Impact :** Un `package.json` racine supplémentaire avec une seule dépendance de dev.

**Date :** 2026-09-17
