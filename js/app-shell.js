// ============================================================
// APP SHELL — static DOM bindings and shell interactions
// ============================================================

let _aiPanelOpen = false;
window._aiPanelOpen = _aiPanelOpen;

function toggleMobileMenu() {
  document.getElementById('navSidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

function toggleAiPanel() {
  _aiPanelOpen = !_aiPanelOpen;
  window._aiPanelOpen = _aiPanelOpen;
  const panel = document.getElementById('aiFloatPanel');
  const btn = document.getElementById('aiFloatBtn');
  if (_aiPanelOpen) {
    btn.style.display = 'none';
    panel.style.display = 'flex';
    requestAnimationFrame(() => panel.classList.add('open'));
    document.getElementById('chatInput').focus();
    const notif = document.getElementById('aiFloatNotif');
    if (notif) notif.style.display = 'none';
  } else {
    panel.classList.remove('open');
    setTimeout(() => {
      panel.style.display = 'none';
      btn.style.display = 'flex';
    }, 200);
  }
}

function setAiInput(q) {
  const input = document.getElementById('chatInput');
  input.value = q;
  input.focus();
}

function bindClick(selector, handler) {
  document.querySelectorAll(selector).forEach(node => node.addEventListener('click', handler));
}

document.addEventListener('DOMContentLoaded', () => {
  bindClick('#mobileMenuBtn', toggleMobileMenu);
  bindClick('#sidebarOverlay', toggleMobileMenu);
  bindClick('#uiLangEs', () => setUILang('es'));
  bindClick('#uiLangEn', () => setUILang('en'));
  bindClick('#navMinutas', () => switchNavTab('minutas'));
  bindClick('#navInformes', () => switchNavTab('informes'));
  bindClick('#navContraste', () => switchNavTab('contraste'));
  bindClick('#aiFloatBtn', toggleAiPanel);
  bindClick('#btnAiMinimize', toggleAiPanel);
  bindClick('.ai-chip', event => setAiInput(window._t(event.currentTarget.dataset.i18nQ)));
  bindClick('#btnChat', sendChat);

  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') sendChat();
    });
  }
});
