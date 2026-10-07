export function whatsappNumber(raw:string|null|undefined):string|null{
 const input=(raw??"").trim();if(/[A-Za-z]/.test(input))return null;
 let digits=input.replace(/[^0-9]/g,"");
 if(digits.startsWith("00"))digits=digits.slice(2);
 if(/^09\d{8}$/.test(digits))digits="593"+digits.slice(1);
 else if(/^9\d{8}$/.test(digits))digits="593"+digits;
 return /^[1-9]\d{7,14}$/.test(digits)?digits:null;
}
export function whatsappLink(phone:string|null|undefined,message:string){const n=whatsappNumber(phone);return n?"https://wa.me/"+n+"?text="+encodeURIComponent(message):null;}
