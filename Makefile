run:
	node src/index.js

REDIS_KEY := url_updates
SUFFIX_URL := @register-goethe-redis/hcm_b2-link2@Reading-Listening-Writing-Speaking@14.07. - 25.07.2025

BASE_URL2 := https://www.goethe.de/coe/options;coesessionid=A66475EB170507C09C1CBE895E61C207?1=&64a4bb21e29e708eed03141ffa38edba=00a0d54e6df526f3dc30643e200ef0b1&COE-Customer=77139311-88bd-4b02-9460-fbd4d5a61fb5&COE-Tab-ID=080973c2-cfbc-45c8-b066-a4737dc048b0&COE-Tab-ID=080973c2-cfbc-45c8-b066-a4737dc048b0
BASE_URL1:= https://www.google.com/search?q=nhac+tre
pub:	
	docker exec my-redis redis-cli PUBLISH $(REDIS_KEY) "$(BASE_URL2)$(SUFFIX_URL)"
	docker exec my-redis redis-cli PUBLISH $(REDIS_KEY) "$(BASE_URL2)$(SUFFIX_URL)"
	docker exec my-redis redis-cli PUBLISH $(REDIS_KEY) "$(BASE_URL1)$(SUFFIX_URL)"

pm2-start:
	pm2 start cmd/index.js --name "goethe-bot"
pm2-stop:
	pm2 stop "goethe-bot"
pm2-restart:
	pm2 restart "goethe-bot"
pm2-log:
	pm2 logs "goethe-bot"
