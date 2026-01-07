from math import sqrt


def diff(p:str, n:str):
    
    pi = 0
    ni = 0

    len_p = len(p)
    len_n = len(n)

    sec_same = []
    ops = []

    while 1:

        if(pi >= len_p or ni >= len_n):
            break

        if(p[pi] == n[ni]):
            sec_same.append((pi, ni))
            pi+=1
            ni+=1
            continue
        
        if(pi+1 < len_p and ni+1 < len_n and p[pi+1] == n[ni+1]):
            ops.append(('swap', pi, 1, n[ni]))
            pi+=1
            ni+=1
            sec_same.append((pi, ni))
            continue

        dists = []
        min_y = len_n
        for i in range(pi, len_p):
            for j in range(ni, min_y):
                if(p[i] == n[j]):
                    
                    if(j < min_y):
                        min_y = j

                    sec_same.append((i, j))

                    di = i - pi
                    dj = j - ni
                    dist = sqrt((di*di) + (dj*dj))
                    dists.append((di, dj, i, j, dist))
                    break
        
        if(not dists):
            # Não encontrou mais caracteres iguais - trata o resto das strings
            remaining_p = len_p - pi
            remaining_n = len_n - ni
            
            if remaining_p > 0 and remaining_n > 0:
                ops.append(('swap', pi, remaining_n, n[ni:]))
            elif remaining_n > 0:
                ops.append(('add', pi, remaining_n, n[ni:]))
            elif remaining_p > 0:
                ops.append(('rem', pi, remaining_p))
            
            # Atualiza os índices para evitar processamento duplo
            pi = len_p
            ni = len_n
            break

        # find the short distance
        min_dist = (-1, -1, -1, -1, len_p + len_n) # start.
        for d in dists:
            if(d[4] < min_dist[4]):
                min_dist = d
        
        if(min_dist[0] < min_dist[1]):
            ops.append(('add', pi, len(n[ni:min_dist[3]]), n[ni:min_dist[3]]))

        elif(min_dist[0] > min_dist[1]):
            ops.append(('rem', pi, min_dist[2] - pi))

        else:
            ops.append(('swap', pi, len(n[ni:min_dist[3]]), n[ni:min_dist[3]]))
        
        pi = min_dist[2] + 1
        ni = min_dist[3] + 1
    
    # Trata caracteres restantes após o loop
    if pi < len_p:
        ops.append(('rem', pi, len_p - pi))
    elif ni < len_n:
        ops.append(('add', pi, len_n - ni, n[ni:]))

    return ops

if __name__ == '__main__':

    str_a = "de e conflitos"
    str_b = "d e conflitos"

    result = diff(str_a, str_b)
    print(result)
