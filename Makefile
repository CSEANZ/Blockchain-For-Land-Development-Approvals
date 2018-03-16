<<<<<<< HEAD
build:
	docker build --tag crcsi/landchain-web .

push:
	docker push crcsi/landchain-web
=======
build:
	docker build --tag crcsi/landchain-web .

push:
	docker push crcsi/landchain-web

run-prod:
	docker run --rm -p 80:80 crcsi/landchain-web
>>>>>>> CSEANZ-master
