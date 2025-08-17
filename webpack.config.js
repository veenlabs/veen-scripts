const path = require('path');

module.exports = {
  entry: './src/index.js', // adjust this to your entry point
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  mode: 'production', // or development
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader', // if you're using Babel
      },
    ],
  },
};
