# Hook de Sincronização em Background

Hook dedicado para sincronizar itens do IndexedDB com o MongoDB em background.

## Localização

`/hooks/editor/useSyncBackground.ts`

## Funcionalidades Implementadas

### `syncChapters()`

Sincroniza capítulos não sincronizados do IndexedDB para o MongoDB.

#### Fluxo de Execução

1. **Busca capítulos não sincronizados**: Obtém todos os capítulos com `sync=false` do IndexedDB
2. **Processa IDs temporários**: Se o ID começar com "temp-", remove o prefixo mantendo apenas o UUID
3. **Salva no MongoDB**: Usa POST para novos capítulos (temp-) ou PUT para atualizações
4. **Atualiza IndexedDB**: 
   - Remove registro antigo se o ID mudou (temp- → UUID)
   - Adiciona/atualiza registro com `sync=true`
5. **Retorna capítulos sincronizados**: Array para atualização do estado no componente

#### Uso no EditorClientSide

```typescript
const { syncChapters } = useSyncBackground();

// A função syncAll foi atualizada para usar o hook
const syncAll = useCallback(async (origin: string) => {
  console.log('Sync all items triggered from:', origin);
  
  // Sincronizar capítulos
  const syncedChapters = await syncChapters();
  
  // Atualizar estado com capítulos sincronizados
  if (syncedChapters.length > 0) {
    setLocalChapters(prevChapters => {
      const updatedChapters = [...prevChapters];
      
      syncedChapters.forEach(syncedChapter => {
        const index = updatedChapters.findIndex(ch => {
          // Buscar pelo ID antigo (temp-) ou novo
          return ch.id === syncedChapter.id || 
                 ch.id === `temp-${syncedChapter.id}`;
        });
        
        if (index !== -1) {
          updatedChapters[index] = syncedChapter;
        }
      });
      
      return updatedChapters;
    });
    
    console.log(`✅ Estado atualizado com ${syncedChapters.length} capítulo(s) sincronizado(s)`);
  }
}, [syncChapters]);
```

#### Características

- **Prevenção de duplicação**: Usa `isSyncingRef` para evitar múltiplas sincronizações simultâneas
- **Tratamento de erros**: Continua processando outros capítulos mesmo se um falhar
- **Logs detalhados**: Console logs informativos sobre o progresso da sincronização
- **Conversão de IDs**: Converte automaticamente IDs temporários para UUIDs permanentes

## Teste Manual

Para testar a sincronização:

1. **Criar um capítulo**: Adicione um novo capítulo no editor
   - O capítulo será criado com ID `temp-{uuid}`
   - Será salvo no IndexedDB com `sync: false`

2. **Acionar sincronização**: Clique no ícone de sincronização do capítulo
   - A função `syncAll('chapters')` será chamada
   - O hook `syncChapters()` processará o capítulo

3. **Verificar resultado**:
   - Abra o Console do navegador
   - Verifique os logs de sincronização
   - Confirme que o ID mudou de `temp-{uuid}` para `{uuid}`
   - Verifique no MongoDB que o capítulo foi salvo

4. **Verificar IndexedDB**:
   ```javascript
   // No console do navegador
   const db = await indexedDB.open('EditorDB', 1);
   // Inspecione a store 'chapters'
   ```

## Próximos Passos

- [ ] Implementar sincronização de parágrafos
- [ ] Atualizar `chapterId` nos parágrafos quando o capítulo é sincronizado
- [ ] Implementar sincronização automática em intervalos
- [ ] Adicionar retry logic para falhas de rede
- [ ] Implementar sincronização de documentos
- [ ] Adicionar indicador visual de sincronização em progresso

## API Endpoints Utilizados

### POST /api/chapters
Cria novo capítulo no MongoDB (para IDs temporários)

**Body:**
```json
{
  "id": "uuid-without-temp",
  "documentId": "string",
  "index": number,
  "title": "string",
  "subtitle": "string",
  "updatedAt": Date
}
```

**Response:**
```json
{
  "id": "mongodb-object-id",
  "message": "Capítulo criado com sucesso"
}
```

### PUT /api/chapters
Atualiza capítulo existente no MongoDB

**Body:**
```json
{
  "id": "uuid",
  "title": "string",
  "subtitle": "string",
  "updatedAt": Date
}
```

**Response:**
```json
{
  "message": "Capítulo atualizado com sucesso"
}
```
