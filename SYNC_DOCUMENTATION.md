# Sistema de Sincronização - Editor de Texto

## Visão Geral

Este sistema implementa sincronização automática entre o cliente (navegador) e o servidor MongoDB, com suporte para operação offline através do IndexedDB.

## Arquitetura

### Componentes Principais

1. **IndexedDB (`lib/indexedDB.ts`)**: Banco de dados local no navegador
   - Armazena documentos, capítulos e parágrafos
   - Mantém uma fila de sincronização com itens pendentes
   - Funciona mesmo quando offline

2. **Hook de Sincronização (`hooks/useSync.ts`)**: Gerencia a sincronização
   - Salva dados no IndexedDB imediatamente
   - Adiciona itens à fila de sincronização
   - Processa a fila quando online
   - Suporta sincronização manual (Ctrl+S)

3. **Hook de Status Online (`hooks/useOnlineStatus.ts`)**: Detecta conexão
   - Monitora eventos online/offline do navegador
   - Dispara sincronização automática ao retornar online

4. **Indicador Visual (`components/editor/SyncIndicator.tsx`)**: Feedback discreto
   - Mostra status de sincronização durante edição
   - Indica quando está offline
   - Desaparece quando sincronizado

## Fluxo de Funcionamento

### Edição de Conteúdo

1. **Usuário inicia edição**: Clica em título, subtítulo ou parágrafo
2. **Atualização local**: A cada caractere digitado:
   - Estado local é atualizado imediatamente (UI responsiva)
   - Dados são salvos no IndexedDB (debounce de 500ms)
   - Item é adicionado à fila de sincronização
   - Indicador mostra "Salvando..."

3. **Ao perder foco (blur)**:
   - Sincronização imediata é disparada
   - Se online: envia para MongoDB em segundo plano
   - Se offline: permanece na fila do IndexedDB

### Sincronização

#### Automática
- **Durante edição**: Após 500ms sem alterações
- **Ao perder foco**: Imediatamente ao sair do campo
- **Ao retornar online**: Todos os itens pendentes são sincronizados

#### Manual (Ctrl+S)
- Processa toda a fila de sincronização imediatamente
- Útil para garantir que tudo foi salvo

### Modo Offline

1. **Detecção**: Hook `useOnlineStatus` monitora `navigator.onLine`
2. **Comportamento**:
   - Continua salvando localmente no IndexedDB
   - Acumula itens na fila de sincronização
   - Indicador mostra "Offline"
   - Mensagem global indica quantos itens estão pendentes

3. **Retorno Online**:
   - Detecta mudança de status automaticamente
   - Processa toda a fila de sincronização
   - Atualiza MongoDB com todas as alterações pendentes

## Estrutura do IndexedDB

### Object Stores

1. **documents**: Documentos principais
2. **chapters**: Capítulos dos documentos
3. **paragraphs**: Parágrafos dos capítulos
4. **syncQueue**: Fila de sincronização

### Item da Fila de Sincronização

```typescript
{
  id: string;              // ID único do item na fila
  type: 'document' | 'chapter' | 'paragraph';
  action: 'create' | 'update' | 'delete';
  data: any;               // Dados completos do item
  timestamp: number;       // Quando foi criado
  retryCount: number;      // Tentativas de sincronização
}
```

## APIs MongoDB

### Documentos (`/api/documents`)
- **POST**: Criar novo documento
- **PUT**: Atualizar documento existente

### Capítulos (`/api/chapters`)
- **POST**: Criar novo capítulo
- **PUT**: Atualizar capítulo existente

### Parágrafos (`/api/paragraphs`)
- **POST**: Criar novo parágrafo
- **PUT**: Atualizar parágrafo existente

## Tratamento de Erros

### Retry Logic
- Máximo de 3 tentativas por item
- Após 3 falhas, item é removido da fila
- Erros são logados no console

### IDs Temporários
- Novos itens recebem IDs temporários: `temp-{timestamp}`
- Durante sincronização, são convertidos para ObjectIds do MongoDB
- APIs detectam IDs temporários e fazem POST em vez de PUT

## Uso nos Componentes

### Title Component

```tsx
<Title
  title={title}
  subtitle={subtitle}
  documentId={documentId}
  chapterId={chapterId}  // Opcional, para capítulos
  onRemoteSync={handleSync}    // Callback de sincronização
  isOnline={isOnline}    // Status de conexão
/>
```

### Paragraph Component

```tsx
<Paragraph
  id={id}
  documentId={documentId}
  chapterId={chapterId}
  text={text}
  onRemoteSync={handleSync}
  isOnline={isOnline}
/>
```

### Editor Client

```tsx
const { saveAndSync, manualSync, isOnline, syncStatus } = useSync();

// Criar handlers
const handleDocumentSync = (data, isNew) => {
  saveAndSync('document', data, isNew);
};

// Ctrl+S para sincronização manual
useEffect(() => {
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      manualSync();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [manualSync]);
```

## Boas Práticas

1. **Sempre use os callbacks de sync**: Não faça requisições diretas à API
2. **Confie no debounce**: O sistema já otimiza as chamadas
3. **Não bloqueie a UI**: Toda sincronização é em segundo plano
4. **Monitore syncStatus**: Use para feedback ao usuário
5. **Teste offline**: Simule perda de conexão no DevTools

## Debugging

### Console Logs
- "Connection restored, syncing...": Voltou online
- "Error syncing item": Falha na sincronização
- "Item removed after max retries": Item removido após 3 tentativas

### DevTools
- **Application > IndexedDB > EditorDB**: Ver dados locais
- **Network > Offline**: Simular modo offline
- **Console**: Logs de sincronização

## Performance

- **Debounce**: 500ms reduz chamadas durante digitação rápida
- **Background sync**: Não bloqueia a interface
- **Batch processing**: Fila processa múltiplos itens em sequência
- **IndexedDB**: Acesso rápido ao storage local
