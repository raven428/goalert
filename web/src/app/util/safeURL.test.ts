import { safeURL } from './safeURL'

describe('safeURL', () => {
  interface RunValuesObj {
    true: string[]
    false: string[]
  }

  const checkIt = (desc: string, runValues: RunValuesObj): void => {
    describe(desc, () => {
      const run = (vals: string[], exp: boolean): void =>
        (vals || []).forEach((v) => {
          const parts = v.replace(/^\[/, '').replace(/\)$/, '').split('](')
          const label = parts[0]
          const url = parts[1]

          it(`${v} = ${exp}`, () => {
            expect(safeURL(url, label)).toEqual(exp)
          })
        })

      run(runValues.true, true)
      run(runValues.false, false)
    })
  }

  checkIt('should accept words', {
    true: [
      '[foo](http://example.com)',
      '[bar_thing](http://example.com)',
      '[foo bar](http://example.com)',
    ],
    false: [
      '[foo bar](example.com)', // protocol required
      '[foo bar](go/example)',
    ],
  })

  checkIt('should require domains and paths to match', {
    true: [
      '[example.com](http://example.com)',
      '[example.com](http://www.example.com)',
      '[example.com](http://example.com)',
      '[example.com](http://example.com/bin)',

      '[example.com/bin](http://example.com/bin)',
      '[example.com/bin](https://example.com/bin)',
    ],
    false: [
      '[example.com/bin](example.com/bin)', // http required

      '[example.com/bin](http://example.com)',
      '[example.com/bin](http://www.example.com)',
      '[example.com/bin](http://example.com)',
      '[foo.com](http://example.com)',
      '[foo.com](http://example.com/)',
      '[foo.com/bar](http://example.com/bar)',
      '[foo.com](https://example.com)',
      '[foo.com](https://example.com)',
      '[foo.com/bar](example.com/bar)',
      '[example.com/bin](http://example.com)',
      '[example.com/bin](example.com)',
    ],
  })
})
