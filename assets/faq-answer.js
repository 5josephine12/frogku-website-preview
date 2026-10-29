// The static preview uses the same public FAQ, aliases and scoring as the server.
const normalize=value=>String(value).toLowerCase().replace(/[^\p{L}\p{N}_\s]/gu,' ').replace(/\s+/g,' ').trim();
export function faqAnswer(message,content,localize=value=>value){
 const normalized=normalize(message),tokens=new Set(normalized.split(' '));
 for(const word of [...tokens])if(word.endsWith('nya')&&word.length>5)tokens.add(word.slice(0,-3));
 const scores=content.faqs.map((item,index)=>{
  let score=0;
  for(const term of new Set([...item.keywords,...(content.chatAliases[index]||[])])){
   if(/[\u4e00-\u9fff]/.test(term))score+=normalized.includes(term)?4:0;
   else if(term.includes(' '))score+=normalized.includes(term)?5:0;
   else if(tokens.has(term))score+=3;
  }
  if([normalize(item.q),normalize(localize(item.q))].includes(normalized))score+=20;
  return score;
 });
 const best=scores.indexOf(Math.max(...scores)),matched=scores[best]>0;
 const source=matched?content.faqs[best].a:content.chatFallback;
 return {message:localize(source),source_original:source,mode:'faq',matched:matched?content.faqs[best].q:null};
}
