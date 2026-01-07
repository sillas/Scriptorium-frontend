type DiffOperation = {
  op: 'd' | 'i' | 'u';
  pos: number;
  char: string;
};

/**
 * Normaliza operações de diff, mesclando operações consecutivas e detectando atualizações.
 */
class DiffNormalizer {
  /**
   * Normaliza uma lista de operações de diff.
   */
  static normalize(diffResult: DiffOperation[]): DiffOperation[] {
    const diffNormalize = [...diffResult];
    
    // Mescla inserções e deleções consecutivas
    this.mergeConsecutiveOperations(diffNormalize);
    
    // Detecta atualizações (delete+insert ou insert+delete)
    this.mergeDeletesAndInsertsAsUpdates(diffNormalize);
    
    // Mescla atualizações consecutivas
    this.mergeConsecutiveOperations(diffNormalize);
    
    return diffNormalize;
  }
  
  /**
   * Mescla operações consecutivas do mesmo tipo e posição adjacente.
   */
  private static mergeConsecutiveOperations(diffNormalize: DiffOperation[]): void {
    if (diffNormalize.length <= 1) {
      return;
    }
    
    let index = 0;
    while (index < diffNormalize.length - 1) {
      const { op: op0, pos: pos0, char: char0 } = diffNormalize[index];
      const { op: op1, pos: pos1, char: char1 } = diffNormalize[index + 1];
      const nextIndex = pos0 + char0.length;
      
      if (op0 === op1 && nextIndex === pos1) {
        diffNormalize[index] = { op: op0, pos: pos0, char: char0 + char1 };
        diffNormalize.splice(index + 1, 1);
      } else {
        index++;
      }
    }
  }
  
  /**
   * Converte pares delete+insert ou insert+delete em operações de update.
   */
  private static mergeDeletesAndInsertsAsUpdates(diffNormalize: DiffOperation[]): void {
    if (diffNormalize.length <= 1) {
      return;
    }
    
    let index = 0;
    while (index < diffNormalize.length - 1) {
      const { op: op0, pos: pos0, char: char0 } = diffNormalize[index];
      const { op: op1, pos: pos1, char: char1 } = diffNormalize[index + 1];
      const nextPos = pos0 + char0.length;
      
      // Delete seguido de insert na mesma posição
      if (op0 === 'd' && op1 === 'i' && nextPos === pos1) {
        diffNormalize[index] = { op: 'u', pos: pos0, char: char1 };
        diffNormalize.splice(index + 1, 1);
      }
      // Insert seguido de delete na mesma posição
      else if (op0 === 'i' && op1 === 'd' && nextPos === pos1) {
        diffNormalize[index] = { op: 'u', pos: pos0, char: char0 };
        diffNormalize.splice(index + 1, 1);
      } else {
        index++;
      }
    }
  }
}

/**
 * Implementa o algoritmo de Myers para calcular o diff entre duas strings.
 * 
 * O algoritmo de Myers é eficiente para encontrar a menor sequência de edições
 * (inserções e deleções) necessárias para transformar uma string em outra.
 */
class MyersDiff {
  private original: string;
  private modified: string;
  private n: number;
  private m: number;
  private maxD: number;
  private v: Map<number, number>;
  private trace: Map<number, number>[];
  
  /**
   * Inicializa o calculador de diff.
   */
  constructor(original: string, modified: string) {
    this.original = original;
    this.modified = modified;
    this.n = original.length;
    this.m = modified.length;
    this.maxD = this.n + this.m;
    this.v = new Map([[1, 0]]);
    this.trace = [];
  }
  
  /**
   * Calcula o diff entre as duas strings.
   * 
   * @returns Lista de operações onde operação é 'd' (delete), 'i' (insert) ou 'u' (update)
   */
  compute(): DiffOperation[] {
    this.findMiddleSnake();
    const diffResult = this.backtrack();
    diffResult.sort((a, b) => a.pos - b.pos);
    return DiffNormalizer.normalize(diffResult);
  }
  
  /**
   * Encontra a 'snake' do meio usando o algoritmo de Myers.
   * 
   * @returns Número mínimo de edições necessárias
   */
  private findMiddleSnake(): number {
    for (let d = 0; d <= this.maxD; d++) {
      this.trace.push(new Map(this.v));
      
      for (let k = -d; k <= d; k += 2) {
        // Determina se devemos mover para baixo ou para a direita
        let x: number;
        if (k === -d || (k !== d && (this.v.get(k - 1) ?? -1) < (this.v.get(k + 1) ?? -1))) {
          x = this.v.get(k + 1) ?? 0;
        } else {
          x = (this.v.get(k - 1) ?? 0) + 1;
        }
        
        let y = x - k;
        
        // Segue a diagonal (snake) enquanto os caracteres são iguais
        while (x < this.n && y < this.m && this.original[x] === this.modified[y]) {
          x++;
          y++;
        }
        
        this.v.set(k, x);
        
        // Se chegamos ao fim, encontramos o caminho mais curto
        if (x >= this.n && y >= this.m) {
          return d;
        }
      }
    }
    
    return this.maxD;
  }
  
  /**
   * Reconstrói o caminho de edição a partir do trace.
   * 
   * @returns Lista de operações de diff
   */
  private backtrack(): DiffOperation[] {
    let x = this.n;
    let y = this.m;
    const result: DiffOperation[] = [];
    
    for (let d = this.trace.length - 1; d >= 0; d--) {
      const vPrev = this.trace[d];
      const k = x - y;
      
      let prevK: number;
      if (k === -d || (k !== d && (vPrev.get(k - 1) ?? -1) < (vPrev.get(k + 1) ?? -1))) {
        prevK = k + 1;
      } else {
        prevK = k - 1;
      }
      
      const prevX = vPrev.get(prevK) ?? 0;
      const prevY = prevX - prevK;
      
      // Snake (diagonal moves - caracteres iguais)
      while (x > prevX && y > prevY) {
        x--;
        y--;
      }
      
      // Determina se foi uma inserção ou deleção
      if (d > 0) {
        if (x === prevX) {
          // Movimento vertical = inserção
          y--;
          result.push({ op: 'i', pos: y, char: this.modified[y] });
        } else {
          // Movimento horizontal = deleção
          x--;
          result.push({ op: 'd', pos: x, char: this.original[x] });
        }
      }
    }
    
    return result.reverse();
  }
}

/**
 * Formata resultados de diff em diferentes formatos de saída.
 */
class DiffFormatter {
  /**
   * Converte operações de diff para formato CSV.
   */
  static toCsv(diffResult: DiffOperation[]): string {
    const output: string[] = ['op,pos,item'];
    
    for (const { op, pos, char } of diffResult) {
      if (op === 'd') {
        output.push(`-,${pos},${char.length}`);
      } else if (op === 'i') {
        output.push(`+,${pos},'${char}'`);
      } else {
        // update
        output.push(`~,${pos},'${char}'`);
      }
    }
    
    return output.join('\n');
  }
}

/**
 * Função de conveniência para calcular o diff entre duas strings.
 */
export function myersDiff(a: string, b: string): DiffOperation[] {
  const differ = new MyersDiff(a, b);
  return differ.compute();
}

// Exporta as classes para uso externo
export type { DiffOperation };
export { MyersDiff, DiffNormalizer, DiffFormatter };

// Exemplo de uso (descomente para executar)
// const strA = '123456';
// const strB = '789878';
// const result = myersDiff(strA, strB);
// console.log(DiffFormatter.toCsv(result));
