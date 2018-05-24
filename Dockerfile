FROM node:4.7.3-alpine

MAINTAINER Paul Walsh <paulywalsh@gmail.com>

ENV LANG=en_US.UTF-8 \
    APP_DIR=/srv/app

WORKDIR ${APP_DIR}

RUN apk add --no-cache --virtual build-dependencies \
    build-base \
    linux-headers \
    python-dev \
    python \
    openssl-dev \
    readline-dev \
    curl \
    gcc \
    git

RUN apk add --no-cache \
    bash \
    gettext \
    ca-certificates \
    openssl \
    libpq \
    postgresql-client \
    make

RUN update-ca-certificates

COPY . ${APP_DIR}

RUN make install

RUN apk del build-dependencies

EXPOSE 5000

CMD make server
