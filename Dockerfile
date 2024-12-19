FROM node:20

WORKDIR /src

COPY package.json yarn.lock ./

RUN ["yarn","install"]
# Install dependencies with yarn
COPY . .


EXPOSE 3333

# Run the server
CMD ["node","src/server.js"]