document.addEventListener('DOMContentLoaded',()=>{
 setTimeout(()=>{
  document.querySelectorAll('button,div,a').forEach(el=>{
    const t=(el.innerText||'').trim();
    if(t==='กลับ' || t==='ลา'){ el.style.display='none';}
    if(t==='เบิกเงิน') el.innerText='การเงิน';
    if(t==='ตั้งค่า') el.innerText='เพิ่มเติม';
  });
 },1500);
});
