// ============================================================
// ALTO Analytics Dashboard — overlay modal
// ============================================================

async function openDashboard(){
  const wUrl=WORKER_URL;

  // Prompt for stats token if not saved
  let token=localStorage.getItem('alto_stats_token')||'';
  if(!token){
    token=prompt('Ingresa tu Stats Token (primeros 20 caracteres de tu ANTHROPIC_API_KEY o tu STATS_TOKEN):');
    if(!token)return;
    localStorage.setItem('alto_stats_token',token.trim());
  }

  // Create modal overlay
  const overlay=document.createElement('div');
  overlay.id='dashboardOverlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(4,22,39,0.7);display:flex;align-items:center;justify-content:center;animation:fadeIn .3s ease;';
  overlay.innerHTML=`
    <div style="background:#F8F9FB;width:90%;max-width:900px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.3);position:relative;">
      <div style="background:#041627;padding:20px 28px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-family:Manrope,sans-serif;font-weight:800;color:#fff;font-size:16px;letter-spacing:0.05em;">Analytics Dashboard</div>
          <div style="font-family:Inter,sans-serif;font-size:10px;color:#BB0014;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">ALTO · Strategic Insights</div>
        </div>
        <button onclick="closeDashboard()" style="color:#fff;background:none;border:none;cursor:pointer;font-size:20px;padding:4px;">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div id="dashContent" style="padding:24px 28px;">
        <div style="text-align:center;padding:40px;color:#74777D;font-family:Inter,sans-serif;font-size:13px;">
          <div class="spinner" style="margin:0 auto 12px;"></div>
          Cargando datos...
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click',(e)=>{if(e.target===overlay)closeDashboard();});

  // Fetch stats
  try{
    const res=await fetch(`${wUrl}/stats?days=7`,{
      headers:{'Authorization':`Bearer ${token}`}
    });
    if(res.status===401){
      localStorage.removeItem('alto_stats_token');
      document.getElementById('dashContent').innerHTML=`
        <div style="text-align:center;padding:40px;color:#BB0014;font-family:Inter,sans-serif;">
          <span class="material-symbols-outlined" style="font-size:36px;display:block;margin-bottom:8px;">lock</span>
          Token no autorizado. Cierra e intenta de nuevo.
        </div>`;
      return;
    }
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    renderDashboard(data);
  }catch(err){
    document.getElementById('dashContent').innerHTML=`
      <div style="text-align:center;padding:40px;color:#BB0014;font-family:Inter,sans-serif;">
        Error: ${err.message}
      </div>`;
  }
}

function closeDashboard(){
  const el=document.getElementById('dashboardOverlay');
  if(el)el.remove();
}

function renderDashboard(data){
  const {days, totals}=data;
  const dc=document.getElementById('dashContent');
  const A={NAVY:'#041627',RED:'#BB0014',BLUE:'#4279B0',LGRAY:'#F2F4F6',BODY:'#44474C',SGRAY:'#74777D'};

  // Calculate totals
  const totalReqs=Object.values(totals.requests||{}).reduce((a,b)=>a+b,0);
  const totalWA=Object.values(totals.whatsapp||{}).reduce((a,b)=>a+b,0);
  const totalExports=Object.values(totals.exports||{}).reduce((a,b)=>a+b,0);
  const totalErrors=totals.errors||0;

  let h='';

  // ── KPI Cards ────────────────────────────────────────────
  h+=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">`;
  const kpis=[
    {value:totalReqs, label:'Requests', icon:'query_stats', color:A.NAVY},
    {value:totalWA, label:'WhatsApp', icon:'chat', color:A.BLUE},
    {value:totalExports, label:'Exports', icon:'download', color:A.NAVY},
    {value:totalErrors, label:'Errors', icon:'error', color:A.RED},
  ];
  kpis.forEach(k=>{
    h+=`<div style="background:#fff;border-top:3px solid ${k.color};padding:16px 18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span class="material-symbols-outlined" style="font-size:18px;color:${k.color}">${k.icon}</span>
        <span style="font-family:Inter,sans-serif;font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:${A.SGRAY};font-weight:600;">${k.label}</span>
      </div>
      <div style="font-family:Manrope,sans-serif;font-size:28px;font-weight:800;color:${k.color};">${k.value}</div>
      <div style="font-family:Inter,sans-serif;font-size:10px;color:${A.SGRAY};margin-top:2px;">Last 7 days</div>
    </div>`;
  });
  h+=`</div>`;

  // ── Bar chart: requests by day ───────────────────────────
  h+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">`;

  // Left: daily requests
  h+=`<div style="background:#fff;padding:18px 20px;">`;
  h+=`<div style="font-family:Inter,sans-serif;font-size:9px;text-transform:uppercase;letter-spacing:2px;color:${A.RED};font-weight:800;margin-bottom:14px;">Requests by Day</div>`;
  h+=`<canvas id="dashChart" width="380" height="180"></canvas>`;
  h+=`</div>`;

  // Right: breakdown tables
  h+=`<div style="background:#fff;padding:18px 20px;">`;
  h+=`<div style="font-family:Inter,sans-serif;font-size:9px;text-transform:uppercase;letter-spacing:2px;color:${A.RED};font-weight:800;margin-bottom:14px;">Breakdown</div>`;

  // Request types
  h+=`<div style="font-family:Inter,sans-serif;font-size:9px;color:${A.SGRAY};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-weight:700;">By Type</div>`;
  const reqTypes=totals.requests||{};
  Object.entries(reqTypes).forEach(([k,v])=>{
    if(!v)return;
    const pct=totalReqs?Math.round(v/totalReqs*100):0;
    h+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
      <div style="font-family:Inter,sans-serif;font-size:11px;color:${A.BODY};width:90px;">${k}</div>
      <div style="flex:1;height:6px;background:${A.LGRAY};"><div style="height:100%;width:${pct}%;background:${A.NAVY};"></div></div>
      <div style="font-family:Manrope,sans-serif;font-size:11px;font-weight:700;color:${A.NAVY};width:30px;text-align:right;">${v}</div>
    </div>`;
  });

  // Export types
  h+=`<div style="font-family:Inter,sans-serif;font-size:9px;color:${A.SGRAY};text-transform:uppercase;letter-spacing:1px;margin:14px 0 6px;font-weight:700;">Exports</div>`;
  const expTypes=totals.exports||{};
  Object.entries(expTypes).forEach(([k,v])=>{
    if(!v)return;
    const pct=totalExports?Math.round(v/totalExports*100):0;
    h+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
      <div style="font-family:Inter,sans-serif;font-size:11px;color:${A.BODY};width:90px;">${k.toUpperCase()}</div>
      <div style="flex:1;height:6px;background:${A.LGRAY};"><div style="height:100%;width:${pct}%;background:${A.BLUE};"></div></div>
      <div style="font-family:Manrope,sans-serif;font-size:11px;font-weight:700;color:${A.BLUE};width:30px;text-align:right;">${v}</div>
    </div>`;
  });

  // WhatsApp breakdown
  h+=`<div style="font-family:Inter,sans-serif;font-size:9px;color:${A.SGRAY};text-transform:uppercase;letter-spacing:1px;margin:14px 0 6px;font-weight:700;">WhatsApp</div>`;
  const waTypes=totals.whatsapp||{};
  Object.entries(waTypes).forEach(([k,v])=>{
    if(!v)return;
    const pct=totalWA?Math.round(v/totalWA*100):0;
    h+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
      <div style="font-family:Inter,sans-serif;font-size:11px;color:${A.BODY};width:90px;">${k}</div>
      <div style="flex:1;height:6px;background:${A.LGRAY};"><div style="height:100%;width:${pct}%;background:${A.RED};"></div></div>
      <div style="font-family:Manrope,sans-serif;font-size:11px;font-weight:700;color:${A.RED};width:30px;text-align:right;">${v}</div>
    </div>`;
  });

  h+=`</div>`;
  h+=`</div>`;

  // ── Footer ───────────────────────────────────────────────
  h+=`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #E0E3E5;">
    <span style="font-family:Inter,sans-serif;font-size:10px;color:${A.SGRAY};">Data from last 7 days (KV TTL: 7d)</span>
    <button onclick="localStorage.removeItem('alto_stats_token');closeDashboard();" style="font-family:Inter,sans-serif;font-size:9px;color:${A.SGRAY};background:none;border:none;cursor:pointer;text-decoration:underline;">Reset token</button>
  </div>`;

  dc.innerHTML=h;

  // Draw bar chart
  drawDailyChart(days);
}

function drawDailyChart(days){
  const canvas=document.getElementById('dashChart');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  const pad={top:10,right:10,bottom:30,left:40};
  const chartW=W-pad.left-pad.right;
  const chartH=H-pad.top-pad.bottom;

  // Sort days chronologically
  const sorted=[...days].sort((a,b)=>a.date.localeCompare(b.date));

  // Calculate daily totals
  const dailyData=sorted.map(d=>{
    const total=Object.values(d.requests||{}).reduce((a,b)=>a+b,0);
    return {date:d.date, total};
  });

  const maxVal=Math.max(...dailyData.map(d=>d.total),1);
  const barWidth=Math.min(36, chartW/(dailyData.length||1)-8);

  ctx.clearRect(0,0,W,H);

  // Y axis
  ctx.strokeStyle='#E0E3E5';
  ctx.lineWidth=0.5;
  for(let i=0;i<=4;i++){
    const y=pad.top+chartH-(chartH*i/4);
    ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(W-pad.right,y);ctx.stroke();
    ctx.fillStyle='#74777D';
    ctx.font='9px Inter,sans-serif';
    ctx.textAlign='right';
    ctx.fillText(Math.round(maxVal*i/4),pad.left-6,y+3);
  }

  // Bars
  dailyData.forEach((d,i)=>{
    const x=pad.left+(chartW/(dailyData.length))*(i+0.5)-barWidth/2;
    const barH=(d.total/maxVal)*chartH;
    const y=pad.top+chartH-barH;

    // Gradient effect — navy to red
    const grad=ctx.createLinearGradient(x,y,x,pad.top+chartH);
    grad.addColorStop(0,'#041627');
    grad.addColorStop(1,'#BB0014');
    ctx.fillStyle=grad;
    ctx.fillRect(x,y,barWidth,barH);

    // Value on top
    if(d.total>0){
      ctx.fillStyle='#041627';
      ctx.font='bold 10px Manrope,sans-serif';
      ctx.textAlign='center';
      ctx.fillText(d.total,x+barWidth/2,y-4);
    }

    // Date label
    ctx.fillStyle='#74777D';
    ctx.font='9px Inter,sans-serif';
    ctx.textAlign='center';
    const label=d.date.slice(5); // MM-DD
    ctx.fillText(label,x+barWidth/2,pad.top+chartH+16);
  });
}
