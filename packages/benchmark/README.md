# @plane2d/benchmark

A benchmark to compare various js/ts Box2D implementations.

Based on [bench2d](https://github.com/joelgwebber/bench2d) by joelgwebber

## Example output using node.js v12.16.3

| Name           | avg ms/frame | 5th %ile | 95th %ile | Ratio |
| -------------- | ------------ | -------- | --------- | ----- |
| box2d.js       | 2.75         | 2        | 4         | 1.00  |
| box2d-web      | 4.68         | 4        | 6         | 1.71  |
| @plane2d/core  | 9.23         | 10       | 9         | 3.36  |
| box2d-html5    | 11.59        | 10       | 13        | 4.22  |
| @flyover/box2d | 18.33        | 16       | 21        | 6.68  |
| planck.js      | 23.39        | 19       | 28        | 8.52  |

## Example output using Firefox 81

| Name           | avg ms/frame | 5th %ile | 95th %ile | Ratio |
| -------------- | ------------ | -------- | --------- | ----- |
| box2d-web      | 13.70        | 10       | 8         | 1.00  |
| @plane2d/core  | 15.10        | 16       | 12        | 1.10  |
| box2d-html5    | 19.12        | 16       | 40        | 1.40  |
| box2d.js       | 23.08        | 37       | 20        | 1.69  |
| @flyover/box2d | 25.89        | 38       | 23        | 1.89  |
| planck.js      | 111.90       | 64       | 40        | 8.17  |

## Example output using Chrome 86

| Name           | avg ms/frame | 5th %ile | 95th %ile | Ratio |
| -------------- | ------------ | -------- | --------- | ----- |
| box2d.js       | 5.47         | 6        | 6         | 1.00  |
| box2d-web      | 6.96         | 6        | 6         | 1.27  |
| @plane2d/core  | 10.05        | 10       | 7         | 1.84  |
| box2d-html5    | 11.05        | 11       | 10        | 2.02  |
| @flyover/box2d | 17.83        | 20       | 17        | 3.26  |
| planck.js      | 23.17        | 25       | 18        | 4.23  |
