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
