/**
 * Script de desenvolvimento para popular o banco de dados MongoDB com dados de exemplo
 * 
 * USO: npm run db:seed
 * 
 * Este script irá criar:
 * - 2 documentos
 * - 5 capítulos por documento (10 capítulos no total)
 * - 10 parágrafos por capítulo (100 parágrafos no total)
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as readline from 'readline';

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017';
const DB_NAME = 'editor_db';

// Textos de exemplo em português
const SAMPLE_PARAGRAPHS = [
  'Era uma vez, em uma terra distante, onde as montanhas tocavam o céu e os rios corriam cristalinos, vivia um povo conhecido por sua sabedoria ancestral. Eles guardavam segredos milenares que eram passados de geração em geração através de histórias contadas ao redor das fogueiras.',
  'O conhecimento é a chave que abre as portas do entendimento. Através dos séculos, filósofos e pensadores dedicaram suas vidas à busca da verdade, explorando os mistérios do universo e da condição humana. Cada descoberta nos aproxima um pouco mais da essência do que significa ser.',
  'As estrelas sempre fascinaram a humanidade. Desde os primeiros observadores do céu até os modernos astrônomos, olhamos para cima em busca de respostas. O cosmos guarda segredos incontáveis, e cada nova descoberta revela quão vasto e maravilhoso é o universo em que vivemos.',
  'A natureza nos ensina lições valiosas sobre resiliência e adaptação. As árvores que dobram com o vento mas não quebram, os rios que encontram seu caminho ao redor dos obstáculos, e as sementes que permanecem dormentes até que as condições sejam favoráveis para germinar.',
  'Em cada esquina da cidade, histórias se entrelaçam formando a tapeçaria da vida urbana. Pessoas de diferentes origens e culturas compartilham o mesmo espaço, criando uma diversidade rica que define a experiência moderna de viver em comunidade.',
  'A tecnologia transformou radicalmente a forma como nos comunicamos e interagimos com o mundo. O que antes levava semanas ou meses para atravessar continentes, agora acontece em frações de segundo. Vivemos em uma era de conectividade sem precedentes.',
  'Os oceanos cobrem a maior parte do nosso planeta, guardando mistérios que ainda estamos apenas começando a compreender. Nas profundezas marinhas, existem criaturas fascinantes e ecossistemas complexos que desafiam nossa imaginação e expandem nosso conhecimento sobre a vida.',
  'A arte é uma expressão fundamental da experiência humana. Através da pintura, música, dança e literatura, comunicamos emoções e ideias que transcendem as barreiras da linguagem. Cada obra de arte é uma janela para a alma do artista e um espelho para quem a contempla.',
  'O tempo é uma dimensão misteriosa que permeia toda a nossa existência. Fluindo constantemente em uma única direção, ele molda nossas experiências e memórias. Cada momento é único e irrepetível, tornando cada instante precioso e significativo.',
  'A educação é a ferramenta mais poderosa para transformar vidas e sociedades. Através do aprendizado, expandimos nossos horizontes, desenvolvemos pensamento crítico e adquirimos as habilidades necessárias para contribuir positivamente para o mundo ao nosso redor.',
  'As florestas são os pulmões do nosso planeta, abrigando uma biodiversidade incrível. Cada árvore, cada planta e cada criatura desempenha um papel vital no equilíbrio do ecossistema. Preservar essas áreas verdes é essencial para o futuro da vida na Terra.',
  'A amizade é um dos tesouros mais valiosos da vida humana. Através das conexões genuínas que formamos com outros, encontramos apoio, alegria e significado. Os verdadeiros amigos estão presentes nos momentos bons e ruins, compartilhando o peso das dificuldades e a leveza das celebrações.',
  'A curiosidade é o motor que impulsiona o progresso humano. Desde a infância até a idade avançada, a vontade de explorar, questionar e descobrir nos mantém engajados com o mundo. Cada pergunta que fazemos é uma oportunidade de aprendizado e crescimento.',
  'As tradições culturais conectam gerações, preservando a identidade e os valores de um povo. Através de rituais, festividades e práticas cotidianas, mantemos viva a memória coletiva e transmitimos o legado de nossos ancestrais para as futuras gerações.',
  'A música tem o poder único de tocar a alma humana de maneiras que as palavras não conseguem. Uma melodia pode evocar memórias esquecidas, despertar emoções profundas e criar conexões entre pessoas de culturas completamente diferentes.',
];

const CHAPTER_TITLES = [
  'O Despertar',
  'Caminhos Desconhecidos',
  'Além do Horizonte',
  'Segredos Revelados',
  'O Encontro',
  'Tempestade e Calmaria',
  'A Jornada Interior',
  'Novas Perspectivas',
  'O Legado',
  'Recomeços',
];

const CHAPTER_SUBTITLES = [
  'Uma nova era começa',
  'Explorando territórios inexplorados',
  'Buscando o desconhecido',
  'Verdades há muito escondidas',
  'Quando destinos se cruzam',
  'Entre conflitos e paz',
  'Descobrindo a essência',
  'Mudando o ponto de vista',
  'O que deixamos para trás',
  'Novos começos',
];

const DOCUMENT_TITLES = [
  'Crônicas da Sabedoria Antiga',
  'Reflexões Sobre o Conhecimento',
  'Jornadas e Descobertas',
  'Memórias de Um Mundo em Transformação',
];

const DOCUMENT_SUBTITLES = [
  'Uma compilação de histórias atemporais',
  'Ensaios sobre a busca pelo entendimento',
  'Explorações através do tempo e espaço',
  'Testemunhos de uma era de mudanças',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function seedDatabase() {
  // Verificação de segurança: não permitir em produção
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERRO: Este script não pode ser executado em produção!');
    process.exit(1);
  }

  console.log('🌱 Script de seed do banco de dados');
  console.log(`📦 Banco de dados: ${DB_NAME}`);
  console.log('📝 Será criado:');
  console.log('   - 2 documentos');
  console.log('   - 5 capítulos por documento (10 no total)');
  console.log('   - 10 parágrafos por capítulo (100 no total)\n');

  // Solicitar confirmação do usuário
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // const answer = await new Promise<string>((resolve) => {
  //   rl.question('Deseja continuar? Digite "SIM" para confirmar: ', resolve);
  // });

  rl.close();

  // if (answer !== 'SIM') {
  //   console.log('❌ Operação cancelada.');
  //   process.exit(0);
  // }

  let client: MongoClient | null = null;

  try {
    console.log('\n🔌 Conectando ao MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    console.log('✅ Conectado com sucesso!\n');

    const documentsCollection = db.collection('documents');
    const chaptersCollection = db.collection('chapters');
    const paragraphsCollection = db.collection('paragraphs');

    // Embaralhar os títulos e legendas disponíveis
    const shuffledDocTitles = shuffleArray(DOCUMENT_TITLES);
    const shuffledDocSubtitles = shuffleArray(DOCUMENT_SUBTITLES);

    let totalChapters = 0;
    let totalParagraphs = 0;

    // Criar 2 documentos
    for (let docIndex = 0; docIndex < 2; docIndex++) {
      const now = new Date();
      const docTitle = shuffledDocTitles[docIndex];
      const docSubtitle = shuffledDocSubtitles[docIndex];
      
      const document = {
        title: docTitle,
        slug: generateSlug(docTitle),
        subtitle: docSubtitle,
        author: 'Editor Demo',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        version: 1,
        fontClass: 'font-serif',
        tags: ['exemplo', 'demo', 'seed'],
        status: 'draft' as const,
      };

      const docResult = await documentsCollection.insertOne(document);
      const documentId = docResult.insertedId.toString();
      
      console.log(`📄 Documento criado: "${docTitle}" (ID: ${documentId})`);

      // Criar 5 capítulos para este documento
      const shuffledChapterTitles = shuffleArray(CHAPTER_TITLES).slice(0, 5);
      const shuffledChapterSubtitles = shuffleArray(CHAPTER_SUBTITLES).slice(0, 5);

      for (let chapIndex = 0; chapIndex < 5; chapIndex++) {
        const chapter = {
          documentId,
          index: chapIndex,
          title: shuffledChapterTitles[chapIndex],
          subtitle: shuffledChapterSubtitles[chapIndex],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          version: 1,
          wordCount: 0, // Será atualizado depois
        };

        const chapResult = await chaptersCollection.insertOne(chapter);
        const chapterId = chapResult.insertedId.toString();
        totalChapters++;
        
        console.log(`  📖 Capítulo ${chapIndex + 1}: "${chapter.title}"`);

        // Criar 10 parágrafos para este capítulo
        const shuffledParagraphs = shuffleArray(SAMPLE_PARAGRAPHS).slice(0, 10);
        let chapterWordCount = 0;

        for (let paraIndex = 0; paraIndex < 10; paraIndex++) {
          const text = paraIndex + ' -- ' + shuffledParagraphs[paraIndex];
          const wordCount = countWords(text);
          chapterWordCount += wordCount;

          const paragraph = {
            documentId,
            chapterId,
            index: paraIndex,
            text,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            version: 1,
            characterCount: text.length,
            wordCount,
            isQuote: Math.random() > 0.8, // 20% de chance de ser citação
            isHighlighted: Math.random() > 0.9, // 10% de chance de ser destacado
            textAlignment: 'text-justify' as const,
          };

          await paragraphsCollection.insertOne(paragraph);
          totalParagraphs++;
        }

        // Atualizar contagem de palavras do capítulo
        await chaptersCollection.updateOne(
          { _id: new ObjectId(chapterId) },
          { $set: { wordCount: chapterWordCount } }
        );

        console.log(`    ✏️  ${shuffledParagraphs.length} parágrafos criados (${chapterWordCount} palavras)`);
      }

      console.log('');
    }

    console.log('✅ Seed concluído com sucesso!');
    console.log(`\n📊 Resumo:`);
    console.log(`   - 2 documentos criados`);
    console.log(`   - ${totalChapters} capítulos criados`);
    console.log(`   - ${totalParagraphs} parágrafos criados`);
    
  } catch (error) {
    console.error('❌ Erro ao popular o banco de dados:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

// Executar o script
seedDatabase().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
