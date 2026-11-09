# LC Cocody Digital Hub — Backend

API Node.js + Express + TypeScript + Prisma (MongoDB) du LC Cocody Digital Hub.

## Prérequis

- Node.js 20+
- MongoDB en **replica set** (obligatoire pour Prisma, même en local à un seul nœud)

## Base de données locale (développement)

```bash
mkdir -p .local/mongo-data .local/mongo-logs
mongod --replSet rs0 --port 27017 \
  --dbpath .local/mongo-data \
  --bind_ip 127.0.0.1 \
  --logpath .local/mongo-logs/mongod.log --fork

mongosh --port 27017 --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "127.0.0.1:27017"}]})'
```

Puis copier les fichiers d'environnement :

```bash
cp .env.example .env
cp .env.test.example .env.test
```

## Commandes

```bash
npm run dev             # serveur de développement (http://localhost:4000)
npm run build            # build de production
npm run prisma:generate  # génère le client Prisma après modification du schéma
npm run prisma:push      # synchronise le schéma avec MongoDB (dev)
npm run prisma:seed      # données de démonstration (fictives)
npm test                 # tests (Vitest + Supertest), utilise .env.test
npm run lint / typecheck / format
```

## Notes

- `MONGODB_URI` doit toujours inclure `?replicaSet=rs0` (ou le nom du replica set utilisé).
- Les tests (`npm test`) utilisent une base séparée (`.env.test`) pour ne jamais impacter les
  données de développement — voir `tests/setup.ts`.
- En production, utiliser MongoDB Atlas (replica set géré nativement).
