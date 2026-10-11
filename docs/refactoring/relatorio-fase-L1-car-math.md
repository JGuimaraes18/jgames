# Relatório Final — Fase L1: Estabilização, Refatoração, Testes e Finalização do car-math

**Projeto:** JGames
**Data:** 2026-10-10
**Autor do relatório:** Agente de execução (responsável técnico)

---

## 1. Resumo executivo

A fase L1 foi concluída. O módulo **car-math** foi estabilizado, refatorado,
testado e documentado. A arquitetura do JGames foi preparada para receber
novos jogos como módulos independentes (`games/<id>/` + registro em `js/app.js`).

Principais entregas:

- Correção do ciclo de vida do Electron (janela, fechamento e **tela cheia**
  via IPC com API mínima e segura).
- Correção do carregamento dos jogos (`fetch()` de `file://` **confirmado
  funcional** em runtime; preservado).
- **Ciclo de vida explícito** do jogo (`init()`/`destroy()`), eliminando
  vazamento de listeners/loops ao reabrir o jogo.
- **Extração da lógica matemática** para `games/car-math/logic.js` (funções
  puras com aleatoriedade injetável).
- Correção dos **distratores** (R-04) e da **condição de corrida** no `update()`.
- **Progressão por fases** (8 fases, dificuldade inicial Fácil/Normal/Difícil).
- **Pontuação/recordes** consistentes, com confirmação antes de reinício por
  troca de configuração.
- **Armazenamento resiliente** (`js/storage.js`) com validação de dados.
- Reescrita da **interface** (paleta coerente, instruções visíveis,
  responsividade, acessibilidade e feedback).
- **Controles de teclado e toque** (setas + botões ◀/▶, sem rolagem/zoom).
- **CSP restritiva + Bootstrap local** (funcionamento offline).
- **Suíte de testes automatizados** (`node:test`): **51 testes, 51 aprovados**.

- **Bug novo encontrado em runtime:** `prompt()` não é suportado pelo renderer
  do Electron; o campo de nome do jogador foi substituído por um campo de texto
  persistente no menu (corrigido e validado).

---

## 2. Estado inicial do repositório

- Branch ativa: **master** (único commit `bd73927 first commit`).
- Working tree: limpa em arquivos rastreados; **não rastreados** presentes:
  `AgentePlan.md` e `teste` (arquivo de instruções da fase — preservados).
- `package-lock.json` existia e era **ignorado pelo Git**.
- `node_modules/` contendo a build **Windows** do Electron (o host é Linux →
  `npm start` local não executa; ver item 15).
- `build/` com instalador Windows gerado anteriormente (`JGames Setup 1.0.0.exe`).

## 3. Arquivos criados

| Arquivo | Propósito |
|---|---|
| `css/vendor/bootstrap.min.css` | Bootstrap 5.3.3 local (offline; SHA-384 igual ao hash SRI oficial) |
| `css/game.css` | Estilos do car-math (HUD, overlay, chips, toque, animações) |
| `games/car-math/logic.js` | Regras matemáticas, distratores, progressão e pontuação (puros) |
| `test/helpers/dom-stub.js` | Stub de DOM/RAF/Image para testar o `game.js` real |
| `test/logic.test.js` | Testes matemáticos + progressão |
| `test/storage.test.js` | Testes de armazenamento |
| `test/integration.test.js` | Testes de integração (pipeline questão→score→recorde) |
| `test/lifecycle.test.js` | Testes de ciclo de vida do jogo |
| `README.md` | Documentação pública do projeto |
| `docs/relatorio-fase-L1-car-math.md` | Este relatório |

## 4. Arquivos alterados

| Arquivo | Resumo da alteração |
|---|---|
| `main.js` | Escopo de `win` corrigido, `window-all-closed` conforme convenção, IPC de tela cheia, `sandbox:true`, `contextIsolation` explícito |
| `preload.js` | API mínima `window.jgWindow` via `contextBridge` (sem logs inúteis) |
| `index.html` | CSP, Bootstrap local, menu redesenhado, campo de jogador, botão tela cheia, sem `onclick` inline |
| `js/app.js` | Registro de jogos, carregamento com ciclo de vida, nome do jogador sem `prompt()`, tela cheia |
| `js/storage.js` | Backend injetável, validação total, sem apagar dados inválidos |
| `css/home.css` | Layout responsive do hub, paleta e foco visível |
| `games/car-math/view.html` | Nova UI acessível, sem handlers inline, controles de operação/dificuldade/ações, toque, overlay e confirmação |
| `games/car-math/game.js` | Reescrito: instância com `init()`/`destroy()`, usa `logic.js`, progressão, feedback, toque, correção da corrida |
| `package.json` | Script `test`, `dist:win`, `files` whitelist, target Linux `dir`, descrição consistente |
| `.gitignore` | `package-lock.json` voltou a ser versionável; removidos ruídos |

## 5. Principais correções realizadas

- **R-02** — `ReferenceError` de `win` no `window-all-closed` e tela cheia
  inalcançável: reescrito o ciclo de vida e a tela cheia por IPC explícito.
- **R-03** — Vazamento de `keydown` + `requestAnimationFrame`: contrato
  `init()`/`destroy()` (cancela RAF, remove listeners, limpa timers,
  `window.carMath` é destruída pelo hub).
- **R-04** — Distratores presos em `0–19`: agora a janela de distratores escala
  com a resposta (teste de regressão dedicado).
- **R-06** — Corrida em `update()`: `break` imediato após fim de partida,
  `return` após acerto, guarda `if (gameOver) return`.
- **R-07** — Troca de operação/dificuldade perdia pontuação silenciosamente:
  agora há **confirmação** antes de reiniciar.
- **R-10** — `JSON.parse`/`localStorage` sem proteção: storage saneado.
- **R-05** — Bootstrap CDN: distribuído localmente (hash SRI verificada).
- **R-12** — CSP ausente e `onclick` inline: CSP restritiva + listeners
  explícitos (nenhum handler inline).
- **Novo** — `prompt()` não suportado no Electron: nome do jogador via campo
  persistente no menu.
- **R-11 parcial** — código morto/modo "free"/botões "Em breve" duplicados e
  `preload.js` inócuo removidos.

## 6. Melhorias de arquitetura

- **Separação por camadas no car-math:**
  - `logic.js` — regras puras, determinísticas, com `rng` injetável;
  - `game.js` — renderização, estado de tela, controles e ciclo de vida;
  - `view.html` — marcação acessível sem comportamento inline.
- **Hub com registro de jogos** (`js/app.js` `GAMES`): contratos `init()`/
  `destroy()` e `focusCanvas()`; novas entradas adicionam jogos sem acoplar
  lógicas.
- **Tela cheia desacoplada da renderização:** API única `window.jgWindow`
  (toggle/set/is/evento) usada pelo hub e pelo jogo.
- **Armazenamento com backend injetável**, testável e compatível com o formato
  antigo de dados.

## 7. Regras de progressão implementadas

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

- Avanço a cada **5 acertos**; saturação na fase 8 (progressão **contínua**
  com limite, decisão documentada — evita complexidade de campanha e mantém a
  experiência justa).
- Dificuldade inicial: Fácil (fase 1), Normal (fase 3), Difícil (fase 6).
- Velocidade é derivada da fase (substitui o seletor manual, que conflitava
  com a progressão).
- Mudança de fase não reinicia a partida; oferece feedback visual de ~1,4 s.

## 8. Melhorias visuais e de acessibilidade

- Paleta coerente (indigo/teal sobre fundo suave), cartões, sombras e
  tipografia legível.
- Hierarquia clara: questão em destaque, HUD de pontos/recorde, barra de
  progresso da fase.
- Instruções visíveis ("use as setas ◀ ▶, pegue a bola certa...").
- Foco visível (`:focus-visible`), navegação por teclado, `role`/`aria` nos
  dialogs e progressbar, `aria-live` para status do jogo, rótulos nos botões.
- Canvas com `role="img"` + `aria-label` e mensagens de estado legíveis
  (alternativas textuais).
- Redução de movimento respeitada (`prefers-reduced-motion`).
- Toque sem seleção de texto nem zoom (`touch-action: none`).
- Responsividade para janelas estreitas (sidebar colapsa, HUD quebra linha).

## 9. Testes criados

- `test/logic.test.js` — matemática (4 operações, faixas, divisão exata,
  sem negativos/sem ÷0), distratores (únicos, janela escalável, regressão
  R-04), opções (resposta sempre presente, posição varia), progressão
  (fases, limites, saturação, reinício).
- `test/storage.test.js` — chave ausente, JSON corrompido/válido, dados
  incompletos, valores inválidos, falha de leitura/escrita, preservação do
  recorde, compatibilidade com dados antigos, nomes saneados.
- `test/integration.test.js` — pipeline questão→alternativas→validação→
  pontuação→progressão→fim→persistência do recorde; distratores de
  multiplicação não revelam a resposta; pontuação única por resposta.
- `test/lifecycle.test.js` — instância real do `game.js`: contrato
  `init/destroy/focusCanvas`, RAF cancelado, listeners removidos, init
  idempotente, reabertura repetida sem acumular recursos, **fim de partida
  real** (bola passa), reinício pós-game over, estado parado após destroy.

## 10. Quantidade de testes executados e aprovados

```
# tests 51
# pass  51
# fail  0
```

Execução: `npm test` (Node v18.19.1).

## 11. Testes que não puderam ser executados

- **Testes visuais / de layout** e **interação real com toque físico**:
  dependem de uma janela visual observável; o ambiente desta execução não
  permite inspeção visual humana. Complementados com verificações
  programáticas via Electron (DOM e estado) e pelas suítes acima.
  **Verificação pendente/manual:** conferência visual da interface.

## 12. Bugs encontrados durante a execução

1. **`prompt()` não suportado no Electron** — `js/app.js` lançava exceção ao
   pedir o nome do jogador (confirmado em runtime).
2. Confirmados por inspeção (auditoria anterior) e agora **validados em
   runtime**: escopo de `win` (R-02), vazamento de recursos (R-03),
   distratores triviais (R-04), corrida (R-06), reset silencioso (R-07),
   `JSON.parse` frágil (R-10).

## 13. Bugs corrigidos

1. Bug do `prompt()` (item 12.1) — campo de jogador no menu.
2. R-02, R-03, R-04, R-06, R-07, R-10 (ver seção 5).

> R-01 (**fetch de `file://`**): **NÃO é defeito** — reproduzido com sucesso
> em runtime (status 200). O mecanismo foi mantido.

## 14. Resultado de `npm start`

- O `node_modules` local contém o **Electron Windows** (host Linux), portanto
  `npm start` não pôde ser executado diretamente neste ambiente.
- **Validação real da aplicação:** o app foi aberto com uma build Linux do
  Electron (v40.1.0, instalada fora do projeto, sem alterar `node_modules`)
  usando o `main.js`, `preload.js` e `index.html` reais. Resultados obtidos
  programaticamente (sem erro de console/CSP):
  - Hub renderizado com campo de jogador e botão de tela cheia;
  - `loadGame('car-math')` carregou o jogo: questão exibida (ex.: `1 + 3 = ?`),
    canvas presente, API `init/destroy` disponível;
  - mudança de operação atualiza a questão e o estado ARIA;
  - **tela cheia entra e sai** via IPC (true→false);
  - reabrir o jogo produz **exatamente 1 canvas** (sem instâncias concorrentes);
  - nome do jogador e recorde persistem e são saneados;
  - fim de partida e reinício validados na suíte de ciclo de vida.

## 15. Resultado do build

- **Não executado** de forma confiável: o host é Linux, sem Wine/NSIS, e o
  `node_modules` local contém o Electron Windows.
- Configuração do `electron-builder` revisada/reorganizada (`files` explícito,
  target Windows NSIS mantido, target Linux `dir` pré-configurado, sem Android).
- Comando para o Windows: `npm run dist:win`.
- **Limitação registrada:** gerar o instalador Windows deve ser feito em
  Windows (ou Linux com Wine/NSIS). Não foi simulado sucesso.

## 16. Resultado das verificações de segurança

- `npm audit`: **26 vulnerabilidades** (5 moderadas, 20 altas, 1 crítica),
  todas em **dependências de desenvolvimento do electron-builder** (cadeia de
  build: `tar`, `tmp`, `global-agent`, etc.). **Não afetam o app empacotado**
  (runtime = só Electron + arquivos estáticos locais).
  A correção automática foi avaliada (alteraria ~178 pacotes transitivos) e
  **não aplicada** por risco de quebrar o build; registrada para revisão
  controlada antes da publicação.
- CSP: política restritiva (`default-src 'self'; script-src 'self'; ...`),
  sem `unsafe-eval` e sem handlers inline; nenhuma violação observada em
  runtime.
- Sem `nodeIntegration`, `contextIsolation: true`, `sandbox: true`.
- Nenhum dado pessoal em logs; apenas nome local (opcional).
- Nenhuma comunicação de rede no app.

## 17. Limitações restantes

- Verificação **visual humana** da interface (pendente — fazer com janela real).
- Teste em **dispositivo com tela de toque real** (pendente).
- Instalador Windows precisa ser gerado em ambiente Windows.
- Vulnerabilidades de dev-deps do electron-builder (item 16) aguardando
  revisão.
- Licença (ISC) e origem dos assets (`carro.png`, `fundo.jpg`) a confirmar
  antes da publicação pública.
- Android/Linux não testados nesta fase.

## 18. Comandos para executar o projeto

```bash
npm install
npm start
```

## 19. Comandos para executar os testes

```bash
npm test
# Node 18.19+ recomendado (runner nativo node:test)
```

## 20. Comando para gerar o pacote

```bash
npm run dist:win     # Windows (NSIS) — idealmente em ambiente Windows
npm run dist -- --linux   # target dir para Linux (pré-configurado)
```

## 21. Checklist de critérios de aceitação

### Aplicação

| Critério | Estado |
|---|---|
| `npm start` inicia a aplicação | ⚠️ Validado em runtime com Electron Linux (node_modules local é Windows) |
| Menu é renderizado | ✅ (verificado via Electron real) |
| car-math carrega | ✅ (verificado via Electron real) |
| Assets carregados | ✅ (imagens via `file://`, com fallback) |
| Janela fecha normalmente | ✅ (código verificado; fechamento testado no runtime) |
| Tela cheia funciona | ✅ (testado via IPC: entra/sai) |
| Sair da tela cheia | ✅ |
| Abrir/encerrar repetidamente | ✅ (teste automatizado: 5 ciclos sem acumular recursos) |
| Sem loops duplicados | ✅ (teste automatizado de RAF/listeners) |

### Mecânica

| Critério | Estado |
|---|---|
| Quatro operações funcionam | ✅ (testes + runtime: mudança de modo altera questão) |
| Regras matemáticas respeitadas | ✅ (testes de geração) |
| Resposta correta sempre disponível | ✅ (testes de `generateOptions`) |
| Distratores não revelam a resposta | ✅ (teste de regressão R-04) |
| Identificar a fase atual | ✅ (HUD Fase + rótulo) |
| Progressão aumenta gradualmente | ✅ (testes de progressão) |
| Avanço de fase | ✅ (testes) |
| Fim de partida | ✅ (teste de ciclo de vida real) |
| Pontuação consistente | ✅ (testes de pontuação/integração) |
| Recordes preservados | ✅ (testes de storage + runtime) |

### Interface

| Critério | Estado |
|---|---|
| Layout consistente | ✅ (código; confirmação visual pendente) |
| Instruções visíveis | ✅ |
| Questão em destaque | ✅ |
| Feedback (acerto/erro/fase/pausa/fim/recorde) | ✅ |
| Controles compreensíveis | ✅ |
| Resoluções menores | ✅ (responsividade) |
| Sem elementos cortados | ✅ (responsividade; confirmação visual pendente) |
| Navegação por teclado | ✅ |
| Foco visual | ✅ (`:focus-visible`) |
| Canvas com alternativa textual | ✅ (`role="img"` + `aria-label` + `aria-live`) |
| Controles de toque | ✅ (implementados; teste físico pendente) |

### Qualidade técnica

| Critério | Estado |
|---|---|
| Lógica matemática separada da renderização | ✅ |
| Ciclo de vida com limpeza explícita | ✅ |
| Armazenamento trata dados inválidos | ✅ |
| Testes matemáticos passam | ✅ |
| Testes de progressão passam | ✅ |
| Testes de pontuação passam | ✅ |
| Testes de armazenamento passam | ✅ |
| Testes de ciclo de vida passam | ✅ |
| Suíte completa passa | ✅ (51/51) |
| Sem erros conhecidos ignorados | ✅ |
| Arquitetura simples | ✅ |
| Configurações de segurança Electron preservadas | ✅ |

### Publicação

| Critério | Estado |
|---|---|
| README atualizado | ✅ |
| Comandos de execução/teste documentados | ✅ |
| Estrutura documentada | ✅ |
| Licença consistente | ⚠️ ISC mantida; confirmar com o proprietário antes de publicar |
| Arquivos de build fora do Git | ✅ (`.gitignore`) |
| Funcionamento offline | ✅ (Bootstrap local; sem CDN) |
| Limitações de plataformas futuras documentadas | ✅ |

## 22. Próximos passos recomendados

1. **Verificação visual manual** da janela (Windows ou Linux com `npm install`
   e Electron do SO correto).
2. Gerar o instalador **Windows** (`npm run dist:win`) e validar instalação.
3. Decidir/confirmar **licença** e origem dos **assets** antes de tornar o
   repositório público.
4. Revisar as vulnerabilidades de dev-deps do `electron-builder`
   (upgrade controlado sem quebrar o build).
5. Planejar a estratégia **Linux** e depois **Android** (tecnologia separada).
6. Planejar o **próximo jogo** reutilizando o registro de módulos do hub e o
   padrão `init()`/`destroy()` + lógica separada + testes.