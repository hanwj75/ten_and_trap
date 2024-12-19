FROM node:20

WORKDIR /src

COPY package.json yarn.lock ./

RUN ["yarn","install"]
# Install dependencies with yarn
COPY ./src apiLoginServer.js


EXPOSE 3334

# Run the server
CMD ["node","src/apiLoginServer.js"]