run:
	node src/index.js

REDIS_KEY := url_updates
SUFFIX_URL := @register-goethe-redis/hcm_b2-link2@Reading@14.07. - 25.07.2025

BASE_URL2 := https://www.goethe.de/coe/options;coesessionid=CF53AD8BBE5DCAF3AD3CCCF75E5559FA?1=&64a4bb21e29e708eed03141ffa38edba=00a0d54e6df526f3dc30643e200ef0b1&COE-Customer=45ade659-1823-41a4-8112-17843b46995c&COE-Tab-ID=a5be22ec-e210-4778-b152-d95d009d049b&COE-Tab-ID=a5be22ec-e210-4778-b152-d95d009d049b
pub:
	docker exec my-redis redis-cli PUBLISH $(REDIS_KEY) "$(BASE_URL2)$(SUFFIX_URL)"
	docker exec my-redis redis-cli PUBLISH $(REDIS_KEY) "$(BASE_URL2)$(SUFFIX_URL)"
	docker exec my-redis redis-cli PUBLISH $(REDIS_KEY) "$(BASE_URL2)$(SUFFIX_URL)"
	docker exec my-redis redis-cli PUBLISH $(REDIS_KEY) "$(BASE_URL2)$(SUFFIX_URL)"
	docker exec my-redis redis-cli PUBLISH $(REDIS_KEY) "$(BASE_URL2)$(SUFFIX_URL)"
	docker exec my-redis redis-cli PUBLISH $(REDIS_KEY) "$(BASE_URL2)$(SUFFIX_URL)"

pm2-start:
	pm2 start cmd/index.js --name "goethe-bot"
pm2-stop:
	pm2 stop "goethe-bot"
pm2-restart:
	pm2 restart "goethe-bot"
pm2-log:
	pm2 logs "goethe-bot"
