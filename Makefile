run:
	node cmd/index.js
pub:
	docker exec my-redis redis-cli PUBLISH goethe-register-links  "https://www.goethe.de/coe/options;coesessionid=FD0CB53C3C1318E41DEF004659AEDFC2?1=&64a4bb21e29e708eed03141ffa38edba=80fec7c3f5b27763237115e99bebbba7&COE-Customer=73ce1d70-f280-4458-92e4-b9ee417f5cca&COE-Tab-ID=74a3748c-b7cc-4d30-a37b-fcda43767406&COE-Tab-ID=74a3748c-b7cc-4d30-a37b-fcda43767406@register-goethe-redis/hn_b1-link16@Reading-Listening-Writing-Speaking@11/03/2025"