run:
	node cmd/index.js
pub:
	docker exec my-redis redis-cli PUBLISH url_updates 'https://www.goethe.de/coe/options;coesessionid=11808B97AF9FCB4DAB9F0375B1FC343C?1=&64a4bb21e29e708eed03141ffa38edba=02baaba06fd4fc8067907449d20034fd&COE-Customer=6a45aaab-ba73-46d4-8d99-87c5f1e2197b&COE-Tab-ID=ca368239-a68e-40c6-8a78-ac2c66f01993&COE-Tab-ID=ca368239-a68e-40c6-8a78-ac2c66f01993@register-goethe-redis/hcm_b2-link2@Reading-Listening@14.07. - 25.07.2025'
	