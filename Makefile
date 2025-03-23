run:
	node cmd/index.js

pub:
	docker exec puppeteer-redis redis-cli PUBLISH ${REDIS_REGISTER_CHANNEL:-url_updates} "https://www.goethe.de/coe/options;coesessionid=FAF56AB6F5A9040C69C69E561B00AE98?1=&64a4bb21e29e708eed03141ffa38edba=e698f069587f0e0af2eccf624a0f3dbf&COE-Customer=77226a46-bd5a-4543-9f4d-1d8f1cc7d3ce&COE-Tab-ID=068ad177-be5a-4716-926e-e1ad4a195051&COE-Tab-ID=068ad177-be5a-4716-926e-e1ad4a195051@register-goethe-redis/hn_b1-link16@Reading-Listening-Writing-Speaking@11/03/2025"

# Docker commands
docker-up:
	docker-compose up -d

docker-logs:
	docker-compose logs -f app

docker-redis-logs:
	docker-compose logs -f redis

docker-stop:
	docker-compose stop

docker-down:
	docker-compose down

docker-down-volumes:
	docker-compose down -v

docker-rebuild:
	docker-compose up -d --build
	
redis-cli:
	docker exec -it puppeteer-redis redis-cli

docker-ps:
	docker ps

docker-stats:
	docker stats

docker-inspect-app:
	docker inspect puppeteer-app

docker-inspect-redis:
	docker inspect puppeteer-redis

docker-prune:
	docker system prune -f
	