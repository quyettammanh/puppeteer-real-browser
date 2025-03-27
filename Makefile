run:
	node cmd/index.js
pub:
	docker exec my-redis redis-cli PUBLISH url_updates 'https://www.goethe.de/coe/options;coesessionid=FEA5C390D425E06B285CAE16379D9869?1=&64a4bb21e29e708eed03141ffa38edba=911966567341e36e78d75bcac9cf6326&COE-Customer=6a6a229f-7897-40d8-b216-dea32f115939&COE-Tab-ID=4ffc08c4-e43c-4fb4-809c-aeb693ad23f8&COE-Tab-ID=4ffc08c4-e43c-4fb4-809c-aeb693ad23f8@register-goethe-redis/hcm_b2-link2@Reading-Listening@14.07. - 25.07.2025'
	
pm2-start:
	pm2 start cmd/index.js --name "goethe-bot"
pm2-stop:
	pm2 stop "goethe-bot"
pm2-restart:
	pm2 restart "goethe-bot"
pm2-log:
	pm2 logs "goethe-bot"
