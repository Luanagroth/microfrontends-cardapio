# Backend - Essenza Bistro

API REST do projeto, responsavel por regras de negocio, persistencia de dados, uploads e integracao entre frontends interno/publico.

## Stack

- Node.js + Express
- Prisma ORM
- SQLite (ambiente local)
- Multer (upload de arquivos)
- Helmet (headers de seguranca)
- Dotenv (configuracao por ambiente)

## Estrutura

```text
backend/
  prisma/
    schema.prisma
    migrations/
    dev.db
  src/
    app.js
    index.js
    modules/
      reservations/
      orders/
      products/
      categories/
      curriculums/
      uploads/
    utils/
      httpErrors.js
  tests/
    app.test.js
```

## Responsabilidades por modulo

- `reservations`
  - Criacao/listagem e status de reservas.
- `orders`
  - Criacao/edicao de comandas, itens, totais e status.
- `products`
  - Catalogo de produtos do cardapio.
- `categories`
  - Classificacao de produtos.
- `curriculums`
  - Envio de curriculos (PDF), listagem e status.
- `uploads`
  - Upload de imagens de produto.
- `utils/httpErrors.js`
  - Normalizacao de erros de validacao para `400`.

## Banco de dados

- Arquivo local: `prisma/dev.db`
- Provider: `sqlite`
- Schema: `prisma/schema.prisma`
- Migracoes versionadas: `prisma/migrations`

## Como rodar localmente

```bash
cd backend
npm install
copy .env.example .env
npx prisma migrate deploy
npm run dev
```

Variaveis de ambiente:

- `PORT` (padrao: `4000`)
- `DATABASE_URL` (padrao: `file:./dev.db`)
- `ALLOWED_ORIGINS` (lista separada por virgula para CORS)

API disponivel em:

- `http://localhost:4000`

Healthcheck:

- `GET http://localhost:4000/api/health`

## Testes

Executar testes do backend:

```bash
cd backend
npm run test
```

## Backup do banco local

Gerar backup do SQLite com timestamp:

```bash
cd backend
npm run backup:db
```

Destino dos arquivos:

- `backend/backups/*.db`

## Endpoints principais

- `GET /api/health`
- `GET /api/reservations`
- `POST /api/reservations`
- `PATCH /api/reservations/:id/status`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `PUT /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `DELETE /api/orders/:id`
- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/categories`
- `GET /api/curriculums`
- `POST /api/curriculums`
- `PATCH /api/curriculums/:id/status`
- `POST /api/uploads/products`

## Observacoes

- Upload de curriculo aceita apenas PDF.
- Para abrir o banco em ferramenta externa (DBeaver/DB Browser), pode ser necessario parar o backend para evitar lock no arquivo SQLite.
