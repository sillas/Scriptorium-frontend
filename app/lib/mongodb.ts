import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Por favor, adicione a variável MONGODB_URI no arquivo .env.local');
}

const uri: string = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // Em desenvolvimento, usa uma variável global para preservar o cliente
  // entre hot reloads do Next.js
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // Em produção, cria uma nova conexão
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Exporta a promise do cliente para ser usado em API routes
export default clientPromise;

// Helper para obter o banco de dados diretamente
export async function getDatabase(dbName: string = 'editor_db'): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
