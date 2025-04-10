# Goethe Registration System v2

An automated system for registering users for Goethe Institute exams.

## Project Structure

The project has been restructured with a cleaner architecture:

```
.
├── src/                    # Source code
│   ├── browser/            # Browser management
│   ├── config/             # Configuration
│   ├── middleware/         # Middleware components
│   ├── register/           # Registration logic
│   ├── services/           # Core services
│   ├── utils/              # Utilities
│   └── index.js            # Main entry point
├── cmd/                    # Original command modules (maintained for compatibility)
│   ├── register/           # Registration steps (Not modified)
│   ├── gpm-login/          # Browser launch utilities (Not modified)
│   └── data/               # User and proxy data
├── download_file/          # Download directory for screenshots
├── .env                    # Environment variables
└── package.json            # Dependencies
```

## New Architecture

The new architecture is designed to be more modular and maintainable:

1. **Services Layer**:
   - `RedisService`: Handles Redis pub/sub for registration links
   - `QueueService`: Manages the queue of registration tasks
   - `UserManager`: Handles user data and allocation

2. **Browser Layer**:
   - `BrowserManager`: Manages browser instances and lifecycle

3. **Registration Layer**:
   - `RegistrationManager`: Coordinates the registration process

4. **Utilities**:
   - `Logger`: Consistent logging throughout the application
   - `ProxyService`: Loads and validates proxies
   - `UrlParser`: Parses registration URLs and extracts cookies

## How It Works

1. The system subscribes to a Redis channel for incoming registration links
2. When a link is received, it's added to the queue
3. The queue system allocates browser instances as they become available
4. Each browser handles the registration process using the existing logic in `cmd/register`
5. After completion, resources are released and made available for new tasks

## Usage

1. Set up your environment variables in `.env`
2. Place user data files in `data/user/` (one JSON file per exam type)
3. Place proxy list in `data/proxy/proxy.txt`
4. Run the application:

```
npm start
```

## Environment Variables

- `HIDDEN_CHROME`: Path to Chrome executable
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port
- `REDIS_REGISTER_CHANNEL`: Redis channel for registration links
- `BOT_TOKEN`: Telegram bot token for notifications
- `CHAT_ID`: Telegram chat ID for notifications
- `INITIAL_REGISTER_URL`: Optional URL for initial testing

## Improvements

- Modular architecture for better code organization
- Consistent logging across all components
- Robust error handling and recovery
- Resource management to prevent memory leaks
- Clear separation of concerns 