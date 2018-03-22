import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

const babelConfig = {
	'presets' : [ 'env' ]
}

export default {
	plugins: [
		  babel(babelrc({
		  	config: babelConfig,
		  	exclude:'node_modules/**'
		  }))
		],
	input: 'src/Dbslice.js',
	output: {
		file: 'build/dbslice.js',
		format: 'iife',
		name: 'dbslice'
	}
};

