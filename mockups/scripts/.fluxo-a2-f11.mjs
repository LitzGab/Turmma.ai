import puppeteer from 'puppeteer-core'
const B='http://127.0.0.1:5190', SH='/Users/gabriel/Code/Turmma/mockups/scripts/shots/polimento/A2rev/'
const br=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
const dorme=ms=>new Promise(r=>setTimeout(r,ms))
const p=await br.newPage(); await p.setViewport({width:1440,height:780})
const clica=async(t)=>{const ok=await p.evaluate(t=>{const els=[...document.querySelectorAll('button,a,[role=radio],label')];const el=els.find(e=>e.offsetParent!==null&&(e.textContent||'').toLowerCase().includes(t.toLowerCase()));if(!el)return false;el.click();return true},t);await dorme(500);if(!ok)console.log('!! não achei',t)}
const texto=async()=>(await p.evaluate(()=>document.body.innerText)).replace(/\n+/g,' | ').slice(0,800)
await p.goto(B+'/professor?como=camila',{waitUntil:'networkidle0'}); await p.evaluate(()=>localStorage.clear())
await p.goto(B+'/professor?item=sinal-2b&como=camila',{waitUntil:'networkidle0'}); await dorme(500)
await clica('Gerar revisão'); await dorme(800); await clica('Gerar atividade'); await dorme(3000); await clica('Aprovar e enviar ao 2')
await p.evaluate(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].filter(e=>/aprovar e enviar/i.test(e.textContent));b[b.length-1]?.click()}); await dorme(800)
console.log('P',(await texto()).slice(300))
await p.goto(B+'/aluno/tarefas?como=lucas',{waitUntil:'networkidle0'}); await dorme(400); console.log('T',await texto())
await clica('Revisão'); await dorme(600); console.log('url',p.url()); console.log('R',await texto()); await p.screenshot({path:SH+'f11-revisao.png'})
// responder tudo e entregar
for(let i=0;i<12;i++){ await p.evaluate(()=>{const r=[...document.querySelectorAll('[role=radio]')];r[1]?.click()}); await dorme(200); const fim=await p.evaluate(()=>[...document.querySelectorAll('button')].some(b=>/^entregar$/i.test(b.textContent.trim())&&b.offsetParent)); if(fim)break; await clica('Próxima') }
await p.evaluate(()=>{[...document.querySelectorAll('button')].find(b=>/^entregar$/i.test(b.textContent.trim())&&b.offsetParent)?.click()}); await dorme(400)
await p.evaluate(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].filter(e=>/^entregar$/i.test(e.textContent.trim()));b[b.length-1]?.click()}); await dorme(800)
console.log('E',await texto()); await p.screenshot({path:SH+'f11-entregue.png'})
await p.goto(B+'/professor?como=camila',{waitUntil:'networkidle0'}); await dorme(400); console.log('F',(await texto()).slice(350))
await br.close()
