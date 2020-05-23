FROM node:12

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4000
CMD [ "npm", "run", "start" ]