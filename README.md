repl-preview
============

> Preview output results in a REPL context.

## Installation

```sh
$ npm install repl-preview
```

## Usage

```js
const { preview } = require('repl-preview')
const keypress = require('repl-preview/keypress') // optional
const repl = require('repl')

const server = repl.start()
keypress(server, (line, key) => {
  // run generic JavaScript in VM
  // or preview custom programming language here
  try {
    const result = vm.runInContext(vm.createContent({ ...server.context }), line)
    preview(server, result)
  } catch (err) {
    // handle possible error
  }
})
```

## API

### `preview(server, result[, opts])`

Renders a preview of a mixed result value with the output truncated
to fit the viewport of the terminal.

```js
const { preview } = require('repl-preview')
const { inspect } = require('util')

preview(server, result, {
  // truncates output by default
  truncate: true,

  // default result value pretty handler
  pretty(value) {
    return inspect(value, {
      getters: true,
      colors: true,
      sorted: true,
      depth: 3,
      ...opts
    })
  },

  // default result error handler, called upon render failure
  onerror(err) {
    throw err
  }
})
```

### `keypress(stdin, onkeypress)`

Creates a 'keypress' listener on for a given `stdin` stream.

```js
const keypress = require('repl-preview/keypress')

// preview eval'd input from context swalling errors
keypress(server.input, (line, key) => {
  try {
    const context = vm.createContent({ ...server.context })
    const result = vm.runInContext(context, line)
    preview(server, result)
  } catch (err) {
    // handle possible error
  }
})
```

## Example

In the [included example](example.js), a fake filesystem is contrived and JSONata is
used as a query syntax to query the filesystem paths. The query syntax
is preprocessed to allow `/` in place of `.` so file path queries feel
like normal path traversal like:

```js
> /var/log
[
  '/var/log/reboot_ai.mxu',
  '/var/log/research_forward.rcprofile',
  '/var/log/circuit.ipfix',
  '/var/log/security_maroon.mime',
  '/var/log/matrix_infrastructure_payment.mbk'
]
```

## License

MIT
