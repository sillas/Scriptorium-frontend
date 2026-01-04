import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    const users = await db.collection('users').find({}).toArray();
    
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Nome e email são obrigatórios' }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await db.collection('users').insertOne({
      name,
      email,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, userId: result.insertedId });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ success: false, error: 'Erro ao criar usuário' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDatabase();
    await db.collection('users').deleteMany({});
    
    return NextResponse.json({ success: true, message: 'Todos os usuários foram removidos' });
  } catch (error) {
    console.error('Erro ao deletar usuários:', error);
    return NextResponse.json({ success: false, error: 'Erro ao deletar usuários' }, { status: 500 });
  }
}
