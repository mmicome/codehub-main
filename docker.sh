# 文件的根路径
BASE_PATH=/home/ubuntu/codehub/codehub-main
#docker 镜像/容器名字或者jar名字 这里都命名为这个
SERVER_NAME=codehub-main
SERVER_PORT=8087
#容器id
CID=$(docker ps | grep "$SERVER_NAME" | awk '{print $1}')
#镜像id
IID=$(docker images | grep "$SERVER_NAME" | awk '{print $3}')

 # 判断镜像是否存在
if [ -n "$IID" ]; then
    echo "存在$SERVER_NAME镜像，IID=$IID"
    docker restart $SERVER_NAME   # 重启运行中的容器
else
    echo "不存在$SERVER_NAME镜像，开始构建镜像"
    # 构建docker镜像
    cd $BASE_PATH
    docker build -t $SERVER_NAME .
    # 运行容器
    docker run --name $SERVER_NAME -v $BASE_PATH:$BASE_PATH -d -p $SERVER_PORT:$SERVER_PORT $SERVER_NAME
fi


