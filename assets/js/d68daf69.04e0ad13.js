"use strict";(self.webpackChunkdoc_for_c_2_c_widget=self.webpackChunkdoc_for_c_2_c_widget||[]).push([[2643],{336:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>d,default:()=>w,frontMatter:()=>s,metadata:()=>c,toc:()=>r});var i=n(4848),o=n(8453);const s={},d="Using the C2C Widget with Webflow",c={id:"usage/with_webflow",title:"Using the C2C Widget with Webflow",description:"Put something like the following at the end of body section in webflow:",source:"@site/docs/usage/with_webflow.mdx",sourceDirName:"usage",slug:"/usage/with_webflow",permalink:"/temp-c2c-widget/usage/with_webflow",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"docSidebar",previous:{title:"Using the C2C Widget with React",permalink:"/temp-c2c-widget/usage/with_react"}},l={},r=[];function a(e){const t={code:"code",h1:"h1",p:"p",pre:"pre",...(0,o.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.h1,{id:"using-the-c2c-widget-with-webflow",children:"Using the C2C Widget with Webflow"}),"\n",(0,i.jsx)(t.p,{children:"Put something like the following at the end of body section in webflow:"}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-html",children:'\x3c!-- START for call [nirav]--\x3e\n   <style>\n   /* This class will be removed from button when the widget loads.\n   */\n   .demo-button-disabled {\n     opacity: 0.7;\n     pointer-events: none;\n   }\n   </style>\n\n\t \x3c!-- add widgets --\x3e\n   <c2c-widget\n      buttonId="demo-1"\n      callDetails=\'{"destination":"/private/demo-1","supportsVideo":true,"supportsAudio":true}\'\n      token="<token>"\n   ></c2c-widget>\n   <c2c-widget\n      buttonId="demo-1-duplicate"\n      callDetails=\'{"destination":"/private/demo-1","supportsVideo":true,"supportsAudio":true}\'\n      token="<token>"\n   ></c2c-widget>\n   <c2c-widget\n      buttonId="demo-3"\n      callDetails=\'{"destination":"/private/demo-3","supportsVideo":false,"supportsAudio":true}\'\n      token="<token>"\n   ></c2c-widget>\n\n   <script src="https://assets.swrooms.com/c2c-widget.js"><\/script>\n\x3c!-- END for call [nirav]--\x3e\n'})}),"\n",(0,i.jsxs)(t.p,{children:["In webflow, set the triggering button's id to match ",(0,i.jsx)(t.code,{children:"buttonId"}),"."]}),"\n",(0,i.jsxs)(t.p,{children:["Set the button to also have the class ",(0,i.jsx)(t.code,{children:"demo-button-disabled"}),".\nThe widget, on load, will remove this class. And make it clickable again."]})]})}function w(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(a,{...e})}):a(e)}}}]);