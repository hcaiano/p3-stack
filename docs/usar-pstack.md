# Usar o pstack no T3 Code

Os comandos mantêm os nomes oficiais: `/poteto-mode`, `/poteto-help` e
`/setup-pstack`. No teu setup, poteto-mode fica ativo por defeito para engineering. Continua a
conversar no T3 com o modelo que preferires. As delegações escolhem contas e
modelos através do catálogo do T3 e da `t3-capacity`, incluindo Cursor.

## Primeiro projeto

Abre uma conversa no projeto e começa por preparar a verificação:

```text
/create-verification-skill
Reutiliza as ferramentas de desenvolvimento que já temos. Prepara uma forma
reproduzível de arrancar a app, percorrer as funcionalidades e verificar o
resultado. Começa pelos percursos principais e demonstra que os consegues usar.
```

A skill cria instruções locais e um mapa das funcionalidades: o que cada uma
faz, como lá chegar e o que observar para confirmar que funciona. Pode criar
pequenas ferramentas quando forem necessárias. A instalação global fornece o
método; cada aplicação fornece o seu ambiente e os percursos verificáveis.

Depois escolhe um issue pequeno e bem definido:

```text
/poteto-mode resolve o issue #123. Segue as regras de issues deste projeto,
reproduz o problema na app e usa a verificação do projeto para confirmar a
correção. Prepara o PR com a evidência. Pede-me aprovação antes do merge.
```

O agente escolhe o playbook e os passos de investigação, implementação e review.
Não precisas de escrever uma sequência de skills em todos os pedidos. As tuas instruções globais ativam o método; podes descrever a tarefa normalmente.
O comando `/poteto-mode` continua disponível para uma invocação explícita.
Se o seletor não reconhecer a barra, escreve `usa a skill poteto-mode` no pedido.

## Quando ainda não sabes o que construir

```text
/poteto-mode lê este issue e explica por palavras tuas o problema que temos de
resolver. Investiga o comportamento e o histórico antes de propor alterações.
```

Para entender o sistema, usa `/teach`. `/how` investiga o funcionamento;
`/why` procura as razões nas fontes acessíveis. `/recall` recupera contexto de
conversas anteriores. O acesso depende do histórico e das ferramentas disponíveis
no ambiente T3; não assumes que um host consegue ler automaticamente o outro.

```text
/recall o trabalho anterior no signup. /teach como funciona agora e porquê.
```

Para uma decisão visual ou técnica com várias soluções:

```text
/poteto-mode cria três protótipos para melhorar este fluxo. Experimenta-os na app,
mostra as diferenças e deixa-me escolher antes da implementação final.
```

Para uma alteração de arquitetura:

```text
/poteto-mode usa architect para desenhar esta alteração. Resolve as dúvidas com
protótipos e mostra-me como seria usada antes de avançar.
```

O método da parte 2 é investigar, construir contexto e comparar soluções com
código executável. Um documento abstrato longo não substitui essa prova.

## Contas e preferências

O default global é `capacity`: preserva os papéis e o número de lugares dos
painéis e escolhe um modelo adequado para cada um. Entre contas adequadas,
considera quota, pace e reset. Duas contas Codex não contam como duas famílias
de modelos diferentes num painel. Capacidade desconhecida não é quota livre.

Podes continuar a dizer `usa Sol`, `pede esta revisão ao Opus` ou indicar uma
conta. A escolha explícita tem prioridade. `/setup-pstack` permite guardar escolhas
fixas globais ou por projeto; não é necessário para começar.

As subscrições dão capacidade de modelo. Não fornecem os computadores isolados
dos cloud agents descritos no artigo. O paralelismo local depende dos recursos
do PC/MBP, da verificação e do isolamento que o T3 disponibiliza.

## Manter a verificação útil

Corre `/maintain-verification-skill` depois de alterações relevantes ao produto
ou quando encontrares instruções desatualizadas. A autora recomenda manutenção
frequente; nenhum agendamento é criado só por instalar este fork. Um pedido
explícito pode configurar uma rotina T3 mais tarde.

## Fontes

- [Parte 1: verificação e mapa de funcionalidades](https://x.com/poteto/status/2094457600259842065).
- [Parte 2: investigação, protótipos e arquitetura](https://x.com/poteto/status/2097732320606507506).

Os exemplos acima estão adaptados ao teu T3, às regras dos teus projetos e ao
nome das skills neste port. As aprovações que definiste continuam a aplicar-se.
