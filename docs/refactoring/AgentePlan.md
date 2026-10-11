Segue abaixo o relatório da auditoria feita pelo Opencode do projeto, já com os questionamentos da seção 16 respondidas por mim.

# RELATÓRIO DE AUDITORIA TÉCNICA — Projeto Joguinho-Gui / JGames

> Auditoria realizada exclusivamente em modo de leitura. Nenhum arquivo foi criado, alterado ou removido. Nenhuma dependência foi instalada. Nenhum comando Git destrutivo foi executado.

---

## 1. Resumo executivo

O projeto é um **aplicativo desktop Electron** (não um site) que empacota uma pequena aplicação web de jogos educativos infantis. Existe **um único jogo implementado**: `car-math`, em que o jogador controla um carro na base de um canvas e deve colidir com a bola que contém a resposta correta de uma operação aritmética. Aplica-se pontuação, recorde local via `localStorage` e seleção de operação (soma, subtração, multiplicação, divisão).

O código é pequeno (**13 arquivos rastreados, ~792 linhas**), vanilla JavaScript, sem framework, sem TypeScript, sem backend, sem banco de dados, **sem nenhum teste automatizado e sem documentação**. O histórico Git contém **apenas um commit** (`bd73927 first commit`), portanto não há histórico útil de funcionalidades removidas.

Foram identificados **bugs confirmados** — em especial um `ReferenceError` em `main.js` que impede o modo tela cheia, e um vazamento de listeners/loops de animação ao recarregar o jogo. Há ainda uma **hipótese de alta prioridade** (carregamento de `view.html` via `fetch()` em contexto `file://`) que não pôde ser confirmada sem executar o app.

O veredito geral é: **a base é aproveitável**. O escopo é pequeno e a arquitetura (menu -> jogo modular) é razoável para o tamanho. O caminho de menor risco é corrigir os bloqueadores, isolar a lógica matemática para permitir testes e evoluir incrementalmente, **sem** introduzir frameworks, backend ou TypeScript.

---

## 2. Identificação do projeto

| Campo | Valor |
|---|---|
| Nome | `jgames` / produto `JGames` |
| Descrição (`package.json:5`) | "Jogos para crianças" |
| Autor | João Guimarães |
| Versão | 1.0.0 |
| Licença | ISC |
| Plataforma alvo | Windows (NSIS) |
| Branch ativa | `master` |
| Working tree | limpa (`nothing to commit, working tree clean`) |
| Commits | 1 (`bd73927 first commit`, 2026-02-01) |
| Idioma do conteúdo | pt-BR |
| Artefato já gerado | `build/JGames Setup 1.0.0.exe` (~96 MB) |

---

## 3. Arquitetura e tecnologias encontradas

### 3.1 Stack

- **Runtime/empacotamento:** Electron `^40.1.0` (instalado 40.1.0) + `electron-builder ^26.7.0` (`package.json:13-15`). Scripts: `start` -> `electron .`; `dist` -> `electron-builder` (`package.json:7-9`).
- **Frontend:** HTML + CSS + JavaScript puro (sem bundler, sem transpilador). **Sem TypeScript.**
- **CSS:** Bootstrap 5.3.3 via **CDN** (`index.html:7-10`) + `css/home.css`.
- **Backend:** inexistente.
- **Banco de dados:** inexistente. Persistência via `localStorage`.
- **Assets locais:** `games/car-math/assets/carro.png`, `games/car-math/assets/fundo.jpg`, `icon.ico`.

### 3.2 Estrutura de diretórios (arquivos rastreados)

```
.gitignore
index.html              → shell da aplicação / menu de jogos
main.js                 → processo principal Electron
preload.js              → preload (apenas log)
package.json
css/home.css
js/app.js               → bootstrap do jogador + loadGame()
js/storage.js           → GameStorage (localStorage)
games/car-math/view.html→ HTML do jogo injetado dinamicamente
games/car-math/game.js  → lógica do jogo car-math
games/car-math/assets/  → carro.png, fundo.jpg
icon.ico
```

Diretórios ignorados (`git status --ignored`): `build/`, `node_modules/`, `package-lock.json` (`.gitignore:1-4`).

Observação: `package-lock.json` está presente e **é ignorado pelo Git** — escolha incomum (normalmente é versionado).

### 3.3 Fluxo de inicialização

1. `main.js:16` -> `app.whenReady().then(createWindow)` cria `BrowserWindow` 1200x800 com `preload`.
2. `main.js:13` -> `win.loadFile("index.html")`.
3. `index.html:57-58` carrega `js/storage.js` e `js/app.js`.
4. `js/app.js:3-18` executa `initPlayer()`: se não houver `localStorage.playerName`, usa `prompt()`.
5. Ao clicar em "🧮 Matemática" (`index.html:24`), `loadGame('car-math')` faz `fetch('games/car-math/view.html')`, injeta o HTML em `#content-area` e anexa `games/car-math/game.js` ao `<body>` (`js/app.js:21-54`).
6. `game.js:1-337` IIFE pega o canvas, carrega imagens e inicia o loop quando as duas imagens terminam (`game.js:315-326`).

### 3.4 Dependências externas em runtime

- **CDN jsdelivr** para Bootstrap (`index.html:8`) — dependência de rede para o estilo/navegação. Em contexto offline (provável para uso infantil) o CSS não carrega.
- Sem scripts de terceiros além do Bootstrap (que é apenas CSS; o JS do Bootstrap não é incluído).

### 3.5 Build e publicação

- `package.json:17-30`: `appId`, `productName: "JGames"`, saída em `build/`, target Windows NSIS com `icon.ico`.
- `build/builder-effective-config.yaml`: `electronVersion: 40.1.0`.
- Sem targets para macOS/Linux. Sem automação de CI/CD. Sem versionamento de release além do `v1.0.0` fixo no menu (`index.html:39`).

---

## 4. Reconstrução da ideia original

**Conceito inferido (fundamentado no código):** um "hub" desktop de jogos educativos para crianças, começando por um jogo de aritmética mental. O jogador move um carro horizontalmente na base de uma pista; descem bolas numeradas e ele deve interceptar a que corresponde à resposta correta, enquanto evita as demais. A metáfora de "arcade/reflexo" mistura cálculo mental com coordenação motora.

**Público-alvo inferido:** crianças em fase de alfabetização matemática (a descrição diz "Jogos para crianças"; uso de emojis, números pequenos 0–9, prompt "Qual é o nome da criança?").

Classificação das 17 perguntas da Fase 2:

| # | Pergunta | Classificação | Evidência |
|---|---|---|---|
| 1 | Objetivo educacional | **INFERÊNCIA FUNDAMENTADA** — prática de aritmética básica (4 operações) para crianças | `game.js:71-101`, `package.json:5` |
| 2 | Público-alvo | **INFERÊNCIA FUNDAMENTADA** — crianças | `package.json:5`; `app.js:7`; emojis |
| 3 | Ciclo principal de jogo | **IMPLEMENTADO E CONFIRMADO** — pergunta -> dirigir carro -> colidir com resposta -> nova pergunta | `game.js:71-130`, `game.js:133-158` |
| 4 | Apresentação dos desafios | **IMPLEMENTADO** — texto no título + bolas numeradas | `game.js:107-108`, `game.js:122-129` |
| 5 | Como o jogador responde | **IMPLEMENTADO** — colisão física do carro com a bola | `game.js:139-153` |
| 6 | Verificação da resposta | **IMPLEMENTADO** — igualdade estrita `ball.value === correctAnswer` | `game.js:145` |
| 7 | Pontuação | **IMPLEMENTADO** — +10 por acerto | `game.js:146-147` |
| 8 | Contagem de tempo | **NÃO ENCONTRADO** como timer; há pressão indireta (bola cai e o jogo termina) | `game.js:155-157` |
| 9 | Níveis/fases/progressão | **NÃO ENCONTRADO** — apenas seletor manual de velocidade | `view.html:43-52` |
| 10 | Vidas/tentativas/penalidades | **PARCIALMENTE** — erro = fim imediato (sem vidas) | `game.js:151` |
| 11 | Feedback correto/incorreto | **PARCIALMENTE** — acerto incrementa score sem mensagem; erro encerra | `game.js:145-152` |
| 12 | Recordes/ranking | **IMPLEMENTADO** — recorde local único (1 jogador por jogo) | `js/storage.js:11-24`, `game.js:295-305` |
| 13 | Persistência de progresso | **PARCIALMENTE** — persiste *recorde e nome*, não progresso de fases | `js/storage.js:2-24` |
| 14 | Múltiplos jogadores/perfis | **IDENTIFICADO, MAS NÃO IMPLEMENTADO** — só guarda um nome global | `app.js:4-15`, `game.js:252-273` |
| 15 | Gamificação/recompensa | **PARCIALMENTE** — apenas pontuação + "🏆 NOVO RECORDE" | `game.js:226-232` |
| 16 | Uso em dispositivos móveis | **NÃO ENCONTRADO** — canvas só aceita teclado; sem toque | `game.js:45-56` |
| 17 | Jogar sem cadastro/auth | **IMPLEMENTADO** — não há autenticação; `prompt` opcional com fallback "Jogador" | `app.js:3-18` |

Modo "free" (temática livre) aparece **comentado** (`game.js:103-105`, `game.js:144`) mas é referenciado no código ativo (`game.js:111`) — **abandonado/incompleto**.

---

## 5. Inventário das funcionalidades

| Funcionalidade | Estado |
|---|---|
| Menu de jogos (hub) | Implementado (1 jogo + 2 botões "Em breve" desabilitados) — `index.html:19-44` |
| Navegação/carregamento dinâmico de jogo | Implementado — `js/app.js:21-54` |
| Jogo `car-math` — soma | Implementado — `game.js:78-81` |
| Jogo `car-math` — subtração (sem negativos) | Implementado — `game.js:83-87` |
| Jogo `car-math` — multiplicação | Implementado — `game.js:89-92` |
| Jogo `car-math` — divisão (inteira) | Implementado — `game.js:94-101` |
| Seleção de velocidade | Implementado — `view.html:43-52`, `game.js:66-69` |
| Pausa | Implementado — `game.js:58-64` |
| Reinício (botão + clique no canvas) | Implementado — `game.js:53-56`, `game.js:281-293` |
| Recorde em `localStorage` | Implementado — `js/storage.js` |
| Modal de novo recorde | Implementado — `view.html:110-131`, `game.js:252-273` |
| Modo "free" | **Incompleto/abandonado** (código comentado) — `game.js:103-105,144` |
| Tela cheia | **Bugado** (código inalcançável) — `main.js:18-21` |
| Suporte a múltiplos jogos | Parcial (infra pronta, só 1 jogo) |
| Toque/mobile | Não implementado |
| Testes | Inexistente |
| Documentação | Inexistente |

---

## 6. Auditoria funcional

### 6.1 Geração de desafios (`game.js:71-130`) — CONFIRMADO

- `a` e `b` aleatórios em `0..9` (`game.js:74-75`).
- **Subtração:** troca garante `a >= b`, evitando resultados negativos (`game.js:84`). OK
- **Multiplicação:** `a,b` em `0..9` -> resposta em `0..81` (`game.js:90`).
- **Divisão:** divisor `1..9`, quociente `1..10`, dividendo derivado `a = b·quociente` -> divisão sempre exata (`game.js:96-98`). OK
- **Distratores:** gerados em `0..19`, sem repetir (`game.js:113-116`).

### 6.2 Problema confirmado — distratores de multiplicação/dificuldade

Como os distratores são sempre `0..19` e a multiplicação pode gerar respostas até `81`, a resposta correta frequentemente é **o único número maior que 19** na tela, permitindo acerto por eliminação visual sem calcular (`game.js:89-92` vs `game.js:113-116`). **Impacto educacional significativo** (fura a proposta pedagógica no modo mais difícil).

### 6.3 Condições de corrida / estado — CONFIRMADO

- Em `update()` (`game.js:133-158`), ao definir `gameOver = true` por colisão errada, o `for` **continua** iterando as demais bolas; novas colisões podem reatribuir `gameOver`/disparar lógica redundante no mesmo frame. Baixo impacto visual, mas sintoma de estado não protegido.
- `update()` retorna imediatamente só no caso de acerto (`game.js:149`). Não há `break` no caso de erro.
- `paused` e `gameOver` são checados apenas no topo de `update` (`game.js:134`), não após mutação dentro do loop.

### 6.4 Cálculo e validação de respostas — CONFIRMADO

- Comparação por identidade numérica (`game.js:145`). Funciona para os inteiros gerados.
- **Não há suporte a negativos, frações ou decimais** — e, na geração atual, também não é necessário (subtração evita negativos, divisão é exata). Qualquer evolução nesse sentido exigiria novo modelo de resposta (a resposta é uma bola, não texto livre).
- O código "free" (`game.js:111`) usaria distratores fixos `[1,2,3]`, mas a validação para ele está comentada — inócuo hoje.

### 6.5 Controle de pontuação / temporizador — CONFIRMADO

- `score += 10` por acerto (`game.js:146`).
- Sem timer explícito; o fim de jogo ocorre quando uma bola errada é apanhada **ou** quando qualquer bola passa o fundo (`game.js:151`, `game.js:155-157`).

### 6.6 Persistência — CONFIRMADO

- `GameStorage.get/save/updateScore` (`js/storage.js:1-25`) manipula `localStorage['jogo:car-math']` e `localStorage['playerName']`.
- `updateScore` faz `Math.max(score, highScore)` (`storage.js:14`) — correto.
- Não trata `JSON.parse` corrompido (poderia lançar em `storage.js:4`).

### 6.7 Tratamento de erros — PARCIAL

- `loadGame` tem `try/catch` e mostra "Em breve" em falha (`app.js:25-54`). OK
- `GameStorage.get` e `saveRecordName` não têm `try/catch` para JSON inválido / localStorage indisponível.

### 6.8 Eventos de teclado / mouse / toque — CONFIRMADO (com falha)

- Teclado: `ArrowLeft`/`ArrowRight` (`game.js:45-51`). **Sem `preventDefault`** -> as setas podem rolar a página.
- Mouse: clique no canvas reinicia após fim de jogo (`game.js:53-56`).
- **Toque: inexistente.** Em telas sem teclado físico (celular/tablet) o carro é incontrolável.

### 6.9 Comportamento em diferentes resoluções — PARCIAL

- Canvas fixo 900x400 (`game.js:10-11`); CSS `width:100%; height:auto` (`home.css:50-55`) -> escala visual, mantendo proporção. Coordenadas lógicas fixas, colisões inalteradas. Aceitável, embora haja `padding-right:90px` fixo para acomodar o menu lateral (`home.css:39-44`) e media query para <768px (`home.css:106-123`).

### 6.10 Exploits / vantagens indevidas

1. **Eliminação visual** na multiplicação (item 6.2).
2. **Troca de velocidade/modo no meio do jogo reseta a pontuação** (`setSpeed` e `setMode` chamam `restartGame()` — `game.js:66-69,276-279`). Não é "exploit" para ganhar pontos, mas é comportamento inesperado e inconsistente.
3. Não foi encontrado mecanismo para inflar pontuação artificialmente; recorde é *melhor pontuação* (`Math.max`), sem validação de integridade — aceitável no contexto local.

### 6.11 O que NÃO foi possível verificar

- **Execução real do app** (ambiente sem display; rodar Electron seria uma ação de execução pesada). Portanto: navegação, renderização e a hipótese de `fetch` `file://` (item 11, R-01) **não foram testadas em runtime**.

---

## 7. Qualidade e arquitetura do código

### 7.1 Pontos positivos

- Escopo pequeno e legível; `game.js` organizado em seções comentadas (`game.js:15,22,35,44,70,132,180,251,275,307,314,328`).
- Separação razoável: hub (`app.js`) / storage (`storage.js`) / jogo (`game.js`).
- API explícita do jogo, evitando poluir o escopo global com várias funções (`game.js:329-334`).
- `preload.js` presente e `webPreferences` sem `nodeIntegration:true` (defaults seguros preservados) — `main.js:8-10`.

### 7.2 Problemas

- **Acoplamento UI + lógica matemática + renderização** no mesmo IIFE (`game.js:1-337`). Impossibilita testar a geração/validação da matemática isoladamente.
- **Bug crítico `main.js:18-21`:** dentro de `window-all-closed`, chama `win.setFullScreen(true)` onde `win` **não existe nesse escopo** (é local de `createWindow`, `main.js:5`). Efeitos: (a) `ReferenceError` durante o fechamento; (b) a intenção de tela cheia **nunca é executada** (está após `app.quit()` e no callback errado).
- **Vazamento de listeners e loops (confirmado por inspeção):** `loadGame` remove o `<script>` do jogo (`app.js:33-36`), mas (a) o listener `document.addEventListener("keydown", ...)` adicionado em `game.js:45` **permanece** ao remover o script; (b) o `requestAnimationFrame(loop)` (`game.js:308-312`) **nunca é cancelado**. Clicar repetidamente em "Matemática" empilha loops e listeners concorrentes, mantendo closures antigas vivas (consumo crescente de CPU/memória).
- **Uso de `onclick` inline no HTML** (`index.html`, `view.html`) misturando marcação e comportamento; dificulta CSP e manutenção.
- **Código morto/incompleto:** modo "free" (`game.js:103-105,111,144`), botões desabilitados "Em breve" duplicados (`index.html:28-36`).
- **Global implícito:** `window.carMath` (`game.js:329-334`) é criado e nunca limpo por `loadGame`.
- **Ausência de `try/catch`** em `storage.js:4` e `game.js:253-258` para dados corrompidos.
- **Nomes:** adequados no geral (`correctAnswer`, `ballSpeed`, `gameOverHandled`); alguns ambíguos (`a`, `b`).
- **Sem const/let consistente?** Usa `let`/`const` corretamente; sem `var`. OK.
- **Delimitação de responsabilidades do conteúdo dinâmico:** `content.innerHTML = await response.text()` (`app.js:30`) injeta HTML de jogo — aceitável pois o conteúdo é local, mas combina mal com futura CSP estrita.

### 7.3 Código morto / referências

- Não foram encontrados imports quebrados nem referências a arquivos inexistentes entre os existentes.
- `preload.js` só faz `console.log` (`preload.js:1-3`), sem uso funcional.
- Bootstrap JS não é carregado; apenas o CSS. Sem componentes dependentes de JS, não há erro — mas é dependência de rede evitável.

### 7.4 Dependências desatualizadas / vulnerabilidades

- **Não avaliado** (exigiria `npm audit`/instalação — proibido nesta fase). Registrar como pendência.

---

## 8. Interface e experiência do jogador

| Aspecto | Avaliação | Evidência |
|---|---|---|
| Clareza das instruções | **Fraca** — nenhuma instrução textual de como jogar (setas, objetivo) | `view.html:1-107` |
| Iniciar partida | Fácil (1 clique no menu) | `index.html:23-26` |
| Legibilidade da questão | Boa (título grande, `h2`) | `view.html:1-3`, `game.js:108` |
| Hierarquia visual | Razoável (Bootstrap + sidebar) | `index.html`, `home.css` |
| Feedback após resposta | **Fraco** — acerto silencioso; erro = GAME OVER sem explicação | `game.js:145-157,210-248` |
| Clareza de pontuação/progresso | Pontuação visível; **progresso (níveis) inexistente** | `view.html:14-35` |
| Reiniciar/continuar | Duas formas, mas **"Clique para jogar novamente"** só funciona depois do fim de jogo | `game.js:53-56,242-247` |
| Consistência visual | Razoável | `home.css` |
| Responsividade | Parcial (media query <768px) | `home.css:106-123` |
| Celular/tablet | **Não jogável** — sem toque | `game.js:45-56` |
| Acessibilidade por teclado | Parcial (só movimento; sem foco/ARIA; canvas sem alternativa textual) | `view.html:12`, `game.js` |
| Contraste/tamanho | Adequado em geral | `home.css`, `view.html` |
| Estados de carregamento/erro | "Em breve" no erro de fetch; sem spinner | `app.js:46-53` |
| Clareza de fim de partida | Boa (overlay GAME OVER) | `game.js:210-248` |

**Problemas reais de usabilidade (não estéticos):**
1. Ausência de instruções — criança não sabe que usa as setas.
2. Trocar modo/velocidade apaga a pontuação sem aviso (`game.js:66-69,276-279`).
3. Sem feedback educativo no erro (oportunidade pedagógica perdida).
4. Interação exclusiva por teclado (exclui tablets/celulares).
5. Menu lateral `position:fixed` de 90px (`home.css:88-98`) pode sobrepor conteúdo em telas menores.

**Melhorias opcionais (não bloqueadoras):** aviso antes de resetar, animação de acerto, sons.

---

## 9. Segurança e privacidade

| Item | Avaliação | Evidência |
|---|---|---|
| `innerHTML` com dados de usuário | **Não encontrado** — `innerHTML` só recebe HTML local de jogo (`app.js:30`) e texto fixo (`app.js:48-53`) | — |
| XSS via nome do jogador | **Baixo** — nome exibido via `innerText` (`game.js:299`) e `title.innerText` (`game.js:108`) | `game.js:252-273` |
| Injeção via `prompt` | Baixo (armazenado e exibido por `innerText`) | `app.js:7-14` |
| Dados persistidos | Apenas `playerName` (texto livre) e `jogo:car-math` (JSON) em `localStorage` | `js/storage.js` |
| Exposição de segredos | Nenhum token/senha/credencial encontrado no repositório | — |
| Scripts de terceiros | Apenas CSS Bootstrap de CDN (`index.html:8`) — não executa JS remoto | — |
| Vulnerabilidades de dependências | **Não avaliado** (exigiria auditoria de dependências) | — |
| CSP | **Ausente** — sem meta CSP; há `onclick` inline | `index.html`, `view.html` |
| Contexto Electron | Defaults seguros mantidos (sem `nodeIntegration`) | `main.js:8-10` |

**Classificação geral:** superfície de ataque **muito baixa**. Por estar 100% local, sem backend e sem coleta de dados sensíveis (apenas um primeiro nome, opcional), **não se justifica classificá-lo como inseguro**. O único ponto a observar é que, se dados de crianças forem coletados no futuro, aplicam-se considerações de privacidade/LGPD — hoje não há coleta além do nome local.

---

## 10. Testes e testabilidade

- **Testes existentes:** nenhum. Não há diretório `test/`, scripts de teste em `package.json`, nem config de runner.
- **Testabilidade atual:** **baixa**. Toda a lógica matemática está presa a um IIFE que depende de DOM/canvas (`game.js:1-337`). Não há funções exportadas nem módulos.
- **O que é testável hoje sem alterar nada:** praticamente nada de forma automatizada além de validações manuais.

**Estratégia incremental proposta (sem instalar nada ainda):**

1. Extrair funções puras para um arquivo separado (ex.: `games/car-math/logic.js`) com `newQuestionData(mode)` e `checkAnswer(ball, correctAnswer)` retornando dados — sem tocar no DOM.
2. Usar o **test runner nativo do Node** (`node:test`), já disponível, sem novas dependências, para cobrir:
   - Geração: subtração nunca negativa; divisão sempre exata; distratores únicos e ≠ resposta; faixas corretas.
   - Validação de resposta.
   - Regra de pontuação (+10).
   - Amplitude/dificuldade (distratores escalarem com a operação) — teste que hoje **falharia**, documentando o bug 6.2.
3. Testes de UI (opcional): Playwright/Spectron são dependências novas -> **registrar como pendência**, não instalar.

**Conjunto mínimo de confiança:** 1 arquivo de testes cobrindo geração/validação/pontuação (lógica pura). Isso já blinda qualquer refatoração futura do núcleo matemático.

---

## 11. Problemas identificados

> Legenda de confiança: **[F]** fato confirmado por leitura do código · **[I]** inferência fundamentada · **[H]** hipótese a confirmar em runtime.

| ID | Categoria | Descrição | Evidência | Impacto | Confiança |
|---|---|---|---|---|---|
| R-01 | Bloqueador (provável) | `loadGame` usa `fetch()` de arquivo local `file://`; Chromium/Electron normalmente bloqueia fetch de `file://`. Se confirmado, **nenhum jogo carrega** e sempre cai em "Em breve". | `js/app.js:26-27`; `main.js:13` | Crítico | **[H]** |
| R-02 | Bloqueador | `main.js` referencia `win` fora do escopo em `window-all-closed`; gera `ReferenceError` e **nunca ativa a tela cheia**. | `main.js:18-21` | Alto | **[F]** |
| R-03 | Recursos | Listener `keydown` global + `requestAnimationFrame` nunca liberados ao trocar/reabrir jogo -> vazamento de memória e loops concorrentes. | `js/app.js:33-44`; `game.js:45,308-312` | Alto | **[F]** |
| R-04 | Educacional | Distratores de multiplicação sempre 0–19 enquanto a resposta pode ir a 81 -> acerto por eliminação visual. | `game.js:89-92` vs `113-116` | Alto | **[F]** |
| R-05 | Offline | Bootstrap via CDN -> estilo/aparência quebram sem internet (uso infantil provável offline). | `index.html:8` | Médio | **[I]** |
| R-06 | Estado/corrida | `gameOver` mutado dentro do loop sem `break`; iteração posterior continua processando bolas. | `game.js:133-158` | Médio | **[F]** |
| R-07 | UX | Trocar modo/velocidade reseta a pontuação silenciosamente. | `game.js:66-69,276-279` | Médio | **[F]** |
| R-08 | Mobile | Sem controles de toque; inutilizável em tablets/celulares. | `game.js:45-56` | Médio | **[F]** |
| R-09 | Acessibilidade | Sem instruções, foco por teclado ou fallback textual para canvas. | `view.html`, `game.js` | Médio | **[F]** |
| R-10 | Robustez | `JSON.parse` sem `try/catch` em `storage.js` e `saveRecordName`. | `js/storage.js:4`; `game.js:253` | Baixo | **[F]** |
| R-11 | Código morto | Modo "free" comentado mas referenciado; botões "Em breve" duplicados; `preload.js` inócuo. | `game.js:103-105,111,144`; `index.html:28-36`; `preload.js` | Baixo | **[F]** |
| R-12 | Segurança/CSP | Sem CSP; `onclick` inline. | `index.html`, `view.html` | Baixo | **[F]** |
| R-13 | Repositório | `package-lock.json` ignorado pelo Git; sem README/documentação. | `.gitignore:3` | Baixo | **[F]** |
| R-14 | Dependências | Idade/vulnerabilidades de Electron/electron-builder não avaliadas (proibido instalar/auditar nesta fase). | `package.json:14-15` | Desconhecido | **[H]** |
| R-15 | UX | "Clique para jogar novamente" só vale após game over; sem indicação de controles. | `game.js:242-247` | Baixo | **[F]** |

---

## 12. Oportunidades de melhoria

Cada item: problema -> benefício -> complexidade -> código afetado -> dependências/riscos -> classificação.

1. **Corrigir tela cheia e ciclo de vida da janela** — Problema: R-02. Benefício: janela correta/persistente. Complexidade **baixa**. Afeta `main.js`. Sem dependências. **Necessária.**
2. **Liberar recursos do jogo (remover listener + cancelar RAF ao descarregar)** — Problema: R-03. Benefício: estabilidade. Complexidade **média**. Afeta `app.js` + `game.js` (expor `destroy()` em `window.carMath`). Risco: baixo. **Necessária.**
3. **Escalar distratores por operação** — Problema: R-04. Benefício: valor pedagógico real. Complexidade **baixa/média**. Afeta `game.js:newQuestion`. **Recomendada.**
4. **Feedback educativo no erro** (mostrar "a resposta era X") — Problema: R-04/UX. Benefício: aprendizagem. Complexidade **média**. Afeta `game.js` (fim de jogo/modal). **Recomendada.**
5. **Instruções + controles na tela** — Problema: R-09/R-15. Benefício: autonomia da criança. Complexidade **baixa**. Afeta `view.html`. **Recomendada.**
6. **Controles de toque (botões/arraste)** — Problema: R-08. Benefício: uso em tablets (público infantil). Complexidade **média**. Afeta `view.html` + `game.js`. Risco: colisão de layout com menu lateral. **Recomendada.**
7. **Empacotar Bootstrap localmente + CSP** — Problema: R-05/R-12. Benefício: offline + endurecimento. Complexidade **baixa/média** (baixar dependência = requer autorização). Afeta `index.html`/assets. **Recomendada.**
8. **Níveis/progressão de dificuldade** — Problema: ausência de progressão. Benefício: retenção. Complexidade **média**. Afeta `game.js`/`view.html`. **Opcional (P3).**
9. **Recorde por operação + ranking local** — Benefício: gamificação. Complexidade **baixa/média**. Afeta `storage.js`/`game.js`. **Opcional (P3).**
10. **PWA / offline / mobile** — Benefício: alcance. Complexidade **alta** (reescopo de Electron para web). **Futuro (P4)** — só se o objetivo mudar de "desktop" para "web".

---

## 13. Plano de evolução priorizado

> Não há evidência suficiente para estimativas em horas. As complexidades abaixo são qualitativas.

### P0 — Bloqueadores
- **P0-1** — Confirmar/corrigir carregamento de jogo (R-01). Se `fetch file://` falhar: substituir por `fs`/`net` via IPC ou protocolo customizado, ou ler o HTML por outro mecanismo. *Arquivos:* `js/app.js`, `main.js`. *Conclusão:* clique em "Matemática" exibe o jogo. *Risco:* regressão na navegação. *Teste:* manual de carga.
- **P0-2** — Corrigir `main.js` (R-02). *Conclusão:* sem `ReferenceError`; tela cheia opcional funcionando. *Teste:* abrir/fechar janela.

### P1 — Fundação técnica
- **P1-1** — Ciclo de vida do jogo: `destroy()` cancelando RAF e removendo listeners (R-03). *Conclusão:* reabrir o jogo N vezes não acumula loops/listeners. *Teste:* inspeção de profiler/memória.
- **P1-2** — Extrair `logic.js` puro + testes com `node:test` (Seção 10). *Conclusão:* geração/validação/pontuação cobertas.
- **P1-3** — Robustez de `storage` (`try/catch`, chaves corrompidas) (R-10).
- **P1-4** — Remover código morto e duplicações (R-11).

### P2 — Experiência do jogador
- **P2-1** — Distratores coerentes por operação (R-04).
- **P2-2** — Feedback educativo no erro; aviso ao resetar por troca de modo/velocidade (R-07).
- **P2-3** — Instruções + controles visíveis; acessibilidade de teclado/foco/ARIA (R-09).
- **P2-4** — Controles de toque (R-08).
- **P2-5** — Bootstrap local + CSP (R-05/R-12).

### P3 — Novas funcionalidades
- **P3-1** — Progressão por níveis/dificuldade.
- **P3-2** — Recorde por operação e ranking local.
- **P3-3** — Efeitos sonoros e animações de acerto/erro.

### P4 — Evoluções futuras
- **P4-1** — PWA/uso web/mobile (só se o modelo desktop for revisto).
- **P4-2** — Modo "free" retomado, se houver intenção pedagógica clara (hoje incompleto).
- **P4-3** — Auditoria de dependências (Electron) e política de atualização.

Cada item deve ter testes correspondentes conforme Seção 10; **nenhum** deve ser iniciado antes de P0/P1 estarem estáveis.

---

## 14. Recomendação arquitetural

1. **Vale a pena continuar sobre a base atual?** **Sim.** O código é pequeno, legível e funcional; reescrever não se justifica.
2. **Preservar:** o hub de jogos (`index.html`/`app.js`), a API `window.carMath`, o `GameStorage`, a estrutura `games/<id>/{view.html,game.js,assets}`.
3. **Refatorar:** a lógica matemática do IIFE (`game.js`) extraindo partes puras e testáveis; o carregamento de jogo (`app.js`) para garantir dispose/cleanup; o `main.js`.
4. **Reescrever do zero?** **Não há justificativa.** Nenhuma evidência de complexidade que force reescrita.
5. **Evoluir mantendo JavaScript?** **Sim**, plenamente viável.
6. **TypeScript/framework?** **Não se justifica.** O projeto tem ~340 linhas de lógica central e 1 jogo. Adicionar TS/React/Vue aumentaria custo de manutenção sem ganho proporcional. Se crescer muito (muitos jogos), reavaliar — não agora.
7. **A arquitetura suporta as melhorias propostas?** As P0–P2 sim, com pequenas refatorações localizadas. P3–P4 exigem mudanças maiores mas ainda contidas.
8. **Caminho de menor risco:** (1) verificar/fixar carregamento; (2) corrigir `main.js`; (3) implementar ciclo de vida/dispose; (4) extrair e testar a lógica matemática; (5) só então evoluir UX/novas features.

---

## 15. Próximos passos sugeridos (ordem de execução)

1. **Validar R-01 em runtime** (executar `npm start` localmente com display) — é a incógnita que pode mudar tudo.
2. Corrigir P0-2 (`main.js`) e P1-1 (dispose), pois são correções pequenas e de alto impacto.
3. Extrair `logic.js` e criar a suíte mínima de testes (`node:test`), documentando o bug de distratores como teste que falha.
4. Corrigir P2-1 (distratores) e P2-2/P2-3 (feedback/instruções).
5. Reavaliar P2-4/P2-5 (toque, Bootstrap local, CSP) conforme prioridade do proprietário.
6. Só depois iniciar P3.

---

## 16. Dúvidas que precisam ser respondidas pelo proprietário
(Respondido)
1. **Distribuição:** é para ser um app **desktop Windows** (Electron) ou você pretende uma versão **web/mobile**? A resposta muda radicalmente a arquitetura (P4-1).
R: Atualmente é um app desktop Windows, mas pretendo exportar depois para um apk e tbm app linux
2. **Funciona hoje?** Ao executar `npm start` e clicar em "Matemática", o jogo carrega? (resolve R-01).
R: Sim funciona executando com npm start
3. **Offline:** o app precisa funcionar **sem internet**? (Bootstrap CDN.)
R: Por estar já compilado, não tem necessidade de conexão com a rede para uso
4. **Público e uso:** quais idades/séries? O uso é solo, em sala de aula, com professor? Isso define níveis, instruções e acessibilidade.
R: Para todas as idades
5. **Progressão:** deseja níveis/fases e progressão, ou o formato "pontuação livre" atual é o desejado?
R: Quero sim que tenha níveis e fases com progressão de dificuldade
6. **Modo "free":** era uma feature planejada a ser retomada (item R-11) ou abandonada?
R: Se não está sendo utilizada, era alguma idéia do projeto inicial
7. **Tela cheia:** é requisito? (R-02 sugere que era a intenção.)
R: Sim, tela cheia é requisito, incluindo para telas menores
8. **Escopo de evolução:** prioridade entre novas mecânicas (P3) versus correções de UX (P2)?
R: Realize toda a evolução e correção que julgar necessária, o propósito da retomada do projeto é a contiuidade do mesmo, de forma que iremos planejar novos jogos além do car-math
9. **Licença/uso do autor:** o projeto ficará público? Isso influencia versionar `package-lock.json` e adicionar README/licença.
R: Quero ter toda a estrutura para tornar público sim.

---

## Anexo A — Limitações desta auditoria

- **Não foi possível executar a aplicação** nem validar a navegação/renderização em runtime (ambiente sem display; execução do Electron não é segura/garantida aqui). Os itens R-01 e R-14 permanecem como **hipóteses**.
- **Não foi realizada auditoria de dependências** (`npm audit`/versões) por exigir instalação/execução não permitidas nesta fase.
- Não existem testes, screenshots ou documentação no repositório além do código-fonte, limitando a reconstrução histórica (histórico Git tem **1 commit**).
- Todas as demais conclusões estão ancoradas em arquivos e linhas citados e classificadas como **[F]** (fato), **[I]** (inferência) ou **[H]** (hipótese).

---

## Anexo B — Tabela consolidada final

| ID | Categoria | Descrição | Evidência | Impacto | Prioridade | Recomendação |
|---|---|---|---|---|---|---|
| R-01 | Carregamento | `fetch()` de HTML local em `file://` possivelmente bloqueado | `js/app.js:26-27` | Crítico | P0 | Confirmar e trocar mecanismo de carga |
| R-02 | Bug | `win` fora de escopo; tela cheia nunca ativa | `main.js:18-21` | Alto | P0 | Corrigir escopo/posição |
| R-03 | Recursos | Listeners + RAF não liberados | `app.js:33-44`; `game.js:45,308` | Alto | P1 | Implementar `destroy()` |
| R-04 | Educacional | Distratores de multiplicação triviais | `game.js:89-92,113-116` | Alto | P2 | Escalar distratores por operação |
| R-05 | Offline | Bootstrap via CDN | `index.html:8` | Médio | P2 | Empacotar CSS local |
| R-06 | Estado | `gameOver` sem `break` no loop | `game.js:133-158` | Médio | P2 | Retornar/`break` após fim |
| R-07 | UX | Troca de modo/velocidade reseta score | `game.js:66-69,276-279` | Médio | P2 | Avisar/confirmar |
| R-08 | Mobile | Sem controles de toque | `game.js:45-56` | Médio | P2 | Adicionar toque |
| R-09 | A11y | Sem instruções/foco/fallback canvas | `view.html`; `game.js` | Médio | P2 | Instruções + ARIA + foco |
| R-10 | Robustez | `JSON.parse` sem proteção | `storage.js:4`; `game.js:253` | Baixo | P1 | `try/catch` |
| R-11 | Código morto | Modo "free", botões dup., preload inócuo | `game.js:103-105,111`; `index.html:28-36` | Baixo | P1 | Remover/decidir |
| R-12 | Segurança | Sem CSP; `onclick` inline | `index.html`; `view.html` | Baixo | P2 | CSP + listeners |
| R-13 | Repositório | `package-lock.json` ignorado; sem README | `.gitignore:3` | Baixo | P2 | Versionar lock; doc |
| R-14 | Dependências | Idade/vulns não avaliadas | `package.json:14-15` | Desconhecido | P4 | Auditar depois |
| R-15 | UX | "Clique para jogar" só pós-game-over | `game.js:242-247` | Baixo | P2 | Melhorar affordance |

**Riscos principais:** R-01 (pode impedir todo o uso), R-02, R-03.
**Melhores oportunidades:** R-04 (valor pedagógico), R-09/R-08 (alcance a crianças/mobile), testes da lógica pura (P1-2).

Auditoria concluída sem qualquer alteração no repositório. A próxima fase deve ser definida pelo proprietário com base nas dúvidas da Seção 16.


Após toda a análise realizada, gostaria do prompt para a execução de todos as correções sugeridas e já podemos autorizar a execução, de forma que já corrija e finalize esse módulo de car-math para planejarmos um novo módulo com novos jogos, também se possível pode aplicar uma melhoria visual no layout para que fique mais harmonico com melhor usabilidade e acessibilidade, também deve ser implementados todos os testes automatizados após as alterações e correções de possíveis bugs identificados nos testes, autorizo a execução da aplicação (inicialmente se for preciso pode ser pelo npm start, ou algo semelhante, pois sei que o executável está com formato para windows)