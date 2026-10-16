import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const p = await b.newPage()
await p.goto('http://127.0.0.1:5190/fundamentos', { waitUntil: 'networkidle0' })
const r = await p.evaluate(async () => {
  const e = await import('/src/dados/numeros-escola.ts')
  const rede = await import('/src/dados/rede.ts')
  return { ALUNOS: e.ALUNOS_QUE_USARAM, PACOTE: e.PACOTE, TURMAS: e.ACERTO_POR_SERIE.map(s=>[s.curto,s.turmas]), TCA: e.TURMAS_COM_ACERTO, HAB: e.HABILIDADES_2EM.itens.map(i=>[i.nome,i.acerto]),
    SAIDAS: rede.SAIDAS_IA, AGO: Object.fromEntries(Object.entries(rede.USO_DE_AGOSTO).map(([k,v])=>[k,[v.alunosAtivos,v.custoIA,v.tetoIA]])),
    SET: Object.fromEntries(Object.entries(rede.USO_DE_SETEMBRO).map(([k,v])=>[k,[v.alunosAtivos,v.custoIA,v.tetoIA]])) }
})
console.log(JSON.stringify(r))
await b.close()
