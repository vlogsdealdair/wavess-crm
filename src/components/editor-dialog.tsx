"use client";
import {useEffect,useRef} from "react";
export function EditorDialog({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const d=ref.current;if(d&&!d.open)d.showModal();return()=>{if(d?.open)d.close();};},[]);
 return <dialog ref={ref} className="editor-dialog" aria-label={title} onCancel={onClose}><header><h2>{title}</h2><button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">×</button></header>{children}</dialog>;
}
