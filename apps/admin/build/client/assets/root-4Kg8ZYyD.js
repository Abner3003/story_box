import{o as y,p as x,q as S,t as w,r as a,_ as f,v as i,n as t,M as g,L as j,O as v,S as k}from"./components-CAlMRUE5.js";/**
 * @remix-run/react v2.17.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let l="positions";function M({getKey:r,...c}){let{isSpaMode:u}=y(),o=x(),d=S();w({getKey:r,storageKey:l});let p=a.useMemo(()=>{if(!r)return null;let e=r(o,d);return e!==o.key?e:null},[]);if(u)return null;let m=((e,h)=>{if(!window.history.state||!window.history.state.key){let s=Math.random().toString(32).slice(2);window.history.replaceState({key:s},"")}try{let n=JSON.parse(sessionStorage.getItem(e)||"{}")[h||window.history.state.key];typeof n=="number"&&window.scrollTo(0,n)}catch(s){console.error(s),sessionStorage.removeItem(e)}}).toString();return a.createElement("script",f({},c,{suppressHydrationWarning:!0,dangerouslySetInnerHTML:{__html:`(${m})(${i(JSON.stringify(l))}, ${i(JSON.stringify(p))})`}}))}const O="/assets/global-CEwjau2G.css",E=()=>[{rel:"stylesheet",href:O}],L=()=>[{title:"StoryBox Admin"},{name:"description",content:"Portal administrativo para revisar livros gerados e aprovar entregas."}];function _(){return t.jsxs("html",{lang:"pt-BR",children:[t.jsxs("head",{children:[t.jsx("meta",{charSet:"utf-8"}),t.jsx("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),t.jsx(g,{}),t.jsx(j,{})]}),t.jsxs("body",{children:[t.jsx(v,{}),t.jsx(M,{}),t.jsx(k,{})]})]})}export{_ as default,E as links,L as meta};
