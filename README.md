# lazycommit

Smart conventional commit messages from your staged diff. Free forever, AI-powered with `--ai`.

```
$ git add -p
$ lazycommit -c
feat(auth):   2 changes
[master 8a3f9c2] feat(auth):   2 changes
```

## Install

```sh
npm i -g lazycommit
```

## Usage

```sh
lazycommit           # print a conventional-commit message from staged diff
lazycommit -c        # print and `git commit -m` it
lazycommit --ai      # use hosted AI for higher quality (set LAZYCOMMIT_API_KEY)
lazycommit --dry     # preview only, do not commit
```

## Modes

- **Heuristic (free, offline)** — uses filename + diff keywords. Zero deps, runs anywhere.
- **AI (paid, hosted)** — calls `api.lazycommit.dev` for subject + body. Free 5/day, then $5/mo.
  Get a key: [lazycommit.dev/pricing](https://lazycommit.dev/pricing)

## Why

Writing commit messages is busywork. `lazycommit` makes a good first draft in <100ms.
If you care about the message, edit it before `-c`. If you don't, ship it.

## License

MIT