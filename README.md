# Disparos WhatsApp: API oficial (Cloud API da Meta)

Sistema SaaS de disparo em massa pela API oficial do WhatsApp, feito em Nuxt com componentização.

## O que ele faz

- **Canais**: conecta números da API oficial (Phone Number ID + WABA ID + token). Antes de salvar, valida as credenciais na Meta e mostra a qualidade do número.
- **Templates**: lista os templates da conta (aprovado, em análise, rejeitado) e cria novos com cabeçalho, corpo, rodapé, botões, variáveis como `{{nome}}` e pré-visualização no estilo do WhatsApp.
- **Nova campanha** em 4 etapas:
  1. **Contatos**: upload de planilha (.xlsx, .xls, .csv). O sistema detecta a coluna de telefone, coloca o 55 automaticamente e remove inválidos e duplicados.
  2. **Canal e template**: só deixa escolher templates aprovados.
  3. **Variáveis**: liga cada `{{variável}}` a uma coluna da planilha ou a um texto fixo, com valor padrão para células vazias e preview contato por contato.
  4. **Envio**: envia agora ou agenda, com velocidade de 1 a 80 mensagens por segundo e tempo estimado.
- **Fila 24h**: os envios saem em segundo plano, com pausar, retomar e cancelar. Erros temporários são tentados de novo sozinhos (até 5 vezes). Se o token expirar ou o template for removido, a campanha **pausa sozinha** em vez de queimar a lista.
- **Relatório por campanha**: total, enviados, entregues, lidos e falhas, com percentuais, barra de progresso, filtros, busca, motivo de cada falha e exportação em CSV (abre no Excel). Atualiza em tempo real pelo webhook da Meta.
- **Descadastros**: quem responde SAIR, PARAR, STOP etc. entra numa lista de bloqueio e nunca mais recebe campanhas. Também dá para adicionar números manualmente.
- **Login** protegendo o painel e **assinatura do webhook** validada com o App Secret.

## Estrutura (método de componentização)

```
app/
  pages/                    ← páginas finas (poucas linhas), só chamam o componente
    disparos/index.vue      → <DisparosPage/>
    disparos/nova.vue       → <DisparosNovaPage/>
    disparos/[id].vue       → <DisparosDetalhesPage/>
    templates.vue, canais.vue, descadastros.vue, login.vue
  components/
    disparos/               ← uma pasta com o nome de cada página
      DisparosNovaPage.vue        (monta as etapas)
      DisparosEtapaUpload.vue     DisparosEtapaCanal.vue
      DisparosEtapaVariaveis.vue  DisparosEtapaEnvio.vue
      DisparosDetalhesPage.vue    DisparosDetalhesResumo.vue
      DisparosDetalhesTabela.vue  DisparosDetalhesAcoes.vue ...
    templates/  canais/  whatsapp/BolhaPreview.vue  ui/ (botões, badges, modal)
  composables/              ← estado e formatação compartilhados
shared/template.ts          ← regras de variáveis e telefone (usadas no painel e no servidor)
server/
  api/                      ← backend (canais, templates, campanhas, webhook, descadastros)
  utils/whatsapp.ts         ← cliente da Graph API da Meta
  utils/queue.ts            ← fila de disparos, retentativas, status do webhook
  utils/db.ts               ← banco SQLite (arquivo único, sem instalar nada)
  plugins/worker.ts         ← liga a fila junto com o servidor
```

Para mudar só uma parte, por exemplo buscar contatos do CRM além da planilha, mexa apenas em `DisparosEtapaUpload.vue`.

## Passo a passo na Meta

1. Em **developers.facebook.com**, crie um App do tipo *Empresa* e adicione o produto **WhatsApp**.
2. Em **WhatsApp → Configuração da API**, anote o **Phone Number ID** e o **WhatsApp Business Account ID**.
3. Gere um **token permanente**: Gerenciador de Negócios → Usuários do sistema → Adicionar (admin) → Gerar token com as permissões `whatsapp_business_messaging` e `whatsapp_business_management`.
4. Anote o **App Secret** em Configurações do app → Básico.
5. Depois de subir o sistema, vá em **WhatsApp → Configuração → Webhook**:
   - URL de retorno: `https://SEU-DOMINIO/api/webhook`
   - Token de verificação: o mesmo de `NUXT_WEBHOOK_VERIFY_TOKEN`
   - Assine o campo **messages**.

## Rodar no computador

Precisa de Node.js 20 ou mais novo.

```bash
cp .env.example .env      # preencha login, senha, segredos
npm install
npm run dev               # http://localhost:3000
```

## Colocar no ar (VPS)

```bash
npm install
npm run build
# carregue as variáveis do .env e rode 24h com pm2:
npm i -g pm2
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

Coloque um Nginx com HTTPS (Let's Encrypt) na frente, apontando para a porta 3000. A Meta só aceita webhook em HTTPS.
O banco fica em `data/disparos.db`. Faça backup desse arquivo.

## Bom saber

- A Meta só deixa iniciar conversa com **templates aprovados** e cobra por mensagem conforme a categoria (Marketing, Utilidade, Autenticação).
- Dispare só para quem aceitou receber (opt-in). Muitos bloqueios derrubam a qualidade do número e o limite diário.
- O limite de contatos novos por dia depende do nível do seu número na Meta (começa em 250 sem verificação do negócio).
- Templates com imagem ou vídeo no cabeçalho são criados pelo WhatsApp Manager. Eles aparecem no sistema e o link da mídia é pedido na hora do disparo.

## Próximos passos sugeridos

- Multiempresa (cada cliente do SaaS com seu login e seus canais)
- Importar contatos do banco ou CRM na etapa de upload
- Caixa de entrada para conversar com quem respondeu
- Redis/BullMQ se passar de centenas de milhares de envios por dia
