# Essenza Bistro - Plataforma de Operacao e Atendimento

Sistema completo para operacao interna do restaurante e experiencia publica do cliente, com arquitetura em microfrontends e backend modular.

## 1) O que foi construido

- Painel interno (gestao): reservas, mapa de mesas, comandas, gestao de cardapio, relatorios e curriculos.
- Site publico: visualizacao de cardapio, envio de reservas e envio de curriculo (PDF).
- API backend: persistencia de dados, regras de negocio, uploads e integracao entre painel interno e site publico.
- Banco local de desenvolvimento em SQLite com Prisma.

## 2) Tecnologias utilizadas e por que

- React 18
  - Interface reativa e componentizada para os 3 frontends.
- Webpack 5 + Module Federation
  - Permite separar o sistema em apps independentes com responsabilidade clara.
- Node.js + Express
  - API REST simples, performatica e facil de manter.
- Prisma ORM
  - Camada de acesso a dados tipada e migrations versionadas.
- SQLite (dev local)
  - Banco leve para ambiente local, sem necessidade de servidor dedicado.
- Multer
  - Upload de arquivos (curriculos PDF e imagens de produtos).
- Vitest + Node test runner
  - Testes automatizados de frontend (Vitest) e backend (node:test).

## 3) Arquitetura de pastas

```text
microfrontends-cardapio/
  backend/               # API, regra de negocio, prisma, uploads e testes
  container-app/         # Painel interno (porta 3000)
  micro-pedido/          # Microfrontend de comandas (porta 3002)
  public-client/         # Site publico (porta 4001)
  shared/                # Utilitarios e contratos compartilhados
  package.json           # Orquestracao de scripts na raiz
```

## 4) Responsabilidades por modulo

- `backend/src/modules/reservations`
  - Criacao, listagem e atualizacao de status de reservas.
- `backend/src/modules/orders`
  - Fluxo de comandas, itens, totais, descontos e status.
- `backend/src/modules/products` e `backend/src/modules/categories`
  - Catalogo do cardapio e organizacao por categorias.
- `backend/src/modules/curriculums`
  - Recebimento, listagem e status de curriculos enviados.
- `backend/src/modules/uploads`
  - Upload de imagem de produto.
- `container-app/src/components`
  - Telas do sistema interno por contexto de negocio.
- `micro-pedido/src`
  - Operacao de comanda ativa + historico/demonstrativo.
- `public-client/src/components`
  - Fluxos publicos do cliente (reservas, cardapio e trabalhe conosco).
- `shared/`
  - Reuso de contratos e helpers (`apiBase`, eventos, formatadores, cupons e pagamentos).

## 5) Portas do projeto

- `http://localhost:3000` -> painel interno
- `http://localhost:3002` -> microfrontend de comandas
- `http://localhost:4000` -> backend/API
- `http://localhost:4001` -> site publico

## 6) Pre-requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+

## 7) Passo a passo para rodar o projeto

### 7.1 Instalar dependencias

Na raiz:

```bash
npm install
npm run install:all
```

### 7.2 Preparar banco (backend)

```bash
cd backend
npx prisma migrate deploy
cd ..
```

Opcional (popular catalogo inicial):

```bash
cd backend
npx prisma db seed
cd ..
```

### 7.3 Subir todo o ambiente

```bash
npm run start:all
```

## 8) Scripts principais

### Execucao

- `npm run start:all`
- `npm run start:backend`
- `npm run start:container`
- `npm run start:pedido`
- `npm run start:public`

### Testes

- `npm run test:all`
- `npm run test:backend`
- `npm run test:container`
- `npm run test:pedido`
- `npm run test:public`
- `npm run test:e2e`

## 9) Banco de dados (acesso rapido)

- Tipo: `SQLite`
- Arquivo: `backend/prisma/dev.db`

Para abrir no DBeaver:

1. Nova conexao
2. Driver `SQLite`
3. Selecionar o arquivo `backend/prisma/dev.db`
4. Testar conexao e concluir

## 10) Fluxo de dados (resumo)

1. Cliente usa o `public-client` (reserva/curriculo).
2. Requisicoes vao para o `backend` (`/api/...`).
3. Dados persistem no `SQLite` via Prisma.
4. Painel interno (`container-app` + `micro-pedido`) consome a mesma API e reflete os dados em tempo de operacao.

## 11) Boas praticas aplicadas

- Separacao de responsabilidades por dominio.
- Reuso de utilitarios compartilhados em `shared/`.
- Validacoes de entrada no backend com retorno HTTP coerente (`400` para erro de validacao).
- Cobertura de testes automatizados para backend e frontends.
- Estrutura preparada para evolucao incremental sem acoplamento forte entre modulos.

## 12) Operacao em producao (base)

- Backend com leitura de ambiente via `.env` (`dotenv`).
- CORS configuravel por variavel `ALLOWED_ORIGINS`.
- Headers de seguranca basicos com `helmet`.
- Script de backup local do SQLite:

```bash
cd backend
npm run backup:db
```

Arquivos de backup sao gerados em `backend/backups/`.
