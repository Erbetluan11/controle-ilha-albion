# ALBION COMPANION — alpha 0.1
Domine o mercado. Evolua seu personagem. Conquiste Albion.

Esta entrega é uma base funcional, não a implementação integral dos 19 grupos de requisitos. Não afiliada à Sandbox Interactive. Sem preços fictícios ou acesso à conta do jogo.

## Implementado
- React/TypeScript/Vite, Tailwind, Motion, Lucide, Recharts, TanStack Query e Zustand.
- Layout responsivo, temas, menu recolhível, pesquisa por ID, autocomplete de catálogo inicial (12 itens).
- Mercado com API REST backend, preços entre cidades, histórico diário disponível, datas de observação de compra/venda, cache e contingência identificada.
- Autenticação por e-mail/senha no Supabase, cadastro com confirmação de e-mail, logout e solicitação de recuperação.
- Diário persistente com categorias, validação, exclusão confirmada, saldo dos registros carregados e exportação CSV/Excel (até 1.000 registros).
- Favoritos por usuário no PostgreSQL, seleção e remoção.
- Calculadora econômica manual de lote único, valor recuperado, fluxo de caixa, ROI e resultado por foco; salva operações autenticadas no banco.
- Preferências persistentes e sons originais sintetizados, desativados por padrão.
- Migração SQL com RLS e testes unitários do cálculo.

## Não implementado / não prometido como pronto
Refino e crafting automáticos com receitas reais, foco derivado de especialização, biblioteca/editor de builds, mapa, coleta, perfis GameInfo, guildas, killboard, notícias, enciclopédia completa, avatar, leitura/comparação de operações salvas, períodos do diário, filtros por tier/encantamento dedicados e compartilhamento público. Não há botões decorativos para esses módulos. A busca aceita IDs completos, incluindo encantamento @1/@2/@3, mas não faz descoberta automática de todos os itens.

## Requisitos locais
Node.js 22 LTS ou superior compatível, npm, projeto Supabase/PostgreSQL. Sem credenciais, mercado funciona com backend configurado, mas conta/diário/favoritos ficam indisponíveis com explicação. Nenhum preço de exemplo é injetado.

1. Na raiz: `npm install`.
2. `npm run build -w @ac/core`.
3. Copie `apps/api/.env.example` para `apps/api/.env` e `apps/web/.env.example` para `apps/web/.env`.
4. No Supabase SQL Editor, execute `supabase/migrations/001_initial.sql` uma vez.
5. Configure URL do projeto e chave **pública anon/publishable** no frontend. Nunca use service_role no Vite. Ative confirmação de e-mail no Auth.
6. Em Supabase Auth > URL Configuration, configure Site URL e Redirect URLs com o endereço do frontend. Esta versão envia recuperação por e-mail, mas a tela final de redefinição de senha precisa ser implementada antes de oferecer um fluxo completo em produção.
7. Terminal A: `npm run dev:api`.
8. Terminal B: `npm run dev:web`.
9. Abra o endereço mostrado pelo Vite (normalmente localhost:5173).
10. `npm test` executa os testes do núcleo. `npm run build` compila todos os pacotes.

## Deploy
GitHub Pages NÃO executa Node ou PostgreSQL. Publique `apps/web/dist` no Pages após build; hospede `apps/api` em serviço Node separado e banco no Supabase. Defina VITE_API_URL com HTTPS e WEB_ORIGINS no backend com o domínio exato do frontend. Variáveis VITE são incorporadas durante o build. Não publique o diretório fonte como se fosse HTML pronto. Nenhum deploy/credencial é configurado automaticamente neste pacote.

## APIs
- GET /api/health
- GET /api/market/prices?items=T5_CABBAGE&server=west
- GET /api/market/history?items=T5_CABBAGE&server=west&city=Thetford

IDs: lista de 1–30 IDs. Servidores permitidos: west/europe/east. URLs externas são fixas: não há proxy arbitrário.
Preços: cache 2 min; histórico: 15 min; contingência de até 24 h marcada `stale`. Erros sem cache retornam HTTP 503; dados ausentes nunca viram preço zero. Cache limitado a 500 chaves, deduplicação concorrente e orçamento upstream de 80/min e 240/5min por processo. HTTP 429 pausa upstream por 5 min. A fonte e seus limites podem mudar: revise a documentação antes de produção. Com várias réplicas, substitua cache/orçamento por Redis distribuído.

## Segurança e limites
Supabase valida sessões e aplica RLS diretamente nas tabelas. Backend de mercado usa somente fontes públicas. Sessões de navegador exigem cuidado com XSS; adote CSP em produção. Use HTTPS, políticas de senha, SMTP e CAPTCHA/rate limits do Supabase conforme risco. Não há auditoria de segurança ou testes E2E nesta entrega. Não foi possível instalar dependências, executar TypeScript/Vitest ou testar APIs no ambiente de geração: faça esses passos antes de produção.

## Migração do controle de ilha antigo
Este projeto não lê nem apaga a chave localStorage `plantios`. Exporte o JSON do site anterior antes de migrar. Importador específico de plantios é pendente; o diário não deve reinterpretar automaticamente o custo inicial de sementes como prejuízo recorrente.

## Fórmulas
Veja docs/ARCHITECTURE.md. O simulador não afirma usar receitas/foco oficiais: recebe parâmetros explícitos, sem bônus inventados. Material recuperado é estoque estimado, não receita de caixa. Custos de estação são totais informados, não taxa de nutrição inferida.
