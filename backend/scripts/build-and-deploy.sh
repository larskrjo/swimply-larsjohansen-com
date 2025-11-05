pushd /home/ec2-user/swimply-larsjohansen-com/backend
docker build -t api-swimply:latest .
docker compose -p api-swimply down
docker compose -p api-swimply up -d
docker image prune -a -f
popd