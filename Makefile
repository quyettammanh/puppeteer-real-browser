run:
	node cmd/index.js
pub:
	docker exec my-redis redis-cli PUBLISH url_updates  "https://www.goethe.de/coe/options;coesessionid=E33D836FB79DB013A19052FF8240D7B3?1=&64a4bb21e29e708eed03141ffa38edba=fc4f7617bccf85a0fa6d7fb6bf659d0e&COE-Customer=eed03127-df1d-4df9-b286-a18cf3614d34&COE-Tab-ID=135ae3e9-413b-4262-b6b4-9b606aae530d&COE-Tab-ID=135ae3e9-413b-4262-b6b4-9b606aae530d@register-goethe-redis/hcm_b2-link16@Reading-Listening-Writing-Speaking@11/03/2025"
	