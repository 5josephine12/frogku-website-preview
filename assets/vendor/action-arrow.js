// Destination-requested Lucide 1.60.0 glyphs (ISC), exact pinned library nodes.
// Preserve the existing action adapter API, geometry and reversible motion hooks.
const arrowNodes={"right":[["path",{"d":"M5 12h14"}],["path",{"d":"m12 5 7 7-7 7"}]],"up-right":[["path",{"d":"M7 7h10v10"}],["path",{"d":"M7 17 17 7"}]],"left":[["path",{"d":"m12 19-7-7 7-7"}],["path",{"d":"M19 12H5"}]]};
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function actionArrowMarkup({direction='up-right',className='',attributes={}}={}){
 const node=arrowNodes[direction]||arrowNodes['up-right'];
 const paths=node.map(([tag,attrs])=>`<${tag} ${Object.entries(attrs).map(([key,value])=>`${key}="${escape(value)}"`).join(' ')} vector-effect="non-scaling-stroke"/>`).join('');
 return `<svg class="action-arrow${className?' '+escape(className):''}" data-action-arrow="${escape(direction)}" width="1.3em" height="1.3em" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" focusable="false" ${Object.entries(attributes).map(([key,value])=>`${escape(key)}="${escape(value)}"`).join(' ')}>${paths}</svg>`;
}
