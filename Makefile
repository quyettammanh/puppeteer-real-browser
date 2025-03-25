run:
	node cmd/index.js
pub:
	docker exec my-redis redis-cli PUBLISH url_updates 'https://www.goethe.de/coe/options;coesessionid=57219B098FCA2549220934C37CB4A5CE?1=&64a4bb21e29e708eed03141ffa38edba=ba4b736a90d98c1e0ac15eca384f6c2b&COE-Customer=15d06974-c282-433d-9e28-25055db229e0&COE-Tab-ID=904e383f-1aa7-4664-9efd-95ad9a97d89b&COE-Tab-ID=904e383f-1aa7-4664-9efd-95ad9a97d89b@register-goethe-redis/hcm_b2-link2@Reading-Listening@14.07. - 25.07.2025'
	