# Especificação Funcional — Evolução do Dashboard MiniMerX

**Documento:** Especificação Funcional de Produto
**Produto:** Dashboard MiniMerX — Portal de Prestação de Contas para Condomínios
**Versão do Documento:** 1.0
**Data de Referência:** Abril/2026
**Responsável pela Especificação:** Product Management / Análise de Negócios
**Status:** Documento funcional — base para desenvolvimento futuro
**Escopo:** Evolução das funcionalidades existentes com foco em transparência financeira, prestação de contas, organização documental, comunicação formal e governança.

> Este documento não contém código, arquitetura técnica detalhada, SQL, rotas de API ou qualquer elemento de implementação. Seu propósito é servir como base funcional completa para alinhamento entre negócio, produto, design e desenvolvimento.

---

## Sumário

1. Visão Geral do Produto
2. Contexto do Negócio
3. Objetivo desta Fase
4. Escopo desta Especificação
5. Estado Atual do Sistema
6. Problemas que as Novas Funcionalidades Resolvem
7. Perfis de Usuário
8. Regras de Permissão por Perfil
9. Funcionalidades Existentes
10. Novas Funcionalidades Obrigatórias
11. Funcionalidades Recomendadas
12. Regras de Negócio
13. Fluxos Principais de Uso
14. Campos e Dados Necessários por Funcionalidade
15. Estados e Status Possíveis
16. Validações
17. Exceções e Cenários de Erro
18. Critérios de Aceite
19. Prioridade Recomendada por Funcionalidade
20. Sugestões Futuras de Evolução do Produto
21. Prioridades Recomendadas (Roadmap)
22. Riscos de Produto e Processo
23. Sugestões de Evolução Futura (Longo Prazo)
24. Resumo Executivo

---

## 1. Visão Geral do Produto

O Dashboard MiniMerX é uma plataforma web de prestação de contas, transparência financeira e comunicação formal entre a operação da MiniMerX — rede de mercadinhos autônomos 24 horas e lavanderias autônomas instaladas em condomínios residenciais — e os condomínios parceiros representados por seus síndicos, administradoras e conselhos fiscais.

O produto atua como ponto único de verdade para os números operacionais (faturamento e vendas), para o fluxo financeiro (valores de repasse devidos ao condomínio), para a documentação associada (comprovantes de repasse, relatórios mensais, comunicados) e para o histórico de interações entre a operação e cada condomínio. Em termos de modelo de negócio, o dashboard é a camada B2B2C que sustenta a relação contratual entre a MiniMerX e cada condomínio, evidenciando de forma auditável a contraprestação financeira decorrente da operação de cada mercadinho ou lavanderia.

A premissa central do produto é transformar uma relação tradicionalmente opaca — em que síndicos recebem extratos por e-mail de forma dispersa e precisam guardar comprovantes manualmente — em uma relação transparente, rastreável e profissional, fortalecendo a reputação da MiniMerX, reduzindo atrito no relacionamento com os condomínios e criando uma barreira de diferenciação competitiva frente a concorrentes do setor de mercadinhos autônomos.

---

## 2. Contexto do Negócio

A MiniMerX opera uma rede de pontos autônomos dentro de condomínios residenciais, majoritariamente sob dois formatos: mercadinhos 24 horas (self-service com checkout por aplicativo, cartão ou outro meio digital) e lavanderias autônomas. Em troca da cessão do espaço físico dentro do condomínio, a operação remunera o condomínio com um percentual de repasse sobre o faturamento bruto gerado em cada unidade, definido contratualmente e podendo variar por ponto.

Os principais interlocutores do lado do condomínio são o síndico titular, o conselho fiscal, eventuais administradoras terceirizadas contratadas pelo condomínio para gestão financeira e, em alguns casos, moradores específicos designados para acompanhamento da parceria. Esses interlocutores demandam, recorrentemente, informações sobre faturamento do período, cálculo do repasse, comprovação bancária do pagamento efetuado, histórico mensal, além de registro formal dessas informações para fins de prestação de contas em assembleia, relatório anual ao conselho e auditoria interna ou externa do condomínio.

Do lado da operação, a MiniMerX possui uma equipe administrativa responsável pelo fechamento mensal por unidade, pela efetivação dos repasses financeiros via transferência bancária e pela comunicação formal com cada condomínio. A ausência de uma ferramenta consolidada gera sobrecarga operacional, risco de inconsistências e dificuldade de escalar a operação para novos condomínios, além de expor a empresa a questionamentos recorrentes sobre valores, datas e comprovações.

O produto, portanto, endereça simultaneamente três dores estruturais: a dor do síndico (falta de transparência e dificuldade de prestar contas ao condomínio), a dor da operação (retrabalho, perda de histórico, risco reputacional) e a dor contratual (ausência de registro auditável que sustente o cumprimento das obrigações financeiras previstas no contrato entre as partes).

---

## 3. Objetivo desta Fase

O objetivo desta fase de evolução é transformar o dashboard, hoje focado em visualização de vendas e repasses, em uma plataforma completa de prestação de contas e governança financeira entre a MiniMerX e seus condomínios. A evolução deve entregar, em sua essência, sete capacidades estruturantes: transparência financeira auditável, prestação de contas organizada por competência, organização documental centralizada, histórico acessível de repasses, comunicação formal rastreável, visibilidade operacional para síndicos e base sólida de governança e auditoria.

Especificamente, esta fase deve viabilizar que todo repasse financeiro efetuado pela MiniMerX seja acompanhado do seu comprovante bancário devidamente armazenado, vinculado à competência correta e comunicado ao condomínio por canal formal (e-mail) com registro completo da entrega. Deve ainda viabilizar que o síndico, ao entrar no portal, encontre em um único lugar todo o histórico financeiro, documental e de comunicações do seu condomínio, sem depender de buscas em caixas de entrada de e-mail ou pastas locais.

A fase não contempla mudanças estruturais na lógica de cálculo de faturamento ou repasse, tampouco a integração com sistemas bancários, ERPs ou gateways de pagamento. Foca-se em organização, rastreabilidade, comunicação e experiência de usuário, deixando integrações automatizadas como evolução futura.

---

## 4. Escopo desta Especificação

Estão no escopo desta especificação as funcionalidades obrigatórias solicitadas pelo negócio — upload de comprovantes de repasse, envio de e-mail com fechamento e comprovante, e histórico completo dentro da aplicação — bem como funcionalidades recomendadas que complementam o valor entregue: central de documentos por condomínio, timeline de auditoria, alertas e pendências, confirmação de recebimento ou visualização, exportação de relatórios, painel executivo para síndico, observações e notas administrativas e calendário de fechamento.

Estão também no escopo a definição dos perfis de usuário aplicáveis ao produto evoluído, a matriz de permissões por perfil, as regras de negócio que regem as funcionalidades, os fluxos principais de uso, os campos necessários em cada tela, os estados e status de cada entidade crítica, as validações aplicáveis, os cenários de exceção, os critérios de aceite funcionais e a priorização recomendada para planejamento de releases.

Estão fora do escopo desta especificação a arquitetura técnica da solução, a modelagem do banco de dados, o design visual detalhado das telas (wireframes de alta fidelidade), a definição de stack tecnológica adicional, qualquer integração com sistemas externos (bancos, ERPs, Receita Federal, sistemas de contabilidade condominial) e a quebra em tarefas de desenvolvimento. Esses itens serão tratados nas fases subsequentes de design, refinamento técnico e implementação.

---

## 5. Estado Atual do Sistema

O dashboard atual já entrega um conjunto mínimo de funcionalidades que estabelece a fundação para a evolução proposta. Hoje, o sistema possui um módulo de visualização de faturamento por unidade, permitindo que a operação acompanhe as vendas diárias, semanais, mensais e anuais geradas em cada mercadinho ou lavanderia, com segregação por condomínio. A visualização de repasse também já existe, calculando dinamicamente o valor devido ao condomínio com base no percentual contratual parametrizado por unidade.

A plataforma já opera com segregação de dados por mercado, unidade e condomínio, garantindo que síndicos vejam apenas informações do seu próprio condomínio, enquanto administradores da operação têm visão consolidada de toda a rede. Existe uma página administrativa que permite ao administrador master gerir os condomínios cadastrados, os percentuais de repasse e os usuários síndicos vinculados.

Existe ainda uma página voltada aos síndicos para cadastro dos endereços de e-mail das pessoas autorizadas a receber comunicações do condomínio — tipicamente o próprio síndico, subsíndico, membros do conselho fiscal e eventuais representantes da administradora do condomínio.

A ingestão de dados ocorre via upload de planilha Excel (.xls) processada pela equipe administrativa, contendo as vendas por unidade, data e valor. O sistema já realiza a normalização e a associação dessas vendas ao condomínio correspondente, armazenando-as para posterior consulta e cálculo de repasse.

Apesar dessa fundação, o sistema ainda não oferece mecanismos para comprovação do repasse (nenhum comprovante é anexado ou armazenado), não dispõe de canal de comunicação formal integrado (e-mails são enviados fora da plataforma, se enviados), não mantém histórico estruturado por competência, não oferece central documental, não oferece trilha de auditoria, não possui alertas para pendências operacionais e não disponibiliza exportação de relatórios. Essas lacunas são exatamente o que esta fase de evolução pretende endereçar.

---

## 6. Problemas que as Novas Funcionalidades Resolvem

A principal classe de problemas endereçada pela evolução é a falta de comprovação formal do repasse. Hoje, após a operação executar a transferência bancária ao condomínio, o comprovante circula por canais informais — WhatsApp, e-mail pessoal, ocasionalmente sem registro —, gerando insegurança para o síndico ao prestar contas em assembleia e risco reputacional para a MiniMerX ao não conseguir reconstituir rapidamente o que foi pago, quando e para quem. Ao permitir o upload do comprovante vinculado à competência e ao condomínio, o sistema passa a ser a fonte única de verdade financeira.

Outra classe crítica de problemas é a dispersão e a perda de histórico. Síndicos rotativos — cargo que costuma trocar a cada um ou dois anos — herdam pastas de e-mail desorganizadas de seus antecessores e frequentemente não conseguem reconstruir o histórico de repasses dos anos anteriores. Administradoras condominiais, por sua vez, demandam este histórico para auditoria fiscal e para o balanço anual do condomínio. A centralização do histórico mensal de fechamentos, repasses, comprovantes e comunicações dentro do portal garante continuidade independentemente da troca de síndico ou administradora.

A ausência de comunicação formal rastreável é um terceiro eixo de dor. Sem registro do que foi enviado, quando foi enviado, para quem foi enviado e se foi efetivamente entregue, qualquer disputa ou questionamento por parte do condomínio expõe a operação. A funcionalidade de envio de e-mail integrado, com histórico de destinatários, status de entrega e vínculo com o comprovante, elimina a ambiguidade do "não recebi" e cria evidência objetiva do cumprimento da obrigação de comunicar o repasse.

A ausência de governança operacional para a equipe interna é o quarto eixo: sem alertas sobre condomínios sem destinatário cadastrado, fechamentos sem comprovante anexado, comprovantes não enviados ou falhas de entrega, a operação depende de checagens manuais e planilhas paralelas para garantir que nenhum condomínio fique descoberto ao final do ciclo mensal. Alertas e pendências automáticas reduzem risco operacional e permitem escalar a rede para mais condomínios sem proporcionalmente aumentar o custo de backoffice.

Por fim, a falta de experiência profissional no portal do síndico enfraquece a percepção de valor da parceria com a MiniMerX. Ao entregar um painel executivo limpo, com documentos organizados, trilha de auditoria visível e exportação de relatórios, a MiniMerX transforma o dashboard de uma ferramenta operacional interna em um diferencial competitivo comercial, utilizável inclusive como argumento de venda em novas negociações com administradoras e condomínios.

---

## 7. Perfis de Usuário

A evolução do produto exige uma definição mais granular dos perfis de usuário, superando a divisão binária atual entre administrador e síndico. Cinco perfis são considerados nesta especificação, cada um com responsabilidades, visibilidade e poder de ação distintos.

### 7.1 Administrador Master da Operação

O administrador master é o perfil de maior privilégio dentro da MiniMerX. Tipicamente ocupado por um sócio, diretor ou gestor operacional sênior, este usuário tem visão consolidada de todos os condomínios da rede, pode criar e remover usuários de qualquer perfil, pode alterar percentuais de repasse contratuais, pode executar e desfazer operações sensíveis (como cancelamento de comprovante ou reenvio de comunicações) e tem acesso total à trilha de auditoria. Este perfil é responsável final pela integridade dos dados e pelas decisões de governança do sistema.

### 7.2 Usuário Administrativo Interno

O usuário administrativo interno representa a equipe operacional do dia a dia da MiniMerX — tipicamente analistas financeiros ou de backoffice. Este perfil executa as tarefas de ingestão de vendas, fechamento mensal, upload de comprovantes, envio de comunicações e resolução de pendências, porém sem poder alterar percentuais contratuais, criar condomínios do zero ou remover registros históricos. É o perfil que opera o sistema no cotidiano.

### 7.3 Síndico

O síndico é o representante legal do condomínio perante a MiniMerX, o usuário mais relevante da camada externa e o principal beneficiário do produto do ponto de vista de transparência. Tem acesso exclusivamente ao seu condomínio e pode visualizar dashboard financeiro, histórico de repasses, comprovantes disponibilizados, comunicações enviadas, documentos da central documental e pendências que demandem sua ação (como cadastro de destinatários ou confirmação de recebimento). Pode cadastrar e manter a lista de e-mails autorizados a receber comunicações. Não tem permissão para alterar dados financeiros.

### 7.4 Usuário Financeiro do Condomínio

O usuário financeiro do condomínio representa tipicamente a administradora condominial contratada ou o conselho fiscal. Trata-se de um perfil cuja necessidade é eminentemente de consulta e download de documentos para fins de auditoria, balanço e prestação de contas interna do condomínio. Tem visibilidade do mesmo escopo do síndico no que se refere a dados financeiros e documentais, mas não gerencia a lista de destinatários nem executa ações operacionais. Sua função é acessar, validar e arquivar.

### 7.5 Usuário Somente Leitura

O usuário somente leitura é um perfil genérico de consulta, aplicável a moradores indicados pelo síndico (como um conselheiro interessado em acompanhar a parceria), estagiários da MiniMerX em treinamento ou auditores externos contratados pontualmente. Tem acesso visual a dashboards e histórico, porém não pode baixar documentos, não pode exportar relatórios, não pode editar destinatários e não pode executar nenhuma ação que altere o estado do sistema.

---

## 8. Regras de Permissão por Perfil

A matriz de permissões abaixo define, por perfil, as ações permitidas sobre cada área funcional do sistema. Ela deve ser lida como contrato funcional: qualquer tela, ação ou endpoint do produto deve respeitar esta matriz e ser defensivamente validada no backend, independentemente da renderização do frontend.

### 8.1 Administrador Master da Operação

Pode visualizar todos os condomínios, todos os dados financeiros, todo o histórico, todas as comunicações, a trilha de auditoria completa e todas as pendências. Pode cadastrar novos condomínios, novos usuários de qualquer perfil, novos percentuais contratuais de repasse e novas observações administrativas. Pode editar qualquer campo não imutável, incluindo dados cadastrais do condomínio, percentuais, destinatários, status de comprovantes, observações e configurações globais. Pode excluir registros dentro das regras de imutabilidade — historicamente, nenhuma exclusão física é permitida após um comprovante ter sido enviado ao condomínio; apenas cancelamento lógico com trilha. Pode enviar e reenviar comunicações a qualquer condomínio. Pode baixar qualquer arquivo ou relatório do sistema. Pode consultar, sem restrição, toda a trilha de auditoria.

### 8.2 Usuário Administrativo Interno

Pode visualizar todos os condomínios, todos os dados financeiros operacionais e a trilha de auditoria restrita aos eventos em que participou ou que sejam relevantes ao seu fluxo. Pode cadastrar novos fechamentos, novos comprovantes, novas observações e novos destinatários sob solicitação do síndico. Pode editar dados cadastrais operacionais (sem alterar percentual contratual de repasse), status de comprovantes dentro do fluxo operacional e observações não publicadas. Não pode excluir registros históricos, apenas substituí-los dentro das regras de versionamento. Pode enviar e reenviar comunicações operacionais. Pode baixar arquivos e relatórios. Pode consultar trilha de auditoria de sua responsabilidade.

### 8.3 Síndico

Pode visualizar exclusivamente os dados do seu condomínio: dashboard financeiro, histórico de repasses, comprovantes, comunicações e pendências pertinentes. Pode cadastrar e editar a lista de destinatários de e-mail do seu condomínio. Não pode editar valores de faturamento, repasse, percentuais ou qualquer dado financeiro. Não pode excluir registros do sistema. Não pode enviar comunicações (recebe-as). Pode baixar comprovantes, relatórios disponibilizados e documentos da central documental relativos ao seu condomínio. Pode consultar a trilha de auditoria restrita aos eventos do seu condomínio.

### 8.4 Usuário Financeiro do Condomínio

Pode visualizar os mesmos dados que o síndico do seu condomínio. Não pode cadastrar ou editar destinatários, não pode executar ações operacionais. Pode baixar todos os documentos disponibilizados e exportar relatórios. Pode consultar a trilha de auditoria restrita aos eventos do seu condomínio. Seu escopo é de consulta qualificada para fins de auditoria e prestação de contas.

### 8.5 Usuário Somente Leitura

Pode visualizar dashboard e histórico do condomínio ao qual foi vinculado. Não pode cadastrar, editar ou excluir nada. Não pode enviar comunicações. Não pode baixar arquivos nem exportar relatórios (apenas visualizar online). Pode consultar trilha de auditoria restrita, sem exportação.

### 8.6 Tabela-Resumo da Matriz de Permissões

A tabela abaixo sintetiza a matriz. As colunas representam ações sobre áreas funcionais do sistema; as linhas representam os perfis. A legenda é: Total (pleno poder de ação), Parcial (ação com limitações descritas nas seções anteriores), Leitura (apenas visualizar), Próprio (apenas sobre dados do seu condomínio) e Negado (sem acesso).

| Área / Perfil | Admin Master | Admin Interno | Síndico | Financeiro Cond. | Somente Leitura |
|---|---|---|---|---|---|
| Visualizar dashboard | Total | Total | Próprio | Próprio | Próprio |
| Visualizar histórico | Total | Total | Próprio | Próprio | Próprio |
| Cadastrar condomínio | Total | Negado | Negado | Negado | Negado |
| Editar percentual de repasse | Total | Negado | Negado | Negado | Negado |
| Cadastrar destinatários | Total | Parcial | Próprio | Negado | Negado |
| Editar destinatários | Total | Parcial | Próprio | Negado | Negado |
| Upload de comprovante | Total | Total | Negado | Negado | Negado |
| Substituir comprovante | Total | Parcial | Negado | Negado | Negado |
| Cancelar comprovante | Total | Negado | Negado | Negado | Negado |
| Enviar e-mail | Total | Total | Negado | Negado | Negado |
| Reenviar e-mail | Total | Total | Negado | Negado | Negado |
| Baixar comprovantes | Total | Total | Próprio | Próprio | Negado |
| Exportar relatórios | Total | Total | Próprio | Próprio | Negado |
| Registrar observação | Total | Parcial | Negado | Negado | Negado |
| Visualizar observação pública | Total | Total | Próprio | Próprio | Próprio |
| Consultar trilha de auditoria | Total | Parcial | Próprio | Próprio | Próprio |
| Gerenciar usuários | Total | Negado | Negado | Negado | Negado |

---

## 9. Funcionalidades Existentes

As funcionalidades a seguir compõem o estado atual do sistema e servem de base para a evolução. A descrição é feita em nível funcional para que a documentação seja autocontida.

### 9.1 Visualização de Faturamento

O dashboard atual apresenta ao usuário autorizado o faturamento bruto gerado em cada unidade de mercadinho ou lavanderia, com filtros por período (dia, semana, mês, ano) e agregação por condomínio. A visualização contempla cards de métrica no topo da tela, gráfico de barras para a série temporal e tabela detalhada com valores diários. A segregação por perfil já é aplicada, restringindo síndicos ao seu próprio condomínio.

### 9.2 Visualização de Repasse

Para cada condomínio, o dashboard exibe o valor de repasse calculado dinamicamente com base no faturamento acumulado e no percentual contratual parametrizado. O valor é apresentado em cards de métrica específicos (repasse do mês, repasse do ano) e como destaque na tabela detalhada. A lógica de cálculo é aplicada no backend para garantir consistência.

### 9.3 Segregação de Informações por Mercado, Unidade e Condomínio

O sistema já mantém a hierarquia condomínio → unidade → venda e aplica regras de segregação com base no perfil e no vínculo do usuário. Essa fundação é pré-requisito para todas as novas funcionalidades e não requer retrabalho estrutural.

### 9.4 Página Administrativa

A página administrativa atual permite ao administrador master cadastrar condomínios, definir percentuais contratuais de repasse, associar usuários síndicos a condomínios e realizar o upload da planilha Excel com as vendas do período. É o ponto de entrada para toda a operação interna sobre os dados.

### 9.5 Cadastro de Destinatários pelo Síndico

Cada síndico possui área dedicada para cadastrar os endereços de e-mail autorizados a receber comunicações do seu condomínio. Tipicamente são cadastrados o próprio síndico, o subsíndico, membros do conselho e representantes da administradora. Esta funcionalidade é pré-requisito crítico para a nova funcionalidade de envio de e-mails com comprovante e fechamento.

---

## 10. Novas Funcionalidades Obrigatórias

Esta seção detalha as três funcionalidades obrigatórias solicitadas pelo negócio. Cada uma é descrita no modelo definido na seção 9 do briefing: nome, objetivo, problema que resolve, usuários envolvidos, pré-requisitos, gatilho de uso, fluxo principal, fluxos alternativos, regras de negócio, permissões, campos necessários, validações, status possíveis, exceções, critérios de aceite, prioridade e dependências.

### 10.1 Upload de Comprovantes de Repasse

**Nome da funcionalidade:** Upload e gestão de comprovantes de repasse financeiro.

**Objetivo:** Permitir que a equipe administrativa da MiniMerX registre, na plataforma, o comprovante bancário do repasse efetuado a cada condomínio em cada competência mensal, garantindo armazenamento seguro, associação à competência correta, rastreabilidade e disponibilização controlada aos destinatários autorizados.

**Problema que resolve:** Hoje, os comprovantes de transferência bancária circulam por canais informais (WhatsApp, e-mail pessoal) ou simplesmente não são armazenados. Isso compromete a capacidade de reconstituir a história financeira da parceria, expõe a operação a disputas e impede o síndico de prestar contas com segurança ao condomínio.

**Usuários envolvidos:** Administrador master (gestor), usuário administrativo interno (executor), síndico (consumidor), usuário financeiro do condomínio (consumidor), usuário somente leitura (visualização sem download).

**Pré-requisitos:** Condomínio cadastrado; competência (mês/ano) definida; valor de fechamento calculado e valor de repasse apurado para o período; arquivo físico do comprovante disponível em formato aceito.

**Gatilho de uso:** O administrativo acessa o módulo de comprovantes, seleciona o condomínio e a competência, e executa o upload após efetuar ou confirmar a transferência bancária correspondente.

**Fluxo principal:** O usuário administrativo navega até a área de gestão de comprovantes, seleciona o condomínio alvo a partir de lista, escolhe a competência (mês/ano de referência) entre as competências em aberto ou fechadas sem comprovante, arrasta ou seleciona o arquivo do comprovante, preenche campos complementares (valor do repasse pago, data do pagamento, forma de pagamento, observações opcionais), confirma a operação, o sistema persiste o arquivo em armazenamento seguro, registra metadados completos (quem subiu, quando subiu, tamanho, hash), vincula o comprovante à competência e ao condomínio, atualiza o status do comprovante para "anexado" e exibe confirmação visual ao usuário. O comprovante passa a constar no histórico do condomínio, porém ainda não é enviado — o envio é uma ação posterior e independente.

**Fluxos alternativos:** (a) Upload de substituição: caso já exista comprovante anexado para a competência, o sistema exige justificativa de substituição, preserva a versão anterior com status "substituído" e registra a nova versão como ativa; (b) Upload em lote: o administrativo seleciona múltiplos comprovantes e o sistema tenta associá-los automaticamente por nome de arquivo (heurística condomínio+competência), solicitando confirmação manual em caso de ambiguidade; (c) Upload com competência futura: o sistema bloqueia a operação caso a competência informada seja futura; (d) Cancelamento de comprovante já enviado: permitido apenas para administrador master, exige justificativa obrigatória, marca o comprovante como "cancelado" e dispara alerta de pendência para reprocessamento da competência.

**Regras de negócio:** Cada competência só pode ter, simultaneamente, um comprovante com status "ativo" (anexado, enviado ou substituído e reativado). Qualquer nova versão reclassifica as versões anteriores como "substituído" e preserva seu arquivo e metadados. Nenhum comprovante pode ser excluído fisicamente após envio; apenas logicamente cancelado. O valor do repasse declarado no upload deve ser igual ao valor calculado pelo sistema para a competência, tolerando uma divergência máxima parametrizável (por exemplo, R$ 0,01 para arredondamentos); divergências maiores exigem justificativa obrigatória e ficam marcadas para revisão. O arquivo do comprovante deve estar em formato permitido (PDF como prioritário, imagens JPG/PNG como alternativas) e respeitar limite máximo de tamanho parametrizável (sugerido inicialmente em 10 MB).

**Permissões:** Upload, edição e substituição permitidos a administrador master e administrativo interno; cancelamento restrito ao administrador master; visualização e download permitidos a administrador master, administrativo interno, síndico do respectivo condomínio e financeiro do respectivo condomínio; visualização sem download permitida a usuário somente leitura.

**Campos necessários:** Identificador do condomínio (dropdown obrigatório); competência (mês e ano, obrigatório); arquivo (obrigatório); valor do repasse pago (obrigatório, monetário BRL); data do pagamento (obrigatória); forma de pagamento (obrigatória: PIX, TED, DOC, transferência interna, outros); banco de origem (opcional); banco de destino (opcional); identificador da transação bancária (opcional, mas recomendado); observação administrativa (opcional, com marcação de interna ou visível ao condomínio); justificativa de substituição (obrigatória quando aplicável); justificativa de cancelamento (obrigatória quando aplicável).

**Validações:** Competência selecionada deve ser passada ou presente, nunca futura; arquivo deve respeitar formato e tamanho; valor do repasse deve ser numérico, positivo e coerente com o esperado pelo sistema (dentro da tolerância); data do pagamento não pode ser posterior à data do upload nem anterior ao início da competência; nome do arquivo é higienizado e renomeado pelo sistema seguindo padrão interno para evitar colisões; duplicidade exata (mesmo hash do arquivo) é identificada e reportada para decisão manual.

**Status possíveis:** "pendente" (competência fechada, aguardando comprovante); "anexado" (comprovante foi subido mas ainda não enviado ao condomínio); "enviado" (comprovante foi comunicado por e-mail); "substituído" (versão anterior, preservada para auditoria); "cancelado" (marcado como inválido, com justificativa); "rejeitado" (status opcional caso se implemente validação pelo síndico futuramente).

**Exceções:** Arquivo corrompido no upload (sistema rejeita, mantém estado anterior, informa usuário); falha de persistência no armazenamento (sistema faz rollback transacional e mantém estado pendente); divergência de valor acima da tolerância (sistema permite a gravação mas exibe flag visual e registra na trilha); tentativa de upload por perfil não autorizado (sistema nega e registra tentativa); tentativa de substituição por administrativo interno sem autorização (sistema solicita aprovação do administrador master ou nega, conforme política).

**Critérios de aceite:** Upload efetivado gera registro imutável no histórico do condomínio; comprovante aparece no painel do síndico no prazo de até um minuto após o upload; substituição preserva a versão anterior visível na timeline como "substituído"; download do comprovante pelo síndico registra evento na trilha de auditoria; cancelamento dispara alerta de pendência para a equipe operacional.

**Prioridade:** Alta. Funcionalidade crítica para o objetivo central desta fase.

**Dependências:** Modelo de competência mensal consolidado (fechamento por mês/ano); armazenamento de arquivos configurado; sistema de trilha de auditoria implementado; módulo de pendências ativo para consumir os alertas gerados.

### 10.2 Envio de E-mail com Fechamento e Comprovante

**Nome da funcionalidade:** Envio formal de comunicação mensal com fechamento financeiro e comprovante de repasse.

**Objetivo:** Permitir que o administrativo envie aos destinatários autorizados de cada condomínio uma comunicação formal contendo o fechamento do mês (faturamento e repasse), o comprovante bancário anexo e eventuais observações administrativas, com rastreabilidade completa do envio, da entrega e da leitura, e com registro integral dentro do sistema.

**Problema que resolve:** Hoje, a comunicação do fechamento é feita por e-mail pessoal ou WhatsApp, sem registro estruturado, sem controle de destinatários, sem confirmação de entrega e sem vínculo com o comprovante. Isso compromete a rastreabilidade da prestação de contas e expõe a MiniMerX a questionamentos do tipo "não recebi".

**Usuários envolvidos:** Administrativo interno (executor do envio), administrador master (gestor da política de envio), síndico e demais destinatários cadastrados (receptores), usuário financeiro (receptor adicional quando cadastrado).

**Pré-requisitos:** Comprovante da competência com status "anexado" no sistema; lista de destinatários do condomínio cadastrada e com ao menos um endereço válido; fechamento da competência consolidado com valores apurados; template de e-mail configurado no sistema.

**Gatilho de uso:** O administrativo acessa a área de comunicações do condomínio, seleciona a competência e executa a ação "Enviar fechamento". Alternativamente, o administrativo pode ser acionado a partir da tela do comprovante recém-anexado, via call-to-action que leva ao fluxo de envio pré-preenchido.

**Fluxo principal:** Ao acionar o envio, o sistema apresenta uma tela de confirmação com o pré-visualização do e-mail: assunto (padronizado com competência e condomínio), corpo textual renderizado com os valores do fechamento (faturamento do período, repasse do período, percentual aplicado, competência de referência), a lista de destinatários (editável, permitindo desmarcar algum destinatário pontualmente), o anexo com o comprovante, um campo opcional para observação administrativa visível no e-mail e a assinatura institucional. O usuário confere, confirma, o sistema registra o envio com status inicial "pendente", dispara o e-mail ao servidor de envio, recebe confirmação de aceite e atualiza o status para "enviado". Conforme eventos de entrega e leitura são registrados, os status avançam para "entregue" e, opcionalmente, "lido". O comprovante vinculado tem seu status atualizado para "enviado". Todo o conteúdo, anexo e metadados de envio ficam persistidos na aplicação e acessíveis ao síndico no portal.

**Fluxos alternativos:** (a) Envio em lote: o administrativo seleciona múltiplas competências ou múltiplos condomínios e dispara os envios em sequência, acompanhando progresso por uma barra de execução; (b) Envio manual a destinatário único: permite informar ad hoc um destinatário não cadastrado, registrando o fato com marcação específica na trilha; (c) Reenvio por falha: quando um envio falha (endereço inválido, caixa cheia, rejeição do servidor), o sistema oferece o reenvio após correção da lista ou nova tentativa; (d) Agendamento de envio: o administrativo pode agendar o envio para uma data e hora específicas, ficando o status como "agendado" até a execução; (e) Cancelamento de envio agendado: permitido até o momento anterior à execução.

**Regras de negócio:** Um envio vincula obrigatoriamente uma competência, um condomínio e um comprovante ativo daquela competência. Se o comprovante for substituído após o envio, o sistema mantém o registro do envio original e sinaliza a divergência, oferecendo a opção de reenvio com a nova versão. Destinatários só podem ser os e-mails cadastrados para o condomínio; envios ad hoc são permitidos mas ficam rotulados. O corpo do e-mail segue template institucional com branding MiniMerX e não pode ser livremente editado por administrativo interno (apenas observação adicional); o administrador master pode customizar o template global. Todo envio gera registro permanente, imutável em seu conteúdo original, independentemente de edições posteriores na competência.

**Permissões:** Envio, reenvio e agendamento permitidos a administrador master e administrativo interno; cancelamento de agendamento permitido a ambos; visualização do histórico de envios permitida aos perfis com visibilidade sobre o condomínio; apenas administrador master pode editar o template global.

**Campos necessários:** Condomínio (automaticamente vinculado ao comprovante); competência (automaticamente vinculada); destinatários (lista editável, pré-preenchida com cadastro); assunto (preenchido automaticamente, editável); corpo (renderizado a partir de template, com campo livre para observação); anexo comprovante (obrigatório, pré-vinculado); opção de incluir relatório resumido em PDF anexo (opcional); data e hora de agendamento (opcional).

**Validações:** Ao menos um destinatário válido deve estar presente; comprovante anexado à competência deve existir e estar no status "anexado" ou "enviado" (para reenvio); campos obrigatórios do corpo preenchidos; data de agendamento, se informada, deve ser futura e dentro de janela máxima parametrizável (sugerida em 30 dias).

**Status possíveis do envio:** "pendente" (criado, aguardando disparo); "agendado" (aguardando data futura); "enviado" (entregue ao servidor de saída); "entregue" (confirmado pelo servidor do destinatário); "lido" (quando há mecanismo de confirmação de leitura ativo); "falhou" (rejeição definitiva); "reenviado" (reenviado após falha ou sob solicitação).

**Exceções:** Servidor de envio indisponível (sistema retém o envio no status "pendente" e tenta novamente conforme política de retry parametrizada); todos os destinatários inválidos (sistema bloqueia o envio e dispara alerta ao síndico para atualizar o cadastro); anexo excede limite do servidor de e-mail (sistema substitui o anexo por link seguro de download com expiração); reenvio a destinatário descadastrado entre o envio original e o reenvio (sistema bloqueia e solicita confirmação manual).

**Critérios de aceite:** E-mail enviado chega aos destinatários cadastrados com corpo correto, valores corretos e anexo acessível; registro do envio fica visível no histórico do condomínio para todos os perfis com permissão; reenvio gera novo registro preservando o original; falhas de entrega geram pendência automática visível ao administrativo; síndico consegue visualizar o e-mail enviado diretamente no portal, com mesmo conteúdo do que foi enviado pelo servidor de correio.

**Prioridade:** Alta.

**Dependências:** Upload de comprovantes (seção 10.1) implementado; cadastro de destinatários (já existente) consolidado; template institucional de e-mail aprovado; mecanismo de envio de e-mails transacionais configurado; trilha de auditoria implementada.

### 10.3 Histórico Completo dentro da Aplicação

**Nome da funcionalidade:** Histórico consolidado por condomínio, com fechamentos, repasses, comprovantes, comunicações e documentos vinculados.

**Objetivo:** Prover, dentro da aplicação, uma área que consolide em um único lugar todo o histórico financeiro, documental e comunicacional de cada condomínio, acessível por competência, eliminando a necessidade de recorrer a e-mails ou pastas locais para reconstruir a parceria.

**Problema que resolve:** A fragmentação atual do histórico entre caixas de e-mail individuais, pastas de arquivos da operação e ocasionais planilhas de controle compromete a continuidade da parceria em momentos de troca de síndico, auditoria do condomínio ou questionamento em assembleia. A consolidação dentro do portal resolve essa fragmentação.

**Usuários envolvidos:** Síndico (consumidor primário), usuário financeiro do condomínio, usuário somente leitura, administrativo interno (consulta operacional), administrador master.

**Pré-requisitos:** Condomínio cadastrado; competências consolidadas; upload de comprovantes operante; envio de e-mails operante; campo de observação administrativa operante.

**Gatilho de uso:** O usuário autorizado acessa a área de histórico do condomínio a partir do menu principal, da tela de detalhe do condomínio ou de um ponto de entrada contextual (por exemplo, clicar em uma competência no dashboard).

**Fluxo principal:** Ao acessar o histórico, o usuário visualiza uma listagem cronológica reversa de competências (mais recentes primeiro), cada uma com seu valor de faturamento, valor de repasse, percentual aplicado, status do comprovante, status da comunicação e indicadores visuais de pendência. Ao expandir uma competência, o usuário vê: o detalhamento de vendas do período (com link para gráfico e tabela diária), o comprovante anexado (com opção de download), os envios de e-mail realizados (com destinatários, data, hora e status), as observações administrativas liberadas para visualização, os documentos complementares vinculados àquela competência (ver seção 11.1 sobre central documental) e os eventos de auditoria relevantes. O acesso respeita integralmente a matriz de permissões.

**Fluxos alternativos:** (a) Filtragem por intervalo de datas, por status de comprovante ou por status de envio; (b) Busca por palavra-chave em observações, assuntos de e-mail ou nomes de arquivo; (c) Comparação lado a lado de duas competências distintas; (d) Exportação da listagem consolidada em PDF ou planilha (conforme seção 11.5).

**Regras de negócio:** O histórico exibe apenas dados já consolidados — competências abertas aparecem com rótulo "em aberto" e não mostram repasse final até o fechamento. Observações marcadas como "internas" são ocultadas dos perfis externos (síndico, financeiro, somente leitura) e visíveis apenas à operação. Comprovantes substituídos permanecem visíveis na timeline com o rótulo "substituído" para fins de auditoria, porém apenas a versão ativa é exposta como comprovante primário. O histórico é a interface pública da trilha de auditoria — eventos internos (como edição de observação interna) não aparecem para perfis externos.

**Permissões:** Conforme matriz da seção 8. Síndico, financeiro e somente leitura veem apenas o próprio condomínio. Administrativo e administrador master veem todos.

**Campos exibidos:** Competência (mês/ano); faturamento do período; repasse do período; percentual aplicado; status do comprovante; status da comunicação; data do último envio; número de destinatários que receberam; indicadores visuais de pendência (ícones e cores); observações públicas; links para comprovantes, e-mails enviados e documentos vinculados.

**Validações:** A listagem não pode apresentar competências futuras; valores devem ser formatados em padrão brasileiro; datas em formato dd/MM/yyyy; moeda em BRL.

**Status exibidos:** Derivados das entidades subjacentes (comprovante, envio, competência). A visualização consolida o estado geral da competência em um selo visual único: "em aberto", "fechada sem comprovante", "comprovante anexado", "comunicada", "regularizada".

**Exceções:** Condomínio sem qualquer histórico (exibição de estado vazio amigável); usuário sem permissão tentando acessar outro condomínio (bloqueio imediato com mensagem clara); falhas de carregamento de arquivos vinculados (exibição de erro com botão de retry).

**Critérios de aceite:** Síndico acessa o histórico e vê, em até três segundos, todas as suas competências com os indicadores corretos; ao expandir uma competência, todos os artefatos estão visíveis e acessíveis respeitando permissões; filtros e busca operam corretamente; comprovantes substituídos são rastreáveis na timeline; observações internas nunca vazam para perfis externos.

**Prioridade:** Alta.

**Dependências:** Funcionalidades 10.1 e 10.2 operantes; módulo de trilha de auditoria operante; definição do conceito de competência consolidada no sistema.

---

## 11. Funcionalidades Recomendadas

Além das três funcionalidades obrigatórias, esta especificação recomenda fortemente a inclusão das funcionalidades descritas a seguir, por agregarem valor diretamente aos objetivos de transparência, governança e experiência de uso definidos nesta fase. Cada uma é descrita no mesmo nível de profundidade exigido pelas obrigatórias.

### 11.1 Central de Documentos por Condomínio

**Nome da funcionalidade:** Central documental unificada por condomínio.

**Objetivo:** Oferecer, por condomínio, um repositório único com todos os documentos relevantes da parceria — comprovantes, relatórios, fechamentos, comunicados, anexos administrativos e documentos contratuais — organizados por tipo, competência e data.

**Problema que resolve:** Dispersão documental e dificuldade do síndico em localizar um documento específico sem recorrer à equipe da MiniMerX.

**Usuários envolvidos:** Todos os perfis com acesso ao condomínio.

**Pré-requisitos:** Upload de comprovantes (10.1) e exportação de relatórios (11.5) operantes; suporte a upload de documentos avulsos pelo administrativo.

**Gatilho de uso:** O usuário acessa a aba "Documentos" no menu do condomínio.

**Fluxo principal:** O usuário visualiza um navegador documental com categorias (Comprovantes, Relatórios Mensais, Comunicados, Documentos Contratuais, Anexos Administrativos) e filtros por competência, tipo e data. Pode abrir o documento em visualizador integrado (quando PDF ou imagem) ou baixar.

**Fluxos alternativos:** (a) Upload avulso pelo administrativo de documento não associado a competência (ex.: aditivo contratual, ata de vistoria); (b) Busca por nome de arquivo ou tag; (c) Marcação de favoritos por usuário.

**Regras de negócio:** Documentos da central herdam as mesmas regras de permissão das funcionalidades originais. Documentos avulsos são classificados com visibilidade ("interno" ou "público ao condomínio") no momento do upload. Exclusão de documentos só é permitida antes da disponibilização ao condomínio; depois, apenas arquivamento lógico.

**Permissões:** Administrador master e administrativo podem subir, classificar e arquivar; síndico, financeiro e somente leitura podem visualizar conforme visibilidade; download restrito a perfis com a permissão correspondente.

**Campos necessários:** Tipo de documento; competência (quando aplicável); visibilidade; tags; arquivo; descrição.

**Validações:** Formatos aceitos parametrizáveis; tamanho máximo parametrizável; duplicidade detectada por hash.

**Status possíveis:** "ativo", "arquivado", "substituído".

**Exceções:** Tentativa de download por perfil sem permissão; erro de upload; documento corrompido.

**Critérios de aceite:** Síndico encontra qualquer documento do seu condomínio em até três cliques a partir do menu principal; filtros operam corretamente; permissões respeitadas.

**Prioridade:** Alta.

**Dependências:** Funcionalidades 10.1 e 11.5.

### 11.2 Timeline / Trilha de Auditoria

**Nome da funcionalidade:** Linha do tempo auditável de eventos por condomínio e global.

**Objetivo:** Registrar, de forma cronológica e imutável, todos os eventos relevantes do sistema — uploads, substituições, envios, reenvios, alterações de destinatários, observações, downloads, visualizações — e disponibilizá-los em duas visões: global (administrador master) e por condomínio (síndico e financeiro).

**Problema que resolve:** Falta de rastreabilidade sobre "o que aconteceu, quando e por quem", comprometendo governança e defesa em caso de disputa.

**Usuários envolvidos:** Todos os perfis, com escopo diferente.

**Pré-requisitos:** Todas as funcionalidades geradoras de evento devem emitir registros padronizados para a trilha.

**Gatilho de uso:** Usuário acessa aba "Histórico de eventos" ou "Auditoria" no menu do condomínio ou do sistema global (apenas admin master).

**Fluxo principal:** O usuário visualiza uma lista cronológica reversa com ícone do tipo de evento, descrição legível em linguagem natural, usuário que executou, data e hora, e link para o artefato afetado quando aplicável. Filtros por tipo de evento, por usuário, por intervalo de datas e busca textual estão disponíveis.

**Fluxos alternativos:** (a) Exportação da trilha filtrada em PDF ou planilha; (b) Visão detalhada do evento com payload completo (para admin master).

**Regras de negócio:** Registros da trilha são imutáveis: uma vez gravados, não podem ser alterados nem apagados. Eventos internos (ex.: ajuste manual em observação interna) aparecem apenas para perfis internos. Eventos destrutivos ou sensíveis (ex.: cancelamento de comprovante, alteração de percentual de repasse) são destacados visualmente.

**Permissões:** Administrador master vê tudo; administrativo vê trilha operacional; síndico e financeiro veem apenas eventos do seu condomínio filtrados pela visibilidade externa; somente leitura vê, mas não exporta.

**Campos registrados por evento:** Tipo, entidade afetada, identificador da entidade, usuário executor, perfil do executor, data e hora, IP de origem, endpoint ou tela de origem, descrição textual, payload resumido.

**Validações:** Todos os eventos relevantes devem disparar registro; falha na gravação da trilha deve bloquear a operação principal.

**Status:** Não aplicável (registros são imutáveis).

**Exceções:** Perda de contexto de usuário (sistema registra como "sistema" e dispara alerta).

**Critérios de aceite:** Qualquer ação relevante no sistema é rastreável em no máximo cinco segundos após sua execução; filtros operam corretamente; exportação para PDF e planilha disponível para admin master.

**Prioridade:** Alta.

**Dependências:** Todas as funcionalidades da seção 10 e 11 devem publicar eventos padronizados.

### 11.3 Alertas e Pendências

**Nome da funcionalidade:** Central de alertas operacionais e pendências administrativas.

**Objetivo:** Consolidar em uma única área as pendências operacionais do ciclo mensal — condomínios sem destinatário, fechamentos sem comprovante, comprovantes não enviados, falhas de envio, fechamentos pendentes — e exibir a cada perfil os alertas que lhe cabem resolver.

**Problema que resolve:** Dependência de checagens manuais e planilhas paralelas para garantir que nenhum condomínio fique descoberto ao final do ciclo mensal.

**Usuários envolvidos:** Administrador master, administrativo (principais atuantes), síndico (recebe alertas sobre cadastro de destinatários e confirmações pendentes).

**Pré-requisitos:** Funcionalidades 10.1, 10.2 e 9.5 operantes.

**Gatilho de uso:** Ao entrar no sistema, o usuário vê indicador global de pendências. Um menu dedicado lista as pendências por categoria.

**Fluxo principal:** O sistema avalia periodicamente o estado das entidades e gera/atualiza pendências automaticamente. O usuário acessa a central, vê a lista priorizada, abre a pendência, executa a ação correspondente (subir comprovante, reenviar e-mail, cadastrar destinatário), e o sistema reavalia e remove a pendência.

**Fluxos alternativos:** (a) Dispensa manual de pendência pelo admin master, com justificativa; (b) Notificação por e-mail ao síndico sobre pendências sob sua responsabilidade (opcional, configurável).

**Regras de negócio:** Pendências possuem severidade (alta, média, baixa) conforme impacto: falha de envio e fechamento sem comprovante são alta; observação não revisada é baixa. Pendências dispensadas são registradas na trilha. Pendências resolvidas são arquivadas mantendo histórico.

**Permissões:** Administrador master e administrativo veem pendências operacionais; síndico vê pendências do seu condomínio (ex.: "seu condomínio não tem destinatário cadastrado").

**Campos da pendência:** Tipo; severidade; entidade relacionada; condomínio; competência (quando aplicável); data de criação; data de resolução (quando resolvida); ação recomendada.

**Validações:** Pendências automáticas não podem ser editadas manualmente, apenas resolvidas pela ação correspondente ou dispensadas com justificativa.

**Status possíveis:** "aberta", "em andamento", "resolvida", "dispensada".

**Exceções:** Falha na avaliação automática (sistema registra falha na trilha e mantém estado anterior).

**Critérios de aceite:** Ao final do ciclo mensal, o administrativo consegue ver todas as pendências em uma única tela; resolver uma pendência atualiza seu status em até um minuto; síndico é notificado sobre pendências que dependem dele.

**Prioridade:** Alta.

**Dependências:** 10.1, 10.2, 11.2.

### 11.4 Confirmação de Recebimento ou Visualização

**Nome da funcionalidade:** Registro de confirmação de recebimento e/ou visualização por parte do condomínio.

**Objetivo:** Oferecer evidência objetiva de que o condomínio teve acesso à informação comunicada, seja pela confirmação de leitura do e-mail, pela visualização do documento no portal ou por ação explícita de "marcar como recebido".

**Problema que resolve:** Insegurança do tipo "não recebi" por parte do condomínio e ausência de contraprova pela operação.

**Usuários envolvidos:** Síndico (gerador de confirmação), administrativo (consumidor da informação).

**Pré-requisitos:** Funcionalidades 10.2 e 10.3 operantes.

**Gatilho de uso:** Passivo para confirmação por pixel de abertura de e-mail; ativo quando o síndico visualiza o documento no portal; explícito quando existe botão "confirmar recebimento".

**Fluxo principal:** Envio do e-mail inclui mecanismo opcional de confirmação de leitura. Acesso do síndico ao comprovante no portal é registrado com identificação do usuário. Botão "marcar como recebido" está disponível em cada competência para o síndico registrar formalmente o recebimento.

**Fluxos alternativos:** (a) Síndico contesta recebimento, registrando justificativa; (b) Sistema sinaliza "entregue mas não lido" após X dias, disparando pendência para reenvio.

**Regras de negócio:** Confirmação de leitura por pixel é best-effort e tem limitações técnicas (clientes de e-mail podem bloquear); confirmação no portal é definitiva e preferida. Confirmação explícita não pode ser desfeita, apenas complementada com contestação.

**Permissões:** Síndico e financeiro podem confirmar; administrativo apenas visualiza as confirmações.

**Campos registrados:** Tipo de confirmação (leitura, visualização, explícita); usuário confirmante; data e hora; IP; evento relacionado.

**Validações:** Confirmação explícita só disponível após o envio do e-mail estar no status "entregue".

**Status adicionais no envio:** "entregue não lido", "lido", "confirmado no portal", "confirmado explicitamente".

**Exceções:** Falha na captura do pixel (sistema assume "não lido"); contestação sem justificativa (sistema exige texto).

**Critérios de aceite:** Administrativo consegue ver, por competência, quais condomínios confirmaram e quais não; síndico tem botão claro para confirmar; trilha registra toda confirmação.

**Prioridade:** Média.

**Dependências:** 10.2, 11.2.

### 11.5 Exportação de Relatórios

**Nome da funcionalidade:** Exportação de relatórios operacionais e financeiros em PDF e planilha.

**Objetivo:** Permitir a geração, sob demanda, de relatórios consolidados por condomínio, por período, por tipo de artefato e por status, em formatos adequados a uso contábil, de auditoria e de prestação de contas.

**Problema que resolve:** Necessidade recorrente do síndico e da administradora de gerar versões imprimíveis do histórico para entrega a conselhos, assembleia ou auditoria externa.

**Usuários envolvidos:** Síndico, financeiro, administrativo, administrador master.

**Pré-requisitos:** Funcionalidades 10.3 e 11.1 operantes.

**Gatilho de uso:** Usuário acessa a seção "Relatórios" ou seleciona "Exportar" em qualquer visualização relevante (histórico, trilha, pendências).

**Fluxo principal:** O usuário escolhe o tipo de relatório (financeiro mensal, histórico de repasses, histórico de comunicações, listagem de comprovantes, pendências, trilha de auditoria) e os filtros (condomínio quando aplicável, intervalo de competências), o formato (PDF ou planilha) e confirma. O sistema gera o arquivo em background e notifica quando pronto, disponibilizando download.

**Fluxos alternativos:** (a) Geração síncrona para relatórios pequenos, com download imediato; (b) Agendamento recorrente de relatórios por e-mail (ex.: envio automático mensal para a administradora).

**Regras de negócio:** Relatórios respeitam integralmente as permissões do usuário solicitante; o mesmo relatório pode gerar resultados diferentes conforme o perfil. PDFs trazem cabeçalho institucional MiniMerX e marca d'água quando aplicável. Planilhas trazem abas separadas por categoria.

**Permissões:** Conforme matriz; somente leitura não pode exportar.

**Campos de entrada:** Tipo de relatório; filtros de período; filtros de condomínio; formato; opção de incluir anexos.

**Validações:** Intervalos de datas válidos; tamanho máximo de payload; formato selecionado.

**Status da exportação:** "gerando", "pronto", "expirado", "falhou".

**Exceções:** Falha de geração (relatório marcado como falhou, com opção de retry); expiração do arquivo após X dias (parametrizável).

**Critérios de aceite:** Relatórios gerados são consistentes com o dashboard; download acessível pelo usuário; geração em tempo razoável (máximo de um minuto para volumes típicos).

**Prioridade:** Alta.

**Dependências:** 10.3, 11.1, 11.2.

### 11.6 Painel Executivo para Síndico

**Nome da funcionalidade:** Dashboard simplificado focado em prestação de contas ao síndico.

**Objetivo:** Oferecer ao síndico uma tela inicial objetiva e limpa com os números essenciais — faturamento do período, repasse do período, status do último fechamento, último comprovante disponível, histórico resumido, pendências e documentos recentes — otimizada para consumo rápido e leitura mobile ocasional.

**Problema que resolve:** O dashboard atual, ainda que funcional, é operacional; o síndico precisa de uma visão mais executiva e menos operacional, orientada a prestação de contas e não a operação diária.

**Usuários envolvidos:** Síndico (primário), financeiro do condomínio (secundário).

**Pré-requisitos:** Funcionalidades 10.1, 10.2, 10.3, 11.3 operantes.

**Gatilho de uso:** Usuário síndico entra no sistema e é direcionado para o painel executivo como tela inicial (admin entra em dashboard operacional).

**Fluxo principal:** O painel apresenta, do topo para baixo: cards grandes com repasse do mês e repasse do ano; status do último fechamento com selo colorido; link direto para o último comprovante; lista resumida das três últimas competências com resumo e acesso ao detalhe; bloco de pendências que demandam ação do síndico; bloco de documentos recentes.

**Fluxos alternativos:** (a) Clique em cualquer card leva à tela detalhada correspondente; (b) Síndico pode customizar ordem dos blocos (futuro).

**Regras de negócio:** Painel exibe apenas dados do condomínio do síndico; layout adaptável a tablet; sem informações operacionais internas.

**Permissões:** Síndico e financeiro visualizam; demais perfis não têm acesso (usam o dashboard operacional).

**Campos exibidos:** Conforme descrito no fluxo principal.

**Validações:** Dados atualizados em tempo real ou com latência máxima de um minuto.

**Status possíveis:** Derivados dos status das entidades subjacentes.

**Exceções:** Condomínio sem nenhum histórico exibe painel de boas-vindas com onboarding.

**Critérios de aceite:** Síndico abre o portal e entende, em menos de 10 segundos, o estado atual da parceria; links funcionam; permissões respeitadas.

**Prioridade:** Alta.

**Dependências:** 10.1, 10.2, 10.3, 11.3.

### 11.7 Observações e Notas Administrativas

**Nome da funcionalidade:** Registro de observações por competência, com distinção entre interno e visível ao condomínio.

**Objetivo:** Permitir que a equipe da MiniMerX registre anotações por competência — desde explicações sobre variações de faturamento até comunicados específicos —, classificando claramente o que é interno operacional e o que deve ser visível ao condomínio.

**Problema que resolve:** Necessidade de contextualizar números (ex.: "mês teve queda devido a reforma da garagem que impediu acesso ao mercadinho") e de manter memória operacional estruturada.

**Usuários envolvidos:** Administrativo (autor principal), administrador master (gestor), síndico e financeiro (leitores das observações públicas).

**Pré-requisitos:** Estrutura de competência consolidada.

**Gatilho de uso:** Administrativo acessa a competência e escolhe "Adicionar observação".

**Fluxo principal:** Usuário seleciona escopo (interna à operação, visível ao condomínio), digita o texto, confirma. Observação é vinculada à competência e ao condomínio, aparece no histórico (conforme visibilidade) e entra na trilha de auditoria. Pode ser editada ou removida antes da publicação; após publicada, apenas nova observação substitui ou complementa, preservando a anterior.

**Fluxos alternativos:** (a) Observação em lote aplicável a vários condomínios (ex.: aviso global sobre atraso de repasse por feriado bancário); (b) Observação vinculada a um evento específico além da competência (ex.: uma manutenção agendada).

**Regras de negócio:** Observações visíveis ao condomínio aparecem no portal do síndico e podem ser incluídas no corpo do e-mail de fechamento; internas nunca vazam. Edição após publicação é bloqueada para preservar integridade.

**Permissões:** Administrador master e administrativo podem criar e editar (antes da publicação); síndico e financeiro visualizam apenas as públicas; somente leitura idem.

**Campos necessários:** Escopo; texto; competência; condomínio; autor; data e hora.

**Validações:** Texto com tamanho mínimo e máximo parametrizável; escopo obrigatório.

**Status possíveis:** "rascunho", "publicada interna", "publicada pública", "substituída".

**Exceções:** Tentativa de edição após publicação (bloqueado, requer substituição); tentativa de registro em competência inexistente (bloqueado).

**Critérios de aceite:** Observações aparecem no histórico conforme visibilidade; edição antes da publicação funciona; trilha registra todas as operações.

**Prioridade:** Média.

**Dependências:** 10.3, 11.2.

### 11.8 Calendário ou Agenda de Fechamento

**Nome da funcionalidade:** Calendário operacional do ciclo mensal de fechamento e repasse.

**Objetivo:** Dar visibilidade ao ciclo mensal completo — previsão de fechamento, previsão de repasse, data de envio do comprovante, status de cada ciclo — em formato de calendário, facilitando planejamento e acompanhamento pela operação.

**Problema que resolve:** Dificuldade de acompanhar, a cada mês, quais condomínios estão em qual etapa do ciclo.

**Usuários envolvidos:** Administrativo e administrador master (uso operacional); síndico (visão simplificada da previsão do próprio condomínio).

**Pré-requisitos:** Funcionalidades 10.1, 10.2 operantes; parametrização de ciclo mensal (ex.: dia de fechamento, dia previsto de repasse por condomínio).

**Gatilho de uso:** Usuário acessa aba "Calendário" no menu.

**Fluxo principal:** Visualização mensal com eventos por condomínio (fechamento previsto, repasse previsto, envio previsto). Ao clicar em um evento, o usuário acessa o detalhe da competência do condomínio correspondente.

**Fluxos alternativos:** (a) Visualização lista ao invés de calendário; (b) Filtro por condomínio; (c) Marcação manual de feriados e exceções.

**Regras de negócio:** Datas previstas são calculadas a partir de regras parametrizáveis por condomínio (ex.: "fechamento no dia 1 do mês seguinte, repasse até o dia 10"). Desvios entre previsto e realizado são destacados.

**Permissões:** Administrativo e administrador master veem o calendário global; síndico vê apenas seu condomínio.

**Campos exibidos:** Data; evento; condomínio; status.

**Validações:** Datas previstas não podem ser no passado distante sem marcação de atraso.

**Status possíveis:** "previsto", "realizado", "atrasado", "antecipado".

**Exceções:** Ausência de parametrização (exibe placeholder com instrução para configurar).

**Critérios de aceite:** Administrativo enxerga o ciclo mensal inteiro em uma única tela; desvios destacados; navegação por clique funcional.

**Prioridade:** Média.

**Dependências:** Parametrização de ciclo; 10.1, 10.2.

---

## 12. Regras de Negócio

Esta seção consolida as regras de negócio transversais que regem o comportamento do produto evoluído, superando o escopo de cada funcionalidade individual.

A primeira regra estrutural é o isolamento absoluto de dados por condomínio: qualquer consulta originada por um perfil externo (síndico, financeiro, somente leitura) deve, por construção, restringir-se ao condomínio ao qual o usuário está vinculado. Essa regra é validada no backend independentemente do frontend e é condição de qualquer nova funcionalidade.

A segunda regra é a imutabilidade retroativa: a partir do momento em que uma comunicação oficial é enviada ao condomínio, os dados envolvidos (valores comunicados, comprovante, destinatários) passam a ser considerados registros históricos. Alterações posteriores só podem ocorrer por substituição ou reenvio, preservando a versão original na trilha de auditoria. Esta regra é a base da confiança que o produto pretende estabelecer com os condomínios.

A terceira regra diz respeito à competência mensal como unidade de agrupamento financeiro e documental. Todos os artefatos — vendas, fechamento, comprovante, envio, observação — são vinculados a uma competência identificada por mês e ano. Uma competência só é considerada "regularizada" quando tem fechamento apurado, comprovante anexado e comunicação enviada com status "entregue" ou superior. Competências não regularizadas geram pendências.

A quarta regra é a dupla visibilidade de observações: toda observação tem obrigatoriamente um escopo declarado (interna ou pública ao condomínio), e essa classificação determina a visibilidade em todos os pontos de exibição do sistema. Vazamento de observação interna para perfil externo é considerado falha crítica de produto.

A quinta regra é a tolerância de divergência financeira: ao registrar um comprovante, o valor do repasse declarado pode divergir do valor calculado dentro de uma tolerância parametrizável (ex.: centavos para arredondamento). Divergências maiores não bloqueiam o registro, mas exigem justificativa obrigatória e ficam sinalizadas para revisão, respeitando a realidade operacional em que pequenos ajustes manuais podem ocorrer.

A sexta regra é a atomicidade do ciclo mensal: as três ações principais (upload de comprovante, envio de e-mail, disponibilização no portal) são operações independentes mas referenciáveis como um ciclo. A ausência de qualquer uma em uma competência consolidada gera pendência automática e status visual de "regularização incompleta".

A sétima regra trata da prevalência do cadastro de destinatários: envios só podem ser disparados para endereços presentes no cadastro mantido pelo síndico, salvo exceção explícita registrada como envio ad hoc. Essa regra protege simultaneamente a privacidade dos destinatários e a responsabilidade do síndico pela manutenção da lista.

A oitava regra é a obrigatoriedade de trilha: qualquer operação que altere o estado de uma entidade sensível (comprovante, envio, observação pública, cadastro de destinatário, permissão) gera registro imutável na trilha de auditoria. Falha na gravação do registro deve bloquear a operação, nunca o contrário.

A nona regra é a hierarquia de permissões: o administrador master é o único perfil que pode executar operações destrutivas ou sensíveis (cancelamento de comprovante, alteração de percentual de repasse, remoção de usuário). O administrativo interno é um perfil operacional com amplo escopo mas sem poder de decisão contratual. Perfis externos são sempre de consumo, nunca de operação sobre dados financeiros.

A décima regra é a responsabilidade da operação pelo repasse: o sistema apenas registra e comunica; a transferência bancária continua ocorrendo fora da plataforma. Isso implica que o comprovante é a ponte entre o mundo operacional bancário e o mundo digital do portal, e sua autenticidade é responsabilidade de quem o carrega (tipicamente o administrativo, sob governança do administrador master).

---

## 13. Fluxos Principais de Uso

Esta seção descreve os fluxos de uso de ponta a ponta que atravessam múltiplas funcionalidades e perfis, fornecendo visão integrada do comportamento esperado do sistema.

### 13.1 Ciclo Mensal Completo (Fluxo da Operação)

O ciclo inicia-se ao final de cada mês, quando o administrativo recebe o arquivo de vendas do período (formato Excel padronizado) e executa o upload na página administrativa. O sistema processa o arquivo, associa as vendas aos condomínios, calcula o faturamento consolidado e o repasse devido por condomínio. O administrativo revisa o dashboard, confirma os números, registra observações pertinentes (internas ou públicas). A equipe executa a transferência bancária para cada condomínio fora do sistema. Com os comprovantes bancários em mãos, o administrativo acessa o módulo de comprovantes, sobe cada comprovante associando-o ao condomínio e à competência, preenche valor, data e forma de pagamento, e confirma. O sistema atualiza o status do comprovante para "anexado". O administrativo, então, acessa a área de comunicações ou usa o atalho da tela do comprovante, dispara o envio do e-mail de fechamento com o comprovante anexo. O sistema envia, confirma a entrega, atualiza o status do comprovante para "enviado" e registra todos os eventos na trilha. A central de alertas confirma que a competência foi regularizada. O síndico recebe o e-mail, acessa o portal, visualiza os documentos e eventualmente confirma o recebimento. O ciclo se encerra com a competência em status "regularizada", todos os artefatos visíveis no histórico.

### 13.2 Onboarding de Novo Condomínio

O administrador master cadastra o novo condomínio na página administrativa, informando nome, endereço, percentual contratual de repasse, dados do síndico titular e demais parâmetros (dia de fechamento, dia previsto de repasse). O sistema cria o condomínio, o usuário síndico vinculado e envia e-mail ao síndico com credenciais iniciais. O síndico acessa o portal, troca a senha no primeiro login, e é orientado (fluxo de onboarding) a cadastrar a lista de destinatários autorizados. Uma vez cadastrado, o condomínio fica visível na central administrativa, aparece no calendário de fechamento e está pronto para receber o primeiro ciclo mensal.

### 13.3 Substituição de Comprovante

O administrativo percebe que o comprovante anexado está incorreto (arquivo errado, competência trocada, valor divergente). Acessa a competência, escolhe "substituir comprovante", fornece justificativa obrigatória, faz upload da nova versão. O sistema preserva a versão anterior com status "substituído", registra a nova versão como ativa, atualiza a trilha. Se o envio ao condomínio já havia ocorrido, o sistema sinaliza a divergência e oferece reenvio. O administrativo aciona o reenvio; o sistema dispara novo e-mail informando a correção, mantendo o registro do envio anterior intacto.

### 13.4 Falha de Envio e Reprocessamento

Após o disparo de um envio, o servidor de e-mail informa falha (endereço inválido, caixa cheia, rejeição). O sistema marca o envio como "falhou", dispara pendência para o administrativo e notifica o síndico sobre a necessidade de revisar o cadastro de destinatários. O síndico atualiza o cadastro, notifica a operação. O administrativo acessa o envio falho e aciona reenvio. O sistema repete o disparo com a lista atualizada, mantém o registro original e cria novo registro ligado ao original.

### 13.5 Consulta Histórica pelo Síndico

O síndico entra no portal e é direcionado ao painel executivo. Visualiza os cards de repasse do mês e do ano. Clica em "Histórico" e filtra as últimas 12 competências. Expande a competência de novembro para prestar contas na assembleia de dezembro. Visualiza o faturamento, repasse e percentual, baixa o comprovante, visualiza o e-mail enviado, lê a observação pública. Acessa a central de documentos, baixa o relatório mensal consolidado em PDF. Sai do portal com tudo o que precisa para a assembleia.

### 13.6 Auditoria Externa do Condomínio

A administradora do condomínio, em nome do conselho fiscal, acessa o portal como usuário financeiro. Filtra o histórico anual, exporta o relatório de repasses em planilha, exporta a trilha de auditoria filtrada por seu condomínio, baixa os 12 comprovantes do ano. Entrega o pacote ao auditor externo contratado pelo condomínio. O auditor valida os valores confrontando com os extratos bancários do condomínio. A parceria é auditada sem necessidade de intervenção da MiniMerX.

---

## 14. Campos e Dados Necessários por Funcionalidade

Esta seção consolida, em visão integrada, os campos e dados necessários em cada funcionalidade, servindo como base para o trabalho futuro de design de telas e modelagem.

No upload de comprovantes são necessários: identificador e nome do condomínio, competência (mês e ano), arquivo físico com metadados (nome original, tamanho, tipo MIME, hash), valor do repasse pago em BRL, data do pagamento, forma de pagamento, banco de origem, banco de destino, identificador de transação, observação administrativa, justificativa de substituição ou cancelamento, usuário executor, data e hora da operação.

No envio de e-mail são necessários: identificador do condomínio, identificador da competência, identificador do comprovante vinculado, lista de destinatários (nome e e-mail), assunto padronizado, corpo renderizado, observação incluída, anexos, data e hora de envio ou agendamento, usuário executor, identificador externo do provedor de envio, status atual, histórico de mudanças de status.

No histórico por condomínio são necessários, por competência: mês e ano, faturamento consolidado, repasse calculado, percentual aplicado, identificador do comprovante ativo, identificadores de todos os envios realizados, identificadores de observações públicas vinculadas, documentos complementares, indicadores de pendência, selos de status consolidado.

Na central documental são necessários, por documento: identificador, tipo (comprovante, relatório, comunicado, contratual, anexo), competência vinculada (quando aplicável), visibilidade, tags, autor do upload, data e hora, nome original, tamanho, tipo MIME, hash, status (ativo, arquivado, substituído), descrição, referência ao arquivo físico.

Na trilha de auditoria são necessários, por evento: identificador, tipo de evento, entidade afetada, identificador da entidade, usuário executor, perfil do executor, data e hora, IP, origem (tela ou endpoint), descrição textual em linguagem natural, payload resumido com antes e depois quando aplicável.

Nos alertas e pendências são necessários: tipo, severidade, condomínio, competência quando aplicável, entidade relacionada, data de criação, data de resolução, usuário que resolveu, ação recomendada, status atual, justificativa de dispensa quando aplicável.

No cadastro de destinatários são necessários: identificador, condomínio, nome do destinatário, e-mail, papel indicado (síndico, subsíndico, conselho, administradora, outro), ativo ou inativo, data de cadastro, usuário que cadastrou, histórico de mudanças.

Nas observações administrativas são necessários: identificador, competência, condomínio, escopo (interna ou pública), texto, autor, data e hora, status (rascunho, publicada, substituída), observação substituinte quando aplicável.

Nas exportações de relatórios são necessários: tipo de relatório, filtros aplicados, formato solicitado, usuário solicitante, data e hora de solicitação, data e hora de conclusão, status, referência ao arquivo gerado, data de expiração.

No calendário de fechamento são necessários, por condomínio: dia de fechamento, prazo de repasse, prazo de comunicação, cálculo das datas previstas da competência corrente, desvios em relação ao realizado.

---

## 15. Estados e Status Possíveis

O produto evoluído opera com um conjunto estruturado de status por entidade. A coerência desses status é crítica para permissões, alertas e auditoria.

Para o **comprovante de repasse**, os status previstos são: "pendente" (competência fechada, sem comprovante anexado), "anexado" (arquivo subido, ainda não comunicado), "enviado" (arquivo comunicado ao condomínio via e-mail), "substituído" (versão anterior após substituição por nova), "cancelado" (marcado como inválido com justificativa).

Para o **envio de e-mail**, os status são: "pendente" (criado, aguardando disparo), "agendado" (aguardando execução em data futura), "enviado" (disparado ao servidor de saída com aceite), "entregue" (confirmado pelo servidor do destinatário), "lido" (quando há confirmação de leitura), "falhou" (rejeição definitiva, destinatário inválido ou outra falha não recuperável), "reenviado" (gerado como reenvio de um envio anterior).

Para a **competência mensal**, os status consolidados são: "em aberto" (competência corrente, ainda coletando vendas), "fechada sem comprovante" (vendas consolidadas, repasse calculado, aguardando upload do comprovante), "comprovante anexado" (comprovante subido, aguardando comunicação), "comunicada" (comunicação enviada ao condomínio), "regularizada" (comunicação confirmada e sem pendências), "pendente de regularização" (há pendência ativa vinculada à competência).

Para o **documento da central documental**, os status são: "ativo", "arquivado", "substituído".

Para a **pendência**, os status são: "aberta", "em andamento", "resolvida", "dispensada".

Para a **observação administrativa**, os status são: "rascunho", "publicada interna", "publicada pública", "substituída".

Para a **exportação de relatório**, os status são: "solicitada", "gerando", "pronta", "expirada", "falhou".

Para o **destinatário cadastrado**, os status são: "ativo", "inativo" (desativado pelo síndico sem remoção), "inválido" (marcado pelo servidor de e-mail após falhas recorrentes).

Para o **usuário**, os status são: "ativo", "inativo" (desativado por admin), "bloqueado" (após falhas de autenticação), "pendente de primeiro acesso" (credencial emitida, primeiro login ainda não realizado).

Cada transição de status relevante deve gerar evento na trilha de auditoria, compondo a história rastreável de cada entidade.

---

## 16. Validações

As validações do produto evoluído agrupam-se em três camadas lógicas: validações de formato e integridade, validações de regra de negócio e validações de permissão e contexto.

As validações de **formato e integridade** garantem que dados entrados no sistema estejam em padrão correto. Datas devem seguir dd/MM/yyyy com localização pt-BR. Valores monetários devem ser numéricos, positivos, em BRL com duas casas decimais. Endereços de e-mail devem passar por validação sintática e verificação de MX do domínio quando possível. Arquivos devem respeitar formato e tamanho parametrizáveis. Nomes e textos livres devem respeitar tamanhos mínimos e máximos definidos por campo (por exemplo, justificativas com mínimo de 10 caracteres para evitar "ok" como justificativa). Hash de arquivos é calculado no upload para detecção de duplicidade.

As validações de **regra de negócio** garantem aderência às políticas definidas. Competência selecionada deve ser passada ou presente. Valor do repasse no comprovante deve estar dentro da tolerância em relação ao calculado. Envio exige ao menos um destinatário válido e comprovante ativo. Cancelamento de comprovante exige justificativa e é restrito ao admin master. Substituição exige justificativa e preserva a versão anterior. Observação interna nunca pode ser publicada como pública em edição retroativa — apenas por nova observação. Exclusão física é proibida em entidades com vínculo histórico; apenas cancelamento lógico.

As validações de **permissão e contexto** garantem que cada operação seja executada pelo perfil adequado sobre entidades permitidas. Qualquer consulta ao banco originada por perfil externo é filtrada pelo condomínio do usuário, independentemente do que o frontend tenha solicitado. Qualquer operação de escrita é precedida de verificação de autorização com base na matriz de permissões. Tentativas de operação não autorizada são registradas na trilha como evento de segurança.

Adicionalmente, validações específicas do fluxo de upload em lote incluem: detecção de duplicidade por nome de arquivo, sugestão automática de condomínio e competência por heurística, solicitação de confirmação manual em ambiguidades. Validações do envio em lote incluem: relatório parcial em caso de falhas pontuais, rollback apenas das operações individualmente falhas.

---

## 17. Exceções e Cenários de Erro

Esta seção cataloga os cenários de exceção relevantes que o produto deve tratar explicitamente, com estratégia de recuperação ou comunicação clara ao usuário.

No fluxo de **upload de comprovante**, as exceções previstas são: arquivo corrompido detectado no upload (mensagem clara ao usuário, estado anterior preservado); falha de persistência no armazenamento (rollback transacional, estado anterior preservado); divergência de valor acima da tolerância (permitido salvar com flag, sinalização visual, registro na trilha); duplicidade exata detectada por hash (solicitação de confirmação manual); competência futura (bloqueio com mensagem explicativa); formato de arquivo não permitido (mensagem orientando formatos aceitos); tamanho do arquivo excedido (mensagem indicando limite).

No fluxo de **envio de e-mail**, as exceções previstas são: servidor de envio indisponível (retenção em status pendente com política de retry); todos os destinatários inválidos (bloqueio, alerta ao síndico); anexo excede limite do provedor (substituição por link seguro com expiração); destinatário descadastrado entre envio original e reenvio (confirmação manual requerida); falha de entrega registrada por bounce (marcação de destinatário como inválido após X bounces recorrentes, configurável).

No fluxo de **histórico e central documental**, as exceções são: condomínio sem histórico (estado vazio amigável); arquivo não encontrado no armazenamento (erro claro com orientação de contato); perda temporária de conexão (retry automático com indicador visual).

No fluxo de **autenticação e sessão**, as exceções são: credencial inválida (mensagem genérica sem revelar qual campo está errado); bloqueio após X tentativas (mensagem clara com orientação de contato); sessão expirada durante operação (preservação do estado quando possível, redirecionamento ao login); tentativa de acesso a outro condomínio (bloqueio imediato, registro na trilha como evento de segurança).

No fluxo de **exportação**, as exceções são: falha de geração (marcação como falhou com opção de retry); expiração do arquivo (mensagem indicando nova geração necessária); volume excessivo (sugestão de aplicação de filtros adicionais).

Em todos os fluxos, a filosofia geral é: mensagens de erro sempre em português brasileiro, claras, orientadas à ação e sem revelar detalhes técnicos que não sirvam ao usuário. Erros críticos geram evento na trilha. Erros recorrentes do mesmo tipo são consolidados em pendências para revisão pela operação.

---

## 18. Critérios de Aceite

Os critérios de aceite abaixo são compromissos funcionais verificáveis que o produto evoluído deve cumprir. São organizados por funcionalidade e devem servir como checklist de validação antes de cada release.

Para **upload de comprovantes**, considera-se aceito quando: qualquer administrativo consegue subir um comprovante em menos de um minuto; o arquivo é imediatamente visível no portal do síndico; a substituição preserva a versão anterior com rótulo claro na timeline; o cancelamento é restrito ao admin master e dispara pendência; a trilha registra todos os eventos; permissões são rigorosamente respeitadas; divergências de valor acima da tolerância são visualmente destacadas.

Para **envio de e-mail**, considera-se aceito quando: o envio é disparado com um clique (confirmação mediante); os destinatários recebem e-mail com corpo correto, valores corretos e anexo acessível; o status evolui automaticamente de pendente a entregue; falhas geram pendência automática; o reenvio gera novo registro preservando o original; o síndico consegue visualizar o envio diretamente no portal.

Para **histórico completo**, considera-se aceito quando: síndico acessa o histórico e vê as competências em até três segundos; ao expandir uma competência, todos os artefatos estão visíveis respeitando permissões; filtros e busca funcionam; comprovantes substituídos são rastreáveis; observações internas nunca aparecem para perfis externos; exportação funciona conforme seção 11.5.

Para **central de documentos**, considera-se aceito quando: síndico encontra qualquer documento em até três cliques; filtros por categoria, competência e tipo funcionam; permissões respeitadas; busca por nome e tag funciona.

Para **trilha de auditoria**, considera-se aceito quando: qualquer ação relevante aparece na trilha em até cinco segundos; filtros por tipo, usuário e data funcionam; exportação disponível para admin master; eventos internos não vazam para perfis externos.

Para **alertas e pendências**, considera-se aceito quando: ao final do ciclo mensal, o administrativo vê todas as pendências em uma tela; resolver uma pendência pela ação correspondente a remove em até um minuto; síndico é notificado sobre pendências sob sua responsabilidade.

Para **confirmação de recebimento**, considera-se aceito quando: administrativo vê por competência quais condomínios confirmaram; síndico tem botão claro para confirmar; toda confirmação é registrada na trilha.

Para **exportação de relatórios**, considera-se aceito quando: relatórios gerados são consistentes com o dashboard online; download funciona; geração completa em até um minuto para volumes típicos; PDFs têm identidade visual MiniMerX.

Para **painel executivo**, considera-se aceito quando: síndico entende o estado da parceria em menos de 10 segundos; links funcionam; layout funcional em tablet.

Para **observações**, considera-se aceito quando: classificação de escopo é respeitada em todos os pontos de exibição; observações internas nunca aparecem para perfis externos; edição antes da publicação funciona; substituição preserva histórico.

Para **calendário**, considera-se aceito quando: administrativo vê o ciclo mensal em uma tela; desvios são destacados; navegação por clique leva ao detalhe da competência.

---

## 19. Prioridade Recomendada por Funcionalidade

A priorização recomendada orienta o planejamento de releases, equilibrando valor de negócio, dependências técnicas e esforço relativo. As prioridades abaixo são expressas como alta, média e baixa, com justificativa.

De prioridade **alta** são: upload de comprovantes (seção 10.1), envio de e-mail com fechamento (seção 10.2), histórico completo dentro da aplicação (seção 10.3), trilha de auditoria (seção 11.2), alertas e pendências (seção 11.3), central de documentos (seção 11.1), exportação de relatórios (seção 11.5), painel executivo para síndico (seção 11.6). Essas funcionalidades endereçam o núcleo do valor da evolução e são interdependentes; sem elas, o produto evoluído não entrega sua promessa.

De prioridade **média** são: observações e notas administrativas (seção 11.7), calendário de fechamento (seção 11.8), confirmação de recebimento ou visualização (seção 11.4). Essas funcionalidades agregam valor significativo mas podem ser entregues em release subsequente sem comprometer o núcleo da proposta.

De prioridade **baixa** (ou futuro) são itens das evoluções sugeridas na seção 23, como integrações bancárias automáticas, portal mobile dedicado, assinatura digital de documentos, automação completa do ciclo mensal. São direcionadores de longo prazo e não condição de entrega desta fase.

---

## 20. Sugestões Futuras de Evolução do Produto

Além das funcionalidades descritas nesta especificação, recomenda-se avaliar as seguintes evoluções futuras, organizadas por eixo estratégico. Essas sugestões não compõem o escopo desta fase e são apresentadas como direcionadores de médio e longo prazo.

No eixo de **automação financeira**, recomenda-se avaliar a integração com o Open Finance ou com APIs bancárias diretas para automação do lançamento de comprovantes de repasse — eliminando o upload manual e permitindo reconciliação automática entre o repasse efetuado e o valor calculado. Integração com sistemas contábeis comumente utilizados por administradoras condominiais (por exemplo, SuperSíndico, Superlógica, Group Software) permitiria envio automatizado de extratos em formato aderente ao ERP do condomínio.

No eixo de **experiência do síndico**, recomenda-se avaliar a criação de um aplicativo mobile dedicado ou progressive web app otimizada para consumo rápido, complementar ao portal web, com notificações push para novos fechamentos e pendências. Complementarmente, um canal de chat ou solicitação de suporte integrado ao portal facilitaria comunicação bidirecional entre síndico e operação.

No eixo de **governança e segurança**, recomenda-se avaliar a assinatura digital de documentos (ICP-Brasil ou equivalente) para os comprovantes e relatórios, adicionando camada adicional de autenticidade; autenticação multifator obrigatória para admin master e opcional para demais perfis; integração com provedor de identidade corporativa para a equipe MiniMerX.

No eixo de **inteligência de negócio**, recomenda-se avaliar a introdução de comparativos mensais automáticos com análise de variação (com explicações inferidas quando possível), previsão de faturamento e repasse baseada em série histórica, detecção de anomalias (quedas bruscas, picos atípicos), benchmark anonimizado entre condomínios similares para ajudar síndicos a entenderem o desempenho relativo do seu ponto.

No eixo de **expansão de modelo de negócio**, recomenda-se avaliar suporte a múltiplas moedas ou localizações caso a MiniMerX se expanda internacionalmente, suporte a tipos adicionais de operação além de mercadinho e lavanderia, modelo de comissionamento variável por tipo de produto vendido, integração com programas de fidelidade dos moradores.

No eixo de **marketing e valor ao condomínio**, recomenda-se avaliar a geração automática de um relatório anual institucional que o síndico possa apresentar em assembleia anual do condomínio, reforçando a parceria e o valor agregado; criação de área de "dicas e boas práticas" de uso do ponto autônomo para compartilhamento com moradores; integração com canais de feedback e pesquisa de satisfação dos moradores.

---

## 21. Prioridades Recomendadas (Roadmap)

Esta seção propõe um roadmap de releases baseado nas prioridades da seção 19, estruturado em três ondas sucessivas. As ondas podem ser executadas sequencialmente ou com sobreposição moderada conforme capacidade de time.

A **primeira onda** (MVP da evolução) entrega as três funcionalidades obrigatórias e os pilares de governança que as sustentam: upload de comprovantes, envio de e-mail com fechamento, histórico completo, trilha de auditoria e alertas e pendências. Com essa onda, o produto já cumpre o objetivo central desta fase — permitir que a MiniMerX execute o ciclo mensal completo dentro da plataforma com rastreabilidade integral. Estimativa qualitativa de esforço: maior, por envolver fundações de armazenamento, envio de e-mails transacionais e modelo de competência.

A **segunda onda** (experiência e produtividade) entrega central de documentos, exportação de relatórios, painel executivo do síndico e observações administrativas. Com essa onda, o valor percebido pelo síndico e pela administradora é ampliado substancialmente, o trabalho da operação fica mais fluido e a prestação de contas torna-se efetivamente um diferencial competitivo.

A **terceira onda** (sofisticação e amadurecimento) entrega calendário de fechamento, confirmação de recebimento ou visualização e refinamentos de UX/UI identificados nas primeiras ondas. A partir dessa onda, o produto está consolidado e pronto para evoluir em direção às sugestões futuras da seção 20.

Recomenda-se que cada onda inclua, obrigatoriamente, rodadas de teste com pelo menos dois síndicos reais e uma administradora parceira, para validação de fluxo e ajustes antes da disponibilização em produção para toda a base.

---

## 22. Riscos de Produto e Processo

A execução desta evolução envolve riscos que devem ser reconhecidos, monitorados e mitigados explicitamente ao longo do ciclo de vida do produto.

Um risco central é o de **resistência à mudança por parte da operação interna**: a equipe administrativa acostumada a enviar e-mails e comprovantes manualmente pode relutar em adotar o novo fluxo, especialmente se perceber atrito inicial na curva de aprendizado. Mitigação: envolvimento da equipe no design dos fluxos, treinamento estruturado antes do go-live, acompanhamento próximo nos primeiros dois ou três ciclos mensais, indicadores operacionais que evidenciem ganhos (tempo economizado, pendências reduzidas).

Um segundo risco é a **baixa adoção pelos síndicos**: se a comunicação continuar chegando por e-mail e o portal for subutilizado, o esforço de histórico, central documental e painel executivo perde retorno. Mitigação: comunicação ativa com síndicos apresentando o portal, eventuais webinars ou materiais de onboarding, inclusão de links do portal em todos os e-mails de comunicação, métricas de login e uso monitoradas, contatos proativos com síndicos menos engajados.

Um terceiro risco é o de **disputas de valor** decorrentes de divergências entre o valor calculado no sistema e o valor efetivamente transferido ao condomínio. Mitigação: tolerância parametrizada para divergências menores, processo claro de justificativa para divergências maiores, trilha de auditoria completa para sustentar qualquer contestação, política de comunicação proativa quando a divergência for identificada.

Um quarto risco é o de **vazamento de dados entre condomínios** por falha de segregação: a consequência reputacional seria severa, dado que o produto é fundamentado em confiança de informações financeiras. Mitigação: validação rigorosa no backend independentemente do frontend, testes automatizados de segurança, revisão de código focada em autorização, trilha de auditoria para detectar tentativas indevidas, auditoria de segurança antes de cada release de grande escopo.

Um quinto risco é o de **sobrecarga operacional inicial** decorrente do backlog de dados históricos: pode haver pressão para importar comprovantes antigos e preencher o histórico retroativamente, o que consome recursos sem estar no escopo desta fase. Mitigação: decisão explícita de começar em uma competência específica (por exemplo, competência do mês seguinte ao go-live) com comunicação clara aos síndicos sobre o início do novo ciclo, deixando importações retroativas como projeto paralelo opcional.

Um sexto risco é o de **dependência de terceiros no envio de e-mail**: interrupções ou mudanças no provedor de e-mail transacional podem comprometer comunicações críticas. Mitigação: escolha de provedor com SLA adequado, implementação de fallback secundário, monitoramento ativo de taxas de entrega, relatório mensal de saúde de entrega.

Um sétimo risco é o de **crescimento de volume de armazenamento** à medida que comprovantes e documentos históricos se acumulam. Mitigação: política clara de retenção, possibilidade de arquivamento em storage frio para documentos com mais de X anos (mantendo trilha e acessibilidade), monitoramento de custos e dimensionamento.

Um oitavo risco é o de **escopo inflado** durante a execução, com incorporação contínua de funcionalidades da seção 20 antes da consolidação do núcleo. Mitigação: disciplina de priorização baseada no roadmap da seção 21, revisão trimestral formal de escopo, critérios de aceite claros por release.

Um nono risco é o de **complexidade jurídica e tributária** associada à formalização da relação entre MiniMerX e condomínio pela via digital: comprovantes eletrônicos têm validade legal, mas podem surgir questões fiscais não previstas. Mitigação: consulta a jurídico e contábil antes do go-live, manutenção de trilha auditável, acompanhamento regulatório.

---

## 23. Sugestões de Evolução Futura (Longo Prazo)

Para além do horizonte desta fase e do roadmap imediato, recomenda-se que a MiniMerX construa uma visão de produto de longo prazo ancorada em três vetores: automação de fim a fim do ciclo financeiro, inteligência de negócio para a rede e plataforma aberta para o ecossistema condominial.

Na **automação de fim a fim**, a evolução natural é reduzir progressivamente a intervenção manual no ciclo mensal: integração bancária para lançamento automático do comprovante a partir do extrato; automação do envio do e-mail com disparo programado para o dia X após o fechamento; reconciliação automática com contestação estruturada caso o valor transferido divirja do esperado; geração automática de relatórios mensais personalizados por condomínio com envio recorrente à administradora; notificações proativas a síndicos sobre marcos do ciclo.

Na **inteligência de negócio para a rede**, o dashboard pode evoluir de ferramenta de prestação de contas para plataforma de decisão de negócio: análise preditiva de faturamento por condomínio considerando sazonalidade, eventos condominiais, férias escolares e feriados; identificação automática de pontos em degradação (tendência de queda consistente) para atuação preventiva; sugestão de pontos candidatos à expansão baseada em histórico de unidades semelhantes; benchmarking anonimizado entre condomínios de perfil similar; painel estratégico para a liderança da MiniMerX com visão consolidada de saúde da rede.

Na **plataforma aberta para o ecossistema condominial**, a visão é transformar o portal em um ativo relacional: API para administradoras condominiais integrarem o extrato mensal automaticamente em seus sistemas ERP; marketplace interno para outros parceiros autônomos da MiniMerX (por exemplo, parceiros que quiserem instalar serviços complementares no condomínio) seguirem o mesmo padrão de prestação de contas; área pública institucional da MiniMerX com vitrine de condomínios parceiros (opt-in) usada como prova social em vendas; programa de indicação entre síndicos com incentivos formalizados no próprio portal.

Complementarmente, evoluções tangenciais que merecem avaliação incluem: suporte a múltiplos modelos contratuais (repasse fixo mensal, repasse percentual escalonado por faixas de faturamento, repasse misto); gestão de contratos com assinatura digital e datas de vigência rastreáveis; módulo de campanhas promocionais com registro de impacto no faturamento e compartilhamento com síndico; módulo de manutenção e operação com chamados abertos, SLA e resolução visível ao síndico; módulo de NPS com síndicos e moradores, consolidado como indicador estratégico.

Cada uma dessas evoluções deve ser avaliada em função de retorno de negócio, complexidade técnica, risco e aderência à estratégia geral da MiniMerX, mas em conjunto sinalizam um caminho plausível para transformar o dashboard em uma plataforma central da relação com condomínios — um ativo estratégico inimitável no mercado de mercadinhos autônomos.

---

## 24. Resumo Executivo

A MiniMerX, rede de mercadinhos autônomos 24 horas e lavanderias autônomas instaladas em condomínios residenciais, opera hoje uma parceria contratual com cada condomínio que envolve repasse financeiro periódico baseado em percentual sobre o faturamento. O dashboard existente já entrega visibilidade de faturamento e repasse por condomínio, mas deixa lacunas críticas em comprovação, comunicação formal e histórico auditável — lacunas que geram sobrecarga operacional, risco reputacional e fricção no relacionamento com síndicos.

Esta especificação estrutura a evolução do produto em torno de sete capacidades fundamentais: transparência financeira, prestação de contas por competência, organização documental, histórico acessível, comunicação formal rastreável, visibilidade operacional e governança auditável. Propõe três funcionalidades obrigatórias — upload de comprovantes de repasse, envio formal de e-mail com fechamento e comprovante, histórico completo dentro da aplicação — e oito funcionalidades recomendadas que ampliam o valor entregue: central de documentos por condomínio, trilha de auditoria, alertas e pendências, confirmação de recebimento, exportação de relatórios, painel executivo para síndico, observações administrativas e calendário de fechamento.

A matriz de permissões é expandida de dois para cinco perfis (administrador master, administrativo interno, síndico, financeiro do condomínio e somente leitura), com definições claras de visibilidade e capacidade de ação por perfil. Regras de negócio transversais — isolamento de dados por condomínio, imutabilidade retroativa, competência como unidade de agrupamento, dupla visibilidade de observações, trilha obrigatória — asseguram a integridade do produto evoluído.

A priorização recomendada organiza a entrega em três ondas: a primeira com o núcleo obrigatório e os pilares de governança; a segunda com as funcionalidades de experiência e produtividade; a terceira com refinamentos e sofisticação. Riscos conhecidos (resistência interna, adoção pelos síndicos, disputas de valor, vazamento de dados, sobrecarga operacional, dependência de terceiros em e-mail, crescimento de storage, escopo inflado, complexidade jurídica) são explicitados com mitigações concretas.

No horizonte de longo prazo, a MiniMerX pode evoluir o produto em direção à automação completa do ciclo financeiro (integração bancária, reconciliação automática, envio programado), à inteligência de negócio para a rede (previsão, identificação de riscos, benchmarking, painel estratégico) e à plataforma aberta para o ecossistema condominial (APIs, marketplace, vitrine institucional).

O entregável imediato esta especificação — e o compromisso assumido com o negócio — é permitir que a MiniMerX execute, em tempo hábil, o ciclo mensal completo de prestação de contas para todos os seus condomínios dentro da plataforma, com rastreabilidade integral, experiência profissional e governança auditável, estabelecendo uma base sólida para crescimento da rede sem proporcionalmente aumentar o custo operacional nem o risco reputacional.

---

*Fim do documento.*
