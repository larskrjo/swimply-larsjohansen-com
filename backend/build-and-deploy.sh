pushd /home/ec2-user/swimply-larsjohansen-com/backend
docker build -t api-swimply:latest .
docker compose down
docker compose up -d
docker image prune -a -f
popd