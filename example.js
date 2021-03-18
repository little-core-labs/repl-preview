const { clearScreenDown } = require('readline')
const { inspect } = require('util')
const { preview } = require('./')
const keypress = require('./keypress')
const jsonata = require('jsonata')
const crypto = require('crypto')
const faker = require('faker')
const path = require('path').posix
const repl = require('repl')

const filesystem = {}

// generate 128 file paths
for (let i = 0; i < 128; ++i) {
  const filename = faker.system.filePath()
  const basename = path.basename(filename)
  const paths = filename.split('/').slice(0, -1)
  let scope = filesystem
  while (paths.length) {
    const dirname = paths.shift()
    if (dirname && !scope[dirname]) {
      scope[dirname] = {}
    }

    if (scope[dirname]) {
      scope = scope[dirname]
    }
  }

  scope[basename] = crypto.randomBytes(32)
}

const history = Object.assign([], { index: 0 })
const server = repl.start({ eval: evaluate })
const buffer = []

server.context = filesystem

keypress(server.input, onkeypress)

function onkeypress(line, key) {
  if (!key || key.ctrl) {
    return
  }

  if ('backspace' === key.name) {
    if (0 === buffer.length) {
      return
    } else {
      buffer.pop()
    }
  }

  if ('return' === key.name) {
    buffer.splice(0, buffer.length).join('')
    history.push(key)
    clearScreenDown(server.output)
  } else if (key.sequence) {
    buffer.push(line)
  }

  if ('up' === key.name) {
    history.index = Math.max(0, history.index--)
    key = history[history.index] || key
  } else if ('down' === key.name) {
    history.index = Math.max(0, history.index++)
    key = history[history.index] || key
  }

  try {
    const input = buffer.join('')
    const query = normalizeQuery(input)
    const result = jsonata(query).evaluate(filesystem)
    const keys = paths(input, result)
    if (keys.length) {
      preview(server, keys, { truncate: 'return' !== key.name })
    }
  } catch (err) {
    if (!('position' in err)) {
      console.error(err)
    }
  }
}

function normalizeQuery(query) {
  query = query.trim()
  query = query.replace(/^\//, '$.')
  query = query.replace(/\b\/\b/g, '.')
  query = query.replace(/\/\*/g, '.*')
  query = query.replace(/\*\//g, '*.')
  query = query.replace(/^(\$\.)$/, '$')
  query = query.replace(/[\.|/]$/, '')
  return query
}

function paths(dirname, target) {
  let result = [dirname]

  if (Array.isArray(target)) {
    result.push(...target.map((t) => paths(dirname, t)))
  } else if (target && 'object' === typeof target && !Buffer.isBuffer(target)) {
    for (const key in target) {
      result.push(...paths('/' + dirname.split('/').filter(Boolean).concat(key).join('/'), target[key]))
    }
  }

  result = result.flatMap(flatMap)

  if (result.length > 1) {
    result.shift()
  }

  return Array.from(new Set(result)).filter(Boolean)

  function flatMap(i) {
    return Array.isArray(i) ? i.flatMap(flatMap) : i
  }
}

function evaluate(line, context, file, callback) {
  try {
    line = line.trim()
    const query = normalizeQuery(line)

    if (!query) {
      return callback(null)
    }

    const result = jsonata(query).evaluate(filesystem)
    const keys = paths(line, result)

    process.nextTick(callback, null, keys)
  } catch (err) {
    process.nextTick(callback, err.message || err)
  }
}
