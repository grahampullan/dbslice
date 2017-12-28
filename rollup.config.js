import babel from 'rollup-plugin-babel';
//import uglify from 'rollup-plugin-uglify';

export default {
	input: 'src/Dbslice.js',
	output: [ 
	//{
	//	file: 'build/dbslice.js',
	//	format: 'iife',
	//	name: 'dbslice'
	//},
	{	file: 'build/dbslice.js',
		format: 'iife',
		name: 'dbslice',
		plugins: [
		  babel({exclude:'node_modules/**'})
		  //,uglify()
		]
	}]
};
