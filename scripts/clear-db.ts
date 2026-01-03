/**
 * Script de desenvolvimento para limpar o banco de dados MongoDB
 * 
 * USO: npm run db:clear
 * 
 * ATENÇÃO: Este script irá DELETAR todos os dados das coleções!
 * Use apenas em ambiente de desenvolvimento.
 */

import { MongoClient } from 'mongodb';
import * as readline from 'readline';

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017';
const DB_NAME = 'editor_db';

// Nomes das coleções a serem limpas
const COLLECTIONS = ['users', 'documents', 'chapters', 'paragraphs'];

async function clearDatabase() {
  // Verificação de segurança: não permitir em produção
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERRO: Este script não pode ser executado em produção!');
    process.exit(1);
  }

  console.log('🚨 ATENÇÃO: Este script irá deletar TODOS os dados do banco de dados!');
  console.log(`📦 Banco de dados: ${DB_NAME}`);
  console.log(`🗂️  Coleções: ${COLLECTIONS.join(', ')}`);
  console.log('');

  // Solicitar confirmação do usuário
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question('Você tem certeza? Digite "SIM" para confirmar: ', resolve);
  });

  rl.close();

  if (answer !== 'SIM') {
    console.log('❌ Operação cancelada.');
    process.exit(0);
  }

  let client: MongoClient | null = null;

  try {
    console.log('\n🔌 Conectando ao MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    console.log('✅ Conectado com sucesso!');
    console.log('');

    // Limpar cada coleção
    for (const collectionName of COLLECTIONS) {
      try {
        const collection = db.collection(collectionName);
        const result = await collection.deleteMany({});
        console.log(`🗑️  ${collectionName}: ${result.deletedCount} documento(s) deletado(s)`);
      } catch (error) {
        console.log(`⚠️  ${collectionName}: Coleção não encontrada ou erro ao limpar`);
      }
    }

    console.log('');
    console.log('✅ Banco de dados limpo com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar ou limpar o banco de dados:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Conexão fechada.');
    }
  }
}

// Executar o script
clearDatabase().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
