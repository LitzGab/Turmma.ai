import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Aviso, Botao, CampoSenha, CampoTexto } from '@/components/duo'
import { entrar } from '@/dados/acesso'
import { sessao } from '@/dados/sessao'
import { CanalDaEscola, CascaPublica, DivisorOu, EscolaInexistente, Titulo, classeDoLink, escolaPublica, useTituloDaAba } from './_casca'

/* A ENTRADA DA ESCOLA (`/e/<escola>`): a conta da escola (só quando a escola tem), Matrícula, Senha e ENTRAR.
   Os campos vêm VAZIOS (o atalho do Lucas mora no Mapa). `entrar()` (dados/acesso.ts) responde:
   · ok → a sessão vira a do aluno; na primeira vez, /aluno/bem-vindo (a onça); depois, /aluno;
   · espera → "Seu pedido ainda está esperando a escola." (só com a matrícula E a senha do pedido);
   · erro → "Matrícula ou senha incorretas.", sem dizer se a matrícula existe (regra 20, item 6).
   O pé da coluna é o canal da escola sem conta (CanalDaEscola, em _casca): AVISAR A ESCOLA (ECA Digital, art. 28 —
   lei), PEDIDO SOBRE DADOS (LGPD, art. 18 — lei) e o encarregado de dados (LGPD, art. 41 — lei). */

export function EntrarNaEscola() {
  const { escola: slug } = useParams()
  const escola = escolaPublica(slug)
  const navegar = useNavigate()
  useTituloDaAba(escola?.nome ?? 'Turmma')
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
  const [resposta, setResposta] = useState<'espera' | 'erro' | null>(null)

  if (!escola) return <EscolaInexistente />

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const r = entrar(matricula, senha)
    if (r.tipo === 'ok') {
      sessao.entrarComoAluno(r.alunoId)
      navegar(r.primeiraVez ? '/aluno/bem-vindo' : '/aluno', { replace: true })
      return
    }
    if (r.tipo === 'erro') setSenha('')
    setResposta(r.tipo)
  }
  const limpar = () => { if (resposta) setResposta(null) }

  return (
    <CascaPublica rodape={`${escola.nome} · ${escola.cidade}`} canal={<CanalDaEscola escola={escola} />}>
      <div className="animate-entra">
        <Titulo titulo={escola.nome} />

        <Botao variante="secundario" largura="cheia" className="mt-6" onClick={() => navegar('/aluno?como=lucas', { replace: true })}
          icone={<img src={`/marca/${escola.conta.toLowerCase()}.svg`} alt="" className="size-5" />}>
          <span className="sm:hidden">Conta {escola.conta} da escola</span>
          <span className="hidden sm:inline">Entrar com a conta {escola.conta} da escola</span>
        </Botao>

        <DivisorOu />

        <form className="grid gap-4" onSubmit={enviar} noValidate>
          <CampoTexto rotulo="Matrícula" valor={matricula} placeholder="2026-0000" inputMode="numeric" autoComplete="username" spellCheck={false}
            aoMudar={(v) => { setMatricula(v); limpar() }} />
          <CampoSenha rotulo="Senha" valor={senha} aoMudar={(v) => { setSenha(v); limpar() }} />
          {resposta === 'espera' && <Aviso tom="atencao">Seu pedido ainda está esperando a escola.</Aviso>}
          {resposta === 'erro' && <Aviso tom="erro">Matrícula ou senha incorretas.</Aviso>}
          <Botao type="submit" largura="cheia">Entrar</Botao>
        </form>

        <div className="t-apoio mt-5 grid gap-2">
          <p>Esqueceu a senha? Fale com seu professor.</p>
          <p>Primeira vez? <Link to={`/e/${escola.slug}/turma`} className={classeDoLink}>Tenho um código</Link></p>
        </div>

      </div>
    </CascaPublica>
  )
}
