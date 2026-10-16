import puppeteer from 'puppeteer-core'
const B='http://127.0.0.1:5190', SH='/Users/gabriel/Code/Turmma/mockups/scripts/shots/polimento/A2rev/'
const br=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
const dorme=ms=>new Promise(r=>setTimeout(r,ms))
const p=await br.newPage(); await p.setViewport({width:1440,height:780})
const clica=async(t)=>{const ok=await p.evaluate(t=>{const els=[...document.querySelectorAll('button,a,[role=radio],label')];const el=els.find(e=>e.offsetParent!==null&&(e.textContent||'').toLowerCase().includes(t.toLowerCase()));if(!el)return false;el.click();return true},t);await dorme(500);if(!ok)console.log('!! não achei',t)}
const texto=async()=>(await p.evaluate(()=>document.body.innerText)).replace(/\n+/g,' | ').slice(0,700)
await p.goto(B+'/professor?como=camila',{waitUntil:'networkidle0'}); await p.evaluate(()=>localStorage.clear())
await p.goto(B+'/professor/conversa/nova?ferramenta=prova&turma=2b&como=camila',{waitUntil:'networkidle0'}); await dorme(400)
await clica('Gerar prova'); await dorme(3000); await clica('Aprovar e enviar ao 2'); await clica('próxima aula')
await p.screenshot({path:SH+'var-dialogo.png'})
await p.evaluate(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].filter(e=>/aprovar e enviar/i.test(e.textContent));b[b.length-1]?.click()}); await dorme(800)
console.log('P',await texto())
for (const [n,u] of [['var-inicio','/aluno?como=lucas'],['var-tarefas','/aluno/tarefas?como=lucas'],['var-prova','/aluno/prova/prova-estequiometria?como=lucas']]) { await p.goto(B+u,{waitUntil:'networkidle0'}); await dorme(500); console.log(n,await texto()); await p.screenshot({path:SH+n+'.png'}) }
await p.setViewport({width:375,height:780}); await p.reload({waitUntil:'networkidle0'}); await dorme(400); await p.screenshot({path:SH+'var-prova-375.png'})
await br.close()
