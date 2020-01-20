import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  input: [
    './test/buffer-test.js',
    './test/audio-recorder-test.js',
    './test/processor-test.js'
  ],
  output: {
    dir: 'test/cjs',
    entryFileNames: '[name].js',
    format: 'cjs'
  },
  external: ['tape'],
  plugins: [nodeResolve(), commonjs()],
  preserveModules: true
}
