run:
	node cmd/index.js
pub:
	docker exec my-redis redis-cli PUBLISH url_updates 'https://www.goethe.de/coe/options;coesessionid=CD27B006D6CD1F1050774D0F3AAA6C4C?1=&64a4bb21e29e708eed03141ffa38edba=911966567341e36e78d75bcac9cf6326&COE-Customer=1f7a392d-2a5b-4384-a08a-2a2105a98260&COE-Tab-ID=ab087a56-1798-4ec0-8692-bd229ff63a74&COE-Tab-ID=ab087a56-1798-4ec0-8692-bd229ff63a74@register-goethe-redis/hcm_b2-link1@Reading-Listening@23.06. - 24.06.2025'
	