run:
	node cmd/index.js
pub:
	docker exec my-redis redis-cli PUBLISH url_updates 'https://www.goethe.de/coe/options;coesessionid=7AF2CD4F9F1D787AC73FD24204BF6667?1=&64a4bb21e29e708eed03141ffa38edba=02baaba06fd4fc8067907449d20034fd&COE-Customer=5d52d479-8fa3-4148-bd25-14fbe79a25af&COE-Tab-ID=1e37f5c9-08f2-43c9-802f-bdc9ba7b6634&COE-Tab-ID=1e37f5c9-08f2-43c9-802f-bdc9ba7b6634@register-goethe-redis/hcm_b2-link1@Reading-Listening@23.06. - 24.06.2025'
	