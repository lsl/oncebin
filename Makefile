.PHONY: dev css css-build deploy test test-local migrate-local migrate-prod

dev:
	npx wrangler dev

css:
	npx @tailwindcss/cli -i src/styles/input.css -o public/style.css --watch

css-build:
	npx @tailwindcss/cli -i src/styles/input.css -o public/style.css --minify

deploy: test-local css-build
	npx wrangler d1 migrations apply oncebin-db --remote
	npx wrangler deploy

test:
	bin/test remote

test-local:
	bin/test local

migrate-local:
	npx wrangler d1 migrations apply oncebin-db --local

migrate-prod:
	npx wrangler d1 migrations apply oncebin-db --remote
