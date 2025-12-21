# learn-pub-sub-typescript-starter (Peril)

This is the starter code used in Boot.dev's [Learn Pub/Sub](https://www.boot.dev/courses/learn-pub-sub-rabbitmq-typescript) course.

npm run server
./src/scripts/rabbit.sh start
npm run rabbit:start
docker run -d --name peril_rabbitmq -p 5672:5672 -p 15672:15672 -p 61613:61613 rabbitmq-stomp
