FROM node:22-alpine AS build
WORKDIR /app
ARG NPM_REGISTRY
COPY package.json package-lock.json .npmrc ./
RUN npm ci ${NPM_REGISTRY:+--registry=$NPM_REGISTRY}
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV TANDOOR_URL=https://oge-recipes.seiggy.com
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
