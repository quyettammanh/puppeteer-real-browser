run:
	node cmd/index.js

REDIS_KEY := url_updates
SUFFIX_URL := @register-goethe-redis/hcm_b2-link2@Reading-Listening@14.07. - 25.07.2025

BASE_URL2 :=https://www.goethe.de/coe/options;coesessionid=7BA9B103100D23732E09058000F49A28?1=&64a4bb21e29e708eed03141ffa38edba=12a5c2ebe3395c7aa0797ffeca33ac2b&COE-Customer=747057ba-4d0d-4835-a696-86c08026542f&COE-Tab-ID=56f8dcc0-4524-4c0e-bdca-8474904515cb&COE-Tab-ID=56f8dcc0-4524-4c0e-bdca-8474904515cb

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
