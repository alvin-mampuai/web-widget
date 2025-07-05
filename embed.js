/*
  embed.js
  Chat widget loader for clients to embed BotUI via a single <script> tag.
  Usage: Host this file at https://cdn.yourdomain.com/embed.js and have clients include:

  <script>
    (function(w,d){
      w._chatConfig = { endpoint: 'https://api.yourdomain.com/chat' };
      var s = d.createElement('script');
      s.src = 'https://cdn.yourdomain.com/embed.js';
      s.async = true;
      d.head.appendChild(s);
    })(window,document);
  </script>
*/

(function(window, document) {
  var cfg = window._chatConfig || {};
  var endpoint = cfg.endpoint;

  // 1. Inject BotUI CSS
  var css1 = document.createElement('link');
  css1.rel = 'stylesheet';
  css1.href = 'https://unpkg.com/botui/build/botui.min.css';
  var css2 = document.createElement('link');
  css2.rel = 'stylesheet';
  css2.href = 'https://unpkg.com/botui/build/botui-theme-default.css';
  document.head.appendChild(css1);
  document.head.appendChild(css2);

  // 2. Create widget container
  var container = document.createElement('div');
  container.id = 'botui-widget';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.maxWidth = '320px';
  container.style.zIndex = '99999';
  document.body.appendChild(container);

  // 3. Load Vue and BotUI
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = cb;
    document.head.appendChild(s);
  }

  loadScript('https://unpkg.com/vue@2', function() {
    loadScript('https://unpkg.com/botui/build/botui.min.js', initChat);
  });

  // 4. Initialize chat UI
  function initChat() {
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
          })
          .then(function(r){ return r.json(); })
          .then(function(data) {
            botui.message.add({ content: data.reply || '🤖 ...' });
            promptUser();
          })
          .catch(function(){
            botui.message.add({ content: '⚠️ Something went wrong.' });
            promptUser();
          });
        });
    }
  }
})(window, document);
