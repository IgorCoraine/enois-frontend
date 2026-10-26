# AGENTS.md — contrato operacional para agentes de IA

Inspirado no contrato do [KofLang](https://github.com/KofLang/Kof4j) (AGENTS.md), destilado para a
realidade deste projeto. **Este arquivo é lido por todo agente de IA antes de trabalhar aqui** — as
regras valem para agentes autônomos, sessões assistidas e contribuições humanas que usam IA.

## Papel e autoridade

- **IA acelera a implementação; IA não define arquitetura, produto nem política.**
- Design, prioridades e merge para a branch de produção são decisão da mantenedora.
- Fluxo de entrega: **feature → `qa` → `main`**. PR precisa de aprovação de alguém que não empurrou
  o código.
- Toda mudança relevante tem origem rastreada (issue, tarefa do backlog ou pedido da mantenedora).
- **Toda entrega tem prova**: teste executado, verificação de tela ou sonda de produção. Concluído
  significa comprovado, não pretendido.

## Estado do projeto — ler antes de trabalhar

1. `git fetch` + `git log` recente: **confira que outro agente não está fazendo a mesma coisa**
   (branches, PRs abertos, commits de hoje). Trabalho duplicado já aconteceu — checar antes.
2. `docs/` — arquitetura, componentes, rotas, modelos de dados e configuração do app.
3. [`CONTRIBUTING.md`](CONTRIBUTING.md) — estrutura, comandos e regras de código.
4. O contrato com o backend é a API: mudança de formato de resposta exige os dois lados na mesma
   entrega (ou PRs coordenados).

## Ciclo de trabalho

1. Ler o estado (acima).
2. Escolher a tarefa de maior valor que ninguém reivindicou.
3. Implementar **um escopo completo** — nada de meio-corte.
4. Testar: `npm run lint`, `npm run typecheck`, `npx vitest run` e `npm run build` quando o escopo
   pedir. Verificação de tela: Playwright/headless com as receitas do projeto.
5. Commit com mensagem **neutra e curta** (ver segurança abaixo).
6. Push na sua branch e PR para `qa`. Nunca termine com trabalho não commitado.
7. Antes de commitar: `git fetch`, reconcilie com o remoto, procure marcadores de conflito
   (`<<<<<<<`), rode os checks de novo na árvore final.

## Regras de segurança (não negociáveis)

- **O repositório é público e há atacante lendo.** Mensagem de commit e descrição de PR são neutras:
  diga _o que_ mudou, **nunca detalhe _como_ uma falha de segurança foi corrigida** (vetor, payload,
  regra de detecção).
- **Segredo nunca em código, log, commit, PR ou relatório.** Token de sessão, chave e dado pessoal
  (e-mail, IP, telefone) não aparecem em lugar algum — nem em fixture de teste ou storybook.
- **Nunca desative um controle de segurança para fazer o build ou o teste passar.**
- **Produção é intocável por agente:** nenhuma ação destrutiva, nenhuma escrita, nenhuma conta de
  teste. Validação de produção é sonda de leitura (tela pública, chunk servido) e API de leitura.
- **Push em `main` ou `qa` dispara deploy automático.** Não force, não dispare workflow manual. Se o
  deploy falhar, diagnostique pelo log de CI e reporte.
- Nunca renderize, logue ou persista dado que veio de resposta de API em lugar público (relatório,
  screenshot, issue) — e-mail, IP e conteúdo privado entram.

## Qualidade (gates)

- **Regra do escoteiro: toda falha é corrigida quando encontrada.** Teste quebrado ou instável,
  build quebrado, erro de lint ou de tipo, bug ou falha de segurança que você encontrar é corrigido
  na mesma tarefa, mesmo que seja anterior à sua mudança. "Já falha na `main`" não é motivo para
  deixar como está. Se o conserto estiver realmente fora de alcance (depende de decisão dos
  mantenedores, de acesso à infraestrutura, ou é grande demais para a tarefa), registre na mesma
  tarefa (issue ou item do backlog) e diga na PR — nunca deixe em silêncio.
- **Zero regressão.** Bug corrigido ganha teste de prova que falharia antes do conserto.
- **Sem stub, sem TODO fingindo conclusão, sem asserção enfraquecida, sem fallback silencioso.**
  Tela de carregamento, vazio e erro explícitos — nada de "silently swallowing errors".
- **Evidência antes de inferência.** "Desconhecido" em vez de "provavelmente". Nunca invente
  componente, hook ou prop — verifique no código-fonte.
- **O typecheck e os testes mandam sobre a memória.** Comportamento incerto? Verifique no código.
- Responsividade é requisito: telas novas/alteradas testam em mobile (390px) e desktop antes da PR.

## Armadilhas conhecidas deste repositório

- **SSR renderiza antes do cliente:** `beforeLoad` não roda em deep link servido por SSR — telas
  protegidas precisam da revalidação central do cliente, senão o app "vaza" para deslogado.
- **Grid/flex sem base columns + filhos com `min-width:auto` = overflow mobile.** O conserto é
  `min-w-0`; medido com Playwright/headless a 390px.
- **60 temas × 2 modos:** contraste deve ser calculado dentro de `page.evaluate` (não no Node) e o
  tema precisa do `themeCollection` na store além da chave standalone.
- O proxy de dev exige `BACKEND_TARGET` como origem completa — senão as chamadas viram `/api/api/...`.
- `pkill` com padrão do próprio comando mata o próprio shell (use o truque `[r]`).
- Cache de service worker: bump de versão e `no-store` no HTML, senão o bundle fica preso.

## Multiagente

- O repositório é trabalhado por vários agentes em paralelo. **Nunca empurre trabalho alheio**, nunca
  force a branch de outro, nunca dispute a mesma cópia de trabalho.
- `npm install` / build em paralelo? Use `git worktree` separado — os processos brigam pelo mesmo
  `node_modules` e `dist`.
- Se o push falhar porque o remoto andou, **reconcilie com o conteúdo atual** (preserve os dois
  lados), nunca sobrescreva.

## Documentação

- `docs/` descreve o que **existe** (implementado e verificado). Plano não implementado fica em
  issue ou na seção de planejado.
- Decisão tomada em conversa vira documento no mesmo commit que a implementa.
- Código mudou? A doc do módulo muda junto no mesmo PR.

## Contribuindo com IA

Veja a seção "Contribuições com IA" no [`CONTRIBUTING.md`](CONTRIBUTING.md). Resumo: declare o uso,
entenda cada linha que submete, entregue prova, e a revisão humana antes do merge continua sendo a
regra.
