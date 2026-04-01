export default async function handler(req, res) {
  const url = req.url;
  const method = req.method;

  // === GET / – отдаём HTML с мини-игрой и встроенным Telegram WebApp SDK ===
  if (method === 'GET' && (url === '/' || url === '')) {
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Кликер</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
        }
        body {
            background: var(--tg-theme-bg-color, #ffffff);
            color: var(--tg-theme-text-color, #000000);
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 16px;
        }
        .game-container {
            text-align: center;
            max-width: 350px;
            width: 100%;
        }
        h1 {
            font-size: 28px;
            margin-bottom: 24px;
            color: var(--tg-theme-text-color);
        }
        .click-area {
            background: var(--tg-theme-button-color, #2c7be5);
            width: 200px;
            height: 200px;
            border-radius: 50%;
            margin: 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
            transition: transform 0.1s ease;
            color: white;
            font-weight: bold;
            font-size: 24px;
        }
        .click-area:active {
            transform: scale(0.95);
        }
        .counter {
            font-size: 48px;
            font-weight: bold;
            margin: 20px 0;
        }
        .info {
            font-size: 14px;
            opacity: 0.7;
            margin-top: 20px;
        }
    </style>
    <!-- Встраиваем Telegram WebApp SDK -->
    <script>
    // ----------------------------------------------------------------------
    // Telegram WebApp SDK (встроенная копия, чтобы не зависеть от telegram.org)
    // ----------------------------------------------------------------------
    (function () {
      var eventHandlers = {};

      var locationHash = '';
      try {
        locationHash = location.hash.toString();
      } catch (e) {}

      var initParams = urlParseHashParams(locationHash);
      var storedParams = sessionStorageGet('initParams');
      if (storedParams) {
        for (var key in storedParams) {
          if (typeof initParams[key] === 'undefined') {
            initParams[key] = storedParams[key];
          }
        }
      }
      sessionStorageSet('initParams', initParams);

      var isIframe = false, iFrameStyle;
      try {
        isIframe = (window.parent != null && window != window.parent);
        if (isIframe) {
          window.addEventListener('message', function (event) {
            if (event.source !== window.parent) return;
            try {
              var dataParsed = JSON.parse(event.data);
            } catch (e) {
              return;
            }
            if (!dataParsed || !dataParsed.eventType) {
              return;
            }
            if (dataParsed.eventType == 'set_custom_style') {
              if (event.origin === 'https://web.telegram.org') {
                iFrameStyle.innerHTML = dataParsed.eventData;
              }
            } else if (dataParsed.eventType == 'reload_iframe') {
              try {
                window.parent.postMessage(JSON.stringify({eventType: 'iframe_will_reload'}), '*');
              } catch (e) {}
              location.reload();
            } else {
              receiveEvent(dataParsed.eventType, dataParsed.eventData);
            }
          });
          iFrameStyle = document.createElement('style');
          document.head.appendChild(iFrameStyle);
          try {
            window.parent.postMessage(JSON.stringify({eventType: 'iframe_ready', eventData: {reload_supported: true}}), '*');
          } catch (e) {}
        }
      } catch (e) {}

      function urlSafeDecode(urlencoded) {
        try {
          urlencoded = urlencoded.replace(/\\+/g, '%20');
          return decodeURIComponent(urlencoded);
        } catch (e) {
          return urlencoded;
        }
      }

      function urlParseHashParams(locationHash) {
        locationHash = locationHash.replace(/^#/, '');
        var params = {};
        if (!locationHash.length) {
          return params;
        }
        if (locationHash.indexOf('=') < 0 && locationHash.indexOf('?') < 0) {
          params._path = urlSafeDecode(locationHash);
          return params;
        }
        var qIndex = locationHash.indexOf('?');
        if (qIndex >= 0) {
          var pathParam = locationHash.substr(0, qIndex);
          params._path = urlSafeDecode(pathParam);
          locationHash = locationHash.substr(qIndex + 1);
        }
        var query_params = urlParseQueryString(locationHash);
        for (var k in query_params) {
          params[k] = query_params[k];
        }
        return params;
      }

      function urlParseQueryString(queryString) {
        var params = {};
        if (!queryString.length) {
          return params;
        }
        var queryStringParams = queryString.split('&');
        var i, param, paramName, paramValue;
        for (i = 0; i < queryStringParams.length; i++) {
          param = queryStringParams[i].split('=');
          paramName = urlSafeDecode(param[0]);
          paramValue = param[1] == null ? null : urlSafeDecode(param[1]);
          params[paramName] = paramValue;
        }
        return params;
      }

      function urlAppendHashParams(url, addHash) {
        var ind = url.indexOf('#');
        if (ind < 0) {
          return url + '#' + addHash;
        }
        var curHash = url.substr(ind + 1);
        if (curHash.indexOf('=') >= 0 || curHash.indexOf('?') >= 0) {
          return url + '&' + addHash;
        }
        if (curHash.length > 0) {
          return url + '?' + addHash;
        }
        return url + addHash;
      }

      function postEvent(eventType, callback, eventData) {
        if (!callback) {
          callback = function () {};
        }
        if (eventData === undefined) {
          eventData = '';
        }
        console.log('[Telegram.WebView] > postEvent', eventType, eventData);

        if (window.TelegramWebviewProxy !== undefined) {
          TelegramWebviewProxy.postEvent(eventType, JSON.stringify(eventData));
          callback();
        }
        else if (window.external && 'notify' in window.external) {
          window.external.notify(JSON.stringify({eventType: eventType, eventData: eventData}));
          callback();
        }
        else if (isIframe) {
          try {
            var trustedTarget = 'https://web.telegram.org';
            trustedTarget = '*';
            window.parent.postMessage(JSON.stringify({eventType: eventType, eventData: eventData}), trustedTarget);
            callback();
          } catch (e) {
            callback(e);
          }
        }
        else {
          callback({notAvailable: true});
        }
      };

      function receiveEvent(eventType, eventData) {
        console.log('[Telegram.WebView] < receiveEvent', eventType, eventData);
        callEventCallbacks(eventType, function(callback) {
          callback(eventType, eventData);
        });
      }

      function callEventCallbacks(eventType, func) {
        var curEventHandlers = eventHandlers[eventType];
        if (curEventHandlers === undefined ||
            !curEventHandlers.length) {
          return;
        }
        for (var i = 0; i < curEventHandlers.length; i++) {
          try {
            func(curEventHandlers[i]);
          } catch (e) {}
        }
      }

      function onEvent(eventType, callback) {
        if (eventHandlers[eventType] === undefined) {
          eventHandlers[eventType] = [];
        }
        var index = eventHandlers[eventType].indexOf(callback);
        if (index === -1) {
          eventHandlers[eventType].push(callback);
        }
      };

      function offEvent(eventType, callback) {
        if (eventHandlers[eventType] === undefined) {
          return;
        }
        var index = eventHandlers[eventType].indexOf(callback);
        if (index === -1) {
          return;
        }
        eventHandlers[eventType].splice(index, 1);
      };

      function openProtoUrl(url) {
        if (!url.match(/^(web\\+)?tgb?:\\/\\/./)) {
          return false;
        }
        var useIframe = navigator.userAgent.match(/iOS|iPhone OS|iPhone|iPod|iPad/i) ? true : false;
        if (useIframe) {
          var iframeContEl = document.getElementById('tgme_frame_cont') || document.body;
          var iframeEl = document.createElement('iframe');
          iframeContEl.appendChild(iframeEl);
          var pageHidden = false;
          var enableHidden = function () {
            pageHidden = true;
          };
          window.addEventListener('pagehide', enableHidden, false);
          window.addEventListener('blur', enableHidden, false);
          if (iframeEl !== null) {
            iframeEl.src = url;
          }
          setTimeout(function() {
            if (!pageHidden) {
              window.location = url;
            }
            window.removeEventListener('pagehide', enableHidden, false);
            window.removeEventListener('blur', enableHidden, false);
          }, 2000);
        }
        else {
          window.location = url;
        }
        return true;
      }

      function sessionStorageSet(key, value) {
        try {
          window.sessionStorage.setItem('__telegram__' + key, JSON.stringify(value));
          return true;
        } catch(e) {}
        return false;
      }
      function sessionStorageGet(key) {
        try {
          return JSON.parse(window.sessionStorage.getItem('__telegram__' + key));
        } catch(e) {}
        return null;
      }

      if (!window.Telegram) {
        window.Telegram = {};
      }
      window.Telegram.WebView = {
        initParams: initParams,
        isIframe: isIframe,
        onEvent: onEvent,
        offEvent: offEvent,
        postEvent: postEvent,
        receiveEvent: receiveEvent,
        callEventCallbacks: callEventCallbacks
      };

      window.Telegram.Utils = {
        urlSafeDecode: urlSafeDecode,
        urlParseQueryString: urlParseQueryString,
        urlParseHashParams: urlParseHashParams,
        urlAppendHashParams: urlAppendHashParams,
        sessionStorageSet: sessionStorageSet,
        sessionStorageGet: sessionStorageGet
      };

      window.TelegramGameProxy_receiveEvent = receiveEvent;
      window.TelegramGameProxy = {
        receiveEvent: receiveEvent
      };
    })();

    // WebApp часть (сокращённая, но достаточная для получения user)
    (function () {
      var Utils = window.Telegram.Utils;
      var WebView = window.Telegram.WebView;
      var initParams = WebView.initParams;

      var WebApp = {};
      var webAppInitData = '', webAppInitDataUnsafe = {};
      var themeParams = {}, colorScheme = 'light';
      var webAppVersion = '6.0';
      var webAppPlatform = 'unknown';

      if (initParams.tgWebAppData && initParams.tgWebAppData.length) {
        webAppInitData = initParams.tgWebAppData;
        webAppInitDataUnsafe = Utils.urlParseQueryString(webAppInitData);
        for (var key in webAppInitDataUnsafe) {
          var val = webAppInitDataUnsafe[key];
          try {
            if (val.substr(0, 1) == '{' && val.substr(-1) == '}' ||
                val.substr(0, 1) == '[' && val.substr(-1) == ']') {
              webAppInitDataUnsafe[key] = JSON.parse(val);
            }
          } catch (e) {}
        }
      }
      if (initParams.tgWebAppThemeParams && initParams.tgWebAppThemeParams.length) {
        try {
          var theme_params = JSON.parse(initParams.tgWebAppThemeParams);
          if (theme_params) {
            for (var k in theme_params) {
              themeParams[k] = theme_params[k];
            }
          }
        } catch (e) {}
      }
      if (initParams.tgWebAppVersion) {
        webAppVersion = initParams.tgWebAppVersion;
      }
      if (initParams.tgWebAppPlatform) {
        webAppPlatform = initParams.tgWebAppPlatform;
      }

      function versionAtLeast(ver) {
        return true; // упрощаем, для нашей задачи не нужно
      }

      window.Telegram.WebApp = {
        initData: webAppInitData,
        initDataUnsafe: webAppInitDataUnsafe,
        themeParams: themeParams,
        colorScheme: colorScheme,
        version: webAppVersion,
        platform: webAppPlatform,
        isExpanded: true,
        viewportHeight: window.innerHeight,
        viewportStableHeight: window.innerHeight,
        headerColor: '#2481cc',
        backgroundColor: '#ffffff',
        isClosingConfirmationEnabled: false,
        isVerticalSwipesEnabled: true,
        MainButton: { setText: function(){}, show: function(){}, hide: function(){}, onClick: function(){} },
        SecondaryButton: { setText: function(){}, show: function(){}, hide: function(){}, onClick: function(){} },
        BackButton: { show: function(){}, hide: function(){}, onClick: function(){} },
        SettingsButton: { show: function(){}, hide: function(){}, onClick: function(){} },
        HapticFeedback: {
          impactOccurred: function(style) {
            WebView.postEvent('web_app_trigger_haptic_feedback', false, {type: 'impact', impact_style: style});
          },
          notificationOccurred: function(type) {
            WebView.postEvent('web_app_trigger_haptic_feedback', false, {type: 'notification', notification_type: type});
          },
          selectionChanged: function() {
            WebView.postEvent('web_app_trigger_haptic_feedback', false, {type: 'selection_change'});
          }
        },
        CloudStorage: {
          setItem: function(){}, getItem: function(){}, getItems: function(){}, removeItem: function(){}, getKeys: function(){}
        },
        ready: function() {
          WebView.postEvent('web_app_ready', false);
        },
        expand: function() {
          WebView.postEvent('web_app_expand', false);
        },
        close: function() {
          WebView.postEvent('web_app_close', false);
        },
        openTelegramLink: function(url) {
          WebView.postEvent('web_app_open_tg_link', false, {path_full: url});
        },
        openLink: function(url) {
          WebView.postEvent('web_app_open_link', false, {url: url});
        },
        openInvoice: function(invoice) {
          WebView.postEvent('web_app_open_invoice', false, {slug: invoice});
        },
        shareToStory: function() {},
        showPopup: function() {},
        showAlert: function() {},
        showConfirm: function() {},
        showScanQrPopup: function() {},
        closeScanQrPopup: function() {},
        readTextFromClipboard: function() {},
        switchInlineQuery: function() {},
        requestWriteAccess: function() {},
        requestContact: function() {},
        onEvent: function() {},
        offEvent: function() {},
        sendData: function() {},
        enableClosingConfirmation: function() {},
        disableClosingConfirmation: function() {},
        enableVerticalSwipes: function() {},
        disableVerticalSwipes: function() {},
        setHeaderColor: function() {},
        setBackgroundColor: function() {},
        setBottomBarColor: function() {}
      };

      // инициализация
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    })();
    </script>
</head>
<body>
    <div class="game-container">
        <h1>🏆 Кликер</h1>
        <div class="click-area" id="clickBtn">
            👆
        </div>
        <div class="counter">
            Счёт: <span id="score">0</span>
        </div>
        <div class="info">
            Нажимай на круг, чтобы заработать очки!
        </div>
    </div>

    <script>
        // Теперь Telegram.WebApp гарантированно существует
        const tg = window.Telegram.WebApp;

        const user = tg.initDataUnsafe?.user;
        let userId = null;
        let userName = '';
        if (user && user.id) {
            userId = user.id;
            userName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            if (user.username) userName += \` (@\${user.username})\`;
        } else {
            userId = 'unknown';
            userName = 'Гость (вне Telegram)';
        }

        const clickBtn = document.getElementById('clickBtn');
        const scoreSpan = document.getElementById('score');
        let score = 0;

        async function sendUserData(clickCount = null) {
            const payload = {
                user_id: userId,
                user_name: userName,
                timestamp: new Date().toISOString(),
                action: 'click',
                score: clickCount !== null ? clickCount : score
            };
            try {
                await fetch('/api/user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.error(err);
            }
        }

        sendUserData(0);

        clickBtn.addEventListener('click', () => {
            score++;
            scoreSpan.textContent = score;
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }
            sendUserData(score);
        });

        if (tg.MainButton) {
            tg.MainButton.setText('Закрыть');
            tg.MainButton.show();
            tg.MainButton.onClick(() => tg.close());
        }
    </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }

  // === POST /api/user – получаем данные и отправляем в Telegram ===
  if (method === 'POST' && url === '/api/user') {
    const { user_id, user_name, action, score, timestamp } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const YOUR_CHAT_ID = process.env.YOUR_CHAT_ID;

    if (!BOT_TOKEN || !YOUR_CHAT_ID) {
      console.error('Missing environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    let message = `🆔 Новое действие в мини-приложении!\n\n`;
    message += `👤 Пользователь: ${user_name || 'неизвестно'}\n`;
    message += `🆔 ID: ${user_id}\n`;
    message += `🎮 Действие: ${action || 'запуск'}\n`;
    message += `🏆 Счёт: ${score !== undefined ? score : '—'}\n`;
    message += `⏱ Время: ${timestamp || new Date().toISOString()}`;

    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: YOUR_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      });
      const result = await response.json();
      if (!result.ok) {
        console.error('Telegram API error:', result);
        return res.status(500).json({ error: 'Failed to send message' });
      }
    } catch (err) {
      console.error('Error sending to Telegram:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(200).json({ status: 'ok' });
  }

  // Все остальные запросы – 404
  res.status(404).json({ error: 'Not found' });
}
