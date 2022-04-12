# Benchmarks

## Running time

Bol.com                  468 kB  114ms  4.11 MB/s
Bootstrap 5.0.0          195 kB   47ms  4.14 MB/s
CNN                     1.77 MB  359ms  4.92 MB/s
CSS-Tricks               195 kB   50ms   3.9 MB/s
Facebook.com             268 kB   67ms  4.01 MB/s
GitHub.com               514 kB   90ms  5.71 MB/s
Gazelle.nl               972 kB  293ms  3.32 MB/s
Lego.com                 246 kB   53ms  4.64 MB/s
Smashing Magazine.com    1.1 MB  279ms  3.95 MB/s
Trello.com               312 kB   77ms  4.05 MB/s
```

## Parsing vs. analyzing

`node benchmark/parse-analyze-ratio.js`

```
=====================================================================
File                    |    Size |  total | parse | Analyze        |
=====================================================================
Bol.com                 |  468 kB |  322ms | 203ms |  119ms (37.0%) |
Bootstrap 5.0.0         |  195 kB |  131ms |  95ms |   35ms (26.7%) |
CNN                     | 1.77 MB |  588ms | 402ms |  184ms (31.3%) |
CSS-Tricks              |  195 kB |  110ms |  72ms |   36ms (32.7%) |
Facebook.com            |  268 kB |   99ms |  44ms |   55ms (55.6%) |
GitHub.com              |  514 kB |  122ms |  57ms |   64ms (52.5%) |
Gazelle.nl              |  972 kB |  319ms | 217ms |   98ms (30.7%) |
Lego.com                |  246 kB |   62ms |  38ms |   24ms (38.7%) |
Smashing Magazine.com   |  1.1 MB |  313ms | 164ms |  148ms (47.3%) |
Trello.com              |  312 kB |   82ms |  46ms |   35ms (42.7%) |
```
