# Essenza Bistro

Plataforma full-stack para operação interna de restaurante e atendimento público, com arquitetura em microfrontends, backend modular e deploy em nuvem.

## Produção

- Painel interno: `https://microfrontends-cardapio-pvda.vercel.app`
- Microfrontend de comandas (remote): `https://microfrontends-cardapio-3lty.vercel.app`
- Site público: `https://microfrontends-cardapio.vercel.app`
- Backend (health): `https://microfrontends-cardapio-production.up.railway.app/api/health`
- Repositório: `https://github.com/Luanagroth/microfrontends-cardapio`

## Objetivo do projeto

- Centralizar a operação diária do restaurante em um painel único.
- Entregar uma experiência pública moderna para reservas, cardápio e currículos.
- Integrar ambos os lados com a mesma API e mesma base de dados.
- Demonstrar arquitetura escalável com microfrontends e deploy real em produção.

## Sistema de gestão interna x site público

Este projeto foi implementado como um ecossistema com duas entradas principais:

- **Sistema de gestão interna (backoffice)** para uso da operação do restaurante.
- **Site público** para uso de clientes e candidatos.

### O que é operado no sistema interno

O painel interno possui áreas editáveis e operacionais para:

- **Reservas**: acompanhamento de ativas, pendentes, confirmadas e histórico.
- **Comandas**: abertura, preenchimento de itens, descontos, pagamento e fechamento.
- **Cardápio**: criação/edição de produtos, categorias, disponibilidade e imagens.
- **Currículos**: triagem de candidaturas recebidas pelo site público.
- **Relatórios**: consolidação gerencial com exportação em PDF.

### O que entra pelo site público

O site público recebe:

- **Novas reservas**
- **Envio de currículos em PDF**

Essas entradas são enviadas para o backend e aparecem automaticamente no sistema interno.

### Integração entre as duas frentes

- Reservas e currículos criados no site público são refletidos no painel interno.
- O cardápio exibido no site público é controlado pelo módulo de **gestão de cardápio** do sistema interno.
- As comandas são preenchidas no sistema interno com base no cardápio atual salvo no backend.
- Toda atualização ocorre pela API central, mantendo os dois lados sincronizados.

## Preview

### Sistema interno

1. Login administrativo  
![Login interno](./screenshots/Login-interno.png)

2. Painel geral  
![Painel interno](./screenshots/dashboard.png)

3. Mapa de mesas  
![Mapa de mesas](./screenshots/mapa-mesas.png)

4. Comanda aberta  
![Comanda aberta](./screenshots/comanda.png)

5. Comanda (pagamento e fechamento)  
![Comanda pagamento](./screenshots/comanda-pagamento.png)

6. Gestão de cardápio  
![Gestão de cardápio](./screenshots/gestao-cardapio.png)

7. Relatórios  
![Relatórios](./screenshots/relatorios.png)

8. Currículos recebidos  
![Currículos](./screenshots/curriculos.png)

### Site público

9. Home (primeira parte)  
![Site publico home](./screenshots/publico-home-1.png)

10. Home (segunda parte)  
![Site publico home 2](./screenshots/publico-home-2.png)

11. Reservas  
![Site publico reservas](./screenshots/publico-reservas.png)

12. Currículos e contato  
![Site público currículos e contato](./screenshots/publico-curriculos-contato.png)

## Funcionalidades implementadas

- Login administrativo com perfil e bloco de suporte.
- Painel central com indicadores de turno, reservas e comandas.
- Mapa visual de mesas com status (disponível, em atendimento, aguardando pagamento).
- Comandas com:
  - seleção de itens reais do cardápio
  - quantidade, subtotal e total
  - cupons e descontos
  - formas de pagamento e troco
  - historico de comandas salvas
- Gestão de cardápio com categorias, disponibilidade e imagens.
- Relatórios operacionais com filtros por período e exportação em PDF.
- Histórico de currículos recebidos com visualização de PDF no painel interno.
- Site público com:
  - cardápio
  - formulário de reservas
  - formulário de currículos (PDF)
  - seção de contato

## Atualizações e desafios superados

- Reestruturação de navegação por páginas no painel interno.
- Ajustes de UX no fluxo de comandas e historicos.
- Integração completa público <-> interno via API única.
- Correção de CORS entre domínios Vercel (produção e preview).
- Correção de fallback indevido para `localhost` em produção.
- Correção de `404` de assets no build do frontend público.
- Correção de mixed content para imagens em ambiente HTTPS.
- Correção de inicialização de banco em produção no Railway.

## Stack técnica

- React 18
- Webpack 5
- Module Federation
- Node.js
- Express
- Prisma ORM
- SQLite
- Multer
- Helmet
- Playwright
- Node test runner / testes unitários por app
- Vercel (frontends)
- Railway (backend)
- GitHub (controle de versão e publicação do código)

## Arquitetura do projeto

```text
microfrontends-cardapio/
  backend/                 # API, regras de negócio, prisma, uploads, testes
  container-app/           # Sistema interno (host)
  micro-pedido/            # Microfrontend de comandas (remote)
  public-client/           # Site público
  shared/                  # Contratos e utilitários compartilhados
  tests/                   # E2E (Playwright)
```

## Responsabilidades e organização (Clean Code / SOLID)

- Separação por contexto de negócio no backend (`modules/*`).
- Fronteiras claras entre apps frontend.
- Reuso de contratos em `shared/` para reduzir duplicação.
- Componentes e serviços com responsabilidade única.
- Estrutura orientada a manutenção incremental e baixo acoplamento.

## Rodando localmente

Pré-requisitos:

- Node.js 18+ (recomendado 20+)
- npm 9+

Comandos:

```bash
npm install
npm run install:all

cd backend
npx prisma migrate deploy
npm run seed
cd ..

npm run start:all
```

Portas locais:

- `http://localhost:3000` (interno)
- `http://localhost:3002` (micro-pedido)
- `http://localhost:4000` (backend)
- `http://localhost:4001` (público)

## Qualidade e testes

Comandos principais:

```bash
npm run test:all
npm run test:backend
npm run test:container
npm run test:pedido
npm run test:public
npm run test:e2e
```

## Deploy (Vercel + Railway)

- Frontends publicados separadamente na Vercel (um projeto por app).
- Backend publicado no Railway com:
  - `DATABASE_URL=file:./dev.db`
  - `MENU_ASSET_BASE=https://microfrontends-cardapio.vercel.app/assets/images/menu`
  - `ALLOWED_ORIGINS` configurado para domínios Vercel
  - start command: `npm run start:prod`

## Roadmap

- Autenticação real com usuários e perfis por permissão.
- Monitoramento de erros e auditoria operacional.
- Evolução de relatórios com séries comparativas.
- Otimização offline/PWA com estratégia de cache versionada.

## Contato

- GitHub: [github.com/Luanagroth](https://github.com/Luanagroth)
- LinkedIn: [linkedin.com/in/luanagroth](https://www.linkedin.com/in/luanagroth)
- E-mail: [luanaeulalia56@gmail.com](mailto:luanaeulalia56@gmail.com)
