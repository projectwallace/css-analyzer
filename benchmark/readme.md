# Benchmarks

## Analyzing

`node benchmark/benchmark.js`

```
Bol.com                 (468 kB):   9.19 ops/sec
Bootstrap 5.0.0         (195 kB):  21.28 ops/sec
CSS-Tricks              (195 kB):  20.07 ops/sec
Facebook.com            (268 kB):  13.70 ops/sec
GitHub.com              (514 kB):  10.29 ops/sec
Gazelle.nl              (972 kB):   3.14 ops/sec
Lego.com                (246 kB):  17.43 ops/sec
Smashing Magazine.com   (1.1 MB):   3.29 ops/sec
Trello.com              (312 kB):  12.23 ops/sec
```

## Parsing vs. analyzing

`node benchmark/parse-analyze-ratio.js`

```
====================================================================
File                    | Size   |  total | parse | Analyze        |
====================================================================
Bol.com                 | 468 kB |  330ms | 201ms |  128ms (38.8%) |
Bootstrap 5.0.0         | 195 kB |  130ms |  88ms |   41ms (31.5%) |
CSS-Tricks              | 195 kB |  102ms |  62ms |   40ms (39.2%) |
Facebook.com            | 268 kB |  144ms |  69ms |   75ms (52.1%) |
GitHub.com              | 514 kB |  195ms |  90ms |  104ms (53.3%) |
Gazelle.nl              | 972 kB |  442ms | 209ms |  229ms (51.8%) |
Lego.com                | 246 kB |   89ms |  42ms |   46ms (51.7%) |
Smashing Magazine.com   | 1.1 MB |  356ms | 166ms |  189ms (53.1%) |
Trello.com              | 312 kB |  136ms |  50ms |   86ms (63.2%) |
```
