var fs=Object.defineProperty;var ms=(e,t,r)=>t in e?fs(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var Gt=(e,t,r)=>ms(e,typeof t!="symbol"?t+"":t,r);import{host as yu,ROUTES_AREA as vu,SIDEBAR_NAV_AREA as wu}from"@hermes/plugin-sdk";import{useCallback as _u,useEffect as xu,useRef as ps,useState as Ft}from"react";var ze=globalThis,Tt=ze.ShadowRoot&&(ze.ShadyCSS===void 0||ze.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Xr=Symbol(),Kt=new WeakMap,ys=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==Xr)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(Tt&&e===void 0){let r=t!==void 0&&t.length===1;r&&(e=Kt.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&Kt.set(t,e))}return e}toString(){return this.cssText}},vs=e=>new ys(typeof e=="string"?e:e+"",void 0,Xr),ws=(e,t)=>{if(Tt)e.adoptedStyleSheets=t.map(r=>r instanceof CSSStyleSheet?r:r.styleSheet);else for(let r of t){let a=document.createElement("style"),s=ze.litNonce;s!==void 0&&a.setAttribute("nonce",s),a.textContent=r.cssText,e.appendChild(a)}},Yt=Tt?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let r="";for(let a of t.cssRules)r+=a.cssText;return vs(r)})(e):e;var{is:_s,defineProperty:xs,getOwnPropertyDescriptor:$s,getOwnPropertyNames:ks,getOwnPropertySymbols:As,getPrototypeOf:Es}=Object,X=globalThis,Xt=X.trustedTypes,Ts=Xt?Xt.emptyScript:"",Ss=X.reactiveElementPolyfillSupport,$e=(e,t)=>e,ht={toAttribute(e,t){switch(t){case Boolean:e=e?Ts:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let r=e;switch(t){case Boolean:r=e!==null;break;case Number:r=e===null?null:Number(e);break;case Object:case Array:try{r=JSON.parse(e)}catch{r=null}}return r}},Jr=(e,t)=>!_s(e,t),Jt={attribute:!0,type:String,converter:ht,reflect:!1,useDefault:!1,hasChanged:Jr};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),X.litPropertyMetadata??(X.litPropertyMetadata=new WeakMap);var ue=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Jt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let r=Symbol(),a=this.getPropertyDescriptor(e,r,t);a!==void 0&&xs(this.prototype,e,a)}}static getPropertyDescriptor(e,t,r){let{get:a,set:s}=$s(this.prototype,e)??{get(){return this[t]},set(o){this[t]=o}};return{get:a,set(o){let n=a?.call(this);s?.call(this,o),this.requestUpdate(e,n,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Jt}static _$Ei(){if(this.hasOwnProperty($e("elementProperties")))return;let e=Es(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty($e("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($e("properties"))){let t=this.properties,r=[...ks(t),...As(t)];for(let a of r)this.createProperty(a,t[a])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[r,a]of t)this.elementProperties.set(r,a)}this._$Eh=new Map;for(let[t,r]of this.elementProperties){let a=this._$Eu(t,r);a!==void 0&&this._$Eh.set(a,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let r=new Set(e.flat(1/0).reverse());for(let a of r)t.unshift(Yt(a))}else e!==void 0&&t.push(Yt(e));return t}static _$Eu(e,t){let r=t.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let r of t.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ws(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,r){this._$AK(e,r)}_$ET(e,t){let r=this.constructor.elementProperties.get(e),a=this.constructor._$Eu(e,r);if(a!==void 0&&r.reflect===!0){let s=(r.converter?.toAttribute!==void 0?r.converter:ht).toAttribute(t,r.type);this._$Em=e,s==null?this.removeAttribute(a):this.setAttribute(a,s),this._$Em=null}}_$AK(e,t){let r=this.constructor,a=r._$Eh.get(e);if(a!==void 0&&this._$Em!==a){let s=r.getPropertyOptions(a),o=typeof s.converter=="function"?{fromAttribute:s.converter}:s.converter?.fromAttribute!==void 0?s.converter:ht;this._$Em=a;let n=o.fromAttribute(t,s.type);this[a]=n??this._$Ej?.get(a)??n,this._$Em=null}}requestUpdate(e,t,r,a=!1,s){if(e!==void 0){let o=this.constructor;if(a===!1&&(s=this[e]),r??(r=o.getPropertyOptions(e)),!((r.hasChanged??Jr)(s,t)||r.useDefault&&r.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,r))))return;this.C(e,t,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:r,reflect:a,wrapped:s},o){r&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,o??t??this[e]),s!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(t=void 0),this._$AL.set(e,t)),a===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[a,s]of this._$Ep)this[a]=s;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[a,s]of r){let{wrapped:o}=s,n=this[a];o!==!0||this._$AL.has(a)||n===void 0||this.C(a,void 0,s,n)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(t)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(t=>this._$ET(t,this[t]))),this._$EM()}updated(e){}firstUpdated(e){}};ue.elementStyles=[],ue.shadowRootOptions={mode:"open"},ue[$e("elementProperties")]=new Map,ue[$e("finalized")]=new Map,Ss?.({ReactiveElement:ue}),(X.reactiveElementVersions??(X.reactiveElementVersions=[])).push("2.1.2");var ke=globalThis,Zt=e=>e,We=ke.trustedTypes,Qt=We?We.createPolicy("lit-html",{createHTML:e=>e}):void 0,St="$lit$",V=`lit$${Math.random().toFixed(9).slice(2)}$`,Rt="?"+V,Rs=`<${Rt}>`,ae=document,Se=()=>ae.createComment(""),Re=e=>e===null||typeof e!="object"&&typeof e!="function",Mt=Array.isArray,Zr=e=>Mt(e)||typeof e?.[Symbol.iterator]=="function",ct=`[ 	
\f\r]`,we=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,er=/-->/g,tr=/>/g,ee=RegExp(`>|${ct}(?:([^\\s"'>=/]+)(${ct}*=${ct}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),rr=/'/g,ar=/"/g,Qr=/^(?:script|style|textarea|title)$/i,ea=e=>(t,...r)=>({_$litType$:e,strings:t,values:r}),u=ea(1),_=ea(2),se=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),sr=new WeakMap,te=ae.createTreeWalker(ae,129);function ta(e,t){if(!Mt(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return Qt!==void 0?Qt.createHTML(t):t}var ra=(e,t)=>{let r=e.length-1,a=[],s,o=t===2?"<svg>":t===3?"<math>":"",n=we;for(let i=0;i<r;i++){let l=e[i],c,b,h=-1,y=0;for(;y<l.length&&(n.lastIndex=y,b=n.exec(l),b!==null);)y=n.lastIndex,n===we?b[1]==="!--"?n=er:b[1]!==void 0?n=tr:b[2]!==void 0?(Qr.test(b[2])&&(s=RegExp("</"+b[2],"g")),n=ee):b[3]!==void 0&&(n=ee):n===ee?b[0]===">"?(n=s??we,h=-1):b[1]===void 0?h=-2:(h=n.lastIndex-b[2].length,c=b[1],n=b[3]===void 0?ee:b[3]==='"'?ar:rr):n===ar||n===rr?n=ee:n===er||n===tr?n=we:(n=ee,s=void 0);let v=n===ee&&e[i+1].startsWith("/>")?" ":"";o+=n===we?l+Rs:h>=0?(a.push(c),l.slice(0,h)+St+l.slice(h)+V+v):l+V+(h===-2?i:v)}return[ta(e,o+(e[r]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),a]},pt=class aa{constructor({strings:t,_$litType$:r},a){let s;this.parts=[];let o=0,n=0,i=t.length-1,l=this.parts,[c,b]=ra(t,r);if(this.el=aa.createElement(c,a),te.currentNode=this.el.content,r===2||r===3){let h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(s=te.nextNode())!==null&&l.length<i;){if(s.nodeType===1){if(s.hasAttributes())for(let h of s.getAttributeNames())if(h.endsWith(St)){let y=b[n++],v=s.getAttribute(h).split(V),w=/([.?@])?(.*)/.exec(y);l.push({type:1,index:o,name:w[2],strings:v,ctor:w[1]==="."?na:w[1]==="?"?ia:w[1]==="@"?da:Oe}),s.removeAttribute(h)}else h.startsWith(V)&&(l.push({type:6,index:o}),s.removeAttribute(h));if(Qr.test(s.tagName)){let h=s.textContent.split(V),y=h.length-1;if(y>0){s.textContent=We?We.emptyScript:"";for(let v=0;v<y;v++)s.append(h[v],Se()),te.nextNode(),l.push({type:2,index:++o});s.append(h[y],Se())}}}else if(s.nodeType===8)if(s.data===Rt)l.push({type:2,index:o});else{let h=-1;for(;(h=s.data.indexOf(V,h+1))!==-1;)l.push({type:7,index:o}),h+=V.length-1}o++}}static createElement(t,r){let a=ae.createElement("template");return a.innerHTML=t,a}};function oe(e,t,r=e,a){if(t===se)return t;let s=a!==void 0?r._$Co?.[a]:r._$Cl,o=Re(t)?void 0:t._$litDirective$;return s?.constructor!==o&&(s?._$AO?.(!1),o===void 0?s=void 0:(s=new o(e),s._$AT(e,r,a)),a!==void 0?(r._$Co??(r._$Co=[]))[a]=s:r._$Cl=s),s!==void 0&&(t=oe(e,s._$AS(e,t.values),s,a)),t}var sa=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:r}=this._$AD,a=(e?.creationScope??ae).importNode(t,!0);te.currentNode=a;let s=te.nextNode(),o=0,n=0,i=r[0];for(;i!==void 0;){if(o===i.index){let l;i.type===2?l=new Qe(s,s.nextSibling,this,e):i.type===1?l=new i.ctor(s,i.name,i.strings,this,e):i.type===6&&(l=new la(s,this,e)),this._$AV.push(l),i=r[++n]}o!==i?.index&&(s=te.nextNode(),o++)}return te.currentNode=ae,a}p(e){let t=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,t),t+=r.strings.length-2):r._$AI(e[t])),t++}},Qe=class oa{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,r,a,s){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=t,this._$AB=r,this._$AM=a,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,r=this._$AM;return r!==void 0&&t?.nodeType===11&&(t=r.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,r=this){t=oe(this,t,r),Re(t)?t===p||t==null||t===""?(this._$AH!==p&&this._$AR(),this._$AH=p):t!==this._$AH&&t!==se&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Zr(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==p&&Re(this._$AH)?this._$AA.nextSibling.data=t:this.T(ae.createTextNode(t)),this._$AH=t}$(t){let{values:r,_$litType$:a}=t,s=typeof a=="number"?this._$AC(t):(a.el===void 0&&(a.el=pt.createElement(ta(a.h,a.h[0]),this.options)),a);if(this._$AH?._$AD===s)this._$AH.p(r);else{let o=new sa(s,this),n=o.u(this.options);o.p(r),this.T(n),this._$AH=o}}_$AC(t){let r=sr.get(t.strings);return r===void 0&&sr.set(t.strings,r=new pt(t)),r}k(t){Mt(this._$AH)||(this._$AH=[],this._$AR());let r=this._$AH,a,s=0;for(let o of t)s===r.length?r.push(a=new oa(this.O(Se()),this.O(Se()),this,this.options)):a=r[s],a._$AI(o),s++;s<r.length&&(this._$AR(a&&a._$AB.nextSibling,s),r.length=s)}_$AR(t=this._$AA.nextSibling,r){for(this._$AP?.(!1,!0,r);t!==this._$AB;){let a=Zt(t).nextSibling;Zt(t).remove(),t=a}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},Oe=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,r,a,s){this.type=1,this._$AH=p,this._$AN=void 0,this.element=e,this.name=t,this._$AM=a,this.options=s,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=p}_$AI(e,t=this,r,a){let s=this.strings,o=!1;if(s===void 0)e=oe(this,e,t,0),o=!Re(e)||e!==this._$AH&&e!==se,o&&(this._$AH=e);else{let n=e,i,l;for(e=s[0],i=0;i<s.length-1;i++)l=oe(this,n[r+i],t,i),l===se&&(l=this._$AH[i]),o||(o=!Re(l)||l!==this._$AH[i]),l===p?e=p:e!==p&&(e+=(l??"")+s[i+1]),this._$AH[i]=l}o&&!a&&this.j(e)}j(e){e===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},na=class extends Oe{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===p?void 0:e}},ia=class extends Oe{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==p)}},da=class extends Oe{constructor(e,t,r,a,s){super(e,t,r,a,s),this.type=5}_$AI(e,t=this){if((e=oe(this,e,t,0)??p)===se)return;let r=this._$AH,a=e===p&&r!==p||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,s=e!==p&&(r===p||a);a&&this.element.removeEventListener(this.name,this,r),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},la=class{constructor(e,t,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){oe(this,e)}},Ms={M:St,P:V,A:Rt,C:1,L:ra,R:sa,D:Zr,V:oe,I:Qe,H:Oe,N:ia,U:da,B:na,F:la},Is=ke.litHtmlPolyfillSupport;Is?.(pt,Qe),(ke.litHtmlVersions??(ke.litHtmlVersions=[])).push("3.3.3");var It=(e,t,r)=>{let a=r?.renderBefore??t,s=a._$litPart$;if(s===void 0){let o=r?.renderBefore??null;a._$litPart$=s=new Qe(t.insertBefore(Se(),o),o,void 0,r??{})}return s._$AI(e),s};var Ae=globalThis,pe=class extends ue{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;let e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=It(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return se}};pe._$litElement$=!0,pe.finalized=!0,Ae.litElementHydrateSupport?.({LitElement:pe});var Cs=Ae.litElementPolyfillSupport;Cs?.({LitElement:pe});(Ae.litElementVersions??(Ae.litElementVersions=[])).push("4.2.2");var ca=["health","system-presence","usage.status","usage.cost","agents.list","sessions.list","sessions.resolve","sessions.get","sessions.usage","sessions.usage.timeseries","sessions.usage.logs","node.list","node.describe","cron.get","cron.list","cron.status","cron.runs","dashboard.connector.list"],ua=["presence","sessions.changed","boardstate.changed"],Ns=["sum","avg","min","max","last","count","pick","format"],or=class extends Error{constructor(t,r){super(r);Gt(this,"code");this.code=t,this.name="DashboardBindingResolutionError"}};function Ps(e){for(let t of e){let r=t.charCodeAt(0);if(r<32||r===127)return!0}return!1}function Os(e){if(e.startsWith("/")||/^([a-zA-Z]:[\\/]|[\\/])/.test(e)||Ps(e))throw new or("binding_invalid","file binding path is invalid");let t=e.replaceAll("\\","/").split("/").filter(Boolean);if(t.length===0||t.some(r=>r==="."||r===".."||r.includes(":")))throw new or("binding_invalid","file binding path is invalid");return t.join("/")}var ba=/^[a-z0-9-]{1,40}$/,Bs=/^(user|system|agent:[A-Za-z0-9._-]{1,64})$/,Ls=/^agent:[A-Za-z0-9._-]{1,64}$/,Ds=new Set(["shared","private"]),Us=/^[A-Za-z0-9:._-]{1,128}$/,zs=/^[A-Za-z0-9_-]{1,48}$/,Ws=/^builtin:(stat-card|markdown|table|iframe-embed|sessions|usage|cron|instances|activity|chart|notes|action-form|action-button|preview|agent-status|approvals|chat)$/,Hs=/^custom:[A-Za-z0-9._-]{1,64}$/,js=/^[A-Za-z0-9._-]{1,64}$/,et=/^[A-Za-z0-9._-]{1,64}$/,Ct=/^[A-Za-z0-9._-]{1,64}$/,nr=/^[A-Za-z0-9._-]{1,64}:[A-Za-z0-9._-]{1,64}$/,ir=64,qs=/^[A-Za-z0-9._+/=-]{1,128}$/,Fs=8*1024,ha=/^[A-Za-z0-9._-]{1,64}$/,Vs=8*1024,dr=32,pa=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,lr=/^[A-Za-z0-9_]{1,32}$/,Gs=/\{([A-Za-z0-9_]+)\}/g,cr=2e3,Ue=8,ur=20,Ks=1e3,Ys=["text","number","select"];function Nt(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function C(e,t){if(!Nt(e))throw new Error(`${t} must be an object`);return e}function M(e,t,r){for(let a of Object.keys(e))if(!t.includes(a))throw new Error(`${r}.${a} is not allowed`)}function E(e,t,r){let a=e[t];if(typeof a!="string")throw new Error(`${r}.${t} must be a string`);return a}function L(e,t,r){let a=e[t];if(a!==void 0){if(typeof a!="string")throw new Error(`${r}.${t} must be a string`);return a}}function gt(e,t,r){let a=e[t];if(typeof a!="boolean")throw new Error(`${r}.${t} must be a boolean`);return a}function j(e,t){if(!Array.isArray(e))throw new Error(`${t} must be an array`);return e}function He(e,t){if(typeof e!="string"||!Bs.test(e))throw new Error(`${t} createdBy is invalid`);return e}function be(e,t,r,a){if(!Number.isInteger(e)||e<r||e>a)throw new Error(`${t} must be an integer from ${r} to ${a}`);return e}function Xs(e,t){let r=C(e,t);M(r,["x","y","w","h"],t);let a={x:be(r.x,`${t}.x`,0,11),y:be(r.y,`${t}.y`,0,499),w:be(r.w,`${t}.w`,1,12),h:be(r.h,`${t}.h`,1,20)};if(a.x+a.w>12)throw new Error(`${t}.x + w must be 12 or less`);return a}function Me(e,t){if(e===null||typeof e=="string"||typeof e=="boolean"||typeof e=="number"&&Number.isFinite(e))return e;if(Array.isArray(e))return e.map((r,a)=>Me(r,`${t}[${a}]`));if(Nt(e)){let r={};for(let[a,s]of Object.entries(e))r[a]=Me(s,`${t}.${a}`);return r}throw new Error(`${t} must be JSON-serializable`)}function ga(e){return new TextEncoder().encode(JSON.stringify(e)).length}function Js(e,t){let r=C(e,t),a=E(r,"source",t);if(a==="rpc"){M(r,["source","method"],t);let s=E(r,"method",t);if(!ca.includes(s))throw new Error(`${t}.method is not allowlisted`);return{source:a,method:s}}if(a==="file"){M(r,["source","path","pointer"],t);let s=E(r,"path",t);Os(s);let o=L(r,"pointer",t);return{source:a,path:s,...o!==void 0?{pointer:o}:{}}}if(a==="static"){M(r,["source","value"],t);let s=Me(r.value,`${t}.value`);if(ga(s)>Vs)throw new Error(`${t}.value must serialize to 8 KB or less`);return{source:a,value:s}}if(a==="stream"){M(r,["source","event","pointer"],t);let s=E(r,"event",t);if(!ua.includes(s))throw new Error(`${t}.event is not allowlisted`);let o=L(r,"pointer",t);if(o!==void 0&&!o.startsWith("/"))throw new Error(`${t}.pointer must be a JSON pointer`);return{source:a,event:s,...o!==void 0?{pointer:o}:{}}}if(a==="computed"){M(r,["source","op","inputs","arg"],t);let s=E(r,"op",t);if(!Ns.includes(s))throw new Error(`${t}.op is not a valid computed op`);let o=j(r.inputs,`${t}.inputs`);if(o.length<1||o.length>dr)throw new Error(`${t}.inputs must contain 1 to ${dr} entries`);let n=o.map((c,b)=>{if(typeof c!="string"||!ha.test(c))throw new Error(`${t}.inputs[${b}] is invalid`);return c}),i=s==="pick"||s==="format",l=L(r,"arg",t);if(i&&(l===void 0||l.length===0))throw new Error(`${t}.arg is required for the ${s} op`);if(!i&&l!==void 0)throw new Error(`${t}.arg is not allowed for the ${s} op`);if(s==="pick"&&l!==void 0&&!l.startsWith("/"))throw new Error(`${t}.arg must be a JSON pointer for the pick op`);return{source:a,op:s,inputs:n,...l!==void 0?{arg:l}:{}}}if(a==="mcp"){M(r,["source","connector","tool","args"],t);let s=E(r,"connector",t);if(!et.test(s))throw new Error(`${t}.connector is invalid`);let o=E(r,"tool",t);if(!Ct.test(o))throw new Error(`${t}.tool is invalid`);let n=fa(r.args,`${t}.args`);return{source:a,connector:s,tool:o,...n!==void 0?{args:n}:{}}}throw new Error(`${t}.source is invalid`)}function fa(e,t){if(e===void 0)return;let r=Me(e,t);if(!Nt(r))throw new Error(`${t} must be an object`);if(ga(r)>Fs)throw new Error(`${t} must serialize to 8 KB or less`);return r}function Zs(e,t){let r=C(e,t),a={};for(let[s,o]of Object.entries(r)){if(!ha.test(s))throw new Error(`${t}.${s} binding id is invalid`);a[s]=Js(o,`${t}.${s}`)}for(let[s,o]of Object.entries(a))if(o.source==="computed")for(let n of o.inputs){let i=a[n];if(!i)throw new Error(`${t}.${s}.inputs references unknown binding: ${n}`);if(i.source==="computed")throw new Error(`${t}.${s}.inputs may not reference another computed binding: ${n}`)}return a}function Qs(e,t){let r=C(e,t);M(r,["expiresAt"],t);let a=E(r,"expiresAt",t);if(!pa.test(a)||Number.isNaN(Date.parse(a)))throw new Error(`${t}.expiresAt must be an ISO 8601 timestamp`);return{expiresAt:a}}function eo(e,t){let r=C(e,t);M(r,["template","fields","buttonLabel","mode","connector","tool","argsFrom"],t);let a=E(r,"template",t);if(a.length<1||a.length>cr)throw new Error(`${t}.template must be 1-${cr} characters`);let s=j(r.fields,`${t}.fields`);if(s.length<1||s.length>Ue)throw new Error(`${t}.fields must contain 1 to ${Ue} entries`);let o=new Set;if(s.forEach((i,l)=>{let c=`${t}.fields[${l}]`,b=C(i,c);M(b,["name","label","type","options","maxLength"],c);let h=E(b,"name",c);if(!lr.test(h))throw new Error(`${c}.name is invalid`);if(o.has(h))throw new Error(`${c}.name is a duplicate: ${h}`);o.add(h);let y=E(b,"label",c);if(y.length<1||y.length>80)throw new Error(`${c}.label must be 1-80 characters`);let v=E(b,"type",c);if(!Ys.includes(v))throw new Error(`${c}.type must be text, number, or select`);if(v==="select"){let w=j(b.options,`${c}.options`);if(w.length<1||w.length>ur)throw new Error(`${c}.options must contain 1 to ${ur} entries`);w.forEach((f,x)=>{if(typeof f!="string"||f.length<1||f.length>80)throw new Error(`${c}.options[${x}] must be a 1-80 character string`)})}else if(b.options!==void 0)throw new Error(`${c}.options is only allowed for select fields`);b.maxLength!==void 0&&be(b.maxLength,`${c}.maxLength`,1,Ks)}),r.buttonLabel!==void 0){let i=E(r,"buttonLabel",t);if(i.length<1||i.length>40)throw new Error(`${t}.buttonLabel must be 1-40 characters`)}for(let i of a.matchAll(Gs)){let l=i[1];if(!o.has(l))throw new Error(`${t}.template references unknown field: {${l}}`)}let n=L(r,"mode",t);if(n!==void 0&&n!=="prompt"&&n!=="tool")throw new Error(`${t}.mode must be "prompt" or "tool"`);if(n==="tool"){let i=E(r,"connector",t);if(!et.test(i))throw new Error(`${t}.connector is invalid`);let l=E(r,"tool",t);if(!Ct.test(l))throw new Error(`${t}.tool is invalid`);if(r.argsFrom!==void 0){let c=C(r.argsFrom,`${t}.argsFrom`),b=Object.entries(c);if(b.length>Ue)throw new Error(`${t}.argsFrom must contain at most ${Ue} entries`);for(let[h,y]of b){if(!lr.test(h))throw new Error(`${t}.argsFrom key is invalid: ${h}`);if(typeof y!="string"||!o.has(y))throw new Error(`${t}.argsFrom references unknown field: ${String(y)}`)}}}else for(let i of["connector","tool","argsFrom"])if(r[i]!==void 0)throw new Error(`${t}.${i} is only allowed when mode is "tool"`)}function to(e,t){let r=C(e,t);M(r,["connector","tool","args","label"],t);let a=E(r,"connector",t);if(!et.test(a))throw new Error(`${t}.connector is invalid`);let s=E(r,"tool",t);if(!Ct.test(s))throw new Error(`${t}.tool is invalid`);fa(r.args,`${t}.args`);let o=L(r,"label",t);if(o!==void 0&&(o.length<1||o.length>40))throw new Error(`${t}.label must be 1-40 characters`)}function ro(e,t){let r=C(e,t);M(r,["id","kind","title","grid","collapsed","hidden","bindings","props","ephemeral"],t);let a=E(r,"id",t);if(!zs.test(a))throw new Error(`${t}.id is invalid`);let s=E(r,"kind",t);if(!Ws.test(s)&&!Hs.test(s))throw new Error(`${t}.kind is invalid`);let o=L(r,"title",t);if(o!==void 0&&o.length>80)throw new Error(`${t}.title must be 80 characters or fewer`);let n=r.bindings===void 0?void 0:Zs(r.bindings,`${t}.bindings`),i=r.props===void 0?void 0:Me(r.props,`${t}.props`),l=r.ephemeral===void 0?void 0:Qs(r.ephemeral,`${t}.ephemeral`);return s==="builtin:action-form"&&eo(i,`${t}.props`),s==="builtin:action-button"&&to(i,`${t}.props`),{id:a,kind:s,...o!==void 0?{title:o}:{},grid:Xs(r.grid,`${t}.grid`),collapsed:gt(r,"collapsed",t),hidden:gt(r,"hidden",t),...n!==void 0?{bindings:n}:{},...i!==void 0?{props:i}:{},...l!==void 0?{ephemeral:l}:{}}}function ao(e,t){if(e!==void 0){if(e!=="grid"&&e!=="full")throw new Error(`${t}.layout must be "grid" or "full"`);return e}}function so(e,t){if(e!==void 0){if(typeof e!="string"||!Ds.has(e))throw new Error(`${t}.visibility must be "shared" or "private"`);return e}}function oo(e,t){let r=C(e,t);M(r,["slug","title","icon","hidden","layout","createdBy","visibility","owner","widgets"],t);let a=E(r,"slug",t);if(!ba.test(a))throw new Error(`${t}.slug is invalid`);let s=E(r,"title",t);if(s.length<1||s.length>80)throw new Error(`${t}.title must be 1-80 characters`);let o=L(r,"icon",t);if(o!==void 0&&o.length>40)throw new Error(`${t}.icon must be 40 characters or fewer`);let n=ao(r.layout,t),i=so(r.visibility,t),l=L(r,"owner",t);if(l!==void 0&&!Us.test(l))throw new Error(`${t}.owner is invalid`);if(i==="private"&&l===void 0)throw new Error(`${t}.owner is required when the tab is private`);let c=j(r.widgets,`${t}.widgets`);if(c.length>24)throw new Error(`${t}.widgets must contain at most 24 entries`);return{slug:a,title:s,...o!==void 0?{icon:o}:{},hidden:gt(r,"hidden",t),...n!==void 0?{layout:n}:{},createdBy:He(r.createdBy,`${t}.createdBy`),...i==="private"?{visibility:i}:{},...l!==void 0?{owner:l}:{},widgets:c.map((b,h)=>ro(b,`${t}.widgets[${h}]`))}}function no(e,t){let r=C(e,t);M(r,["status","createdBy","approvedBy","approvedAt"],t);let a=E(r,"status",t);if(a!=="pending"&&a!=="approved"&&a!=="rejected")throw new Error(`${t}.status is invalid`);let s=r.approvedBy===void 0?void 0:He(r.approvedBy,`${t}.approvedBy`),o=L(r,"approvedAt",t);return{status:a,createdBy:He(r.createdBy,`${t}.createdBy`),...s!==void 0?{approvedBy:s}:{},...o!==void 0?{approvedAt:o}:{}}}function io(e){let t=C(e,"widgetsRegistry"),r={};for(let[a,s]of Object.entries(t)){if(!js.test(a))throw new Error(`widgetsRegistry.${a} name is invalid`);r[a]=no(s,`widgetsRegistry.${a}`)}return r}var lo=new Set(["requested","granted","revoked"]);function co(e,t){let r=C(e,t);M(r,["status","methods","streams","tools","toolsHash","autoConfirm","expiresAt","agents","description","grantedBy","grantedAt"],t);let a=r.status;if(typeof a!="string"||!lo.has(a))throw new Error(`${t}.status must be requested, granted, or revoked`);let s=br(r.methods,`${t}.methods`,ca,"allowlisted read method"),o=br(r.streams,`${t}.streams`,ua,"allowlisted stream channel"),n=r.tools===void 0?void 0:j(r.tools,`${t}.tools`).map((w,f)=>{if(typeof w!="string"||w.length>ir||!nr.test(w))throw new Error(`${t}.tools[${f}] is not a valid connector:tool id`);return w});if(n!==void 0&&new Set(n).size!==n.length)throw new Error(`${t}.tools contains duplicate tool ids`);let i=L(r,"toolsHash",t);if(i!==void 0&&!qs.test(i))throw new Error(`${t}.toolsHash is invalid`);let l=r.autoConfirm===void 0?void 0:j(r.autoConfirm,`${t}.autoConfirm`).map((w,f)=>{if(typeof w!="string"||w.length>ir||!nr.test(w))throw new Error(`${t}.autoConfirm[${f}] is not a valid connector:tool id`);return w});if(l!==void 0){if(new Set(l).size!==l.length)throw new Error(`${t}.autoConfirm contains duplicate tool ids`);let w=new Set(n??[]);for(let f of l)if(!w.has(f))throw new Error(`${t}.autoConfirm[${f}] is not one of the grant's tools`)}let c=L(r,"expiresAt",t);if(c!==void 0&&(!pa.test(c)||Number.isNaN(Date.parse(c))))throw new Error(`${t}.expiresAt must be an ISO 8601 timestamp`);let b=r.agents===void 0?void 0:j(r.agents,`${t}.agents`).map((w,f)=>{if(typeof w!="string"||!Ls.test(w))throw new Error(`${t}.agents[${f}] is not a valid agent actor`);return w});if(b!==void 0){if(b.length===0)throw new Error(`${t}.agents must be a non-empty array (omit it to allow all agents)`);if(new Set(b).size!==b.length)throw new Error(`${t}.agents contains duplicate actors`)}let h=L(r,"description",t);if(h!==void 0&&h.length>200)throw new Error(`${t}.description must be 200 characters or fewer`);let y=r.grantedBy===void 0?void 0:He(r.grantedBy,`${t}.grantedBy`),v=L(r,"grantedAt",t);return{status:a,methods:s,streams:o,...n!==void 0?{tools:n}:{},...i!==void 0?{toolsHash:i}:{},...l!==void 0?{autoConfirm:l}:{},...c!==void 0?{expiresAt:c}:{},...b!==void 0?{agents:b}:{},...h!==void 0?{description:h}:{},...y!==void 0?{grantedBy:y}:{},...v!==void 0?{grantedAt:v}:{}}}function br(e,t,r,a){return j(e,t).map((s,o)=>{if(typeof s!="string"||!r.includes(s))throw new Error(`${t}[${o}] is not an ${a}`);return s})}function uo(e){if(e===void 0)return{};let t=C(e,"capabilitiesRegistry"),r={};for(let[a,s]of Object.entries(t)){if(!et.test(a))throw new Error(`capabilitiesRegistry.${a} connector name is invalid`);r[a]=co(s,`capabilitiesRegistry.${a}`)}return r}function bo(e,t){let r=C(e,"prefs");M(r,["tabOrder"],"prefs");let a=j(r.tabOrder,"prefs.tabOrder"),s=new Set;return{tabOrder:a.map((o,n)=>{if(typeof o!="string"||!ba.test(o))throw new Error(`prefs.tabOrder[${n}] is invalid`);if(!t.has(o))throw new Error(`prefs.tabOrder[${n}] is not a tab slug`);if(s.has(o))throw new Error(`prefs.tabOrder contains duplicate slug: ${o}`);return s.add(o),o})}}function ho(e){let t=new Set;for(let r of e){if(t.has(r.slug))throw new Error(`duplicate tab slug: ${r.slug}`);t.add(r.slug)}return t}function po(e){let t=new Set;for(let r of e)for(let a of r.widgets){if(t.has(a.id))throw new Error(`duplicate widget id: ${a.id}`);t.add(a.id)}}function go(e){let t=C(e,"workspace");if(M(t,["schemaVersion","workspaceVersion","tabs","widgetsRegistry","capabilitiesRegistry","prefs"],"workspace"),t.schemaVersion!==1)throw new Error("schemaVersion must be 1");let r=be(t.workspaceVersion,"workspaceVersion",0,Number.MAX_SAFE_INTEGER),a=j(t.tabs,"tabs");if(a.length>32)throw new Error("tabs must contain at most 32 entries");let s=a.map((n,i)=>oo(n,`tabs[${i}]`)),o=ho(s);return po(s),{schemaVersion:1,workspaceVersion:r,tabs:s,widgetsRegistry:io(t.widgetsRegistry),capabilitiesRegistry:uo(t.capabilitiesRegistry),prefs:bo(t.prefs,o)}}var fo=/^[A-Za-z0-9._-]{1,64}$/,mo=/^[A-Za-z0-9._-]{1,64}$/,yo=/^[A-Za-z0-9._-]{1,64}:[A-Za-z0-9._-]{1,64}$/,vo=64,hr=80,pr=280,je=80,gr=200,fr=16,mr=32;function wo(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function tt(e,t){if(!wo(e))throw new Error(`${t} must be an object`);return e}function Pt(e,t,r){for(let a of Object.keys(e))if(!t.includes(a))throw new Error(`${r}.${a} is not allowed`)}function ge(e,t,r){let a=e[t];if(typeof a!="string")throw new Error(`${r}.${t} must be a string`);return a}function _o(e,t,r){let a=e[t];if(a!==void 0){if(typeof a!="string")throw new Error(`${r}.${t} must be a string`);return a}}function yr(e,t,r){let a=e[t];if(a!==void 0){if(!Array.isArray(a))throw new Error(`${r}.${t} must be an array`);return a.map((s,o)=>{if(typeof s!="string"||s.length===0)throw new Error(`${r}.${t}[${o}] must be a non-empty string`);return s})}}function xo(e,t,r){let a=tt(e,r);Pt(a,["id","label","readOnly"],r);let s=ge(a,"id",r);if(s.length>vo||!yo.test(s))throw new Error(`${r}.id is not a valid connector:tool id`);if(s.slice(0,s.indexOf(":"))!==t)throw new Error(`${r}.id "${s}" must be namespaced under connector "${t}"`);let o=ge(a,"label",r);if(o.length<1||o.length>je)throw new Error(`${r}.label must be 1-${je} characters`);let n=a.readOnly;if(n!==void 0&&typeof n!="boolean")throw new Error(`${r}.readOnly must be a boolean`);return{id:s,label:o,...n!==void 0?{readOnly:n}:{}}}function $o(e,t,r){let a=tt(e,r);Pt(a,["label","reason","methods","streams","tools"],r);let s=ge(a,"label",r);if(s.length<1||s.length>je)throw new Error(`${r}.label must be 1-${je} characters`);let o=_o(a,"reason",r);if(o!==void 0&&o.length>gr)throw new Error(`${r}.reason must be ${gr} characters or fewer`);let n=yr(a,"methods",r),i=yr(a,"streams",r),l;if(a.tools!==void 0){if(!Array.isArray(a.tools))throw new Error(`${r}.tools must be an array`);if(a.tools.length>mr)throw new Error(`${r}.tools must contain at most ${mr} entries`);l=a.tools.map((b,h)=>xo(b,t,`${r}.tools[${h}]`));let c=l.map(b=>b.id);if(new Set(c).size!==c.length)throw new Error(`${r}.tools contains duplicate tool ids`)}if(!((n?.length??0)>0||(i?.length??0)>0||(l?.length??0)>0))throw new Error(`${r} must request at least one tool, method, or stream`);return{label:s,...o!==void 0?{reason:o}:{},...n!==void 0?{methods:n}:{},...i!==void 0?{streams:i}:{},...l!==void 0?{tools:l}:{}}}function ko(e,t){if(e===void 0)return{};let r=tt(e,t);if(Object.keys(r).length>fr)throw new Error(`${t} must reference at most ${fr} connectors`);let a={};for(let[s,o]of Object.entries(r)){if(!mo.test(s))throw new Error(`${t}.${s} connector name is invalid`);a[s]=$o(o,s,`${t}.${s}`)}return a}function Ao(e){let t=tt(e,"recipe");if(Pt(t,["recipeVersion","name","title","description","doc","grantsManifest"],"recipe"),t.recipeVersion!==1)throw new Error("recipe.recipeVersion must be 1");let r=ge(t,"name","recipe");if(!fo.test(r))throw new Error("recipe.name is invalid");let a=ge(t,"title","recipe");if(a.length<1||a.length>hr)throw new Error(`recipe.title must be 1-${hr} characters`);let s=ge(t,"description","recipe");if(s.length<1||s.length>pr)throw new Error(`recipe.description must be 1-${pr} characters`);if(t.doc===void 0)throw new Error("recipe.doc is required");return{recipeVersion:1,name:r,title:a,description:s,doc:go(t.doc),grantsManifest:ko(t.grantsManifest,"recipe.grantsManifest")}}var Eo="boardstate.chat.event";function z(e,t,r,a){return{x:e,y:t,w:r,h:a}}var To=[{kind:"builtin:stat-card",summary:"One number that matters \u2014 a KPI with a label.",bindings:[{key:"value",shape:"number | string, or a structured payload + props.metric"}],props:{format:'"usd" | "int" | "percent" | "raw" (how the number renders)',metric:"when the binding resolves an object, the field name to display",label:"inner label (omit if it would just repeat the title)"},example:{id:"mrr",kind:"builtin:stat-card",title:"MRR",grid:z(0,0,3,2),collapsed:!1,hidden:!1,bindings:{value:{source:"static",value:128400}},props:{format:"usd",label:"Monthly recurring revenue"}}},{kind:"builtin:chart",summary:"Trends, comparisons, budgets \u2014 a small inline chart.",bindings:[{key:"value",shape:"number[] (or labeled points {label,value}[])"}],props:{type:'"line" | "bar" | "area" | "sparkline" | "gauge" (default line)',detail:"true adds labeled axes, gridlines, and value tooltips (line/bar/area)",label:"sparkline only: true shows the trailing value as an end label"},example:{id:"revenue-trend",kind:"builtin:chart",title:"Revenue (14d)",grid:z(0,2,8,5),collapsed:!1,hidden:!1,bindings:{value:{source:"static",value:[8,12,10,18,24,21,30,35,41,52]}},props:{type:"area"}},examples:[{id:"signups-spark",kind:"builtin:chart",title:"Signups",grid:z(0,7,3,2),collapsed:!1,hidden:!1,bindings:{value:{source:"static",value:[12,9,14,11,17,15,22]}},props:{type:"sparkline",label:!0}},{id:"latency-detail",kind:"builtin:chart",title:"p95 latency (ms)",grid:z(0,9,8,5),collapsed:!1,hidden:!1,bindings:{value:{source:"static",value:[180,220,190,240,210,260,230]}},props:{type:"line",detail:!0}}]},{kind:"builtin:table",summary:"Rows and columns \u2014 a compact table (keep ~10 visible rows).",bindings:[{key:"rows",shape:"Array<Record<string, unknown>> \u2014 NOT `value`"}],props:{columns:"string[] of keys to show (defaults to the first row's keys)",limit:"max visible rows before a \u201C+N more\u201D count"},example:{id:"recent-runs",kind:"builtin:table",title:"Recent runs",grid:z(0,7,8,4),collapsed:!1,hidden:!1,bindings:{rows:{source:"static",value:[{agent:"finance",task:"Q3 rollup",status:"done"},{agent:"ops",task:"Log sweep",status:"running"}]}},props:{columns:["agent","task","status"]}}},{kind:"builtin:markdown",summary:"Prose, explanations, small markdown tables (sanitized).",bindings:[{key:"content",shape:"markdown string \u2014 NOT `value`"}],props:{markdown:"inline markdown source (used when there is no `content` binding)",text:"alias for `markdown`"},example:{id:"summary",kind:"builtin:markdown",title:"Summary",grid:z(8,2,4,5),collapsed:!1,hidden:!1,props:{markdown:`## Insights

- Signal up **6.5\xD7** across 14 days.
- Momentum late.`}}},{kind:"builtin:notes",summary:"Operator scratch text (persisted via widget state).",bindings:[],props:{text:"starter content"},example:{id:"scratchpad",kind:"builtin:notes",title:"Notes",grid:z(8,7,4,4),collapsed:!1,hidden:!1,props:{text:"Jot findings here\u2026"}}},{kind:"builtin:activity",summary:"An event feed \u2014 recent things that happened.",bindings:[{key:"value",shape:"{ entries: [{ ts, jobName, status, summary }] }"}],props:{limit:"max entries shown"},example:{id:"agent-events",kind:"builtin:activity",title:"Agent events",grid:z(0,11,6,4),collapsed:!1,hidden:!1,bindings:{value:{source:"static",value:{entries:[{ts:17836e8,jobName:"finance",status:"ok",summary:"Rollup posted"}]}}}}},{kind:"builtin:action-form",summary:"The chat\u2194dashboard loop \u2014 a form that submits through the control plane.",bindings:[],props:{template:"the message sent on submit; `{{fieldName}}` interpolates a field (single pass)",fields:'array of { name, label, type: "text"|"number"|"select", options?, maxLength? }',buttonLabel:"the submit button text (optional)",mode:'"prompt" (default: submit the template to the agent) or "tool" (invoke a granted external tool)',connector:"tool mode only: the granted connector name (SPEC \xA717 v2)",tool:"tool mode only: the tool to invoke on that connector",argsFrom:"tool mode only: map of tool-arg name \u2192 declared field name"},example:{id:"ask-agent",kind:"builtin:action-form",title:"Ask the agent",grid:z(0,0,4,3),collapsed:!1,hidden:!1,props:{template:"Summarize {{topic}} for the board.",fields:[{name:"topic",label:"Topic",type:"text"}],buttonLabel:"Ask"}},examples:[{id:"file-ticket",kind:"builtin:action-form",title:"File a ticket",grid:z(0,0,4,4),collapsed:!1,hidden:!1,props:{mode:"tool",connector:"linear",tool:"create_issue",template:"Create issue: {title}",fields:[{name:"title",label:"Title",type:"text",maxLength:120},{name:"priority",label:"Priority",type:"select",options:["low","med","high"]}],argsFrom:{title:"title",priority:"priority"},buttonLabel:"Create"}}]},{kind:"builtin:action-button",summary:"One click \u2192 invoke a granted external tool with fixed args (operator-confirmed).",bindings:[],props:{connector:"the granted connector name (SPEC \xA717 v2)",tool:"the tool to invoke on that connector",args:"fixed argument object passed on click (optional)",label:"button text (optional)"},example:{id:"restart-worker",kind:"builtin:action-button",title:"Restart worker",grid:z(0,0,3,2),collapsed:!1,hidden:!1,props:{connector:"officecli",tool:"restart_service",args:{service:"worker"},label:"Restart"}}},{kind:"builtin:chat",summary:"Talk to the agent and watch it work (ignores bindings).",bindings:[],props:{placeholder:"empty-input hint text"},example:{id:"assistant",kind:"builtin:chat",title:"Assistant",grid:z(0,0,6,8),collapsed:!1,hidden:!1,props:{placeholder:"Ask me to build a view\u2026"}}}],So=[{kind:"builtin:sessions",summary:"Who/what is running.",valueShape:"rows { key, label, status, hasActiveRun, updatedAt }; props.limit"},{kind:"builtin:agent-status",summary:"Agents + goals/progress.",valueShape:"sessions shape + goal { objective, tokensUsed, tokenBudget }"},{kind:"builtin:usage",summary:"Cost/token totals.",valueShape:"{ totals: { totalCost, totalTokens }, days? }"},{kind:"builtin:cron",summary:"Scheduled jobs.",valueShape:"{ jobs: [{ id, name, enabled, state: { nextRunAtMs, lastRunStatus } }] }"},{kind:"builtin:instances",summary:"Fleet presence.",valueShape:"{ presence: [{ instanceId, platform, version, lastInputSeconds }] }"},{kind:"builtin:approvals",summary:"Pending widget approvals (reads the live registry; ignores bindings).",valueShape:"none \u2014 reads the registry"},{kind:"builtin:preview",summary:"A live page preview.",valueShape:"props.url (same-origin ok; cross-origin needs host opt-in)"},{kind:"builtin:iframe-embed",summary:"An embedded live page.",valueShape:"props.url (same-origin ok; cross-origin needs host opt-in)"}];[...To.map(e=>e.kind),...So.map(e=>e.kind)];function vr(e){let t=new Map;for(let r of e.tabs)for(let a of r.widgets)t.set(a.id,{widget:a,tabSlug:r.slug});return t}function wr(e){return new Map(e.tabs.map(t=>[t.slug,t]))}function Ro(e,t){return e.grid.x===t.grid.x&&e.grid.y===t.grid.y&&e.grid.w===t.grid.w&&e.grid.h===t.grid.h}function Mo(e,t){let r=[],a=wr(e),s=wr(t);for(let[i,l]of s)a.has(i)||r.push({kind:"tab-added",actor:l.createdBy??null,id:i,label:l.title});for(let[i,l]of a)if(!s.has(i))r.push({kind:"tab-removed",actor:l.createdBy??null,id:i,label:l.title});else{let c=s.get(i);c.title!==l.title&&r.push({kind:"tab-retitled",actor:c.createdBy??l.createdBy??null,id:i,label:c.title,detail:`${l.title} \u2192 ${c.title}`})}let o=vr(e),n=vr(t);for(let[i,l]of n)o.has(i)||r.push({kind:"widget-added",actor:l.widget.createdBy??null,id:i,label:l.widget.title||i});for(let[i,l]of o){let c=n.get(i);if(!c){r.push({kind:"widget-removed",actor:l.widget.createdBy??null,id:i,label:l.widget.title||i});continue}let b=l.widget,h=c.widget;(l.tabSlug!==c.tabSlug||!Ro(b,h))&&r.push({kind:"widget-moved",actor:h.createdBy??null,id:i,label:h.title||i,detail:l.tabSlug!==c.tabSlug?`${l.tabSlug} \u2192 ${c.tabSlug}`:void 0}),b.title!==h.title&&r.push({kind:"widget-retitled",actor:h.createdBy??null,id:i,label:h.title||i,detail:`${b.title||i} \u2192 ${h.title||i}`})}return r}function Io(e){let t=new Map;for(let r of e){let a=t.get(r.actor);a?a.push(r):t.set(r.actor,[r])}return[...t.entries()].map(([r,a])=>({actor:r,entries:a}))}function Co(e,t){return e.tabs.some(r=>r.widgets.some(a=>a.id===t))}function No(e,t){let r=t.filter(s=>Co(s.workspace,e)).map(s=>s.version).toSorted((s,o)=>s-o);if(r.length===0)return;let a=r[0];return t.some(s=>s.version<a)?a:void 0}function K(e){if(typeof e!="string")return null;let t=e.trim();return t.startsWith("agent:")?t.slice(6)||"agent":null}function N(e){return!!e&&typeof e=="object"&&!Array.isArray(e)}function Ee(e,t=""){return typeof e=="string"?e:t}function he(e,t=0){return typeof e=="number"&&Number.isFinite(e)?e:t}function Po(e){let t=N(e)?e:{},r=Math.min(12,Math.max(1,Math.trunc(he(t.w,4)))),a=Math.max(1,Math.trunc(he(t.h,2)));return{x:Math.min(12-r,Math.max(0,Math.trunc(he(t.x,0)))),y:Math.max(0,Math.trunc(he(t.y,0))),w:r,h:a}}function Oo(e){if(!N(e))return null;let t=e.source;return t!=="rpc"&&t!=="file"&&t!=="static"&&t!=="stream"&&t!=="computed"&&t!=="mcp"?null:{source:t,...typeof e.method=="string"?{method:e.method}:{},...typeof e.path=="string"?{path:e.path}:{},...typeof e.pointer=="string"?{pointer:e.pointer}:{},...N(e.params)?{params:e.params}:{},..."value"in e?{value:e.value}:{},...typeof e.event=="string"?{event:e.event}:{},...typeof e.op=="string"?{op:e.op}:{},...Array.isArray(e.inputs)?{inputs:e.inputs.filter(r=>typeof r=="string")}:{},...typeof e.arg=="string"?{arg:e.arg}:{},...typeof e.connector=="string"?{connector:e.connector}:{},...typeof e.tool=="string"?{tool:e.tool}:{},...N(e.args)?{args:e.args}:{}}}function _r(e){if(!N(e))return;let t={};for(let[r,a]of Object.entries(e)){let s=Oo(a);s&&(t[r]=s)}return Object.keys(t).length?t:void 0}function Bo(e){if(!N(e))return null;let t=Ee(e.id).trim(),r=Ee(e.kind).trim();if(!t||!r)return null;let a=Lo(e.ephemeral);return{id:t,kind:r,title:Ee(e.title),grid:Po(e.grid),collapsed:e.collapsed===!0,...typeof e.createdBy=="string"?{createdBy:e.createdBy}:{},..._r(e.bindings)?{bindings:_r(e.bindings)}:{},...N(e.props)?{props:e.props}:{},...a?{ephemeral:a}:{}}}function Lo(e){return!N(e)||typeof e.expiresAt!="string"||!e.expiresAt.trim()?null:{expiresAt:e.expiresAt}}function Do(e){if(!N(e))return null;let t=Ee(e.slug).trim();if(!t)return null;let r=Array.isArray(e.widgets)?e.widgets.map(Bo).filter(a=>a!==null):[];return{slug:t,title:Ee(e.title,t),hidden:e.hidden===!0,widgets:r,...e.layout==="full"||e.layout==="grid"?{layout:e.layout}:{},...e.visibility==="private"?{visibility:"private"}:{},...typeof e.owner=="string"?{owner:e.owner}:{},...typeof e.icon=="string"?{icon:e.icon}:{},...typeof e.createdBy=="string"?{createdBy:e.createdBy}:{}}}var Uo=new Set(["pending","approved","rejected"]);function zo(e){if(!N(e))return null;let t=e.status;return typeof t!="string"||!Uo.has(t)?null:{status:t,...typeof e.createdBy=="string"?{createdBy:e.createdBy}:{},...typeof e.approvedBy=="string"?{approvedBy:e.approvedBy}:{},...typeof e.approvedAt=="string"?{approvedAt:e.approvedAt}:{}}}function Wo(e){if(!N(e))return{};let t={};for(let[r,a]of Object.entries(e)){let s=zo(a);s&&(t[r]=s)}return t}var Ho=new Set(["requested","granted","revoked"]);function jo(e){if(!N(e))return null;let t=e.status;if(typeof t!="string"||!Ho.has(t))return null;let r=a=>Array.isArray(a)?a.filter(s=>typeof s=="string"):[];return{status:t,methods:r(e.methods),streams:r(e.streams),...Array.isArray(e.tools)?{tools:r(e.tools)}:{},...typeof e.toolsHash=="string"?{toolsHash:e.toolsHash}:{},...Array.isArray(e.autoConfirm)?{autoConfirm:r(e.autoConfirm)}:{},...typeof e.expiresAt=="string"?{expiresAt:e.expiresAt}:{},...Array.isArray(e.agents)?{agents:r(e.agents)}:{},...typeof e.description=="string"?{description:e.description}:{},...typeof e.grantedBy=="string"?{grantedBy:e.grantedBy}:{},...typeof e.grantedAt=="string"?{grantedAt:e.grantedAt}:{}}}function qo(e){if(!N(e))return{};let t={};for(let[r,a]of Object.entries(e)){let s=jo(a);s&&(t[r]=s)}return t}function ma(e){let t=N(e)?e:{},r=Array.isArray(t.tabs)?t.tabs.map(Do).filter(o=>o!==null):[],a=N(t.prefs)?t.prefs:{},s=Array.isArray(a.tabOrder)?a.tabOrder.filter(o=>typeof o=="string"):[];return{schemaVersion:he(t.schemaVersion,1),workspaceVersion:he(t.workspaceVersion,0),tabs:r,prefs:{tabOrder:s},widgetsRegistry:Wo(t.widgetsRegistry),capabilitiesRegistry:qo(t.capabilitiesRegistry)}}function Ot(e){return e.startsWith("custom:")&&e.slice(7)||null}function ya(e,t){let r=Ot(t);return r?e.widgetsRegistry[r]?.status??null:null}function rt(e){let t=new Map(e.tabs.map(s=>[s.slug,s])),r=[],a=new Set;for(let s of e.prefs.tabOrder){let o=t.get(s);o&&!a.has(s)&&(r.push(o),a.add(s))}for(let s of e.tabs)a.has(s.slug)||(r.push(s),a.add(s.slug));return r}function at(e){return rt(e).filter(t=>!t.hidden)}function Fo(e){return rt(e).filter(t=>t.hidden)}function Vo(e){let t=[],r=new Map;for(let a of e){let s=K(a.createdBy),o=s?"agent":a.createdBy==="system"?"system":"user",n=o==="agent"?`agent:${s}`:o,i=r.get(n);i||(i={key:n,kind:o,agentId:o==="agent"?s:null,tabs:[]},r.set(n,i),t.push(i)),i.tabs.push(a)}return t}function Bt(e,t){if(t)return e.tabs.find(r=>r.slug===t)}function va(e,t){let r=Bt(e,t);if(r)return r.slug;let a=at(e);return a.length>0?a[0].slug:rt(e)[0]?.slug??null}function st(e,t){if(!t)return e;let r=t.split("/").slice(1).map(s=>s.replace(/~1/g,"/").replace(/~0/g,"~")),a=e;for(let s of r)if(Array.isArray(a)){let o=Number(s);a=Number.isInteger(o)?a[o]:void 0}else if(N(a))a=a[s];else return;return a}var ne=new Map,xr=0;function Go(){return xr+=1,`sub_${xr}`}function Ko(e){let{tabSlug:t,channel:r,subscriberId:a,deliver:s}=e,o=ne.get(t);o||(o=new Map,ne.set(t,o));let n=o.get(r);return n||(n=new Map,o.set(r,n)),n.set(a,{subscriberId:a,channel:r,deliver:s}),()=>Yo({tabSlug:t,channel:r,subscriberId:a})}function Yo(e){let{tabSlug:t,channel:r,subscriberId:a}=e,s=ne.get(t),o=s?.get(r);o&&(o.delete(a),o.size===0&&s?.delete(r),s&&s.size===0&&ne.delete(t))}function Xo(e,t){let r=ne.get(e);if(r){for(let[a,s]of r)s.delete(t)&&s.size===0&&r.delete(a);r.size===0&&ne.delete(e)}}function Jo(e){let{tabSlug:t,channel:r,fromSubscriberId:a,payload:s}=e,o=ne.get(t)?.get(r);if(!o)return 0;let n=0;for(let i of Array.from(o.values()))i.subscriberId!==a&&(i.deliver(r,s),n+=1);return n}function Zo(e){return Math.max(1,(e.width-132)/12)}function ft(e,t,r){return Math.min(r,Math.max(t,e))}function $r(e,t){return t<=0?0:Math.round(e/(t+12))}function qe(e){let t=ft(e.w,1,12),r=Math.max(1,e.h);return{x:ft(e.x,0,12-t),y:Math.max(0,e.y),w:t,h:r}}function Qo(e,t){return e.x<t.x+t.w&&t.x<e.x+e.w&&e.y<t.y+t.h&&t.y<e.y+e.h}function wa(e,t){return e.filter(r=>r.id!==t).map(r=>r.grid)}function Lt(e,t,r){return wa(t,r).some(a=>Qo(e,a))}function en(e){return{widgetId:e.widget.id,mode:e.mode,originRect:{...e.widget.grid},originClientX:e.clientX,originClientY:e.clientY,ghostRect:{...e.widget.grid},pointerDx:0,pointerDy:0,columnWidth:Zo(e.metrics)}}function tn(e,t,r){e.pointerDx=t-e.originClientX,e.pointerDy=r-e.originClientY;let a=56,s=$r(t-e.originClientX,e.columnWidth),o=$r(r-e.originClientY,a),n=qe(e.mode==="move"?{x:e.originRect.x+s,y:e.originRect.y+o,w:e.originRect.w,h:e.originRect.h}:{x:e.originRect.x,y:e.originRect.y,w:e.originRect.w+s,h:e.originRect.h+o});return e.ghostRect=n,n}function kr(e){let t=qe(e.requested);return Lt(t,e.widgets,e.widgetId)?rn(t,e.widgets,e.widgetId):t}function rn(e,t,r){let a=ft(e.w,1,12),s=Math.max(1,e.h),o=12-a,n=wa(t,r).reduce((c,b)=>Math.max(c,b.y+b.h),0),i=Math.max(e.y,n)+s,l=null;for(let c=0;c<=i;c+=1){for(let b=0;b<=o;b+=1){let h={x:b,y:c,w:a,h:s};if(Lt(h,t,r))continue;let y=Math.abs(b-e.x)+Math.abs(c-e.y);(!l||y<l.distance)&&(l={rect:h,distance:y})}if(l&&c>=e.y)break}return l?.rect??null}function Dt(e){return[`grid-column: ${e.x+1} / span ${e.w}`,`grid-row: ${e.y+1} / span ${e.h}`].join("; ")}function _a(e){return e.reduce((t,r)=>Math.max(t,r.grid.y+r.grid.h),0)}function an(e,t,r){if(t==="move"){let n=r==="left"?-1:r==="right"?1:0,i=r==="up"?-1:r==="down"?1:0;return qe({...e,x:e.x+n,y:e.y+i})}let s=r==="left"?-1:r==="right"?1:0,o=r==="up"?-1:r==="down"?1:0;return qe({...e,w:e.w+s,h:e.h+o})}var xa="pending";function D(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function sn(e){return D(e)?D(e.doc)?e.doc:D(e.workspace)?e.workspace:e:{}}function on(e=new Date){return`dashboard-workspace-${e.toISOString().replace(/[:.]/g,"-")}.json`}function nn(e){return typeof e!="string"||!e.startsWith("custom:")?null:e.slice(7)||null}function $a(e){let t=new Set;if(!Array.isArray(e))return t;for(let r of e){let a=D(r)&&Array.isArray(r.widgets)?r.widgets:[];for(let s of a){let o=D(s)?nn(s.kind):null;o&&t.add(o)}}return t}function dn(e,t){if(!D(t))return{};let r=$a(e),a={};for(let[s,o]of Object.entries(t))r.has(s)&&(a[s]=o);return a}function ln(e,t={}){let r=structuredClone(e),a=t.slugs;if(!a||a.length===0)return r;let s=new Set(a),o=Array.isArray(r.tabs)?r.tabs.filter(l=>D(l)&&s.has(l.slug)):[];r.tabs=o;let n=D(r.prefs)?r.prefs:{},i=Array.isArray(n.tabOrder)?n.tabOrder:[];return r.prefs={...n,tabOrder:i.filter(l=>typeof l=="string"&&s.has(l))},r.widgetsRegistry=dn(o,r.widgetsRegistry),r}function cn(e,t={}){return`${JSON.stringify(ln(e,t),null,2)}
`}function un(e){try{return JSON.parse(e)}catch{throw new Error("Import file is not valid JSON.")}}function bn(e){let t=D(e)&&typeof e.createdBy=="string"?e.createdBy:"user";return{status:xa,createdBy:t}}function ka(e){if(!D(e))throw new Error("Import file must be a workspace object.");let t=structuredClone(e),r=D(t.widgetsRegistry)?t.widgetsRegistry:{},a={};for(let[n,i]of Object.entries(r))a[n]=bn(i);for(let n of $a(t.tabs))a[n]??(a[n]={status:xa,createdBy:"user"});t.widgetsRegistry=a;let s=D(t.capabilitiesRegistry)?t.capabilitiesRegistry:{},o={};for(let[n,i]of Object.entries(s))if(D(i)){let{grantedBy:l,grantedAt:c,autoConfirm:b,expiresAt:h,agents:y,...v}=i;o[n]={...v,status:"requested"}}return t.capabilitiesRegistry=o,t}function hn(e){let t=e.reason?.trim();return t&&t.length>0?t.slice(0,200):void 0}function pn(e){let t=structuredClone(e.doc),r={};for(let[a,s]of Object.entries(e.grantsManifest)){let o=hn(s),n=(s.tools??[]).map(i=>i.id);r[a]={status:"requested",methods:s.methods??[],streams:s.streams??[],...n.length>0?{tools:n}:{},...o!==void 0?{description:o}:{}}}return t.capabilitiesRegistry=r,t}function gn(e){return ka(pn(e))}var fn=512*1024,mn=512*1024,Aa=256*1024,Ea=/^[A-Za-z0-9._-]{1,64}$/;function J(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function yn(e){return new TextEncoder().encode(e).length}function vn(e,t){let r;try{r=JSON.parse(e)}catch{throw new Error("The gallery index is not valid JSON.")}let a=Array.isArray(r)?r:J(r)&&Array.isArray(r.widgets)?r.widgets:null;if(!a)throw new Error("The gallery index must be a list of widgets.");let s=[];for(let o of a){if(!J(o))continue;let n=typeof o.name=="string"?o.name.trim():"",i=typeof o.manifestUrl=="string"?o.manifestUrl.trim():"";if(!Ea.test(n)||!i)continue;let l;try{l=new URL(i,t).toString()}catch{continue}s.push({name:n,description:typeof o.description=="string"?o.description:"",manifestUrl:l})}return s}function wn(e){return Array.isArray(e)?e.filter(t=>t==="data:read"||t==="prompt:send"):[]}function _n(e){return Array.isArray(e)?e.map(t=>J(t)&&typeof t.id=="string"?t.id:null).filter(t=>t!==null):[]}function xn(e){let t;try{t=JSON.parse(e)}catch{throw new Error("The widget bundle is not valid JSON.")}if(!J(t)||!J(t.manifest)||!J(t.files))throw new Error("The widget bundle must be an object with `manifest` and `files`.");let r=t.manifest,a=typeof r.name=="string"?r.name.trim():"";if(!Ea.test(a))throw new Error("The widget bundle manifest has an invalid name.");let s={};for(let[o,n]of Object.entries(t.files)){if(typeof n!="string")throw new Error("Every widget bundle file must be text.");s[o]=n}return{name:a,title:typeof r.title=="string"?r.title:a,capabilities:wn(r.capabilities),bindingIds:_n(r.bindings),manifest:r,files:s}}var $n=/^[A-Za-z0-9._-]{1,64}$/;function kn(e,t){let r;try{r=JSON.parse(e)}catch{throw new Error("The gallery index is not valid JSON.")}let a=J(r)&&Array.isArray(r.recipes)?r.recipes:null;if(!a)return[];let s=[];for(let o of a){if(!J(o))continue;let n=typeof o.name=="string"?o.name.trim():"",i=typeof o.manifestUrl=="string"?o.manifestUrl.trim():"";if(!$n.test(n)||!i)continue;let l;try{l=new URL(i,t).toString()}catch{continue}let c=Array.isArray(o.connectors)?o.connectors.filter(b=>typeof b=="string"):[];s.push({name:n,title:typeof o.title=="string"&&o.title?o.title:n,description:typeof o.description=="string"?o.description:"",manifestUrl:l,connectors:c})}return s}function An(e){let t;try{t=JSON.parse(e)}catch{throw new Error("The recipe bundle is not valid JSON.")}try{return Ao(t)}catch(r){throw new Error(`The recipe bundle is invalid: ${r instanceof Error?r.message:String(r)}`)}}function S(e){return e.props??{}}function k(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function T(e){if(typeof e=="number")return Number.isFinite(e)?e:void 0;if(typeof e=="string"&&e.trim()){let t=Number(e);return Number.isFinite(t)?t:void 0}}function En(e,t){if(!k(e))return;let r=k(e.totals)?e.totals:void 0;switch(t){case"todayCost":return r?.totalCost??e.totalCost;case"todayTokens":return r?.totalTokens??e.totalTokens;default:return e[t]}}function Tn(e,t){if(e==null)return null;let r=T(e);return t==="usd"&&r!==void 0?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(r):t==="percent"&&r!==void 0?new Intl.NumberFormat("en-US",{style:"percent",maximumFractionDigits:1}).format(r):(t==="int"||t==="integer")&&r!==void 0?new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(r):typeof e=="string"?e:r!==void 0?new Intl.NumberFormat("en-US").format(r):JSON.stringify(e)}function Sn(e,t){let r=S(e),a=typeof r.metric=="string"?r.metric:null,s=a?En(t,a):t,o=s!==void 0?s:r.value,n=typeof r.label=="string"?r.label:e.title,i=n&&n!==e.title?n:null;return{display:Tn(o,r.format),label:i}}function Rn(e,t){let r=S(e);return typeof t=="string"?t:typeof r.markdown=="string"?r.markdown:typeof r.text=="string"?r.text:""}var Mn=8;function In(e,t){return(Array.isArray(t)?t:k(t)&&Array.isArray(t.rows)?t.rows:Array.isArray(S(e).rows)?S(e).rows:[]).filter(k)}function Cn(e,t){let r=S(e).columns;if(Array.isArray(r)){let a=r.filter(s=>typeof s=="string");if(a.length>0)return a}return t.length>0?Object.keys(t[0]):[]}function Nn(e){let t=S(e).limit;return typeof t=="number"&&Number.isFinite(t)&&t>0?Math.min(Math.trunc(t),100):Mn}function Pn(e,t){let r=In(e,t),a=Nn(e),s=r.slice(0,a);return{columns:Cn(e,s),rows:s,shown:s.length,total:r.length}}var On=6;function Bn(e){return e.status&&e.status!=="running"?!1:typeof e.hasActiveRun=="boolean"?e.hasActiveRun:e.status==="running"}function Ln(e,t){let r=e.displayName??e.label??e.subject??e.channel;return typeof r=="string"&&r.trim()?r:t}function Dn(e,t){let r=Array.isArray(t)?t:k(t)&&Array.isArray(t.sessions)?t.sessions:[],a=T(S(e).limit),s=a&&a>0?Math.trunc(a):On,o=r.filter(k);return{rows:o.map(n=>{let i=typeof n.key=="string"?n.key:"";return{key:i,label:Ln(n,i),active:Bn({hasActiveRun:typeof n.hasActiveRun=="boolean"?n.hasActiveRun:void 0,status:typeof n.status=="string"?n.status:void 0}),updatedAt:T(n.updatedAt)??null}}).filter(n=>n.key).slice(0,s),total:o.length}}function Un(e,t){let r=k(t)&&k(t.totals)?t.totals:{};return{cost:T(r.totalCost)??0,tokens:T(r.totalTokens)??0,days:k(t)?T(t.days)??null:null}}var zn=8;function Wn(e){if(!e)return null;let t=e.lastRunStatus??e.lastStatus;return typeof t=="string"?t:null}function Hn(e,t){let r=k(t)&&Array.isArray(t.jobs)?t.jobs:[],a=T(S(e).limit),s=a&&a>0?Math.trunc(a):zn,o=r.filter(k);return{jobs:o.map(n=>{let i=k(n.state)?n.state:void 0;return{id:typeof n.id=="string"?n.id:"",name:typeof n.name=="string"&&n.name.trim()?n.name:n.id||"",enabled:n.enabled!==!1,nextRunAtMs:i?T(i.nextRunAtMs)??null:null,lastStatus:Wn(i)}}).filter(n=>n.id).slice(0,s),total:o.length}}var jn=8,qn=120;function Fn(e){let t=e.instanceId??e.host??e.ip??e.deviceFamily;return typeof t=="string"&&t.trim()?t:""}function Vn(e){let t=[e.mode,e.platform,e.version].filter(r=>typeof r=="string"&&r.trim().length>0);return t.length>0?t.join(" \xB7 "):null}function Gn(e,t){let r=Array.isArray(t)?t:k(t)&&Array.isArray(t.presence)?t.presence:k(t)&&Array.isArray(t.nodes)?t.nodes:[],a=T(S(e).limit),s=a&&a>0?Math.trunc(a):jn,o=r.filter(k);return{instances:o.map(n=>{let i=T(n.lastInputSeconds);return{id:Fn(n),detail:Vn(n),healthy:i===void 0||i<=qn,lastInputMs:i!==void 0?i*1e3:null}}).filter(n=>n.id).slice(0,s),total:o.length}}var Kn=20;function Ar(e,t=120){return e.length<=t?e:`${e.slice(0,Math.max(0,t-1))}\u2026`}function Yn(e){let t=e.jobName??e.jobId??e.action;return typeof t=="string"&&t.trim()?t:"run"}function Xn(e,t){let r=k(t)&&Array.isArray(t.entries)?t.entries:[],a=T(S(e).limit),s=a&&a>0?Math.trunc(a):Kn,o=r.filter(k);return{entries:o.map(n=>({ts:T(n.ts)??null,title:Yn(n),detail:typeof n.summary=="string"&&n.summary.trim()?Ar(n.summary,120):typeof n.error=="string"&&n.error.trim()?Ar(n.error,120):null,status:typeof n.status=="string"?n.status:null})).slice(0,s),total:o.length}}function Ta(e,t,r){if(typeof e!="string"||!e.trim())return{status:"missing"};let a=e.trim(),s=globalThis.location?.origin,o=r??s,n;try{n=o?new URL(a,o):new URL(a)}catch{return{status:"ok",url:a,external:!1}}if(n.protocol!=="http:"&&n.protocol!=="https:")return{status:"blocked",reason:"scheme",url:a};let i=o?n.origin!==new URL(o).origin:!0;return i&&!t.allowExternalEmbedUrls?{status:"blocked",reason:"external",url:a}:{status:"ok",url:a,external:i}}var Jn=["line","bar","area","sparkline","gauge"],Zn="line";function Qn(e){if(typeof e=="number")return Number.isFinite(e)?e:void 0;if(k(e))return T(e.y)??T(e.value)}function ei(e){let t=Array.isArray(e)?e:k(e)&&Array.isArray(e.points)?e.points:[],r=[];for(let a of t){let s=Qn(a);s!==void 0&&r.push(s)}return r}function ti(e){let t=e.type;return typeof t=="string"&&Jn.includes(t)?t:Zn}function ri(e,t){let r=S(e),a=ei(t),s=a.length?Math.min(...a):0,o=a.length?Math.max(...a):0;return{type:ti(r),values:a,min:s,max:o,detail:r.detail===!0,label:r.label===!0}}var ai=/\{([A-Za-z0-9_]+)\}/g,si=new Set(["text","number","select"]);function oi(e){if(!k(e))return null;let{name:t,label:r,type:a}=e;if(typeof t!="string"||!t||typeof r!="string"||!r||typeof a!="string"||!si.has(a))return null;let s=a==="select"&&Array.isArray(e.options)?e.options.filter(n=>typeof n=="string"):void 0;if(a==="select"&&(!s||s.length===0))return null;let o=typeof e.maxLength=="number"&&Number.isInteger(e.maxLength)&&e.maxLength>0?e.maxLength:void 0;return{name:t,label:r,type:a,...s?{options:s}:{},...o!==void 0?{maxLength:o}:{}}}function ni(e){if(!k(e))return{};let t={};for(let[r,a]of Object.entries(e))typeof a=="string"&&(t[r]=a);return t}function ii(e){let t=S(e),r=typeof t.template=="string"?t.template:"",a=Array.isArray(t.fields)?t.fields.map(oi).filter(o=>o!==null):[],s=typeof t.buttonLabel=="string"?t.buttonLabel:null;return(t.mode==="tool"?"tool":"prompt")!="tool"?{template:r,fields:a,buttonLabel:s,mode:"prompt",connector:null,tool:null,argsFrom:null}:{template:r,fields:a,buttonLabel:s,mode:"tool",connector:typeof t.connector=="string"?t.connector:null,tool:typeof t.tool=="string"?t.tool:null,argsFrom:ni(t.argsFrom)}}function Sa(e,t){let r=e.maxLength&&e.maxLength>0?e.maxLength:200;if(e.type==="number"){let a=t.trim();return a&&Number.isFinite(Number(a))?a.slice(0,r):""}return e.type==="select"?e.options?.includes(t)?t:"":t.slice(0,r)}function di(e,t){let r=new Map(e.fields.map(a=>[a.name,a]));return e.template.replace(ai,(a,s)=>{let o=r.get(s);return o?Sa(o,t[s]??""):a})}function li(e,t){let r=new Map(e.fields.map(s=>[s.name,s])),a={};for(let[s,o]of Object.entries(e.argsFrom??{})){let n=r.get(o);n&&(a[s]=Sa(n,t[o]??""))}return a}function Er(e){let t=S(e);return{connector:typeof t.connector=="string"?t.connector:"",tool:typeof t.tool=="string"?t.tool:"",args:k(t.args)?t.args:null,label:typeof t.label=="string"?t.label:null}}var ci=["desktop","tablet","mobile"];function ui(e){let t=S(e).defaultViewport;return typeof t=="string"&&ci.includes(t)?t:"desktop"}var bi=8;function hi(e){return e.status&&e.status!=="running"?!1:typeof e.hasActiveRun=="boolean"?e.hasActiveRun:e.status==="running"}function pi(e,t){return e.length<=t?e:`${e.slice(0,Math.max(0,t-1))}\u2026`}function gi(e,t){let r=e.displayName??e.label??e.subject??e.channel;return typeof r=="string"&&r.trim()?r:t}function fi(e){let t=k(e.goal)?e.goal:void 0,r=t&&typeof t.objective=="string"?t.objective.trim():"";return r?pi(r,100):null}function mi(e){let t=k(e.goal)?e.goal:void 0;if(!t)return null;let r=T(t.tokensUsed),a=T(t.tokenBudget);return r===void 0||a===void 0||a<=0?null:Math.min(1,Math.max(0,r/a))}function yi(e,t){let r=Array.isArray(t)?t:k(t)&&Array.isArray(t.sessions)?t.sessions:[],a=T(S(e).limit),s=a&&a>0?Math.trunc(a):bi,o=r.filter(k).map(i=>{let l=typeof i.key=="string"?i.key:"";return{key:l,label:gi(i,l),active:hi({hasActiveRun:typeof i.hasActiveRun=="boolean"?i.hasActiveRun:void 0,status:typeof i.status=="string"?i.status:void 0}),task:fi(i),progress:mi(i)}}).filter(i=>i.key),n=o.filter(i=>i.active).length;return{rows:o.slice(0,s),activeCount:n,total:o.length}}var vi=8;function Ra(e){return e==="approve"?"approved":"rejected"}function wi(e,t){return{pending:Object.entries(e.widgetsRegistry).filter(([,r])=>r.status==="pending").map(([r,a])=>({id:r,kind:"widget",title:r,requestedBy:K(a.createdBy)})),onDecide:(r,a)=>t(r.id,Ra(a))}}function _i(e,t,r,a){let s=wi(e,t).pending,o=Object.entries(e.capabilitiesRegistry??{}),n=c=>{let b=c.tools??[],h=[c.methods.length?`${c.methods.length} read${c.methods.length===1?"":"s"}`:null,c.streams.length?`${c.streams.length} stream${c.streams.length===1?"":"s"}`:null,b.length?`${b.length} tool${b.length===1?"":"s"}`:null].filter(Boolean);return c.description??(h.length?`wants ${h.join(" + ")}`:"data access")},i=o.filter(([,c])=>c.status==="requested").map(([c,b])=>({id:c,kind:"capability",title:c,requestedBy:null,detail:n(b),...(b.tools??[]).length?{tools:b.tools}:{}})),l=o.filter(([,c])=>c.status==="granted"&&((c.tools??[]).length>0||c.expiresAt)).map(([c,b])=>({id:c,kind:"capability",title:c,requestedBy:null,granted:!0,detail:n(b),...(b.tools??[]).length?{tools:b.tools}:{},...(b.autoConfirm??[]).length?{autoConfirm:b.autoConfirm}:{},...b.expiresAt?{expiresAt:b.expiresAt}:{},...(b.agents??[]).length?{agents:b.agents}:{}}));return{pending:[...(a?.pending??[]).map(c=>({id:c.id,kind:"action",title:`${c.connector}:${c.tool}`,requestedBy:c.requestedBy??null,detail:"awaiting confirm"})),...i,...s,...l],onDecide:(c,b,h)=>{c.kind==="action"?a?.resolve(c.id,b==="approve"?"confirm":"deny"):c.kind==="capability"?r(c.id,b==="approve"?"granted":"revoked",h):t(c.id,Ra(b))}}}function xi(e,t){let r=t?.pending.filter(o=>k(o)&&o.id)??[],a=T(S(e).limit),s=a&&a>0?Math.trunc(a):vi;return{items:r.slice(0,s),total:r.length}}var $i=6e4,ki=10,Tr=new Map;function Ma(e){let t=Tr.get(e);return t||(t={timestamps:[],inFlight:!1},Tr.set(e,t)),t}async function Ia(e){let t=e.now??(()=>Date.now()),r=Ma(e.widgetKey),a=t()-$i;if(r.timestamps=r.timestamps.filter(s=>s>a),r.inFlight||r.timestamps.length>=ki)return"rate_limited";r.inFlight=!0;try{return await e.confirmPrompt(e.text)?(r.timestamps.push(t()),await e.sendPrompt(e.text),"sent"):"declined"}finally{r.inFlight=!1}}var Ai=new Set(["health","system-presence","usage.status","usage.cost","agents.list","sessions.list","sessions.resolve","sessions.get","sessions.usage","sessions.usage.timeseries","sessions.usage.logs","node.list","node.describe","cron.get","cron.list","cron.status","cron.runs"]);function Ei(e){return Ai.has(e)}var Ti=new Set(["presence","sessions.changed","boardstate.changed"]);function Ca(e){return Ti.has(e)}var Si=1e4,Sr=8*1024,ut=256,Ri=6e4,Mi=60,Rr=new Map;function Ii(e){let t=Rr.get(e);return t||(t={timestamps:[]},Rr.set(e,t)),t}function Ci(e){let t;try{t=JSON.stringify(e)}catch{return null}return t===void 0?0:typeof TextEncoder<"u"?new TextEncoder().encode(t).length:t.length}var Ni=new Set(["dashboard:ready","dashboard:getData","dashboard:getTheme","dashboard:sendPrompt","dashboard:getState","dashboard:setState","dashboard:publish","dashboard:subscribe","dashboard:unsubscribe"]);function Pi(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function Oi(e){return Pi(e)&&e.v===1&&typeof e.type=="string"&&Ni.has(e.type)}function Bi(e){let t=e.now??(()=>Date.now()),r=e.getDataTimeoutMs??Si,a=new Set(e.manifest.bindingIds),s=new Set(e.manifest.capabilities),o=0,n=!1,i=Ma(e.manifest.name),l=Ii(e.manifest.name),c=new Map,b=new Set;function h(g,m,$){e.post({v:1,type:"dashboard:error",...$!==void 0?{requestId:$}:{},code:g,message:m})}async function y(g,m){if(!a.has(m)){h("binding_denied",`binding not declared in manifest: ${m}`,g);return}let $=e.assertBindingAllowed?.(m);if($){h($,`binding not allowed: ${m}`,g);return}let H=!1,Y=setTimeout(()=>{H||n||(H=!0,b.delete(Y),h("timeout","binding resolution timed out",g))},r);b.add(Y);try{let Q=await e.resolveBinding(m);if(H||n)return;H=!0,clearTimeout(Y),b.delete(Y),e.post({v:1,type:"dashboard:data",requestId:g,bindingId:m,data:Q})}catch(Q){if(H||n)return;H=!0,clearTimeout(Y),b.delete(Y),h("resolve_failed",Q instanceof Error?Q.message:String(Q),g)}}function v(g){e.post({v:1,type:"dashboard:theme",requestId:g,tokens:e.resolveTheme()})}async function w(g,m){if(!s.has("prompt:send")){h("capability_denied","widget lacks the prompt:send capability",g);return}try{let $=await Ia({widgetKey:e.manifest.name,text:m,confirmPrompt:e.confirmPrompt,sendPrompt:e.sendPrompt,now:t});if(n)return;$==="rate_limited"?h("rate_limited","prompt send rate limit exceeded",g):$==="declined"&&h("prompt_declined","operator declined the prompt",g)}catch($){n||h("resolve_failed",$ instanceof Error?$.message:String($),g)}}async function f(g){if(!s.has("state:persist")||!e.getWidgetState){h("capability_denied","widget lacks the state:persist capability",g);return}try{let m=await e.getWidgetState();if(n)return;e.post({v:1,type:"dashboard:state",requestId:g,state:m.state,...m.version!==void 0?{version:m.version}:{}})}catch(m){n||h("resolve_failed",m instanceof Error?m.message:String(m),g)}}async function x(g,m){if(!s.has("state:persist")||!e.setWidgetState){h("capability_denied","widget lacks the state:persist capability",g);return}try{let{version:$}=await e.setWidgetState(m);if(n)return;e.post({v:1,type:"dashboard:state",requestId:g,state:m,version:$})}catch($){n||h("resolve_failed",$ instanceof Error?$.message:String($),g)}}function R(g,m,$){if(!s.has("bus:pubsub")){h("capability_denied","widget lacks the bus:pubsub capability",$);return}if(!e.bus)return;let H=Ci(m);if(H===null){h("malformed","publish payload is not serializable",$);return}if(H>Sr){h("payload_too_large",`publish payload exceeds ${Sr} bytes`,$);return}let Y=t()-Ri;if(l.timestamps=l.timestamps.filter(Q=>Q>Y),l.timestamps.length>=Mi){h("rate_limited","publish rate limit exceeded",$);return}l.timestamps.push(t()),e.bus.publish(g,m)}function De(g){if(!s.has("bus:pubsub")||!e.bus){s.has("bus:pubsub")||h("capability_denied","widget lacks the bus:pubsub capability");return}if(c.has(g))return;let m=e.bus.subscribe(g,($,H)=>{n||e.post({v:1,type:"dashboard:message",channel:$,payload:H})});c.set(g,m)}function U(g){let m=c.get(g);m&&(c.delete(g),m())}function Z(g){if(n)return!1;if(!Oi(g))return o+=1,!1;switch(g.type){case"dashboard:ready":return!0;case"dashboard:getData":{let m=typeof g.requestId=="string"?g.requestId:null,$=typeof g.bindingId=="string"?g.bindingId:null;return m===null||$===null?(o+=1,!1):(y(m,$),!0)}case"dashboard:getTheme":{let m=typeof g.requestId=="string"?g.requestId:null;return m===null?(o+=1,!1):(v(m),!0)}case"dashboard:sendPrompt":{let m=typeof g.requestId=="string"?g.requestId:null,$=typeof g.text=="string"?g.text:null;return m===null||$===null||!$.trim()?(o+=1,!1):(w(m,$),!0)}case"dashboard:getState":{let m=typeof g.requestId=="string"?g.requestId:null;return m===null?(o+=1,!1):(f(m),!0)}case"dashboard:setState":{let m=typeof g.requestId=="string"?g.requestId:null;return m===null||!Object.hasOwn(g,"state")?(o+=1,!1):(x(m,g.state),!0)}case"dashboard:publish":{let m=typeof g.channel=="string"?g.channel:null,$=typeof g.requestId=="string"?g.requestId:void 0;return m===null||!m.trim()||m.length>ut||!("payload"in g)?(o+=1,!1):(R(m,g.payload,$),!0)}case"dashboard:subscribe":{let m=typeof g.channel=="string"?g.channel:null;return m===null||!m.trim()||m.length>ut?(o+=1,!1):(De(m),!0)}case"dashboard:unsubscribe":{let m=typeof g.channel=="string"?g.channel:null;return m===null||!m.trim()||m.length>ut?(o+=1,!1):(U(m),!0)}default:return o+=1,!1}}async function lt(g){if(!(n||!a.has(g)||e.assertBindingAllowed?.(g)))try{let m=await e.resolveBinding(g);n||e.post({v:1,type:"dashboard:push",bindingId:g,data:m})}catch{}}return{handleMessage:Z,push:lt,get droppedCount(){return o},dispose(){n=!0;for(let g of b)clearTimeout(g);b.clear();for(let g of c.values())g();c.clear(),i.inFlight=!1}}}var Fe=new WeakMap;function Li(e){let t=Fe.get(e);return t||(t={entries:new Map,self:null,pendingSelfSlug:null},Fe.set(e,t)),t}function Di(e,t){for(let[r,a]of e.entries)a.at+3e4<=t&&e.entries.delete(r)}function Ui(e,t,r=Date.now()){let a=Fe.get(e);return a?(Di(a,r),[...a.entries.entries()].filter(([s,o])=>o.tabSlug===t&&s!==a.self).toSorted((s,o)=>o[1].at-s[1].at).map(([s])=>s)):[]}function zi(e){Fe.delete(e)}function Mr(e,t,r){if(!t)return;let a=Li(e);a.self===null&&(a.pendingSelfSlug=r),t.request("dashboard.presence.ping",{tabSlug:r}).catch(()=>{})}var Wi="boardstate.changed",Ir=new WeakMap,mt=new WeakMap,yt=new WeakMap,vt=new WeakMap,wt=new WeakMap,Hi=45e3,Ie=new WeakMap;function ji(e,t){Ie.get(e)?.(),Ie.set(e,t)}function qi(e){Ie.delete(e)}function Fi(e){let t=Ie.get(e);t&&(Ie.delete(e),t())}function Vi(e){let t=Ir.get(e);return t||(t={loading:!1,loaded:!1,error:null,workspace:null,activeSlug:null,hiddenMenuOpen:!1,pendingWidgetIds:new Set,actionError:null,requestUpdate:null},Ir.set(e,t)),t}function P(e){e.requestUpdate?.()}function ot(e){return!!e&&typeof e=="object"&&!Array.isArray(e)}function Gi(e,t=0){return typeof e=="number"&&Number.isFinite(e)?e:t}function q(e){return e instanceof Error&&e.message.trim()?e.message.trim():typeof e=="string"&&e.trim()?e.trim():"Unknown dashboard error."}async function ie(e,t,r){if(t){r?.silent||(e.loading=!0,e.error=null,P(e));try{let a=await t.request("dashboard.workspace.get",{}),s=ma(ot(a)&&"doc"in a?a.doc:a);e.workspace=s,e.activeSlug=va(s,r?.requestedSlug??e.activeSlug),e.error=null,e.loaded=!0}catch(a){e.error=q(a)}finally{e.loading=!1,P(e)}}}function Ki(e,t,r){if(!r){_t(e);return}if(yt.get(e)===r)return;_t(e);let a=r.addEventListener(Wi,s=>{let o=Gi((ot(s)?s:void 0)?.workspaceVersion,NaN),n=t.workspace?.workspaceVersion??-1;Number.isFinite(o)&&o<=n||ie(t,r,{silent:!0})});mt.set(e,a),yt.set(e,r)}function _t(e){mt.get(e)?.(),mt.delete(e),yt.delete(e)}function Yi(e,t,r,a=Hi){if(!t){Na(e);return}if(wt.get(e))return;let s=setInterval(()=>{typeof document<"u"&&document.visibilityState==="hidden"||r()},Math.max(1e4,a));vt.set(e,s),wt.set(e,!0)}function Na(e){let t=vt.get(e);t!==void 0&&(clearInterval(t),vt.delete(e)),wt.delete(e)}function Xi(e){Fi(e),_t(e),Na(e),zi(e)}function nt(e,t,r,a){return{...e,tabs:e.tabs.map(s=>s.slug!==t?s:{...s,widgets:s.widgets.map(o=>o.id===r?a(o):o)})}}function Pa(e,t,r){return{...e,tabs:e.tabs.map(a=>a.slug!==t?a:{...a,widgets:a.widgets.filter(s=>s.id!==r)})}}async function de(e,t,r){if(!t||!e.workspace)return;let a=e.workspace,s=r.optimistic(a);e.workspace=s,e.pendingWidgetIds.add(r.widgetId),e.actionError=null,P(e);try{await t.request(r.method,r.rpcParams)}catch(o){e.workspace===s&&(e.workspace=a),e.actionError=q(o)}finally{e.pendingWidgetIds.delete(r.widgetId),P(e)}}function Cr(e,t,r){return de(e,t,{widgetId:r.widgetId,method:"dashboard.widget.move",rpcParams:{tab:r.slug,id:r.widgetId,grid:r.grid},optimistic:a=>nt(a,r.slug,r.widgetId,s=>({...s,grid:r.grid}))})}function Ji(e,t,r){return de(e,t,{widgetId:r.widgetId,method:"dashboard.widget.update",rpcParams:{tab:r.slug,id:r.widgetId,patch:{collapsed:r.collapsed}},optimistic:a=>nt(a,r.slug,r.widgetId,s=>({...s,collapsed:r.collapsed}))})}function Zi(e,t,r){return de(e,t,{widgetId:r.widgetId,method:"dashboard.widget.update",rpcParams:{tab:r.slug,id:r.widgetId,patch:{title:r.title}},optimistic:a=>nt(a,r.slug,r.widgetId,s=>({...s,title:r.title}))})}function Qi(e,t,r){return de(e,t,{widgetId:r.widgetId,method:"dashboard.widget.update",rpcParams:{tab:r.slug,id:r.widgetId,patch:{ephemeral:null}},optimistic:a=>nt(a,r.slug,r.widgetId,s=>{let{ephemeral:o,...n}=s;return n})})}function ed(e,t,r){return de(e,t,{widgetId:r.widgetId,method:"dashboard.widget.update",rpcParams:{tab:r.slug,id:r.widgetId,patch:{hidden:!0}},optimistic:a=>Pa(a,r.slug,r.widgetId)})}function td(e,t,r){return de(e,t,{widgetId:r.widgetId,method:"dashboard.widget.remove",rpcParams:{tab:r.slug,id:r.widgetId},optimistic:a=>Pa(a,r.slug,r.widgetId)})}function rd(e,t,r){return de(e,t,{widgetId:r.widgetId,method:"dashboard.widget.move",rpcParams:{tab:r.fromSlug,id:r.widgetId,toTab:r.toSlug},optimistic:a=>{let s=a.tabs.find(o=>o.slug===r.fromSlug)?.widgets.find(o=>o.id===r.widgetId);return s?{...a,tabs:a.tabs.map(o=>o.slug===r.fromSlug?{...o,widgets:o.widgets.filter(n=>n.id!==r.widgetId)}:o.slug===r.toSlug?{...o,widgets:[...o.widgets,s]}:o)}:a}})}async function ad(e,t,r){if(!t||!e.workspace)return;let a=e.workspace,s={...a,tabs:a.tabs.map(o=>o.slug===r.slug?{...o,layout:r.layout}:o)};e.workspace=s,e.actionError=null,P(e);try{await t.request("dashboard.tab.update",{slug:r.slug,patch:{layout:r.layout}})}catch(o){e.workspace===s&&(e.workspace=a),e.actionError=q(o),P(e)}}async function sd(e,t){if(t){e.actionError=null,P(e);try{await t.request("dashboard.workspace.undo",{}),await ie(e,t,{silent:!0})}catch(r){e.actionError=q(r),P(e)}}}async function Ve(e,t,r){if(t){e.actionError=null,P(e);try{await t.request("dashboard.widget.approve",{name:r.name,decision:r.decision})}catch(a){e.actionError=q(a),P(e)}}}async function od(e,t,r){if(t){e.actionError=null,P(e);try{await t.request("dashboard.capability.approve",{name:r.name,decision:r.decision,...r.tools!==void 0?{tools:r.tools}:{},...r.autoConfirm!==void 0?{autoConfirm:r.autoConfirm}:{},...r.expiresAt!==void 0?{expiresAt:r.expiresAt}:{}})}catch(a){e.actionError=q(a),P(e)}}}async function nd(e,t={}){if(!e)throw new Error("Not connected.");let r=sn(await e.request("dashboard.workspace.get",{}));return{filename:on(),json:cn(r,t)}}async function id(e,t,r){if(!t)return!1;e.actionError=null,P(e);try{let a=ka(un(r));return await t.request("dashboard.workspace.replace",{doc:a}),await ie(e,t,{silent:!0}),!0}catch(a){return e.actionError=q(a),P(e),!1}}async function dd(e,t,r){if(!t)return!1;e.actionError=null,P(e);try{let a=gn(r);return await t.request("dashboard.workspace.replace",{doc:a}),await ie(e,t,{silent:!0}),!0}catch(a){return e.actionError=q(a),P(e),!1}}async function Ut(e,t){try{if(t.source==="static")return{value:t.value};if(!e)return{error:"Not connected."};if(t.source==="rpc")return t.method?{value:st(await e.request(t.method,t.params??{}),t.pointer)}:{error:"Binding is missing an rpc method."};if(t.source==="stream")return{error:"Stream bindings resolve via subscription, not a one-shot read."};if(t.source==="computed")return{error:"Computed bindings resolve from sibling values, not a one-shot read."};if(t.source==="mcp")return await ld(e,t);let r=await e.request("dashboard.data.read",{binding:t});return{value:ot(r)&&"data"in r?r.data:r}}catch(r){return{error:q(r)}}}async function ld(e,t){return!t.connector||!t.tool?{error:"mcp binding is missing a connector or tool."}:{value:st(cd(await e.request("dashboard.connector.read",{connector:t.connector,tool:t.tool,...t.args?{args:t.args}:{}})),t.pointer)}}function cd(e){if(ot(e)){if("structuredContent"in e&&e.structuredContent!==void 0)return e.structuredContent;if("content"in e)return e.content}return e}function Oa(e,t){if(typeof e=="number"&&Number.isFinite(e))t.push(e);else if(Array.isArray(e))for(let r of e)Oa(r,t)}function ud(e){return Array.isArray(e)?e.length:e==null?0:1}function bd(e,t){return e.replace(/\{(\d+)\}/g,(r,a)=>{let s=t[Number(a)];return typeof s=="string"?s:typeof s=="number"||typeof s=="boolean"||typeof s=="bigint"?String(s):s==null?"":JSON.stringify(s)??""})}function hd(e,t,r){switch(e){case"sum":case"avg":case"min":case"max":{let a=[];for(let s of t)Oa(s,a);return e==="sum"?{value:a.reduce((s,o)=>s+o,0)}:a.length===0?{value:null}:e==="avg"?{value:a.reduce((s,o)=>s+o,0)/a.length}:{value:e==="min"?Math.min(...a):Math.max(...a)}}case"count":return{value:t.reduce((a,s)=>a+ud(s),0)};case"last":return{value:t.length?t[t.length-1]:null};case"pick":return{value:st(t[0],r)};case"format":return{value:bd(r??"",t)};default:return{error:`Unknown computed op: ${e}`}}}function pd(e,t,r){let a=t.event;return!e||!a||!Ca(a)?()=>{}:e.addEventListener(a,s=>{try{r({value:st(s,t.pointer)})}catch(o){r({error:q(o)})}})}var gd=["--bg","--card","--card-foreground","--text","--muted","--border","--accent","--accent-foreground","--radius","--radius-sm","--font-sans","--font-mono"];function fd(){let e={};if(typeof document>"u"||typeof getComputedStyle!="function")return e;let t=getComputedStyle(document.documentElement);for(let r of gd){let a=t.getPropertyValue(r).trim();a&&(e[r]=a)}return e}function Nr(e,t){return{get:async()=>{let r=await e.request("dashboard.widget.state.get",{widgetId:t});return{state:r?.state??null,...typeof r?.version=="number"?{version:r.version}:{}}},set:async r=>{let a=(await e.request("dashboard.widget.state.set",{widgetId:t,state:r}))?.version;return{version:typeof a=="number"?a:0}}}}function md(e,t){let a=Bi({...t,post:n=>{e.contentWindow?.postMessage(n,"*")}}),s=n=>{n.source===e.contentWindow&&a.handleMessage(n.data)},o=e.ownerDocument?.defaultView??(typeof window<"u"?window:null);return o?.addEventListener("message",s),()=>{o?.removeEventListener("message",s),a.dispose()}}var yd=new Set(["data:read","prompt:send","state:persist","bus:pubsub"]);function Ba(e,t,r){return`${e.replace(/\/+$/,"")}/widgets/${encodeURIComponent(t)}/${r.split("/").map(a=>encodeURIComponent(a)).join("/")}`}async function vd(e,t){if(typeof fetch!="function")return null;try{let r=await fetch(Ba(e,t,"widget.json"),{method:"GET",credentials:"same-origin",headers:{Accept:"application/json"}});if(!r.ok)return null;let a=await r.json();if(typeof a!="object"||a===null)return null;let s=a;return{name:t,bindingIds:(Array.isArray(s.bindings)?s.bindings:[]).map(o=>typeof o=="object"&&o!==null?o.id:void 0).filter(o=>typeof o=="string"),capabilities:(Array.isArray(s.capabilities)?s.capabilities:[]).filter(o=>typeof o=="string"&&yd.has(o))}}catch{return null}}function Ge(e){return!!e&&typeof e=="object"&&!Array.isArray(e)}function le(e){return typeof e=="number"&&Number.isFinite(e)?e:0}function wd(e){if(Ge(e))return{added:le(e.added),removed:le(e.removed),moved:le(e.moved),retitled:le(e.retitled),tabsChanged:le(e.tabsChanged),total:le(e.total)}}async function _d(e){if(!e)return[];let t=await e.request("dashboard.workspace.history.list",{});return(Ge(t)&&Array.isArray(t.entries)?t.entries:[]).filter(Ge).map(r=>{let a=wd(r.summary);return{version:typeof r.version=="number"?r.version:0,savedAt:typeof r.savedAt=="string"?r.savedAt:"",bytes:typeof r.bytes=="number"?r.bytes:0,...a?{summary:a}:{}}}).filter(r=>r.version>0)}async function xd(e,t){if(!e)return null;let r=await e.request("dashboard.workspace.history.get",{version:t});return ma(Ge(r)&&"doc"in r?r.doc:r)}async function it(e,t,r){if(typeof fetch!="function")throw new Error("This browser cannot fetch the widget gallery.");let a=await fetch(e,{method:"GET",credentials:"omit",headers:{Accept:"application/json"}});if(!a.ok)throw new Error(`${r} request failed (${a.status}).`);let s=await a.text();if(yn(s)>t)throw new Error(`${r} is too large (max ${Math.floor(t/1024)} KB).`);return s}async function $d(e){return vn(await it(e,Aa,"The gallery index"),e)}async function kd(e){return xn(await it(e,fn,"The widget bundle"))}async function Ad(e){return kn(await it(e,Aa,"The gallery index"),e)}async function Ed(e){return An(await it(e,mn,"The recipe bundle"))}async function Td(e,t){if(!e)throw new Error("Not connected.");await e.request("dashboard.widget.install",{name:t.name,manifest:t.manifest,files:t.files})}var{I:Su}=Ms,Sd=e=>e.strings===void 0;var La={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},zt=e=>(...t)=>({_$litDirective$:e,values:t}),Da=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,r){this._$Ct=e,this._$AM=t,this._$Ci=r}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var Te=(e,t)=>{let r=e._$AN;if(r===void 0)return!1;for(let a of r)a._$AO?.(t,!1),Te(a,t);return!0},Ke=e=>{let t,r;do{if((t=e._$AM)===void 0)break;r=t._$AN,r.delete(e),e=t}while(r?.size===0)},Ua=e=>{for(let t;t=e._$AM;e=t){let r=t._$AN;if(r===void 0)t._$AN=r=new Set;else if(r.has(e))break;r.add(e),Id(t)}};function Rd(e){this._$AN!==void 0?(Ke(this),this._$AM=e,Ua(this)):this._$AM=e}function Md(e,t=!1,r=0){let a=this._$AH,s=this._$AN;if(s!==void 0&&s.size!==0)if(t)if(Array.isArray(a))for(let o=r;o<a.length;o++)Te(a[o],!1),Ke(a[o]);else a!=null&&(Te(a,!1),Ke(a));else Te(this,e)}var Id=e=>{e.type==La.CHILD&&(e._$AP??(e._$AP=Md),e._$AQ??(e._$AQ=Rd))},za=class extends Da{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,r){super._$AT(e,t,r),Ua(this),this.isConnected=e._$AU}_$AO(e,t=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),t&&(Te(this,e),Ke(this))}setValue(e){if(Sd(this._$Ct))this._$Ct._$AI(e,this);else{let t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}};function Pr(e,t){return e.bindings?.[t]??null}function Cd(e){let{iframe:t,widget:r,manifest:a,context:s}=e,o=s.tabSlug??"",n=Go(),i=md(t,{manifest:a,bus:{publish:(l,c)=>Jo({tabSlug:o,channel:l,fromSubscriberId:n,payload:c}),subscribe:(l,c)=>Ko({tabSlug:o,channel:l,subscriberId:n,deliver:c})},getWidgetState:async()=>{if(!s.transport)throw new Error("Not connected.");return Nr(s.transport,r.id).get()},setWidgetState:async l=>{if(!s.transport)throw new Error("Not connected.");return Nr(s.transport,r.id).set(l)},assertBindingAllowed:l=>{let c=Pr(r,l);return c?.source==="rpc"&&!Ei(c.method??"")||c?.source==="stream"&&!Ca(c.event??"")?"binding_denied":null},resolveBinding:async l=>{let c=Pr(r,l);if(!c)throw new Error(`binding not configured: ${l}`);let b=await Ut(s.transport,c);if("error"in b)throw new Error(b.error);return b.value},resolveTheme:s.readThemeTokens??fd,confirmPrompt:async l=>s.confirmPrompt?await s.confirmPrompt(l):typeof window<"u"?window.confirm(l):!1,sendPrompt:async l=>{if(!s.transport)throw new Error("Not connected.");await s.transport.request("chat.send",{sessionKey:s.sessionKey,message:l,deliver:!1})}});return()=>{i(),Xo(o,n)}}var Nd=class extends za{constructor(...e){super(...e),this.iframe=null,this.detach=null,this.key=""}render(e){let t=e.widget.kind.slice(7),r=Ba(e.context.basePath,t,"index.html"),a=`${e.widget.id}::${r}`;if(this.iframe&&this.key===a)return this.iframe;this.detach?.();let s=document.createElement("iframe");return s.setAttribute("sandbox","allow-scripts"),s.setAttribute("referrerpolicy","no-referrer"),s.setAttribute("loading","lazy"),s.className="dashboard-widget__frame",s.title=e.widget.title,s.src=r,s.setAttribute("data-test-id","boardstate-custom-widget-frame"),this.detach=Cd({iframe:s,widget:e.widget,manifest:e.manifest,context:e.context}),this.iframe=s,this.key=a,s}disconnected(){this.detach?.(),this.detach=null,this.iframe=null,this.key=""}},Pd=zt(Nd);function Od(e){return u`<div class="dashboard-widget__custom" data-test-id="boardstate-custom-widget">
    ${Pd(e)}
  </div>`}function B(e){return u`<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    ${e}
  </svg>`}var I={spark:B(_`<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />`),x:B(_`<path d="M18 6L6 18M6 6l12 12" />`),plus:B(_`<path d="M12 5v14M5 12h14" />`),eyeOff:B(_`<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />`),chevronRight:B(_`<path d="M9 18l6-6-6-6" />`),chevronDown:B(_`<path d="M6 9l6 6 6-6" />`),arrowUpDown:B(_`<path d="M7 15l5 5 5-5M7 9l5-5 5 5" />`),moreHorizontal:B(_`<circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />`),externalLink:B(_`<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14L21 3" />`),clock:B(_`<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />`),puzzle:B(_`<path d="M4 7h3a1.5 1.5 0 1 0 3 0h3v3a1.5 1.5 0 1 1 0 3v3h-3a1.5 1.5 0 1 0-3 0H4v-3a1.5 1.5 0 1 1 0-3z" />`),maximize:B(_`<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />`),minimize:B(_`<path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />`)};var Or=()=>new Bd,Bd=class{},bt=new WeakMap,Ce=zt(class extends za{render(e){return p}update(e,[t]){let r=t!==this.G;return r&&this.rt(void 0),(r||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),p}rt(e){if(this.G!==void 0)if(this.isConnected||(e=void 0),typeof this.G=="function"){let t=this.ht??globalThis,r=bt.get(t);r===void 0&&(r=new WeakMap,bt.set(t,r)),r.get(this.G)!==void 0&&this.G.call(this.ht,void 0),r.set(this.G,e),e!==void 0&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){return typeof this.G=="function"?bt.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),Ye={"common.save":"Save","common.cancel":"Cancel","common.reload":"Reload","common.loading":"Loading\u2026","common.dismiss":"Dismiss","dashboard.header.subtitle":"Your pinned widgets and workspaces.","dashboard.tabs.label":"Workspaces","dashboard.tabs.hidden":"Hidden ({count})","dashboard.error.title":"Couldn\u2019t load your workspace","dashboard.error.subtitle":"Something went wrong reading the workspace document.","dashboard.error.detailSummary":"Error detail","dashboard.empty.onboardingTitle":"No workspaces yet","dashboard.empty.onboardingSubtitle":"Ask the agent to add a workspace tab, or use the CLI.","dashboard.empty.onboardingCommand":"boardstate tab add <name>","dashboard.empty.noVisibleTabs":"All workspace tabs are hidden.","dashboard.empty.tabTitle":"This workspace is empty","dashboard.empty.tabSubtitle":"Ask the agent to add a widget here.","dashboard.onboarding.title":"Add your first workspace","dashboard.onboarding.primary":"Ask the agent to create a workspace tab for you.","dashboard.onboarding.secondary":"Or add one from the CLI:","dashboard.widget.editTitleTitle":"Edit widget title","dashboard.widget.editTitleLabel":"Widget title","dashboard.widget.moveToTabTitle":"Move widget to tab","dashboard.widget.moveToTabEmpty":"There are no other tabs to move this widget to.","dashboard.widget.menu.editTitle":"Edit title","dashboard.widget.menu.moveToTab":"Move to tab","dashboard.widget.menu.hide":"Hide","dashboard.widget.menu.remove":"Remove","dashboard.widget.provenanceChip":"AI","dashboard.widget.provenanceTooltip":"Created by {agent}","dashboard.widget.agentChipTooltip":"Built by {agent}","dashboard.widget.expand":"Expand widget","dashboard.widget.collapse":"Collapse widget","dashboard.widget.moveHandle":"Move widget","dashboard.widget.resizeHandle":"Resize widget","dashboard.widget.menuLabel":"Widget menu","dashboard.widget.errorTitle":"This widget hit an error","dashboard.widget.errorHumane":"The rest of your workspace is unaffected.","dashboard.widget.errorDetailSummary":"Error detail","dashboard.widget.customPlaceholder":"Custom widget","dashboard.widget.customLoading":"Loading widget\u2026","dashboard.widget.unknownKind":"Unknown widget: {kind}","dashboard.widget.approval.title":"Approve this widget?","dashboard.widget.approval.byAgent":"Requested by {agent}","dashboard.widget.approval.byUnknown":"Requested by an agent","dashboard.widget.approval.approve":"Approve","dashboard.widget.approval.reject":"Reject","dashboard.widget.approval.unavailable":"This widget is unavailable.","dashboard.widget.stat.empty":"\u2014","dashboard.widget.markdownEmpty":"Nothing to show yet.","dashboard.widget.markdown.taskChecked":"checked","dashboard.widget.markdown.taskUnchecked":"unchecked","dashboard.widget.table.empty":"No rows to show.","dashboard.widget.table.more":"+{count} more","dashboard.widget.sessions.empty":"No sessions yet.","dashboard.widget.usage.cost":"Cost","dashboard.widget.usage.tokens":"Tokens","dashboard.widget.cron.empty":"No scheduled jobs.","dashboard.widget.cron.next":"Next {time}","dashboard.widget.cron.noNext":"Not scheduled","dashboard.widget.instances.empty":"No connected instances.","dashboard.widget.instances.idle":"idle {duration}","dashboard.widget.activity.empty":"No recent activity.","dashboard.widget.embed.missing":"No URL configured for this embed.","dashboard.widget.embed.blockedExternal":"External embeds are blocked by policy.","dashboard.widget.embed.blockedScheme":"This URL scheme cannot be embedded.","dashboard.widget.chart.empty":"No data to chart.","dashboard.widget.chart.label":"Chart","dashboard.widget.notes.placeholder":"Write a note\u2026","dashboard.widget.notes.readonlyHint":"Connect to the gateway to edit and save notes.","dashboard.widget.actionForm.empty":"This action form has no fields yet.","dashboard.widget.actionForm.submit":"Send","dashboard.widget.actionForm.toolPending":"Submitted \u2014 waiting for operator confirmation.","dashboard.widget.actionButton.run":"Run","dashboard.widget.actionButton.invoking":"Invoking\u2026","dashboard.widget.actionButton.pending":"Waiting for operator confirmation\u2026","dashboard.widget.actionButton.confirm":"Confirm","dashboard.widget.actionButton.deny":"Deny","dashboard.widget.actionButton.operatorOnly":"Only the local operator can confirm this action.","dashboard.widget.actionButton.confirmed":"Confirmed.","dashboard.widget.actionButton.denied":"Denied by the operator.","dashboard.widget.actionButton.expired":"The confirmation window expired.","dashboard.widget.actionButton.resultLabel":"Result","dashboard.widget.actionButton.errorLabel":"Error","dashboard.widget.actionButton.disconnected":"Connect to the gateway to run this action.","dashboard.widget.actionButton.misconfigured":"This action is missing a connector or tool.","dashboard.widget.preview.missing":"This preview has no URL yet.","dashboard.widget.preview.blockedExternal":"External previews are disabled by your gateway policy.","dashboard.widget.preview.blockedScheme":"This preview URL uses an unsupported scheme.","dashboard.widget.preview.reload":"Reload preview","dashboard.widget.preview.viewport.desktop":"Desktop","dashboard.widget.preview.viewport.tablet":"Tablet","dashboard.widget.preview.viewport.mobile":"Mobile","dashboard.widget.agentStatus.empty":"No agents yet.","dashboard.widget.agentStatus.busy":"Busy","dashboard.widget.agentStatus.idle":"Idle","dashboard.widget.agentStatus.progress":"{percent}% of budget","dashboard.widget.approvals.empty":"No pending approvals.","dashboard.widget.approvals.approve":"Approve","dashboard.widget.approvals.deny":"Deny","dashboard.widget.approvals.confirm":"Confirm","dashboard.widget.approvals.requestedBy":"Requested by {agent}","dashboard.widget.approvals.kind.widget":"Widget","dashboard.widget.approvals.kind.capability":"Data source","dashboard.widget.approvals.kind.action":"Action","dashboard.widget.approvals.autoConfirm":"Auto-run","dashboard.widget.approvals.autoConfirmHint":"Runs without confirmation each time","dashboard.widget.approvals.scopeLabel":"Agents","dashboard.widget.approvals.scopeAll":"All agents","dashboard.widget.approvals.scopedTo":"Scoped to {agents}","dashboard.widget.approvals.ttlLabel":"Expires in (min)","dashboard.widget.approvals.expiresIn":"Expires in {duration}","dashboard.widget.approvals.expiresSoon":"Expiring\u2026","dashboard.widget.approvals.save":"Save","dashboard.widget.approvals.revoke":"Revoke","dashboard.widget.chat.empty":"Ask the agent to build or change this board\u2026","dashboard.widget.chat.placeholder":"Message the agent\u2026","dashboard.widget.chat.send":"Send","dashboard.widget.chat.stop":"Stop","dashboard.widget.chat.disconnected":"Connect to the gateway to chat with the agent.","dashboard.widget.chat.roleUser":"You","dashboard.widget.chat.roleAssistant":"Agent","dashboard.widget.chat.actionsOne":"1 action","dashboard.widget.chat.actionsMany":"{count} actions","dashboard.widget.chat.building":"building\u2026","dashboard.widget.chat.retrying":"retrying\u2026","dashboard.widget.chat.jumpToLatest":"Jump to latest","dashboard.widget.chat.args":"Arguments","dashboard.widget.chat.result":"Result","dashboard.widget.chat.tool.readBoard":"Read the board","dashboard.widget.chat.tool.createdTab":"Created tab {name}","dashboard.widget.chat.tool.addedWidget":"Added widget {id}","dashboard.widget.chat.approveTitle":"The agent scaffolded widget \u201C{name}\u201D","dashboard.widget.chat.approve":"Approve","dashboard.widget.chat.reject":"Reject","common.close":"Close","common.back":"Back","dashboard.tabs.presence":"{count} viewing","dashboard.tabs.private":"Private \u2014 only you can see this tab","dashboard.tabs.groupUser":"You","dashboard.tabs.groupSystem":"System","dashboard.tabs.groupAgent":"{agent}","dashboard.tabs.collapseGroup":"Collapse {group} tabs","dashboard.tabs.expandGroup":"Expand {group} tabs","dashboard.header.fullBleedEnter":"Full-bleed","dashboard.header.fullBleedExit":"Exit full-bleed","dashboard.agentFilter.label":"Agents","dashboard.agentFilter.all":"All","dashboard.widget.ephemeralBadge":"Temporary","dashboard.widget.ephemeralTooltip":"Temporary answer \u2014 pin it to keep it here.","dashboard.widget.menu.pin":"Pin","dashboard.widget.blame.createdBy":"Created by {actor}","dashboard.widget.blame.createdByVersion":"Created by {actor} \xB7 v{version}","dashboard.widget.blame.logbookLink":"View in logbook","dashboard.history.open":"History","dashboard.history.title":"Workspace history","dashboard.history.subtitle":"Review recent changes, compare against now, and undo the last one.","dashboard.history.empty":"No history yet \u2014 changes appear here after your first edit.","dashboard.history.emptyDetail":"Select a version to preview it.","dashboard.history.version":"Version {version}","dashboard.history.latest":"Latest change","dashboard.history.previewTitle":"Snapshot","dashboard.history.previewEmpty":"This tab had no widgets at this point.","dashboard.history.diffTitle":"Changes since this version","dashboard.history.diffEmpty":"Nothing changed since this version.","dashboard.history.restore":"Undo last change","dashboard.history.restoreConfirm":"Undo the most recent change?","dashboard.history.restoreOnlyNewest":"Only the most recent change can be undone.","dashboard.history.actorUnknown":"Unknown","dashboard.history.kind.widget-added":"Added","dashboard.history.kind.widget-removed":"Removed","dashboard.history.kind.widget-moved":"Moved","dashboard.history.kind.widget-retitled":"Retitled","dashboard.history.kind.tab-added":"Tab added","dashboard.history.kind.tab-removed":"Tab removed","dashboard.history.kind.tab-retitled":"Tab retitled","dashboard.history.summary.added":"+{count}","dashboard.history.summary.removed":"\u2212{count}","dashboard.history.summary.moved":"{count} moved","dashboard.history.summary.retitled":"{count} renamed","dashboard.history.summary.tabs":"{count} tabs","dashboard.history.summary.minor":"Other edit","dashboard.history.previewCaption":"Layout at version {version}","dashboard.gallery.open":"Widget gallery","dashboard.gallery.title":"Widget gallery","dashboard.gallery.subtitle":"Browse a widget registry and install a widget from its URL.","dashboard.gallery.urlLabel":"Registry index URL","dashboard.gallery.urlPlaceholder":"https://example.com/widgets/index.json","dashboard.gallery.browse":"Browse","dashboard.gallery.view":"View","dashboard.gallery.install":"Install","dashboard.gallery.empty":"No widgets found at this registry.","dashboard.gallery.capabilities":"Requested capabilities","dashboard.gallery.noCapabilities":"No special capabilities requested.","dashboard.gallery.pendingNote":"Installed widgets stay pending until you approve them, then run sandboxed.","dashboard.gallery.tabWidgets":"Widgets","dashboard.gallery.tabTemplates":"Templates","dashboard.gallery.recipesEmpty":"No templates found at this registry.","dashboard.gallery.recipeNeedsNothing":"Works out of the box \u2014 no grants required.","dashboard.gallery.recipeNeedsConnectors":"Needs: {connectors}","dashboard.gallery.recipeNeedsLabel":"This board will ask for these tools","dashboard.gallery.recipeNoGrants":"No external tools \u2014 installs ready to use.","dashboard.gallery.recipeReadOnly":"read-only","dashboard.gallery.recipeInstall":"Install template","dashboard.gallery.recipeInstallNote":"Installing imports the board with its grants requested \u2014 approve them in the approvals widget to light it up.","dashboard.distribution.export":"Export","dashboard.distribution.exportTitle":"Download this workspace as a JSON file","dashboard.distribution.import":"Import","dashboard.distribution.importTitle":"Import a workspace from a JSON file"};function Ld(e,t){return t?e.replace(/\{(\w+)\}/g,(r,a)=>Object.hasOwn(t,a)?t[a]:r):e}var Wa={...Ye};function Dd(e){Wa=e?{...Ye,...e}:{...Ye}}function d(e,t){return Ld(Wa[e]??Ye[e]??e,t)}function Ud(e){if(e===void 0)return"";if(typeof e=="string")return e;try{return JSON.stringify(e,null,2)}catch{return String(e)}}var zd=class{constructor(e){this.widgetId=e,this.root=null,this.ctx=null,this.widget=null,this.phase={kind:"idle"},this.unsubscribe=null,this.rootRef=t=>{t instanceof HTMLElement?this.mount(t):this.destroy()},this.onInvoke=()=>{let t=this.ctx?.actions;if(!t||!this.widget)return;let r=Er(this.widget);if(!r.connector||!r.tool){this.setPhase({kind:"error",message:d("dashboard.widget.actionButton.misconfigured")});return}this.setPhase({kind:"running"}),t.invoke({connector:r.connector,tool:r.tool,...r.args?{args:r.args}:{}}).then(a=>{this.setPhase(a.kind==="pending"?{kind:"pending",id:a.id,expiresAt:a.expiresAt}:{kind:"result",value:a.result})}).catch(a=>{this.setPhase({kind:"error",message:a instanceof Error?a.message:String(a)})})},this.onConfirm=t=>{let r=this.ctx?.actions?.confirm;r&&(this.setPhase({kind:"running"}),r(t).then(({result:a})=>this.setPhase({kind:"result",value:a})).catch(a=>{this.setPhase({kind:"error",message:a instanceof Error?a.message:String(a)})}))},this.onDeny=t=>{let r=this.ctx?.actions?.deny;r&&r(t).then(()=>this.setPhase({kind:"denied"})).catch(a=>{this.setPhase({kind:"error",message:a instanceof Error?a.message:String(a)})})}}setContext(e,t){this.ctx=e,this.widget=t,this.root&&this.renderIsland()}mount(e){this.root=e,this.unsubscribe?.(),this.unsubscribe=null,this.phase={kind:"idle"},this.renderIsland();let t=this.ctx?.actions;t&&(this.unsubscribe=t.subscribe(r=>this.onActionChange(r)))}destroy(){this.unsubscribe?.(),this.unsubscribe=null,this.root=null,xt.delete(this.widgetId)}onActionChange(e){if(!(this.phase.kind!=="pending"||e.id!==this.phase.id)){if(e.status==="confirmed")this.phase={kind:"confirmed"};else if(e.status==="denied")this.phase={kind:"denied"};else if(e.status==="expired")this.phase={kind:"expired"};else return;this.renderIsland()}}setPhase(e){this.phase=e,this.renderIsland()}renderIsland(){this.root&&It(this.template(),this.root)}template(){let e=this.ctx?.actions,t=(this.widget?Er(this.widget):null)?.label??d("dashboard.widget.actionButton.run"),r=this.phase.kind==="running"||this.phase.kind==="pending";return u`
      <div class="dashboard-action-button" data-test-id="dashboard-action-button">
        <button
          class="bs-btn bs-btn--small bs-btn--primary dashboard-action-button__invoke"
          type="button"
          data-test-id="dashboard-action-button-invoke"
          ?disabled=${!e||r}
          @click=${this.onInvoke}
        >
          ${t}
        </button>
        ${e?this.renderStatus():u`<div
                class="dashboard-action-button__hint"
                data-test-id="dashboard-action-button-disconnected"
              >
                ${d("dashboard.widget.actionButton.disconnected")}
              </div>`}
      </div>
    `}renderStatus(){switch(this.phase.kind){case"idle":return p;case"running":return u`<div class="dashboard-action-button__status" data-status="running">
          ${d("dashboard.widget.actionButton.invoking")}
        </div>`;case"pending":return this.renderPending(this.phase.id);case"confirmed":return u`<div
          class="dashboard-action-button__status"
          data-status="confirmed"
          data-test-id="dashboard-action-button-confirmed"
        >
          ${d("dashboard.widget.actionButton.confirmed")}
        </div>`;case"denied":return u`<div
          class="dashboard-action-button__status"
          data-status="denied"
          data-test-id="dashboard-action-button-denied"
        >
          ${d("dashboard.widget.actionButton.denied")}
        </div>`;case"expired":return u`<div
          class="dashboard-action-button__status"
          data-status="expired"
          data-test-id="dashboard-action-button-expired"
        >
          ${d("dashboard.widget.actionButton.expired")}
        </div>`;case"result":return u`<div class="dashboard-action-button__result" data-status="result">
          <div class="dashboard-action-button__result-label">
            ${d("dashboard.widget.actionButton.resultLabel")}
          </div>
          <pre
            class="dashboard-action-button__result-body"
            data-test-id="dashboard-action-button-result"
          >
${Ud(this.phase.value)}</pre>
        </div>`;case"error":return u`<div
          class="dashboard-action-button__error"
          role="alert"
          data-test-id="dashboard-action-button-error"
        >
          <span class="dashboard-action-button__result-label"
            >${d("dashboard.widget.actionButton.errorLabel")}</span
          >
          <span class="dashboard-action-button__error-message">${this.phase.message}</span>
        </div>`}}renderPending(e){let t=!!(this.ctx?.actions?.confirm&&this.ctx?.actions?.deny);return u`
      <div
        class="dashboard-action-button__pending"
        data-status="pending"
        data-test-id="dashboard-action-button-pending"
      >
        <span class="dashboard-action-button__status-text"
          >${d("dashboard.widget.actionButton.pending")}</span
        >
        ${t?u`<span class="dashboard-action-button__pending-actions">
                <button
                  class="bs-btn bs-btn--small bs-btn--primary"
                  type="button"
                  data-test-id="dashboard-action-button-confirm"
                  @click=${()=>this.onConfirm(e)}
                >
                  ${d("dashboard.widget.actionButton.confirm")}
                </button>
                <button
                  class="bs-btn bs-btn--small"
                  type="button"
                  data-test-id="dashboard-action-button-deny"
                  @click=${()=>this.onDeny(e)}
                >
                  ${d("dashboard.widget.actionButton.deny")}
                </button>
              </span>`:u`<span
                class="dashboard-action-button__operator-only"
                data-test-id="dashboard-action-button-operator-only"
                >${d("dashboard.widget.actionButton.operatorOnly")}</span
              >`}
      </div>
    `}},xt=new Map;function Wd(e,t,r){let a=xt.get(e.id);return a||(a=new zd(e.id),xt.set(e.id,a)),a.setContext(r,e),u`<div class="dashboard-action-button-host" ${Ce(a.rootRef)}></div>`}function Hd(e){let t=e.type==="select"?u`<select class="dashboard-action-form__control" name=${e.name}>
          ${(e.options??[]).map(r=>u`<option value=${r}>${r}</option>`)}
        </select>`:u`<input
          class="dashboard-action-form__control"
          type=${e.type==="number"?"number":"text"}
          name=${e.name}
          maxlength=${e.maxLength??200}
        />`;return u`<label class="dashboard-action-form__field">
    <span class="dashboard-action-form__label">${e.label}</span>
    ${t}
  </label>`}function jd(e,t,r,a,s){if(!a.actions||!e.connector||!e.tool)return;let o=li(e,r);a.actions.invoke({connector:e.connector,tool:e.tool,args:o}).then(n=>{n.kind==="pending"&&a.onActionError?.(d("dashboard.widget.actionForm.toolPending")),s.reset()}).catch(n=>{a.onActionError?.(n instanceof Error?n.message:String(n))})}function qd(e,t,r){let a=ii(e);if(a.fields.length===0||!a.template)return u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.actionForm.empty")}
    </div>`;let s=n=>{let i={};for(let l of a.fields){let c=n.elements.namedItem(l.name);i[l.name]=c&&"value"in c?String(c.value??""):""}return i};return u`
    <form class="dashboard-action-form" data-test-id="dashboard-action-form" @submit=${n=>{n.preventDefault();let i=n.currentTarget,l=s(i);if(a.mode==="tool"){jd(a,e,l,r,i);return}let c=di(a,l);!c.trim()||!r.dispatchPrompt||r.dispatchPrompt({widgetKey:`builtin:action-form:${e.id}`,text:c}).then(b=>{b==="sent"&&i.reset()}).catch(b=>{r.onActionError?.(b instanceof Error?b.message:String(b))})}}>
      ${a.fields.map(Hd)}
      <button
        class="bs-btn bs-btn--small bs-btn--primary dashboard-action-form__submit"
        type="submit"
      >
        ${a.buttonLabel??d("dashboard.widget.actionForm.submit")}
      </button>
    </form>
    ${(a.mode==="tool"?r.actions:r.dispatchPrompt)?p:u`<span hidden data-test-id="dashboard-action-form-inert"></span>`}
  `}function Fd(e){let t=Number.isFinite(e)?e:0;return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(t)}function Vd(e){let t=Number.isFinite(e)?e:0;return new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1}).format(t)}function Wt(e){if(!Number.isFinite(e))return"";try{return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(e))}catch{return new Date(e).toISOString()}}function Gd(e){if(!Number.isFinite(e)||e<0)return"";let t=Math.round(e/1e3);if(t<60)return`${t}s`;let r=Math.floor(t/60),a=t%60;if(r<60)return a?`${r}m ${a}s`:`${r}m`;let s=Math.floor(r/60),o=r%60;return o?`${s}h ${o}m`:`${s}h`}function Kd(e){return e==="ok"?"dashboard-badge--ok":e==="error"?"dashboard-badge--error":"dashboard-badge--muted"}function Yd(e,t){let r=Xn(e,t);return r.entries.length===0?u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.activity.empty")}
    </div>`:u`
    <ul class="dashboard-feed" data-test-id="dashboard-activity">
      ${r.entries.map(a=>u`
          <li class="dashboard-feed__row">
            <div class="dashboard-feed__head">
              <span class="dashboard-feed__title">${a.title}</span>
              ${a.status?u`<span class="dashboard-badge ${Kd(a.status)}"
                      >${a.status}</span
                    >`:p}
              ${a.ts!==null?u`<span class="dashboard-feed__time">${Wt(a.ts)}</span>`:p}
            </div>
            ${a.detail?u`<div class="dashboard-feed__detail">${a.detail}</div>`:p}
          </li>
        `)}
    </ul>
  `}function Xd(e,t){let r=yi(e,t);return r.rows.length===0?u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.agentStatus.empty")}
    </div>`:u`
    <ul class="dashboard-list dashboard-agent-status" data-test-id="dashboard-agent-status">
      ${r.rows.map(a=>u`
          <li class="dashboard-list__row">
            <span
              class="dashboard-dot ${a.active?"dashboard-dot--live":""}"
              aria-hidden="true"
            ></span>
            <span class="dashboard-list__label">${a.label}</span>
            <span
              class="dashboard-badge ${a.active?"dashboard-badge--ok":"dashboard-badge--muted"}"
            >
              ${a.active?d("dashboard.widget.agentStatus.busy"):d("dashboard.widget.agentStatus.idle")}
            </span>
            ${a.task?u`<span class="dashboard-list__meta">${a.task}</span>`:p}
            ${a.progress!==null?u`<span class="dashboard-list__meta"
                    >${d("dashboard.widget.agentStatus.progress",{percent:String(Math.round(a.progress*100))})}</span
                  >`:p}
          </li>
        `)}
    </ul>
  `}function Jd(e){return d(e==="capability"?"dashboard.widget.approvals.kind.capability":e==="action"?"dashboard.widget.approvals.kind.action":"dashboard.widget.approvals.kind.widget")}function Br(e,t){let r=e.currentTarget?.closest("li");return r?[...r.querySelectorAll(t)].filter(a=>a.checked).map(a=>a.value):[]}function Zd(e){let t=e.currentTarget?.closest("li")?.querySelector("input.dashboard-approvals__ttl"),r=t&&t.value.trim()!==""?Number(t.value):NaN;if(!(!Number.isFinite(r)||r<=0))return new Date(Date.now()+r*6e4).toISOString()}function Qd(e,t){let r=Zd(e);if(!t)return r!==void 0?{expiresAt:r}:{};let a=Br(e,"input.dashboard-approvals__grant"),s=Br(e,"input.dashboard-approvals__auto");return{tools:a,...s.length?{autoConfirm:s.filter(o=>a.includes(o))}:{},...r!==void 0?{expiresAt:r}:{}}}function el(e){let t=Date.parse(e)-Date.now();if(Number.isNaN(t)||t<=0)return d("dashboard.widget.approvals.expiresSoon");let r=Math.round(t/6e4),a=Math.floor(r/60);return d("dashboard.widget.approvals.expiresIn",{duration:a>0?`${a}h ${r%60}m`:`${r}m`})}function tl(e){let t=e.agents??[],r=t.length>0?d("dashboard.widget.approvals.scopedTo",{agents:t.join(", ")}):d("dashboard.widget.approvals.scopeAll");return u`<span
    class="dashboard-approvals__scope"
    data-test-id="dashboard-approvals-scope"
    data-agents=${t.join(",")}
    >${d("dashboard.widget.approvals.scopeLabel")}: ${r}</span
  >`}function rl(e){let t=e.tools??[],r=new Set(e.autoConfirm??[]);return u`<ul class="dashboard-approvals__tools" data-test-id="dashboard-approvals-tools">
    ${t.map(a=>u`<li>
          <label class="dashboard-approvals__grant-label"
            ><input type="checkbox" class="dashboard-approvals__grant" value=${a} checked /><span
              >${a}</span
            ></label
          >
          <label
            class="dashboard-approvals__auto-label"
            title=${d("dashboard.widget.approvals.autoConfirmHint")}
            ><input
              type="checkbox"
              class="dashboard-approvals__auto"
              value=${a}
              ?checked=${r.has(a)}
            /><span>${d("dashboard.widget.approvals.autoConfirm")}</span></label
          >
        </li>`)}
  </ul>`}function al(e,t,r){let a=r.approvals,s=xi(e,a);return s.items.length===0?u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.approvals.empty")}
    </div>`:u`
    <ul class="dashboard-list dashboard-approvals" data-test-id="dashboard-approvals">
      ${s.items.map(o=>{let n=o.kind==="capability",i=n&&(o.tools??[]).length>0,l=o.granted?d("dashboard.widget.approvals.save"):o.kind==="action"?d("dashboard.widget.approvals.confirm"):d("dashboard.widget.approvals.approve"),c=h=>{if(!n){a?.onDecide(o,"approve");return}let y=Qd(h,i);Object.keys(y).length>0?a?.onDecide(o,"approve",y):a?.onDecide(o,"approve")},b=o.granted?d("dashboard.widget.approvals.revoke"):d("dashboard.widget.approvals.deny");return u`
          <li
            class="dashboard-list__row ${o.granted?"dashboard-approvals__row--granted":""}"
          >
            <span class="dashboard-badge dashboard-badge--muted">${Jd(o.kind)}</span>
            <span class="dashboard-list__label">${o.title}</span>
            ${o.detail?u`<span class="dashboard-list__meta">${o.detail}</span>`:o.requestedBy?u`<span class="dashboard-list__meta"
                      >${d("dashboard.widget.approvals.requestedBy",{agent:o.requestedBy})}</span
                    >`:p}
            ${o.expiresAt?u`<span
                    class="dashboard-approvals__countdown"
                    data-test-id="dashboard-approvals-countdown"
                    >${el(o.expiresAt)}</span
                  >`:p}
            ${i?rl(o):p}
            ${n?tl(o):p}
            ${n?u`<label class="dashboard-approvals__ttl-label"
                    >${d("dashboard.widget.approvals.ttlLabel")}
                    <input
                      type="number"
                      min="1"
                      class="dashboard-approvals__ttl"
                      data-test-id="dashboard-approvals-ttl"
                  /></label>`:p}
            <span class="dashboard-approvals__actions">
              <button
                class="bs-btn bs-btn--small bs-btn--primary"
                type="button"
                data-test-id="dashboard-approvals-approve"
                @click=${c}
              >
                ${l}
              </button>
              <button
                class="bs-btn bs-btn--small"
                type="button"
                data-test-id="dashboard-approvals-deny"
                @click=${()=>a?.onDecide(o,"reject")}
              >
                ${b}
              </button>
            </span>
          </li>
        `})}
    </ul>
  `}var G=100,O=40,A=2;function Be(e,t,r){let a=r-t;if(a<=0)return O/2;let s=(e-t)/a;return O-A-s*(O-A*2)}function Ne(e,t){return t<=1?G/2:A+e/(t-1)*(G-A*2)}function Ht(e,t,r){return e.map((a,s)=>`${Ne(s,e.length)},${Be(a,t,r)}`).join(" ")}var sl=new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1});function fe(e){return Number.isFinite(e)?sl.format(e):""}function Ha(e){if(e.length<2)return"flat";let t=e[0],r=e[e.length-1];return r>t?"up":r<t?"down":"flat"}function ol(e){let t=Be(e.values[e.values.length-1]??0,e.min,e.max);return t<O/3?"top":t>O*2/3?"bottom":"middle"}function nl(e){return _`<polyline
    class="dashboard-chart__line"
    fill="none"
    points=${Ht(e.values,e.min,e.max)}
  />`}function il(e){let t=Ht(e.values,e.min,e.max),r=Ne(0,e.values.length),a=Ne(e.values.length-1,e.values.length),s=O-A;return _`<g>
    <polygon class="dashboard-chart__area" points=${`${r},${s} ${t} ${a},${s}`} />
    <polyline class="dashboard-chart__line" fill="none" points=${t} />
  </g>`}function dl(e){let t=e.values.length,r=(G-A*2)/t,a=r>3?Math.min(1,r*.2):0,s=Math.max(r-a,.5),o=O-A;return _`<g class="dashboard-chart__bars">
    ${e.values.map((n,i)=>{let l=Be(n,e.min,e.max);return _`<rect x=${A+i*r+a/2} y=${l} width=${s} height=${Math.max(o-l,0)} />`})}
  </g>`}function ll(e,t){let r=e.values.length?e.values[e.values.length-1]:0,a=T(t.min)??Math.min(e.min,0),s=(T(t.max)??Math.max(e.max,r))-a,o=s>0?Math.min(Math.max((r-a)/s,0),1):0,n=G/2,i=O-A,l=Math.min(G/2,O)-A,c=v=>{let w=Math.PI-v*Math.PI;return{x:n+l*Math.cos(w),y:i-l*Math.sin(w)}},b=c(0),h=c(1),y=c(o);return _`<g class="dashboard-chart__gauge">
    <path class="dashboard-chart__gauge-track" fill="none" d=${`M ${b.x} ${b.y} A ${l} ${l} 0 0 1 ${h.x} ${h.y}`} />
    <path class="dashboard-chart__gauge-fill" fill="none" d=${`M ${b.x} ${b.y} A ${l} ${l} 0 0 1 ${y.x} ${y.y}`} />
    <line class="dashboard-chart__gauge-needle" x1=${n} y1=${i} x2=${y.x} y2=${y.y} />
  </g>`}function cl(e){let t=e.values.length,r=Ha(e.values);return t<2?_`<g class="dashboard-chart__spark dashboard-chart__spark--${r}">
      <circle class="dashboard-chart__spark-dot" cx=${Ne(0,t)} cy=${Be(e.values[0]??0,e.min,e.max)} r="1.5" />
    </g>`:_`<g class="dashboard-chart__spark dashboard-chart__spark--${r}">
    <polyline class="dashboard-chart__line" fill="none" points=${Ht(e.values,e.min,e.max)} />
  </g>`}function ja(e){return e==="line"||e==="area"||e==="bar"}function ul(){return _`<g class="dashboard-chart__grid">
    ${[A,O/2,O-A].map(e=>_`<line x1=${A} y1=${e} x2=${G-A} y2=${e} />`)}
  </g>`}function bl(e){let t=e.values.length;if(e.type==="bar"){let r=(G-A*2)/t;return _`<g class="dashboard-chart__tips">
      ${e.values.map((a,s)=>_`<rect class="dashboard-chart__tip" x=${A+s*r} y=${A} width=${r} height=${O-A*2}><title>${fe(a)}</title></rect>`)}
    </g>`}if(e.type==="gauge"){let r=t?e.values[t-1]:0;return _`<g class="dashboard-chart__tips">
      <rect class="dashboard-chart__tip" x=${A} y=${A} width=${G-A*2} height=${O-A*2}><title>${fe(r)}</title></rect>
    </g>`}return _`<g class="dashboard-chart__tips">
    ${e.values.map((r,a)=>_`<circle class="dashboard-chart__tip" cx=${Ne(a,t)} cy=${Be(r,e.min,e.max)} r="2.5"><title>${fe(r)}</title></circle>`)}
  </g>`}function hl(e,t){switch(e.type){case"bar":return dl(e);case"area":return il(e);case"gauge":return ll(e,t);case"sparkline":return cl(e);default:return nl(e)}}function pl(e,t){let r=hl(e,t);return!e.detail||e.type==="sparkline"?r:_`<g>
    ${ja(e.type)?ul():p}
    ${r}
    ${bl(e)}
  </g>`}function gl(e,t){let r=ri(e,t);if(r.values.length===0)return u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.chart.empty")}
    </div>`;let a=S(e),s=r.detail&&r.type!=="sparkline",o=s&&ja(r.type),n=r.type==="sparkline"&&r.label,i=s?" dashboard-chart--detail":"";return u`
    <div class="dashboard-chart dashboard-chart--${r.type}${i}">
      <svg
        class="dashboard-chart__svg"
        viewBox="0 0 ${G} ${O}"
        preserveAspectRatio="none"
        role="img"
        aria-label=${e.title??d("dashboard.widget.chart.label")}
        data-test-id="dashboard-chart"
      >
        ${pl(r,a)}
      </svg>
      ${o?u`<span class="dashboard-chart__axis dashboard-chart__axis--max"
                >${fe(r.max)}</span
              ><span class="dashboard-chart__axis dashboard-chart__axis--min"
                >${fe(r.min)}</span
              >`:p}
      ${n?u`<span
              class="dashboard-chart__spark-value dashboard-chart__spark-value--${Ha(r.values)} dashboard-chart__spark-value--${ol(r)}"
              >${fe(r.values[r.values.length-1]??0)}</span
            >`:p}
    </div>
  `}var $t=class extends Da{constructor(e){if(super(e),this.it=p,e.type!==La.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===p||e==null)return this._t=void 0,this.it=e;if(e===se)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};$t.directiveName="unsafeHTML",$t.resultType=1;var qa=zt($t);function re(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function fl(e){return/^https?:\/\//i.test(e.trim())}function Pe(e){let t=e;return t=t.replace(/`([^`]+)`/g,(r,a)=>`<code>${a}</code>`),t=t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(r,a,s)=>fl(s)?`<a href="${s}" rel="noopener noreferrer">${a}</a>`:r),t=t.replace(/\*\*([^*]+)\*\*/g,(r,a)=>`<strong>${a}</strong>`),t=t.replace(/(^|[^*])\*([^*]+)\*/g,(r,a,s)=>`${a}<em>${s}</em>`),t=t.replace(/(^|[^_])_([^_]+)_/g,(r,a,s)=>`${a}<em>${s}</em>`),t}var ml=/^ {0,3}(#{1,6})(?:[ \t]+(.*))?$/;function yl(e){let t=s=>s===" "||s==="	",r=e.length;for(;r>0&&t(e[r-1]);)r-=1;let a=r;for(;r>0&&e[r-1]==="#";)r-=1;if(r===a||r>0&&!t(e[r-1]))return e;for(;r>0&&t(e[r-1]);)r-=1;return e.slice(0,r)}function vl(e){let t=e.split(`
`);return t.every(r=>r.startsWith(">"))?`<blockquote>${t.map(r=>Pe(re(r.replace(/^>\s?/,"")))).join("<br>")}</blockquote>`:`<p>${t.map(r=>Pe(re(r))).join("<br>")}</p>`}function wl(e){let t=/^\[([ xX])\]\s+(.*)$/.exec(e);if(!t)return`<li>${Pe(re(e))}</li>`;let r=t[1]!==" ";return`<li class="dashboard-markdown__task-item">${`<span class="dashboard-markdown__task" role="img" aria-label="${re(d(r?"dashboard.widget.markdown.taskChecked":"dashboard.widget.markdown.taskUnchecked"))}">${r?"\u2611":"\u2610"}</span>`} ${Pe(re(t[2]))}</li>`}function Lr(e,t){let r=e.split(`
`).map(s=>s.replace(t?/^\s*\d+\.\s+/:/^\s*[-*]\s+/,"")).map(wl).join("");if(!t)return`<ul>${r}</ul>`;let a=Number.parseInt(/^\s*(\d+)\./.exec(e)?.[1]??"1",10);return Number.isSafeInteger(a)&&a!==1?`<ol start="${a}">${r}</ol>`:`<ol>${r}</ol>`}function Dr(e){return e.split(`
`).every(t=>/^\s*[-*]\s+/.test(t))}function Ur(e){return e.split(`
`).every(t=>/^\s*\d+\.\s+/.test(t))}function _l(e){return`<pre><code>${re(e.join(`
`))}</code></pre>`}function Fa(e){let t=e.replace(/\r\n?/g,`
`).split(`
`),r=[],a=[],s="",o=()=>{if(a.length===0)return;let n=a.join(`
`);Dr(n)?r.push(Lr(n,!1)):Ur(n)?r.push(Lr(n,!0)):r.push(vl(n)),a=[]};for(let n=0;n<t.length;n+=1){let i=t[n];if(i.startsWith("```")){o();let h=[];for(n+=1;n<t.length&&!t[n].startsWith("```");)h.push(t[n]),n+=1;r.push(_l(h));continue}if(i.trim()===""){o();continue}let l=ml.exec(i);if(l){o();let h=l[1].length,y=yl(l[2]??"");r.push(`<h${h}>${Pe(re(y))}</h${h}>`);continue}let c=Dr(i)?"ul":Ur(i)?"ol":"p",b=/^(?: {4}| {0,3}\t)/.test(i)||/^\s*(?:[-*]|\d+\.)\s*$/.test(i)||c==="ol"&&Number.parseInt(i.trim(),10)!==1;s==="p"&&a.length>0&&b&&(c="p"),c!==s&&o(),s=c,a.push(i)}return o(),r.join(`
`)}function Va(e){return e.status==="ok"?"ok":e.status==="error"?"error":"pending"}function xl(e){return{turn:{turnId:e,items:[],status:"streaming"},textById:new Map,callById:new Map}}function $l(e){return e.items[e.items.length-1]}function _e(e){for(let t of e.items)t.kind==="error"&&t.retryable&&!t.superseded&&(t.superseded=!0)}function F(e,t,r){let a=e.get(r);return a||(a=xl(r),e.set(r,a),t.push(r)),a}function zr(e,t){let r=$l(e);if(r&&r.kind==="tools"){r.calls.push(t);return}e.items.push({kind:"tools",calls:[t]})}function kl(e){let t=new Map,r=[];for(let a of e)switch(a.type){case"turn-start":F(t,r,a.turnId);break;case"text-start":{let{turn:s,textById:o}=F(t,r,a.turnId);if(_e(s),!o.has(a.id)){let n={kind:"text",id:a.id,text:"",closed:!1};o.set(a.id,n),s.items.push(n)}break}case"text-delta":{let{turn:s,textById:o}=F(t,r,a.turnId);_e(s);let n=o.get(a.id);n||(n={kind:"text",id:a.id,text:"",closed:!1},o.set(a.id,n),s.items.push(n)),n.text+=a.delta;break}case"text-end":{let s=t.get(a.turnId)?.textById.get(a.id);s&&(s.closed=!0);break}case"tool-call-start":{let{turn:s,callById:o}=F(t,r,a.turnId);if(_e(s),!o.has(a.callId)){let n={callId:a.callId,name:a.name,argsText:"",status:"building"};o.set(a.callId,n),zr(s,n)}break}case"tool-call-delta":{let s=t.get(a.turnId)?.callById.get(a.callId);s&&(s.argsText+=a.argsTextDelta);break}case"tool-call-ready":{let{turn:s,callById:o}=F(t,r,a.turnId);_e(s);let n=o.get(a.callId);n||(n={callId:a.callId,name:a.name,argsText:"",status:"building"},o.set(a.callId,n),zr(s,n)),n.name=a.name,n.args=a.args,n.status="ready";break}case"tool-result":{let s=t.get(a.turnId)?.callById.get(a.callId);s&&(s.ok=a.ok,s.status=a.ok?"ok":"error",a.result!==void 0&&(s.result=a.result),a.error!==void 0&&(s.error=a.error));break}case"usage":{let{turn:s}=F(t,r,a.turnId);s.usage={inputTokens:a.inputTokens,outputTokens:a.outputTokens};break}case"abort":{let{turn:s}=F(t,r,a.turnId);s.status="aborted";break}case"turn-end":{let{turn:s}=F(t,r,a.turnId);if(s.stopReason!==void 0)break;s.stopReason=a.stopReason,s.status=a.stopReason==="aborted"?"aborted":"complete";break}case"error":{let{turn:s}=F(t,r,a.turnId??r[r.length-1]??"");_e(s),s.items.push({kind:"error",code:a.code,message:a.message,retryable:a.retryable,superseded:!1});break}default:break}return r.map(a=>t.get(a).turn)}function Ga(e){return typeof e=="object"&&e!==null}function xe(e){return typeof e=="string"?e:""}function Wr(e,t){let r=Ga(t)?t:{};switch(e.startsWith("dashboard.")?e.slice(10):e){case"tab.create":{let a=xe(r.title)||xe(r.slug);return a?d("dashboard.widget.chat.tool.createdTab",{name:a}):e}case"widget.add":{let a=xe(r.id)||xe(r.widgetId);return a?d("dashboard.widget.chat.tool.addedWidget",{id:a}):e}case"workspace.get":return d("dashboard.widget.chat.tool.readBoard");default:return e}}function Al(e){return e.map(t=>{let r=Va(t);return r==="ok"?"\u2713":r==="error"?"\u2717":"\xB7"}).join("")}function El(e){return e===1?d("dashboard.widget.chat.actionsOne"):d("dashboard.widget.chat.actionsMany",{count:String(e)})}function Hr(e){try{return JSON.stringify(e,null,2)}catch{return String(e)}}function Tl(e,t){let r=(e.status==="building"||e.status==="ready")&&!e.ok;if(r&&!t)return u`<div class="dashboard-chat__tool-row dashboard-chat__tool-row--building">
      <span class="dashboard-chat__shimmer"></span>
      <span class="dashboard-chat__tool-name">${Wr(e.name,e.args)}</span>
      <span class="dashboard-chat__tool-note">${d("dashboard.widget.chat.building")}</span>
    </div>`;let a=Va(e),s=e.args!==void 0||e.argsText.length>0,o=e.result!==void 0||e.error!==void 0;return u`<div
    class="dashboard-chat__tool-row"
    data-status=${t&&r?"cancelled":a}
  >
    <span class="dashboard-chat__tool-name">
      <span class="dashboard-chat__tool-mark" aria-hidden="true"
        >${a==="ok"?"\u2713":a==="error"?"\u2717":"\xB7"}</span
      >
      ${Wr(e.name,e.args)}
    </span>
    ${s?u`<details class="dashboard-chat__tool-detail">
            <summary>${d("dashboard.widget.chat.args")}</summary>
            <pre>${e.args!==void 0?Hr(e.args):e.argsText}</pre>
          </details>`:p}
    ${o?u`<details class="dashboard-chat__tool-detail">
            <summary>${d("dashboard.widget.chat.result")}</summary>
            <pre>${Hr(e.error??e.result)}</pre>
          </details>`:p}
  </div>`}function Sl(e,t){let r=e.calls.length;return u`<details class="dashboard-chat__tools" data-test-id="dashboard-chat-tools">
    <summary class="dashboard-chat__chip">
      <span aria-hidden="true">🔧</span>
      <span class="dashboard-chat__chip-count">${El(r)}</span>
      <span class="dashboard-chat__chip-sep" aria-hidden="true">·</span>
      <span class="dashboard-chat__chip-marks">${Al(e.calls)}</span>
    </summary>
    <div class="dashboard-chat__tool-log">
      ${e.calls.map(a=>Tl(a,t))}
    </div>
  </details>`}function Rl(e){let t=e.status==="aborted";return u`<div
    class="dashboard-chat__turn dashboard-chat__turn--assistant"
    data-test-id="dashboard-chat-turn"
    data-status=${e.status}
  >
    <div class="dashboard-chat__role">${d("dashboard.widget.chat.roleAssistant")}</div>
    ${e.items.map(r=>r.kind==="text"?u`<div class="dashboard-chat__text markdown-body">
          ${qa(Fa(r.text))}
        </div>`:r.kind==="tools"?Sl(r,t):u`<div
        class="dashboard-chat__error"
        role="alert"
        data-test-id="dashboard-chat-error"
      >
        <span class="dashboard-chat__error-message">${r.message}</span>
        ${r.retryable&&r.superseded?u`<span class="dashboard-chat__error-retry"
                >${d("dashboard.widget.chat.retrying")}</span
              >`:p}
      </div>`)}
  </div>`}function jr(e){return u`<div
    class="dashboard-chat__turn dashboard-chat__turn--user"
    data-test-id="dashboard-chat-user"
  >
    <div class="dashboard-chat__role">${d("dashboard.widget.chat.roleUser")}</div>
    <div class="dashboard-chat__text">${e}</div>
  </div>`}var Ml=100,Il=class{constructor(e){this.widgetId=e,this.root=null,this.ctx=null,this.widget=null,this.events=[],this.unsubscribe=null,this.userMessages=new Map,this.pendingUserText=null,this.sending=!1,this.stickToBottom=!0,this.rootRef=t=>{t instanceof HTMLElement?this.mount(t):this.destroy()},this.onSubmit=t=>{t.preventDefault(),this.send()},this.onTextareaKey=t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),this.send())},this.onStop=t=>{this.ctx?.chat?.abort(t).catch(()=>{})},this.onScroll=t=>{let r=t.currentTarget;this.stickToBottom=r.scrollHeight-r.scrollTop-r.clientHeight<Ml,this.updateJumpPill()},this.jumpToLatest=()=>{let t=this.root?.querySelector(".dashboard-chat__scroll");t&&(this.stickToBottom=!0,t.scrollTop=t.scrollHeight,this.updateJumpPill())}}setContext(e,t){this.ctx=e,this.widget=t,this.root&&this.renderIsland()}mount(e){this.root=e,this.unsubscribe?.(),this.unsubscribe=null,this.events=[],this.userMessages.clear(),this.pendingUserText=null,this.sending=!1,this.stickToBottom=!0,this.renderIsland();let t=this.ctx?.chat;t&&(t.history().then(r=>{this.events=[...r,...this.events],this.renderIsland()}).catch(()=>{}),this.unsubscribe=t.subscribe(r=>{this.events.push(r),this.renderIsland()}))}destroy(){this.unsubscribe?.(),this.unsubscribe=null,this.root=null,kt.delete(this.widgetId)}liveTurnId(e){for(let t=e.length-1;t>=0;t-=1)if(e[t].status==="streaming")return e[t].turnId}send(){let e=this.ctx?.chat,t=this.root?.querySelector(".dashboard-chat__textarea");if(!e||!t)return;let r=t.value.trim();!r||this.sending||(t.value="",this.pendingUserText=r,this.sending=!0,this.stickToBottom=!0,this.renderIsland(),e.send(r).then(({turnId:a})=>{this.userMessages.set(a,r)}).catch(()=>{}).finally(()=>{this.pendingUserText=null,this.sending=!1,this.renderIsland()}))}updateJumpPill(){let e=this.root?.querySelector(".dashboard-chat__jump");e&&(e.hidden=this.stickToBottom)}renderIsland(){if(!this.root)return;let e=kl(this.events),t=this.liveTurnId(e),r=t!==void 0||this.sending,a=this.ctx?.registryPending??[],s=!!this.ctx?.approveWidget,o=r&&s&&a.length>0,n=e.length===0&&this.pendingUserText===null,i=!this.ctx?.chat;if(It(u`
        <div class="dashboard-chat__scroll" @scroll=${this.onScroll}>
          ${n?u`<div class="dashboard-chat__empty" data-test-id="dashboard-chat-empty">
                  ${d("dashboard.widget.chat.empty")}
                </div>`:p}
          ${e.map(l=>{let c=this.userMessages.get(l.turnId);return u`${c!==void 0?jr(c):p}
            ${Rl(l)}`})}
          ${this.pendingUserText!==null?jr(this.pendingUserText):p}
          ${o?a.map(l=>u`<div
                      class="dashboard-chat__approval"
                      data-test-id="dashboard-chat-approval"
                    >
                      <span class="dashboard-chat__approval-title"
                        >${d("dashboard.widget.chat.approveTitle",{name:l})}</span
                      >
                      <span class="dashboard-chat__approval-actions">
                        <button
                          class="bs-btn bs-btn--small bs-btn--primary"
                          type="button"
                          data-test-id="dashboard-chat-approve"
                          @click=${()=>this.ctx?.approveWidget?.(l,"approved")}
                        >
                          ${d("dashboard.widget.chat.approve")}
                        </button>
                        <button
                          class="bs-btn bs-btn--small"
                          type="button"
                          data-test-id="dashboard-chat-reject"
                          @click=${()=>this.ctx?.approveWidget?.(l,"rejected")}
                        >
                          ${d("dashboard.widget.chat.reject")}
                        </button>
                      </span>
                    </div>`):p}
        </div>
        <button
          class="dashboard-chat__jump"
          type="button"
          hidden
          data-test-id="dashboard-chat-jump"
          @click=${this.jumpToLatest}
        >
          ${d("dashboard.widget.chat.jumpToLatest")} ↓
        </button>
        <form class="dashboard-chat__input" @submit=${this.onSubmit}>
          <textarea
            class="dashboard-chat__textarea"
            data-test-id="dashboard-chat-textarea"
            rows="2"
            ?disabled=${i}
            placeholder=${this.placeholder()}
            @keydown=${this.onTextareaKey}
          ></textarea>
          <div class="dashboard-chat__input-actions">
            ${t!==void 0?u`<button
                    class="bs-btn bs-btn--small dashboard-chat__stop"
                    type="button"
                    data-test-id="dashboard-chat-stop"
                    @click=${()=>this.onStop(t)}
                  >
                    ${d("dashboard.widget.chat.stop")}
                  </button>`:p}
            <button
              class="bs-btn bs-btn--small bs-btn--primary dashboard-chat__send"
              type="submit"
              data-test-id="dashboard-chat-send"
              ?disabled=${i}
            >
              ${d("dashboard.widget.chat.send")}
            </button>
          </div>
        </form>
        ${i?u`<div class="dashboard-chat__hint" data-test-id="dashboard-chat-disconnected">
                ${d("dashboard.widget.chat.disconnected")}
              </div>`:p}
      `,this.root),this.stickToBottom){let l=this.root.querySelector(".dashboard-chat__scroll");l&&(l.scrollTop=l.scrollHeight)}this.updateJumpPill()}placeholder(){return xe((Ga(this.widget?.props)?this.widget.props:{}).placeholder)||d("dashboard.widget.chat.placeholder")}},kt=new Map;function Cl(e,t,r){let a=kt.get(e.id);return a||(a=new Il(e.id),kt.set(e.id,a)),a.setContext(r,e),u`<div
    class="dashboard-chat"
    data-test-id="dashboard-chat"
    ${Ce(a.rootRef)}
  ></div>`}function Nl(e){return e==="ok"?"dashboard-badge--ok":e==="error"?"dashboard-badge--error":"dashboard-badge--muted"}function Pl(e,t){let r=Hn(e,t);return r.jobs.length===0?u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.cron.empty")}
    </div>`:u`
    <ul class="dashboard-list dashboard-cron" data-test-id="dashboard-cron">
      ${r.jobs.map(a=>u`
          <li class="dashboard-list__row ${a.enabled?"":"dashboard-list__row--disabled"}">
            <span class="dashboard-list__label">${a.name}</span>
            <span class="dashboard-list__meta">
              ${a.nextRunAtMs!==null?d("dashboard.widget.cron.next",{time:Wt(a.nextRunAtMs)}):d("dashboard.widget.cron.noNext")}
            </span>
            ${a.lastStatus?u`<span class="dashboard-badge ${Nl(a.lastStatus)}"
                    >${a.lastStatus}</span
                  >`:p}
          </li>
        `)}
    </ul>
  `}function Ka(e){return e==="scripts"?"allow-scripts":""}function Ol(e,t,r){let a=Ta(S(e).url,{allowExternalEmbedUrls:r.embed.allowExternalEmbedUrls});return a.status==="missing"?u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.embed.missing")}
    </div>`:a.status==="blocked"?u`<div class="dashboard-widget__placeholder" data-test-id="dashboard-embed-blocked">
      ${a.reason==="external"?d("dashboard.widget.embed.blockedExternal"):d("dashboard.widget.embed.blockedScheme")}
    </div>`:u`<iframe
    class="dashboard-embed__frame"
    data-test-id="dashboard-embed-frame"
    src=${a.url}
    title=${e.title}
    sandbox=${Ka(r.embed.embedSandboxMode)}
    referrerpolicy="no-referrer"
    loading="lazy"
  ></iframe>`}function Bl(e,t){let r=Gn(e,t);return r.instances.length===0?u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.instances.empty")}
    </div>`:u`
    <ul class="dashboard-list dashboard-instances" data-test-id="dashboard-instances">
      ${r.instances.map(a=>u`
          <li class="dashboard-list__row">
            <span
              class="dashboard-dot ${a.healthy?"dashboard-dot--ok":"dashboard-dot--warn"}"
              aria-hidden="true"
            ></span>
            <span class="dashboard-list__label">${a.id}</span>
            ${a.detail?u`<span class="dashboard-list__meta">${a.detail}</span>`:p}
            ${a.lastInputMs!==null?u`<span class="dashboard-list__meta"
                    >${d("dashboard.widget.instances.idle",{duration:Gd(a.lastInputMs)})}</span
                  >`:p}
          </li>
        `)}
    </ul>
  `}function Ll(e,t){let r=Rn(e,t);return r.trim()?u`<div class="dashboard-markdown markdown-body">
    ${qa(Fa(r))}
  </div>`:u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.markdownEmpty")}
    </div>`}function qr(e){let t=S(e);return typeof t.text=="string"?t.text:""}function Dl(e,t){return r=>{if(!(r instanceof HTMLTextAreaElement))return;let a=r;if(a.dataset.notesPersisted!=="1"&&a.dataset.notesDirty!=="1"&&(a.value=t),a.dataset.notesBound==="1")return;a.dataset.notesBound="1",e.get().then(o=>{typeof o.state=="string"&&a.dataset.notesDirty!=="1"&&(a.dataset.notesPersisted="1",a.value=o.state)}).catch(()=>{});let s;a.addEventListener("input",()=>{a.dataset.notesDirty="1";let o=a.value;s!==void 0&&clearTimeout(s),s=setTimeout(()=>{e.set(o).catch(()=>{})},500)})}}function Ul(e,t,r){let a=d("dashboard.widget.notes.placeholder");if(!r.state){let s=qr(e);return u`
      <div class="dashboard-notes dashboard-notes--readonly" data-test-id="dashboard-notes">
        <textarea
          class="dashboard-notes__pad"
          data-test-id="dashboard-notes-pad"
          readonly
          aria-label=${e.title}
          placeholder=${a}
        >
${s}</textarea>
        <div class="dashboard-notes__hint" data-test-id="dashboard-notes-hint">
          ${d("dashboard.widget.notes.readonlyHint")}
        </div>
      </div>
    `}return u`
    <div class="dashboard-notes" data-test-id="dashboard-notes">
      <textarea
        class="dashboard-notes__pad"
        data-test-id="dashboard-notes-pad"
        aria-label=${e.title}
        placeholder=${a}
        ${Ce(Dl(r.state,qr(e)))}
      ></textarea>
    </div>
  `}var zl=["desktop","tablet","mobile"];function Fr(e){return`dashboard-preview__frame-wrap dashboard-preview__frame-wrap--${e}`}function Wl(e,t,r){let a=Ta(S(e).url,{allowExternalEmbedUrls:r.embed.allowExternalEmbedUrls});if(a.status==="missing")return u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.preview.missing")}
    </div>`;if(a.status==="blocked")return u`<div class="dashboard-widget__placeholder" data-test-id="dashboard-preview-blocked">
      ${a.reason==="external"?d("dashboard.widget.preview.blockedExternal"):d("dashboard.widget.preview.blockedScheme")}
    </div>`;let s=ui(e),o=Or(),n=Or(),i=()=>{let c=o.value;if(c){let b=c.getAttribute("src");b!==null&&c.setAttribute("src",b)}},l=c=>{let b=n.value;b&&(b.className=Fr(c))};return u`<div class="dashboard-preview">
    <div class="dashboard-preview__toolbar" role="toolbar">
      <div class="dashboard-preview__viewports" role="group">
        ${zl.map(c=>u`<button
              class="dashboard-preview__viewport"
              type="button"
              data-test-id=${`dashboard-preview-viewport-${c}`}
              data-viewport=${c}
              title=${d(`dashboard.widget.preview.viewport.${c}`)}
              aria-label=${d(`dashboard.widget.preview.viewport.${c}`)}
              @click=${()=>l(c)}
            >
              ${d(`dashboard.widget.preview.viewport.${c}`)}
            </button>`)}
      </div>
      <button
        class="dashboard-preview__reload"
        type="button"
        data-test-id="dashboard-preview-reload"
        title=${d("dashboard.widget.preview.reload")}
        aria-label=${d("dashboard.widget.preview.reload")}
        @click=${i}
      >
        ${d("dashboard.widget.preview.reload")}
      </button>
    </div>
    <div class=${Fr(s)} ${Ce(n)}>
      <iframe
        class="dashboard-embed__frame dashboard-preview__frame"
        data-test-id="dashboard-preview-frame"
        ${Ce(o)}
        src=${a.url}
        title=${e.title}
        sandbox=${Ka(r.embed.embedSandboxMode)}
        referrerpolicy="no-referrer"
        loading="lazy"
      ></iframe>
    </div>
  </div>`}function Hl(e,t,r){let a=Dn(e,t);if(a.rows.length===0)return u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.sessions.empty")}
    </div>`;let s=n=>r?.sessionHref?.(n)??"#",o=r?.onNavigate;return u`
    <ul class="dashboard-list dashboard-sessions" data-test-id="dashboard-sessions">
      ${a.rows.map(n=>u`
          <li class="dashboard-list__row">
            <a
              class="dashboard-list__link"
              href=${s(n.key)}
              @click=${o?i=>{i.preventDefault(),o(n.key)}:p}
            >
              <span
                class="dashboard-dot ${n.active?"dashboard-dot--live":""}"
                aria-hidden="true"
              ></span>
              <span class="dashboard-list__label">${n.label}</span>
              ${n.updatedAt!==null?u`<span class="dashboard-list__meta"
                      >${Wt(n.updatedAt)}</span
                    >`:p}
            </a>
          </li>
        `)}
    </ul>
  `}function jl(e,t){let r=Sn(e,t);return u`
    <div class="dashboard-stat">
      <div class="dashboard-stat__value">${r.display??d("dashboard.widget.stat.empty")}</div>
      ${r.label?u`<div class="dashboard-stat__label">${r.label}</div>`:p}
    </div>
  `}function ql(e){return e==null?"":typeof e=="string"?e:typeof e=="number"||typeof e=="boolean"?String(e):JSON.stringify(e)}function Fl(e,t){let r=Pn(e,t);if(r.total===0||r.columns.length===0)return u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.table.empty")}
    </div>`;let a=r.total-r.shown;return u`
    <div class="dashboard-table">
      <table class="dashboard-table__grid">
        <thead>
          <tr>
            ${r.columns.map(s=>u`<th scope="col">${s}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${r.rows.map(s=>u`
              <tr>
                ${r.columns.map(o=>u`<td>${ql(s[o])}</td>`)}
              </tr>
            `)}
        </tbody>
      </table>
      ${a>0?u`<div class="dashboard-table__footer">
              ${d("dashboard.widget.table.more",{count:String(a)})}
            </div>`:p}
    </div>
  `}function Vl(e,t){let r=Un(e,t);return u`
    <div class="dashboard-usage" data-test-id="dashboard-usage">
      <div class="dashboard-usage__metric">
        <div class="dashboard-usage__value">${Fd(r.cost)}</div>
        <div class="dashboard-usage__label">${d("dashboard.widget.usage.cost")}</div>
      </div>
      <div class="dashboard-usage__metric">
        <div class="dashboard-usage__value">${Vd(r.tokens)}</div>
        <div class="dashboard-usage__label">${d("dashboard.widget.usage.tokens")}</div>
      </div>
    </div>
  `}var Gl={"stat-card":(e,t)=>jl(e,t),markdown:(e,t)=>Ll(e,t),table:(e,t)=>Fl(e,t),"iframe-embed":Ol,preview:Wl,sessions:(e,t,r)=>Hl(e,t,r),usage:(e,t)=>Vl(e,t),cron:(e,t)=>Pl(e,t),instances:(e,t)=>Bl(e,t),activity:(e,t)=>Yd(e,t),chart:(e,t)=>gl(e,t),notes:Ul,"action-form":qd,"action-button":Wd,"agent-status":(e,t)=>Xd(e,t),approvals:al,chat:Cl};function Kl(e){let t=e.startsWith("builtin:")?e.slice(8):e;return Gl[t]}function Yl(e){return e.replace(/\s*\(custom\)\s*$/iu,"").trim()||e}function Xl(e,t){let r=K(e.createdBy);return r?t?u`<span
      class=${t.dimmed?"dashboard-widget__agent dashboard-widget__agent--dimmed":"dashboard-widget__agent"}
      style="--dashboard-agent-hue: ${t.hue}"
      data-test-id="dashboard-widget-agent-chip"
      data-agent=${t.actor}
      title=${d("dashboard.widget.agentChipTooltip",{agent:t.actor})}
      >${t.short}</span
    >`:u`<span
    class="dashboard-widget__provenance"
    title=${d("dashboard.widget.provenanceTooltip",{agent:r})}
    >${d("dashboard.widget.provenanceChip")}</span
  >`:p}function Jl(e){return e.ephemeral?u`<span
    class="dashboard-widget__ephemeral"
    data-test-id="dashboard-widget-ephemeral"
    title=${d("dashboard.widget.ephemeralTooltip")}
    >${d("dashboard.widget.ephemeralBadge")}</span
  >`:p}function Zl(e){return u`
    <div class="dashboard-widget__blame" role="note" data-test-id="dashboard-widget-blame">
      <span class="dashboard-widget__blame-text">${e.firstSeenVersion!==void 0?d("dashboard.widget.blame.createdByVersion",{actor:e.actor,version:String(e.firstSeenVersion)}):d("dashboard.widget.blame.createdBy",{actor:e.actor})}</span>
      ${e.agentId!==null&&e.logbookHref?u`<a
              class="dashboard-widget__blame-link"
              href=${e.logbookHref}
              target="_blank"
              rel="noopener noreferrer"
              data-test-id="dashboard-widget-blame-link"
              >${I.externalLink} ${d("dashboard.widget.blame.logbookLink")}</a
            >`:p}
    </div>
  `}function Ql(e,t,r){return u`
    <div class="dashboard-widget__menu" role="menu">
      ${r?Zl(r):p}
      ${e.ephemeral?u`<button
              class="dashboard-widget__menu-item"
              type="button"
              role="menuitem"
              data-test-id="dashboard-widget-pin"
              @click=${()=>t.onPin(e)}
            >
              ${d("dashboard.widget.menu.pin")}
            </button>`:p}
      <button
        class="dashboard-widget__menu-item"
        type="button"
        role="menuitem"
        @click=${()=>t.onEditTitle(e)}
      >
        ${d("dashboard.widget.menu.editTitle")}
      </button>
      <button
        class="dashboard-widget__menu-item"
        type="button"
        role="menuitem"
        @click=${()=>t.onMoveToTab(e)}
      >
        ${d("dashboard.widget.menu.moveToTab")}
      </button>
      <button
        class="dashboard-widget__menu-item"
        type="button"
        role="menuitem"
        @click=${()=>t.onHide(e)}
      >
        ${d("dashboard.widget.menu.hide")}
      </button>
      <button
        class="dashboard-widget__menu-item dashboard-widget__menu-item--danger"
        type="button"
        role="menuitem"
        @click=${()=>t.onRemove(e)}
      >
        ${d("dashboard.widget.menu.remove")}
      </button>
    </div>
  `}function ec(e,t,r){if(t&&"error"in t)throw new Error(t.error);let a=t&&"value"in t?t.value:void 0,s=Kl(e.kind);return s?s(e,a,r):e.kind.startsWith("custom:")?u`<div class="dashboard-widget__placeholder">
      ${d("dashboard.widget.customPlaceholder")}
    </div>`:u`<div class="dashboard-widget__placeholder">
    ${d("dashboard.widget.unknownKind",{kind:e.kind})}
  </div>`}function tc(e,t){if(t.status==="approved")return t.manifest?Od({widget:e,manifest:t.manifest,context:t.host}):u`<div
        class="dashboard-widget__placeholder"
        data-test-id="dashboard-custom-loading"
      >
        ${d("dashboard.widget.customLoading")}
      </div>`;if(t.status==="pending"){let r=K(e.createdBy);return u`
      <div
        class="dashboard-widget__approval"
        role="group"
        data-test-id="dashboard-custom-pending"
        aria-label=${d("dashboard.widget.approval.title")}
      >
        <div class="dashboard-widget__approval-title">${d("dashboard.widget.approval.title")}</div>
        <div class="dashboard-widget__approval-sub">
          ${r?d("dashboard.widget.approval.byAgent",{agent:r}):d("dashboard.widget.approval.byUnknown")}
        </div>
        <div class="dashboard-widget__approval-actions">
          <button
            class="bs-btn bs-btn--small bs-btn--primary"
            type="button"
            data-test-id="dashboard-custom-approve"
            @click=${()=>t.onApprove(e)}
          >
            ${d("dashboard.widget.approval.approve")}
          </button>
          <button
            class="bs-btn bs-btn--small"
            type="button"
            data-test-id="dashboard-custom-reject"
            @click=${()=>t.onReject(e)}
          >
            ${d("dashboard.widget.approval.reject")}
          </button>
        </div>
      </div>
    `}return u`<div class="dashboard-widget__placeholder" data-test-id="dashboard-custom-rejected">
    ${d("dashboard.widget.approval.unavailable")}
  </div>`}function Ya(e,t,r,a,s){try{return e.kind.startsWith("custom:")&&s?tc(e,s):ec(e,t,r)}catch(o){let n=o instanceof Error?o.message:String(o);return u`
      <div class="dashboard-widget__error" role="alert" data-test-id="dashboard-widget-error">
        <div class="dashboard-widget__error-title">${d("dashboard.widget.errorTitle")}</div>
        <div class="dashboard-widget__error-humane">${d("dashboard.widget.errorHumane")}</div>
        <details class="dashboard-widget__error-detail">
          <summary>${d("dashboard.widget.errorDetailSummary")}</summary>
          <div class="dashboard-widget__error-message">${n}</div>
        </details>
        <button
          class="bs-btn bs-btn--small"
          type="button"
          @click=${()=>a.onRemove(e)}
        >
          ${d("dashboard.widget.menu.remove")}
        </button>
      </div>
    `}}function rc(e){let{widget:t,callbacks:r}=e,a=["dashboard-widget",t.collapsed?"dashboard-widget--collapsed":"",e.pending?"dashboard-widget--pending":"",e.dragging?"dashboard-widget--dragging":"",e.dragging&&e.dragTransform?"dashboard-widget--carried":"",e.agentChip?.dimmed?"dashboard-widget--agent-dimmed":""].filter(Boolean).join(" "),s=Dt(t.grid);return u`
    <section
      class=${a}
      style=${e.dragging&&e.dragTransform?`${s}; transform: ${e.dragTransform}`:s}
      data-widget-id=${t.id}
      data-test-id="dashboard-widget"
    >
      <header
        class="dashboard-widget__bar"
        @pointerdown=${o=>r.onMovePointerDown(t,o)}
      >
        <button
          class="dashboard-widget__collapse"
          type="button"
          aria-expanded=${t.collapsed?"false":"true"}
          aria-label=${t.collapsed?d("dashboard.widget.expand"):d("dashboard.widget.collapse")}
          @pointerdown=${o=>o.stopPropagation()}
          @click=${()=>r.onToggleCollapse(t)}
        >
          ${t.collapsed?I.chevronRight:I.chevronDown}
        </button>
        <span class="dashboard-widget__title" title=${t.title}
          >${Yl(t.title)}</span
        >
        ${Xl(t,e.agentChip)} ${Jl(t)}
        <span
          class="dashboard-widget__handle"
          role="button"
          tabindex="0"
          aria-label=${d("dashboard.widget.moveHandle")}
          @keydown=${o=>Vr(o,t,"move",r)}
          >${I.arrowUpDown}</span
        >
        <button
          class="dashboard-widget__menu-toggle"
          type="button"
          aria-haspopup="menu"
          aria-expanded=${e.menuOpen?"true":"false"}
          aria-label=${d("dashboard.widget.menuLabel")}
          @pointerdown=${o=>o.stopPropagation()}
          @click=${()=>r.onToggleMenu(t)}
        >
          ${I.moreHorizontal}
        </button>
        ${e.menuOpen?Ql(t,r,e.blame):p}
      </header>
      ${t.collapsed?p:u`
              <div class="dashboard-widget__body">
                ${Ya(t,e.binding,e.builtinContext,r,e.custom)}
              </div>
              <span
                class="dashboard-widget__resize"
                role="button"
                tabindex="0"
                aria-label=${d("dashboard.widget.resizeHandle")}
                @pointerdown=${o=>r.onResizePointerDown(t,o)}
                @keydown=${o=>Vr(o,t,"resize",r)}
              ></span>
            `}
    </section>
  `}function Vr(e,t,r,a){let s=e.key==="ArrowLeft"?"left":e.key==="ArrowRight"?"right":e.key==="ArrowUp"?"up":e.key==="ArrowDown"?"down":null;s&&(e.preventDefault(),a.onKeyboardNudge(t,r,s))}var Gr=10;function Xa(e){let t=2166136261;for(let r=0;r<e.length;r++)t^=e.charCodeAt(r),t=Math.imul(t,16777619);return(t>>>0)%360}function Ja(e){return e.length<=Gr?e:`${e.slice(0,Gr-1)}\u2026`}function Za(e){let t=new Set;for(let r of e.tabs)for(let a of r.widgets){let s=a.createdBy;s&&K(s)&&t.add(s)}return[...t].sort()}function ac(e,t){let r=K(e);return r?{actor:e,agentId:r,short:Ja(r),hue:Xa(e),dimmed:t!==null&&e!==t}:null}var sc={embedSandboxMode:"strict",allowExternalEmbedUrls:!1};function oc(e){return e?{embedSandboxMode:e.sandboxMode,allowExternalEmbedUrls:e.allowExternalUrls}:sc}function nc(){return{open:!1,loading:!1,error:null,entries:[],snapshots:new Map,selectedVersion:null,confirmRestore:!1,restoring:!1}}var Qa="boardstate:gallery-url:v1";function ic(e){try{return e?.getItem(Qa)??""}catch{return""}}function dc(e,t){try{e?.setItem(Qa,t)}catch{}}function ce(e){return e instanceof Error&&e.message.trim()?e.message.trim():"Widget gallery error."}var es="boardstate:onboarding-dismissed:v1";function lc(e){try{return e?.getItem(es)==="1"}catch{return!1}}function cc(e){try{e?.setItem(es,"1")}catch{}}var Xe=new WeakMap,Je=new WeakMap;function At(e){let t=Je.get(e);t&&(document.removeEventListener("pointerdown",t.onPointerDown,!0),document.removeEventListener("keydown",t.onKeyDown,!0),Je.delete(e))}function uc(e,t,r){let a=t.openMenuWidgetId!==null;if(a===Je.has(e))return;if(!a){At(e);return}let s=()=>{t.openMenuWidgetId!==null&&(t.openMenuWidgetId=null,At(e),r())},o=i=>{let l=i.target;l instanceof Element&&l.closest(".dashboard-widget__menu, .dashboard-widget__menu-toggle")||s()},n=i=>{i.key==="Escape"&&(i.preventDefault(),s())};document.addEventListener("pointerdown",o,!0),document.addEventListener("keydown",n,!0),Je.set(e,{onPointerDown:o,onKeyDown:n})}function bc(e){At(e),hc(e)}function hc(e){let t=Xe.get(e);if(t){for(let r of t.streamSubs.values())r.unsubscribe();t.streamSubs.clear()}}function pc(e,t){let r=Xe.get(e);return r||(r={openMenuWidgetId:null,drag:null,bindingResults:new Map,bindingLoads:new Set,bindingVersion:-1,streamSubs:new Map,streamValues:new Map,manifestCache:new Map,manifestLoads:new Set,dataVersion:0,dialog:null,onboardingDismissed:lc(t),collapsedTabGroups:new Set,lastPresenceSlug:null,history:nc(),gallery:null,highlightedAgent:null},Xe.set(e,r)),r}function gc(e){let t=Xe.get(e);t&&(t.dataVersion+=1)}function ts(e){let t=e.bindings;return t?Object.values(t)[0]??null:null}function fc(e,t){return e.workspaceVersion*1000003+t.dataVersion}function mc(e,t,r,a,s){if(!t){for(let n of e.streamSubs.values())n.unsubscribe();e.streamSubs.clear();return}let o=new Map;for(let n of a.widgets){let i=ts(n);i?.source==="stream"&&i.event&&o.set(n.id,i)}for(let[n,i]of e.streamSubs){let l=o.get(n);(!l||i.workspaceVersion!==r.workspaceVersion||i.event!==l.event||i.pointer!==l.pointer)&&(i.unsubscribe(),e.streamSubs.delete(n),e.streamValues.delete(n))}for(let[n,i]of o){if(e.streamSubs.has(n))continue;let l=pd(t,i,c=>{e.streamValues.set(n,c),e.bindingResults.set(n,c),s?.()});e.streamSubs.set(n,{workspaceVersion:r.workspaceVersion,event:i.event,...i.pointer!==void 0?{pointer:i.pointer}:{},unsubscribe:l})}}async function yc(e,t,r){let a=t.bindings??{},s=[];for(let o of r.inputs??[]){let n=a[o];if(!n)return{error:`Computed input not found: ${o}`};let i=await Ut(e,n);if("error"in i)return{error:i.error};s.push(i.value)}return hd(r.op??"",s,r.arg)}function vc(e,t,r,a,s){let o=fc(r,e);e.bindingVersion!==o&&(e.bindingResults.clear(),e.bindingLoads.clear(),e.bindingVersion=o),mc(e,t,r,a,s);for(let n of a.widgets){let i=ts(n);if(!(!i||e.bindingResults.has(n.id)||e.bindingLoads.has(n.id))){if(i.source==="stream"){let l=e.streamValues.get(n.id);l&&e.bindingResults.set(n.id,l);continue}e.bindingLoads.add(n.id),(i.source==="computed"?yc(t,n,i):Ut(t,i)).then(l=>{e.bindingResults.set(n.id,l),e.bindingLoads.delete(n.id),s?.()})}}}function wc(e){return{width:(e instanceof HTMLElement?e.querySelector(".dashboard-grid"):null)?.clientWidth??0}}function _c(e){if(e.key!=="Escape")return;let t=e.currentTarget.closest("details");t?.open&&(e.preventDefault(),t.open=!1,t.querySelector("summary")?.focus())}function xc(e){let t=e.currentTarget;if(!t.open)return;let r=s=>{s.target instanceof Node&&t.contains(s.target)||(t.open=!1,document.removeEventListener("pointerdown",r,!0))},a=()=>{t.open||(document.removeEventListener("pointerdown",r,!0),t.removeEventListener("toggle",a))};document.addEventListener("pointerdown",r,!0),t.addEventListener("toggle",a)}function $c(e,t,r,a){if(t.onboardingDismissed||r.tabs.some(o=>o.widgets.length>0))return p;let s=()=>{t.onboardingDismissed=!0,cc(e.storage),a()};return u`
    <div class="dashboard-onboarding" role="note" data-test-id="dashboard-onboarding">
      <span class="dashboard-onboarding__icon" aria-hidden="true">${I.spark}</span>
      <div class="dashboard-onboarding__body">
        <div class="dashboard-onboarding__title">${d("dashboard.onboarding.title")}</div>
        <div class="dashboard-onboarding__sub">${d("dashboard.onboarding.primary")}</div>
        <div class="dashboard-onboarding__sub">
          ${d("dashboard.onboarding.secondary")}
          <code class="dashboard-onboarding__cmd">${d("dashboard.empty.onboardingCommand")}</code>
        </div>
      </div>
      <button
        class="dashboard-onboarding__dismiss"
        type="button"
        data-test-id="dashboard-onboarding-dismiss"
        aria-label=${d("common.dismiss")}
        @click=${s}
      >
        ${I.x}
      </button>
    </div>
  `}function rs(e,t,r,a){t.activeSlug=va(r,a),e.onNavigate?.(a),e.onRequestUpdate?.()}function kc(){return u`<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>`}function Ac(e){if(e<=0)return p;let t=d("dashboard.tabs.presence",{count:String(e)});return u`
    <span
      class="dashboard-tab__presence"
      data-test-id="dashboard-tab-presence"
      title=${t}
      aria-label=${t}
    >
      <span class="dashboard-tab__presence-dot" aria-hidden="true"></span>
      ${e>1?u`<span class="dashboard-tab__presence-count">${e}</span>`:p}
    </span>
  `}function Kr(e,t,r,a,s,o=0){return u`
    <button
      class="dashboard-tab ${s?"dashboard-tab--active":""}"
      type="button"
      role="tab"
      aria-selected=${s?"true":"false"}
      data-test-id="dashboard-tab"
      data-ws=${a.slug}
      @click=${()=>rs(e,t,r,a.slug)}
    >
      ${a.icon&&Object.hasOwn(I,a.icon)?u`<span class="dashboard-tab__icon" aria-hidden="true"
              >${I[a.icon]}</span
            >`:p}
      <span class="dashboard-tab__label">${a.title}</span>
      ${a.visibility==="private"?u`<span
              class="dashboard-tab__private"
              data-test-id="dashboard-tab-private"
              title=${d("dashboard.tabs.private")}
              aria-label=${d("dashboard.tabs.private")}
              >${kc()}</span
            >`:p}
      ${Ac(o)}
    </button>
  `}function Ec(e){return e.kind==="agent"?d("dashboard.tabs.groupAgent",{agent:e.agentId??"agent"}):e.kind==="system"?d("dashboard.tabs.groupSystem"):d("dashboard.tabs.groupUser")}function Tc(e,t,r,a){let s=()=>e.onRequestUpdate?.(),o=at(a),n=Vo(o),i=Fo(a),l=n.length>1,c=b=>Ui(e.host,b).length;return u`
    <nav class="dashboard-tabs" role="tablist" aria-label=${d("dashboard.tabs.label")}>
      ${l?n.map(b=>{let h=r.collapsedTabGroups.has(b.key),y=()=>{h?r.collapsedTabGroups.delete(b.key):r.collapsedTabGroups.add(b.key),s()},v=Ec(b);return u`
                <div
                  class="dashboard-tab-group ${h?"dashboard-tab-group--collapsed":""}"
                  data-test-id="dashboard-tab-group"
                  data-group=${b.key}
                >
                  <button
                    class="dashboard-tab-group__toggle"
                    type="button"
                    data-test-id="dashboard-tab-group-toggle"
                    aria-expanded=${h?"false":"true"}
                    aria-label=${h?d("dashboard.tabs.expandGroup",{group:v}):d("dashboard.tabs.collapseGroup",{group:v})}
                    @click=${y}
                  >
                    <span class="dashboard-tab-group__chevron" aria-hidden="true"
                      >${h?I.chevronRight:I.chevronDown}</span
                    >
                    <span class="dashboard-tab-group__label">${v}</span>
                    <span class="dashboard-tab-group__count">${b.tabs.length}</span>
                  </button>
                  ${h?p:b.tabs.map(w=>Kr(e,t,a,w,w.slug===t.activeSlug,c(w.slug)))}
                </div>
              `}):o.map(b=>Kr(e,t,a,b,b.slug===t.activeSlug,c(b.slug)))}
      ${i.length>0?u`
              <details
                class="dashboard-tabs__hidden"
                @toggle=${xc}
                @keydown=${_c}
              >
                <summary class="dashboard-tab dashboard-tab--overflow">
                  <span class="dashboard-tab__icon" aria-hidden="true">${I.eyeOff}</span>
                  <span class="dashboard-tab__label"
                    >${d("dashboard.tabs.hidden",{count:String(i.length)})}</span
                  >
                </summary>
                <div class="dashboard-tabs__hidden-menu" role="menu">
                  ${i.map(b=>u`
                      <button
                        class="dashboard-tabs__hidden-item"
                        type="button"
                        role="menuitem"
                        @click=${()=>rs(e,t,a,b.slug)}
                      >
                        ${b.title}
                      </button>
                    `)}
                </div>
              </details>
            `:p}
    </nav>
  `}function Sc(e,t,r,a){let s=t.basePath??"";for(let o of a.widgets){let n=Ot(o.kind);!n||ya(r,o.kind)!=="approved"||e.manifestCache.has(n)||e.manifestLoads.has(n)||(e.manifestLoads.add(n),vd(s,n).then(i=>{e.manifestLoads.delete(n),i&&(e.manifestCache.set(n,i),t.onRequestUpdate?.())}))}}function Rc(e){let t=e.transport,r=e.sessionKey??"main";return({widgetKey:a,text:s})=>Ia({widgetKey:a,text:s,confirmPrompt:async o=>e.confirm?await e.confirm(o):typeof window<"u"?window.confirm(o):!1,sendPrompt:async o=>{if(!t)throw new Error("Not connected.");await t.request("chat.send",{sessionKey:r,message:o,deliver:!1})}})}function as(e,t,r,a){let s=e.transport,o={embed:oc(e.embed),dispatchPrompt:Rc(e),onActionError:n=>{t.actionError=n,e.onRequestUpdate?.()},approvals:_i(r,(n,i)=>void Ve(t,s,{name:n,decision:i}),(n,i,l)=>void od(t,s,{name:n,decision:i,...l?.tools!==void 0?{tools:l.tools}:{},...l?.autoConfirm!==void 0?{autoConfirm:l.autoConfirm}:{},...l?.expiresAt!==void 0?{expiresAt:l.expiresAt}:{}})),registryPending:Ic(r)};return s&&(o.state=Nc(s,a.id),o.chat=Cc(s,e.sessionKey??"main"),o.approveWidget=(n,i)=>void Ve(t,s,{name:n,decision:i}),o.actions=Mc(s,e.operator===!0)),o}function Mc(e,t){let r={invoke:async a=>{let s=await e.request("dashboard.action.invoke",a);return k(s)&&s.pending===!0?{kind:"pending",id:typeof s.id=="string"?s.id:"",expiresAt:typeof s.expiresAt=="string"?s.expiresAt:""}:{kind:"result",result:s}},subscribe:a=>e.addEventListener("dashboard.action.changed",s=>{k(s)&&typeof s.id=="string"&&a({id:s.id,status:s.status,connector:typeof s.connector=="string"?s.connector:"",tool:typeof s.tool=="string"?s.tool:""})})};return t&&(r.confirm=async a=>{let s=await e.request("dashboard.action.confirm",{id:a});return{result:k(s)&&"result"in s?s.result:s}},r.deny=async a=>{await e.request("dashboard.action.deny",{id:a})}),r}function Ic(e){return Object.entries(e.widgetsRegistry).filter(([,t])=>t.status==="pending").map(([t])=>t)}function Cc(e,t){let r=a=>a.sessionKey===t;return{send:async a=>({turnId:(await e.request("chat.send",{sessionKey:t,message:a})).turnId}),abort:async a=>{await e.request("chat.abort",{sessionKey:t,turnId:a})},history:async()=>((await e.request("chat.history.get",{sessionKey:t})).events??[]).filter(r),subscribe:a=>e.addEventListener(Eo,s=>{let o=s;o&&r(o)&&a(o)})}}function Nc(e,t){return{get:()=>e.request("dashboard.widget.state.get",{widgetId:t}),set:r=>e.request("dashboard.widget.state.set",{widgetId:t,state:r})}}function ss(e,t,r,a,s,o){let n=Ot(s.kind);return n?{status:ya(a,s.kind),manifest:r.manifestCache.get(n)??null,host:{transport:e.transport,basePath:e.basePath??"",sessionKey:e.sessionKey??"main",tabSlug:o,...e.confirm?{confirmPrompt:e.confirm}:{}},onApprove:()=>void Ve(t,e.transport,{name:n,decision:"approved"}),onReject:()=>void Ve(t,e.transport,{name:n,decision:"rejected"})}:null}function Pc(e){return[...e.history.snapshots.entries()].map(([t,r])=>({version:t,workspace:r}))}function Oc(e,t,r){let a=r.createdBy;if(!a)return;let s=K(a),o=No(r.id,Pc(t));return{actor:a,agentId:s,...o!==void 0?{firstSeenVersion:o}:{},...s?{logbookHref:e.logbookHref??null}:{}}}async function Bc(e,t){let r=()=>e.onRequestUpdate?.(),a=t.history;a.loading=!0,a.error=null,r();try{let s=await _d(e.transport);a.entries=s,s.length>0&&a.selectedVersion===null&&(a.selectedVersion=s[0].version),a.error=null}catch(s){a.error=s instanceof Error?s.message:String(s)}finally{a.loading=!1,r()}a.selectedVersion!==null&&await os(e,t,a.selectedVersion)}async function os(e,t,r){let a=t.history;if(!a.snapshots.has(r))try{let s=await xd(e.transport,r);s&&(a.snapshots.set(r,s),e.onRequestUpdate?.())}catch(s){a.error=s instanceof Error?s.message:String(s),e.onRequestUpdate?.()}}function Lc(e,t){t.history.open=!0,t.history.confirmRestore=!1,Bc(e,t),e.onRequestUpdate?.()}function Et(e,t){t.history.open=!1,t.history.confirmRestore=!1,e.onRequestUpdate?.()}function Dc(e,t,r){t.history.selectedVersion=r,os(e,t,r),e.onRequestUpdate?.()}function Uc(e,t){let r=t.manifest,a=r.preferredSize&&typeof r.preferredSize=="object"?r.preferredSize:{},s=Math.min(12,Math.max(1,Number(a.w)||6)),o=Math.max(1,Number(a.h)||4);return{x:0,y:(e?.widgets??[]).reduce((n,i)=>{let l=i.grid.y+i.grid.h;return l>n?l:n},0),w:s,h:o}}function zc(e,t,r,a,s){if(vc(r,e.transport,a,s,e.onRequestUpdate??null),Sc(r,e,a,s),s.widgets.length===0)return u`
      <div class="dashboard-empty dashboard-empty--tab" data-test-id="dashboard-empty-tab">
        <span class="dashboard-empty__icon" aria-hidden="true">${I.plus}</span>
        <div class="dashboard-empty__title">${d("dashboard.empty.tabTitle")}</div>
        <div class="dashboard-empty__sub">${d("dashboard.empty.tabSubtitle")}</div>
      </div>
    `;if(s.layout==="full")return Wc(e,t,r,a,s);let o=ns(e,t,r,s),n=_a(s.widgets),i=n*56+Math.max(0,n-1)*12,l=Za(a).length>=2;return u`
    <div class="dashboard-grid" style="min-height: ${i}px" data-test-id="dashboard-grid">
      ${s.widgets.map(c=>{let b=ss(e,t,r,a,c,s.slug),h=Oc(e,r,c),y=r.drag,v=y?.widgetId===c.id,w=v&&y.mode==="move"?`translate(${y.pointerDx}px, ${y.pointerDy}px)`:void 0,f=l&&c.createdBy?ac(c.createdBy,r.highlightedAgent):null;return rc({widget:c,binding:r.bindingResults.get(c.id)??null,...h?{blame:h}:{},menuOpen:r.openMenuWidgetId===c.id,pending:t.pendingWidgetIds.has(c.id),dragging:v,...w?{dragTransform:w}:{},builtinContext:as(e,t,a,c),callbacks:o,...b?{custom:b}:{},...f?{agentChip:f}:{}})})}
      ${Hc(r,s)}
    </div>
  `}function Wc(e,t,r,a,s){let o=s.widgets[0],n=ns(e,t,r,s),i=ss(e,t,r,a,o,s.slug);return u`
    <div class="dashboard-fullbleed" data-test-id="dashboard-fullbleed" data-widget-id=${o.id}>
      ${Ya(o,r.bindingResults.get(o.id)??null,as(e,t,a,o),n,i??void 0)}
    </div>
  `}function Hc(e,t){let r=e.drag;return r?u`
    <div
      class="dashboard-ghost ${Lt(r.ghostRect,t.widgets,r.widgetId)?"dashboard-ghost--invalid":""}"
      style=${Dt(r.ghostRect)}
      aria-hidden="true"
      data-test-id="dashboard-drag-ghost"
    ></div>
  `:p}function ns(e,t,r,a){let s=()=>e.onRequestUpdate?.(),o=(n,i,l)=>{let c=wc(e.host);if(c.width<=0)return;let b=en({widget:n,mode:l,clientX:i.clientX,clientY:i.clientY,metrics:c});r.drag=b;let h=i.target;try{h.setPointerCapture?.(i.pointerId)}catch{}let y=!1,v=()=>{window.removeEventListener("pointermove",f),window.removeEventListener("pointerup",x)},w=()=>{y||(y=!0,v(),r.drag=null,s())},f=R=>{tn(b,R.clientX,R.clientY),s()},x=()=>{if(y)return;y=!0,v(),qi(e.host);let R=kr({requested:b.ghostRect,widgets:a.widgets,widgetId:n.id});r.drag=null,s(),R&&(R.x!==n.grid.x||R.y!==n.grid.y||R.w!==n.grid.w||R.h!==n.grid.h)&&Cr(t,e.transport,{slug:a.slug,widgetId:n.id,grid:R})};window.addEventListener("pointermove",f),window.addEventListener("pointerup",x),ji(e.host,w)};return{onToggleCollapse:n=>void Ji(t,e.transport,{slug:a.slug,widgetId:n.id,collapsed:!n.collapsed}),onToggleMenu:n=>{r.openMenuWidgetId=r.openMenuWidgetId===n.id?null:n.id,s()},onHide:n=>{r.openMenuWidgetId=null,ed(t,e.transport,{slug:a.slug,widgetId:n.id})},onRemove:n=>{r.openMenuWidgetId=null,td(t,e.transport,{slug:a.slug,widgetId:n.id})},onEditTitle:n=>{r.openMenuWidgetId=null,r.dialog={kind:"editTitle",slug:a.slug,widgetId:n.id,title:n.title},s()},onMoveToTab:n=>{r.openMenuWidgetId=null,r.dialog={kind:"moveToTab",slug:a.slug,widgetId:n.id},s()},onPin:n=>{r.openMenuWidgetId=null,Qi(t,e.transport,{slug:a.slug,widgetId:n.id})},onMovePointerDown:(n,i)=>{i.button===0&&(i.preventDefault(),o(n,i,"move"))},onResizePointerDown:(n,i)=>{i.button===0&&(i.preventDefault(),i.stopPropagation(),o(n,i,"resize"))},onKeyboardNudge:(n,i,l)=>{let c=kr({requested:an(n.grid,i,l),widgets:a.widgets,widgetId:n.id});c&&Cr(t,e.transport,{slug:a.slug,widgetId:n.id,grid:c})}}}function Ze(e,t,r){return u`
    <div
      class="bs-modal"
      role="dialog"
      aria-modal="true"
      aria-label=${e}
      data-test-id="bs-modal"
      @click=${o=>{o.target===o.currentTarget&&t()}}
      @keydown=${o=>{o.key==="Escape"&&(o.preventDefault(),t())}}
    >
      <div class="bs-modal__card">${r}</div>
    </div>
  `}function jc(e,t,r){let a=r.dialog;if(!a)return p;let s=()=>e.onRequestUpdate?.(),o=()=>{r.dialog=null,s()};if(a.kind==="editTitle"){let c=d("dashboard.widget.editTitleTitle");return Ze(c,o,u`
        <form class="bs-dialog" @submit=${h=>{h.preventDefault();let y=h.currentTarget.querySelector("input[name='dashboard-widget-title']")?.value.trim()??"";y&&y!==a.title&&Zi(t,e.transport,{slug:a.slug,widgetId:a.widgetId,title:y}),o()}}>
          <div class="bs-dialog__title">${c}</div>
          <input
            class="bs-dialog__input"
            type="text"
            name="dashboard-widget-title"
            data-test-id="dashboard-edit-title-input"
            .value=${a.title}
            aria-label=${d("dashboard.widget.editTitleLabel")}
          />
          <div class="bs-dialog__actions">
            <button class="bs-btn bs-btn--primary" type="submit">${d("common.save")}</button>
            <button class="bs-btn" type="button" @click=${o}>${d("common.cancel")}</button>
          </div>
        </form>
      `)}let n=d("dashboard.widget.moveToTabTitle"),i=t.workspace?rt(t.workspace).filter(c=>c.slug!==a.slug):[];return Ze(n,o,u`
      <form class="bs-dialog" @submit=${c=>{c.preventDefault();let b=c.currentTarget.querySelector("select[name='dashboard-move-target']")?.value??"";b&&b!==a.slug&&rd(t,e.transport,{fromSlug:a.slug,toSlug:b,widgetId:a.widgetId}),o()}}>
        <div class="bs-dialog__title">${n}</div>
        ${i.length===0?u`<div class="bs-dialog__sub">${d("dashboard.widget.moveToTabEmpty")}</div>`:u`<select
                class="bs-dialog__input"
                name="dashboard-move-target"
                data-test-id="dashboard-move-target"
                aria-label=${n}
              >
                ${i.map(c=>u`<option value=${c.slug}>${c.title}</option>`)}
              </select>`}
        <div class="bs-dialog__actions">
          <button class="bs-btn bs-btn--primary" type="submit" ?disabled=${i.length===0}>
            ${d("dashboard.widget.menu.moveToTab")}
          </button>
          <button class="bs-btn" type="button" @click=${o}>${d("common.cancel")}</button>
        </div>
      </form>
    `)}function qc(e){Dd(e.strings);let t=Vi(e.host),r=pc(e.host,e.storage);t.requestUpdate=e.onRequestUpdate??null,uc(e.host,r,()=>e.onRequestUpdate?.());let a=e.connected;return Ki(e.host,t,a?e.transport:null),Yi(e.host,a?e.transport:null,()=>{gc(e.host),a&&t.activeSlug&&Mr(e.host,e.transport,t.activeSlug),e.onRequestUpdate?.()}),a&&!t.loaded&&!t.loading&&!t.error&&ie(t,e.transport,{requestedSlug:e.initialTab??null}),a&&t.activeSlug&&r.lastPresenceSlug!==t.activeSlug&&(r.lastPresenceSlug=t.activeSlug,Mr(e.host,e.transport,t.activeSlug)),u`
    <section class="dashboard" data-test-id="dashboard">
      ${t.actionError?u`<div class="callout danger dashboard__toast" role="alert">
              ${t.actionError}
            </div>`:p}
      ${Fc(e,t,r)} ${jc(e,t,r)}
      ${Qc(e,t,r)} ${du(e,t,r)}
    </section>
  `}function Fc(e,t,r){if(t.error)return u`
      <div class="card lazy-view-state" role="alert">
        <div class="card-title">${d("dashboard.error.title")}</div>
        <div class="card-sub">${d("dashboard.error.subtitle")}</div>
        <details class="dashboard-error-detail">
          <summary>${d("dashboard.error.detailSummary")}</summary>
          <div class="dashboard-error-detail__text">${t.error}</div>
        </details>
        <button
          class="bs-btn bs-btn--small"
          type="button"
          @click=${()=>void ie(t,e.transport)}
        >
          ${d("common.reload")}
        </button>
      </div>
    `;let a=t.workspace;if(!a)return u`
      <div class="dashboard-skeleton" role="status" aria-label=${d("common.loading")}>
        ${[0,1,2,3,4,5].map(()=>u`<div class="dashboard-skeleton__card"></div>`)}
      </div>
    `;if(a.tabs.length===0)return u`
      <div class="dashboard-empty dashboard-empty--onboarding" data-test-id="dashboard-empty">
        <div class="dashboard-empty__title">${d("dashboard.empty.onboardingTitle")}</div>
        <div class="dashboard-empty__sub">${d("dashboard.empty.onboardingSubtitle")}</div>
        <code class="dashboard-empty__cmd">${d("dashboard.empty.onboardingCommand")}</code>
      </div>
    `;let s=Bt(a,t.activeSlug)??at(a)[0];return s?u`
    ${Jc(e,t,r,s)}
    ${$c(e,r,a,()=>e.onRequestUpdate?.())}
    ${Tc(e,t,r,a)}
    ${Vc(e,r,a)}
    ${zc(e,t,r,a,s)}
  `:u`<div class="card lazy-view-state" role="status">
      <div class="card-sub">${d("dashboard.empty.noVisibleTabs")}</div>
    </div>`}function Vc(e,t,r){let a=Za(r);if(a.length<2)return t.highlightedAgent=null,p;let s=n=>{t.highlightedAgent=t.highlightedAgent===n?null:n,e.onRequestUpdate?.()},o=t.highlightedAgent;return u`
    <div
      class="dashboard-agent-filter"
      data-test-id="dashboard-agent-filter"
      role="group"
      aria-label=${d("dashboard.agentFilter.label")}
    >
      <span class="dashboard-agent-filter__label">${d("dashboard.agentFilter.label")}</span>
      <button
        class="dashboard-agent-filter__chip ${o===null?"dashboard-agent-filter__chip--active":""}"
        type="button"
        data-test-id="dashboard-agent-filter-all"
        aria-pressed=${o===null?"true":"false"}
        @click=${()=>s(null)}
      >
        ${d("dashboard.agentFilter.all")}
      </button>
      ${a.map(n=>{let i=K(n)??n,l=o===n;return u`<button
          class="dashboard-agent-filter__chip dashboard-agent-filter__chip--agent ${l?"dashboard-agent-filter__chip--active":""}"
          type="button"
          style="--dashboard-agent-hue: ${Xa(n)}"
          data-agent=${n}
          data-test-id="dashboard-agent-filter-chip"
          aria-pressed=${l?"true":"false"}
          title=${d("dashboard.widget.agentChipTooltip",{agent:n})}
          @click=${()=>s(n)}
        >
          ${Ja(i)}
        </button>`})}
    </div>
  `}function Gc(e,t){if(typeof document>"u"||typeof URL.createObjectURL!="function")return;let r=new Blob([t],{type:"application/json"}),a=URL.createObjectURL(r),s=document.createElement("a");s.href=a,s.download=e,document.body.append(s),s.click(),s.remove(),URL.revokeObjectURL(a)}function Kc(e,t){nd(e.transport).then(r=>Gc(r.filename,r.json)).catch(r=>{t.actionError=r instanceof Error?r.message:String(r),e.onRequestUpdate?.()})}function Yc(e,t,r){let a=r.currentTarget,s=a.files?.[0];a.value="",s&&s.text().then(o=>id(t,e.transport,o))}function Xc(e,t){t.gallery={indexUrl:ic(e.storage),mode:"widgets",entries:null,selected:null,recipes:null,selectedRecipe:null,busy:!1,error:null},e.onRequestUpdate?.()}function Jc(e,t,r,a){let s=a.layout==="full",o=()=>void ad(t,e.transport,{slug:a.slug,layout:s?"grid":"full"});return u`
    <div class="dashboard-page-header" data-test-id="dashboard-page-header">
      <div class="dashboard-page-header__titles">
        <div class="page-title">${a.title}</div>
        <div class="page-sub">${d("dashboard.header.subtitle")}</div>
      </div>
      <div
        class="dashboard-page-header__actions dashboard-toolbar"
        data-test-id="dashboard-toolbar"
      >
        <button
          class="bs-btn bs-btn--small"
          type="button"
          data-test-id="dashboard-gallery-open"
          title=${d("dashboard.gallery.open")}
          @click=${()=>Xc(e,r)}
        >
          <span class="dashboard-page-header__action-icon" aria-hidden="true">${I.puzzle}</span>
          ${d("dashboard.gallery.open")}
        </button>
        <button
          class="bs-btn bs-btn--small ${s?"bs-btn--primary":""}"
          type="button"
          data-test-id="dashboard-fullbleed-toggle"
          aria-pressed=${s?"true":"false"}
          title=${d(s?"dashboard.header.fullBleedExit":"dashboard.header.fullBleedEnter")}
          @click=${o}
        >
          <span class="dashboard-page-header__action-icon" aria-hidden="true"
            >${s?I.minimize:I.maximize}</span
          >
          ${d(s?"dashboard.header.fullBleedExit":"dashboard.header.fullBleedEnter")}
        </button>
        <button
          class="bs-btn bs-btn--small dashboard-history__toggle"
          type="button"
          data-test-id="dashboard-history-toggle"
          @click=${()=>Lc(e,r)}
        >
          ${I.clock} ${d("dashboard.history.open")}
        </button>
        <button
          class="bs-btn bs-btn--small"
          type="button"
          data-test-id="dashboard-export"
          title=${d("dashboard.distribution.exportTitle")}
          @click=${()=>Kc(e,t)}
        >
          ${d("dashboard.distribution.export")}
        </button>
        <button
          class="bs-btn bs-btn--small"
          type="button"
          data-test-id="dashboard-import"
          title=${d("dashboard.distribution.importTitle")}
          @click=${n=>n.currentTarget.parentElement?.querySelector('input[type="file"]')?.click()}
        >
          ${d("dashboard.distribution.import")}
        </button>
        <input
          type="file"
          accept="application/json,.json"
          hidden
          data-test-id="dashboard-import-input"
          @change=${n=>Yc(e,t,n)}
        />
      </div>
    </div>
  `}function Zc(e){let t=Date.parse(e);if(!Number.isFinite(t))return e;let r=Math.round((Date.now()-t)/1e3);if(r<60)return"just now";let a=Math.round(r/60);if(a<60)return`${a}m ago`;let s=Math.round(a/60);if(s<24)return`${s}h ago`;let o=Math.round(s/24);if(o<7)return`${o}d ago`;try{return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(new Date(t))}catch{return e}}function Qc(e,t,r){let a=r.history;if(!a.open)return p;let s=d("dashboard.history.title"),o=a.selectedVersion!==null?a.snapshots.get(a.selectedVersion):void 0,n=a.entries[0]?.version??null;return Ze(s,()=>Et(e,r),u`
      <div class="dashboard-history" data-test-id="dashboard-history">
        <div class="dashboard-history__header">
          <div class="card-title">${s}</div>
          <div class="card-sub">${d("dashboard.history.subtitle")}</div>
        </div>
        ${a.error?u`<div class="callout danger" role="alert">${a.error}</div>`:p}
        <div class="dashboard-history__body">
          ${ru(e,r,n)}
          <div class="dashboard-history__detail">
            ${a.selectedVersion===null?u`<div class="card-sub">${d("dashboard.history.emptyDetail")}</div>`:au(e,t,r,a.selectedVersion,o)}
          </div>
        </div>
        <div class="bs-dialog__actions">
          <button class="bs-btn" type="button" @click=${()=>Et(e,r)}>
            ${d("common.close")}
          </button>
        </div>
      </div>
    `)}function eu(e){let t=[];return e.added>0&&t.push(d("dashboard.history.summary.added",{count:String(e.added)})),e.removed>0&&t.push(d("dashboard.history.summary.removed",{count:String(e.removed)})),e.moved>0&&t.push(d("dashboard.history.summary.moved",{count:String(e.moved)})),e.retitled>0&&t.push(d("dashboard.history.summary.retitled",{count:String(e.retitled)})),e.tabsChanged>0&&t.push(d("dashboard.history.summary.tabs",{count:String(e.tabsChanged)})),t.length>0?t.join(" \xB7 "):d("dashboard.history.summary.minor")}function tu(e){return e?u`<span class="dashboard-history__change">
    <span class="dashboard-history__change-label">${eu(e)}</span>
  </span>`:p}function ru(e,t,r){let a=t.history;return a.loading&&a.entries.length===0?u`<div class="dashboard-history__list">
      <div class="card-sub">${d("common.loading")}</div>
    </div>`:a.entries.length===0?u`<div class="dashboard-history__list">
      <div class="card-sub">${d("dashboard.history.empty")}</div>
    </div>`:u`
    <ul class="dashboard-history__list" role="listbox" aria-label=${d("dashboard.history.title")}>
      ${a.entries.map(s=>{let o=s.version===a.selectedVersion;return u`
          <li>
            <button
              class="dashboard-history__item ${o?"dashboard-history__item--active":""}"
              type="button"
              role="option"
              aria-selected=${o?"true":"false"}
              data-test-id="dashboard-history-item"
              @click=${()=>Dc(e,t,s.version)}
            >
              <span class="dashboard-history__version"
                >${d("dashboard.history.version",{version:String(s.version)})}</span
              >
              ${tu(s.summary)}
              <span class="dashboard-history__time">${Zc(s.savedAt)}</span>
              ${s.version===r?u`<span class="dashboard-history__latest"
                      >${d("dashboard.history.latest")}</span
                    >`:p}
            </button>
          </li>
        `})}
    </ul>
  `}function au(e,t,r,a,s){let o=r.history,n=t.workspace,i=a===(o.entries[0]?.version??null);return s?u`
    <div class="dashboard-history__preview-wrap">
      <div class="dashboard-history__section-title">${d("dashboard.history.previewTitle")}</div>
      ${nu(s,t.activeSlug,a)}
    </div>
    <div class="dashboard-history__diff">
      <div class="dashboard-history__section-title">${d("dashboard.history.diffTitle")}</div>
      ${n?iu(s,n):p}
    </div>
    <div class="dashboard-history__restore">
      ${i?o.confirmRestore?u`
                <span class="dashboard-history__confirm"
                  >${d("dashboard.history.restoreConfirm")}</span
                >
                <button
                  class="bs-btn bs-btn--small bs-btn--primary"
                  type="button"
                  ?disabled=${o.restoring}
                  data-test-id="dashboard-history-restore-confirm"
                  @click=${async()=>{o.restoring=!0,e.onRequestUpdate?.(),await sd(t,e.transport),o.restoring=!1,o.confirmRestore=!1,Et(e,r)}}
                >
                  ${d("dashboard.history.restore")}
                </button>
                <button
                  class="bs-btn bs-btn--small"
                  type="button"
                  @click=${()=>{o.confirmRestore=!1,e.onRequestUpdate?.()}}
                >
                  ${d("common.cancel")}
                </button>
              `:u`<button
                class="bs-btn bs-btn--small"
                type="button"
                data-test-id="dashboard-history-restore"
                @click=${()=>{o.confirmRestore=!0,e.onRequestUpdate?.()}}
              >
                ${d("dashboard.history.restore")}
              </button>`:u`<span class="card-sub">${d("dashboard.history.restoreOnlyNewest")}</span>`}
    </div>
  `:u`<div class="card-sub" data-test-id="dashboard-history-loading">
      ${d("common.loading")}
    </div>`}var Yr={chart:_`<polyline points="3 15 8 10 12 13 17 6 21 9" /><path d="M3 20h18" opacity="0.5" />`,"stat-card":_`<path d="M4 8h9" stroke-width="2.6" /><path d="M4 14h6" opacity="0.6" />`,table:_`<rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M3 10h18M3 15h18M9 5v14" opacity="0.6" />`,markdown:_`<path d="M4 7h16M4 12h16M4 17h9" opacity="0.85" />`,notes:_`<path d="M5 6h11M5 11h11M5 16h7" opacity="0.8" /><path d="M16 15l3-3 2 2-3 3-2 1z" />`,list:_`<circle cx="5" cy="7" r="1" /><circle cx="5" cy="12" r="1" /><circle cx="5" cy="17" r="1" /><path d="M9 7h11M9 12h11M9 17h7" opacity="0.8" />`,gauge:_`<path d="M4 16a8 8 0 0 1 16 0" /><path d="M12 16l4-3" />`,button:_`<rect x="4" y="9" width="16" height="6" rx="3" />`,frame:_`<rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 8h18" opacity="0.6" />`,custom:_`<path
    d="M4 7h3a1.5 1.5 0 1 0 3 0h3v3a1.5 1.5 0 1 1 0 3v3h-3a1.5 1.5 0 1 0-3 0H4v-3a1.5 1.5 0 1 1 0-3z"
  />`,default:_`<rect x="4" y="5" width="16" height="14" rx="2" opacity="0.6" />`},su={activity:"list","agent-status":"list",approvals:"list",sessions:"list",instances:"list",cron:"list",chat:"list",usage:"gauge","action-button":"button","action-form":"button","iframe-embed":"frame",preview:"frame"};function ou(e){let t=e.startsWith("custom:")?"custom":e.replace(/^builtin:/,"");return u`<svg
    class="dashboard-history__cell-glyph"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    ${Yr[t]??Yr[su[t]??"default"]}
  </svg>`}function nu(e,t,r){let a=(t?e.tabs.find(o=>o.slug===t):void 0)??at(e)[0]??e.tabs[0];if(!a||a.widgets.length===0)return u`<div class="dashboard-history__preview dashboard-history__preview--empty">
      ${d("dashboard.history.previewEmpty")}
    </div>`;let s=_a(a.widgets);return u`
    <div
      class="dashboard-history__preview dashboard-grid dashboard-grid--readonly"
      style="min-height: ${s*56+Math.max(0,s-1)*12}px"
      data-test-id="dashboard-history-preview"
      aria-hidden="true"
    >
      ${a.widgets.map(o=>{let n=K(o.createdBy);return u`
          <div class="dashboard-history__cell" style=${Dt(o.grid)}>
            ${ou(o.kind)}
            <span class="dashboard-history__cell-title">${o.title||o.kind}</span>
            ${n?u`<span class="dashboard-widget__provenance"
                    >${d("dashboard.widget.provenanceChip")}</span
                  >`:p}
          </div>
        `})}
    </div>
    <div class="dashboard-history__preview-caption">
      ${d("dashboard.history.previewCaption",{version:String(r)})}
    </div>
  `}function iu(e,t){let r=Mo(e,t);return r.length===0?u`<div class="card-sub" data-test-id="dashboard-history-diff-empty">
      ${d("dashboard.history.diffEmpty")}
    </div>`:u`
    <div class="dashboard-history__diff-groups" data-test-id="dashboard-history-diff">
      ${Io(r).map(a=>u`
          <div class="dashboard-history__diff-group">
            <div class="dashboard-history__diff-actor">
              ${a.actor??d("dashboard.history.actorUnknown")}
            </div>
            <ul class="dashboard-history__diff-list">
              ${a.entries.map(s=>u`
                  <li class="dashboard-history__diff-item">
                    <span class="dashboard-history__diff-kind"
                      >${d(`dashboard.history.kind.${s.kind}`)}</span
                    >
                    <span class="dashboard-history__diff-label">${s.label}</span>
                    ${s.detail?u`<span class="dashboard-history__diff-detail">${s.detail}</span>`:p}
                  </li>
                `)}
            </ul>
          </div>
        `)}
    </div>
  `}function du(e,t,r){let a=r.gallery;if(!a)return p;let s=()=>e.onRequestUpdate?.(),o=()=>{r.gallery=null,s()},n=f=>{a.indexUrl=f.currentTarget.value},i=f=>{a.mode=f,a.selected=null,a.selectedRecipe=null,a.error=null,s()},l=async()=>{let f=a.indexUrl.trim();if(f){a.busy=!0,a.error=null,a.selected=null,a.selectedRecipe=null,s();try{let[x,R]=await Promise.all([$d(f),Ad(f)]);a.entries=x,a.recipes=R,dc(e.storage,f)}catch(x){a.error=ce(x)}finally{a.busy=!1,s()}}},c=async f=>{a.busy=!0,a.error=null,s();try{a.selected=await kd(f.manifestUrl)}catch(x){a.error=ce(x)}finally{a.busy=!1,s()}},b=async f=>{a.busy=!0,a.error=null,s();try{a.selectedRecipe=await Ed(f.manifestUrl)}catch(x){a.error=ce(x)}finally{a.busy=!1,s()}},h=async()=>{let f=a.selectedRecipe;if(f){a.busy=!0,a.error=null,s();try{if(!await dd(t,e.transport,f)){a.error=t.actionError??ce(new Error("Install failed.")),a.busy=!1,s();return}let x=f.doc.tabs[0]?.slug;x&&(t.activeSlug=x,e.onNavigate?.(x)),r.gallery=null,s()}catch(x){a.error=ce(x),a.busy=!1,s()}}},y=async()=>{let f=a.selected;if(f){a.busy=!0,a.error=null,s();try{await Td(e.transport,f);let x=t.workspace?Bt(t.workspace,t.activeSlug):void 0;e.transport&&x&&await e.transport.request("dashboard.widget.add",{tab:x.slug,widget:{kind:`custom:${f.name}`,title:f.title,grid:Uc(x,f)}}),await ie(t,e.transport,{silent:!0}),r.gallery=null,s()}catch(x){a.error=ce(x),a.busy=!1,s()}}},v=()=>a.selected?cu(a.selected,()=>{a.selected=null,s()},()=>void y(),a.busy):lu(a,f=>void c(f)),w=()=>a.selectedRecipe?bu(a.selectedRecipe,()=>{a.selectedRecipe=null,s()},()=>void h(),a.busy):uu(a,f=>void b(f));return Ze(d("dashboard.gallery.title"),o,u`
      <div class="dashboard-gallery" data-test-id="dashboard-gallery">
        <div class="dashboard-gallery__header">
          <div class="card-title">${d("dashboard.gallery.title")}</div>
          <div class="card-sub">${d("dashboard.gallery.subtitle")}</div>
        </div>
        <div class="dashboard-gallery__tabs" role="tablist">
          <button
            class="dashboard-gallery__tab ${a.mode==="widgets"?"is-active":""}"
            type="button"
            role="tab"
            aria-selected=${a.mode==="widgets"}
            data-test-id="dashboard-gallery-tab-widgets"
            @click=${()=>i("widgets")}
          >
            ${d("dashboard.gallery.tabWidgets")}
          </button>
          <button
            class="dashboard-gallery__tab ${a.mode==="templates"?"is-active":""}"
            type="button"
            role="tab"
            aria-selected=${a.mode==="templates"}
            data-test-id="dashboard-gallery-tab-templates"
            @click=${()=>i("templates")}
          >
            ${d("dashboard.gallery.tabTemplates")}
          </button>
        </div>
        <div class="dashboard-gallery__browse">
          <input
            class="bs-dialog__input"
            type="url"
            inputmode="url"
            data-test-id="dashboard-gallery-url"
            placeholder=${d("dashboard.gallery.urlPlaceholder")}
            aria-label=${d("dashboard.gallery.urlLabel")}
            .value=${a.indexUrl}
            @input=${n}
          />
          <button
            class="bs-btn bs-btn--small bs-btn--primary"
            type="button"
            data-test-id="dashboard-gallery-browse"
            ?disabled=${a.busy}
            @click=${()=>void l()}
          >
            ${d("dashboard.gallery.browse")}
          </button>
        </div>
        ${a.error?u`<div class="callout danger" role="alert" data-test-id="dashboard-gallery-error">
                ${a.error}
              </div>`:p}
        ${a.mode==="templates"?w():v()}
      </div>
    `)}function lu(e,t){return e.entries===null?p:e.entries.length===0?u`<div class="dashboard-gallery__empty">${d("dashboard.gallery.empty")}</div>`:u`
    <ul class="dashboard-gallery__list" data-test-id="dashboard-gallery-list">
      ${e.entries.map(r=>u`
          <li class="dashboard-gallery__item">
            <div class="dashboard-gallery__item-body">
              <div class="dashboard-gallery__item-name">${r.name}</div>
              ${r.description?u`<div class="dashboard-gallery__item-desc">${r.description}</div>`:p}
            </div>
            <button
              class="bs-btn bs-btn--small"
              type="button"
              data-test-id="dashboard-gallery-select"
              ?disabled=${e.busy}
              @click=${()=>t(r)}
            >
              ${d("dashboard.gallery.view")}
            </button>
          </li>
        `)}
    </ul>
  `}function cu(e,t,r,a){return u`
    <div class="dashboard-gallery__detail" data-test-id="dashboard-gallery-detail">
      <div class="dashboard-gallery__item-name">${e.title}</div>
      <div class="dashboard-gallery__caps">
        <div class="dashboard-gallery__caps-label">${d("dashboard.gallery.capabilities")}</div>
        ${e.capabilities.length===0?u`<span class="dashboard-gallery__cap"
                >${d("dashboard.gallery.noCapabilities")}</span
              >`:e.capabilities.map(s=>u`<span class="dashboard-gallery__cap" data-test-id="dashboard-gallery-cap"
                    >${s}</span
                  >`)}
      </div>
      <div class="dashboard-gallery__pending-note">${d("dashboard.gallery.pendingNote")}</div>
      <div class="bs-dialog__actions">
        <button
          class="bs-btn bs-btn--primary"
          type="button"
          data-test-id="dashboard-gallery-install"
          ?disabled=${a}
          @click=${r}
        >
          ${d("dashboard.gallery.install")}
        </button>
        <button class="bs-btn" type="button" @click=${t}>${d("common.back")}</button>
      </div>
    </div>
  `}function uu(e,t){return e.recipes===null?p:e.recipes.length===0?u`<div class="dashboard-gallery__empty">${d("dashboard.gallery.recipesEmpty")}</div>`:u`
    <ul class="dashboard-gallery__list" data-test-id="dashboard-gallery-recipe-list">
      ${e.recipes.map(r=>u`
          <li class="dashboard-gallery__item">
            <div class="dashboard-gallery__item-body">
              <div class="dashboard-gallery__item-name">${r.title}</div>
              ${r.description?u`<div class="dashboard-gallery__item-desc">${r.description}</div>`:p}
              <div class="dashboard-gallery__recipe-needs">
                ${r.connectors.length===0?d("dashboard.gallery.recipeNeedsNothing"):d("dashboard.gallery.recipeNeedsConnectors",{connectors:r.connectors.join(", ")})}
              </div>
            </div>
            <button
              class="bs-btn bs-btn--small"
              type="button"
              data-test-id="dashboard-gallery-recipe-select"
              ?disabled=${e.busy}
              @click=${()=>t(r)}
            >
              ${d("dashboard.gallery.view")}
            </button>
          </li>
        `)}
    </ul>
  `}function bu(e,t,r,a){let s=Object.entries(e.grantsManifest);return u`
    <div class="dashboard-gallery__detail" data-test-id="dashboard-gallery-recipe-detail">
      <div class="dashboard-gallery__item-name">${e.title}</div>
      <div class="dashboard-gallery__item-desc">${e.description}</div>
      <div class="dashboard-gallery__recipe-grants">
        <div class="dashboard-gallery__caps-label">${d("dashboard.gallery.recipeNeedsLabel")}</div>
        ${s.length===0?u`<div class="dashboard-gallery__recipe-nogrants">
                ${d("dashboard.gallery.recipeNoGrants")}
              </div>`:s.map(([,o])=>u`
                  <div class="dashboard-gallery__recipe-connector">
                    <div class="dashboard-gallery__recipe-connector-name">${o.label}</div>
                    ${o.reason?u`<div class="dashboard-gallery__recipe-connector-reason">
                            ${o.reason}
                          </div>`:p}
                    <ul class="dashboard-gallery__recipe-tools">
                      ${(o.tools??[]).map(n=>u`
                          <li
                            class="dashboard-gallery__recipe-tool"
                            data-test-id="dashboard-gallery-recipe-tool"
                          >
                            <code>${n.id}</code>
                            <span>${n.label}</span>
                            ${n.readOnly?u`<span class="dashboard-gallery__recipe-readonly"
                                    >${d("dashboard.gallery.recipeReadOnly")}</span
                                  >`:p}
                          </li>
                        `)}
                    </ul>
                  </div>
                `)}
      </div>
      <div class="dashboard-gallery__pending-note">${d("dashboard.gallery.recipeInstallNote")}</div>
      <div class="bs-dialog__actions">
        <button
          class="bs-btn bs-btn--primary"
          type="button"
          data-test-id="dashboard-gallery-recipe-install"
          ?disabled=${a}
          @click=${r}
        >
          ${d("dashboard.gallery.recipeInstall")}
        </button>
        <button class="bs-btn" type="button" @click=${t}>${d("common.back")}</button>
      </div>
    </div>
  `}var me,jt=(me=class extends pe{constructor(...t){super(...t),this.transport=null,this.connected=!1,this.operator=!1}createRenderRoot(){return this}render(){return qc({host:this,transport:this.transport,connected:this.connected,onRequestUpdate:()=>this.requestUpdate(),...this.strings?{strings:this.strings}:{},...this.onNavigate?{onNavigate:this.onNavigate}:{},...this.storage?{storage:this.storage}:{},...this.confirm?{confirm:this.confirm}:{},...this.embed?{embed:this.embed}:{},...this.basePath!==void 0?{basePath:this.basePath}:{},...this.initialTab!==void 0?{initialTab:this.initialTab}:{},...this.sessionKey!==void 0?{sessionKey:this.sessionKey}:{},...this.logbookHref!==void 0?{logbookHref:this.logbookHref}:{},operator:this.operator})}disconnectedCallback(){super.disconnectedCallback(),Xi(this),bc(this)}},me.properties={transport:{attribute:!1},connected:{type:Boolean},strings:{attribute:!1},onNavigate:{attribute:!1},storage:{attribute:!1},confirm:{attribute:!1},embed:{attribute:!1},basePath:{type:String},initialTab:{type:String},sessionKey:{type:String},logbookHref:{type:String},operator:{type:Boolean}},me);typeof customElements<"u"&&!customElements.get("boardstate-view")&&customElements.define("boardstate-view",jt);var ye,qt=(ye=class extends pe{constructor(...t){super(...t),this.currentLabel="",this.agentLabel="",this.brandLabel="",this.overviewHref="",this.handleOverviewClick=r=>{r.defaultPrevented||r.button!==0||r.metaKey||r.ctrlKey||r.shiftKey||r.altKey||(r.preventDefault(),this.dispatchEvent(new CustomEvent("navigate",{detail:"overview",bubbles:!0,composed:!0})))}}createRenderRoot(){return this}render(){let t=this.currentLabel.trim(),r=this.agentLabel.trim(),a=this.brandLabel.trim();return u`
      <div class="dashboard-header">
        <div class="dashboard-header__breadcrumb">
          ${a?this.overviewHref?u`<a
                    class="dashboard-header__breadcrumb-link"
                    href=${this.overviewHref}
                    @click=${this.handleOverviewClick}
                    >${a}</a
                  >`:u`<span class="dashboard-header__breadcrumb-link">${a}</span>`:p}
          ${r?u`
                  <span class="dashboard-header__breadcrumb-segment">
                    ${a?u`<span class="dashboard-header__breadcrumb-sep">›</span>`:p}
                    <span class="dashboard-header__breadcrumb-context" title=${r}>
                      ${r}
                    </span>
                  </span>
                `:p}
          ${t?u`
                  ${a||r?u`<span class="dashboard-header__breadcrumb-sep">›</span>`:p}
                  <span class="dashboard-header__breadcrumb-current">${t}</span>
                `:p}
        </div>
        <div class="dashboard-header__actions">
          <slot></slot>
        </div>
      </div>
    `}},ye.properties={currentLabel:{type:String},agentLabel:{type:String},brandLabel:{type:String},overviewHref:{type:String}},ye);typeof customElements<"u"&&!customElements.get("boardstate-header")&&customElements.define("boardstate-header",qt);var is=`/*
 * @boardstate/lit reference view styles.
 *
 * Every themeable value is read as \`var(--bs-<token>, <default>)\` so the stylesheet
 * renders standalone yet is fully overridable: set the \`--bs-*\` custom properties on
 * any ancestor to theme it. See THEME.md for the full token table.
 *
 * The \`:root\` block below is the shipped default theme \u2014 "Graphite", a Linear/Vercel/
 * Codex-family palette that looks world-class light AND dark out of the box. Dark mode
 * activates two ways so either the OS preference or an explicit toggle drives it:
 *   - \`<html data-theme="dark">\` / \`data-theme="light">\` \u2014 explicit, always wins.
 *   - \`prefers-color-scheme: dark\` \u2014 used only when no explicit \`data-theme="light"\`.
 * Drop in an alternate theme (e.g. \`@boardstate/lit/themes/aurora.css\`) after this file
 * to fully re-skin, or override any \`--bs-*\` token on an ancestor.
 */

:root {
  /* Tells the UA to render form controls, scrollbars, etc. for the light theme. */
  color-scheme: light;

  /* Typography */
  --bs-font-sans: -apple-system, "SF Pro Text", system-ui, "Segoe UI", Roboto, sans-serif;
  --bs-font-mono: ui-monospace, "SF Mono", Menlo, monospace;

  /* Surfaces */
  --bs-bg: #fbfbfd;
  --bs-card: #ffffff;
  --bs-card-highlight: #f6f6fa;
  --bs-input: #ffffff;
  --bs-bg-hover: #f2f2f7;
  --bs-bg-muted: rgba(16, 16, 24, 0.03);

  /* Borders */
  --bs-border: #e7e7ee;
  --bs-border-strong: #d9d9e2;

  /* Text */
  --bs-text: #15151b;
  --bs-text-strong: #000000;
  --bs-text-muted: #6b6b77;
  --bs-text-dim: #9a9aa6;
  --bs-muted: #6b6b77;

  /* Accent / semantic \u2014 light values sit a step darker than dark mode's so
     accent-as-text and white-on-accent both clear WCAG AA (4.5:1) on white. */
  --bs-accent: #6c5bfa;
  --bs-accent-foreground: #ffffff;
  --bs-ring: rgba(108, 91, 250, 0.5);
  --bs-focus-ring: 0 0 0 2px rgba(108, 91, 250, 0.45);
  --bs-success: #27853c;
  --bs-warning: #986d0d;
  --bs-danger: #d92c25;
  --bs-danger-subtle: rgba(217, 44, 37, 0.1);

  /* Radii */
  --bs-radius-sm: 6px;
  --bs-radius-md: 9px;
  --bs-radius-lg: 12px;
  --bs-radius-full: 999px;

  /* Elevation / motion */
  --bs-shadow-md: 0 1px 2px rgba(16, 16, 24, 0.06), 0 6px 20px rgba(16, 16, 24, 0.08);
  --bs-ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --bs-duration-fast: 120ms;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bs-bg: #0b0b0f;
  --bs-card: #131318;
  --bs-card-highlight: #17171e;
  --bs-input: #17171e;
  --bs-bg-hover: rgba(255, 255, 255, 0.04);
  --bs-bg-muted: rgba(255, 255, 255, 0.02);
  --bs-border: #23232b;
  --bs-border-strong: #30303a;
  --bs-text: #ededf2;
  --bs-text-strong: #ffffff;
  --bs-text-muted: #9a9aa6;
  --bs-text-dim: #63636e;
  --bs-muted: #9a9aa6;
  --bs-accent: #7c6cff;
  --bs-accent-foreground: #ffffff;
  --bs-ring: rgba(124, 108, 255, 0.5);
  --bs-focus-ring: 0 0 0 2px rgba(124, 108, 255, 0.45);
  --bs-success: #3fb950;
  --bs-warning: #d29922;
  --bs-danger: #f85149;
  --bs-danger-subtle: rgba(248, 81, 73, 0.14);
  --bs-shadow-md: 0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.28);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --bs-bg: #0b0b0f;
    --bs-card: #131318;
    --bs-card-highlight: #17171e;
    --bs-input: #17171e;
    --bs-bg-hover: rgba(255, 255, 255, 0.04);
    --bs-bg-muted: rgba(255, 255, 255, 0.02);
    --bs-border: #23232b;
    --bs-border-strong: #30303a;
    --bs-text: #ededf2;
    --bs-text-strong: #ffffff;
    --bs-text-muted: #9a9aa6;
    --bs-text-dim: #63636e;
    --bs-muted: #9a9aa6;
    --bs-accent: #7c6cff;
    --bs-accent-foreground: #ffffff;
    --bs-ring: rgba(124, 108, 255, 0.5);
    --bs-focus-ring: 0 0 0 2px rgba(124, 108, 255, 0.45);
    --bs-success: #3fb950;
    --bs-warning: #d29922;
    --bs-danger: #f85149;
    --bs-danger-subtle: rgba(248, 81, 73, 0.14);
    --bs-shadow-md: 0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.28);
  }
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  padding-bottom: 16px;
  --dashboard-row-height: 56px;
  --dashboard-grid-gap: 12px;
  color: var(--bs-text, #1a1d21);
  font-family: var(--bs-font-sans, system-ui, sans-serif);
}

.dashboard__toast {
  margin: 0;
}

/* Generic surfaces the view borrows (were app-global in the source). */
.callout {
  padding: 10px 12px;
  border-radius: var(--bs-radius-md, 8px);
  border: 1px solid var(--bs-border, #e5e7eb);
  background: var(--bs-card, #fff);
}
.callout.danger {
  border-color: color-mix(in srgb, var(--bs-danger, #ef4444) 40%, var(--bs-border, #e5e7eb));
  background: color-mix(in srgb, var(--bs-danger, #ef4444) 8%, var(--bs-card, #fff));
  color: var(--bs-text, #1a1d21);
}
.card {
  padding: 16px;
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-lg, 12px);
  background: var(--bs-card, #fff);
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--bs-text-strong, #111418);
}
.card-sub {
  font-size: 0.9em;
  color: var(--bs-text-muted, #6b7280);
}
.page-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--bs-text-strong, #111418);
}
.page-sub {
  font-size: 0.9em;
  color: var(--bs-text-muted, #6b7280);
}

/* Local button (replaces the app's .btn). */
.bs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-md, 8px);
  background: var(--bs-card, #fff);
  color: var(--bs-text, #1a1d21);
  font: inherit;
  cursor: pointer;
}
.bs-btn:hover {
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
}
.bs-btn--small {
  height: 26px;
  padding: 0 10px;
  font-size: 0.9em;
}
.bs-btn--primary {
  background: var(--bs-accent, #6366f1);
  border-color: var(--bs-accent, #6366f1);
  color: var(--bs-accent-foreground, #fff);
}
.bs-btn--primary:hover {
  background: color-mix(in srgb, var(--bs-accent, #6366f1) 88%, #000);
}
.bs-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Local modal + dialog (replaces the app modal-dialog element). */
.bs-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: color-mix(in srgb, #000 60%, transparent);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}
.bs-modal__card {
  width: auto;
  min-width: min(420px, calc(100vw - 48px));
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 48px);
  overflow: auto;
  overscroll-behavior: contain;
  padding: 16px;
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-lg, 12px);
  background: var(--bs-card, #fff);
  box-shadow: var(--bs-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.18));
}
.bs-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bs-dialog__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--bs-text-strong, #111418);
}
.bs-dialog__sub {
  font-size: 0.9em;
  color: var(--bs-text-muted, #6b7280);
}
.bs-dialog__input {
  width: 100%;
  border: 1px solid var(--bs-input, var(--bs-border, #e5e7eb));
  background: var(--bs-card, #fff);
  border-radius: var(--bs-radius-md, 8px);
  padding: 8px 12px;
  color: var(--bs-text, #1a1d21);
  outline: none;
}
.bs-dialog__input:focus-visible {
  border-color: var(--bs-ring, var(--bs-accent, #6366f1));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--bs-accent, #6366f1) 40%, transparent);
}
select.bs-dialog__input {
  appearance: none;
  cursor: pointer;
}
.bs-dialog__actions {
  display: flex;
  gap: 8px;
}

.dashboard-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.dashboard-page-header__titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

/* Tab-level actions (gallery / full-bleed / history / export / import). */
.dashboard-page-header__actions,
.dashboard-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.dashboard-page-header__action-icon {
  display: inline-flex;
  width: 14px;
  height: 14px;
  margin-inline-end: 4px;
  vertical-align: -2px;
}

/* --- Tab strip ----------------------------------------------------------- */

.dashboard-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--bs-border, #e5e7eb);
  padding-bottom: 8px;
}
.dashboard-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: var(--bs-radius-md, 8px);
  background: transparent;
  color: var(--bs-text-muted, #6b7280);
  font: inherit;
  cursor: pointer;
  transition:
    background 120ms var(--bs-ease-out, ease-out),
    color 120ms var(--bs-ease-out, ease-out);
}
.dashboard-tab:hover {
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
  color: var(--bs-text, #1a1d21);
}
.dashboard-tab--active {
  background: color-mix(in srgb, var(--bs-accent, #6366f1) 16%, transparent);
  border-color: color-mix(in srgb, var(--bs-accent, #6366f1) 40%, var(--bs-border, #e5e7eb));
  color: var(--bs-text, #1a1d21);
}
.dashboard-tab__icon svg {
  width: 15px;
  height: 15px;
}
.dashboard-tab__label {
  white-space: nowrap;
}
.dashboard-tabs__hidden {
  position: relative;
  margin-inline-start: auto;
}
.dashboard-tabs__hidden summary {
  list-style: none;
}
.dashboard-tabs__hidden summary::-webkit-details-marker {
  display: none;
}
.dashboard-tab--overflow {
  color: var(--bs-text-muted, #6b7280);
  flex-wrap: nowrap;
  white-space: nowrap;
}
.dashboard-tabs__hidden-menu {
  position: absolute;
  inset-inline-end: 4px;
  margin-top: 4px;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  padding: 4px;
  background: var(--bs-card, #fff);
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-md, 8px);
  box-shadow: var(--bs-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.18));
  z-index: 20;
}
.dashboard-tabs__hidden-item {
  text-align: start;
  padding: 6px 8px;
  border: none;
  border-radius: var(--bs-radius-sm, 6px);
  background: transparent;
  color: var(--bs-text, #1a1d21);
  font: inherit;
  cursor: pointer;
}
.dashboard-tabs__hidden-item:hover {
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
}

/* --- Grid ---------------------------------------------------------------- */

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: var(--dashboard-row-height);
  gap: var(--dashboard-grid-gap);
  align-content: start;
  flex: 1;
  min-height: 0;
}

/* --- Widget cell --------------------------------------------------------- */

.dashboard-widget {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  position: relative;
  background: var(--bs-card, #fff);
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-lg, 12px);
}
.dashboard-widget--collapsed {
  grid-row: auto !important;
}
.dashboard-widget--pending {
  opacity: 0.7;
}
/* The landing-cell placeholder during a drag: deliberately QUIET \u2014 a neutral
   slot outline, not a colored signal \u2014 because the dragged card itself now
   carries the motion (Mac-style direct manipulation). Red stays reserved for
   an invalid (colliding) drop. */
.dashboard-ghost {
  pointer-events: none;
  border-radius: var(--bs-radius-lg, 12px);
  border: 2px dashed color-mix(in srgb, var(--bs-text-muted, #9a9aa6) 45%, transparent);
  background: color-mix(in srgb, var(--bs-text-muted, #9a9aa6) 7%, transparent);
  z-index: 5;
}
.dashboard-ghost--invalid {
  border-color: color-mix(in srgb, var(--bs-danger, #ef4444) 70%, transparent);
  background: color-mix(in srgb, var(--bs-danger, #ef4444) 10%, transparent);
}
.dashboard-widget--dragging {
  z-index: 10;
}
/* The carried card: lifted and following the pointer 1:1. No transition \u2014
   the transform must track the pointer with zero lag; the \u2264half-cell settle
   on drop is instant and imperceptible. */
/* Double class beats the later theme-section \`.dashboard-widget { box-shadow }\`. */
.dashboard-widget.dashboard-widget--carried {
  transition: none;
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.38),
    0 4px 12px rgba(0, 0, 0, 0.24);
  opacity: 0.94;
  cursor: grabbing;
  will-change: transform;
}
.dashboard-widget--carried .dashboard-widget__bar {
  cursor: grabbing;
}
.dashboard-widget__bar {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: grab;
  padding-block: 4px;
  padding-inline: 4px 6px;
  border-bottom: 1px solid var(--bs-border, #e5e7eb);
  border-start-start-radius: var(--bs-radius-lg, 12px);
  border-start-end-radius: var(--bs-radius-lg, 12px);
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.dashboard-widget__bar:active {
  cursor: grabbing;
}
.dashboard-widget__collapse,
.dashboard-widget__menu-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--bs-radius-sm, 6px);
  background: transparent;
  color: var(--bs-text-muted, #6b7280);
  cursor: pointer;
}
.dashboard-widget__collapse:hover,
.dashboard-widget__menu-toggle:hover {
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
  color: var(--bs-text, #1a1d21);
}
.dashboard-widget__menu-toggle[aria-expanded="true"] {
  background: color-mix(in srgb, var(--bs-accent, #6366f1) 16%, transparent);
  color: var(--bs-text, #1a1d21);
}
.dashboard-widget__collapse svg,
.dashboard-widget__menu-toggle svg {
  width: 15px;
  height: 15px;
}
.dashboard-widget__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--bs-text-strong, #111418);
}
.dashboard-widget__provenance {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: var(--bs-radius-full, 999px);
  background: color-mix(in srgb, var(--bs-accent, #6366f1) 18%, transparent);
  color: var(--bs-accent, #6366f1);
  font-size: 0.68em;
  font-weight: 700;
  letter-spacing: 0.04em;
}
/* Per-agent provenance chip (SPEC \xA717.3, #59): a deterministically-coloured chip on a
   multi-agent board. The hue comes from \`--dashboard-agent-hue\` (set per widget); the
   fill + text derive from it so every agent keeps one readable colour in light + dark. */
.dashboard-widget__agent {
  display: inline-flex;
  align-items: center;
  max-width: 8rem;
  padding: 1px 6px;
  border-radius: var(--bs-radius-full, 999px);
  background: hsl(var(--dashboard-agent-hue, 250) 70% 50% / 0.18);
  color: hsl(var(--dashboard-agent-hue, 250) 65% 42%);
  font-size: 0.68em;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (prefers-color-scheme: dark) {
  .dashboard-widget__agent {
    color: hsl(var(--dashboard-agent-hue, 250) 80% 72%);
  }
}
.dashboard-widget__agent--dimmed {
  opacity: 0.5;
}
/* Filter highlight: a non-matching widget recedes so the highlighted agent stands out. */
.dashboard-widget--agent-dimmed {
  opacity: 0.4;
  filter: saturate(0.7);
}
/* The per-agent filter bar (SPEC \xA717.3, #59) \u2014 a row of agent chips above the grid. */
.dashboard-agent-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 4px 2px 8px;
}
.dashboard-agent-filter__label {
  font-size: 0.72em;
  font-weight: 600;
  color: var(--bs-text-dim, #9ca3af);
  margin-inline-end: 2px;
}
.dashboard-agent-filter__chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--bs-radius-full, 999px);
  border: 1px solid var(--bs-border, #e5e7eb);
  background: transparent;
  color: var(--bs-text, #111827);
  font-size: 0.72em;
  font-weight: 600;
  cursor: pointer;
}
.dashboard-agent-filter__chip--agent {
  border-color: hsl(var(--dashboard-agent-hue, 250) 60% 55% / 0.5);
  color: hsl(var(--dashboard-agent-hue, 250) 60% 40%);
}
.dashboard-agent-filter__chip--active {
  background: hsl(var(--dashboard-agent-hue, 250) 70% 50% / 0.16);
  border-color: hsl(var(--dashboard-agent-hue, 250) 65% 50%);
}
.dashboard-agent-filter__chip--active:not(.dashboard-agent-filter__chip--agent) {
  background: color-mix(in srgb, var(--bs-accent, #6366f1) 16%, transparent);
  border-color: var(--bs-accent, #6366f1);
}
@media (prefers-color-scheme: dark) {
  .dashboard-agent-filter__chip--agent {
    color: hsl(var(--dashboard-agent-hue, 250) 80% 72%);
  }
}
/* Per-agent scope line in an approvals row (SPEC \xA717.3, #59). */
.dashboard-approvals__scope {
  font-size: 0.72em;
  color: var(--bs-text-dim, #9ca3af);
}
.dashboard-widget__handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--bs-text-dim, #9ca3af);
  cursor: grab;
}
.dashboard-widget__handle svg {
  width: 14px;
  height: 14px;
}
.dashboard-widget__menu {
  position: absolute;
  inset-inline-end: 6px;
  top: 34px;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  padding: 4px;
  background: var(--bs-card, #fff);
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-md, 8px);
  box-shadow: var(--bs-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.18));
  z-index: 30;
}
.dashboard-widget__menu-item {
  text-align: start;
  padding: 6px 8px;
  border: none;
  border-radius: var(--bs-radius-sm, 6px);
  background: transparent;
  color: var(--bs-text, #1a1d21);
  font: inherit;
  cursor: pointer;
}
.dashboard-widget__menu-item:hover {
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
}
.dashboard-widget__menu-item--danger {
  color: var(--bs-danger, #ef4444);
}
.dashboard-widget__body {
  flex: 1;
  min-height: 0;
  padding: 14px 16px;
  overflow: auto;
  border-end-start-radius: var(--bs-radius-lg, 12px);
  border-end-end-radius: var(--bs-radius-lg, 12px);
  animation: dashboard-widget-expand 160ms var(--bs-ease-out, ease-out) both;
}
@keyframes dashboard-widget-expand {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.dashboard-widget__resize {
  position: absolute;
  inset-inline-end: 0;
  inset-block-end: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  touch-action: none;
  background: linear-gradient(
    135deg,
    transparent 50%,
    color-mix(in srgb, var(--bs-border-strong, #d1d5db) 80%, transparent) 50%
  );
  opacity: 0;
  transition: opacity 120ms var(--bs-ease-out, ease-out);
}
.dashboard-widget:hover .dashboard-widget__resize,
.dashboard-widget:focus-within .dashboard-widget__resize,
.dashboard-widget--dragging .dashboard-widget__resize {
  opacity: 1;
}
.dashboard-widget__placeholder {
  color: var(--bs-text-muted, #6b7280);
  font-size: 0.85em;
}
.dashboard-widget__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border-radius: var(--bs-radius-sm, 6px);
  background: color-mix(in srgb, var(--bs-danger, #ef4444) 12%, transparent);
  color: var(--bs-text, #1a1d21);
}
.dashboard-widget__error-title {
  font-weight: 600;
  color: var(--bs-danger, #ef4444);
}
.dashboard-widget__error-humane {
  font-size: 0.9em;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-widget__error-detail,
.dashboard-error-detail {
  font-size: 0.82em;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-widget__error-detail summary,
.dashboard-error-detail summary {
  cursor: pointer;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-widget__error-message,
.dashboard-error-detail__text {
  margin-top: 4px;
  font-size: 0.85em;
  color: var(--bs-text-muted, #6b7280);
  overflow-wrap: anywhere;
}

/* --- Custom widget host -------------------------------------------------- */

.dashboard-widget__custom {
  display: flex;
  min-height: 120px;
  height: 100%;
}
.dashboard-widget__frame {
  display: block;
  flex: 1;
  width: 100%;
  min-height: 120px;
  border: 0;
  border-radius: var(--bs-radius-sm, 6px);
  background: var(--bs-card, #fff);
}
.dashboard-widget__approval {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
}
.dashboard-widget__approval-title {
  font-weight: 600;
  color: var(--bs-text, #1a1d21);
}
.dashboard-widget__approval-sub {
  font-size: 0.85em;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-widget__approval-actions {
  display: flex;
  gap: 8px;
}

/* --- Builtin bodies ------------------------------------------------------ */

.dashboard-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dashboard-stat__value {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: var(--bs-text, #1a1d21);
}
.dashboard-stat__label {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-markdown {
  font-size: 0.9em;
}
/* Class-qualified so host resets / element styles (e.g. Tailwind preflight) don't
   flatten headings or restyle code. */
.dashboard-markdown h1,
.dashboard-markdown h2,
.dashboard-markdown h3,
.dashboard-markdown h4,
.dashboard-markdown h5,
.dashboard-markdown h6 {
  margin: 0.8em 0 0.4em;
  font-weight: 600;
  line-height: 1.25;
  color: var(--bs-text-strong, #000000);
}
.dashboard-markdown > :first-child {
  margin-top: 0;
}
.dashboard-markdown h1 {
  font-size: 1.5em;
}
.dashboard-markdown h2 {
  font-size: 1.3em;
}
.dashboard-markdown h3 {
  font-size: 1.15em;
}
.dashboard-markdown code {
  padding: 0.1em 0.35em;
  border-radius: var(--bs-radius-sm, 6px);
  background: var(--bs-bg-muted, #f3f4f6);
  color: var(--bs-text, #1a1d21);
  font-family: var(--bs-font-mono, ui-monospace, monospace);
  font-size: 0.9em;
}
.dashboard-markdown pre {
  padding: 8px 10px;
  border-radius: var(--bs-radius-sm, 6px);
  background: var(--bs-bg-muted, #f3f4f6);
  overflow-x: auto;
}
.dashboard-markdown pre code {
  padding: 0;
  background: none;
}
/* Task items: the \u2610/\u2611 glyph replaces the bullet (no double markers). */
.dashboard-markdown li.dashboard-markdown__task-item {
  list-style: none;
}
.dashboard-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.85em;
}
.dashboard-list__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px;
  min-width: 0;
}
.dashboard-list__row--disabled {
  opacity: 0.55;
}
.dashboard-list__link {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  color: inherit;
  text-decoration: none;
  border-radius: var(--bs-radius-sm, 6px);
  padding: 2px 4px;
}
.dashboard-list__link:hover {
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
}
.dashboard-list__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--bs-text, #1a1d21);
}
.dashboard-list__meta {
  color: var(--bs-text-muted, #6b7280);
  font-size: 0.9em;
  white-space: nowrap;
}
.dashboard-dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bs-text-dim, #9ca3af);
}
.dashboard-dot--live,
.dashboard-dot--ok {
  background: var(--bs-success, #22c55e);
}
.dashboard-dot--live {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--bs-success, #22c55e) 30%, transparent);
}
.dashboard-dot--warn {
  background: var(--bs-warning, #f59e0b);
}
.dashboard-badge {
  flex: none;
  padding: 1px 6px;
  border-radius: var(--bs-radius-full, 999px);
  font-size: 0.9em;
  font-weight: 600;
  text-transform: lowercase;
}
.dashboard-badge--ok {
  background: color-mix(in srgb, var(--bs-success, #22c55e) 18%, transparent);
  color: var(--bs-success, #16a34a);
}
.dashboard-badge--error {
  background: color-mix(in srgb, var(--bs-danger, #ef4444) 16%, transparent);
  color: var(--bs-danger, #ef4444);
}
.dashboard-badge--muted {
  background: var(--bs-bg-muted, #f3f4f6);
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-usage {
  display: flex;
  gap: 20px;
}
.dashboard-usage__value {
  font-size: 1.3em;
  font-weight: 700;
  color: var(--bs-text, #1a1d21);
}
.dashboard-usage__label {
  font-size: 0.78em;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-table {
  font-size: 0.82em;
}
.dashboard-table__grid {
  width: 100%;
  border-collapse: collapse;
}
.dashboard-table__grid th,
.dashboard-table__grid td {
  text-align: start;
  padding: 4px 8px;
  border-bottom: 1px solid var(--bs-border, #e5e7eb);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}
.dashboard-table__grid th {
  color: var(--bs-text-muted, #6b7280);
  font-weight: 600;
}
.dashboard-table__footer {
  margin-top: 6px;
  color: var(--bs-text-muted, #6b7280);
  font-size: 0.9em;
}
.dashboard-feed {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.84em;
}
.dashboard-feed__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.dashboard-feed__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: var(--bs-text, #1a1d21);
}
.dashboard-feed__time {
  color: var(--bs-text-muted, #6b7280);
  white-space: nowrap;
}
.dashboard-feed__detail {
  color: var(--bs-text-muted, #6b7280);
  overflow-wrap: anywhere;
}
.dashboard-embed__frame {
  width: 100%;
  height: 100%;
  min-height: 120px;
  border: none;
  border-radius: var(--bs-radius-sm, 6px);
  background: var(--bs-bg-muted, #f3f4f6);
}

/* --- Header breadcrumb --------------------------------------------------- */

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.dashboard-header__breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--bs-text-muted, #6b7280);
  font-size: 0.9em;
}
.dashboard-header__breadcrumb-link {
  color: var(--bs-text-muted, #6b7280);
  text-decoration: none;
}
.dashboard-header__breadcrumb-link:hover {
  color: var(--bs-text, #1a1d21);
}
.dashboard-header__breadcrumb-sep {
  color: var(--bs-text-dim, #9ca3af);
}
.dashboard-header__breadcrumb-current {
  color: var(--bs-text, #1a1d21);
  font-weight: 600;
}
.dashboard-header__breadcrumb-segment {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.dashboard-header__breadcrumb-context {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dashboard-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* --- Responsive: single column below ~900px ------------------------------ */

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-auto-rows: auto;
  }
  .dashboard-grid > .dashboard-widget {
    grid-column: 1 / -1 !important;
    grid-row: auto !important;
    min-height: 160px;
  }
}

/* --- Empty / onboarding states ------------------------------------------ */

.dashboard-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  min-height: 200px;
  padding: 32px;
  text-align: center;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-empty__title {
  font-size: 1.05em;
  font-weight: 600;
  color: var(--bs-text, #1a1d21);
}
.dashboard-empty__cmd,
.dashboard-onboarding__cmd {
  margin-top: 4px;
  padding: 4px 8px;
  border-radius: var(--bs-radius-sm, 6px);
  background: var(--bs-bg-muted, #f3f4f6);
  font-family: var(--bs-font-mono, ui-monospace, monospace);
  font-size: 0.85em;
}
.dashboard-empty--tab {
  gap: 10px;
  border: 1px dashed var(--bs-border-strong, #d1d5db);
  border-radius: var(--bs-radius-lg, 12px);
  background: color-mix(in srgb, var(--bs-card, #fff) 60%, transparent);
}
.dashboard-empty__icon {
  color: var(--bs-text-dim, #9ca3af);
}
.dashboard-empty__icon svg {
  width: 28px;
  height: 28px;
}
.dashboard-onboarding {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--bs-accent, #6366f1) 40%, var(--bs-border, #e5e7eb));
  border-radius: var(--bs-radius-lg, 12px);
  background: color-mix(in srgb, var(--bs-accent, #6366f1) 8%, var(--bs-card, #fff));
}
.dashboard-onboarding__icon {
  flex: none;
  color: var(--bs-accent, #6366f1);
  margin-top: 1px;
}
.dashboard-onboarding__icon svg {
  width: 18px;
  height: 18px;
}
.dashboard-onboarding__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dashboard-onboarding__title {
  font-weight: 600;
  color: var(--bs-text-strong, #111418);
}
.dashboard-onboarding__sub {
  font-size: 0.9em;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-onboarding__dismiss {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--bs-radius-sm, 6px);
  background: transparent;
  color: var(--bs-text-muted, #6b7280);
  cursor: pointer;
}
.dashboard-onboarding__dismiss:hover {
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
  color: var(--bs-text, #1a1d21);
}
.dashboard-onboarding__dismiss svg {
  width: 15px;
  height: 15px;
}

/* --- Skeleton loading ---------------------------------------------------- */

.dashboard-skeleton {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--dashboard-grid-gap, 12px);
  flex: 1;
  align-content: start;
}
.dashboard-skeleton__card {
  grid-column: span 4;
  min-height: 120px;
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-lg, 12px);
  background: linear-gradient(
    100deg,
    var(--bs-card, #fff) 30%,
    color-mix(in srgb, var(--bs-text, #1a1d21) 6%, var(--bs-card, #fff)) 50%,
    var(--bs-card, #fff) 70%
  );
  background-size: 200% 100%;
  animation: dashboard-skeleton-shimmer 1.4s ease-in-out infinite;
}
@keyframes dashboard-skeleton-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
@media (max-width: 900px) {
  .dashboard-skeleton {
    grid-template-columns: minmax(0, 1fr);
  }
  .dashboard-skeleton__card {
    grid-column: 1 / -1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-widget__body,
  .dashboard-widget__resize,
  .dashboard-skeleton__card {
    animation: none;
    transition: none;
  }
}

/* --- chart widget (wave-charts) \u2014 dependency-free inline-SVG timeseries -- */
.dashboard-chart {
  width: 100%;
  height: 100%;
  min-height: 40px;
  display: flex;
}
.dashboard-chart__svg {
  width: 100%;
  height: 100%;
}
.dashboard-chart__line {
  stroke: var(--bs-accent, #6366f1);
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
.dashboard-chart__area {
  fill: color-mix(in srgb, var(--bs-accent, #6366f1) 15%, transparent);
  stroke: none;
}
.dashboard-chart__bars rect {
  fill: var(--bs-accent, #6366f1);
}
.dashboard-chart__gauge-track {
  stroke: var(--bs-bg-muted, #f3f4f6);
  stroke-width: 3;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
.dashboard-chart__gauge-fill {
  stroke: var(--bs-accent, #6366f1);
  stroke-width: 3;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
.dashboard-chart__gauge-needle {
  stroke: var(--bs-text, #1a1d21);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

/* --- notes widget (wave-notes) \u2014 editable write-back pad ----------------- */
.dashboard-notes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.dashboard-notes__pad {
  flex: 1 1 auto;
  min-height: 72px;
  width: 100%;
  resize: vertical;
  padding: 8px;
  font: inherit;
  color: var(--bs-text, #1a1d21);
  background: var(--bs-input, #fff);
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-sm, 6px);
}
.dashboard-notes__hint {
  font-size: 12px;
  color: var(--bs-text-muted, #6b7280);
}

/* --- action-form widget (wave-m1) \u2014 operator-authored prompt form -------- */
.dashboard-action-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.dashboard-action-form__field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.dashboard-action-form__label {
  font-size: 12px;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-action-form__control {
  padding: 6px 8px;
  font: inherit;
  color: var(--bs-text, #1a1d21);
  background: var(--bs-input, #fff);
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-sm, 6px);
}
.dashboard-action-form__submit {
  align-self: flex-start;
}

/* --- action-button widget (M5d-1) \u2014 invoke a granted external tool -------- */
.dashboard-action-button {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.dashboard-action-button__invoke {
  align-self: flex-start;
}
.dashboard-action-button__status,
.dashboard-action-button__hint {
  font-size: 12px;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-action-button__pending {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-action-button__pending-actions {
  display: inline-flex;
  gap: 6px;
}
.dashboard-action-button__result-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-action-button__result-body {
  margin: 4px 0 0;
  max-height: 160px;
  overflow: auto;
  padding: 8px;
  font: 12px/1.5 var(--bs-font-mono, ui-monospace, monospace);
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--bs-text, #1a1d21);
  background: var(--bs-surface-muted, #f3f4f6);
  border-radius: var(--bs-radius-sm, 6px);
}
.dashboard-action-button__error {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--bs-danger, #b91c1c);
}
.dashboard-action-button__status[data-status="confirmed"] {
  color: var(--bs-success, #15803d);
}

/* --- agent-status + approvals widgets (wave-ops) ------------------------- */
.dashboard-agent-status,
.dashboard-approvals {
  width: 100%;
}
.dashboard-approvals__actions {
  display: inline-flex;
  gap: 6px;
  margin-inline-start: auto;
}

/* --- chat widget (wave-chat) \u2014 control-plane chat face (SPEC \xA714) --------- */
.dashboard-chat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.dashboard-chat__scroll {
  flex: 1 1 auto;
  min-height: 96px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-inline-end: 2px;
}
.dashboard-chat__empty {
  margin: auto;
  padding: 12px;
  text-align: center;
  color: var(--bs-text-muted);
  font-size: 13px;
}
.dashboard-chat__turn {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dashboard-chat__role {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--bs-text-dim);
}
.dashboard-chat__turn--user .dashboard-chat__role {
  color: var(--bs-accent);
}
.dashboard-chat__text {
  color: var(--bs-text);
  font-size: 14px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.dashboard-chat__text pre {
  padding: 8px;
  overflow-x: auto;
  background: var(--bs-bg-muted);
  border: 1px solid var(--bs-border);
  border-radius: var(--bs-radius-sm);
  font-family: var(--bs-font-mono);
  font-size: 12px;
}
.dashboard-chat__error {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 8px;
  border-radius: var(--bs-radius-sm);
  background: var(--bs-danger-subtle);
  color: var(--bs-danger);
  font-size: 12px;
}
.dashboard-chat__error-retry {
  color: var(--bs-text-muted);
  font-style: italic;
}
/* Tool-call group chip: a run of consecutive calls, collapsed by default. */
.dashboard-chat__tools {
  border: 1px solid var(--bs-border);
  border-radius: var(--bs-radius-md);
  background: var(--bs-card-highlight);
}
.dashboard-chat__chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  color: var(--bs-text-muted);
  list-style: none;
}
.dashboard-chat__chip::-webkit-details-marker {
  display: none;
}
.dashboard-chat__chip-count {
  color: var(--bs-text);
}
.dashboard-chat__chip-sep {
  color: var(--bs-text-dim);
}
.dashboard-chat__chip-marks {
  font-family: var(--bs-font-mono);
  letter-spacing: 1px;
}
.dashboard-chat__tool-log {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 10px 8px;
}
.dashboard-chat__tool-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  color: var(--bs-text);
}
.dashboard-chat__tool-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dashboard-chat__tool-mark {
  font-family: var(--bs-font-mono);
}
.dashboard-chat__tool-row[data-status="ok"] .dashboard-chat__tool-mark {
  color: var(--bs-success);
}
.dashboard-chat__tool-row[data-status="error"] .dashboard-chat__tool-mark {
  color: var(--bs-danger);
}
.dashboard-chat__tool-row[data-status="cancelled"] {
  opacity: 0.55;
}
.dashboard-chat__tool-detail summary {
  cursor: pointer;
  color: var(--bs-text-dim);
  font-size: 11px;
}
.dashboard-chat__tool-detail pre {
  margin: 4px 0 0;
  padding: 6px;
  overflow-x: auto;
  background: var(--bs-bg-muted);
  border-radius: var(--bs-radius-sm);
  font-family: var(--bs-font-mono);
  font-size: 11px;
}
.dashboard-chat__tool-row--building {
  flex-direction: row;
  align-items: center;
  color: var(--bs-text-muted);
}
.dashboard-chat__tool-note {
  font-style: italic;
  color: var(--bs-text-dim);
}
.dashboard-chat__shimmer {
  width: 14px;
  height: 14px;
  border-radius: var(--bs-radius-full);
  background: linear-gradient(
    90deg,
    var(--bs-bg-muted),
    var(--bs-border-strong),
    var(--bs-bg-muted)
  );
  background-size: 200% 100%;
  animation: dashboard-chat-shimmer 1.2s ease-in-out infinite;
}
@keyframes dashboard-chat-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dashboard-chat__shimmer {
    animation: none;
  }
}
/* Inline "the agent scaffolded a widget" approval card. */
.dashboard-chat__approval {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 10px;
  border: 1px solid var(--bs-border-strong);
  border-radius: var(--bs-radius-md);
  background: var(--bs-card-highlight);
}
.dashboard-chat__approval-title {
  flex: 1 1 auto;
  font-size: 13px;
  color: var(--bs-text);
}
.dashboard-chat__approval-actions {
  display: inline-flex;
  gap: 6px;
}
.dashboard-chat__jump {
  align-self: center;
  padding: 3px 12px;
  border: 1px solid var(--bs-border);
  border-radius: var(--bs-radius-full);
  background: var(--bs-card);
  color: var(--bs-text-muted);
  font-size: 12px;
  cursor: pointer;
  box-shadow: var(--bs-shadow-md);
}
.dashboard-chat__input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dashboard-chat__textarea {
  width: 100%;
  resize: vertical;
  min-height: 42px;
  padding: 8px;
  font: inherit;
  color: var(--bs-text);
  background: var(--bs-input);
  border: 1px solid var(--bs-border);
  border-radius: var(--bs-radius-sm);
}
.dashboard-chat__input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
.dashboard-chat__hint {
  font-size: 12px;
  color: var(--bs-text-muted);
}

/* --- ephemeral (temporary) widget badge (wave-m1) ------------------------ */
.dashboard-widget__ephemeral {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: var(--bs-radius-full, 999px);
  border: 1px solid var(--bs-border, #e5e7eb);
  background: var(--bs-bg-muted, #f3f4f6);
  color: var(--bs-text-muted, #6b7280);
  font-size: 11px;
  line-height: 1.4;
}

/* --- preview widget (wave2b) \u2014 sandboxed frame + viewport presets -------- */
.dashboard-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.dashboard-preview__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.dashboard-preview__viewports {
  display: inline-flex;
  gap: 4px;
}
.dashboard-preview__viewport,
.dashboard-preview__reload {
  padding: 2px 8px;
  font-size: 12px;
  color: var(--bs-text-muted, #6b7280);
  background: var(--bs-bg-muted, #f3f4f6);
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-sm, 6px);
  cursor: pointer;
}
.dashboard-preview__viewport:hover,
.dashboard-preview__reload:hover {
  color: var(--bs-text, #1a1d21);
}
.dashboard-preview__frame-wrap {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  min-height: 120px;
}
.dashboard-preview__frame-wrap--tablet .dashboard-preview__frame {
  width: 768px;
  max-width: 100%;
}
.dashboard-preview__frame-wrap--mobile .dashboard-preview__frame {
  width: 375px;
  max-width: 100%;
}

/* --- multi-operator presence + private tab + per-agent nesting (wave-w4) - */
.dashboard-tab__private {
  display: inline-flex;
  align-items: center;
  margin-inline-start: 2px;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-tab__private svg {
  width: 12px;
  height: 12px;
}
.dashboard-tab__presence {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-inline-start: 2px;
}
.dashboard-tab__presence-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--bs-accent, #6366f1);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--bs-accent, #6366f1) 30%, transparent);
}
.dashboard-tab__presence-count {
  font-size: 11px;
  line-height: 1;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-tab-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-md, 8px);
}
.dashboard-tab-group__toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  border: none;
  border-radius: var(--bs-radius-sm, 6px);
  background: transparent;
  color: var(--bs-text-muted, #6b7280);
  font: inherit;
  cursor: pointer;
}
.dashboard-tab-group__toggle:hover {
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
  color: var(--bs-text, #1a1d21);
}
.dashboard-tab-group__chevron svg {
  width: 14px;
  height: 14px;
}
.dashboard-tab-group__label {
  white-space: nowrap;
}
.dashboard-tab-group__count {
  min-width: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
  color: var(--bs-text-muted, #6b7280);
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

/* --- full-bleed layout (wave-w3) ----------------------------------------- */
.dashboard-fullbleed {
  display: flex;
  flex-direction: column;
  min-height: 320px;
  height: 100%;
  overflow: auto;
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-md, 8px);
  background: var(--bs-card, #fff);
}
.dashboard-fullbleed > * {
  flex: 1 1 auto;
  min-height: 0;
}

/* --- widget gallery (wave-w3) -------------------------------------------- */
.dashboard-gallery {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: min(560px, 80vw);
}
.dashboard-gallery__header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dashboard-gallery__browse {
  display: flex;
  gap: 8px;
  align-items: center;
}
.dashboard-gallery__browse .bs-dialog__input {
  flex: 1 1 auto;
}
.dashboard-gallery__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 40vh;
  overflow: auto;
  /* Scroll affordance (issue #4): a fade + shadow at a cut-off edge, revealed only
     when there is more list above/below. Pure CSS \u2014 the classic scroll-shadow trick:
     \`local\` cover gradients (card-colored) ride WITH the content and mask the shadow
     at whichever edge is fully scrolled to, while the \`scroll\`-attached shadows stay
     pinned to the box. No JS, no scroll listeners. */
  background:
    linear-gradient(var(--bs-card, #fff) 30%, transparent) top / 100% 22px no-repeat local,
    linear-gradient(transparent, var(--bs-card, #fff) 70%) bottom / 100% 22px no-repeat local,
    radial-gradient(
        farthest-side at 50% 0,
        color-mix(in srgb, var(--bs-text, #000) 14%, transparent),
        transparent
      )
      top / 100% 9px no-repeat scroll,
    radial-gradient(
        farthest-side at 50% 100%,
        color-mix(in srgb, var(--bs-text, #000) 14%, transparent),
        transparent
      )
      bottom / 100% 9px no-repeat scroll;
}
.dashboard-gallery__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-sm, 6px);
}
.dashboard-gallery__item-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.dashboard-gallery__item-name {
  font-weight: 600;
}
.dashboard-gallery__item-desc,
.dashboard-gallery__empty {
  color: var(--bs-text-muted, #6b7280);
  font-size: 0.9em;
}
.dashboard-gallery__caps {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.dashboard-gallery__caps-label {
  color: var(--bs-text-muted, #6b7280);
  font-size: 0.85em;
  width: 100%;
}
.dashboard-gallery__cap {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--bs-border, #e5e7eb);
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
  font-family: var(--bs-font-mono, ui-monospace, monospace);
  font-size: 0.8em;
}
.dashboard-gallery__pending-note {
  color: var(--bs-text-muted, #6b7280);
  font-size: 0.85em;
}

/* --- time-travel history panel (wave-m2) --------------------------------- */
.dashboard-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: min(78vw, 820px);
  max-width: 820px;
}
.dashboard-history__header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dashboard-history__body {
  display: grid;
  grid-template-columns: minmax(180px, 240px) 1fr;
  gap: 16px;
  align-items: start;
}
.dashboard-history__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 60vh;
  overflow-y: auto;
}
.dashboard-history__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-md, 8px);
  background: transparent;
  color: var(--bs-text, #1a1d21);
  font: inherit;
  text-align: start;
  cursor: pointer;
}
.dashboard-history__item:hover {
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
}
.dashboard-history__item--active {
  border-color: var(--bs-accent, #6366f1);
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
}
.dashboard-history__version {
  font-weight: 600;
}
.dashboard-history__time,
.dashboard-history__latest {
  font-size: 12px;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-history__latest {
  color: var(--bs-accent, #6366f1);
}
/* Per-row change summary ("+2 \xB7 1 moved \xB7 agent") under the version label. */
.dashboard-history__change {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
}
.dashboard-history__change-label {
  color: var(--bs-text, #1a1d21);
  font-variant-numeric: tabular-nums;
}
.dashboard-history__detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.dashboard-history__section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bs-text-muted, #6b7280);
  margin-bottom: 6px;
}
.dashboard-history__preview-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dashboard-history__preview {
  position: relative;
  border: 1px dashed var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-md, 8px);
  padding: 8px;
  opacity: 0.85;
}
.dashboard-history__preview--empty {
  display: block;
  font-size: 13px;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-history__cell {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  padding: 6px 8px;
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: var(--bs-radius-sm, 6px);
  background: var(--bs-bg-muted, #f3f4f6);
}
.dashboard-history__cell-glyph {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--bs-text-dim, #9ca3af);
}
.dashboard-history__cell-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
/* Caption under the snapshot grid: "Layout at version N". */
.dashboard-history__preview-caption {
  margin-top: 6px;
  font-size: 11px;
  color: var(--bs-text-dim, #9ca3af);
  text-align: center;
}
.dashboard-history__diff-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dashboard-history__diff-actor {
  font-size: 12px;
  font-weight: 600;
  color: var(--bs-text, #1a1d21);
  margin-bottom: 4px;
}
.dashboard-history__diff-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.dashboard-history__diff-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
}
.dashboard-history__diff-kind {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-history__diff-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-history__diff-detail {
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-history__restore {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dashboard-history__confirm {
  font-size: 13px;
}
@media (max-width: 640px) {
  .dashboard-history__body {
    grid-template-columns: 1fr;
  }
}

/* --- blame line in the cell menu (wave-m2) ------------------------------- */
.dashboard-widget__blame {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--bs-border, #e5e7eb);
  font-size: 12px;
  color: var(--bs-text-muted, #6b7280);
}
.dashboard-widget__blame-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--bs-accent, #6366f1);
  text-decoration: none;
}
.dashboard-widget__blame-link:hover {
  text-decoration: underline;
}
.dashboard-widget__blame-link svg {
  width: 12px;
  height: 12px;
}

/* ==========================================================================
 * Default theme polish \u2014 "Graphite".
 * Surfaces/color/type/spacing/radius/shadow only; no layout or structural
 * changes. These refine the existing selectors above into a world-class
 * default. An alternate theme layered after this file overrides them freely.
 * ========================================================================== */

.page-title {
  letter-spacing: -0.01em;
}
.card {
  padding: 14px 16px;
  border-color: var(--bs-border);
  box-shadow: var(--bs-shadow-md);
  background: var(--bs-card);
}
.card-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.005em;
  text-transform: uppercase;
  color: var(--bs-text-muted);
}

/* Widgets read as the same crisp surface as .card. */
.dashboard-widget {
  background: var(--bs-card);
  box-shadow: var(--bs-shadow-md);
}
.dashboard-widget__bar {
  background: var(--bs-card-highlight);
}
.dashboard-widget__title {
  font-weight: 600;
  color: var(--bs-text);
}

/* Tab strip: crisp segmented-control pill. */
.dashboard-tabs {
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--bs-border);
  border-bottom: 1px solid var(--bs-border);
  border-radius: var(--bs-radius-md);
  background: var(--bs-bg-muted);
  width: fit-content;
}
.dashboard-tab {
  height: 28px;
  font-size: 0.86em;
  font-weight: 500;
  border-radius: calc(var(--bs-radius-md) - 3px);
  transition:
    background var(--bs-duration-fast) var(--bs-ease-out),
    color var(--bs-duration-fast) var(--bs-ease-out),
    box-shadow var(--bs-duration-fast) var(--bs-ease-out);
}
.dashboard-tab:hover {
  background: var(--bs-bg-hover);
}
.dashboard-tab--active {
  background: var(--bs-card);
  border-color: var(--bs-border-strong);
  color: var(--bs-text-strong);
  font-weight: 600;
  box-shadow:
    0 1px 1px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.08);
}
.dashboard-tab:focus-visible,
.dashboard-tabs__hidden-item:focus-visible,
.bs-btn:focus-visible,
.dashboard-widget__collapse:focus-visible,
.dashboard-widget__menu-toggle:focus-visible {
  outline: none;
  box-shadow: var(--bs-focus-ring);
}

/* Toolbar buttons. */
.bs-btn {
  font-size: 0.86em;
  font-weight: 500;
  border-color: var(--bs-border);
  background: var(--bs-card);
  transition:
    background var(--bs-duration-fast) var(--bs-ease-out),
    border-color var(--bs-duration-fast) var(--bs-ease-out);
}
.bs-btn:hover {
  border-color: var(--bs-border-strong);
  background: var(--bs-bg-hover);
}
.bs-btn--primary {
  /* Re-assert the accent surface: the \`.bs-btn\` reset above reverts it to --bs-card. */
  background: var(--bs-accent);
  border-color: var(--bs-accent);
  color: var(--bs-accent-foreground);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(108, 91, 250, 0.25);
}
.bs-btn--primary:hover {
  background: color-mix(in srgb, var(--bs-accent) 88%, #000);
  border-color: color-mix(in srgb, var(--bs-accent) 88%, #000);
}

/* Chart: accent-driven line/area/gauge. */
.dashboard-chart__line {
  stroke: var(--bs-accent);
  stroke-width: 1.75;
}
.dashboard-chart__area {
  fill: color-mix(in srgb, var(--bs-accent) 18%, transparent);
}
.dashboard-chart__gauge-fill {
  stroke: var(--bs-accent);
}
.dashboard-chart__gauge-track {
  stroke: var(--bs-bg-muted);
}

/* Badges / status dots. */
.dashboard-badge {
  font-size: 0.78em;
  font-weight: 700;
  letter-spacing: 0.01em;
  padding: 2px 7px;
}
.dashboard-badge--error {
  background: var(--bs-danger-subtle);
}
.dashboard-dot--live {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--bs-success) 25%, transparent);
}

/* ==========================================================================
 * Mixed-direction text (RTL pages).
 * With partial translations an RTL page still contains many English runs;
 * per-element \`unicode-bidi: plaintext\` lets each text run pick its own base
 * direction (first strong character), keeping English punctuation on the
 * correct side (fixes ".Your dashboard\u2026" artifacts) while Arabic/Farsi text
 * stays right-to-left. Scoped to text-bearing leaves; layout is untouched.
 * ========================================================================== */
[dir="rtl"]
  .dashboard
  :where(h1, h2, h3, h4, p, div, span, button, td, th, li, code, label, input, textarea),
[dir="rtl"]
  .bs-modal
  :where(h1, h2, h3, h4, p, div, span, button, td, th, li, code, label, input, textarea) {
  unicode-bidi: plaintext;
}
[dir="rtl"] .dashboard :where(input, textarea)::placeholder {
  unicode-bidi: plaintext;
}

/* chart-detail \u2014 sparkline delta coloring + opt-in detail mode (axes/grid/tips).
   Kept in one trailing block to minimize merge collisions with the base chart CSS
   above; all default charts are unaffected (rules key off --sparkline / --detail). */
.dashboard-chart--sparkline,
.dashboard-chart--detail {
  position: relative;
}
/* Sparkline: delta-colored line + trailing value badge. */
/* Only the dot is filled \u2014 a CSS fill would outrank the line's \`fill="none"\`. */
.dashboard-chart__spark--up .dashboard-chart__line,
.dashboard-chart__spark--up .dashboard-chart__spark-dot {
  stroke: var(--bs-success, #27853c);
}
.dashboard-chart__spark--up .dashboard-chart__spark-dot {
  fill: var(--bs-success, #27853c);
}
.dashboard-chart__spark--down .dashboard-chart__line,
.dashboard-chart__spark--down .dashboard-chart__spark-dot {
  stroke: var(--bs-danger, #d92c25);
}
.dashboard-chart__spark--down .dashboard-chart__spark-dot {
  fill: var(--bs-danger, #d92c25);
}
.dashboard-chart__spark--flat .dashboard-chart__spark-dot {
  fill: var(--bs-text-muted, #6b6b77);
}
/* The value label is the chart's trailing flex item \u2014 its own column beside the
   line, not an overlay \u2014 so it never covers the last point or overflows the right
   edge (#81). The SVG gives up the width; the label aligns to the end point's band. */
.dashboard-chart--sparkline .dashboard-chart__svg {
  min-width: 0;
}
.dashboard-chart__spark-value {
  flex: none;
  align-self: flex-start;
  margin-inline-start: 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: var(--bs-text-muted, #6b6b77);
  pointer-events: none;
}
.dashboard-chart__spark-value--up {
  color: var(--bs-success, #27853c);
}
.dashboard-chart__spark-value--down {
  color: var(--bs-danger, #d92c25);
}
.dashboard-chart__spark-value--middle {
  align-self: center;
}
.dashboard-chart__spark-value--bottom {
  align-self: flex-end;
}
/* Detail mode: faint gridlines, corner axis labels, invisible hover-tip targets. */
.dashboard-chart__grid line {
  stroke: var(--bs-border, #e7e7ee);
  stroke-width: 0.5;
  vector-effect: non-scaling-stroke;
}
.dashboard-chart__tip {
  fill: transparent;
  stroke: none;
}
.dashboard-chart__axis {
  position: absolute;
  inset-inline-start: 3px;
  font-size: 10px;
  line-height: 1;
  color: var(--bs-text-muted, #6b6b77);
  pointer-events: none;
}
.dashboard-chart__axis--max {
  top: 1px;
}
.dashboard-chart__axis--min {
  bottom: 1px;
}

/* ===========================================================================
 * Template gallery \u2014 Templates tab (#60). Appended block: the widget/recipe tab
 * toggle and the recipe "what it needs" grant list. Reuses the existing
 * .dashboard-gallery__* tokens above; only the new recipe surfaces are styled here.
 * ======================================================================== */
.dashboard-gallery__tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--bs-border, #e5e7eb);
}
.dashboard-gallery__tab {
  appearance: none;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  padding: 6px 12px;
  font: inherit;
  color: var(--bs-text-muted, #6b7280);
  cursor: pointer;
}
.dashboard-gallery__tab:hover {
  color: var(--bs-text, inherit);
}
.dashboard-gallery__tab.is-active {
  color: var(--bs-text, inherit);
  border-bottom-color: var(--bs-accent, #2563eb);
  font-weight: 600;
}
.dashboard-gallery__recipe-needs {
  color: var(--bs-text-muted, #6b7280);
  font-size: 0.8em;
  margin-top: 2px;
}
.dashboard-gallery__recipe-grants {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dashboard-gallery__recipe-connector {
  border: 1px solid var(--bs-border, #e5e7eb);
  border-radius: 8px;
  padding: 8px 10px;
}
.dashboard-gallery__recipe-connector-name {
  font-weight: 600;
}
.dashboard-gallery__recipe-connector-reason {
  color: var(--bs-text-muted, #6b7280);
  font-size: 0.85em;
  margin-top: 2px;
}
.dashboard-gallery__recipe-tools {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dashboard-gallery__recipe-tool {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  font-size: 0.85em;
}
.dashboard-gallery__recipe-tool code {
  font-family: var(--bs-font-mono, ui-monospace, monospace);
  font-size: 0.9em;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--bs-bg-hover, rgba(0, 0, 0, 0.05));
}
.dashboard-gallery__recipe-readonly {
  padding: 0 6px;
  border-radius: 999px;
  border: 1px solid var(--bs-border, #e5e7eb);
  color: var(--bs-text-muted, #6b7280);
  font-size: 0.85em;
}
.dashboard-gallery__recipe-nogrants {
  color: var(--bs-text-muted, #6b7280);
  font-size: 0.9em;
}
`;var ds=`/* Hermes DESKTOP skin \u2014 the board in the desktop app's macOS design language.
 *
 * A DIFFERENT language from the web skin (skin-web.css): where the web skin does a
 * near-transparent slab, an expanded display face with wide tracking, and sharp
 * (0-radius) buttons, the desktop app is macOS-native \u2014 soft chrome bars with a hairline
 * rule, the SF system font at normal tracking, and rounded controls. \`applyDesktopTheme\`
 * handles the token-expressible parts (card radius, single-shadow elevation, host font);
 * this sheet handles the class-level bits the tokens can't reach.
 *
 * Every rule is scoped under \`boardstate-view\` (touches only the embedded board, never
 * the host chrome) and every var() carries a fallback, so a non-desktop host degrades
 * cleanly to the bundle's own look. */

/* Title bar: soft chrome fill with a single bottom hairline \u2014 the mac "toolbar" feel,
   not the bundle's filled, contrasting drag handle. */
boardstate-view .dashboard-widget__bar {
  background: var(--ui-bg-chrome, transparent);
  border-bottom: 1px solid var(--ui-stroke-secondary, rgba(0, 0, 0, 0.08));
}

/* Widget titles use the host system font (SF on macOS) at a normal weight and NO wide
   tracking \u2014 macOS does not do letterspaced small caps. */
boardstate-view .dashboard-widget__title {
  font-family: inherit;
  font-weight: 600;
  font-size: 0.8125rem;
  letter-spacing: normal;
}

/* Rounded mac controls \u2014 the OPPOSITE of the web skin's sharp buttons. */
boardstate-view .bs-btn {
  border-radius: 0.375rem;
}
`;var ls={"--bs-bg":["--ui-surface-background","--ui-bg-editor"],"--bs-bg-hover":["--ui-row-hover-background","--ui-control-hover-background"],"--bs-bg-muted":["--ui-bg-chrome","--ui-bg-tertiary"],"--bs-surface-muted":["--ui-bg-chrome","--ui-bg-tertiary"],"--bs-card":["--ui-bg-elevated","--ui-surface-background"],"--bs-card-highlight":["--ui-row-active-background","--ui-bg-elevated"],"--bs-border":["--ui-stroke-secondary"],"--bs-border-strong":["--ui-stroke-primary"],"--bs-input":["--ui-bg-card","--ui-control-active-background"],"--bs-text":["--ui-text-primary"],"--bs-text-strong":["--ui-text-primary"],"--bs-text-muted":["--ui-text-tertiary"],"--bs-text-dim":["--ui-text-quaternary","--ui-text-tertiary"],"--bs-muted":["--ui-text-tertiary"],"--bs-accent":["--ui-accent"],"--bs-accent-foreground":["--ui-bg-elevated","--ui-surface-background"],"--bs-ring":["--ui-accent"],"--bs-danger":["--ui-red"],"--bs-success":["--ui-green"],"--bs-warning":["--ui-yellow"]};function cs(e){let t=`var(${e[e.length-1]})`;for(let r=e.length-2;r>=0;r--)t=`var(${e[r]}, ${t})`;return t}function gu(e){let t=e.match(/[\d.]+/g);if(!t||t.length<3)return 0;let r=/^\s*color\(/i.test(e)?1:255,[a,s,o]=t.slice(0,3).map(n=>{let i=Number(n)/r;return i<=.03928?i/12.92:Math.pow((i+.055)/1.055,2.4)});return .2126*a+.7152*s+.0722*o}function us(e){return gu(e)<.4?"dark":"light"}function dt(e,t,r){return{schemaVersion:1,workspaceVersion:1,widgetsRegistry:{},prefs:{tabOrder:[e]},tabs:[{slug:e,title:t,icon:"layoutDashboard",hidden:!1,createdBy:"system",widgets:r}]}}var Le=(e,t,r,a,s,o,n)=>({id:e,kind:"builtin:markdown",title:t,grid:{x:r,y:a,w:s,h:o},collapsed:!1,hidden:!1,props:{markdown:n}}),W=(e,t,r,a,s,o,n,i={})=>({id:e,kind:t,title:r,grid:{x:a,y:s,w:o,h:n},collapsed:!1,hidden:!1,props:i}),fu=(e,t,r,a,s,o,n,i,l,c=null)=>({id:e,kind:"builtin:action-button",title:t,grid:{x:r,y:a,w:s,h:o},collapsed:!1,hidden:!1,props:{connector:n,tool:i,label:l,args:c}}),bs=[{id:"agent-hq",name:"Agent HQ",summary:"Live operations overview \u2014 usage, sessions, connected instances, and schedules.",doc:dt("board","Agent HQ",[Le("header","Overview",0,0,12,2,`# Agent HQ
Live operations for this Hermes agent.`),W("usage","builtin:usage","Usage",0,2,4,3),W("instances","builtin:instances","Instances",4,2,4,3),W("sessions","builtin:sessions","Sessions",8,2,4,5),W("cron","builtin:cron","Scheduled jobs",0,5,8,3)])},{id:"usage-cost",name:"Usage & Cost",summary:"Spend and token usage at a glance, with the underlying breakdown.",doc:dt("board","Usage & Cost",[Le("header","Overview",0,0,12,2,`# Usage & Cost
Today's spend and token consumption.`),W("cost","builtin:stat-card","Cost",0,2,3,2,{metric:"todayCost",format:"usd",label:"Cost (today)"}),W("tokens","builtin:stat-card","Tokens",3,2,3,2,{metric:"todayTokens",format:"int",label:"Tokens (today)"}),W("usage","builtin:usage","Usage detail",6,2,6,3),W("cron","builtin:cron","Scheduled jobs",0,5,12,3)].map(e=>e.id==="cost"||e.id==="tokens"?{...e,bindings:{value:{source:"rpc",method:"usage.status"}}}:e))},{id:"sessions-monitor",name:"Sessions Monitor",summary:"Watch active sessions and connected instances in real time.",doc:dt("board","Sessions Monitor",[Le("header","Overview",0,0,12,2,`# Sessions Monitor
Active sessions and connected instances.`),W("sessions","builtin:sessions","Sessions",0,2,7,5),W("instances","builtin:instances","Instances",7,2,5,3),W("usage","builtin:usage","Usage",7,5,5,2)])},{id:"office-ops",name:"Office Ops",summary:"Operate OfficeCLI \u2014 generate documents and workbooks through approved tools, artifacts on the board.",doc:dt("board","Office Ops",[Le("header","Overview",0,0,12,2,"# Office Ops\nDrive **OfficeCLI** (`officecli mcp`) through operator-approved tools. Author the `officecli` connector in `boardstate.connectors.json`, approve its tools in the approvals panel, then act below."),fu("generate-report","Quarterly report",0,2,4,3,"officecli","officecli","Generate quarterly report .docx",{command:"create quarterly-report.docx"}),W("approvals","builtin:approvals","Approvals",4,2,8,3),Le("setup","Setup",0,5,12,2,"### Setup\n1. Install OfficeCLI (`brew install officecli` or a GitHub release) so `officecli` is on PATH.\n2. Author `boardstate.connectors.json` in the state dir with the `officecli` stdio connector.\n3. Approve the tools you want in the approvals panel \u2014 nothing runs until you do.")])}];var mu=new Set(["dashboard.widget.approve","dashboard.capability.approve","dashboard.action.confirm","dashboard.action.deny"]);function hs(e,t){return{request(a,s,o){return mu.has(a)?t(a,s??{}):e.request(a,s,o)},addEventListener(a,s){return e.addEventListener(a,s)},close(){e.close()},get ready(){return e.ready},get closed(){return e.closed}}}import{jsx as ve,jsxs as Vt}from"react/jsx-runtime";function $u(){customElements.get("boardstate-view")||customElements.define("boardstate-view",jt),customElements.get("boardstate-header")||customElements.define("boardstate-header",qt)}function ku(){if(document.querySelector("style[data-boardstate]"))return null;let t=document.createElement("style");return t.setAttribute("data-boardstate",""),t.textContent=`${is}
${ds}`,document.head.appendChild(t),t}function gs(e){let t=getComputedStyle(document.body).backgroundColor||"rgb(0,0,0)";e.setAttribute("data-theme",us(t));for(let[r,a]of Object.entries(ls))e.style.setProperty(r,cs(a));e.style.setProperty("--bs-radius-lg","var(--radius-xl, 10px)"),e.style.setProperty("--bs-radius-md","0.375rem"),e.style.setProperty("--bs-radius-sm","0.25rem"),e.style.setProperty("--bs-shadow-md","0 1px 3px rgba(0,0,0,0.10)"),e.style.setProperty("--bs-font-sans",getComputedStyle(document.body).fontFamily)}function Au(e,t,r,a){let s=new Map,o=!1,n=!1,i=r(()=>{!o&&!n&&a("degraded","Board requests work, but live updates are unavailable on this connection.")},2500),l=t("/ws",c=>{if(typeof c!="object"||c===null)return;let b=c;if(b.event==="boardstate.desktop.connected"){n=!0,i(),a("live");for(let h of s.get("boardstate.changed")??[])h({});return}if(typeof b.event=="string")for(let h of s.get(b.event)??[])h(b.payload)});return{ready:Promise.resolve(),get closed(){return o},async request(c,b){if(o)throw new Error("Boardstate transport is closed");let h=await e("/rpc",{method:"POST",body:{method:c,params:b??{}}});if(h&&h.error)throw new Error(String(h.error));return h?.result},addEventListener(c,b){let h=s.get(c)??new Set;return h.add(b),s.set(c,h),()=>{h.delete(b),h.size||s.delete(c)}},close(){o||(o=!0,i(),l(),s.clear())}}}function Eu({rest:e,socket:t,setTimer:r}){let a=ps(null),s=ps(void 0),[o,n]=Ft("connecting"),[i,l]=Ft(""),[c,b]=Ft(""),h=_u(async(v,w)=>{let f=s.current;if(f&&window.confirm(`Replace the current board with the "${v}" template?`)){b(v);try{await f.request("dashboard.workspace.replace",{doc:w,actor:"user"})}catch(x){yu.notify?.({kind:"error",message:`Template failed: ${x instanceof Error?x.message:String(x)}`})}finally{b("")}}},[]);return xu(()=>{let v=!1,w,f,x,R=!1,De=(U,Z="")=>{U==="error"&&(R=!0),U==="live"&&(R=!1),!(R&&U!=="error")&&(v||(n(U),l(Z)))};return(async()=>{let U=async(Z,lt)=>{let g=await e("/operator",{method:"POST",body:{method:Z,params:lt}});if(g?.error)throw new Error(String(g.error));return g?.result};w=hs(Au(e,t,r,De),U),s.current=w,f=document.createElement("boardstate-view"),f.transport=w,f.connected=!0,f.operator=!0;try{let Z=await e("/assets-base",{method:"GET"});f.basePath=Z?.absoluteBase??""}catch{f.basePath=""}v||(gs(f),x=new MutationObserver(()=>f&&gs(f)),x.observe(document.documentElement,{attributes:!0,attributeFilter:["class","style","data-theme"]}),x.observe(document.body,{attributes:!0,attributeFilter:["class","style"]}),f.style.display="block",f.style.height="100%",a.current?.appendChild(f),await w.request("dashboard.workspace.get",{}))})().catch(U=>{De("error",U instanceof Error?U.message:String(U))}),()=>{v=!0,x?.disconnect(),s.current=void 0;try{w?.close()}catch{}f&&f.parentNode&&f.parentNode.removeChild(f)}},[e,r,t]),Vt("div",{style:{display:"flex",flexDirection:"column",height:"100%",gap:8,padding:12},children:[Vt("div",{style:{display:"flex",alignItems:"center",flexWrap:"wrap",gap:8,fontSize:12},children:[ve("span",{style:{width:8,height:8,borderRadius:"50%",background:o==="live"?"var(--ui-green, #6aa84f)":o==="error"?"var(--ui-red, #e06c75)":"var(--ui-yellow, #d0a94f)",display:"inline-block"}}),ve("span",{style:{opacity:.8},children:o==="live"?"Board connected":o==="degraded"?i:o==="error"?`Board unavailable${i?`: ${i}`:""}`:"Connecting to board\u2026"}),o==="live"||o==="degraded"?Vt("span",{style:{display:"flex",alignItems:"center",flexWrap:"wrap",gap:6,marginLeft:8},children:[ve("span",{style:{opacity:.7},children:"Templates:"}),bs.map(v=>ve("button",{type:"button",title:v.summary,disabled:c!=="",onClick:()=>h(v.name,v.doc),style:{cursor:c?"default":"pointer",padding:"3px 10px",borderRadius:6,border:"1px solid var(--ui-stroke-secondary, #2a2a33)",background:c===v.id?"var(--ui-row-active-background, #23232b)":"transparent",color:"inherit",opacity:c&&c!==v.name?.5:1},children:c===v.name?"Applying\u2026":v.name},v.id))]}):null]}),ve("div",{ref:a,style:{flex:1,minHeight:0}})]})}var db={id:"boardstate",name:"Board",register(e){$u();let t=ku();t&&e.onDispose(()=>t.remove());let r=typeof e.setTimeout=="function"?e.setTimeout:(a,s)=>{let o=globalThis.setTimeout(a,s),n=()=>globalThis.clearTimeout(o);return e.onDispose(n),n};e.register({id:"board-route",area:vu,data:{path:"/board"},render:()=>ve(Eu,{rest:e.rest,socket:e.socket,setTimer:r})}),e.register({id:"board-nav",area:wu,data:{path:"/board",label:"Board",codicon:"dashboard"}})}};export{db as default};
/*! Bundled license information:

@boardstate/lit/dist/browser.js:
  (**
  * @license
  * Copyright 2019 Google LLC
  * SPDX-License-Identifier: BSD-3-Clause
  *)
  (**
  * @license
  * Copyright 2017 Google LLC
  * SPDX-License-Identifier: BSD-3-Clause
  *)
  (**
  * @license
  * Copyright 2020 Google LLC
  * SPDX-License-Identifier: BSD-3-Clause
  *)
*/
