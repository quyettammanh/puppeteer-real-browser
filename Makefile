run:
	node cmd/index.js

REDIS_KEY := url_updates
SUFFIX_URL := @register-goethe-redis/hcm_b2-link2@Reading-Listening@14.07. - 25.07.2025

BASE_URL := https://www.goethe.de/coe/options;coesessionid=854B4CE0F0477E0DC5EB1736C7FCADDF?1=&64a4bb21e29e708eed03141ffa38edba=02baaba06fd4fc8067907449d20034fd&COE-Customer=ec18fed6-3f9d-4c5f-886c-38ad7de8b1ed&COE-Tab-ID=49389ccd-14c9-4627-9db1-dfe54b2b2cbc&COE-Tab-ID=49389ccd-14c9-4627-9db1-dfe54b2b2cbc
BASE_URL2 := https://www.goethe.de/coe/options;coesessionid=66A712A2D1E734E69B6C5888176421B7?1=&64a4bb21e29e708eed03141ffa38edba=02baaba06fd4fc8067907449d20034fd&COE-Customer=9a3a8edd-84c1-4864-8b2c-3d822db063c9&COE-Tab-ID=75776d42-619c-45e1-9487-5a45193aa8c0&COE-Tab-ID=75776d42-619c-45e1-9487-5a45193aa8c0
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
