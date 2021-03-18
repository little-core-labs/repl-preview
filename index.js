const { clearScreenDown, cursorTo, moveCursor } = require('readline')
const { inspect } = require('util')
const truncate = require('cli-truncate')

/**
 * Default error handler `onerror(err)` when one is not
 * given to the `preview()` function.
 * @private
 */
function defaultErrorHandler(err) {
  throw err
}

/**
 * Default pretty handler `pretty(result)` when one is not given
 * to the `preview()` function.
 * @private
 */
function defaultPrettyHandler(result, opts) {
  return inspect(result, {
    getters: true,
    colors: true,
    sorted: true,
    depth: 3,
    ...opts
  })
}

/**
 * Renders a preview of a mixed result value with the output truncated
 * to fit the viewport of the terminal.
 * @public
 * @param {REPLServer} server
 * @param {?Mixed} result
 * @param {Object} opts
 */
function preview(server, result, opts) {
  opts = { ...opts }

  const { onerror = defaultErrorHandler } = opts
  const { pretty = defaultPrettyHandler } = opts

  return process.nextTick(tick)

  function tick() {
    try {
      render()
    } catch (err) {
      onerror(err)
    }
  }

  function render() {
    const { cursorPosition, displayPosition } = getCursorPreviewPosition(server)
    const cols = displayPosition.cols - cursorPosition.cols
    const rows = displayPosition.rows - cursorPosition.rows
    let output = ''

    moveCursor(server.output, cols, rows)
    clearScreenDown(server.output)

    if (result) {
      output = pretty(result)

      if (output) {
        output = output
          // split the output because we'll only show a few lines
          .split('\n')
          // select as lines as there are rows available to use
          .slice(0, server.output.rows - rows - 1)

        if (false !== opts.truncate) {
          // truncate output with a little padding
          output = output.map((o) => truncate(o, server.output.columns - 8))
        }

        const lines = output.length

        output = output.join('\n')

        server.output.write(`\n${output}`)
        cursorTo(server.output, cursorPosition.cols)
        moveCursor(server.output, cols, -rows - lines)
      }
    } else {
      moveCursor(server.output, cols, rows)
      clearScreenDown(server.output)
    }
  }
}

// borrowed from: https://github.com/nodejs/node/blob/master/lib/internal/repl/utils.js
function getCursorPreviewPosition(server) {
  const displayPosition = server._getDisplayPos(`${server._prompt}${server.line}`)
  const cursorPosition = server.line.length !== server.cursor
    ? server.getCursorPos()
    : displayPosition
  return { displayPosition, cursorPosition }
}

/**
 * A module that provides a function for drawing previewed result output
 * in a REPL context.
 * @public
 * @module repl-preview
 * @example
 * const { preview } = require('repl-preview')
 * const keypress = require('repl-preview')
 * const repl = require('repl')
 * const vm = require('vm')
 *
 * const server = repl.start()
 * keypress(server.input, (line, key) => {
 *   try {
 *     const result = vm.runInContext(vm.createContent({ ...server.context }), line)
 *     preview(server, result)
 *   } catch (err) {
 *     // handle possible error
 *   }
 * })
 */
module.exports = {
  preview
}
