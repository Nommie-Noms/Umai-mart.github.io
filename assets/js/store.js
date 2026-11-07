(function () {
  'use strict';
  var config=window.UMAI_STORE,storageKey='umai-mart-basket-v1',cart={},filter='All',toastTimer,previousFocus=null;
  var $=function(id){return document.getElementById(id);};
  if(!config || !Array.isArray(config.products))return;
  var products=config.products.filter(function(p){return p.id && p.name && Number.isFinite(p.price) && p.price>=0;}),byId={};
  products.forEach(function(p){byId[p.id]=p;});
  function money(amount){return '$'+Number(amount).toLocaleString('en-US',{maximumFractionDigits:2});}
  function node(tag,className,text){var n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').className='store-toast visible';toastTimer=setTimeout(function(){$('toast').className='store-toast';},3500);}
  function readCart(){
    try {var saved=JSON.parse(localStorage.getItem(storageKey) || '{}'),clean={};if(!saved || typeof saved!=='object' || Array.isArray(saved))return {};Object.keys(saved).forEach(function(id){if(byId[id] && Number.isInteger(saved[id]) && saved[id]>0)clean[id]=Math.min(50,saved[id]);});return clean;}catch(error){return {};}
  }
  function save(){try{localStorage.setItem(storageKey,JSON.stringify(cart));}catch(error){toast('Your browser could not save this basket. Copy your shopping list before leaving.');}}
  function setQuantity(id,quantity){if(!byId[id])return;if(quantity>50){toast('You can save up to 50 of each item.');return;}if(quantity<=0)delete cart[id];else cart[id]=quantity;save();renderBasket();}
  function renderProducts(){
    var grid=$('product-grid');grid.textContent='';
    products.filter(function(p){return filter==='All' || p.category===filter;}).forEach(function(p){
      var article=node('article','product'),art=node('div','product-art'),img=node('img');
      window.UMAI_PRODUCT_IMAGES.apply(img,p);img.alt='Illustrated '+p.name;img.width=440;img.height=360;img.loading='lazy';art.appendChild(img);
      if(p.label)art.appendChild(node('span','product-tag',p.label));article.appendChild(art);article.appendChild(node('p','product-category',p.category));article.appendChild(node('h3','',p.name));article.appendChild(node('p','product-description',p.description));
      var bottom=node('div','product-bottom'),add=node('button','product-add','Add +');add.type='button';add.setAttribute('aria-label','Add '+p.name+' to your saved basket');if(p.stock===0){add.disabled=true;add.textContent='Sold out';}add.onclick=function(){var old=cart[p.id] || 0;setQuantity(p.id,old+1);if(old<50)toast(p.name+' added to your basket.');};bottom.appendChild(node('span','product-price',money(p.price)));bottom.appendChild(add);article.appendChild(bottom);grid.appendChild(article);
    });
    if(!grid.children.length)grid.appendChild(node('p','','No products in this category yet.'));
  }
  function renderBasket(){
    var count=0,total=0,container=$('basket-items');container.textContent='';
    Object.keys(cart).forEach(function(id){var p=byId[id];if(!p)return;var quantity=cart[id];count+=quantity;total+=p.price*quantity;
      var row=node('div','basket-row'),img=node('img');window.UMAI_PRODUCT_IMAGES.apply(img,p);img.alt='';img.width=75;img.height=62;row.appendChild(img);
      var details=node('div');details.appendChild(node('h3','',p.name));details.appendChild(node('p','',money(p.price*quantity)));
      var controls=node('div','basket-row-controls'),minus=node('button','','−'),plus=node('button','','+'),remove=node('button','remove-item','Remove');
      minus.type=plus.type=remove.type='button';minus.setAttribute('aria-label','Remove one '+p.name);plus.setAttribute('aria-label','Add one '+p.name);remove.setAttribute('aria-label','Remove '+p.name+' from basket');plus.disabled=quantity>=50;
      minus.onclick=function(){setQuantity(id,quantity-1);};plus.onclick=function(){setQuantity(id,quantity+1);};remove.onclick=function(){setQuantity(id,0);};controls.appendChild(minus);controls.appendChild(node('span','',String(quantity)));controls.appendChild(plus);controls.appendChild(remove);details.appendChild(controls);row.appendChild(details);container.appendChild(row);
    });
    if(!count)container.appendChild(node('p','empty-basket','Your basket is taking a little break. Add something good from the shelves.'));
    $('basket-count').textContent=String(count);$('open-basket').setAttribute('aria-label','Open your saved basket: '+count+(count===1?' item':' items'));$('basket-subtotal').textContent=money(total);$('copy-basket').disabled=count===0;
  }
  function closeMenu(){$('main-nav').classList.remove('is-open');$('menu-toggle').setAttribute('aria-expanded','false');$('menu-toggle').setAttribute('aria-label','Open navigation');}
  function openBasket(){previousFocus=document.activeElement;closeMenu();$('basket-overlay').hidden=false;document.body.classList.add('overlay-open');$('close-basket').focus();}
  function closeBasket(){$('basket-overlay').hidden=true;document.body.classList.remove('overlay-open');if(previousFocus && previousFocus.focus)previousFocus.focus();}
  async function copy(text){
    try {if(navigator.clipboard && navigator.clipboard.writeText){await navigator.clipboard.writeText(text);return true;}}catch(error){}
    var active=document.activeElement,field=node('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';field.setAttribute('aria-label','Shopping list to copy');($('basket-overlay').hidden?document.body:$('basket-dialog')).appendChild(field);field.focus();field.select();var success=false;try{success=document.execCommand('copy');}catch(error){}field.remove();if(active && active.focus)active.focus();return success;
  }
  $('copy-basket').onclick=async function(){var lines=['Umai Mart shopping list (not a placed order)'],sum=0;Object.keys(cart).forEach(function(id){var p=byId[id];sum+=p.price*cart[id];lines.push(cart[id]+' × '+p.name+' — '+money(p.price*cart[id]));});lines.push('Items subtotal: '+money(sum));lines.push(config.sampleMenu?'Sample prices. Delivery fee not included.':'Prices. Delivery fee not included.');toast(await copy(lines.join('\n'))?'Shopping list copied. No order has been placed.':'Copy is unavailable in this browser. Your list is shown in the basket.');};
  function renderFilters(){
    var categories=['All'];products.forEach(function(p){if(p.category && !categories.includes(p.category))categories.push(p.category);});
    if(!categories.includes(filter))filter='All';var container=$('category-filters');container.textContent='';
    categories.forEach(function(category){var button=node('button','',category==='All'?'All the good stuff':category);button.type='button';button.dataset.category=category;button.setAttribute('aria-pressed',String(filter===category));button.onclick=function(){filter=category;renderFilters();renderProducts();};container.appendChild(button);});
  }
  $('open-basket').onclick=openBasket;$('close-basket').onclick=closeBasket;$('basket-overlay').onclick=function(event){if(event.target===$('basket-overlay'))closeBasket();};
  $('menu-toggle').onclick=function(){var open=$('main-nav').classList.toggle('is-open');this.setAttribute('aria-expanded',String(open));this.setAttribute('aria-label',open?'Close navigation':'Open navigation');};
  document.querySelectorAll('#main-nav a').forEach(function(link){link.addEventListener('click',closeMenu);});
  document.addEventListener('keydown',function(event){
    if(event.key==='Escape'){if(!$('basket-overlay').hidden)closeBasket();else if($('main-nav').classList.contains('is-open')){closeMenu();$('menu-toggle').focus();}}
    if(event.key==='Tab' && !$('basket-overlay').hidden){var focusable=Array.from($('basket-dialog').querySelectorAll('button:not([disabled]),a[href],textarea')),first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}}
  });
  window.addEventListener('storage',function(event){if(event.key===storageKey){cart=readCart();renderBasket();}});
  if(config.location)$('location-text').textContent=config.location;if(config.hours)$('hours-text').textContent=config.hours;if(config.deliveryNote)$('delivery-note').textContent=config.deliveryNote;
  var contactNumber=$('copy-phone').getAttribute('data-phone') || config.phone;if(contactNumber){var phone=$('copy-phone');phone.disabled=false;phone.textContent=contactNumber+' · Copy number';phone.onclick=async function(){toast(await copy(contactNumber)?'Phone number copied.':'Copy is unavailable in this browser.');};}
  if(!config.sampleMenu){$('sample-label').textContent='ALL PRICES · $';$('menu-notice').textContent='Save a shopping list and confirm live prices in the delivery portal.';}
  cart=readCart();renderFilters();renderProducts();renderBasket();
  // A separate Umai Mart backend is optional until configured. Never contact Quill & Ink.
  var backend=window.PORTAL_CONFIG;
  if(backend && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(backend.supabaseUrl || '') && backend.supabasePublishableKey && backend.supabaseUrl.indexOf('bbkrfeoglhwtuqdexkpu')===-1){
   Promise.all(['store_products?available=eq.true&select=*','store_settings?select=*'].map(function(path){return fetch(backend.supabaseUrl+'/rest/v1/'+path,{headers:{apikey:backend.supabasePublishableKey}}).then(function(response){if(!response.ok)throw new Error('Live menu unavailable');return response.json();});})).then(function(result){
    products=result[0].map(function(p){return Object.assign({},p,{art:p.illustration,label:p.stock===0?'Sold out':''});});byId={};products.forEach(function(p){byId[p.id]=p;});cart=readCart();renderFilters();renderProducts();renderBasket();
    if(result[1][0]){config.sampleMenu=result[1][0].sample_menu;$('sample-label').textContent=config.sampleMenu?'SAMPLE MENU · $':'ALL PRICES · $';$('menu-notice').textContent=result[1][0].ordering_enabled?'Confirm your delivery details and final total in the portal.':'New delivery and parcel bookings are paused.';}
   }).catch(function(){$('menu-notice').textContent='The live menu could not load. This is the sample range; confirm availability in the delivery portal.';});
  }
}());
