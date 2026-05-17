# Essenza Bistrô — Sistema Interno de Comandas

Sistema interno de restaurante desenvolvido com arquitetura de Micro Frontends. O projeto simula o controle de mesas, comandas, cardápio e pedidos do Essenza Bistrô, usando React, JavaScript, Webpack Module Federation e comunicação desacoplada por eventos globais.

## Demonstração

### Painel principal

Visão geral do sistema com cabeçalho Essenza Bistrô, mapa de mesas, comanda e cardápio.

<p align="center">
  <img src="./screenshots/dashboard.png" alt="Painel principal do Essenza Bistrô" width="900">
</p>

### Comanda e pagamento

Detalhe da comanda operacional com cupons clicáveis, forma de pagamento, cálculo de troco, resumo financeiro e total final.

<p align="center">
  <img src="./screenshots/comanda.png" alt="Comanda e pagamento do Essenza Bistrô" width="420">
</p>

## Objetivo

O objetivo do projeto é aplicar conceitos de Micro Frontends em uma aplicação prática, separando responsabilidades em aplicações independentes e integrando tudo por meio de um container principal.

Cada micro frontend pode ser executado separadamente, mantendo autonomia de desenvolvimento, configuração e evolução.

## Arquitetura

- `container-app`: aplicação principal responsável por integrar os micro frontends, controlar o mapa de mesas e centralizar a experiência do sistema.
- `micro-cardapio`: micro frontend responsável pelo cardápio, categorias, busca de pratos, observações e envio de itens para pedido.
- `micro-pedido`: micro frontend responsável pela comanda, itens do pedido, cupons, pagamentos, troco, fechamento e limpeza da comanda.
- `shared`: pasta compartilhada com nomes de eventos, formatadores, cupons e formas de pagamento.

## Module Federation

A integração entre as aplicações é feita com Webpack Module Federation.

- `micro-cardapio` expõe o componente `CardapioApp`.
- `micro-pedido` expõe o componente `PedidoApp`.
- `container-app` consome os dois micro frontends via `remoteEntry.js`.
- `react` e `react-dom` são compartilhados como `singleton`, evitando múltiplas instâncias do React na aplicação.

## Comunicação Entre Micros

A comunicação entre os micro frontends é feita por eventos globais do navegador.

Principais eventos:

- adicionar item ao pedido;
- mesa selecionada;
- estado do pedido.

Os nomes dos eventos ficam centralizados em `shared/events.js`, reduzindo acoplamento por strings soltas entre as aplicações.

## Funcionalidades

- Mapa de mesas.
- Mapa de mesas visual.
- Status de mesa livre, ocupada e selecionada.
- Cardápio separado por categorias.
- Cardápio com busca por categoria.
- Busca de pratos em categorias com mais itens.
- Adicionar item ao pedido.
- Observações por item.
- Comanda por mesa.
- Comanda operacional.
- Remover item da comanda.
- Subtotal, desconto e total final.
- Resumo financeiro.
- Cupons `MESA10` e `ALMOCO5`.
- Cupons clicáveis.
- Formas de pagamento: PIX, crédito, débito e dinheiro.
- Pagamento com troco.
- Cálculo automático de troco para pagamento em dinheiro.
- Abertura e fechamento da comanda.
- Limpar comanda.
- Tema claro/escuro.
- Layout responsivo.

## Estrutura de Pastas

```text
microfrontends-cardapio/
├── container-app/
├── micro-cardapio/
├── micro-pedido/
├── screenshots/
├── shared/
├── package.json
└── README.md
```

## Portas

- `container-app`: http://localhost:3000
- `micro-cardapio`: http://localhost:3001
- `micro-pedido`: http://localhost:3002

## Como Executar

Na raiz do projeto:

```bash
npm install
npm run install:all
npm run start:all
```

Para rodar individualmente:

```bash
npm run start:container
npm run start:cardapio
npm run start:pedido
```

## Scripts

- `install:all`: instala as dependências do `container-app`, `micro-cardapio` e `micro-pedido`.
- `start:all`: inicia todas as aplicações em paralelo com `concurrently`.
- `start:container`: inicia somente o container principal.
- `start:cardapio`: inicia somente o micro frontend do cardápio.
- `start:pedido`: inicia somente o micro frontend da comanda/pedido.

## Tecnologias

- React
- JavaScript
- Webpack
- Webpack Dev Server
- Webpack Module Federation
- Babel
- CSS
- concurrently

## Boas Práticas Aplicadas

- Separação por responsabilidade.
- Micro frontends independentes.
- Integração por container.
- Eventos globais centralizados.
- Formatadores centralizados.
- Cupons centralizados.
- Formas de pagamento centralizadas.
- Componentização de cards, itens e resumo financeiro.
- `.gitignore` configurado para ignorar dependências, builds e logs.
- Limpeza de artefatos de build.

## Aprendizados

- Arquitetura de Micro Frontends.
- Integração por container.
- Exposição e consumo de módulos remotos.
- Comunicação desacoplada por eventos.
- Organização de monorepo.
- Reaproveitamento de código compartilhado.
- Separação de responsabilidades no React.

## Melhorias Futuras

- Criar um micro frontend de reservas.
- Criar um micro frontend administrativo.
- Criar painel de cozinha.
- Adicionar persistência com backend.
- Integrar banco de dados.
- Implementar autenticação.
- Criar histórico de comandas.
- Isolar CSS por micro frontend.
- Adicionar testes automatizados.

## Autora

**Luana Groth**

- GitHub: https://github.com/Luanagroth
- LinkedIn: https://www.linkedin.com/in/luanagroth/
- Portfólio: https://luana-groth-portfolio.vercel.app
