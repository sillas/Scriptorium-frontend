import { getDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, author, metadata } = body;

    // Validação básica
    if (!title) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    // Gerar slug a partir do título
    let slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const db = await getDatabase();
    
    // Verificar se o slug já existe e adicionar número se necessário
    let finalSlug = slug;
    let counter = 1;
    
    while (await db.collection('documents').findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Criar novo documento
    const now = new Date();
    const newDocument = {
      title,
      slug: finalSlug,
      subtitle: subtitle || '',
      author: author || 'Usuário Padrão',
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        tags: metadata?.tags || [],
        status: metadata?.status || 'draft',
      },
    };

    const result = await db.collection('documents').insertOne(newDocument);

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        slug: newDocument.slug,
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
    const { id, title, subtitle, updatedAt, metadata } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const updateData: any = {
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (metadata !== undefined) updateData.metadata = metadata;

    const result = await db.collection('documents').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
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
