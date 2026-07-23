FROM oven/bun:alpine AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
COPY apps/server/package.json /temp/dev/apps/server/
COPY apps/web/package.json /temp/dev/apps/web/
COPY packages/db/package.json /temp/dev/packages/db/
COPY packages/shared/package.json /temp/dev/packages/shared/
COPY packages/ui/package.json /temp/dev/packages/ui/
COPY packages/eslint-config/package.json /temp/dev/packages/eslint-config/
COPY packages/typescript-config/package.json /temp/dev/packages/typescript-config/

RUN cd /temp/dev && bun install --frozen-lockfile

FROM base AS prerelease
COPY --from=install /temp/dev/ .
COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
RUN cd apps/web && bun run build

FROM base AS release
ENV NODE_ENV=production
COPY --from=prerelease /usr/src/app/node_modules node_modules
COPY --from=prerelease /usr/src/app/apps/web apps/web
COPY --from=prerelease /usr/src/app/packages/ui packages/ui
COPY --from=prerelease /usr/src/app/package.json package.json

WORKDIR /usr/src/app/apps/web
EXPOSE 3000
USER bun
ENTRYPOINT [ "bun", "run", "start" ]
