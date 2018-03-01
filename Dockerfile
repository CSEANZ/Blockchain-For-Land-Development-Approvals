FROM crcsi/qa4-nodejs:qa4l-web

MAINTAINER rdeen@crcsi.com.au

# copy and Install npm
COPY ./src /usr/app/src

# Change EOL, Not needed if lint is not run
# RUN find . -type f -print0 | xargs -0 dos2unix
RUN apt-get --purge remove -y dos2unix && rm -rf /var/lib/apt/lists/*

# Link global modules
RUN npm link

# Install bower, run gulp - Bower components need to be copied from crcsi/qa4-nodejs:qa4l-web install location
# RUN bower install

# Gulp Skip Lint
RUN gulp pre-clean compress compress-css clean build_node copy_libs copy_config

# Change current directory to dist
WORKDIR /usr/app/dist

# Link global modules
RUN npm link

# remove source
RUN rm -rf /usr/app/src

# create outs dir for print to pdf
RUN mkdir -p /usr/app/dist/outs

# Start App
EXPOSE 3000
CMD [ "npm", "start" ]

