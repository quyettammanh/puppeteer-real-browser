run:
	node src/index.js

REDIS_KEY := url_updates
SUFFIX_URL := @register-goethe-redis/hcm_b2-link2@Reading-Listening-Writing-Speaking@14.07. - 25.07.2025

BASE_URL2 := https://www.goethe.de/coe/options;coesessionid=A66475EB170507C09C1CBE895E61C207?1=&64a4bb21e29e708eed03141ffa38edba=00a0d54e6df526f3dc30643e200ef0b1&COE-Customer=77139311-88bd-4b02-9460-fbd4d5a61fb5&COE-Tab-ID=080973c2-cfbc-45c8-b066-a4737dc048b0&COE-Tab-ID=080973c2-cfbc-45c8-b066-a4737dc048b0
BASE_URL1:= https://www.goethe.de/coe/options;coesessionid=0CACCF8D79188E6798475209F971AC7B?1=&64a4bb21e29e708eed03141ffa38edba=4e1f717d3f22a5468e2f6ac88f74f109&COE-Customer=ade06973-69c2-484c-b316-4e180b2c7348&COE-Tab-ID=23546af6-e4cd-4623-9411-fd307b79de7a&COE-Tab-ID=23546af6-e4cd-4623-9411-fd307b79de7a
pub:	
	docker exec my-redis redis-cli PUBLISH $(REDIS_KEY) "$(BASE_URL1)$(SUFFIX_URL)"

pm2-start:
	pm2 start cmd/index.js --name "goethe-bot"
pm2-stop:
	pm2 stop "goethe-bot"
pm2-restart:
	pm2 restart "goethe-bot"
pm2-log:
	pm2 logs "goethe-bot"
