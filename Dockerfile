FROM node:14.17.1

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
EXPOSE 8080

RUN apt-get update && apt-get install -y cmake g++ wget unzip
RUN wget -O opencv.zip https://github.com/opencv/opencv/archive/master.zip
RUN unzip opencv.zip
RUN mkdir -p build && cd build
RUN cmake -DCMAKE_INSTALL_PREFIX=/home  ../opencv-master
RUN cmake --build .

CMD [ "node", "app.js" ]