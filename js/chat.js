// ============================================================
// CHAT — Follow-up AI chat for report refinement
// Depends on: state.js, api.js (fetchFromWorker), schemas.js, preview.js
// ============================================================

// ============================================================
// ============================================================
// MEJORA #8: FOLLOW-UP CHAT
// ============================================================

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  const wUrl = WORKER_URL;
  if (!msg || !result || !wUrl) return;

  input.value = '';
  input.disabled = true;
  addChatBubble('user', msg);

  const btn = document.getElementById('btnChat');
  btn.disabled = true;

  // Show typing indicator
  const container = document.getElementById('chatMessages');
  const typingEl = document.createElement('div');
  typingEl.id = 'chatTyping';
  typingEl.style.cssText = 'display:flex;align-items:flex-start;gap:8px';
  typingEl.innerHTML = `<div style="width:24px;height:24px;background:#E74243;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px"><span class="material-symbols-outlined" style="font-size:13px;color:#fff;font-variation-settings:'FILL' 1">smart_toy</span></div><div class="typing-bubble"><span></span><span></span><span></span></div>`;
  container.appendChild(typingEl);
  container.scrollTop = container.scrollHeight;

  chatHistory.push({ role: 'user', content: msg });

  try {
    const reply = await fetchFromWorker(
      wUrl,
      {
        userContent: '__CHAT_MODE__',
        chatMessages: [
          {
            role: 'user',
            content: `Este es el informe ejecutivo actual en JSON:\n\n${JSON.stringify(result, null, 2)}\n\nEl usuario tiene una consulta sobre este informe. Responde de forma concisa y profesional. Si el usuario pide modificar el informe, responde con el JSON actualizado completo precedido de la etiqueta __JSON_UPDATE__ en una línea separada. Si solo pide información o aclaración, responde en texto normal.\n\nConsulta del usuario: ${msg}`,
          },
        ],
      },
      null
    );

    typingEl.remove();

    // Check if response includes a JSON update
    if (reply.includes('__JSON_UPDATE__')) {
      const parts = reply.split('__JSON_UPDATE__');
      const textPart = parts[0].trim();
      const jsonPart = parts[1].replace(/```json|```/g, '').trim();
      try {
        const updated = parseModelJSON('report', jsonPart);
        result = updated;
        renderPreview(result);
        addChatBubble(
          'assistant',
          (textPart || t('uiReportUpdated')) + '\n\n✅ ' + t('uiReportUpdatedDetail')
        );
      } catch (e) {
        addChatBubble('assistant', textPart || reply);
      }
    } else {
      addChatBubble('assistant', reply);
    }

    chatHistory.push({ role: 'assistant', content: reply });
  } catch (err) {
    typingEl.remove();
    addChatBubble('assistant', '❌ Error: ' + err.message);
  } finally {
    btn.disabled = false;
    input.disabled = false;
    input.focus();
  }
}

function addChatBubble(role, text) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.style.cssText =
    role === 'user'
      ? 'display:flex;justify-content:flex-end'
      : 'display:flex;justify-content:flex-start;gap:8px;align-items:flex-start';
  if (role === 'assistant') {
    const avatar = document.createElement('div');
    avatar.style.cssText =
      'width:24px;height:24px;background:#E74243;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px';
    avatar.innerHTML =
      '<span class="material-symbols-outlined" style="font-size:13px;color:#fff;font-variation-settings:\'FILL\' 1">smart_toy</span>';
    div.appendChild(avatar);
  }
  const bubble = document.createElement('div');
  bubble.style.cssText =
    role === 'user'
      ? 'background:#1A3350;color:#fff;font-family:Inter,sans-serif;font-size:13px;padding:10px 14px;border-radius:10px 10px 2px 10px;max-width:85%;white-space:pre-wrap;line-height:1.5'
      : 'background:#fff;border:1px solid #E0E3E5;border-left:3px solid #E74243;color:#191C1E;font-family:Inter,sans-serif;font-size:13px;padding:10px 14px;border-radius:2px 10px 10px 10px;max-width:85%;white-space:pre-wrap;line-height:1.5';
  bubble.textContent = text;
  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  // Show notif dot on button if panel is collapsed and it's an AI response
  if (role === 'assistant' && !window._aiPanelOpen) {
    const notif = document.getElementById('aiFloatNotif');
    if (notif) notif.style.display = 'block';
  }
}
