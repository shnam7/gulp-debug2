import {Buffer} from 'node:buffer'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import {Writable} from 'streamx'
import Vinyl from 'vinyl'
import stripAnsi from 'strip-ansi'
import {pEvent} from 'p-event'
import {Mutex} from '@wicle/mutex'
import {beforeEach, test, expect, vi} from 'vitest'
import debug from '../src/index.js'

const __pathname = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__pathname)

const file = new Vinyl({
    cwd: __dirname,
    base: __dirname,
    path: path.join(__dirname, 'foo.js'),
    stat: fs.statSync(__pathname),
    contents: Buffer.from('Lorem ipsum dolor sit amet, consectetuer adipiscing elit.'),
})

let messages: string[] = []

function logger(message: string) {
    messages.push(stripAnsi(message))
}

beforeEach(() => {
    messages = []
})

test('output debug info', async () => {
    const stream = debug({
        logger,
        title: 'unicorn:',
    })
    const finish = pEvent(stream, 'finish')
    stream.end(file)
    await finish

    expect(messages[0]).toBe('unicorn: test/foo.js')
})

test('output singular item count', async () => {
    const stream = debug({
        logger,
        title: 'unicorn:',
    })
    const finish = pEvent(stream, 'finish')
    stream.end(file)
    await finish

    expect(messages.at(-1)).toBe('unicorn: 1 item')
})

test('output zero item count', async () => {
    const stream = debug({
        logger,
        title: 'unicorn:',
    })
    const finish = pEvent(stream, 'finish')
    stream.end()
    await finish

    expect(messages.at(-1)).toBe('unicorn: 0 items')
})

test('output plural item count', async () => {
    const stream = debug({
        logger,
        title: 'unicorn:',
    })
    const finish = pEvent(stream, 'finish')

    stream.write(file)
    stream.end(file)
    await finish

    expect(messages.at(-1)).toBe('unicorn: 2 items')
})

test('do not output file names when `showFiles` is false', async () => {
    const stream = debug({
        logger,
        title: 'unicorn:',
        showFiles: false,
    })
    const finish = pEvent(stream, 'finish')

    stream.end(file)
    await finish
    expect(messages.length).toBe(1)
    expect(messages[0]).toBe('unicorn: 1 item')
})

test('using the default logger', async () => {
    let lastMessage = ''
    const consoleMock = vi.spyOn(console, 'log').mockImplementation((m: string) => {
        lastMessage = stripAnsi(m)
    })

    const stream = debug()
    const finish = pEvent(stream, 'finish')
    stream.end(file)
    await finish

    expect(lastMessage).toBe('gulp-debug: 1 item')
    consoleMock.mockReset()
})

test('do not output count when `showCount` is false', async () => {
    const stream = debug({
        logger,
        title: 'unicorn:',
        showCount: false,
    })
    const finish = pEvent(stream, 'finish')

    stream.write(file)
    stream.end(file)
    await finish

    expect(messages.at(-1)).not.toBe('unicorn: 1 item')
})

test('mutex sync output', async () => {
    const mutex = new Mutex()

    // stream #1
    const stream1 = debug({
        logger,
        title: 'unicorn1:',
        mutex,
    })
    const stream2 = debug({
        logger,
        title: 'unicorn2:',
        mutex,
    })

    const finish1 = pEvent(stream1, 'finish')
    const finish2 = pEvent(stream2, 'finish')
    stream1.end(file)
    stream2.end(file)
    await finish1
    await finish2

    // Output should come in order (unicon1, unicon2, ...)
    expect(messages[0]).toBe('unicorn1: test/foo.js')
    expect(messages[1]).toBe('unicorn1: 1 item')
    expect(messages[2]).toBe('unicorn2: test/foo.js')
    expect(messages[3]).toBe('unicorn2: 1 item')
})

test('accept string in place of options', async () => {
    const stream = debug('unicorn-1:', {logger})
    const finish = pEvent(stream, 'finish')
    stream.end(file)
    await finish

    expect(messages[0], 'unicorn: test/foo.js')
})

test('output with verbose option enabled', async () => {
    process.argv.push('--verbose')
    const stream = debug('unicorn-1:', {logger})
    const finish = pEvent(stream, 'finish')
    stream.end(file)
    await finish

    expect(messages[0].includes('stat: ')).toBeTruthy()
})

test('output null file with verbose message', async () => {
    process.argv.push('--verbose')
    const stream = debug('unicorn:', {logger})
    const finish = pEvent(stream, 'finish')
    stream.end(new Vinyl({}))
    await finish

    expect(messages[0].includes('path: ')).toBeFalsy()
})
