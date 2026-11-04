(function(){
 'use strict';
 var context=null,epoch=0,busy=false,reading=false;
 var banner=document.getElementById('tuck-truck-banner'),panel=document.getElementById('tuck-truck-management'),form=document.getElementById('tuck-truck-form');
 function draw(row){
  if(!banner)return;
  var label=row && row.enabled && row.location?'The tuck truck is at '+row.location:'';
  if(banner.getAttribute('data-location-label')===label)return;
  banner.setAttribute('data-location-label',label);banner.textContent='';banner.hidden=!label;if(!label)return;
  var track=document.createElement('span');track.className='tuck-truck-track';
  var text=document.createElement('span');text.className='tuck-truck-text';text.textContent=label;
  var image=document.createElement('img');image.className='tuck-truck-van';image.src='assets/images/tuck-truck-van-smoke.png';image.alt='';image.setAttribute('aria-hidden','true');image.width=100;image.height=50;
  image.onerror=function(){image.hidden=true;};track.appendChild(text);track.appendChild(image);
  var lane=document.createElement('span');lane.className='tuck-truck-lane';lane.appendChild(track);banner.appendChild(lane);

 }
 async function refresh(){
  var config=window.PORTAL_CONFIG;
  if(!banner || reading || !config || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl || '') || !config.supabasePublishableKey || config.supabaseUrl.indexOf('bbkrfeoglhwtuqdexkpu')!==-1)return;
  reading=true;
  try{var response=await fetch(config.supabaseUrl+'/rest/v1/tuck_truck_settings?select=enabled,location&id=eq.true',{headers:{apikey:config.supabasePublishableKey},cache:'no-store'});if(!response.ok)throw new Error('Banner unavailable');var rows=await response.json();draw(rows[0]);}catch(e){draw(null);}finally{reading=false;}
 }
 function clear(){epoch++;context=null;busy=false;if(panel){panel.hidden=true;form.reset();Array.from(form.elements).forEach(function(n){n.disabled=false;});document.getElementById('tuck-truck-status').textContent='';}}
 async function mount(ctx){clear();if(!panel || ctx.page!=='management' || !ctx.administrator || document.body.dataset.managementView==='accounts')return;context=ctx;var ticket=epoch;panel.hidden=false;var status=document.getElementById('tuck-truck-status');Array.from(form.elements).forEach(function(n){n.disabled=true;});try{var result=await ctx.client.from('tuck_truck_settings').select('enabled,location').single();if(result.error)throw result.error;if(ticket!==epoch)return;document.getElementById('tuck-truck-enabled').checked=result.data.enabled;document.getElementById('tuck-truck-location').value=result.data.location;}catch(e){if(ticket===epoch)status.textContent='Banner settings could not load. Check that migration 014 has been run.';return;}finally{if(ticket===epoch && !status.textContent)Array.from(form.elements).forEach(function(n){n.disabled=false;});}}
 if(form)form.addEventListener('submit',async function(e){e.preventDefault();if(!context || busy)return;var ticket=epoch,status=document.getElementById('tuck-truck-status'),enabled=document.getElementById('tuck-truck-enabled').checked,location=document.getElementById('tuck-truck-location').value.trim();if(enabled && !location){status.textContent='Enter a location before enabling the banner.';return;}busy=true;Array.from(form.elements).forEach(function(n){n.disabled=true;});status.textContent='Saving…';try{var r=await context.client.rpc('save_tuck_truck_banner',{show_banner:enabled,truck_location:location});if(r.error)throw r.error;if(ticket===epoch){status.textContent=enabled?'Banner enabled. Open pages update within 30 seconds.':'Banner disabled. Open pages update within 30 seconds.';refresh();}}catch(err){if(ticket===epoch)status.textContent=err.message || 'Could not save the banner.';}finally{if(ticket===epoch){busy=false;Array.from(form.elements).forEach(function(n){n.disabled=false;});}}});
 window.UMAI_TUCK_TRUCK={mount:mount,clear:clear,refresh:refresh};
 refresh();if(banner){setInterval(function(){if(!document.hidden)refresh();},30000);document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh();});}
})();
