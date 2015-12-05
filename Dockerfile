FROM node:4.2

RUN apt-get install -y git curl python
RUN apt-get install -y make automake gcc g++ cpp openssl libc6-dev autoconf pkg-config
RUN mkdir -p /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

CMD [ "npm", "start" ]
