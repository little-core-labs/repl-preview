/**
 * Creates a 'keypress' listener on for a given `stdin` stream.
 * @public
 * @param {Stream} stdin
 * @return {Object}
 */
function createKeyPressListener(stdin, onkeypress) {
  if ('function' === typeof stdin.setRawMode) {
    stdin.setRawMode(true)
  }

  stdin.on('keypress', onkeypress)

  return { close }

  function close() {
    stdin.removeListener('keypress', onkeypress)
    if ('function' === typeof stdin.setRawMode) {
      stdin.setRawMode(false)
    }
  }
}

/**
 * A module to provide a key press listener factory.
 * @public
 * @module keypress
 * @example
 * const keypress = require('repl-preview/keypress')
 * keypress(process.stdin, (line, key) => {
 *   // handle key press event
 * })
 */
module.exports = createKeyPressListener
