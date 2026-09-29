/**
 * BantayBarangay - Resident AI Assistant (Bantay AI)
 * Floating bottom-right AI Chatbot providing 24/7 civic help,
 * instant problem reporting, live report tracking, and emergency info.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'bb_resident_chat_history';

  const BantayChatBot = {
    isOpen: false,
    history: [],

    init() {
      this.cacheDom();
      this.bindEvents();
      this.loadHistory();

      // If first time or empty, add initial welcome
      if (!this.history.length) {
        this.addBotWelcome();
      } else {
        this.renderHistory();
      }
    },

    cacheDom() {
      this.wrapper = document.getElementById('aiChatWrapper');
      this.window = document.getElementById('aiChatWindow');
      this.toggleBtn = document.getElementById('aiChatToggleBtn');
      this.messagesContainer = document.getElementById('aiChatMessages');
      this.form = document.getElementById('aiChatForm');
      this.input = document.getElementById('aiChatInput');
      this.typing = document.getElementById('aiTypingIndicator');
      this.btnClose = document.getElementById('aiBtnClose');
      this.btnReset = document.getElementById('aiBtnReset');
      this.badge = document.getElementById('aiToggleBadge');
      this.chips = document.querySelectorAll('.ai-chip');
    },

    bindEvents() {
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggle();
        });
      }

      if (this.btnClose) {
        this.btnClose.addEventListener('click', (e) => {
          e.stopPropagation();
          this.close();
        });
      }

      if (this.btnReset) {
        this.btnReset.addEventListener('click', () => {
          this.reset();
        });
      }

      if (this.form) {
        this.form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleUserSubmit();
        });
      }

      if (this.chips) {
        this.chips.forEach(chip => {
          chip.addEventListener('click', () => {
            const query = chip.dataset.query;
            if (query) {
              this.input.value = query;
              this.handleUserSubmit();
            }
          });
        });
      }

      // Close chat when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (this.isOpen && this.window && !this.window.contains(e.target) && !this.toggleBtn.contains(e.target)) {
          if (window.innerWidth <= 600) {
            this.close();
          }
        }
      });
    },

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    open() {
      this.isOpen = true;
      if (this.window) this.window.classList.add('active');
      if (this.toggleBtn) this.toggleBtn.classList.add('open');
      if (this.badge) this.badge.style.display = 'none';

      setTimeout(() => {
        if (this.input) this.input.focus();
        this.scrollToBottom();
      }, 150);
    },

    close() {
      this.isOpen = false;
      if (this.window) this.window.classList.remove('active');
      if (this.toggleBtn) this.toggleBtn.classList.remove('open');
    },

    reset() {
      this.history = [];
      localStorage.removeItem(STORAGE_KEY);
      if (this.messagesContainer) this.messagesContainer.innerHTML = '';
      this.addBotWelcome();
    },

    loadHistory() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          this.history = JSON.parse(saved);
        }
      } catch (err) {
        this.history = [];
      }
    },

    saveHistory() {
      try {
        // Keep max 30 recent messages
        const truncated = this.history.slice(-30);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(truncated));
      } catch (err) {
        // Storage quota exceeded or disabled
      }
    },

    addBotWelcome() {
      let userName = 'Resident';
      if (window.Auth && typeof Auth.getCurrentUser === 'function') {
        const user = Auth.getCurrentUser();
        if (user && user.name) {
          userName = user.name.split(' ')[0];
        }
      }

      const welcomeHtml = `
        👋 <strong>Mabuhay, ${userName}!</strong> I am your <strong>BantayBarangay Electrical Safety Assistant</strong>.
        <br><br>
        I am here 24/7 to assist with electrical infrastructure &amp; power concerns in Masbate:
        <ul style="margin:6px 0 8px 16px;padding:0;font-size:12.5px;color:var(--text-secondary);">
          <li>⚡ Downed wires, leaning utility poles, &amp; sparking lines</li>
          <li>💥 Blown transformers &amp; substation equipment failures</li>
          <li>🔌 Total blackouts &amp; rotational power interruptions</li>
          <li>🌳 Tree branches entangled in power lines</li>
        </ul>
        How may I help you today? Feel free to ask in English or Tagalog!
      `;

      this.pushMessage('bot', welcomeHtml, [
        { label: '⚡ Downed Power Line', action: 'quickReport:Snapped / Downed Power Lines' },
        { label: '💥 Blown Transformer', action: 'quickReport:Blown Transformer' },
        { label: '🗼 Leaning Utility Pole', action: 'quickReport:Toppled / Leaning Utility Pole' },
        { label: '🔌 Area Blackout', action: 'quickReport:Total Blackout (Area-wide)' }
      ]);
    },

    pushMessage(sender, textHtml, actions = []) {
      const msg = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        sender,
        textHtml,
        actions,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      this.history.push(msg);
      this.saveHistory();
      this.renderMessage(msg);
      this.scrollToBottom();
    },

    renderHistory() {
      if (!this.messagesContainer) return;
      this.messagesContainer.innerHTML = '';
      this.history.forEach(msg => this.renderMessage(msg));
      this.scrollToBottom();
    },

    renderMessage(msg) {
      if (!this.messagesContainer) return;

      const div = document.createElement('div');
      div.className = `ai-msg ${msg.sender}`;

      let actionsHtml = '';
      if (msg.actions && msg.actions.length) {
        actionsHtml = `
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
            ${msg.actions.map(act => `
              <button type="button" class="ai-action-btn" data-ai-action="${act.action}">
                ${act.label}
              </button>
            `).join('')}
          </div>
        `;
      }

      div.innerHTML = `
        <div class="ai-bubble">
          ${msg.textHtml}
          ${actionsHtml}
        </div>
        <span class="ai-msg-time">${msg.time}</span>
      `;

      // Attach action clicks
      div.querySelectorAll('[data-ai-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.executeAction(btn.dataset.aiAction);
        });
      });

      this.messagesContainer.appendChild(div);
    },

    scrollToBottom() {
      if (this.messagesContainer) {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }
    },

    showTyping() {
      if (this.typing) {
        this.typing.style.display = 'flex';
        this.scrollToBottom();
      }
    },

    hideTyping() {
      if (this.typing) {
        this.typing.style.display = 'none';
      }
    },

    handleUserSubmit() {
      const query = (this.input ? this.input.value : '').trim();
      if (!query) return;

      // Render user message
      this.pushMessage('user', this.escapeHtml(query));
      this.input.value = '';

      // Show typing indicator
      this.showTyping();

      // Calculate realistic delay based on length
      const delay = Math.min(900, Math.max(450, query.length * 15));

      setTimeout(() => {
        this.hideTyping();
        const response = this.generateResponse(query);
        this.pushMessage('bot', response.textHtml, response.actions || []);
      }, delay);
    },

    executeAction(actionStr) {
      if (!actionStr) return;
      const [type, payload] = actionStr.split(':');

      if (type === 'quickReport') {
        this.quickReport(payload);
      } else if (type === 'view') {
        if (window.BantayResident && typeof BantayResident.showView === 'function') {
          BantayResident.showView(payload);
        }
        if (window.innerWidth <= 768) {
          this.close();
        }
      } else if (type === 'dial') {
        window.location.href = `tel:${payload}`;
      }
    },

    quickReport(category) {
      if (window.BantayResident && typeof BantayResident.selectCategory === 'function') {
        BantayResident.selectCategory(category);
      } else if (window.BantayResident && typeof BantayResident.showView === 'function') {
        BantayResident.showView('report');
      }

      if (window.UI && typeof UI.toast === 'function') {
        UI.toast(`Started report for ${category}`, 'info');
      }

      // Close on mobile so resident can immediately see the form
      if (window.innerWidth <= 768) {
        this.close();
      }
    },

    escapeHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    // ── KNOWLEDGE BASE & INTENT CLASSIFIER ───────────────────
    generateResponse(rawQuery) {
      const q = rawQuery.toLowerCase();

      // 1. REPORT ID LOOKUP (e.g. BB-001, BB-002, etc.)
      const bbMatch = rawQuery.match(/BB-\d{3,}/i);
      if (bbMatch && window.Reports && typeof Reports.getAll === 'function') {
        const reportId = bbMatch[0].toUpperCase();
        const allReports = Reports.getAll();
        const found = allReports.find(r => (r.id || '').toUpperCase() === reportId);

        if (found) {
          const statusColors = {
            'pending': '#f59e0b',
            'under_review': '#38bdf8',
            'in_progress': '#06b6d4',
            'resolved': '#10b981'
          };
          const color = statusColors[found.status] || '#f59e0b';
          const statusName = (found.status || 'pending').replace('_', ' ').toUpperCase();

          const cardHtml = `
            🔍 <strong>Report Details for #${found.id}</strong>:
            <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px;margin:8px 0;font-size:12px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="font-weight:700;color:var(--text-primary);">${found.category}</span>
                <span style="background:${color}22;color:${color};font-weight:800;padding:1px 6px;border-radius:6px;border:1px solid ${color}44;">${statusName}</span>
              </div>
              <div style="color:var(--text-secondary);margin-bottom:2px;">📍 ${found.location?.address || 'Masbate City'} (${found.location?.purok || 'Espinosa'})</div>
              <div style="color:var(--text-muted);font-size:11px;">🏛️ Assigned: <strong>${found.agency || 'Barangay Maintenance'}</strong></div>
              <div style="color:var(--text-muted);font-size:11px;">🗓️ Filed: ${found.date || 'Recent'}</div>
            </div>
            Would you like to view complete audit timeline notes?
          `;

          return {
            textHtml: cardHtml,
            actions: [
              { label: '📋 View Full Report', action: 'view:myreports' }
            ]
          };
        } else {
          return {
            textHtml: `I searched for report <strong>#${reportId}</strong> but could not find a record with that ID. Please verify the report code or check your submitted reports list.`,
            actions: [
              { label: '🔍 Open My Reports', action: 'view:myreports' }
            ]
          };
        }
      }

      // 2. POTHOLE / ROAD DAMAGE / LUBAK (Redirect to DPWH, offer electrical hazard options)
      if (q.includes('pothole') || q.includes('lubak') || q.includes('kalsada') || q.includes('asphalt') || q.includes('semento') || q.includes('crack') || q.includes('road')) {
        return {
          textHtml: `
            ℹ️ <strong>BantayBarangay is dedicated strictly to Electrical Infrastructure &amp; Power Grid Hazards</strong>.
            <br><br>
            Road surfacing, potholes, and civil roadworks are handled directly by the <strong>DPWH Masbate 1st DEO</strong> (Hotline: <strong>(056) 333-2575</strong>) and City Engineering.
            <br><br>
            If road damage has exposed underground cables or caused a utility pole to tilt or collapse along the roadway, file an electrical hazard report:
          `,
          actions: [
            { label: '🗼 Report Leaning Pole', action: 'quickReport:Toppled / Leaning Utility Pole' },
            { label: '⚡ Report Downed Wire', action: 'quickReport:Snapped / Downed Power Lines' }
          ]
        };
      }

      // 3. ELECTRIC HAZARD / POWER INTERRUPTIONS / MASELCO / POSTE / TRANSFORMER / WIRE
      if (q.includes('electric') || q.includes('post') || q.includes('poste') || q.includes('kuryente') || q.includes('maselco') || q.includes('brownout') || q.includes('blackout') || q.includes('wire') || q.includes('kord') || q.includes('transformer') || q.includes('spark') || q.includes('substation') || q.includes('voltage') || q.includes('meter') || q.includes('ilaw')) {
        return {
          textHtml: `
            ⚡ <strong>Electrical Infrastructure &amp; Power Hazards (MASELCO)</strong><br>
            Reports for power lines, leaning utility poles, blown transformers, and outages are dispatched directly to <strong>MASELCO (Masbate Electric Cooperative)</strong>.
            <br><br>
            ⚠️ <em>CRITICAL SAFETY WARNING: Maintain at least 10 meters distance from downed, sparking, or low-hanging power cables. Do NOT touch wet surfaces near electrical wires.</em>
            <br><br>
            MASELCO 24/7 Hotline: <strong>(056) 333-2244</strong> / <strong>0917-333-6273</strong>
          `,
          actions: [
            { label: '⚡ Downed Power Lines', action: 'quickReport:Snapped / Downed Power Lines' },
            { label: '💥 Blown Transformer', action: 'quickReport:Blown Transformer' },
            { label: '🗼 Leaning Pole', action: 'quickReport:Toppled / Leaning Utility Pole' },
            { label: '🔌 Area Outage', action: 'quickReport:Total Blackout (Area-wide)' },
            { label: '📞 Call MASELCO', action: 'dial:0563332244' }
          ]
        };
      }

      // 4. CLOGGED DRAINAGE / KANAL / FLOOD / BAHA / WATER
      if (q.includes('drainage') || q.includes('kanal') || q.includes('baha') || q.includes('flood') || q.includes('canal') || q.includes('clog') || q.includes('bara') || q.includes('tubig')) {
        return {
          textHtml: `
            ℹ️ <strong>BantayBarangay is dedicated strictly to Electrical Infrastructure &amp; Power Grid Hazards</strong>.
            <br><br>
            For municipal drainage and flood management, please coordinate with the <strong>Masbate CDRRMO</strong> or local Barangay Hall.
            <br><br>
            ⚠️ <strong>Electrical Flood Hazard Alert</strong>: If rising floodwaters submerge electric meter boxes, ground transformers, or touch dangling live wires, submit an emergency report immediately to disconnect power!
          `,
          actions: [
            { label: '⚡ Report Submerged / Downed Wire', action: 'quickReport:Snapped / Downed Power Lines' },
            { label: '📞 Call MASELCO Emergency', action: 'dial:0563332244' }
          ]
        };
      }

      // 5. CRIME & PUBLIC SAFETY
      if (q.includes('crime') || q.includes('pulis') || q.includes('police') || q.includes('tanod') || q.includes('nakaw') || q.includes('theft') || q.includes('away') || q.includes('gulo') || q.includes('safety') || q.includes('droga') || q.includes('holdap')) {
        return {
          textHtml: `
            🚨 <strong>Law Enforcement Notice</strong><br>
            BantayBarangay is an electrical infrastructure portal. For peace and order, disturbances, or criminal emergencies, please contact law enforcement directly:
            <br><br>
            • <strong>PNP Masbate City Police</strong>: <strong>(056) 333-2222</strong> / <strong>0998-598-6011</strong><br>
            • <strong>National Emergency</strong>: <strong>911</strong><br>
            • <strong>Barangay Tanod Desk</strong>: <strong>(056) 333-2199</strong>
          `,
          actions: [
            { label: '📞 Call PNP Masbate', action: 'dial:0563332222' },
            { label: '📞 Call 911', action: 'dial:911' }
          ]
        };
      }

      // 7. TRACK REPORTS / STATUS CHECK / KUMUSTA
      if (q.includes('track') || q.includes('status') || q.includes('follow') || q.includes('kumusta') || q.includes('ilan') || q.includes('check my')) {
        let countText = '';
        if (window.Reports && typeof Reports.getAll === 'function') {
          const stats = Reports.getStats();
          countText = `<br><br>📊 <strong>Barangay Operations Overview</strong>:<br>• Active Reports: <strong>${stats.pending + stats.progress}</strong><br>• Completed & Verified: <strong>${stats.resolved}</strong>`;
        }

        return {
          textHtml: `
            🔍 <strong>Track Your Reports</strong><br>
            You can monitor real-time updates, see which agency is dispatched, and review photographic proof of completion in the <strong>Track Reports</strong> tab.
            ${countText}
          `,
          actions: [
            { label: '📋 Open Track Reports', action: 'view:myreports' }
          ]
        };
      }

      // 8. EMERGENCY HOTLINES / TAWAG / NUMBERS
      if (q.includes('hotline') || q.includes('emergency') || q.includes('tawag') || q.includes('number') || q.includes('contact') || q.includes('fire') || q.includes('hospital') || q.includes('ambulansya') || q.includes('ambulance')) {
        return {
          textHtml: `
            📞 <strong>Official Masbate City Emergency Contacts</strong>:
            <div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;margin:8px 0;font-size:12px;line-height:1.6;">
              • <strong>PNP Masbate City Police</strong>: (056) 333-2222 / 0998-598-6032<br>
              • <strong>Masbate CDRRMO (Rescue / 911)</strong>: (056) 582-0199<br>
              • <strong>BFP Masbate Fire Station</strong>: (056) 333-2244 / 0917-804-6334<br>
              • <strong>Masbate Provincial Hospital</strong>: (056) 333-2247<br>
              • <strong>MASELCO Power Hotline</strong>: (056) 333-2283
            </div>
          `,
          actions: [
            { label: '📞 Call Police (333-2222)', action: 'dial:0563332222' },
            { label: '📞 Call Rescue (582-0199)', action: 'dial:0565820199' }
          ]
        };
      }

      // 9. ADVISORIES / WEATHER / PAGASA / NOTICE
      if (q.includes('advis') || q.includes('weather') || q.includes('ulan') || q.includes('bagyo') || q.includes('typhoon') || q.includes('pagasa') || q.includes('bulletin') || q.includes('notice')) {
        return {
          textHtml: `
            📢 <strong>Public Advisories & Civic Notices</strong><br>
            Current active advisories include the <strong>PAGASA Orange Rainfall Warning</strong> for Masbate & Ticao Island, and <strong>MASELCO Feeder 1 & 2</strong> scheduled maintenance.
            <br><br>
            You can view full details in the dedicated Public Advisories section in your sidebar.
          `,
          actions: [
            { label: '📢 View Public Advisories', action: 'view:advisories' }
          ]
        };
      }

      // 10. PHONE NUMBER CHANGE / PROFILE
      if (q.includes('phone') || q.includes('numero') || q.includes('cellphone') || q.includes('number') || q.includes('palit') || q.includes('profile')) {
        return {
          textHtml: `
            ⚙️ <strong>Change Registered Phone Number</strong><br>
            You can change your registered Philippine mobile number securely from the <strong>Profile & Settings</strong> tab:
            <ol style="margin:4px 0 6px 18px;padding:0;font-size:12px;">
              <li>Go to Profile & Settings</li>
              <li>Under "Change Phone Number", input your new 11-digit mobile (09XXXXXXXXX)</li>
              <li>Confirm your current password and click "Save New Phone Number"</li>
            </ol>
          `,
          actions: [
            { label: '⚙️ Open Profile Settings', action: 'view:profile' }
          ]
        };
      }

      // 11. BARANGAY CLEARANCE / CEDULA / CERTIFICATE
      if (q.includes('clearance') || q.includes('cedula') || q.includes('indigency') || q.includes('residency') || q.includes('certificate')) {
        return {
          textHtml: `
            🏛️ <strong>Barangay Clearance & Certifications</strong><br>
            Barangay clearances, Certificates of Residency, and Indigency certifications are issued directly at the <strong>Barangay Hall</strong> during official office hours (Monday to Friday, 8:00 AM – 5:00 PM).
            <br><br>
            Please bring a valid Government ID and your Community Tax Certificate (Cedula).
          `,
          actions: [
            { label: '🕳️ Report an Issue Instead', action: 'view:report' }
          ]
        };
      }

      // 12. GREETINGS
      if (q.includes('hello') || q.includes('hi') || q.includes('kamusta') || q.includes('mabuhay') || q.includes('good morning') || q.includes('good afternoon') || q.includes('good evening')) {
        return {
          textHtml: `
            👋 Hello! How can I assist you with Masbate electrical infrastructure today? You can report an outage, downed line, leaning pole, or look up a report code like <strong>BB-001</strong>.
          `,
          actions: [
            { label: '⚡ Report Electrical Hazard', action: 'view:report' },
            { label: '🔍 Track Reports', action: 'view:myreports' }
          ]
        };
      }

      // 13. FALLBACK / GENERAL HELP
      return {
        textHtml: `
          I understand you have a concern about: <em>"${this.escapeHtml(rawQuery)}"</em>.
          <br><br>
          BantayBarangay is dedicated strictly to electrical infrastructure and power incident reporting. Here are the electrical services I can assist you with right now:
        `,
        actions: [
          { label: '⚡ Downed Power Lines', action: 'quickReport:Snapped / Downed Power Lines' },
          { label: '💥 Blown Transformer', action: 'quickReport:Blown Transformer' },
          { label: '🗼 Leaning Utility Pole', action: 'quickReport:Toppled / Leaning Utility Pole' },
          { label: '🔌 Area Blackout', action: 'quickReport:Total Blackout (Area-wide)' },
          { label: '🌳 Branch on Lines', action: 'quickReport:Tree Branch Fell on Lines' },
          { label: '📞 Call MASELCO', action: 'dial:0563332244' }
        ]
      };
    }
  };

  // Expose globally
  window.BantayChatBot = BantayChatBot;

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BantayChatBot.init());
  } else {
    BantayChatBot.init();
  }
})();
