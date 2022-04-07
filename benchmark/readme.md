# Benchmarks

## Running time

```
Bol.com                 ( 468 kB)  120ms
Bootstrap 5.0.0         ( 195 kB)   50ms
CNN                     (1.77 MB)  377ms
CSS-Tricks              ( 195 kB)   54ms
Facebook.com            ( 268 kB)   75ms
GitHub.com              ( 514 kB)   93ms
Gazelle.nl              ( 972 kB)  307ms
Lego.com                ( 246 kB)   56ms
Smashing Magazine.com   ( 1.1 MB)  298ms
Trello.com              ( 312 kB)   82ms
```

## Parsing vs. analyzing

`node benchmark/parse-analyze-ratio.js`

```
=====================================================================
File                    |    Size |  total | parse | Analyze        |
=====================================================================
Bol.com                 |  468 kB |  338ms | 206ms |  131ms (38.8%) |
Bootstrap 5.0.0         |  195 kB |  134ms |  90ms |   37ms (27.6%) |
CNN                     | 1.77 MB |  595ms | 393ms |  200ms (33.6%) |
CSS-Tricks              |  195 kB |  107ms |  72ms |   35ms (32.7%) |
Facebook.com            |  268 kB |   97ms |  44ms |   53ms (54.6%) |
GitHub.com              |  514 kB |  127ms |  53ms |   72ms (56.7%) |
Gazelle.nl              |  972 kB |  332ms | 212ms |  116ms (34.9%) |
Lego.com                |  246 kB |   66ms |  38ms |   28ms (42.4%) |
Smashing Magazine.com   |  1.1 MB |  311ms | 166ms |  143ms (46.0%) |
Trello.com              |  312 kB |   82ms |  45ms |   37ms (45.1%) |
```
