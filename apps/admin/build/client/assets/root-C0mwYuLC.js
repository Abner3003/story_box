import{o as x,p as y,q as S,t as f,r as i,_ as w,v as a,n as t,M as g,L as j,O as v,S as k}from"./components-2Vs_WVIy.js";/**
 * @remix-run/react v2.17.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let l="positions";function M({getKey:r,...c}){let{isSpaMode:d}=x(),o=y(),p=S();f({getKey:r,storageKey:l});let u=i.useMemo(()=>{if(!r)return null;let e=r(o,p);return e!==o.key?e:null},[]);if(d)return null;let m=((e,h)=>{if(!window.history.state||!window.history.state.key){let s=Math.random().toString(32).slice(2);window.history.replaceState({key:s},"")}try{let n=JSON.parse(sessionStorage.getItem(e)||"{}")[h||window.history.state.key];typeof n=="number"&&window.scrollTo(0,n)}catch(s){console.error(s),sessionStorage.removeItem(e)}}).toString();return i.createElement("script",w({},c,{suppressHydrationWarning:!0,dangerouslySetInnerHTML:{__html:`(${m})(${a(JSON.stringify(l))}, ${a(JSON.stringify(u))})`}}))}const O="/assets/global-D2YxPb8E.css",b=()=>[{rel:"stylesheet",href:O}],E=()=>[{title:"StoryBox Admin"},{name:"description",content:"Portal administrativo para revisar livros gerados e aprovar entregas."}];function L(){return t.jsxs("html",{lang:"pt-BR",children:[t.jsxs("head",{children:[t.jsx("meta",{charSet:"utf-8"}),t.jsx("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),t.jsx(g,{}),t.jsx(j,{})]}),t.jsxs("body",{children:[t.jsx(v,{}),t.jsx(M,{}),t.jsx(k,{})]})]})}export{L as default,b as links,E as meta};
