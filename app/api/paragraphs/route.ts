import { getDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, documentId, chapterId, index, text, metadata } = body;

    if (!documentId || !chapterId) {
      return NextResponse.json(
        { error: 'DocumentId e chapterId são obrigatórios' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    const newParagraph = {
      _id: id && id.startsWith('temp-') ? undefined : id ? new ObjectId(id) : undefined,
      documentId,
      chapterId,
      index: index || 1,
      text: text || '',
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: metadata || { characterCount: 0 },
    };

    const result = await db.collection('paragraphs').insertOne(newParagraph);

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        message: 'Parágrafo criado com sucesso',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar parágrafo:', error);
    return NextResponse.json(
      { error: 'Erro ao criar parágrafo' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Skip if it's a temp ID
    if (id.startsWith('temp-')) {
      // Convert temp paragraph to permanent
      return POST(request);
    }


    const result = await db.collection('paragraphs').updateOne(
      { _id: new ObjectId(id) },
      { $set: rest }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Parágrafo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Parágrafo atualizado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao atualizar parágrafo:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar parágrafo' },
      { status: 500 }
    );
  }
}
