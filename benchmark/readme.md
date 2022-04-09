# Benchmarks

## Running time

```
Bol.com                  468 kB  114ms  4.11 MB/s
Bootstrap 5.0.0          195 kB   48ms  4.06 MB/s
CNN                     1.77 MB  380ms  4.65 MB/s
CSS-Tricks               195 kB   50ms   3.9 MB/s
Facebook.com             268 kB   71ms  3.78 MB/s
GitHub.com               514 kB   92ms  5.59 MB/s
Gazelle.nl               972 kB  296ms  3.28 MB/s
Lego.com                 246 kB   57ms  4.31 MB/s
Smashing Magazine.com    1.1 MB  288ms  3.83 MB/s
Trello.com               312 kB   75ms  4.15 MB/s
```

## Parsing vs. analyzing

`node benchmark/parse-analyze-ratio.js`

```
=====================================================================
File                    |    Size |  total | parse | Analyze        |
=====================================================================
Bol.com                 |  468 kB |  340ms | 206ms |  133ms (39.1%) |
Bootstrap 5.0.0         |  195 kB |  128ms |  91ms |   37ms (28.9%) |
CNN                     | 1.77 MB |  577ms | 375ms |  200ms (34.7%) |
CSS-Tricks              |  195 kB |  110ms |  72ms |   35ms (31.8%) |
Facebook.com            |  268 kB |  101ms |  42ms |   58ms (57.4%) |
GitHub.com              |  514 kB |  120ms |  52ms |   66ms (55.0%) |
Gazelle.nl              |  972 kB |  322ms | 208ms |  109ms (33.9%) |
Lego.com                |  246 kB |   65ms |  38ms |   26ms (40.0%) |
Smashing Magazine.com   |  1.1 MB |  311ms | 166ms |  144ms (46.3%) |
Trello.com              |  312 kB |   87ms |  48ms |   38ms (43.7%) |
```
