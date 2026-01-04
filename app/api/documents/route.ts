import { getDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { generateSlug, ensureUniqueSlug } from '@/lib/slug-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const document = body;

    const db = await getDatabase();

    // Gerar slug a partir do título
    if(!document.slug) {
      const baseSlug = generateSlug(document.title);
      const uniqueData = await ensureUniqueSlug(db, 'documents', document.title, baseSlug);
      document.title = uniqueData.title;
      document.slug = uniqueData.slug;
    }

    const result = await db.collection('documents').insertOne(document);

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        slug: document.slug,
        title: document.title,
        message: 'Documento criado com sucesso',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar documento' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...document } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const slug = generateSlug(document.title);
    const db = await getDatabase();
    
    // Verificar se já existe outro documento com esse slug
    const existingDoc = await db.collection('documents').findOne({
      slug: slug,
      _id: { $ne: new ObjectId(id) }
    });

    if (existingDoc) {
      return NextResponse.json(
        { error: 'Já existe um documento com este título' },
        { status: 409 }
      );
    }

    const result = await db.collection('documents').updateOne(
      { _id: new ObjectId(id) },
      { $set: document }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Documento atualizado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar documento' },
      { status: 500 }
    );
  }
}
