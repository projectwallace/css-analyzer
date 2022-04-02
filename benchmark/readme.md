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
Bol.com                 | 468 kB |  328ms | 207ms |  120ms (36.6%) |
Bootstrap 5.0.0         | 195 kB |  120ms |  80ms |   39ms (32.5%) |
CSS-Tricks              | 195 kB |   96ms |  64ms |   32ms (33.3%) |
Facebook.com            | 268 kB |  134ms |  78ms |   56ms (41.8%) |
GitHub.com              | 514 kB |  172ms |  91ms |   79ms (45.9%) |
Gazelle.nl              | 972 kB |  363ms | 225ms |  134ms (36.9%) |
Lego.com                | 246 kB |   77ms |  40ms |   36ms (46.8%) |
Smashing Magazine.com   | 1.1 MB |  350ms | 210ms |  139ms (39.7%) |
Trello.com              | 312 kB |   92ms |  52ms |   40ms (43.5%) |
```
