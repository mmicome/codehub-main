FROM node:latest

ENV PROJECT_ENV production
# ENV NODE_ENV production

WORKDIR /code

ADD . /code/

RUN npm config set registry https://registry.npm.taobao.org
RUN npm install -g pm2@latest
RUN npm i

# 暴露端口映射
EXPOSE 8087
EXPOSE 443

CMD [ "pm2-runtime", "start", "npm", "--", "run", "develop" ]