# JGames

Aplicativo desktop educativo (**Electron**) com um hub de jogos de aritmética.
O primeiro módulo é o **car-math**, um jogo em que o jogador dirige um carro
para pegar a bola que contém a resposta correta de uma operação matemática.

> O módulo car-math é o único jogo implementado nesta fase. A arquitetura
> permite adicionar novos jogos como módulos independentes (ver
> ["Como adicionar um jogo"](#como-adicionar-um-jogo)).

---

## Índice

- [Objetivo](#objetivo)
- [Público e proposta](#público-e-proposta)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como executar](#como-executar)
- [Testes](#testes)
- [Como gerar o pacote](#como-gerar-o-pacote)
- [Como jogar o car-math](#como-jogar-o-car-math)
- [Controles](#controles)
- [Regras matemáticas](#regras-matemáticas)
- [Progressão de dificuldade](#progressão-de-dificuldade)
- [Pontuação e recordes](#pontuação-e-recordes)
- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Armazenamento local](#armazenamento-local)
- [Privacidade e segurança](#privacidade-e-segurança)
- [Estado de suporte das plataformas](#estado-de-suporte-das-plataformas)
- [Limitações conhecidas](#limitações-conhecidas)
- [Como contribuir](#como-contribuir)
- [Licença](#licença)

---

## Objetivo

Oferecer um conjunto de jogos educativos para crianças de **todas as idades**,
funcionando **offline**, com interface simples e acessível. O car-math treina
o cálculo mental das quatro operações de forma lúdica.

## Público e proposta

- **Público:** amplo, de crianças em alfabetização matemática a adultos.
- **Proposta:** praticar aritmética com uma mecânica de reflexo/arcade:
  cada bola numerada que desce na tela representa uma alternativa; o jogador
  deve levar o carro até a bola com a resposta certa.

## Tecnologias

- **Electron** — runtime desktop (processo principal + preload isolado).
- **HTML5 + CSS3 + JavaScript puro** — sem bundler nem framework.
- **Bootstrap 5.3.3** (CSS) distribuído **localmente** (sem CDN) para uso offline.
- **`localStorage`** — persistência local de recorde e nome do jogador.
- **node:test** — suíte de testes automatizados (runner nativo do Node.js).

## Pré-requisitos

- **Node.js 18+** (recomendado 18.19 ou superior para `node --test`).
- **npm** (vem com o Node.js).
- Acesso à internet apenas para `npm install` (o app roda offline).

## Instalação

```bash
npm install
```

## Como executar

Modo desenvolvimento:

```bash
npm start
```

O aplicativo abre em uma janela. Use o botão **⛶ Tela cheia** para alternar
entre janela normal e tela cheia (a sáida se dá pelo mesmo botão ou pela tecla
convencional do sistema).

## Testes

```bash
npm test
```

A suíte cobre: regras matemáticas (geração, faixas, distratores, validade),
progressão por fases, pontuação, armazenamento resiliente e ciclo de vida da
instância do jogo (inicialização/destruição/limpeza de recursos).

## Como gerar o pacote

Windows (plataforma principal):

```bash
npm run dist:win
```

Linux (apenas target `dir`, pré-configurado para evolução futura):

```bash
npm run dist -- --linux
```

> **Importante:** gerar o instalador Windows exige ambiente Windows (ou Linux
> com Wine/NSIS configurados). No Linux, um build Windows confiável não é
> executado e **não é simulado**. Android não é um target do electron-builder
> e exigirá uma estratégia tecnológica separada, planejada em fase futura.

## Como jogar o car-math

1. Clique em **🧮 Matemática** no menu.
2. Leia a operação no topo (ex.: `7 × 3 = ?`).
3. Mova o carro para a esquerda/direita e **encoste na bola** que mostra a
   resposta certa.
4. Cada acerto vale **10 pontos**.
5. Errou a bola **ou** deixou uma bola cair: **fim de partida**.
6. Avance de fase acumulando acertos.
7. Faça uma nova partida a qualquer momento com **🔄 Reiniciar**.

## Controles

| Ação | Teclado | Toque/Mouse |
|---|---|---|
| Mover o carro | `←` / `→` | Botões **◀ / ▶** (pressione e segure) |
| Pausar / Continuar | `Espaço` ou `P` | Botão **⏸️ Pausar** |
| Reiniciar | `R` | Botão **🔄 Reiniciar** |
| Jogar novamente (após fim) | `Enter` | Clique no botão do fim de jogo |
| Tela cheia | — | Botão **⛶ Tela cheia** |

As setas **não** provocam rolagem da página, e a área de toque não seleciona
texto nem dá zoom acidental.

### Interface adaptável

- O **menu lateral pode ser minimizado** pelo botão `« / »` no topo da barra,
  virando um trilho estreito e liberando espaço para o jogo. O estado é lembrado
  entre execuções.
- O layout se ajusta à janela: a tela do jogo **cabe sem rolagem** em janelas
  menores e o canvas escala para o espaço disponível.
- Em telas pequenas o menu vira uma faixa; minimizado, mantém-se como trilho à
  esquerda.

## Regras matemáticas

As regras são implementadas em `games/car-math/logic.js` (funções puras, com
aleatoriedade injetável para testes determinísticos).

| Modalidade | Regra |
|---|---|
| **Soma** | `a + b`, com `a,b` inteiros em `[0, f]` |
| **Subtração** | `a − b`, com `a ≥ b` — **nunca negativa** |
| **Multiplicação** | `a × b`, com `a,b` inteiros em `[0, f]` |
| **Divisão** | `a ÷ b`, com divisor `b ∈ [1, f]` e quociente `q ∈ [1, f]`; dividendo `a = b·q` — **sempre exata, sem ÷ 0** |

Onde `f` é o **fator** da fase atual (cresce com a dificuldade). Nenhuma
modalidade gera frações, decimais ou negativos.

**Distratores:** as alternativas incorretas são geradas **perto da resposta**
correta (janela proporcional à magnitude da resposta), nunca duplicadas e
nunca negativas. Isso impede que a resposta seja adivinhada por eliminação
visual (correção do defeito que deixava distratores presos em `0–19` mesmo
quando a multiplicação dava até `81`). A posição da resposta correta varia
a cada questão.

## Progressão de dificuldade

O jogo usa **fases progressivas** (8 fases, com saturação na última):

| Fase | Nome | Fator (teto de operandos) | Velocidade base |
|---|---|---|---|
| 1 | Iniciante | 5 | 1.0 |
| 2 | Aprendiz | 6 | 1.1 |
| 3 | Praticante | 9 | 1.2 |
| 4 | Ágil | 9 | 1.4 |
| 5 | Avançado | 12 | 1.5 |
| 6 | Expert | 12 | 1.7 |
| 7 | Mestre | 15 | 1.8 |
| 8 | Lenda | 20 | 2.0 |

- **Avanço:** a cada `5` acertos o jogador sobe de fase.
- **Dificuldade inicial:** `Fácil` (fase 1), `Normal` (fase 3) ou `Difícil`
  (fase 6), escolhida na tela do jogo.
- A velocidade e a faixa numérica sobem **gradativamente**.
- Ao avançar, há **feedback visual** e a partida continua de onde estava.

O seletor manual de velocidade foi **substituído** pelo sistema de fases +
dificuldade, evitando multiplicadores conflitantes e reinícios silenciosos.

## Pontuação e recordes

- **+10 pontos** por acerto (regra fixa e consistente em todas as fases).
- Erro ou bola perdida encerra a partida; **não** soma pontos.
- O recorde é o **maior placar** já alcançado no car-math.
- O recorde é atualizado **no fim da partida** e persiste entre execuções.
- Trocar operação ou dificuldade com a partida em andamento **pede
  confirmação** antes de reiniciar (nada é perdido silenciosamente).

## Estrutura de diretórios

```
index.html            Hub do aplicativo (menu, jogador, tela cheia, CSP)
main.js               Processo principal Electron (janela, IPC tela cheia)
preload.js            API mínima exposta ao renderer (contextBridge)
package.json          Scripts, dependências e config do electron-builder
css/
  vendor/bootstrap.min.css   Bootstrap 5.3.3 local (offline)
  home.css            Estilos do hub
  game.css            Estilos do car-math
js/
  storage.js          Persistência local resiliente (backend injetável)
  app.js              Registro de jogos + carregamento/ciclo de vida
games/
  car-math/
    view.html         HTML do jogo (injetado no hub)
    logic.js          Regras matemáticas puras (testáveis)
    game.js           Instância do jogo (init/destroy, render, controles)
    assets/           carro.png e fundo.jpg
test/                 Suíte automatizada (node:test)
docs/                 Relatórios técnicos
build/                Artefatos do electron-builder (não versionado)
```

### Como adicionar um jogo

1. Crie `games/<id>/` com `view.html`, um ou mais scripts e `assets/`.
2. O módulo deve expor `window[NOME_GLOBAL]` com `init()` e `destroy()`.
3. Registre o jogo em `js/app.js` (objeto `GAMES`).

O hub cuida do carregamento e da **destruição da instância anterior**
(listeners, `requestAnimationFrame` e timers são liberados).

## Armazenamento local

- `localStorage['jogo:car-math']` — `{ player, highScore, lastScore, playedAt }`.
- `localStorage['playerName']` — nome do jogador (opcional).
- A leitura **valida** os dados: JSON corrompido, tipos inesperados, pontuação
  inválida e nomes vazios/longos são saneados **sem apagar registros válidos**
  e sem derrubar o aplicativo.

## Privacidade e segurança

- Nenhum dado é enviado à rede (o app é 100% offline).
- O único dado pessoal é um **primeiro nome (opcional)** guardado localmente.
- `contextIsolation` ativado, `nodeIntegration` desativado e **CSP** restritiva
  (`script-src 'self'`, sem `unsafe-eval`).
- Sem handlers inline `onclick` (CSP compatível).

## Estado de suporte das plataformas

| Plataforma | Estado |
|---|---|
| Windows | **Principal** — instalador NSIS |
| Linux | Target `dir` pré-configurado; **não publicado nem testado** nesta fase |
| Android | **Não suportado** — exigirá estratégia tecnológica separada |

## Limitações conhecidas

- O install do `node_modules` local contém a build **Windows** do Electron;
  em outro SO, execute `npm install` novamente para baixar a build correta.
- `npm audit` reporta vulnerabilidades **apenas em dependências de
  desenvolvimento do electron-builder** (cadeia de build); **não afetam** o app
  empacotado. A correção automática foi avaliada como arriscada (alteraria
  ~178 pacotes transitivos) e ficou registrada para revisão.
- Licença da ISC presente mantida conforme `package.json`; **confirmar antes
  da publicação pública** (item acima e `docs/`).
- Origem/licença dos assets (`carro.png`, `fundo.jpg`) **não é verificável**
  no repositório; revisar antes de publicar.

## Como contribuir

1. Reporte problemas em uma issue descrevendo o comportamento esperado/real.
2. Submeta PRs pequenos e focados, com testes cobrindo as mudanças.
3. Rode `npm test` antes de abrir o PR.
4. Mantenha a arquitetura simples: sem frameworks, sem backend.

## Licença

ISC (ver `package.json`). Confirme a licença com o proprietário antes de
publicar/publicar o repositório.