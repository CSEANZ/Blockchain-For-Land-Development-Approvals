FROM node:7.9.0
MAINTAINER rdeen@crcsi.com.au

# Install node requirements with yarn, it's better
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN  apt-get update && apt-get install -y yarn

# Create app directory
RUN mkdir -p /usr/app/src
RUN mkdir -p /usr/app/dist
WORKDIR /usr/app/src

RUN yarn global add truffle

# copy and Install npm
COPY . /usr/app/src

WORKDIR /usr/app/src/truffle

RUN truffle.cmd migrate
RUN truffle.cmd serve

