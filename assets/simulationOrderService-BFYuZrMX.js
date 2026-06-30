import{n as e}from"./supabase-DS6Nu-CQ.js";import{r as t}from"./index-DOxsrNmh.js";import{l as n}from"./dataFormatters-Np9Hm8VE.js";function r(e){return Math.round(e*100)/100}async function i(t){let r=t.clientName.trim(),i=n(t.clientCnpjCpf??``);if(!r||!i)return{ok:!1,error:`Informe nome e CPF/CNPJ do cliente.`};let a=t.clientId??null;if(!a){let{data:n,error:o}=await e.from(`clients`).insert({nome:r,cnpj_cpf:i,uf:t.estado??null}).select(`id`).single();if(o||!n)return{ok:!1,error:o?.message??`Não foi possível salvar o cliente.`};a=n.id}return{ok:!0,clientId:a}}function a(e,t){return{total_bruto:r(e.totalValor),total_proposta:r(e.totalProposta),status:t,tipo_frete:e.tipoFrete??null,origem_frete:e.origemFrete?.trim()||null,destino_frete:e.destinoFrete?.trim()||null,data_pagamento:e.dataPagamento||null,quarter:e.quarter??null}}async function o(t,n,i){let a=n.map(e=>({simulation_id:t,product_id:e.productId,volume:e.volume,preco_unitario:r(e.precoUnitario),proposta:r(e.proposta),status_linha:i})),{error:o}=await e.from(`simulation_items`).insert(a);return o?{ok:!1,error:o.message}:{ok:!0}}function s(e){if(!e||typeof e!=`object`)return null;let t=e,n=t.clients,r=Array.isArray(n)?n[0]:n,i=t.simulation_items;if(!r||typeof r!=`object`||!Array.isArray(i))return null;let a=r,o=i.map(e=>{let t=e,n=t.products,r=Array.isArray(n)?n[0]:n,i=r&&typeof r==`object`?r:null;return{id:String(t.id),product_id:String(t.product_id??``),volume:Number(t.volume),preco_unitario:Number(t.preco_unitario),proposta:Number(t.proposta),product:i?{nome:String(i.nome??``),cultura:String(i.cultura??``)}:null}});return{simulation:{id:String(t.id),user_id:String(t.user_id),client_id:String(t.client_id),total_bruto:Number(t.total_bruto),total_proposta:Number(t.total_proposta),status:t.status,tipo_frete:t.tipo_frete==null?null:String(t.tipo_frete),origem_frete:t.origem_frete==null?null:String(t.origem_frete),destino_frete:t.destino_frete==null?null:String(t.destino_frete),data_pagamento:t.data_pagamento==null?null:String(t.data_pagamento),quarter:t.quarter==null?null:String(t.quarter),created_at:String(t.created_at),updated_at:String(t.updated_at)},client:a,items:o}}async function c(t){let{data:n,error:r}=await e.from(`simulations`).select(`
      id,
      user_id,
      client_id,
      total_bruto,
      total_proposta,
      status,
      tipo_frete,
      origem_frete,
      destino_frete,
      data_pagamento,
      quarter,
      created_at,
      updated_at,
      clients (
        id,
        nome,
        razao_social,
        cnpj_cpf,
        email,
        telefone,
        endereco,
        cep,
        logradouro,
        bairro,
        municipio,
        uf
      ),
      simulation_items (
        id,
        product_id,
        volume,
        preco_unitario,
        proposta,
        products ( nome, cultura )
      )
    `).eq(`id`,t).maybeSingle();if(r)return{ok:!1,error:r.message};if(!n)return{ok:!1,error:`Simulação não encontrada.`};let i=s(n);return i?{ok:!0,data:i}:{ok:!1,error:`Dados da simulação incompletos.`}}async function l(t,n){let r=e.from(`clients`).select(`id, nome, cnpj_cpf, uf, municipio, email, telefone`).order(`nome`,{ascending:!0}).limit(8),i=(t??``).trim();i&&(r=r.ilike(`nome`,`%${i}%`));let{data:a,error:o}=n?await r.abortSignal(n):await r;return o?{ok:!1,error:o.message}:{ok:!0,rows:a??[]}}async function u(t){let{data:{session:n},error:r}=await e.auth.getSession();if(r||!n?.user)return{ok:!1,error:`Sessão expirada. Faça login novamente.`};if(t.lines.length===0)return{ok:!1,error:`Inclua ao menos um produto na simulação.`};let s=await i(t);if(!s.ok)return s;let{data:c,error:l}=await e.from(`simulations`).insert({user_id:n.user.id,client_id:s.clientId,...a(t,`approved`)}).select(`id`).single();if(l||!c)return{ok:!1,error:l?.message??`Não foi possível salvar a simulação.`};let u=await o(c.id,t.lines,`approved`);return u.ok?{ok:!0,simulationId:c.id}:u}async function d(t){let{data:{session:n},error:r}=await e.auth.getSession();if(r||!n?.user)return{ok:!1,error:`Sessão expirada. Faça login novamente.`};if(t.lines.length===0)return{ok:!1,error:`Inclua ao menos um produto na simulação.`};let s=await i(t);if(!s.ok)return s;let c={client_id:s.clientId,...a(t,`pending`)},l=t.simulationId??null;if(l){let{error:t}=await e.from(`simulations`).update(c).eq(`id`,l).eq(`user_id`,n.user.id);if(t)return{ok:!1,error:t.message};let{error:r}=await e.from(`simulation_items`).delete().eq(`simulation_id`,l);if(r)return{ok:!1,error:r.message}}else{let{data:t,error:r}=await e.from(`simulations`).insert({user_id:n.user.id,...c}).select(`id`).single();if(r||!t)return{ok:!1,error:r?.message??`Não foi possível salvar a simulação.`};l=t.id}let u=await o(l,t.lines,`pending`);return u.ok?{ok:!0,simulationId:l}:u}async function f(n,r,i={}){let{error:a}=await e.from(`simulations`).update({status:r}).eq(`id`,n);if(a)return{ok:!1,error:a.message};if(i.notifyConsultor&&(r===`approved`||r===`rejected`)){let e=r===`approved`?`simulation_approved`:`simulation_rejected`,a=i.clientName?.trim()||`Cliente`,o=await t({simulationId:n,type:e,title:r===`approved`?`Simulação aprovada — ${a}`:`Simulação reprovada — ${a}`,body:i.body??null});if(!o.ok)return o}return{ok:!0}}async function p(t){let n=Math.max(1,t.page??1),r=Math.min(100,Math.max(10,t.pageSize??50)),i=(n-1)*r,a=i+r-1,o=(t.search??``).trim(),s=e.from(`simulations`).select(`
      id,
      created_at,
      total_proposta,
      status,
      user_id,
      clients ( nome )
    `,{count:`exact`}).order(`created_at`,{ascending:!1}).range(i,a);if(t.role===`consultor`&&(s=s.eq(`user_id`,t.userId)),t.statusFilter&&(s=s.eq(`status`,t.statusFilter)),o){let n=`%${o.replace(/[%_,]/g,` `).trim()}%`;if(t.role===`gestor`){let{data:t}=await e.from(`profiles`).select(`id`).ilike(`nome`,n),r=(t??[]).map(e=>e.id);s=r.length>0?s.or(`clients.nome.ilike.${n},user_id.in.(${r.join(`,`)})`):s.ilike(`clients.nome`,n)}else s=s.ilike(`clients.nome`,n)}let{data:c,error:l,count:u}=await s;if(l)return{ok:!1,error:l.message};let d=(c??[]).map(e=>{let t=e.clients,n=Array.isArray(t)?t[0]:t,r=n&&typeof n==`object`&&`nome`in n?String(n.nome??``):``;return{id:String(e.id),created_at:String(e.created_at),client_nome:r,total_proposta:Number(e.total_proposta),status:e.status,user_id:String(e.user_id)}}),f={};if(t.role===`gestor`&&d.length>0){let t=[...new Set(d.map(e=>e.user_id))],{data:n,error:r}=await e.from(`profiles`).select(`id, nome`).in(`id`,t);if(r)return{ok:!1,error:r.message};f=Object.fromEntries((n??[]).map(e=>[String(e.id),String(e.nome)]))}return{ok:!0,rows:d,consultorNomeById:f,total:u??0}}async function m(t){let{error:n}=await e.from(`clients`).update({cep:t.cep,logradouro:t.logradouro,bairro:t.bairro,municipio:t.municipio,uf:t.uf}).eq(`id`,t.clientId);return n?{ok:!1,error:n.message}:{ok:!0}}export{l as a,r as c,d as i,p as n,m as o,u as r,f as s,c as t};