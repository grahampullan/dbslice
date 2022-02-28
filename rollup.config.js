import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

export default {
	input: 'src/Dbslice.js',
	output: {
		file: 'build/dbslice.js',
        name: 'dbslice',
		format: 'iife', 
		sourcemap: true
	},
	plugins: [
		resolve(), 
		commonjs(), 
		replace({preventAssignment: true, 'process.env.NODE_ENV': JSON.stringify( 'development' )
    })
	]

};


