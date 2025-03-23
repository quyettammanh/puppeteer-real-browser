run:
	node cmd/index.js
pub:
	docker exec my-redis redis-cli PUBLISH url_updates  "https://www.goethe.de/coe/options;coesessionid=FAF56AB6F5A9040C69C69E561B00AE98?1=&64a4bb21e29e708eed03141ffa38edba=e698f069587f0e0af2eccf624a0f3dbf&COE-Customer=77226a46-bd5a-4543-9f4d-1d8f1cc7d3ce&COE-Tab-ID=068ad177-be5a-4716-926e-e1ad4a195051&COE-Tab-ID=068ad177-be5a-4716-926e-e1ad4a195051@register-goethe-redis/hn_b1-link16@Reading-Listening-Writing-Speaking@11/03/2025"
	