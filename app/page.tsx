import { getDatabase } from '@/app/lib/mongodb';
import { revalidatePath } from 'next/cache';
import UserForm from '@/components/UserForm';

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Server Action para criar usuário
async function createUser(formData: FormData) {
  'use server';
  
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  const db = await getDatabase();
  await db.collection('users').insertOne({
    name,
    email,
    createdAt: new Date(),
  });

  revalidatePath('/');
}

// Server Action para deletar todos
async function deleteAllUsers() {
  'use server';
  
  const db = await getDatabase();
  await db.collection('users').deleteMany({});
  revalidatePath('/');
}

// Server Component que busca dados diretamente
export default async function Home() {
  const db = await getDatabase();
  const users = await db.collection('users').find({}).toArray();

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">CRUD de Usuários - Teste MongoDB</h1>

        <UserForm createUser={createUser} />

        {/* Lista de usuários */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Usuários Cadastrados</h2>
            {users.length > 0 && (
              <form action={deleteAllUsers}>
                <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm">
                  Deletar Todos
                </button>
              </form>
            )}
          </div>

          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Sem usuários cadastrados</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user._id.toString()} className="border-b pb-4 last:border-b-0">
                  <p className="font-semibold text-lg">{user.name}</p>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-gray-400 text-sm">
                    Criado em: {new Date(user.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
