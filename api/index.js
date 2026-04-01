export default async function handler(req, res) {
  const url = req.url;
  const method = req.method;

  // === GET / – отдаём HTML с мини-игрой ===
  if (method === 'GET' && (url === '/' || url === '')) {
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Кликер</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
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
        // Функция инициализации, запускается после загрузки страницы и SDK
        function init() {
            let tg;
            // Проверяем, загрузился ли Telegram WebApp
            if (window.Telegram && window.Telegram.WebApp) {
                tg = window.Telegram.WebApp;
                tg.ready();
                tg.expand();
            } else {
                // Если нет, пробуем подождать ещё (например, скрипт ещё не загрузился)
                setTimeout(() => {
                    if (window.Telegram && window.Telegram.WebApp) {
                        tg = window.Telegram.WebApp;
                        tg.ready();
                        tg.expand();
                    } else {
                        console.warn('Telegram WebApp SDK не загружен. Работаем без интеграции.');
                    }
                    startGame(tg);
                }, 500);
                return;
            }
            startGame(tg);
        }

        function startGame(tg) {
            const user = tg && tg.initDataUnsafe?.user;
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

            // Отправляем при загрузке
            sendUserData(0);

            // Обработчик клика
            clickBtn.addEventListener('click', () => {
                score++;
                scoreSpan.textContent = score;
                if (tg && tg.HapticFeedback) {
                    tg.HapticFeedback.impactOccurred('light');
                }
                sendUserData(score);
            });

            // Кнопка закрытия (если доступна)
            if (tg && tg.MainButton) {
                tg.MainButton.setText('Закрыть');
                tg.MainButton.show();
                tg.MainButton.onClick(() => tg.close());
            }
        }

        // Запускаем инициализацию после полной загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
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
