import babel from 'rollup-plugin-babel';

export default {
	input: 'src/Dbslice.js',
	output: {
		file: 'build/dbslice.js',
		format: 'iife',
		name: 'dbslice',
		plugins: [
		  babel({exclude:'node_modules/**'})
		]
	}
};

