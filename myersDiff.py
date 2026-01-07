from typing import List, Tuple, Dict

DiffOperation = Tuple[str, int, str]


class DiffNormalizer:
    """Normaliza operações de diff, mesclando operações consecutivas e detectando atualizações."""
    
    @staticmethod
    def normalize(diff_result: List[DiffOperation]) -> List[DiffOperation]:
        """
        Normaliza uma lista de operações de diff.
        
        Args:
            diff_result: Lista de tuplas (operação, posição, caractere)
            
        Returns:
            Lista normalizada de operações de diff
        """
        diff_normalize = list(diff_result)
        
        # Mescla inserções e deleções consecutivas
        DiffNormalizer._merge_consecutive_operations(diff_normalize)
        
        # Detecta atualizações (delete+insert ou insert+delete)
        DiffNormalizer._merge_deletes_and_inserts_as_updates(diff_normalize)
        
        # Mescla atualizações consecutivas
        DiffNormalizer._merge_consecutive_operations(diff_normalize)
        
        return diff_normalize
    
    @staticmethod
    def _merge_consecutive_operations(diff_normalize: List[DiffOperation]) -> None:
        """Mescla operações consecutivas do mesmo tipo e posição adjacente."""
        if len(diff_normalize) <= 1:
            return
        
        index = 0
        while index < len(diff_normalize) - 1:
            op_0, pos_0, char_0 = diff_normalize[index]
            op_1, pos_1, char_1 = diff_normalize[index + 1]
            next_index = pos_0 + len(char_0)
            
            if op_0 == op_1 and next_index == pos_1:
                diff_normalize[index] = (op_0, pos_0, char_0 + char_1)
                del diff_normalize[index + 1]
            else:
                index += 1
    
    @staticmethod
    def _merge_deletes_and_inserts_as_updates(diff_normalize: List[DiffOperation]) -> None:
        """Converte pares delete+insert ou insert+delete em operações de update."""
        if len(diff_normalize) <= 1:
            return
        
        index = 0
        while index < len(diff_normalize) - 1:
            op_0, pos_0, char_0 = diff_normalize[index]
            op_1, pos_1, char_1 = diff_normalize[index + 1]
            next_pos = pos_0 + len(char_0)
            
            # Delete seguido de insert na mesma posição
            if op_0 == 'd' and op_1 == 'i' and next_pos == pos_1:
                diff_normalize[index] = ('u', pos_0, char_1)
                del diff_normalize[index + 1]
            # Insert seguido de delete na mesma posição
            elif op_0 == 'i' and op_1 == 'd' and next_pos == pos_1:
                diff_normalize[index] = ('u', pos_0, char_0)
                del diff_normalize[index + 1]
            else:
                index += 1


class MyersDiff:
    """
    Implementa o algoritmo de Myers para calcular o diff entre duas strings.
    
    O algoritmo de Myers é eficiente para encontrar a menor sequência de edições
    (inserções e deleções) necessárias para transformar uma string em outra.
    """
    
    def __init__(self, original: str, modified: str):
        """
        Inicializa o calculador de diff.
        
        Args:
            original: String original
            modified: String modificada
        """
        self.original = original
        self.modified = modified
        self.n = len(original)
        self.m = len(modified)
        self.max_d = self.n + self.m
        self.v: Dict[int, int] = {1: 0}
        self.trace: List[Dict[int, int]] = []
    
    def compute(self) -> List[DiffOperation]:
        """
        Calcula o diff entre as duas strings.
        
        Returns:
            Lista de tuplas (operação, posição, caractere) onde operação é 'd' (delete), 
            'i' (insert) ou 'u' (update)
        """
        self._find_middle_snake()
        diff_result = self._backtrack()
        diff_result.sort(key=lambda item: item[1])
        return DiffNormalizer.normalize(diff_result)
    
    def _find_middle_snake(self) -> int:
        """
        Encontra a 'snake' do meio usando o algoritmo de Myers.
        
        Returns:
            Número mínimo de edições necessárias
        """
        for d in range(self.max_d + 1):
            self.trace.append(self.v.copy())
            
            for k in range(-d, d + 1, 2):
                # Determina se devemos mover para baixo ou para a direita
                if k == -d or (k != d and self.v.get(k - 1, -1) < self.v.get(k + 1, -1)):
                    x = self.v.get(k + 1, 0)
                else:
                    x = self.v.get(k - 1, 0) + 1
                
                y = x - k
                
                # Segue a diagonal (snake) enquanto os caracteres são iguais
                while x < self.n and y < self.m and self.original[x] == self.modified[y]:
                    x += 1
                    y += 1
                
                self.v[k] = x
                
                # Se chegamos ao fim, encontramos o caminho mais curto
                if x >= self.n and y >= self.m:
                    return d
        
        return self.max_d
    
    def _backtrack(self) -> List[DiffOperation]:
        """
        Reconstrói o caminho de edição a partir do trace.
        
        Returns:
            Lista de operações de diff
        """
        x, y = self.n, self.m
        result = []
        
        for d in range(len(self.trace) - 1, -1, -1):
            v_prev = self.trace[d]
            k = x - y
            
            if k == -d or (k != d and v_prev.get(k - 1, -1) < v_prev.get(k + 1, -1)):
                prev_k = k + 1
            else:
                prev_k = k - 1
            
            prev_x = v_prev.get(prev_k, 0)
            prev_y = prev_x - prev_k
            
            # Snake (diagonal moves - caracteres iguais)
            while x > prev_x and y > prev_y:
                x -= 1
                y -= 1
            
            # Determina se foi uma inserção ou deleção
            if d > 0:
                if x == prev_x:
                    # Movimento vertical = inserção
                    y -= 1
                    result.append(('i', y, self.modified[y]))
                else:
                    # Movimento horizontal = deleção
                    x -= 1
                    result.append(('d', x, self.original[x]))
        
        return list(reversed(result))


class DiffFormatter:
    """Formata resultados de diff em diferentes formatos de saída."""
    
    @staticmethod
    def to_csv(diff_result: List[DiffOperation]) -> str:
        """
        Converte operações de diff para formato CSV.
        
        Args:
            diff_result: Lista de operações de diff
            
        Returns:
            String formatada como CSV
        """
        output = ["op,pos,item"]
        
        for op, pos, char in diff_result:
            if op == 'd':
                output.append(f"-,{pos},{len(char)}")
            elif op == 'i':
                output.append(f"+,{pos},'{char}'")
            else:  # update
                output.append(f"~,{pos},'{char}'")
        
        return '\n'.join(output)


def myers_diff(a: str, b: str) -> List[DiffOperation]:
    """
    Função de conveniência para calcular o diff entre duas strings.
    
    Args:
        a: String original
        b: String modificada
        
    Returns:
        Lista de tuplas (operação, posição, caractere)
    """
    differ = MyersDiff(a, b)
    return differ.compute()

if __name__ == '__main__':
    str_a = "123456"
    str_b = "789878"
    
    result = myers_diff(str_a, str_b)
    print(DiffFormatter.to_csv(result))