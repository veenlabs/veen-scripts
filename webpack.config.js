const path = require('path');

module.exports = {
  entry: {
    main: './src/index.js',
    admin: './src/admin.js',
    dashboard: './src/dashboard.js'
  },
  output: {
    filename: '[name].bundle.js', // [name] will be replaced by entry point key (e.g. main, admin)
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  mode: 'production', // or development
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
};
