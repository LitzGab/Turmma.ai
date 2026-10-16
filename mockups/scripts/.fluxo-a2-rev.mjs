import puppeteer from 'puppeteer-core'
const B='http://127.0.0.1:5190'
const SH='/Users/gabriel/Code/Turmma/mockups/scripts/shots/polimento/A2rev/'
const br=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
const erros=[]
const nova=async(w=1440)=>{const p=await br.newPage();await p.setViewport({width:w,height:780});p.on('pageerror',e=>erros.push(String(e)));p.on('console',m=>{if(m.type()==='error')erros.push(m.text().slice(0,200))});return p}
const dorme=ms=>new Promise(r=>setTimeout(r,ms))
const clica=async(p,t,exato=false)=>{const ok=await p.evaluate((t,exato)=>{const els=[...document.querySelectorAll('button,a,[role=tab],[role=radio],label')];const el=els.find(e=>e.offsetParent!==null&&(exato?(e.textContent||'').trim().toLowerCase()===t.toLowerCase():(e.textContent||'').toLowerCase().includes(t.toLowerCase())));if(!el)return false;el.click();return true},t,exato);await dorme(500);if(!ok)console.log('  !! não achei',t);return ok}
const texto=async p=>(await p.evaluate(()=>document.body.innerText)).replace(/\n+/g,' | ').slice(0,900)
const vai=async(p,u)=>{await p.goto(B+u,{waitUntil:'networkidle0'});await dorme(500)}
const prof=await nova(); await vai(prof,'/professor?como=camila'); await prof.evaluate(()=>localStorage.clear()); 
await vai(prof,'/professor/conversa/nova?ferramenta=prova&turma=2b&como=camila'); console.log('P1',await texto(prof))
await clica(prof,'Gerar prova'); await dorme(3000); console.log('P2',await texto(prof))
await clica(prof,'Aprovar e enviar ao 2'); await dorme(400); console.log('P3',await texto(prof))
await prof.screenshot({path:SH+'f2-dialogo.png'})
// aprovar no diálogo (último botão com o texto)
await prof.evaluate(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].filter(e=>/aprovar e enviar/i.test(e.textContent));b[b.length-1]?.click()}); await dorme(800)
console.log('P4',await texto(prof))
const al=await nova(); await vai(al,'/aluno?como=lucas'); console.log('A1',await texto(al)); await al.screenshot({path:SH+'f2-inicio.png'})
await vai(al,'/aluno/tarefas?como=lucas'); console.log('A2',await texto(al)); await al.screenshot({path:SH+'f2-tarefas.png'})
await vai(al,'/aluno/tarefas/estequiometria?como=lucas'); await clica(al,'Pedir ajuda'); await dorme(500); await al.screenshot({path:SH+'f2-ajuda-travado.png'}); console.log('A3',await texto(al))
await vai(al,'/aluno/tarefas?como=lucas'); await clica(al,'Prova de estequiometria'); await dorme(500); console.log('A4 url',al.url())
await clica(al,'Começar',true)
for(let i=0;i<10;i++){ await al.evaluate(()=>{const r=[...document.querySelectorAll('[role=radio], input[type=radio]')];const el=r[2]||r[0];el?.click()}); await dorme(250); if(i<9) await clica(al,'Próxima') }
await al.screenshot({path:SH+'f3-ultima.png'})
await clica(al,'Entregar a prova'); await al.screenshot({path:SH+'f3-confirmar.png'}); console.log('A5',await texto(al))
await al.evaluate(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].filter(e=>/^entregar$/i.test(e.textContent.trim()));b[b.length-1]?.click()}); await dorme(800)
console.log('A6',await texto(al)); await al.screenshot({path:SH+'f3-entregue.png'})
await clica(al,'Voltar ao início'); await dorme(500); console.log('A7',await texto(al)); await al.screenshot({path:SH+'f3-inicio-depois.png'})
await vai(al,'/aluno/tarefas?como=lucas'); console.log('A8',await texto(al))
await vai(prof,'/professor?como=camila'); console.log('P5',await texto(prof)); await prof.screenshot({path:SH+'f3-prof-fila.png'})
await clica(prof,'Notas · estequiometria'); await dorme(800); console.log('P6 url',prof.url(), await texto(prof)); await prof.screenshot({path:SH+'f3-prof-lote.png'})
await clica(prof,'Aprovar a nota'); await dorme(500); console.log('P7',await texto(prof))
await prof.evaluate(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].filter(e=>/aprovar/i.test(e.textContent));b[b.length-1]?.click()}); await dorme(800); console.log('P8',await texto(prof))
await vai(al,'/aluno/tarefas?como=lucas'); console.log('A9',await texto(al)); await al.screenshot({path:SH+'f3-tarefas-corrigida.png'})
await vai(al,'/aluno/tarefas/prova-estequiometria?como=lucas'); console.log('A10',await texto(al)); await al.screenshot({path:SH+'f3-resultado.png'})
// F4
await clica(al,'Isso está errado?'); await dorme(400); await al.screenshot({path:SH+'f4-dialogo.png'}); console.log('A11',await texto(al))
await clica(al,'A correção está errada'); await al.evaluate(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].filter(e=>/^enviar$/i.test(e.textContent.trim()));b[b.length-1]?.click()}); await dorme(600)
console.log('A12',await texto(al)); await al.screenshot({path:SH+'f4-vai-olhar.png'})
await vai(prof,'/professor?como=camila'); console.log('P9',await texto(prof))
;(await clica(prof,'pediu revisão')) || (await clica(prof,'Lucas')); await dorme(600); console.log('P10',await texto(prof)); await prof.screenshot({path:SH+'f4-prof-painel.png'})
await clica(prof,'Manter a nota'); await dorme(400); console.log('P11',await texto(prof));
await prof.evaluate(()=>{const t=document.querySelector('[role=dialog] textarea')||document.querySelector('textarea');if(t){const s=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;if(!t.value){s.call(t,'A resposta certa é 72 g: 8 g de H₂ são 4 mol de água.');t.dispatchEvent(new Event('input',{bubbles:true}))}}}); await dorme(300)
await prof.screenshot({path:SH+'f4-prof-manter.png'})
await prof.evaluate(()=>{const b=[...document.querySelectorAll('button')].filter(e=>/^enviar$/i.test(e.textContent.trim())&&e.offsetParent);b[b.length-1]?.click()}); await dorme(600); console.log('P12',await texto(prof))
await vai(al,'/aluno/tarefas?como=lucas'); console.log('A13',await texto(al))
await vai(al,'/aluno/tarefas/prova-estequiometria?como=lucas'); console.log('A14',await texto(al)); await al.screenshot({path:SH+'f4-resposta.png'})
console.log('ERROS',erros)
await br.close()
