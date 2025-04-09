run:
	node cmd/index.js

REDIS_KEY := url_updates
SUFFIX_URL := @register-goethe-redis/hcm_b2-link2@Reading-Listening@14.07. - 25.07.2025

BASE_URL2 := https://www.goethe.de/coe/options;coesessionid=E71B3EED8348E60A5216B036F3107AF9?1=&64a4bb21e29e708eed03141ffa38edba=00a0d54e6df526f3dc30643e200ef0b1&COE-Customer=1b8256d0-a2e9-4d3a-ad24-2c10b64f9ba4&COE-Tab-ID=b7f165b0-3e99-4ad7-b26a-01d4fff02569&COE-Tab-ID=b7f165b0-3e99-4ad7-b26a-01d4fff02569

pub:
	docker exec my-redis redis-cli PUBLISH $(REDIS_KEY) "$(BASE_URL2)$(SUFFIX_URL)"

pm2-start:
	pm2 start cmd/index.js --name "goethe-bot"
pm2-stop:
	pm2 stop "goethe-bot"
pm2-restart:
	pm2 restart "goethe-bot"
pm2-log:
	pm2 logs "goethe-bot"
