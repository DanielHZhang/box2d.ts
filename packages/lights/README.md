# Box2DLights

[![screenshot](http://img.youtube.com/vi/lfT8ajGbzk0/0.jpg)](http://www.youtube.com/watch?v=lfT8ajGbzk0)

A [TypeScript](https://github.com/Microsoft/TypeScript) port of Kalle Hameleinen's Box2DLights.
`@plane2d/lights` is a 2D lighting framework that uses [@plane2d/core](https://github.com/lusito/box2d.ts) for raycasting and WebGL for rendering. This library can be used without [@plane2d/core](https://github.com/lusito/box2d.ts), so if your 2D physics library supports raycasting, you might be able to use this as well.

## Features

-   Arbitrary number of lights
-   Gaussian blurred light maps
-   Point light
-   Cone Light
-   Directional Light
-   Chain Light [New in 1.3]
-   Shadows
-   Dynamic/static/xray light
-   Culling
-   Colored ambient light
-   Gamma corrected colors
-   Handler class to do all the work
-   Query method for testing is point inside of light/shadow

This library offer easy way to add soft dynamic 2d lights to your physic based game.

## Usage

TODO (see the testbed for simple examples)
