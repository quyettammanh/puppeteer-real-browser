run:
	node cmd/index.js
pub:
	docker exec my-redis redis-cli PUBLISH url_updates  "https://www.goethe.de/coe/options;coesessionid=BD0E7D2A93CE1783695995F87606FE81?1=&64a4bb21e29e708eed03141ffa38edba=114f0e18cc22a5e56c406b6276437586&COE-Customer=7e76e5a1-ca09-4216-bc26-1b8a945bd46b&COE-Tab-ID=be0e210a-4f88-4440-84f8-e6d92a1a27dd&COE-Tab-ID=be0e210a-4f88-4440-84f8-e6d92a1a27dd@register-goethe-redis/hcm_b2-link16@Reading-Listening-Writing-Speaking@11/03/2025"
	