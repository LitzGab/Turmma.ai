import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ESCOLA_SLUG } from '@/dados/estrutura'
import { Campo, CampoSenha, CascaPublica, EscolaInexistente, Titulo, classeDoLink, useTituloDaAba } from './_casca'

/* A entrada da escola (`/e/<escola>`), do produto real: o aluno já aprovado entra com matrícula + senha (D48), ou
   pela conta Google/Microsoft da escola, quando a equipe de tecnologia liberou o aplicativo. Quem ainda não tem o
   nome aprovado vai para a página da turma. Os campos vêm preenchidos com o Lucas Pereira (o aluno de sempre),
   como na Entrada; qualquer coisa leva a /aluno. */
export function EntrarNaEscola() {
  const { escola } = useParams()
  const navegar = useNavigate()
  useTituloDaAba('Colégio Aurora')
  const [matricula, setMatricula] = useState('2026-0412')
  const [senha, setSenha] = useState('demonstracao')

  if (escola !== ESCOLA_SLUG) return <EscolaInexistente />

  return (
    <CascaPublica rodape="Colégio Aurora · Joinville, SC">
      <Titulo titulo="Colégio Aurora" linha="Joinville · SC" />

      <form className="mt-7 grid gap-4" onSubmit={(e) => { e.preventDefault(); navegar('/aluno') }}>
        <Campo rotulo="Matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value)} inputMode="numeric" autoComplete="username" />
        <CampoSenha rotulo="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
        <Button type="submit" className="h-12 w-full">Entrar</Button>
      </form>
      <p className="mt-3 pl-1 text-[15px] text-sutil">Esqueceu a senha? Fale com o seu professor.</p>

      <div className="mt-6 flex items-center gap-3 text-sm text-sutil"><span className="h-px flex-1 bg-linha" />Ou entre com a conta da escola<span className="h-px flex-1 bg-linha" /></div>
      <div className="mt-4 grid gap-2">
        <Button variant="secundario" className="h-12" onClick={() => navegar('/aluno')}><img src="/marca/google.svg" alt="" className="size-[18px]" /> Entrar com a conta Google da escola</Button>
        <Button variant="secundario" className="h-12" onClick={() => navegar('/aluno')}><img src="/marca/microsoft.svg" alt="" className="size-[18px]" /> Entrar com a conta Microsoft da escola</Button>
      </div>
      <p className="mt-2.5 pl-1 text-[13px] leading-snug text-sutil">
        A equipe de tecnologia da escola precisa liberar este aplicativo para as contas de aluno. Se não funcionar, entre com a sua matrícula.
      </p>

      <div className="mt-6 rounded-cartao border border-linha px-5 py-4">
        <p className="text-[15px] font-medium text-tinta">Primeira vez no Turmma?</p>
        <p className="mt-0.5 text-[15px] leading-snug text-sutil">
          <Link to={`/e/${ESCOLA_SLUG}/turma`} className={classeDoLink}>Entre na sua turma com o código que o professor mostrou</Link>
        </p>
      </div>
    </CascaPublica>
  )
}
