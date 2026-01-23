# Scripts de Desenvolvimento

Este diretório contém scripts auxiliares para desenvolvimento.

## clear-db.ts

Script para limpar todos os dados do banco de dados MongoDB.

### Uso

```bash
npm run db:clear
```

### O que faz

- Conecta ao MongoDB usando a string de conexão do ambiente (`MONGODB_URI`)
- Solicita confirmação do usuário (digite "SIM" para confirmar)
- Limpa todas as coleções: `users`, `documents`, `chapters`, `paragraphs`
- Exibe o número de documentos deletados de cada coleção

### Segurança

- **Não pode ser executado em produção** - o script verifica `NODE_ENV` e aborta se estiver em produção
- Requer confirmação explícita do usuário antes de executar
- Fecha a conexão automaticamente após a execução

### Requisitos

- MongoDB rodando (via Docker ou local)
- Variável de ambiente `MONGODB_URI` configurada (ou usa o padrão do Docker)
- Dependência `tsx` instalada (já incluída em devDependencies)

### Exemplo de Saída

```
🚨 ATENÇÃO: Este script irá deletar TODOS os dados do banco de dados!
📦 Banco de dados: editor_db
🗂️  Coleções: users, documents, chapters, paragraphs

Você tem certeza? Digite "SIM" para confirmar: SIM

🔌 Conectando ao MongoDB...
✅ Conectado com sucesso!

🗑️  users: 5 documento(s) deletado(s)
🗑️  documents: 12 documento(s) deletado(s)
🗑️  chapters: 34 documento(s) deletado(s)
🗑️  paragraphs: 156 documento(s) deletado(s)

✅ Banco de dados limpo com sucesso!
🔌 Conexão fechada.
```

## seed-db.ts

Script para popular o banco de dados MongoDB com dados de exemplo para desenvolvimento.

### Uso

```bash
npm run db:seed
```

### O que faz

- Conecta ao MongoDB usando a string de conexão do ambiente (`MONGODB_URI`)
- Solicita confirmação do usuário (digite "SIM" para confirmar)
- Cria dados de exemplo:
  - **2 documentos** com títulos e subtítulos variados
  - **5 capítulos** por documento (10 capítulos no total)
  - **10 parágrafos** por capítulo (100 parágrafos no total)
- Gera slugs automáticos para os documentos
- Calcula contagens de palavras e caracteres
- Define aleatoriamente alguns parágrafos como citações (20% de chance) ou destacados (10% de chance)

### Segurança

- **Não pode ser executado em produção** - o script verifica `NODE_ENV` e aborta se estiver em produção
- Requer confirmação explícita do usuário antes de executar
- Fecha a conexão automaticamente após a execução

### Requisitos

- MongoDB rodando (via Docker ou local)
- Variável de ambiente `MONGODB_URI` configurada (ou usa o padrão do Docker)
- Dependência `tsx` instalada (já incluída em devDependencies)

### Exemplo de Saída

```
🌱 Script de seed do banco de dados
📦 Banco de dados: editor_db
📝 Será criado:
   - 2 documentos
   - 5 capítulos por documento (10 no total)
   - 10 parágrafos por capítulo (100 no total)

Deseja continuar? Digite "SIM" para confirmar: SIM

🔌 Conectando ao MongoDB...
✅ Conectado com sucesso!

📄 Documento criado: "Crônicas da Sabedoria Antiga" (ID: 65a1b2c3d4e5f6g7h8i9j0k1)
  📖 Capítulo 1: "O Despertar"
    ✏️  10 parágrafos criados (234 palavras)
  📖 Capítulo 2: "Caminhos Desconhecidos"
    ✏️  10 parágrafos criados (256 palavras)
  ...

✅ Seed concluído com sucesso!

📊 Resumo:
   - 2 documentos criados
   - 10 capítulos criados
   - 100 parágrafos criados

🔌 Conexão fechada.
```

### Dica

Use em conjunto com `npm run db:clear` para resetar e popular o banco de dados:

```bash
npm run db:clear && npm run db:seed
```

