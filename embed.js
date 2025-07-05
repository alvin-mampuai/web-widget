/*
  embed.js
  Chat widget loader for clients to embed BotUI via a single <script> tag.
  Usage: host this at:
    https://cdn.jsdelivr.net/gh/alvin-mampuai/web-widget@main/embed.js
*/

(function(window, document) {
  var cfg      = window._chatConfig || {};
  var endpoint = cfg.endpoint;

  // 1. Inject BotUI CSS from jsDelivr
  ['botui.min.css', 'botui-theme-default.css'].forEach(function(file) {
    var link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/botui/build/' + file;
    document.head.appendChild(link);
  });

  // 2. Create the widget container
  var container = document.createElement('div');
  container.id = 'botui-widget';
  Object.assign(container.style, {
    position:  'fixed',
    bottom:    '20px',
    right:     '20px',
    maxWidth:  '320px',
    zIndex:    '99999'
  });
  document.body.appendChild(container);

  // 3. Helper to load scripts
  function loadScript(src, cb) {
    var s       = document.createElement('script');
    s.src       = src;
    s.async     = true;
    s.onload    = cb;
    s.onerror   = function(){ console.error('Failed to load', src); };
    document.head.appendChild(s);
  }

  // 4. Load Vue → then BotUI → then kick off chat
  loadScript('https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js', function() {
    loadScript('https://cdn.jsdelivr.net/npm/botui/build/botui.min.js', initChat);
  });

  // 5. Initialize the chat UI
  function initChat() {
    if (!window.BotUI) {
      console.error('BotUI not found');
      return;
    }
    var botui = new BotUI('botui-widget');

    botui.message.add({ content: '👋 Hi there! How can I help you today?' })
      .then(promptUser);

    function promptUser() {
      botui.action.text({ action: { placeholder: 'Type your question…' } })
        .then(function(res) {
          var text = (res.value||'').trim();
          if (!text) return promptUser();

          botui.message.add({ human: true, content: text });

          fetch(endpoint, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ text: text })
          })
          .then(r => r.json())
          .then(data => {
            botui.message.add({ content: data.reply || '🤖 ...' });
            promptUser();
          })
          .catch(() => {
            botui.message.add({ content: '⚠️ Something went wrong.' });
            promptUser();
          });
        });
    }
  }
})(window, document);
