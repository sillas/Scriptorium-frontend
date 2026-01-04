import { getDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, documentId, index, title, subtitle, metadata } = body;

    if (!documentId || !title) {
      return NextResponse.json(
        { error: 'DocumentId e título são obrigatórios' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    const newChapter: any = {
      documentId,
      index: index || 1,
      title,
      subtitle: subtitle || '',
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: metadata || { wordCount: 0 },
    };
    
    // Apenas incluir _id se for fornecido e não for temporário
    if (id && !id.startsWith('temp-')) {
      newChapter._id = new ObjectId(id);
    }

    const result = await db.collection('chapters').insertOne(newChapter);

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        message: 'Capítulo criado com sucesso',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar capítulo:', error);
    return NextResponse.json(
      { error: 'Erro ao criar capítulo' },
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
      // Convert temp chapter to permanent
      return POST(request);
    }

    const result = await db.collection('chapters').updateOne(
      { _id: new ObjectId(id) },
      { $set: rest }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Capítulo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Capítulo atualizado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao atualizar capítulo:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar capítulo' },
      { status: 500 }
    );
  }
}
