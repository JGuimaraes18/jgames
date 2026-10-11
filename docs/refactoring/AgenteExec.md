# PROJETO JGAMES
# FASE L1 — ESTABILIZAÇÃO, REFATORAÇÃO, TESTES E FINALIZAÇÃO DO CAR-MATH

Você é o responsável técnico pela evolução do projeto JGames.

Sua missão é executar as correções identificadas na auditoria técnica (registrada no arquivo AgentePlan.md na raiz do projeto),
melhorar a arquitetura interna, implementar testes automatizados,
corrigir os defeitos encontrados durante a execução e entregar o módulo
car-math finalizado, com uma interface mais harmoniosa, acessível e
agradável para o público-alvo.

O proprietário autorizou expressamente a modificação dos arquivos,
a execução da aplicação, a instalação de dependências de desenvolvimento
quando justificadas e a realização das correções necessárias.

Ao terminar, o projeto deverá estar estável, testado, documentado e
preparado para receber novos jogos em módulos independentes.

IMPORTANTE:
O escopo desta fase é finalizar o car-math e preparar a arquitetura
do JGames para futuras expansões.

Não implemente novos jogos nesta fase.

==================================================
1. CONTEXTO CONFIRMADO
==================================================

O projeto é um aplicativo desktop chamado JGames, desenvolvido com
Electron e tecnologias web tradicionais.

Tecnologias atuais:
- Electron.
- electron-builder.
- HTML.
- CSS.
- JavaScript puro.
- Bootstrap 5.3.3 carregado por CDN.
- localStorage para persistência local.
- Node.js disponível no ambiente de desenvolvimento.

Não existe backend nem banco de dados.

O projeto é pequeno, com aproximadamente 792 linhas de código
rastreadas na auditoria anterior.

Estrutura identificada:

index.html
main.js
preload.js
package.json
css/home.css
js/app.js
js/storage.js
games/car-math/view.html
games/car-math/game.js
games/car-math/assets/carro.png
games/car-math/assets/fundo.jpg
icon.ico

A estrutura real pode ter mudado desde a auditoria. Inspecione novamente
o repositório antes de implementar qualquer modificação.

O jogo car-math funciona da seguinte forma:

1. O jogador inicia uma partida.
2. Uma operação matemática é apresentada.
3. Bolas numeradas descem pela tela.
4. O jogador controla um carro horizontalmente.
5. O objetivo é colidir com a bola que contém a resposta correta.
6. Cada resposta correta concede pontos.
7. Uma resposta incorreta ou uma bola que ultrapassa o limite inferior
   encerra a partida.
8. O jogo registra o recorde local.

As operações existentes são:
- Adição.
- Subtração sem resultados negativos.
- Multiplicação.
- Divisão exata.

Há também seleção de velocidade, pausa, reinício e recorde local.

O proprietário confirmou:

- O aplicativo atual funciona com npm start.
- O produto continuará sendo um aplicativo desktop Windows nesta fase.
- Posteriormente, pretende disponibilizar versões para Linux e Android.
- O público-alvo pretendido é amplo, abrangendo diferentes idades.
- O jogo deverá ter níveis, fases e progressão de dificuldade.
- Tela cheia é um requisito.
- O projeto poderá se tornar público.
- O objetivo é continuar evoluindo o JGames e desenvolver outros jogos.
- A interface poderá ser redesenhada para melhorar a usabilidade.

Não transforme o aplicativo desktop em uma aplicação web nesta fase.
Não introduza backend, autenticação ou banco de dados sem necessidade.
Não implemente versões Linux ou Android agora.

A arquitetura deve evitar decisões que dificultem essas expansões futuras,
mas não deve antecipar uma migração que ainda não faz parte do escopo.

==================================================
2. REGRAS DE EXECUÇÃO E SEGURANÇA
==================================================

Agora está AUTORIZADO modificar o código e executar a aplicação.

Entretanto, siga estas regras:

1. Inspecione o estado do Git antes de começar.
2. Preserve alterações preexistentes do proprietário.
3. Nunca descarte mudanças não commitadas.
4. Não execute git reset --hard.
5. Não execute git clean.
6. Não sobrescreva alterações preexistentes sem autorização.
7. Não faça commits ou pushes automaticamente.
8. Não publique releases.
9. Não exclua dados reais do usuário.
10. Não substitua assets existentes sem verificar seu uso.
11. Não atualize todas as dependências indiscriminadamente.
12. Não migre para React, Vue, Angular ou TypeScript nesta fase.
13. Não instale dependências de produção sem necessidade justificada.
14. Prefira o test runner nativo do Node.js quando suficiente.
15. Se uma ferramenta adicional for necessária, justifique e utilize
    uma versão compatível com o projeto.
16. Não altere o escopo do produto por preferência pessoal.
17. Não deixe testes falhando para concluir a tarefa mais rapidamente.
18. Não esconda erros com testes excessivamente permissivos.
19. Não remova funcionalidades existentes sem verificar seu propósito.
20. Não altere silenciosamente o formato dos dados persistidos.
21. Não exponha nomes de jogadores ou outros dados pessoais nos logs.
22. Não execute comandos privilegiados sem necessidade.
23. Não modifique configurações globais do sistema.
24. Não publique dados locais nem envie informações do projeto para
    serviços externos.

Antes de instalar qualquer dependência, verifique o package.json,
o package-lock.json e a versão do Node.js disponível.

Se houver um package-lock.json preexistente, preserve-o e avalie sua
situação antes de decidir se deve ser versionado.

Não apague nem recrie o arquivo de lock automaticamente.

Caso existam alterações anteriores do proprietário, trabalhe em torno
delas e documente eventuais conflitos.

Se encontrar uma condição que possa provocar perda de dados ou exigir
uma alteração fora do escopo, interrompa apenas a operação afetada,
explique o problema e prossiga com as tarefas independentes.

==================================================
3. FASE A — DIAGNÓSTICO PRÉ-IMPLEMENTAÇÃO
==================================================

Antes de alterar qualquer arquivo:

1. Execute git status.
2. Identifique a branch ativa.
3. Verifique as alterações rastreadas e não rastreadas.
4. Examine package.json e o arquivo de lock.
5. Verifique as versões do Node.js e npm.
6. Confirme a estrutura atual do projeto.
7. Revise os arquivos de Electron e do jogo.
8. Identifique os scripts de execução e build.
9. Verifique os assets utilizados.
10. Identifique possíveis diferenças em relação à auditoria anterior.

Não repita a auditoria inteira sem necessidade. Utilize o relatório
anterior como referência e valide seus principais achados.

Produza uma lista interna de tarefas e prossiga para a implementação
sem solicitar aprovação para cada correção dentro do escopo autorizado.

==================================================
4. FASE B — CORREÇÃO DO CICLO DE VIDA DO ELECTRON
==================================================

Revise main.js e preload.js.

Corrija o problema identificado anteriormente no tratamento
de window-all-closed.

A variável win era referenciada fora do escopo no qual foi declarada,
causando ReferenceError.

Corrija a estrutura do ciclo de vida da janela sem simplesmente mover
o código para outro lugar sem compreender sua finalidade.

Requisitos:

- A janela deve ser criada corretamente.
- O fechamento deve funcionar sem exceções.
- O comportamento de encerramento deve respeitar as convenções
  da plataforma.
- A aplicação deve continuar abrindo normalmente com npm start.
- O requisito de tela cheia deve ser atendido.
- A tela cheia não deve depender do callback de fechamento da janela.
- Deve existir uma forma clara de entrar e sair da tela cheia.
- O usuário não pode ficar preso em tela cheia sem conseguir sair.
- O comportamento deve ser compatível com o uso em diferentes
  resoluções.
- A implementação deve considerar o ciclo de vida do Electron.

Implemente tela cheia de maneira explícita, segura e previsível.

Avalie se a aplicação deve iniciar em tela cheia ou oferecer um controle
visível para alterná-la.

O requisito do proprietário é que a funcionalidade exista e funcione.

Prefira uma solução que permita usar a aplicação em janela normal
durante o desenvolvimento e em tela cheia durante o uso do jogo.

Utilize APIs oficiais do Electron e mantenha o princípio de privilégio
mínimo.

Não habilite nodeIntegration indiscriminadamente.

Se for necessário expor funcionalidades do processo principal ao
renderer, utilize uma API mínima por meio do preload e IPC.

Não exponha objetos completos do Electron ao renderer.

Revise as configurações de BrowserWindow.

Mantenha contextIsolation habilitado e nodeIntegration desabilitado,
salvo se houver uma justificativa técnica excepcional, que deverá
ser documentada.

O preload deve conter apenas funcionalidades efetivamente necessárias.

Não mantenha código sem utilidade apenas para preservar um arquivo.

==================================================
5. FASE C — CORREÇÃO DO CARREGAMENTO DOS JOGOS
==================================================

A auditoria identificou o uso de fetch() para carregar view.html
a partir de um aplicativo Electron iniciado por arquivo local.

A auditoria não conseguiu reproduzir o possível problema porque
não executou a aplicação.

O proprietário confirmou que npm start funciona atualmente.

Portanto, não trate R-01 como defeito confirmado sem testar.

Reproduza o carregamento real do jogo no ambiente disponível.

Se o carregamento atual funcionar corretamente, preserve-o, salvo se
existir outra razão técnica concreta para alterá-lo.

Se falhar em alguma condição relevante, implemente uma solução
compatível com Electron, preferencialmente sem aumentar desnecessariamente
a complexidade.

Evite habilitar permissões inseguras para fazer fetch funcionar.

Requisitos:

- O menu deve abrir.
- O jogo car-math deve carregar.
- Os estilos e imagens devem carregar.
- Erros de carregamento devem produzir mensagens compreensíveis.
- O jogo deve poder ser aberto, encerrado e aberto novamente.
- O carregamento não pode criar instâncias concorrentes do jogo.
- A arquitetura deve permitir registrar outros jogos futuramente.

Não implemente um sistema complexo de plugins.

A estrutura existente de diretórios por jogo é suficiente como ponto
de partida, desde que tenha um ciclo de vida bem definido.

==================================================
6. FASE D — CICLO DE VIDA E LIMPEZA DE RECURSOS
==================================================

Corrija os vazamentos identificados na auditoria.

O jogo atualmente registra um listener global de teclado e inicia
um loop requestAnimationFrame.

A remoção do elemento script não encerra esses recursos.

Implemente uma estratégia explícita de inicialização e destruição
do jogo.

Requisitos:

- A inicialização não deve ser executada duplicadamente.
- Cada instância deve manter o controle de seus próprios recursos.
- Todos os listeners adicionados pelo jogo devem ser removidos.
- O requestAnimationFrame deve ser cancelado ao encerrar a instância.
- Timers e intervalos devem ser cancelados, caso existam.
- Recursos de áudio, caso sejam introduzidos, devem ser liberados.
- O estado do jogo não pode continuar sendo atualizado após sua
  destruição.
- O canvas antigo não pode continuar recebendo desenhos.
- Referências globais não mais necessárias devem ser removidas.
- Reiniciar uma partida não deve criar loops adicionais.
- Reabrir o jogo repetidamente não deve acumular listeners.

Implemente um contrato de ciclo de vida claro.

Por exemplo, uma instância pode oferecer métodos equivalentes a:

- init()
- destroy()

Adapte a nomenclatura à arquitetura encontrada.

Não implemente uma API pública complexa sem necessidade.

No carregador de jogos, encerre a instância anterior antes de iniciar
uma nova.

Diferencie corretamente:

- Reiniciar uma partida.
- Encerrar uma instância do jogo.
- Descarregar um módulo.
- Encerrar o aplicativo.

Essas operações não devem produzir efeitos colaterais inesperados.

==================================================
7. FASE E — REFATORAÇÃO DA LÓGICA MATEMÁTICA
==================================================

Extraia a lógica matemática do código acoplado ao canvas e ao DOM.

Crie um módulo independente para as regras matemáticas.

Uma estrutura possível é:

games/car-math/logic.js
games/car-math/game.js
games/car-math/view.html
games/car-math/assets/

A estrutura definitiva deve respeitar as características do projeto.

O objetivo é separar:

1. Geração de operações.
2. Cálculo da resposta correta.
3. Geração de alternativas.
4. Validação de respostas.
5. Regras de pontuação.
6. Determinação de dificuldade.
7. Renderização e movimentação do jogo.

As funções matemáticas devem ser determinísticas quando receberem
os dados necessários.

A aleatoriedade deve poder ser controlada nos testes, por exemplo
permitindo injetar uma função geradora de números aleatórios.

Não introduza uma arquitetura de dependências complexa.

Utilize JavaScript compatível com a versão do Node.js e do Chromium
utilizados pelo projeto.

Se utilizar módulos ES, verifique a compatibilidade com Electron,
o modo de carregamento atual e o runner de testes.

Não altere o formato do projeto inteiro apenas para facilitar um teste.

==================================================
8. FASE F — CORREÇÃO DA GERAÇÃO DOS DESAFIOS
==================================================

Corrija o problema identificado nos distratores.

Atualmente, os números incorretos podem ficar restritos ao intervalo
0–19, enquanto a multiplicação pode produzir resultados até 81.

Isso permite que a resposta correta seja identificada visualmente
sem realizar o cálculo.

Implemente uma estratégia de geração de alternativas coerente com
a operação e com a dificuldade da questão.

Requisitos:

- A resposta correta deve sempre estar entre as alternativas.
- Não deve haver alternativas duplicadas.
- As alternativas incorretas devem ser diferentes da resposta.
- A quantidade de alternativas deve respeitar o layout existente.
- Os números devem ser compatíveis com a operação apresentada.
- As alternativas não devem revelar trivialmente a resposta.
- A posição da resposta correta deve variar.
- A distribuição não deve privilegiar permanentemente uma posição.
- O sistema não deve entrar em loop infinito ao gerar alternativas.
- A estratégia deve funcionar com respostas pequenas e grandes.
- A dificuldade deve influenciar a qualidade dos distratores.

Não produza alternativas absurdas apenas para preencher a tela.

Evite números negativos quando a modalidade não permitir resultados
negativos.

Mantenha a divisão exata na modalidade atual.

Não introduza frações, decimais ou números negativos como regra geral
sem que o nível ou modalidade os permita.

Documente claramente as regras matemáticas de cada modalidade.

Corrija também a condição de corrida identificada em update().

Quando uma colisão provocar o encerramento da partida, o processamento
das demais bolas no mesmo frame deve respeitar o novo estado.

Não permita que várias colisões executem repetidamente a lógica de
fim de partida no mesmo ciclo.

==================================================
9. FASE G — SISTEMA DE NÍVEIS, FASES E PROGRESSÃO
==================================================

Implemente um sistema de progressão que faça sentido para o car-math.

O proprietário deseja níveis e fases com aumento progressivo da
dificuldade.

A progressão deve ser parte do jogo, e não apenas um número exibido
na interface.

Defina uma regra simples, compreensível e testável.

A progressão pode considerar:

- Quantidade de respostas corretas.
- Velocidade das bolas.
- Complexidade das operações.
- Faixa numérica.
- Qualidade dos distratores.
- Combinação de operações.
- Quantidade de questões necessárias para avançar.

Evite aumentar simultaneamente todos os parâmetros de forma abrupta.

O jogo deve continuar justo e compreensível.

Proponha uma estrutura inicial de fases adequada para um jogo
de aritmética que possa atender desde crianças até adultos.

O público amplo NÃO significa que todos devem começar com questões
difíceis.

Inclua uma seleção clara de dificuldade inicial ou uma progressão
gradual que permita ao jogador aprender.

A progressão precisa ter regras explícitas.

Requisitos:

1. O jogador deve saber em qual fase está.
2. O jogo deve indicar o progresso necessário para avançar.
3. O avanço deve ser reconhecível visualmente.
4. A dificuldade deve aumentar gradualmente.
5. A geração matemática deve respeitar a fase atual.
6. A mudança de fase não deve reiniciar a partida silenciosamente.
7. O jogo deve oferecer feedback após avanço.
8. O sistema deve ter condições claras de encerramento ou continuidade.
9. O jogador deve conseguir iniciar uma nova partida.
10. A pontuação deve seguir uma regra consistente.

Decida, com base na experiência atual, se o jogo deve oferecer
progressão contínua ou uma sequência finita de fases.

Documente a decisão e sua justificativa.

Não implemente um sistema de campanhas complexo.

Mantenha a arquitetura preparada para futuras modalidades.

O estado da progressão deve ser separado da renderização.

Não torne a progressão dependente de elementos HTML específicos.

==================================================
10. FASE H — REGRAS DE PONTUAÇÃO E RECORDES
==================================================

Revise o sistema de pontuação.

A regra atual concede 10 pontos por acerto.

Você pode preservar essa regra como base, desde que a evolução
da dificuldade e da progressão seja consistente.

Defina claramente:

- Pontos por resposta correta.
- Critério para avanço de fase.
- Comportamento após resposta incorreta.
- Comportamento quando uma bola ultrapassa o limite.
- Momento em que o recorde é atualizado.
- Momento em que a pontuação é reiniciada.
- Diferença entre reiniciar a partida e mudar configurações.

Não apague pontuações sem aviso.

Não permita que trocar velocidade, dificuldade ou operação cause
perda silenciosa de uma partida em andamento.

Implemente uma interação compreensível quando uma configuração
exigir reinício.

Revise a persistência do recorde local.

Não introduza autenticação nem ranking online.

O recorde deve continuar disponível após reiniciar o aplicativo.

Se decidir armazenar recordes separados por operação ou dificuldade,
mantenha uma estrutura simples e compatível com a evolução futura.

Não destrua os recordes existentes.

Se houver migração do formato de armazenamento, preserve a leitura
dos dados antigos sempre que possível.

==================================================
11. FASE I — ROBUSTEZ DO ARMAZENAMENTO
==================================================

Revise js/storage.js e todos os pontos de leitura e gravação de dados.

Corrija os problemas identificados relacionados a JSON.parse(),
JSON.stringify() e acesso ao localStorage.

Considere:

- JSON corrompido.
- Chaves inexistentes.
- Valores com formato inesperado.
- Falhas de leitura.
- Falhas de escrita.
- Dados antigos.
- Valores numéricos inválidos.
- Pontuação negativa ou não finita.
- Nomes vazios ou excessivamente longos.

O tratamento deve ser previsível.

Não apague todos os dados ao encontrar uma entrada inválida.

Quando for seguro, utilize valores padrão e registre apenas
informações técnicas que não exponham dados pessoais.

Se houver uma entrada corrompida, trate-a sem derrubar a aplicação.

Preserve os recordes válidos.

Não armazene informações desnecessárias sobre o jogador.

Não introduza coleta de dados nem comunicação externa.

==================================================
12. FASE J — INTERFACE E EXPERIÊNCIA DO JOGADOR
==================================================

Faça uma melhoria visual consistente em todo o JGames, respeitando
a identidade de um jogo educativo.

O objetivo é obter uma interface mais harmoniosa, moderna,
compreensível e acessível.

Não faça apenas alterações superficiais de cores.

Revise a hierarquia visual e o fluxo de interação.

Considere:

- Menu principal.
- Identificação do jogador.
- Seleção do jogo.
- Tela do car-math.
- Área do canvas.
- Operação matemática.
- Pontuação.
- Recorde.
- Fase atual.
- Progresso para a próxima fase.
- Seleção de operação.
- Seleção de dificuldade.
- Seleção de velocidade, caso continue necessária.
- Pausa.
- Reinício.
- Fim de partida.
- Avanço de fase.
- Tela cheia.

A interface deve explicar o funcionamento do jogo sem depender
de conhecimento prévio.

Inclua instruções visíveis e simples.

Por exemplo, a criança deve compreender:

- Qual operação precisa resolver.
- Como movimentar o carro.
- Qual é o objetivo.
- O que acontece quando erra.
- Como avançar.
- Como pausar e reiniciar.

Utilize mensagens curtas e adequadas ao contexto.

Evite excesso de textos, painéis e elementos competindo com
a questão matemática.

Não transforme o jogo em um painel administrativo.

### Identidade visual

Defina uma paleta coerente.

Utilize cores com contraste adequado e tipografia legível.

Organize os elementos em grupos visuais claros.

Mantenha espaçamentos consistentes.

Utilize botões com áreas de interação confortáveis.

Dê destaque à questão matemática e ao campo de jogo.

Evite elementos decorativos que reduzam a visibilidade das bolas.

Preserve os assets atuais se estiverem adequados.

Não substitua o carro ou o cenário apenas por preferência estética.

### Responsividade

Revise o layout para diferentes tamanhos de janela.

O jogo deve funcionar em resoluções menores sem cortar informações.

A interface deve adaptar-se a janelas estreitas.

Não dependa de um menu lateral fixo de largura constante quando
isso prejudicar o canvas.

A proporção visual do canvas pode ser preservada, mas deve existir
uma estratégia clara para diferentes resoluções.

Não altere incorretamente as coordenadas lógicas de colisão ao
escalar o canvas.

### Feedback visual

Implemente feedback claro para:

- Resposta correta.
- Resposta incorreta.
- Avanço de fase.
- Pausa.
- Fim de partida.
- Novo recorde.

O feedback deve ser perceptível, mas não excessivo.

Se adicionar animações, garanta que elas não interfiram na lógica
matemática nem na atualização do estado.

Se utilizar som, permita silenciar os efeitos.

Não introduza recursos de áudio apenas para cumprir uma lista.

### Instruções e acessibilidade

Implemente instruções acessíveis.

Inclua:

- Navegação por teclado na interface.
- Indicadores de foco visíveis.
- Contraste adequado.
- Rótulos claros nos controles.
- Uso correto de elementos HTML semânticos.
- Estados de botão coerentes.
- Alternativas textuais para informações essenciais do canvas.
- Mensagens de estado acessíveis quando necessário.

Não utilize somente cores para transmitir acerto ou erro.

Evite que as setas de movimento provoquem rolagem indesejada.

Respeite prefers-reduced-motion nas animações não essenciais.

A acessibilidade deve ser incorporada sem prejudicar a experiência
de jogo.

==================================================
13. FASE K — CONTROLES DE TECLADO E TOQUE
==================================================

Mantenha os controles de teclado existentes, corrigindo suas falhas.

Implemente suporte a dispositivos com tela sensível ao toque
quando isso puder ser feito de maneira consistente com a arquitetura.

Como o projeto é atualmente desktop Electron, não transforme o
escopo em uma migração para mobile.

Entretanto, os controles devem ser preparados para o futuro.

Avalie duas formas:

- Botões direcionais.
- Arrastar ou posicionar o carro com o toque.

Escolha a alternativa que produza o comportamento mais previsível
e que não interfira na movimentação por teclado.

Requisitos:

- Os controles devem funcionar com mouse e toque.
- O toque não deve selecionar textos ou provocar zoom acidental
  na área de controle.
- O teclado deve continuar funcionando.
- Não deve haver movimentação após a liberação do controle.
- A pausa deve interromper a movimentação.
- O encerramento da instância deve remover todos os listeners.
- Os controles devem ser acessíveis e ter áreas de interação adequadas.

Não implemente simultaneamente mecanismos redundantes se uma
solução mais simples atender ao objetivo.

==================================================
14. FASE L — DEPENDÊNCIAS, EXECUÇÃO OFFLINE E CSP
==================================================

O proprietário deseja que o aplicativo possa ser utilizado sem
conexão de rede.

Revise o uso do Bootstrap por CDN.

Se a dependência de rede for necessária para a interface, substitua-a
por uma distribuição local adequada e compatível com o projeto.

Faça isso sem adicionar uma cadeia desnecessária de build.

Verifique se o CSS local está incluído corretamente no pacote final.

Não baixe arquivos arbitrários de fontes não confiáveis.

Utilize uma origem oficial ou uma distribuição já disponível no projeto,
verificando sua integridade quando possível.

Se não for possível obter a dependência local de forma segura,
documente a limitação e implemente a melhor alternativa disponível.

Revise a Content Security Policy (CSP).

O objetivo é estabelecer uma política compatível com os recursos
realmente utilizados pela aplicação.

Antes de configurar a CSP:

1. Identifique scripts, estilos, imagens e fontes utilizados.
2. Elimine dependências desnecessárias.
3. Remova handlers inline quando isso for viável.
4. Implemente event listeners explícitos.
5. Defina uma política restritiva compatível com a aplicação.
6. Verifique se a política não impede a execução do jogo.

Não adicione unsafe-eval indiscriminadamente.

Se unsafe-inline for inevitável temporariamente, justifique e registre
o débito técnico em vez de afirmar que a CSP está plenamente endurecida.

Não introduza uma política que faça a aplicação deixar de funcionar.

==================================================
15. FASE M — TESTES AUTOMATIZADOS
==================================================

Os testes são obrigatórios.

O projeto atualmente não possui uma suíte automatizada.

Implemente testes para as regras matemáticas, progressão, pontuação,
persistência e comportamentos relevantes.

Prefira node:test quando for suficiente, aproveitando o Node.js
já instalado.

Não introduza Jest, Vitest, Playwright ou outras dependências
apenas por conveniência.

Se algum comportamento exigir uma ferramenta adicional, justifique
a necessidade antes de introduzi-la.

Os testes devem ser executáveis por um comando documentado.

Crie um script apropriado em package.json, por exemplo:

npm test

Adapte o comando ao ambiente real.

### 15.1 Testes matemáticos

Cubra:

- Geração de soma.
- Geração de subtração.
- Garantia de que a subtração não produz negativos na modalidade atual.
- Geração de multiplicação.
- Geração de divisão exata.
- Ausência de divisão por zero.
- Faixas numéricas de cada dificuldade.
- Correção da resposta.
- Geração de alternativas únicas.
- Inclusão obrigatória da resposta correta.
- Exclusão da resposta correta entre os distratores.
- Ausência de alternativas absurdas.
- Variação da posição correta.
- Comportamento para valores pequenos e grandes.
- Comportamento nos limites da geração aleatória.
- Ausência de loops infinitos.

Os testes não devem depender de sorte.

Utilize aleatoriedade controlada quando necessário.

### 15.2 Testes de progressão

Cubra:

- Estado inicial.
- Avanço de fase.
- Limite de questões para avanço.
- Aumento gradual da dificuldade.
- Velocidade por fase.
- Reinício da progressão.
- Fim de partida.
- Ausência de avanço duplicado.
- Consistência entre fase e parâmetros matemáticos.

### 15.3 Testes de pontuação

Cubra:

- Pontuação por acerto.
- Ausência de pontos por erro.
- Atualização do recorde.
- Preservação do maior recorde.
- Reinício de uma partida.
- Troca de configuração.
- Prevenção de pontuação duplicada após múltiplas colisões.

### 15.4 Testes de armazenamento

Cubra:

- Chave inexistente.
- JSON válido.
- JSON corrompido.
- Falha de leitura.
- Falha de escrita.
- Dados incompletos.
- Valores inválidos.
- Compatibilidade com registros anteriores.
- Preservação dos recordes válidos.

Utilize mocks ou adaptadores simples para simular o localStorage
quando isso facilitar os testes.

### 15.5 Testes de ciclo de vida

Crie testes para o ciclo de vida sempre que for possível isolar
a lógica sem precisar abrir uma janela real.

Verifique:

- Inicialização.
- Destruição.
- Cancelamento do requestAnimationFrame.
- Remoção de listeners.
- Prevenção de inicialização duplicada.
- Prevenção de loops concorrentes.
- Reinício de partida.
- Encerramento após game over.

Não simule comportamentos de maneira tão artificial que os testes
deixem de representar a implementação real.

### 15.6 Testes de integração

Cubra a integração entre:

- Geração da questão.
- Apresentação das alternativas.
- Validação.
- Pontuação.
- Progressão.
- Fim da partida.
- Persistência do recorde.

Quando não for possível testar um componente visual automaticamente
sem uma dependência adicional, documente a limitação e complemente
com verificações manuais.

### 15.7 Qualidade dos testes

Não escreva testes que apenas verifiquem se uma função existe.

Os testes devem validar resultados e invariantes reais.

Evite testes excessivamente dependentes da estrutura interna
da implementação.

Não reduza a cobertura removendo casos difíceis.

Não ignore falhas nem converta erros em sucesso.

Execute os testes após cada grupo de alterações relevantes.

Quando um teste falhar:

1. Determine se o problema está na implementação ou no próprio teste.
2. Corrija a causa.
3. Acrescente um teste de regressão quando apropriado.
4. Execute novamente a suíte completa.

Não considere a tarefa concluída enquanto houver falhas conhecidas
nos testes obrigatórios.

==================================================
16. FASE N — EXECUÇÃO REAL DA APLICAÇÃO
==================================================

O proprietário autorizou a execução da aplicação.

Utilize npm start ou o comando equivalente já existente.

Não assuma que o ambiente possui interface gráfica funcional.

Primeiro verifique se há suporte a display e se o ambiente permite
executar Electron.

Se a execução gráfica estiver disponível:

1. Inicie o aplicativo.
2. Confirme a abertura da janela.
3. Confirme a renderização do menu.
4. Abra o car-math.
5. Confirme a exibição da questão matemática.
6. Confirme o carregamento do carro e do cenário.
7. Teste movimentação.
8. Teste acerto.
9. Teste erro.
10. Teste pausa.
11. Teste reinício.
12. Teste avanço de fase.
13. Teste recorde.
14. Teste tela cheia.
15. Teste retorno à janela normal.
16. Teste fechamento.
17. Abra o jogo novamente.
18. Verifique se há duplicação de loops ou listeners.
19. Teste o comportamento em uma janela menor.
20. Teste os controles de toque se houver uma forma adequada de
    reproduzi-los no ambiente.

Observe o console e os logs durante os testes.

Corrija os erros encontrados dentro do escopo autorizado.

Não considere uma execução sem erros de inicialização suficiente
para afirmar que todas as funcionalidades foram validadas.

Se não houver suporte gráfico, execute os testes automatizados,
as verificações estáticas e os demais testes possíveis.

Nesse caso, registre claramente as verificações que permaneceram
pendentes.

Não afirme que testou visualmente algo que não conseguiu observar.

Não tente contornar limitações do ambiente por meio de alterações
inseguras no sistema.

==================================================
17. FASE O — COMPATIBILIDADE E BUILD
==================================================

Revise o package.json e as configurações do electron-builder.

Mantenha o Windows como plataforma de empacotamento principal.

Prepare a configuração de forma organizada para futuras builds
Linux e Android, sem implementar essas plataformas agora.

Não confunda Android com um target nativo do electron-builder.

Uma versão Android poderá exigir outra estratégia tecnológica,
que deverá ser planejada separadamente.

Execute verificações de dependências quando viável, utilizando
o lockfile existente e sem atualizar pacotes indiscriminadamente.

Avalie vulnerabilidades relevantes e incompatibilidades com a versão
do Electron.

Não aplique automaticamente correções major que possam quebrar
o aplicativo.

Se uma atualização de segurança for necessária, faça uma alteração
controlada e valide seus efeitos.

Execute o build Windows se o ambiente suportar o processo.

Se o ambiente for Linux e não permitir produzir um instalador
Windows confiável, não simule sucesso.

Registre o comando de build e a limitação encontrada.

Não distribua nem publique o instalador.

==================================================
18. FASE P — DOCUMENTAÇÃO PARA PUBLICAÇÃO PÚBLICA
==================================================

O projeto poderá ser publicado publicamente.

Prepare uma documentação inicial adequada.

Crie ou atualize README.md com:

- Nome e objetivo do JGames.
- Descrição do car-math.
- Público e proposta do jogo.
- Tecnologias utilizadas.
- Pré-requisitos.
- Como instalar dependências.
- Como executar em desenvolvimento.
- Como executar os testes.
- Como gerar o pacote.
- Como utilizar o jogo.
- Controles.
- Regras matemáticas.
- Progressão de dificuldade.
- Estrutura de diretórios.
- Estratégia de armazenamento local.
- Limitações conhecidas.
- Estado de suporte das plataformas.
- Como contribuir.
- Licença.

Não declare que o aplicativo suporta plataformas ainda não testadas.

Revise o arquivo package.json para verificar a consistência entre
nome, versão, scripts, licença e descrição.

A licença ISC consta atualmente no projeto, mas não presuma que
ela deva ser mantida sem verificar o contexto e a intenção do autor.

Se o proprietário já definiu a licença, preserve-a.

Se não houver definição explícita, mantenha o valor atual e registre
que ele deve ser confirmado antes da publicação.

Não invente autoria de dependências ou créditos de assets.

Verifique a origem dos assets existentes antes de declarar licenças.

Revise o .gitignore.

Avalie se package-lock.json deve ser versionado para garantir
instalações reproduzíveis.

Normalmente, o lockfile de uma aplicação deve ser versionado,
mas preserve a compatibilidade com o projeto e verifique os efeitos
antes de alterar o comportamento do Git.

Não adicione arquivos de build, instaladores, caches ou node_modules
ao controle de versão.

Não faça commit nem publicação.

==================================================
19. CRITÉRIOS DE ACEITAÇÃO
==================================================

O trabalho somente será considerado concluído quando todos os
critérios aplicáveis tiverem sido verificados.

### Aplicação

- [ ] npm start inicia a aplicação quando o ambiente permite.
- [ ] O menu é renderizado corretamente.
- [ ] O car-math carrega.
- [ ] Os assets são carregados.
- [ ] A janela pode ser fechada normalmente.
- [ ] A tela cheia funciona.
- [ ] É possível sair da tela cheia.
- [ ] O jogo pode ser aberto e encerrado repetidamente.
- [ ] Não há loops duplicados após reabrir o jogo.

### Mecânica

- [ ] As quatro operações funcionam.
- [ ] As regras matemáticas são respeitadas.
- [ ] A resposta correta sempre está disponível.
- [ ] Os distratores não revelam trivialmente a resposta.
- [ ] O jogador consegue identificar a fase atual.
- [ ] A progressão aumenta a dificuldade gradualmente.
- [ ] O avanço de fase funciona.
- [ ] O fim de partida funciona.
- [ ] A pontuação é consistente.
- [ ] Os recordes são preservados.

### Interface

- [ ] O layout é visualmente consistente.
- [ ] As instruções estão visíveis.
- [ ] A questão matemática possui destaque.
- [ ] O jogador recebe feedback.
- [ ] Os controles são compreensíveis.
- [ ] O layout funciona em resoluções menores.
- [ ] Não há elementos essenciais cortados.
- [ ] A navegação por teclado é adequada.
- [ ] O foco visual é perceptível.
- [ ] O canvas possui alternativas textuais essenciais.
- [ ] Os controles de toque funcionam conforme a implementação.

### Qualidade técnica

- [ ] A lógica matemática está separada da renderização.
- [ ] O ciclo de vida possui limpeza explícita.
- [ ] O armazenamento trata dados inválidos.
- [ ] Os testes matemáticos passam.
- [ ] Os testes de progressão passam.
- [ ] Os testes de pontuação passam.
- [ ] Os testes de armazenamento passam.
- [ ] Os testes de ciclo de vida passam, quando aplicáveis.
- [ ] A suíte completa passa.
- [ ] Não existem erros conhecidos ignorados.
- [ ] O projeto mantém sua arquitetura simples.
- [ ] As configurações de segurança do Electron foram preservadas.

### Publicação

- [ ] README.md está atualizado.
- [ ] Os comandos de execução e teste estão documentados.
- [ ] A estrutura do projeto está documentada.
- [ ] A licença está consistente com a decisão do proprietário.
- [ ] Os arquivos de build não foram adicionados ao Git.
- [ ] A aplicação continua offline quando essa é a condição esperada.
- [ ] As limitações de plataformas futuras estão documentadas.

Se algum critério não puder ser verificado, não marque como concluído.
Explique o motivo e indique como a verificação poderá ser feita.

==================================================
20. ORDEM DE IMPLEMENTAÇÃO
==================================================

Execute o trabalho nesta ordem:

ETAPA 1
Diagnóstico, inspeção do Git e validação do ambiente.

ETAPA 2
Correções do Electron, tela cheia e carregamento.

ETAPA 3
Ciclo de vida e limpeza de recursos.

ETAPA 4
Extração da lógica matemática.

ETAPA 5
Implementação dos testes iniciais.

ETAPA 6
Correção dos distratores e das regras de jogo.

ETAPA 7
Progressão por fases e dificuldade.

ETAPA 8
Pontuação, recordes e robustez do armazenamento.

ETAPA 9
Melhoria visual, responsividade e acessibilidade.

ETAPA 10
Controles de teclado e toque.

ETAPA 11
CSP, recursos offline e dependências.

ETAPA 12
Ampliação dos testes, regressões e correções.

ETAPA 13
Execução real da aplicação, quando possível.

ETAPA 14
Build e verificações de compatibilidade.

ETAPA 15
Documentação e relatório final.

Não execute todas as alterações em um único bloco desorganizado.

Trabalhe incrementalmente, verificando os testes após cada grupo
relevante de mudanças.

Se descobrir um defeito adicional, avalie sua relação com o escopo,
corrija-o quando necessário e acrescente um teste de regressão.

Se encontrar um problema fora do escopo, registre-o para uma fase
posterior em vez de ampliar indefinidamente esta implementação.

==================================================
21. RELATÓRIO FINAL OBRIGATÓRIO
==================================================

Ao concluir, apresente um relatório em português brasileiro dentro de um diretorio de nome 'docs/' no projeto.

Inclua:

1. Resumo executivo.
2. Estado inicial do repositório.
3. Arquivos criados.
4. Arquivos alterados.
5. Principais correções realizadas.
6. Melhorias de arquitetura.
7. Regras de progressão implementadas.
8. Melhorias visuais e de acessibilidade.
9. Testes criados.
10. Quantidade de testes executados e aprovados.
11. Testes que não puderam ser executados.
12. Bugs encontrados durante a execução.
13. Bugs corrigidos.
14. Resultado de npm start.
15. Resultado do build, se executado.
16. Resultado das verificações de segurança.
17. Limitações restantes.
18. Comandos para executar o projeto.
19. Comandos para executar os testes.
20. Comando para gerar o pacote.
21. Checklist de critérios de aceitação.
22. Próximos passos recomendados.

Informe os caminhos dos arquivos relevantes.

Não declare sucesso sem evidências.

Se a aplicação tiver sido executada visualmente, informe o que foi
efetivamente observado.

Se não tiver sido possível abrir a janela, informe essa limitação.

Se todos os testes passarem, apresente a quantidade real de testes
executados.

Se algum teste falhar, não o oculte.

Não faça commit nem push.

==================================================
22. DEFINIÇÃO DE PRONTO
==================================================

O car-math deve terminar esta fase como um módulo funcional,
estável, testado e documentado.

A arquitetura do JGames deverá estar preparada para que futuros jogos
sejam adicionados sem misturar a lógica de um módulo com a de outro.

Não implemente um segundo jogo.

Não faça uma reescrita completa sem justificativa.

Não introduza complexidade desnecessária.

Priorize a confiabilidade, a experiência do jogador, a qualidade dos
testes e a manutenção futura.

O objetivo é finalizar bem o que já existe para que a próxima fase
possa se concentrar no planejamento e desenvolvimento de novos jogos.

COMECE PELA INSPEÇÃO DO REPOSITÓRIO E EXECUTE O PLANO ATÉ ONDE O
AMBIENTE PERMITIR, CORRIGINDO OS PROBLEMAS ENCONTRADOS E VALIDANDO
CADA ETAPA.