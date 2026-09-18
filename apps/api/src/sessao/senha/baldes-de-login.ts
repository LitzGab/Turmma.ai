/**
 * Os baldes do semáforo do hash de senha (Tech Spec da identidade, seção 5, "Baldes do semáforo, sem revelar
 * existência"). O balde é resolvido antes do semáforo e nunca depende de a credencial existir:
 *
 * - **matrícula:** o balde da escola do endereço, exista a matrícula ou não;
 * - **endereço que não existe:** um balde próprio, `desconhecida` (o slug é público de qualquer jeito, em `/acesso`);
 * - **e-mail:** todo login por e-mail vai ao balde `equipe`, exista a conta ou não, e dentro dele a vez roda por IP.
 *
 * O semáforo atende os baldes em rodízio, e dentro de um balde as subfilas em rodízio: uma escola lotando o login não
 * atrasa outra, e um IP lotando o balde da equipe não atrasa a equipe que está atrás de outro IP.
 */
export interface BaldeDeLogin {
  /** A chave do balde no rodízio: o id da escola, `desconhecida` ou `equipe`. */
  readonly id: string
  /** A subfila dentro do balde: o IP na equipe; vazia nos baldes de escola, que têm uma fila só. */
  readonly subfila: string
  /** O valor do rótulo `escola_id` de `login.hash_espera`: nunca usuário, matrícula nem IP. */
  readonly rotulo: string
}

/** O rótulo e a chave do balde do login por e-mail. */
export const BALDE_EQUIPE = 'equipe'
/** O rótulo e a chave do balde do endereço de escola que não existe. */
export const BALDE_ESCOLA_DESCONHECIDA = 'desconhecida'

/** O balde do login por matrícula numa escola que existe. */
export function baldeDaEscola(escolaId: string): BaldeDeLogin {
  return { id: escolaId, subfila: '', rotulo: escolaId }
}

/** O balde do login por matrícula num endereço que não existe: um só, para todos esses endereços. */
export function baldeDaEscolaDesconhecida(): BaldeDeLogin {
  return { id: BALDE_ESCOLA_DESCONHECIDA, subfila: '', rotulo: BALDE_ESCOLA_DESCONHECIDA }
}

/** O balde do login por e-mail, com a vez rodando pelo IP de quem pede. O IP fica só na memória do semáforo. */
export function baldeDaEquipe(ip: string): BaldeDeLogin {
  return { id: BALDE_EQUIPE, subfila: ip, rotulo: BALDE_EQUIPE }
}
