FROM nginx:1.13.6
# Start from nginx, because when we're production, we run nginx

LABEL maintainer="aleith@crcsi.com.au"

# Install the latest node
RUN apt-get update && apt-get install -y curl gnupg2 git
RUN curl -sL https://deb.nodesource.com/setup_8.x -o /tmp/nodesource_setup.sh
RUN bash /tmp/nodesource_setup.sh

RUN apt-get update && apt-get install -y nodejs build-essential

ENV APPDIR=/code
WORKDIR $APPDIR

# Install node requirements with yarn, it's better
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN  apt-get update && apt-get install -y yarn

# Do the package install
ADD truffle /truffle

# Set up the files to build with
ADD webportal $APPDIR
WORKDIR $APPDIR/webportal

# Install dependencies
RUN yarn

# Build
RUN yarn build

RUN rm -rf /usr/share/nginx/html && mv $APPDIR/build /usr/share/nginx/html
RUN rm -rf $APPDIR/*
RUN rm -rf /truffle

# In the case of dev, we repopulate the $APPDIR directory 
# and run from there with live sources