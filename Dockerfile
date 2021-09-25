FROM node:14-alpine as builder

ENV PROJECT_ENV production
# ENV NODE_ENV production

WORKDIR /code

ADD package.json package-lock.json /code/
RUN npm ci

ADD . /code
RUN npm run build

# 选择更小体积的基础镜像
FROM nginx:alpine
COPY --from=builder /code/dist /usr/share/nginx/html