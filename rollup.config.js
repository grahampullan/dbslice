import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
    input: 'src/Dbslice.js',
    output: {
        file: 'build/dbslice.js',
        name: 'dbslice',
        format: 'iife'
    },
   
    plugins: [ 
        commonjs({
            include: 'node_modules/**',
            extensions: [
                '.js'
            ]
        }),

        nodeResolve({
            jsnext: true,
            main: true,
            browser: true,
            extensions: [
                '.js',
                '.json'
            ]
        }),

        babel({
			babelrc: false,
            "presets": ["@babel/preset-env"]
        }),
    ]

};



