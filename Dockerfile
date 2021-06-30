FROM node:14.17.1

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
# Install minimal prerequisites (Ubuntu 18.04 as reference)
RUN apt update && apt install -y cmake g++ wget unzip
# Download and unpack sources
RUN wget -O opencv.zip https://github.com/opencv/opencv/archive/master.zip
RUN unzip opencv.zip
# Create build directory
RUN mkdir -p build && cd build
# Configure
RUN cmake -DCMAKE_INSTALL_PREFIX=/home  ./opencv-master
# Build
RUN cmake --build .

USER node
RUN npm install
COPY --chown=node:node . .
EXPOSE 8080

CMD [ "node", "app.js" ]