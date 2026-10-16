import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Botao, CampoSenha, Dialogo } from '@/components/duo'
import { convites, professoresDaEscola } from '@/dados/escola-estado'
import { operacao } from '@/dados/rede'
import { introducaoVista, sessao } from '@/dados/sessao'
import { CascaPublica, SeloCerto, Titulo, classeDoLink, useHashUmaVez, useTituloDaAba } from './_casca'

/* O ACEITE DO CONVITE (`/convite#token`). A coordenação (ou a Turmma) copiou o link, que aparece uma vez só, e mandou
   à pessoa. O token vem depois do `#` e sai da barra ao abrir, para não ficar no histórico.
   · PROFESSOR (`#token`): os dados vêm do convite no estado (`convites.doToken`): a disciplina e o e-mail. Conta nova:
     CRIAR SENHA E ENTRAR → `convites.aceitar` → a sessão vira a do professor → /professor/bem-vindo (a introdução, que
     confirma a turma; D3), ou /professor se ele já viu a introdução. Quem já tem conta (`?conta=existente`, ou a Camila, que já dá aula no Aurora): ACEITAR E ENTRAR;
   · COORDENAÇÃO (`?papel=coordenacao#token`): "A Turmma convidou você para coordenar…" → a senha → o segundo fator da
     primeira vez (/entrar/verificacao?primeira=1). O convite de uma escola criada na operação termina em "Conta
     criada" e não entra no Aurora (a montagem daquela escola é outra história);
   · vencido, revogado, já usado ou incompleto: "Este convite não vale mais. Peça um novo à coordenação."
   A linha "Seus dados" informa o titular (LGPD, art. 9º — lei), com o aviso de privacidade num diálogo. */

const TOKEN_DA_COORDENACAO_AURORA = 'hm-aurora'

type Convite =
  | { tipo: 'invalido'; coordenacao: boolean }
  | { tipo: 'professor'; token: string; profId: string; disciplina: string; email: string; existente: boolean }
  | { tipo: 'coordenacao'; escola: string; email?: string; aurora: boolean }

function lerConvite(token: string, papel: string | null, contaExistente: boolean): Convite {
  if (papel === 'coordenacao') {
    if (token === TOKEN_DA_COORDENACAO_AURORA) return { tipo: 'coordenacao', escola: 'Colégio Aurora', email: 'helena.martins@colegioaurora.example', aurora: true }
    const criada = token ? operacao.escolaDoConvite(token) : undefined
    return criada ? { tipo: 'coordenacao', escola: criada.nome, aurora: false } : { tipo: 'invalido', coordenacao: true }
  }
  const c = token ? convites.doToken(token) : null
  if (!c || c.estado === 'vencido' || c.estado === 'revogado') return { tipo: 'invalido', coordenacao: false }
  return { tipo: 'professor', token, profId: c.profId, disciplina: c.disciplina, email: c.email, existente: contaExistente || c.estado === 'aceito' }
}

export function AceitarConvite() {
  const local = useLocation()
  const navegar = useNavigate()
  const token = useHashUmaVez()
  const busca = new URLSearchParams(local.search)
  // Lido uma vez, ao abrir: aceitar muda o estado do convite e a tela não deve trocar no meio.
  const [convite] = useState(() => lerConvite(token, busca.get('papel'), busca.get('conta') === 'existente'))
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [privacidade, setPrivacidade] = useState(false)
  const [criada, setCriada] = useState(false)
  useTituloDaAba(convite.tipo === 'coordenacao' && !convite.aurora ? `Convite · ${convite.escola}` : 'Convite · Colégio Aurora')

  if (convite.tipo === 'invalido') {
    return (
      <CascaPublica>
        <div className="animate-entra">
          <Titulo titulo="Este convite não vale mais." linha={convite.coordenacao ? 'Peça um novo à Turmma.' : 'Peça um novo à coordenação.'} />
          <p className="t-apoio mt-8">Já tem senha? <Link to="/entrar?quem=equipe" className={classeDoLink}>Entrar</Link></p>
        </div>
      </CascaPublica>
    )
  }

  if (criada) {
    return (
      <CascaPublica>
        <div className="animate-entra">
          <SeloCerto />
          <Titulo titulo="Conta criada." linha="A montagem começa no próximo acesso." />
          <Botao largura="cheia" className="mt-7" onClick={() => navegar('/entrar?quem=equipe')}>Entrar</Botao>
        </div>
      </CascaPublica>
    )
  }

  const senhaBoa = () => {
    if (senha.length >= 8) return true
    setErro(senha ? 'Use 8 ou mais letras ou números.' : 'Crie uma senha.')
    return false
  }

  const entrarComoProfessor = (profId: string) => {
    const p = professoresDaEscola().find((x) => x.id === profId)
    const sessaoId = p?.sessaoId ?? 'camila'
    sessao.entrarComoProfessor(sessaoId)
    // a primeira vez, a introdução do professor (13ª rodada); quem já viu vai direto ao Início
    navegar(introducaoVista('professor', sessaoId) ? '/professor' : '/professor/bem-vindo')
  }

  const aceitar = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (convite.tipo === 'professor') {
      if (convite.existente) {
        // a Camila já está ativa: só entra; um convite em aberto de quem tem conta noutra escola é aceito aqui
        const id = convites.doToken(convite.token)?.estado === 'valido' ? convites.aceitar(convite.token, '') : convite.profId
        entrarComoProfessor(id ?? convite.profId)
        return
      }
      if (!senhaBoa()) return
      const id = convites.aceitar(convite.token, senha)
      if (!id) { setErro('Este convite não vale mais. Peça um novo à coordenação.'); return }
      entrarComoProfessor(id)
      return
    }
    if (!senhaBoa()) return
    if (convite.aurora) navegar('/entrar/verificacao?primeira=1&para=/coordenacao')
    else setCriada(true)
  }

  const titulo = convite.tipo === 'professor'
    ? `A coordenação do Colégio Aurora convidou você para dar aula de ${convite.disciplina}.`
    : `A Turmma convidou você para coordenar ${convite.aurora ? 'o' : 'a'} ${convite.escola}.`
  const email = convite.email
  const soAceitar = convite.tipo === 'professor' && convite.existente

  return (
    <CascaPublica rodape={convite.tipo === 'coordenacao' && !convite.aurora ? `${convite.escola} · Joinville · SC` : 'Colégio Aurora · Joinville · SC'}>
      <div className="animate-entra">
        <Titulo titulo={titulo} linha={email || undefined} />

        <p className="t-apoio mt-4">
          Seus dados: nome e e-mail, para a escola.{' '}
          <button type="button" className={classeDoLink} onClick={() => setPrivacidade(true)}>Como usamos</button>
        </p>

        {soAceitar ? (
          <Botao largura="cheia" className="mt-7" onClick={() => aceitar()}>Aceitar e entrar</Botao>
        ) : (
          <form className="mt-6 grid gap-5" onSubmit={aceitar} noValidate>
            <CampoSenha rotulo="Crie uma senha" valor={senha} autoComplete="new-password" autoFocus erro={erro}
              dica="8 ou mais letras ou números." aoMudar={(v) => { setSenha(v); setErro('') }} />
            <Botao type="submit" largura="cheia">{convite.tipo === 'professor' ? 'Criar senha e entrar' : 'Criar senha'}</Botao>
          </form>
        )}
      </div>

      <Dialogo aberto={privacidade} aoMudar={setPrivacidade} titulo="Como usamos seus dados" largura={460}
        rodape={<Botao variante="secundario" onClick={() => setPrivacidade(false)}>Entendi</Botao>}>
        <ul className="t-corpo grid gap-3 text-apoio">
          <li><b className="text-tinta">Quem cuida:</b> {convite.tipo === 'coordenacao' && !convite.aurora ? 'a escola' : 'o Colégio Aurora'}. A Turmma opera para a escola.</li>
          <li><b className="text-tinta">O que guardamos:</b> nome, e-mail, turmas e o que você aprova.</li>
          <li><b className="text-tinta">Para quê:</b> você entrar e a escola saber quem aprovou cada coisa.</li>
          <li><b className="text-tinta">Não treina IA.</b> Você pode pedir para ver, corrigir ou apagar seus dados.</li>
        </ul>
      </Dialogo>
    </CascaPublica>
  )
}
