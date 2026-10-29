export function duplicateStep(items,index,key='id'){
 if(index<0||index>=items.length)return items;
 const source=items[index];
 const copy=source&&typeof source==='object'?{...structuredClone(source),[key]:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`}:source;
 return [...items.slice(0,index+1),copy,...items.slice(index+1)];
}
