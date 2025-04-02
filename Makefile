run:
	node cmd/index.js

REDIS_KEY := url_updates
SUFFIX_URL := @register-goethe-redis/hcm_b2-link2@Reading-Listening@14.07. - 25.07.2025

BASE_URL1 := https://www.goethe.de/coe/options;coesessionid=29A083F7C26AA7EA8F53EAFA2449863E?1=&64a4bb21e29e708eed03141ffa38edba=aba8127d574d5bc2ae361be71239363e&COE-Customer=c2a2f02c-6fc2-4a6a-875a-60b07a9693fc&COE-Tab-ID=dfc1d837-7190-4e22-bc0b-6039ae28ff55&COE-Tab-ID=dfc1d837-7190-4e22-bc0b-6039ae28ff55
BASE_URL2 := https://www.goethe.de/coe/options;coesessionid=6AE5B4C41F771718A3EDCFC4A84E665F?1=&64a4bb21e29e708eed03141ffa38edba=314ce822e3a9f79e0c55c7de9eb63771&COE-Customer=f2a275d8-ad2a-47c0-aae7-dfa5db6b4c43&COE-Tab-ID=1f96b344-2f9b-45ec-955a-5122202fa07d&COE-Tab-ID=1f96b344-2f9b-45ec-955a-5122202fa07d

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
