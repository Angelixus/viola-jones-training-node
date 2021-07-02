FROM node:14.15.1

RUN apt-get update && apt-get install -y libopencv-dev

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
EXPOSE 8080

CMD [ "node", "app.js" ]