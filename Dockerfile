FROM node:7-alpine

MAINTAINER Paul Walsh <paulywalsh@gmail.com>

ENV LANG=en_US.UTF-8 \
    APP_DIR=/srv/app

COPY . ${APP_DIR}

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
    g++ \
    git \
    udev \
    libgcrypt-dev \
 && apk add --no-cache \
    bash \
    gettext \
    ca-certificates \
    openssl \
    libpq \
    postgresql-client \
    make \
 && update-ca-certificates \
 && make install \
 && apk del build-dependencies

EXPOSE 5000

CMD make server

