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
====================================================================
File                    | Size   |  total | parse | Analyze        |
====================================================================
Bol.com                 | 468 kB |  328ms | 205ms |  122ms (37.2%) |
Bootstrap 5.0.0         | 195 kB |  142ms | 102ms |   40ms (28.2%) |
CSS-Tricks              | 195 kB |  113ms |  60ms |   53ms (46.9%) |
Facebook.com            | 268 kB |  132ms |  69ms |   62ms (47.0%) |
GitHub.com              | 514 kB |  203ms | 114ms |   87ms (42.9%) |
Gazelle.nl              | 972 kB |  366ms | 228ms |  134ms (36.6%) |
Lego.com                | 246 kB |   86ms |  38ms |   48ms (55.8%) |
Smashing Magazine.com   | 1.1 MB |  428ms | 219ms |  208ms (48.6%) |
Trello.com              | 312 kB |  131ms |  72ms |   59ms (45.0%) |
```
