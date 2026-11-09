# LC COCODY DIGITAL HUB

## CONTEXTE MAÎTRE DU PROJET

**Version : 1.0**

---

# 1. IDENTITÉ DU PROJET

**Nom :** LC Cocody Digital Hub

**Type :** Application web interne de gestion et de mémoire organisationnelle.

**Organisation concernée :** LC Cocody Abidjan.

**Objectif principal :**

Créer un espace numérique centralisé permettant au LC de gérer ses informations, ses membres, ses activités, ses documents et ses connaissances, tout en assurant la continuité entre les différents mandats.

---

# 2. CONTEXTE DU PROJET

Le fonctionnement d'une organisation évolue avec les mandats et les responsables.

Les informations peuvent être réparties entre différents outils :

* WhatsApp ;
* Google Drive ;
* ordinateurs ;
* téléphones ;
* fichiers Word ;
* fichiers Excel ;
* autres espaces de stockage.

Cette dispersion peut provoquer :

* perte d'informations ;
* difficulté de recherche ;
* duplication des documents ;
* absence d'historique ;
* perte de connaissances ;
* mauvaise transmission entre mandats ;
* difficulté à identifier les documents importants ;
* manque de visibilité sur les activités.

Le projet vise donc à construire une **mémoire numérique centralisée du LC Cocody**.

---

# 3. PROBLÈME PRINCIPAL

Le système actuel ne garantit pas suffisamment :

* la centralisation ;
* l'organisation ;
* la traçabilité ;
* la sécurité ;
* la recherche ;
* la conservation ;
* la transmission des informations.

### Problématique

> Comment concevoir un système numérique permettant au LC Cocody de centraliser, sécuriser, organiser et conserver durablement ses informations et connaissances afin d'améliorer sa gestion et d'assurer la continuité entre les mandats ?

---

# 4. VISION DU PROJET

Le LC Cocody Digital Hub doit devenir :

> **La mémoire numérique du LC Cocody.**

Le système ne doit pas être uniquement un outil de gestion.

Il doit permettre de conserver :

* les documents ;
* les rapports ;
* les procédures ;
* les projets ;
* les expériences ;
* les connaissances ;
* les leçons apprises ;
* les informations nécessaires à la transition.

---

# 5. PÉRIMÈTRE DU PROJET

## 5.1 Organisation

Le système doit permettre de gérer :

* utilisateurs ;
* membres ;
* départements ;
* équipes ;
* positions ;
* mandats.

## 5.2 Documents

Le système doit gérer :

* dossiers ;
* documents ;
* catégories ;
* tags ;
* recherche ;
* téléchargement ;
* versions ;
* historique ;
* permissions ;
* archivage.

## 5.3 Activités

Le système doit gérer :

* projets ;
* tâches ;
* événements ;
* réunions ;
* décisions ;
* présence.

## 5.4 Pilotage

Le système doit gérer :

* KPIs ;
* rapports ;
* statistiques ;
* dashboard.

## 5.5 Finance

Le système doit permettre :

* revenus ;
* dépenses ;
* transactions ;
* justificatifs ;
* historique.

## 5.6 Partenaires

Le système doit permettre :

* prospects ;
* contacts ;
* suivi ;
* partenaires ;
* historique.

## 5.7 Connaissance

Le système doit intégrer :

* Knowledge Base ;
* procédures ;
* bonnes pratiques ;
* Lessons Learned.

## 5.8 Transition

Le système doit faciliter :

* transmission des documents ;
* transmission des projets ;
* transmission des informations ;
* transmission des procédures ;
* transmission des recommandations ;
* continuité entre mandats.

---

# 6. HORS PÉRIMÈTRE DU MVP

Les fonctionnalités suivantes ne doivent PAS être développées dans le MVP :

* intelligence artificielle ;
* système complexe de paiement ;
* fonctionnalités inutiles au fonctionnement du LC ;
* automatisations non validées ;
* fonctionnalités expérimentales.

L'IA pourra être intégrée ultérieurement sous forme de :

**Ask LC Cocody**

---

# 7. UTILISATEURS

Les rôles principaux sont :

```text
SUPER_ADMIN
LCP
VP
TEAM_LEADER
MEMBER
```

Les permissions doivent être définies par rôle.

Le backend doit toujours vérifier les permissions.

---

# 8. RÈGLES DE GESTION

## RG-01 — Authentification

Un utilisateur doit être authentifié pour accéder aux ressources protégées.

---

## RG-02 — Autorisation

L'accès à une fonctionnalité dépend du rôle et des permissions de l'utilisateur.

Le frontend ne doit jamais être considéré comme une couche de sécurité.

---

## RG-03 — Documents

Chaque document doit avoir au minimum :

* un nom ;
* un fichier ;
* un auteur ;
* une date ;
* une visibilité ;
* un emplacement.

---

## RG-04 — Versions

Lorsqu'un document existant est modifié, une nouvelle version doit pouvoir être créée.

L'historique doit être conservé.

---

## RG-05 — Suppression

Une suppression importante doit être contrôlée.

Pour les données sensibles, privilégier la suppression logique lorsque cela est pertinent.

---

## RG-06 — Traçabilité

Les actions importantes doivent être enregistrées dans les Audit Logs.

Exemples :

```text
LOGIN
DOCUMENT_UPLOADED
DOCUMENT_DOWNLOADED
DOCUMENT_UPDATED
DOCUMENT_DELETED
MEMBER_CREATED
MEMBER_UPDATED
TASK_CREATED
```

---

## RG-07 — Confidentialité

Un utilisateur ne doit jamais pouvoir consulter une information à laquelle il n'a pas accès.

---

## RG-08 — Mandats

Les données doivent pouvoir être rattachées à un mandat afin de conserver l'historique.

---

## RG-09 — Départements

Les départements doivent rester configurables.

Ne pas coder définitivement une liste de départements dans le système sans justification.

---

## RG-10 — Données

Les données doivent être validées avant leur enregistrement.

Utiliser notamment :

**Zod + TypeScript.**

---

# 9. RÈGLES TECHNIQUES

## Backend

Utiliser :

* Node.js ;
* Express ;
* TypeScript ;
* Prisma ;
* MongoDB ;
* JWT ;
* bcrypt/bcryptjs ;
* Zod.

## Frontend

Utiliser :

* React ;
* TypeScript ;
* Vite ;
* Tailwind CSS ;
* React Router ;
* TanStack Query ;
* Zustand si nécessaire ;
* React Hook Form ;
* Zod.

## Base de données

Utiliser :

**MongoDB Atlas.**

Ne pas utiliser PostgreSQL.

---

# 10. ARCHITECTURE

Le backend doit suivre :

```text
ROUTE
  ↓
MIDDLEWARE
  ↓
CONTROLLER
  ↓
SERVICE
  ↓
REPOSITORY / PRISMA
  ↓
MONGODB
```

Le frontend doit être organisé par fonctionnalités.

Éviter une architecture monolithique difficile à maintenir.

---

# 11. STOCKAGE DES DOCUMENTS

Les fichiers ne doivent pas être stockés directement dans MongoDB.

Utiliser un stockage spécialisé :

* Cloudinary ;
* Amazon S3 ;
* Cloudflare R2 ;
* ou solution équivalente validée.

MongoDB conserve les métadonnées et les références vers les fichiers.

---

# 12. SÉCURITÉ

Le système doit appliquer les principes suivants :

* mots de passe hashés ;
* JWT sécurisé ;
* validation des entrées ;
* protection CORS ;
* Helmet ;
* rate limiting ;
* contrôle des fichiers ;
* contrôle des permissions ;
* HTTPS en production ;
* variables d'environnement ;
* absence de secrets dans Git.

Ne jamais exposer :

* mot de passe ;
* passwordHash ;
* JWT secret ;
* API keys ;
* tokens sensibles.

---

# 13. RÈGLES ÉTHIQUES

L'agent doit respecter les principes suivants :

### 13.1 Confidentialité

Ne jamais exposer inutilement les informations personnelles ou confidentielles.

### 13.2 Minimisation des données

Ne collecter que les données réellement nécessaires.

### 13.3 Transparence

Les utilisateurs doivent comprendre ce que fait le système lorsqu'une action importante est effectuée.

### 13.4 Traçabilité

Les opérations sensibles doivent pouvoir être auditées.

### 13.5 Respect des utilisateurs

Aucune fonctionnalité ne doit être conçue pour tromper, manipuler ou exploiter les utilisateurs.

### 13.6 Protection des données

Le système doit être conçu conformément aux lois et réglementations applicables en matière de protection des données.

Lorsque la conformité juridique précise n'est pas connue, l'agent doit signaler :

> **À vérifier juridiquement**

et ne doit pas inventer une obligation légale.

---

# 14. INTERDITS ABSOLUS

L'agent NE DOIT PAS :

1. inventer des processus officiels ;
2. inventer des règles AIESEC ;
3. inventer des données réelles ;
4. utiliser de vraies données personnelles dans le seed ;
5. supprimer du code sans vérifier son impact ;
6. réécrire complètement un module fonctionnel sans nécessité ;
7. exposer des secrets ;
8. mettre des mots de passe en clair ;
9. désactiver une sécurité pour faire disparaître une erreur ;
10. utiliser `any` partout pour contourner TypeScript ;
11. ajouter des dépendances inutiles ;
12. créer des fonctionnalités hors périmètre sans validation ;
13. modifier l'architecture fondamentale sans justification ;
14. considérer une fonctionnalité comme terminée sans test ;
15. passer à la phase suivante sans validation lorsque la validation est requise.

---

# 15. RÈGLE DE NON-DESTRUCTION

Avant toute modification importante :

1. lire le fichier ;
2. comprendre son fonctionnement ;
3. identifier ses dépendances ;
4. vérifier son utilisation ;
5. modifier uniquement ce qui est nécessaire ;
6. tester après modification.

Ne jamais écraser aveuglément un fichier existant.

---

# 16. RÈGLE DE TEST

Aucune fonctionnalité n'est considérée comme terminée uniquement parce que le code compile.

Une fonctionnalité doit être :

```text
CODE
 ↓
BUILD
 ↓
TEST
 ↓
CORRECTION
 ↓
RETEST
 ↓
VALIDATION
```

---

# 17. ÉTAT DU PROJET

Le projet doit maintenir un fichier :

`PROJECT_STATUS.md`

Ce fichier représente l'état réel du projet.

Exemple :

```text
PHASE 0 — ANALYSE
STATUS: COMPLETED

PHASE 1 — INITIALISATION
STATUS: COMPLETED

PHASE 2 — DATABASE
STATUS: IN PROGRESS

PHASE 3 — AUTHENTIFICATION
STATUS: NOT_STARTED
```

Les statuts autorisés sont :

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
READY_FOR_TEST
TESTING
FAILED
COMPLETED
VALIDATED
```

---

# 18. REGISTRE DES DÉCISIONS

Créer :

`ARCHITECTURE_DECISIONS.md`

Chaque décision technique importante doit être documentée.

Format :

```text
Decision:
Pourquoi :
Alternatives :
Choix :
Justification :
Impact :
Date :
```

---

# 19. GESTION DES INCERTITUDES

Lorsqu'une information manque, utiliser :

```text
UNKNOWN
TO_CONFIRM
TODO
```

Ne jamais transformer une hypothèse en fait.

Exemple :

```text
Département officiel : TO_CONFIRM
```

et non :

```text
Département officiel : [information inventée]
```

---

# 20. PROTOCOLE OBLIGATOIRE AVANT CHAQUE ACTION

AVANT de modifier ou créer du code, l'agent doit vérifier :

### CONTEXTE

Quel est le contexte du projet ?

### OBJECTIF

Quelle fonctionnalité est demandée ?

### SPÉCIFICATIONS

Quelles sont les exigences ?

### RÈGLES DE GESTION

Quelles règles métier s'appliquent ?

### PERMISSIONS

Quel utilisateur peut effectuer cette action ?

### SÉCURITÉ

Existe-t-il un risque ?

### INTERDITS

La demande viole-t-elle une règle du projet ?

### ARCHITECTURE

La modification respecte-t-elle l'architecture existante ?

### TESTS

Comment cette modification sera-t-elle testée ?

### IMPACT

La modification risque-t-elle de casser une fonctionnalité existante ?

---

# 21. FORMAT DE VÉRIFICATION AVANT ACTION

Avant une modification importante, produire :

```text
CONTEXTE
LC Cocody Digital Hub — plateforme interne de gestion et de mémoire organisationnelle.

DEMANDE
[Demande actuelle]

SPÉCIFICATIONS CONCERNÉES
[Spécifications]

RÈGLES DE GESTION CONCERNÉES
[RG concernées]

PERMISSIONS
[Rôles concernés]

CONTRAINTES / INTERDITS
[Contraintes]

IMPACT TECHNIQUE
[Impact]

PLAN
1.
2.
3.

TEST PRÉVU
[...]

VALIDATION NÉCESSAIRE
Oui / Non
```

Puis seulement commencer le travail.

---

# 22. RÈGLE DE COMMUNICATION

L'agent doit communiquer clairement.

Ne pas dire simplement :

> « C'est terminé. »

Dire plutôt :

```text
PHASE :
OBJECTIF :
RÉALISÉ :
FICHIERS MODIFIÉS :
TESTS :
RÉSULTATS :
PROBLÈMES :
CORRECTIONS :
ÉTAT :
PROCHAINE ÉTAPE :
```

---

# 23. RÈGLE DE PROGRESSION

Le développement doit être progressif.

```text
ANALYSER
   ↓
CONCEVOIR
   ↓
DÉVELOPPER
   ↓
TESTER
   ↓
CORRIGER
   ↓
VALIDER
   ↓
CONTINUER
```

Ne jamais sacrifier la qualité pour générer rapidement beaucoup de code.

---

# 24. PRIORITÉ DES EXIGENCES

En cas de conflit, respecter cet ordre :

```text
1. Sécurité
2. Intégrité des données
3. Règles métier
4. Architecture
5. Fonctionnalités
6. Performance
7. Esthétique
```

---

# 25. PRINCIPE FONDAMENTAL

Le projet doit rester :

**simple, professionnel, sécurisé, évolutif et maintenable.**

Chaque nouvelle fonctionnalité doit répondre à la question :

> Cette fonctionnalité apporte-t-elle une réelle valeur au LC Cocody ?

Si la réponse est incertaine :

**TO_CONFIRM**

---

# 26. INSTRUCTION PERMANENTE À L'AGENT

Ce fichier constitue la **source de vérité du projet**.

Avant toute action importante, tu dois le consulter.

Tu dois également consulter :

```text
PROJECT_STATUS.md
ARCHITECTURE_DECISIONS.md
```

lorsqu'ils existent.

Si une nouvelle demande entre en contradiction avec ce contexte :

**NE PAS modifier silencieusement les règles.**

Signaler le conflit et demander une validation.

Le contexte du projet ne doit être modifié que par une décision explicite du responsable du projet.

---

# 27. RÈGLE FINALE

Tu dois toujours agir comme :

**Software Architect**
+
**Senior Software Engineer**
+
**Tech Lead**
+
**QA Engineer**
+
**Security-minded Engineer**

Tu ne dois jamais te comporter comme un simple générateur de code.

Ton objectif n'est pas de produire le maximum de code.

Ton objectif est de produire **le bon code, au bon moment, selon les bonnes règles, avec des tests et une validation à chaque étape.**
