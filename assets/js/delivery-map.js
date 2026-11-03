(function(){
 'use strict';
 var current=null;
 function node(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
 function valid(p){return p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)) && Number(p.x)>=0 && Number(p.x)<=100 && Number(p.y)>=0 && Number(p.y)<=100;}
 function open(point,editable){
  if(current)current();
  return new Promise(function(resolve){
   var previous=document.activeElement,chosen=valid(point)?{x:Number(point.x),y:Number(point.y)}:null,zoom=1,base=320,loaded=false,drag=null,suppress=false,pointers={},pinch=null;
   var overlay=node('div','delivery-map-overlay'),dialog=node('section','delivery-map-dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','delivery-map-title');
   var top=node('div','delivery-map-heading'),title=node('h2','',editable?'Choose delivery location':'Delivery location');title.id='delivery-map-title';top.appendChild(title);var exit=node('button','','Close');exit.type='button';top.appendChild(exit);dialog.appendChild(top);
   dialog.appendChild(node('p','note',editable?'Tap the map to place your pin. Scroll the mouse wheel or pinch with two fingers to zoom. Drag with a mouse or one finger to move around. You can also focus the map and use arrow keys to move the pin.':'The pin marks the customer’s chosen delivery location. Scroll or pinch to zoom; drag to move around. Check the written address for entrance and landmark details.'));
   var toolbar=node('div','delivery-map-toolbar');function button(text,fn){var b=node('button','',text);b.type='button';b.onclick=fn;toolbar.appendChild(b);return b;}
   var less=button('Zoom −',function(){scale(zoom/1.5);}),more=button('Zoom +',function(){scale(zoom*1.5);});button('Fit map',function(){scale(1);});var zoomText=node('span');zoomText.setAttribute('aria-live','polite');toolbar.appendChild(zoomText);dialog.appendChild(toolbar);
   var viewport=node('div','delivery-map-viewport'),plane=node('div','delivery-map-plane'),img=node('img');img.src='assets/images/los-santos-map.svg';img.alt='Los Santos delivery map';img.draggable=false;plane.appendChild(img);var marker=node('span','delivery-map-marker','●');marker.setAttribute('aria-hidden','true');plane.appendChild(marker);viewport.appendChild(plane);dialog.appendChild(viewport);
   if(editable){plane.tabIndex=0;plane.setAttribute('role','button');plane.setAttribute('aria-label','Delivery location map. Click to place a pin or use arrow keys to move it.');}
   var message=node('p','note');message.setAttribute('role','status');message.setAttribute('aria-live','polite');dialog.appendChild(message);var bottom=node('div','delivery-map-toolbar'),use=node('button','','Use this location');use.type='button';if(editable)bottom.appendChild(use);dialog.appendChild(bottom);overlay.appendChild(dialog);document.body.appendChild(overlay);var oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
   function paint(){marker.hidden=!chosen;if(chosen){marker.style.left=chosen.x+'%';marker.style.top=chosen.y+'%';}use.disabled=!loaded || !chosen;message.textContent=!loaded?'Loading map…':chosen?(editable?'Pin selected. Choose “Use this location” to save it.':'Saved delivery pin.'):'No pin selected yet.';}
   function scale(next,from,to){
    var vr=viewport.getBoundingClientRect(),before=plane.getBoundingClientRect();
    from=from || {x:vr.left+viewport.clientWidth/2,y:vr.top+viewport.clientHeight/2};to=to || from;
    var fx=(from.x-before.left)/Math.max(before.width,1),fy=(from.y-before.top)/Math.max(before.height,1);
    zoom=Math.max(1,Math.min(8,next));plane.style.width=(base*zoom)+'px';
    zoomText.textContent=Math.round(zoom*100)+'%';less.disabled=zoom<=1;more.disabled=zoom>=8;
    var after=plane.getBoundingClientRect();viewport.scrollLeft+=after.left+fx*after.width-to.x;viewport.scrollTop+=after.top+fy*after.height-to.y;
   }
   function resize(){base=Math.max(100,Math.min(viewport.clientWidth,viewport.clientHeight*5367/7896));scale(zoom);}
   function finish(result){if(current!==cancel)return;current=null;window.removeEventListener('resize',resize);document.removeEventListener('keydown',key);document.body.style.overflow=oldOverflow;overlay.remove();if(previous && previous.isConnected)previous.focus();resolve(result);}
   function cancel(){finish(null);}current=cancel;exit.onclick=cancel;overlay.onclick=function(e){if(e.target===overlay)cancel();};use.onclick=function(){if(loaded && chosen)finish({x:chosen.x,y:chosen.y});};
   function key(e){if(e.key==='Escape'){e.preventDefault();cancel();}if(e.key==='Tab'){var focusable=Array.from(dialog.querySelectorAll('button:not(:disabled),[tabindex="0"]'));var first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}}}document.addEventListener('keydown',key);
   plane.onclick=function(e){if(!editable || !loaded || suppress){suppress=false;return;}var rect=plane.getBoundingClientRect();chosen={x:Math.round(Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100))*1000000)/1000000,y:Math.round(Math.max(0,Math.min(100,(e.clientY-rect.top)/rect.height*100))*1000000)/1000000};paint();};
   plane.onkeydown=function(e){if(!editable || !loaded || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key))return;e.preventDefault();if(e.key==='Enter' || e.key===' '){if(!chosen)chosen={x:50,y:50};paint();return;}if(!chosen)chosen={x:50,y:50};var step=e.shiftKey?2:0.5;chosen.x=Math.max(0,Math.min(100,chosen.x+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0)));chosen.y=Math.max(0,Math.min(100,chosen.y+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)));paint();};
   function eventPoint(e){return {x:e.clientX,y:e.clientY};}
   function active(){return Object.keys(pointers).map(function(id){return pointers[id];});}
   function midpoint(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
   function distance(a,b){return Math.sqrt(Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2));}
   function startGesture(moved){var list=active();if(list.length>=2){pinch={distance:Math.max(1,distance(list[0],list[1])),zoom:zoom,anchor:midpoint(list[0],list[1])};drag=null;suppress=true;}else if(list.length===1){pinch=null;drag={x:list[0].x,y:list[0].y,left:viewport.scrollLeft,top:viewport.scrollTop,moved:!!moved};}else{pinch=null;drag=null;}}
   viewport.addEventListener('wheel',function(e){if(!loaded)return;e.preventDefault();var delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1);scale(zoom*Math.exp(-Math.max(-250,Math.min(250,delta))*0.002),eventPoint(e));suppress=true;},{passive:false});
   viewport.onpointerdown=function(e){if(e.pointerType==='mouse' && e.button!==0)return;if(!active().length)suppress=false;pointers[e.pointerId]=eventPoint(e);viewport.setPointerCapture(e.pointerId);startGesture(suppress);};
   viewport.onpointermove=function(e){if(!pointers[e.pointerId])return;pointers[e.pointerId]=eventPoint(e);var list=active();if(list.length>=2 && pinch){var mid=midpoint(list[0],list[1]);scale(pinch.zoom*distance(list[0],list[1])/pinch.distance,pinch.anchor,mid);pinch.anchor=mid;suppress=true;}else if(drag){var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>6)drag.moved=true;if(drag.moved){viewport.scrollLeft=drag.left-dx;viewport.scrollTop=drag.top-dy;suppress=true;}}};
   function endPointer(e,cancelled){if(!pointers[e.pointerId])return;var tap=!cancelled && active().length===1 && drag && !drag.moved && !suppress;if(tap && editable && loaded){var rect=plane.getBoundingClientRect();if(e.clientX>=rect.left && e.clientX<=rect.right && e.clientY>=rect.top && e.clientY<=rect.bottom){chosen={x:Math.round((e.clientX-rect.left)/rect.width*100000000)/1000000,y:Math.round((e.clientY-rect.top)/rect.height*100000000)/1000000};paint();}}delete pointers[e.pointerId];suppress=true;startGesture(true);}
   viewport.onpointerup=function(e){endPointer(e,false);};viewport.onpointercancel=function(e){endPointer(e,true);};viewport.onlostpointercapture=function(e){if(pointers[e.pointerId])endPointer(e,true);};
   img.onload=function(){loaded=true;resize();paint();};img.onerror=function(){loaded=false;paint();message.textContent='The map could not load. Check that assets/images/los-santos-map.svg was uploaded. Your written address can still be used.';};window.addEventListener('resize',resize);resize();paint();exit.focus();
  });
 }
 window.UMAI_DELIVERY_MAP={choose:function(point){return open(point,true);},view:function(point){return open(point,false);},close:function(){if(current)current();}};
})();
