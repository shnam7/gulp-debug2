# gulp-debug2

> Gulp plugin displaying [Vinyl](https://github.com/gulpjs/vinyl) files in gulp pipeline.

This is written in Typescript referencing the original version [gulp-debug](https://github.com/sindresorhus/gulp-debug).

For basic usage, refer to original documentation in [gulp-debug](https://github.com/sindresorhus/gulp-debug).

## Install

```sh
# npm
npm i gulp-debug2

# yarn
yarn add gulp-debug2

# pnpm
pnpm add gulp-debug2
```

## Added features

### Accept title as first argument

Now you can call with title as first argument.

```js
import gulp from 'gulp'
import debug from 'gulp-debug2'

// gulp-debug style
gulp.src('./src/*.js').pipe(debug({ title: 'jsFiles:' }))

// now the title can be the first argument as string
gulp.src('./src/*.js').pipe(debug('jsFiles:'))

// options still can be passed to debug as second argument.
// If the option has 'title' property, then it will override the title in the first argument.
gulp.src('./src/*.js').pipe(debug('jsFiles:', { logger: ... }))
```

### Synchronized output display

```js
gulp.src('./src/*.js').pipe(debug('step1:')).pipe(...).pipe(debug('step2:'))
```

Multiple debug() calls usally displays output in mixed way.
In the example above, output from 'step1' and 'step2' are mixed and not in order.

To have the output in ordered way, you can use [@wicle/mutex](https://github.com/shnam7/wicle-mutex).

```js
import gulp from 'gulp'
import debug from 'gulp-debug2'
import {Mutex} from '@wicle/mutex'

const mutex = new Mutex()
gulp.src('./src/*.js')
    .pipe(debug('step1:', {mutex}))
    .pipe(...)
    .pipe(debug('step2:', {mutex}))
```

Then, all the output from 'step2' will come after all the output form 'step1'.

## License
Copyright© 2024, Under MIT
