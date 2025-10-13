pushd /home/ec2-user/api.swimply.larsjohansen.com/pool-temperature/backend
docker compose down
docker compose up -d
docker image prune -a -f
popd
