import { getDatabase } from '@/lib/mongodb';
import DocumentForm from '@/components/editor/DocumentForm';

export default async function Editor() {
  
  const db = await getDatabase();
  const documents = await db.collection('documents').find({}).toArray();

  return (
    <div className="container mx-auto py-8">
      <DocumentForm />
      
      <div className="mt-12 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold mb-4">Documentos Existentes</h3>
        {documents.length === 0 ? (
          <p className="text-gray-500">Nenhum documento encontrado.</p>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc._id.toString()} className="border border-gray-200 p-4 rounded-md hover:bg-gray-50">
                <h2 className="font-semibold">{doc.title}</h2>
                <p className="text-gray-600 text-sm">{doc.subtitle}</p>
                <a 
                  href={`/editor/${doc._id.toString()}`}
                  className="text-blue-500 hover:underline text-sm mt-2 inline-block"
                >
                  Editar →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}