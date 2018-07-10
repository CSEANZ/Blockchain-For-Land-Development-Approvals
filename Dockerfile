FROM node:8.10.0 as builder

LABEL maintainer="aleith@crcsi.com.au"

ENV APPDIR=/code
WORKDIR $APPDIR

# Do the package install
ADD truffle /truffle

# Set up the files to build with
ADD webportal $APPDIR
WORKDIR $APPDIR/webportal

# Install dependencies
RUN yarn

# Build
RUN yarn build

FROM nginx:1.13.9 as nginx

COPY --from=builder /code/build /tmp/build
RUN rm -rf /usr/share/nginx/html && mv /tmp/build /usr/share/nginx/html
