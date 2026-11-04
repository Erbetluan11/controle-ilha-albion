# Arquitetura e plano verificável

## Fluxos
React -> TanStack Query -> Node REST -> Albion Data Project.
React -> Supabase Auth + PostgREST -> PostgreSQL com RLS.
Zustand persiste somente preferências; dados pessoais são isolados por auth.uid().
Biblioteca core concentra cálculo puro e testes. UI não contém chaves de serviço.

## Contratos e proveniência
`source`: comunitário (AODP); `fetchedAt`: horário de consulta/cache, não horário do preço; datas de compra/venda vêm separadas da fonte; `stale`: contingência. Não chame isso de dados oficiais em tempo real. Sem cotação positiva, exibir ausência. Maior compra observada não prova liquidez nem quantidade disponível.
Histórico exibe somente a primeira série retornada para o único item/cidade consultado; fonte ausente gera estado vazio. Volume não é fabricado.

## Modelo econômico implementado
Uma receita/lote manual, sem reinvestir retornos:
- compra = soma quantidade * preço
- estoque recuperado = soma dos materiais retornáveis * retorno efetivo * preço
- receita = quantidade produzida * preço de venda
- impostos = receita * (imposto + taxa de anúncio)
- custo de caixa = compra + estação total + transporte
- saldo de caixa = receita - impostos - custo de caixa
- resultado econômico = saldo de caixa + valor do estoque recuperado
- ROI = resultado econômico / (custo de caixa - estoque recuperado), quando denominador positivo
- resultado/foco só quando foco > 0; não equivale automaticamente ao benefício incremental do foco.
O usuário deve informar a taxa efetiva vista no jogo. Premium não deve ser multiplicador genérico do retorno nem foco. Nenhum bônus de cidade/especialização é codificado sem validação.

## Etapas restantes
1. Engenharia de dados: obter dump versionado, checar licença, validar schema e receitas com o cliente do jogo; registrar hash, versão, data e proveniência. Importação não implementada.
2. Refino/crafting: receitas por tier/encantamento, ingredientes sem retorno, nutrição/estação, foco base e especialização verificados. Casos de teste contra operações reais. Não usar multiplicação linear inventada.
3. Coleta: sessões reais primeiro; estimativas de bônus com modelos documentados; não inferir prata/h sem ritmo medido.
4. Builds e enciclopédia: tabelas normalizadas e editor; uso de ícones depende de serviço/termos validados. Sem distribuir assets protegidos.
5. GameInfo: resolver endpoints/regiões, restrições e estabilidade antes do adapter. Estatísticas públicas não dão acesso a inventário privado.
6. Mapas: fonte licenciada e topologia verificadas, nenhuma coordenada inventada.
7. Completar recuperação de senha, perfil, operações salvas e importação antiga; adicionar paginação e filtros do diário.
8. Testes de integração, Playwright, contraste, acessibilidade, proteção antiabuso distribuída e revisão de dependências (incluindo exportador Excel) antes de produção.

## Critérios de aceite
- Mercado: comparar IDs, cidade, servidor, data e valores diretamente com resposta upstream; testar timeout/503/429/array vazio.
- Autenticação: usuário A não consegue ler/escrever ledger/favorites de B via SDK ou REST direto.
- Diário: soma e exportação compatíveis, valores negativos preservados; limite de 1.000 explícito.
- Calculadora: testes core passam; resultado de caixa separado de estoque; foco zero não divide por zero.
- Frontend: build limpo, mobile 360px, navegação teclado e erro de CDN/backend visível.
- Operação: segredos ausentes do bundle, HTTPS, cache e rate limits centralizados se múltiplas instâncias.
