'use client';

import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
    >
      {pending ? 'Salvando...' : 'Adicionar Usuário'}
    </button>
  );
}

export default function UserForm({ createUser }: { createUser: (formData: FormData) => Promise<void> }) {
  return (
    <form action={createUser} className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">Adicionar Usuário</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Nome</label>
        <input
          type="text"
          name="name"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Email</label>
        <input
          type="email"
          name="email"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <SubmitButton />
    </form>
  );
}
