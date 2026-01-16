type DiffOperation = {
  op: 'd' | 'i';
  pos: number;
  item: string;
};

/**
 * Implementa o algoritmo de Myers para calcular o diff entre duas strings.
 */
class MyersDiff {
  private original: string[];
  private modified: string[];
  private n: number;
  private m: number;
  private maxDimension: number;
  private v: Map<number, number>; // Mapa de k para x (k = x - y) (x é a posição na original, y na modificada)
  private trace: Map<number, number>[]; // Armazena estados de v para backtracking
  
  /**
   * Inicializa o calculador de diff.
   */
  constructor(original: string[], modified: string[]) {
    this.original = original;
    this.modified = modified;
    this.n = original.length;
    this.m = modified.length;
    this.maxDimension = this.n + this.m;
    this.v = new Map([[1, 0]]);
    this.trace = []; 
  }
  
  /**
   * Calcula o diff entre as duas strings.
   * 
   * @returns Lista de operações onde operação é 'd' (delete) ou 'i' (insert)
   */
  compute(): DiffOperation[] {
    this.findMiddleSnake();
    const diffResult = this.backtrack();
    diffResult.sort((a, b) => a.pos - b.pos);
    return diffResult;
  }
  
  /**
   * Encontra a 'snake' do meio usando o algoritmo de Myers.
   * 
   * @returns Número mínimo de edições necessárias
   */
  private findMiddleSnake(): number {
    for (let d = 0; d <= this.maxDimension; d++) {
      this.trace.push(new Map(this.v));
      
      for (let k = -d; k <= d; k += 2) {
        // Determina se devemos mover para baixo ou para a direita
        let x: number;
        const k_d = this.v.get(k - 1);
        const k_u = this.v.get(k + 1);
        
        if (k === -d || (k !== d && (k_d ?? -1) < (k_u ?? -1))) {
          x = k_u ?? 0; // Mover para baixo
        } else {
          x = (k_d ?? 0) + 1; // Mover para a direita
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
    
    return this.maxDimension;
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
          result.push({ op: 'i', pos: y, item: this.modified[y] });
        } else {
          // Movimento horizontal = deleção
          x--;
          result.push({ op: 'd', pos: x, item: this.original[x] });
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

    if(diffResult.length === 0) {
      return ''; // Retorna string vazia se não houver diferenças
    }

    const output: string[] = ['op,pos,item'];
    
    for (const { op, pos, item } of diffResult) {
      if (op === 'd') {
        output.push(`-,${pos},'${item}'`);
      } else if (op === 'i') {
        output.push(`+,${pos},'${item}'`);
      }
    }
    
    return output.join('\n');
  }
}

/**
 * Função de conveniência para calcular o diff entre duas strings.
 */
export function myersDiff(a: string[], b: string[]): DiffOperation[] {
  const differ = new MyersDiff(a, b);
  return differ.compute();
}

export type { DiffOperation };
export { MyersDiff, DiffFormatter };
