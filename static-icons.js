/* เติมไอคอน SVG ให้องค์ประกอบสแตติก (แท็บบน, เมนูล่าง, ปุ่ม) ที่มี data-ic */
(function fillStaticIcons(){
  if(typeof window.skeIcon!=='function'){return setTimeout(fillStaticIcons,30);}
  document.querySelectorAll('[data-ic]').forEach(function(el){
    if(el.getAttribute('data-ic-filled'))return;
    el.innerHTML=window.skeIcon(el.getAttribute('data-ic'));
    el.setAttribute('data-ic-filled','1');
  });
})();
