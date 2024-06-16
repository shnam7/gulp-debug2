import process from 'node:process'
import path from 'node:path'
import {type TransformCallback, Transform} from 'node:stream'
import tildify from 'tildify'
import stringify from 'stringify-object'
import chalk from 'chalk'
import {type Mutex} from '@wicle/mutex'
import type Vinyl from 'vinyl'

const blue = chalk.blue

export type LoggerFunction = (message?: any, ...optionalParameters: any[]) => void

export type DebugOptions = {
    logger?: LoggerFunction
    title?: string
    minimal?: boolean
    showFiles?: boolean
    showCount?: boolean
    verbose?: boolean
    mutex?: Mutex
}

export default function gulpDebug(title?: string, options?: DebugOptions): Transform

export default function gulpDebug(options?: DebugOptions): Transform

export default function gulpDebug(
    titleOrOptions: string | DebugOptions = {},
    otherOptions: DebugOptions = {},
): Transform {
    if (typeof titleOrOptions === 'string') {
        titleOrOptions = {title: titleOrOptions, ...otherOptions}
    }

    const options: DebugOptions = {
        logger: console.log,
        title: 'gulp-debug:',
        minimal: true,
        showFiles: true,
        showCount: true,
        ...titleOrOptions,
    }

    if (process.argv.includes('--verbose')) {
        options.verbose = true
        options.minimal = false
        options.showFiles = true
        options.showCount = true
    }

    let count = 0

    async function transform(file: Vinyl, enc: BufferEncoding, callback: TransformCallback) {
        if (count === 0) await options.mutex?.lock()

        if (options.showFiles) {
            const full =
                '\n' +
                ('cwd:   ' + blue(tildify(file.cwd))) + // Vinyl make cwd always n ot empty
                ('\nbase:  ' + blue(tildify(file.base))) + // base is also not empty
                (file.path ? '\npath:  ' + blue(tildify(file.path)) : '') +
                (file.stat && options.verbose
                    ? '\nstat:  ' +
                      blue(stringify(file.stat, {indent: '       '}).replaceAll(/[{}]/g, '').trim())
                    : '') +
                '\n'

            const output = options.minimal ? blue(path.relative(process.cwd(), file.path)) : full

            options.logger!(options.title + ' ' + output)
        }

        count++
        callback(null, file)
    }

    async function flush(callback: () => void) {
        if (options.showCount) {
            options.logger!(
                options.title + ' ' + chalk.green(count + ' item' + (count === 1 ? '' : 's')),
            )
        }

        options.mutex?.unlock()
        callback()
    }

    return new Transform({objectMode: true, highWaterMark: 16, transform, flush})
}
