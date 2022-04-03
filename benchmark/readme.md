# Benchmarks

## Analyzing

`node benchmark/benchmark.js`

```
Bol.com                 (468 kB):  10.07 ops/sec
Bootstrap 5.0.0         (195 kB):  23.98 ops/sec
CSS-Tricks              (195 kB):  23.00 ops/sec
Facebook.com            (268 kB):  15.66 ops/sec
GitHub.com              (514 kB):  11.47 ops/sec
Gazelle.nl              (972 kB):   3.38 ops/sec
Lego.com                (246 kB):  19.81 ops/sec
Smashing Magazine.com   (1.1 MB):   3.79 ops/sec
Trello.com              (312 kB):  13.15 ops/sec
```

## Parsing vs. analyzing

`node benchmark/parse-analyze-ratio.js`

```
=====================================================================
File                    |    Size |  total | parse | Analyze        |
=====================================================================
Bol.com                 |  468 kB |  330ms | 207ms |  122ms (37.0%) |
Bootstrap 5.0.0         |  195 kB |  122ms |  87ms |   34ms (27.9%) |
CSS-Tricks              |  195 kB |   98ms |  64ms |   34ms (34.7%) |
CNN                     | 1.77 MB |  563ms | 367ms |  193ms (34.3%) |
Facebook.com            |  268 kB |   96ms |  49ms |   47ms (49.0%) |
GitHub.com              |  514 kB |  161ms |  79ms |   80ms (49.7%) |
Gazelle.nl              |  972 kB |  343ms | 215ms |  124ms (36.2%) |
Lego.com                |  246 kB |   73ms |  37ms |   35ms (47.9%) |
Smashing Magazine.com   |  1.1 MB |  300ms | 162ms |  136ms (45.3%) |
Trello.com              |  312 kB |   84ms |  49ms |   34ms (40.5%) |
```
