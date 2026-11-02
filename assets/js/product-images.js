(function(){
 'use strict';
 function fallback(product){var art=product.illustration || product.art;return 'assets/images/product-'+(['onigiri','bento','ramen','tea','soda','chips','candy','pantry'].includes(art)?art:'pantry')+'.svg';}
 function source(product){var value=String(product.image_url || '').trim();
  if(/^assets\/images\/[A-Za-z0-9_./-]+$/.test(value) && !value.includes('..'))return value;
  try {var url=new URL(value);if(url.protocol==='https:')return url.href;if(window.UMAI_DEMO && (url.protocol==='blob:' || url.protocol==='data:'))return url.href;}catch(error){}
  return fallback(product);
 }
 function apply(img,product){img.src=source(product);img.onerror=function(){img.onerror=null;img.src=fallback(product);};}
 window.UMAI_PRODUCT_IMAGES={source:source,apply:apply};
}());
