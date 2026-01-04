import { getDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Não pode deletar IDs temporários (ainda não estão no MongoDB)
    if (id.startsWith('temp-')) {
      return NextResponse.json(
        { error: 'Não é possível deletar capítulo temporário' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const result = await db.collection('chapters').deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Capítulo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Capítulo deletado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao deletar capítulo:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar capítulo' },
      { status: 500 }
    );
  }
}
