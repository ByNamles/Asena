FROM node:alpine

RUN apk add ncurses

WORKDIR /usr/app

COPY package.json .

RUN npm install && npm install tsc -g

COPY . /usr/app

RUN npm run build

ENTRYPOINT ["npm", "start"]
