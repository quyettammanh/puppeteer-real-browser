run:
	node cmd/index.js

REDIS_KEY := url_updates
SUFFIX_URL := @register-goethe-redis/hcm_b2-link2@Reading-Listening@14.07. - 25.07.2025

BASE_URL := https://www.goethe.de/coe/options;coesessionid=CFF9561647F7F1ECA3466C577D72F8A6?1=&64a4bb21e29e708eed03141ffa38edba=ba4b736a90d98c1e0ac15eca384f6c2b&COE-Customer=348cfb62-aac1-4fb1-a908-d239a52aeecd&COE-Tab-ID=8fe99f0b-c954-41cf-81ac-3146c2dc4a58&COE-Tab-ID=8fe99f0b-c954-41cf-81ac-3146c2dc4a58
pub:
	docker exec my-redis redis-cli PUBLISH $(REDIS_KEY) "$(BASE_URL)$(SUFFIX_URL)"
pm2-start:
	pm2 start cmd/index.js --name "goethe-bot"
pm2-stop:
	pm2 stop "goethe-bot"
pm2-restart:
	pm2 restart "goethe-bot"
pm2-log:
	pm2 logs "goethe-bot"
