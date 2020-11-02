# @plane2d Monorepository

Work in Progress of a full Box2D ecosystem for the web.
This includes [TypeScript](https://github.com/Microsoft/TypeScript) ports of:

-   [Box2D](https://github.com/erincatto/Box2D)
-   [LiquidFun](https://github.com/google/liquidfun)
-   [Box2D Lights](https://github.com/libgdx/box2dlights)

## Quick Start

Since this monorepo is not published on NPM yet, you can only run this locally.

Most important commands to execute from the root folder (you need [yarn](https://yarnpkg.com/) installed):

-   `yarn` -> install dependencies
-   `yarn workspaces run build` -> build all projects
-   `yarn start` -> Run testbed locally
-   `yarn run bench` -> Run the benchmark using node.js
-   `yarn run bench:web` -> Start a webserver for running the benchmarks using a browser,
-   `yarn run lint` -> Run linters, formatters, etc.
-   `yarn run lint:fix` -> Run linters, formatters, etc. and autofix if possible
